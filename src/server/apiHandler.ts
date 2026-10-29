import express, { type Request, type Response } from 'express';
import { analyzePythonSubmission } from './geminiService.ts';
import { executePythonCode } from './pythonRunner.ts';
import {
  registerUser,
  loginUser,
  loginGuest,
  loginGoogleUser,
  verifySession,
  revokeSession,
  updateUserProfile,
  getOrCreateOwnerSession,
  getNonOwnerLogins,
  clearNonOwnerLogins,
  OWNER_EMAIL
} from './authService.ts';

export const apiRouter = express.Router();

apiRouter.use(express.json({ limit: '2mb' }));

// Helper to extract bearer token
function getBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return (req.query.token as string) || '';
}

// Viewer Auth: Get Current Profile
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.json({ user: null });
  }
  const user = verifySession(token);
  return res.json({ user });
});

// Viewer Auth: Register new account
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, avatar, skillLevel } = req.body;
    const session = registerUser({ email, password, name, avatar, skillLevel });
    return res.status(201).json(session);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Viewer Auth: Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const session = loginUser({ email, password });
    return res.json(session);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

// Viewer Auth: Guest instant sign-in
apiRouter.post('/auth/guest', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const session = loginGuest(name);
    return res.json(session);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Guest session failed' });
  }
});

// Viewer Auth: Google sign-in with user's own email
apiRouter.post('/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter your own valid Google email address' });
    }
    const targetEmail = email.trim().toLowerCase();
    const session = loginGoogleUser({ email: targetEmail, name, avatar });
    return res.json(session);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Google sign-in failed' });
  }
});

// Viewer Auth: Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (token) {
    revokeSession(token);
  }
  return res.json({ success: true });
});

// Viewer Auth: Update Profile
apiRouter.patch('/auth/profile', (req: Request, res: Response) => {
  const token = getBearerToken(req);
  const user = verifySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const updated = updateUserProfile(user.id, req.body);
    return res.json({ user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Update failed' });
  }
});

// Owner Secret Rule: Never ask for authentication from the owner
apiRouter.get('/auth/owner-session', (_req: Request, res: Response) => {
  const session = getOrCreateOwnerSession();
  return res.json(session);
});

// Owner Secret Rule: Always show who logged in to the app apart from the owner
apiRouter.get('/owner/viewer-logins', (_req: Request, res: Response) => {
  const logins = getNonOwnerLogins();
  return res.json({
    ownerEmail: OWNER_EMAIL,
    logins,
    totalCount: logins.length
  });
});

apiRouter.delete('/owner/viewer-logins', (_req: Request, res: Response) => {
  const success = clearNonOwnerLogins();
  return res.json({ success });
});

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Run raw Python test endpoint
apiRouter.post('/run-python', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Code must be a string' });
    }
    const result = await executePythonCode(code);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to execute Python' });
  }
});

// Get available engines and status
apiRouter.get('/engines', (_req: Request, res: Response) => {
  res.json({
    engines: [
      { id: 'gemini', name: 'Gemini 3.8 Flash', ready: true, envKeySet: Boolean(process.env.GEMINI_API_KEY) },
      { id: 'copilot', name: 'Microsoft Copilot', ready: true, envKeySet: Boolean(process.env.GEMINI_API_KEY || process.env.COPILOT_API_KEY) },
      { id: 'turbo_race', name: 'Turbo Race (Fastest)', ready: true, envKeySet: Boolean(process.env.GEMINI_API_KEY) },
      { id: 'blackbox', name: 'Blackbox AI', ready: true, envKeySet: Boolean(process.env.BLACKBOX_API_KEY) },
      { id: 'deepseek', name: 'DeepSeek AI', ready: true, envKeySet: Boolean(process.env.DEEPSEEK_API_KEY) },
      { id: 'chatgpt', name: 'ChatGPT (GPT-4o)', ready: true, envKeySet: Boolean(process.env.OPENAI_API_KEY) },
      { id: 'perplexity', name: 'Perplexity AI', ready: true, envKeySet: Boolean(process.env.PERPLEXITY_API_KEY) },
    ]
  });
});

// Main analyze endpoint
apiRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { code, question, preferredMode, engine, customApiKey, customApiKeys, attachedDocs, preferredSearchEngine } = req.body;

    if (!code && !question && (!attachedDocs || attachedDocs.length === 0)) {
      return res.status(400).json({
        error: 'Please provide either Python code, a conceptual question, or a document attachment.'
      });
    }

    const result = await analyzePythonSubmission({
      code,
      question,
      preferredMode,
      engine,
      customApiKey,
      customApiKeys,
      attachedDocs,
      preferredSearchEngine
    });

    return res.json(result);
  } catch (error: any) {
    console.error('API /analyze error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal server error while analyzing with AI engine'
    });
  }
});

