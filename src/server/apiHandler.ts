import express, { type Request, type Response, type NextFunction } from 'express';
import { analyzePythonSubmission } from './geminiService.ts';
import { executePythonCode } from './pythonRunner.ts';
import {
  registerUser,
  loginUser,
  loginGuest,
  loginGoogleUser,
  verifySession,
  revokeSession,
  revokeSessionById,
  revokeAllUserSessions,
  recordHeartbeat,
  disconnectSession,
  updateUserProfile,
  updateUserRole,
  getAdminOverview,
  getAdminSessions,
  getAllUsers,
  submitFeedback,
  readFeedback,
  parseUserAgent,
  type ClientInfo,
  type UserProfile,
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

// Extract client metadata for multi-device session tracking (Zero IP collection)
function getClientInfo(req: Request): ClientInfo {
  const ua = req.headers['user-agent'] || '';
  const parsed = parseUserAgent(ua);
  const entryRoute = (req.headers['x-entry-route'] as string) || req.body?.entryRoute || req.path || '/';

  return {
    deviceType: parsed.deviceType,
    browser: parsed.browser,
    os: parsed.os,
    entryRoute: typeof entryRoute === 'string' ? entryRoute.slice(0, 100) : '/'
  };
}

// Middleware: Require Authenticated User
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }
  const user = verifySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Middleware: Require Administrator or Owner Role (Backend Enforcement)
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }
  const user = verifySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
  if (user.role !== 'owner' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

// ---------------------------------------------------------------------------
// Authentication Endpoints
// ---------------------------------------------------------------------------

// Get Current User Profile (Restores session across refreshes without prompt)
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.json({ user: null });
  }
  const user = verifySession(token);
  return res.json({ user });
});

// Register New Account
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, avatar, skillLevel } = req.body;
    const clientInfo = getClientInfo(req);
    const result = registerUser({ email, password, name, avatar, skillLevel, clientInfo });
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// User Sign-in
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientInfo = getClientInfo(req);
    const result = loginUser({ email, password, clientInfo });
    return res.json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Invalid email or password' });
  }
});

// Google Authentication (User's own account)
apiRouter.post('/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter your own valid Google email address' });
    }
    const cleanEmail = email.trim().toLowerCase();
    // SPEC RULE: Users cannot sign in with the owner email via public Google sign-in
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      return res.status(403).json({
        error: 'This email is reserved for the platform owner. Please sign in with your own Google email address.'
      });
    }

    const clientInfo = getClientInfo(req);
    const result = loginGoogleUser({ email: cleanEmail, name, avatar, clientInfo });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Google sign-in failed' });
  }
});

apiRouter.all('/auth/google', (_req: Request, res: Response) => {
  return res.status(405).json({ error: 'Method not allowed. Use POST /api/auth/google' });
});

// Guest Instant Sign-in
apiRouter.post('/auth/guest', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const clientInfo = getClientInfo(req);
    const result = loginGuest({ name, clientInfo });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Guest session failed' });
  }
});

// Multi-Device Heartbeat (Keeps session status online)
apiRouter.post('/auth/heartbeat', (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (token) {
    recordHeartbeat(token);
  }
  return res.json({ success: true });
});

// Disconnect / Page Unload
apiRouter.post('/auth/disconnect', (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (token) {
    disconnectSession(token);
  }
  return res.json({ success: true });
});

// Logout current device
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (token) {
    revokeSession(token);
  }
  return res.json({ success: true });
});

// Logout all devices
apiRouter.post('/auth/logout-all', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  revokeAllUserSessions(user.id);
  return res.json({ success: true });
});

// Update Profile (Strictly sanitized: users CANNOT modify roles or emails here!)
apiRouter.patch('/auth/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const { name, avatar, skillLevel } = req.body;
    const updated = updateUserProfile(user.id, { name, avatar, skillLevel }, user);
    return res.json({ user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Update failed' });
  }
});

// ---------------------------------------------------------------------------
// Protected Live Admin Monitoring & Role-Based Access Endpoints
// ---------------------------------------------------------------------------

// Live Session Overview Metrics
apiRouter.get('/admin/overview', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const overview = getAdminOverview(user);
    return res.json(overview);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch admin overview' });
  }
});

// Live Multi-Device Sessions
apiRouter.get('/admin/sessions', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const sessions = getAdminSessions(user);
    return res.json({
      sessions,
      totalCount: sessions.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch sessions' });
  }
});

// User Management (List users)
apiRouter.get('/admin/users', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const users = getAllUsers(user);
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

// Role Assignment (Only owner/admin can call, ordinary users rejected with 403)
apiRouter.patch('/admin/users/:userId/role', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'member', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  try {
    const updated = updateUserRole(userId, role, user);
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update role' });
  }
});

// Revoke Session by ID
apiRouter.delete('/admin/sessions/:sessionId', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { sessionId } = req.params;
  try {
    const success = revokeSessionById(sessionId, user);
    return res.json({ success });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to revoke session' });
  }
});

// Backwards-compatible owner viewer logins endpoint (Protected)
apiRouter.get('/owner/viewer-logins', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const sessions = getAdminSessions(user);
  const nonOwnerSessions = sessions.filter(s => s.userEmail.toLowerCase() !== OWNER_EMAIL);
  return res.json({
    ownerEmail: OWNER_EMAIL,
    logins: nonOwnerSessions,
    totalCount: nonOwnerSessions.length
  });
});

// ---------------------------------------------------------------------------
// Feedback Endpoints (Performance & Upgrade suggestions)
// ---------------------------------------------------------------------------

// Submit Feedback
apiRouter.post('/feedback', (req: Request, res: Response) => {
  try {
    const {
      performanceRating,
      speedCategory,
      accuracyRating,
      upgradeFields,
      addSuggestions,
      comments,
      userName,
      userEmail
    } = req.body;

    const token = getBearerToken(req);
    const user = token ? verifySession(token) : null;

    const feedback = submitFeedback({
      userId: user?.id,
      userName: userName || user?.name,
      userEmail: userEmail || user?.email,
      performanceRating,
      speedCategory,
      accuracyRating,
      upgradeFields,
      addSuggestions,
      comments
    });

    return res.status(201).json({ success: true, feedback });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to submit feedback' });
  }
});

// Read Feedback (Admin view)
apiRouter.get('/admin/feedback', requireAdmin, (_req: Request, res: Response) => {
  try {
    const feedbacks = readFeedback();
    return res.json({ feedbacks, totalCount: feedbacks.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to read feedback' });
  }
});

// ---------------------------------------------------------------------------
// System & AI Execution Endpoints
// ---------------------------------------------------------------------------

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

// Analyze code submission
apiRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { code, question, mode, engine, attachedDocs, chatHistory } = req.body;
    if (!code && !question) {
      return res.status(400).json({ error: 'Code or question is required' });
    }
    const result = await analyzePythonSubmission({
      code: code || '',
      question: question || '',
      preferredMode: mode || 'both',
      engine: engine || 'gemini',
      attachedDocs,
      chatHistory
    } as any);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to analyze code' });
  }
});
