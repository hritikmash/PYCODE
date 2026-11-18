import express, { type Request, type Response, type NextFunction } from 'express';
import { analyzePythonSubmission } from './geminiService.ts';
import { executePythonCode } from './pythonRunner.ts';
import {
  registerUser,
  loginUser,
  loginGuest,
  loginGoogleUser,
  loginOwnerDirect,
  verifySession,
  revokeSession,
  revokeSessionById,
  revokeAllUserSessions,
  recordHeartbeat,
  disconnectSession,
  updateUserProfile,
  updateUserRole,
  appointAdministrator,
  revokeAdministrator,
  readAppConfig,
  updateAppConfig,
  type AppConfig,
  deleteUserAccount,
  getAdminOverview,
  getAdminSessions,
  getAllUsers,
  getOwnerUniqueDevices,
  getUserGroupedDevices,
  getUserDetailHistory,
  revokeDeviceSessions,
  removeDevice,
  enableTwoFactor,
  disableTwoFactor,
  setupUserAuthenticator,
  verifyTwoFactorChallenge,
  verifyAndCompleteAuthenticatorSignup,
  getSystemStats,
  clearSystemCache,
  submitFeedback,
  readFeedback,
  parseUserAgent,
  type ClientInfo,
  type UserProfile,
  OWNER_EMAIL
} from './authService.ts';
import {
  broadcastAdminUpdate,
  broadcastSessionRevocation,
  broadcastUserLogout
} from './websocketHandler.ts';

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
  const deviceId = (req.headers['x-device-id'] as string) || req.body?.deviceId || undefined;

  return {
    deviceId: typeof deviceId === 'string' ? deviceId.trim().slice(0, 64) : undefined,
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

// Register New Account (Supports optional Google Authenticator TOTP setup)
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, avatar, skillLevel, setupGoogleAuthenticator } = req.body;
    const clientInfo = getClientInfo(req);
    const result = await registerUser({
      email,
      password,
      name,
      avatar,
      skillLevel,
      clientInfo,
      setupGoogleAuthenticator: Boolean(setupGoogleAuthenticator)
    });
    return res.status(201).json(result);
  } catch (err: any) {
    const status = err.message === 'INVALID EMAIL!' ? 400 : 400;
    return res.status(status).json({ error: err.message || 'Registration failed' });
  }
});

// Complete Sign Up with Google Authenticator verification
apiRouter.post('/auth/signup/verify-authenticator', (req: Request, res: Response) => {
  try {
    const { tempSignupToken, code } = req.body;
    if (!tempSignupToken || !code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }
    const clientInfo = getClientInfo(req);
    const result = verifyAndCompleteAuthenticatorSignup({ tempSignupToken, code, clientInfo });
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Verification failed' });
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
    const status = err.message === 'INVALID EMAIL!' ? 400 : 401;
    return res.status(status).json({ error: err.message || 'Invalid email or password' });
  }
});

// Google Authentication (Supports both owner and regular users across all devices)
apiRouter.post('/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, avatar } = req.body;
    const clientInfo = getClientInfo(req);
    const result = loginGoogleUser({ email, name, avatar, clientInfo });
    return res.json(result);
  } catch (err: any) {
    const status = err.message === 'INVALID EMAIL!' ? 400 : 500;
    return res.status(status).json({ error: err.message || 'Google sign-in failed' });
  }
});

apiRouter.all('/auth/google', (_req: Request, res: Response) => {
  return res.status(405).json({ error: 'Method not allowed. Use POST /api/auth/google' });
});

// Two-Step Verification: Challenge verification
apiRouter.post('/auth/2fa/verify', (req: Request, res: Response) => {
  try {
    const { tempToken, code, email } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }
    const result = verifyTwoFactorChallenge({ tempToken, code, email });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Verification failed' });
  }
});

// Two-Step Verification: Toggle enable/disable
apiRouter.post('/auth/2fa/toggle', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserProfile;
    const { enable } = req.body;
    if (enable) {
      const { backupCodes } = enableTwoFactor(user.id);
      return res.json({ success: true, twoFactorEnabled: true, backupCodes });
    } else {
      disableTwoFactor(user.id);
      return res.json({ success: true, twoFactorEnabled: false });
    }
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update 2FA' });
  }
});

// Two-Step Verification: Setup Google Authenticator for existing user
apiRouter.post('/auth/2fa/setup-authenticator', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserProfile;
    const setup = await setupUserAuthenticator(user.id);
    return res.json({ success: true, twoFactorEnabled: true, ...setup });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to setup Google Authenticator' });
  }
});

// Two-Step Verification: Status query
apiRouter.get('/auth/2fa/status', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  return res.json({ twoFactorEnabled: Boolean(user.twoFactorEnabled) });
});

// Instant Owner Login (Multi-device enabled, zero authentication barrier)
apiRouter.post('/auth/owner-instant', (req: Request, res: Response) => {
  try {
    const clientInfo = getClientInfo(req);
    const result = loginOwnerDirect(clientInfo);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Owner session failed' });
  }
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
  broadcastUserLogout(user.id);
  broadcastAdminUpdate('session:all_revoked', { userId: user.id });
  return res.json({ success: true });
});

// Update Profile
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

// Overview Dashboard metrics
apiRouter.get('/admin/overview', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const overview = getAdminOverview(user);
    return res.json(overview);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch overview' });
  }
});

// Live Multi-Device Sessions
apiRouter.get('/admin/sessions', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const sessions = getAdminSessions(user);
    return res.json({ sessions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch sessions' });
  }
});

// User Directory
apiRouter.get('/admin/users', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const users = getAllUsers(user);
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

// Role Assignment (Only owner/admin can call)
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

// ---------------------------------------------------------------------------
// App Configuration & Updates (Owner & Administrators have edit permissions)
// ---------------------------------------------------------------------------

// Read App Configuration (Public/Authenticated)
apiRouter.get('/app/config', (_req: Request, res: Response) => {
  try {
    const config = readAppConfig();
    return res.json({ config });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to read app configuration' });
  }
});

// Update App Configuration (Owner and Administrators only)
apiRouter.patch('/app/config', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const updated = updateAppConfig(req.body, user);
    broadcastAdminUpdate('app:config_updated', { config: updated });
    return res.json({ success: true, config: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update app configuration' });
  }
});

// Owner Exclusive: Appoint User as Administrator (Owner is always root)
apiRouter.post('/owner/administrators', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  if (user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden: Only the Owner can appoint administrators' });
  }

  const { email, userId } = req.body;
  if (!email && !userId) {
    return res.status(400).json({ error: 'User ID or valid email is required to appoint an administrator' });
  }

  try {
    const appointedUser = appointAdministrator({ email, userId }, user);
    broadcastAdminUpdate('admin:appointed', { user: appointedUser });
    return res.status(201).json({ success: true, user: appointedUser });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to appoint administrator' });
  }
});

// Owner Exclusive: Revoke Administrator Privileges
apiRouter.delete('/owner/administrators/:userId', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  if (user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden: Only the Owner can revoke administrator privileges' });
  }

  const { userId } = req.params;
  try {
    const demotedUser = revokeAdministrator(userId, user);
    broadcastAdminUpdate('admin:revoked', { userId, user: demotedUser });
    return res.json({ success: true, user: demotedUser });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to revoke administrator' });
  }
});

// Delete user account (Owner only)
apiRouter.delete('/admin/users/:userId', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { userId } = req.params;
  try {
    deleteUserAccount(userId, user);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete user' });
  }
});

// Revoke Session by ID
apiRouter.delete('/admin/sessions/:sessionId', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { sessionId } = req.params;
  try {
    const success = revokeSessionById(sessionId, user);
    if (success) {
      broadcastSessionRevocation(sessionId);
      broadcastAdminUpdate('session:revoked', { sessionId });
    }
    return res.json({ success });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to revoke session' });
  }
});

// ---------------------------------------------------------------------------
// Owner Console: Unique Devices & Session History (Rule 6 - No Duplicates)
// ---------------------------------------------------------------------------

apiRouter.get('/owner/devices', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const currentDeviceId = (req.headers['x-device-id'] as string) || (req.query.deviceId as string);
  try {
    const devices = getOwnerUniqueDevices(user, currentDeviceId);
    return res.json({ devices, totalCount: devices.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch devices' });
  }
});

// Grouped Connected Devices by User (Deduplicated, organized per user)
apiRouter.get('/owner/user-devices', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const currentDeviceId = (req.headers['x-device-id'] as string) || (req.query.deviceId as string);
  try {
    const userDevices = getUserGroupedDevices(user, currentDeviceId);
    return res.json({ userDevices, totalCount: userDevices.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch user devices' });
  }
});

// Complete Login History and Device Details for specific User
apiRouter.get('/owner/user-history/:targetId', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { targetId } = req.params;
  try {
    const history = getUserDetailHistory(targetId, user);
    return res.json(history);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Failed to fetch user login history' });
  }
});

apiRouter.delete('/owner/devices/:deviceId', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { deviceId } = req.params;
  const userId = (req.query.userId as string) || (req.body?.userId as string);
  const deviceKey = (req.query.deviceKey as string) || (req.body?.deviceKey as string);
  try {
    removeDevice(deviceId, user, userId, deviceKey);
    broadcastAdminUpdate('device:revoked', { deviceId, userId, deviceKey });
    return res.json({ success: true, message: 'Device successfully removed' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to revoke device' });
  }
});

apiRouter.delete('/owner/users/:userId/devices/:deviceId', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { userId, deviceId } = req.params;
  const deviceKey = (req.query.deviceKey as string) || (req.body?.deviceKey as string);
  try {
    removeDevice(deviceId, user, userId, deviceKey);
    broadcastAdminUpdate('device:revoked', { deviceId, userId, deviceKey });
    return res.json({ success: true, message: 'Device successfully removed' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to revoke device' });
  }
});

// Revoke all sessions for a specific user
apiRouter.delete('/owner/users/:userId/sessions', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { userId } = req.params;
  try {
    revokeAllUserSessions(userId);
    broadcastAdminUpdate('user:sessions_revoked', { userId });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to revoke user sessions' });
  }
});

// Backwards-compatible owner viewer logins endpoint (Protected)
apiRouter.get('/owner/viewer-logins', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const sessions = getAdminSessions(user);
  const nonOwnerSessions = sessions.filter(s => (s.userEmail || '').toLowerCase() !== OWNER_EMAIL);
  return res.json({
    ownerEmail: OWNER_EMAIL,
    logins: nonOwnerSessions,
    totalCount: nonOwnerSessions.length
  });
});

// System Stats (Owner only)
apiRouter.get('/admin/system/stats', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const stats = getSystemStats(user);
    return res.json(stats);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
});

// Clear System Cache (Owner only)
apiRouter.post('/admin/system/clear-cache', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  try {
    const result = clearSystemCache(user);
    return res.json(result);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
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

    broadcastAdminUpdate('feedback:new', { feedback });

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
    return res.status(500).json({ error: error?.message || 'Analysis failed' });
  }
});
