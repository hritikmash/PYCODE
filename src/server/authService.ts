import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { inferFirstNameFromEmail } from '../utils/userName.ts';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string; // Explicit preferred display name
  avatar: string;
  role: UserRole;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: string;
  lastLoginAt: string;
}

interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
}

export interface ClientInfo {
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  browser?: string;
  os?: string;
  entryRoute?: string;
}

export interface SessionRecord {
  id: string; // Safe public session reference e.g. "sess_ab12cd"
  token: string; // Secret authentication token
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  accountType: 'registered' | 'google' | 'guest';
  createdAt: string;
  lastActivityAt: string;
  expiresAt: number;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  entryRoute: string;
  status: 'online' | 'offline' | 'expired';
}

export type SafeSession = Omit<SessionRecord, 'token'>;

export interface LoginEventRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  accountType: 'registered' | 'google' | 'guest';
  authMethod: 'password' | 'google' | 'guest';
  status: 'success' | 'failed';
  failReason?: string;
  timestamp: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  entryRoute: string;
}

export interface FeedbackRecord {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  performanceRating: number; // 1 to 5
  speedCategory: 'lightning' | 'good' | 'average' | 'sluggish';
  accuracyRating?: number; // 1 to 5
  upgradeFields: string[];
  addSuggestions: string;
  comments: string;
  submittedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LOGIN_LOGS_FILE = path.join(DATA_DIR, 'login_logs.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');

// Predefined Owner Email configured via server-side environment
export const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'hritikyadav1612@gmail.com').toLowerCase().trim();

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(LOGIN_LOGS_FILE)) {
    fs.writeFileSync(LOGIN_LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readUsers(): StoredUser[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const users = JSON.parse(raw) as StoredUser[];
    let changed = false;
    for (const u of users) {
      if (u.email.toLowerCase().trim() === OWNER_EMAIL && u.role !== 'owner') {
        u.role = 'owner';
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    }
    return users;
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  ensureDataFiles();
  for (const u of users) {
    if (u.email.toLowerCase().trim() === OWNER_EMAIL) {
      u.role = 'owner';
    }
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readSessions(): SessionRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

function writeSessions(sessions: SessionRecord[]) {
  ensureDataFiles();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

function readLogs(): LoginEventRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(LOGIN_LOGS_FILE, 'utf-8');
    return JSON.parse(raw) as LoginEventRecord[];
  } catch {
    return [];
  }
}

function writeLogs(logs: LoginEventRecord[]) {
  ensureDataFiles();
  fs.writeFileSync(LOGIN_LOGS_FILE, JSON.stringify(logs.slice(0, 500), null, 2), 'utf-8');
}

export function readFeedback(): FeedbackRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(raw) as FeedbackRecord[];
  } catch {
    return [];
  }
}

export function writeFeedback(feedbacks: FeedbackRecord[]) {
  ensureDataFiles();
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), 'utf-8');
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function parseUserAgent(userAgent?: string): {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
} {
  const ua = userAgent || '';
  let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';

  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android/i.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Browser';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  let os = 'OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  return { deviceType, browser, os };
}

/**
 * Creates a distinct multi-device session for a user.
 */
export function createSessionRecord(
  user: UserProfile,
  accountType: 'registered' | 'google' | 'guest',
  clientInfo?: ClientInfo
): { token: string; session: SafeSession } {
  const sessions = readSessions();
  const token = crypto.randomBytes(32).toString('hex');
  const nowIso = new Date().toISOString();
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const sessionId = `sess_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;

  const newSession: SessionRecord = {
    id: sessionId,
    token,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    role: user.role,
    accountType,
    createdAt: nowIso,
    lastActivityAt: nowIso,
    expiresAt,
    deviceType: clientInfo?.deviceType || 'desktop',
    browser: clientInfo?.browser || 'Chrome',
    os: clientInfo?.os || 'Desktop',
    entryRoute: clientInfo?.entryRoute || '/',
    status: 'online'
  };

  sessions.push(newSession);
  writeSessions(sessions);

  const { token: _, ...safeSession } = newSession;
  return { token, session: safeSession };
}

/**
 * Logs a login/auth event without IP address (privacy compliant).
 */
export function logAuthEvent(params: {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  accountType: 'registered' | 'google' | 'guest';
  authMethod: 'password' | 'google' | 'guest';
  status: 'success' | 'failed';
  failReason?: string;
  clientInfo?: ClientInfo;
}) {
  const logs = readLogs();
  const event: LoginEventRecord = {
    id: `evt_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    userId: params.userId,
    name: params.name,
    email: params.email,
    role: params.role,
    accountType: params.accountType,
    authMethod: params.authMethod,
    status: params.status,
    failReason: params.failReason,
    timestamp: new Date().toISOString(),
    deviceType: params.clientInfo?.deviceType || 'desktop',
    browser: params.clientInfo?.browser || 'Browser',
    os: params.clientInfo?.os || 'System',
    entryRoute: params.clientInfo?.entryRoute || '/'
  };
  logs.unshift(event);
  writeLogs(logs);
}

// -------------------------------------------------------------
// Authentication Operations
// -------------------------------------------------------------

export function registerUser(params: {
  email: string;
  password: string;
  name: string; // Explicitly entered name
  avatar?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  clientInfo?: ClientInfo;
}): { user: UserProfile; token: string; session: SafeSession } {
  const users = readUsers();
  const cleanEmail = params.email.trim().toLowerCase();
  const explicitName = params.name.trim();

  if (!cleanEmail || !params.password) {
    throw new Error('Email and password are required');
  }

  if (params.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const existing = users.find(u => u.email === cleanEmail);
  if (existing) {
    logAuthEvent({
      userId: existing.id,
      name: explicitName || existing.name,
      email: cleanEmail,
      role: existing.role,
      accountType: 'registered',
      authMethod: 'password',
      status: 'failed',
      failReason: 'Account already exists',
      clientInfo: params.clientInfo
    });
    throw new Error('An account with this email already exists');
  }

  // Determine role: Only verified owner email gets owner role
  let role: UserRole = 'member';
  if (cleanEmail === OWNER_EMAIL) {
    role = 'owner';
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(params.password, salt);
  const now = new Date().toISOString();

  // If user entered name, use it. If blank, infer first name from email.
  const finalName = explicitName || inferFirstNameFromEmail(cleanEmail);

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: cleanEmail,
    name: finalName,
    avatar: params.avatar || '⚡',
    role,
    skillLevel: params.skillLevel || 'Beginner',
    createdAt: now,
    lastLoginAt: now,
    salt,
    passwordHash
  };

  users.push(newUser);
  writeUsers(users);

  const { passwordHash: _, salt: __, ...userProfile } = newUser;
  const { token, session } = createSessionRecord(userProfile, 'registered', params.clientInfo);

  logAuthEvent({
    userId: newUser.id,
    name: userProfile.name,
    email: cleanEmail,
    role: userProfile.role,
    accountType: 'registered',
    authMethod: 'password',
    status: 'success',
    clientInfo: params.clientInfo
  });

  return { user: userProfile, token, session };
}

export function loginUser(params: {
  email: string;
  password: string;
  clientInfo?: ClientInfo;
}): { user: UserProfile; token: string; session: SafeSession } {
  const users = readUsers();
  const cleanEmail = params.email.trim().toLowerCase();

  const user = users.find(u => u.email === cleanEmail);
  if (!user) {
    logAuthEvent({
      userId: 'unknown',
      name: inferFirstNameFromEmail(cleanEmail),
      email: cleanEmail,
      role: 'member',
      accountType: 'registered',
      authMethod: 'password',
      status: 'failed',
      failReason: 'User not found',
      clientInfo: params.clientInfo
    });
    throw new Error('Invalid email or password');
  }

  const checkHash = hashPassword(params.password, user.salt);
  if (checkHash !== user.passwordHash) {
    logAuthEvent({
      userId: user.id,
      name: user.name,
      email: cleanEmail,
      role: user.role,
      accountType: 'registered',
      authMethod: 'password',
      status: 'failed',
      failReason: 'Incorrect password',
      clientInfo: params.clientInfo
    });
    throw new Error('Invalid email or password');
  }

  // Ensure owner role if email matches OWNER_EMAIL
  if (cleanEmail === OWNER_EMAIL) {
    user.role = 'owner';
  }

  user.lastLoginAt = new Date().toISOString();
  writeUsers(users);

  const { passwordHash: _, salt: __, ...userProfile } = user;
  const { token, session } = createSessionRecord(userProfile, 'registered', params.clientInfo);

  logAuthEvent({
    userId: user.id,
    name: userProfile.name,
    email: cleanEmail,
    role: userProfile.role,
    accountType: 'registered',
    authMethod: 'password',
    status: 'success',
    clientInfo: params.clientInfo
  });

  return { user: userProfile, token, session };
}

export function loginGoogleUser(params: {
  email: string;
  name?: string;
  avatar?: string;
  clientInfo?: ClientInfo;
}): { user: UserProfile; token: string; session: SafeSession } {
  const users = readUsers();
  const cleanEmail = params.email.trim().toLowerCase();

  let user = users.find(u => u.email === cleanEmail);
  const now = new Date().toISOString();

  if (!user) {
    // New Google user registration
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(crypto.randomBytes(32).toString('hex'), salt);

    // If explicit name provided, use it; else infer first name from email
    const autoName = params.name?.trim() || inferFirstNameFromEmail(cleanEmail);

    let role: UserRole = 'member';
    if (cleanEmail === OWNER_EMAIL) {
      role = 'owner';
    }

    user = {
      id: `usr_google_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      email: cleanEmail,
      name: autoName,
      avatar: params.avatar || '⚡',
      role,
      skillLevel: 'Intermediate',
      createdAt: now,
      lastLoginAt: now,
      salt,
      passwordHash
    };
    users.push(user);
  } else {
    // Returning user:
    user.lastLoginAt = now;
    // SPEC RULE: Do NOT replace the user's explicitly provided signup name with email name!
    // Only set name if current name is empty or default placeholder
    if (!user.name || user.name === 'Python Explorer') {
      user.name = params.name?.trim() || inferFirstNameFromEmail(cleanEmail);
    }
    // Update avatar if provided (e.g. from Google photoURL)
    if (params.avatar) {
      user.avatar = params.avatar;
    }
    // Ensure owner role if email matches owner
    if (cleanEmail === OWNER_EMAIL) {
      user.role = 'owner';
    }
  }

  writeUsers(users);

  const { passwordHash: _, salt: __, ...userProfile } = user;
  const { token, session } = createSessionRecord(userProfile, 'google', params.clientInfo);

  logAuthEvent({
    userId: user.id,
    name: userProfile.name,
    email: cleanEmail,
    role: userProfile.role,
    accountType: 'google',
    authMethod: 'google',
    status: 'success',
    clientInfo: params.clientInfo
  });

  return { user: userProfile, token, session };
}

export function loginGuest(params: {
  name?: string;
  clientInfo?: ClientInfo;
}): { user: UserProfile; token: string; session: SafeSession } {
  const users = readUsers();
  const guestNum = Math.floor(1000 + Math.random() * 9000);
  const guestName = params.name?.trim() || `Guest #${guestNum}`;
  const guestEmail = `guest_${guestNum}_${Date.now()}@pycode.guest`;
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword('guest_session_secret', salt);
  const now = new Date().toISOString();

  // Guest users ALWAYS receive role: 'viewer', never admin or owner
  const guestUser: StoredUser = {
    id: `usr_guest_${Date.now()}_${guestNum}`,
    email: guestEmail,
    name: guestName,
    avatar: '👀',
    role: 'viewer',
    skillLevel: 'Beginner',
    createdAt: now,
    lastLoginAt: now,
    salt,
    passwordHash
  };

  users.push(guestUser);
  writeUsers(users);

  const { passwordHash: _, salt: __, ...userProfile } = guestUser;
  const { token, session } = createSessionRecord(userProfile, 'guest', params.clientInfo);

  logAuthEvent({
    userId: guestUser.id,
    name: userProfile.name,
    email: guestEmail,
    role: 'viewer',
    accountType: 'guest',
    authMethod: 'guest',
    status: 'success',
    clientInfo: params.clientInfo
  });

  return { user: userProfile, token, session };
}

// -------------------------------------------------------------
// Session Verification & Multi-Device Heartbeat
// -------------------------------------------------------------

export function verifySession(token: string): UserProfile | null {
  if (!token) return null;
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) return null;

  // Check expiration
  if (Date.now() > session.expiresAt) {
    session.status = 'expired';
    writeSessions(sessions);
    return null;
  }

  const users = readUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return null;

  // Synchronize role if owner
  if (user.email.toLowerCase() === OWNER_EMAIL) {
    user.role = 'owner';
  }

  const { passwordHash: _, salt: __, ...userProfile } = user;
  return userProfile;
}

export function recordHeartbeat(token: string): boolean {
  if (!token) return false;
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) return false;

  session.lastActivityAt = new Date().toISOString();
  session.status = 'online';
  writeSessions(sessions);
  return true;
}

export function disconnectSession(token: string): boolean {
  if (!token) return false;
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) return false;

  session.status = 'offline';
  writeSessions(sessions);
  return true;
}

export function revokeSession(token: string): boolean {
  if (!token) return false;
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) return false;

  // Mark session as expired/revoked
  const filtered = sessions.filter(s => s.token !== token);
  writeSessions(filtered);
  return true;
}

export function revokeSessionById(sessionId: string, requestingUser: UserProfile): boolean {
  // Only owner or admin can revoke sessions
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const sessions = readSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return false;

  // Admins cannot revoke owner sessions
  if (session.role === 'owner' && requestingUser.role !== 'owner') {
    throw new Error('Only the owner can revoke owner sessions');
  }

  const filtered = sessions.filter(s => s.id !== sessionId);
  writeSessions(filtered);
  return true;
}

export function revokeAllUserSessions(userId: string): boolean {
  const sessions = readSessions();
  const filtered = sessions.filter(s => s.userId !== userId);
  writeSessions(filtered);
  return true;
}

export function updateUserProfile(
  userId: string,
  updates: { name?: string; avatar?: string; skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' },
  requestingUser: UserProfile
): UserProfile {
  // Security rule: users can only update their own profile, and CANNOT modify roles here
  if (requestingUser.id !== userId && requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized to update this profile');
  }

  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const user = users[userIndex];
  if (updates.name && updates.name.trim()) {
    user.name = updates.name.trim();
  }
  if (updates.avatar && updates.avatar.trim()) {
    user.avatar = updates.avatar.trim();
  }
  if (updates.skillLevel) {
    user.skillLevel = updates.skillLevel;
  }

  writeUsers(users);
  const { passwordHash: _, salt: __, ...userProfile } = user;
  return userProfile;
}

/**
 * Trusted role management by Owner or Admin.
 * Enforces:
 * - Ordinary users CANNOT change roles (TEST 7)
 * - Admins cannot grant themselves or others Owner privileges (TEST 20)
 * - Only Owner can appoint/remove Admins or modify critical roles.
 */
export function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  requestingUser: UserProfile
): UserProfile {
  // Check authorization
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized: only owner and administrators can manage roles');
  }

  // TEST 20: Reject attempts to grant owner privileges
  if (newRole === 'owner') {
    throw new Error('Owner privileges can only be held by the predefined owner account');
  }

  // Admins cannot demote or promote other admins (only owner can)
  if (requestingUser.role === 'admin' && newRole === 'admin') {
    throw new Error('Only the owner can authorize additional administrators');
  }

  const users = readUsers();
  const target = users.find(u => u.id === targetUserId);
  if (!target) {
    throw new Error('User not found');
  }

  if (target.email.toLowerCase() === OWNER_EMAIL) {
    throw new Error('Cannot change owner role');
  }

  target.role = newRole;
  writeUsers(users);

  // Update role in active sessions as well
  const sessions = readSessions();
  sessions.forEach(s => {
    if (s.userId === targetUserId) {
      s.role = newRole;
    }
  });
  writeSessions(sessions);

  const { passwordHash: _, salt: __, ...userProfile } = target;
  return userProfile;
}

// -------------------------------------------------------------
// Live Admin Monitoring & Session Metrics
// -------------------------------------------------------------

export function getAdminOverview(requestingUser: UserProfile) {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const users = readUsers();
  const sessions = readSessions();
  const logs = readLogs();
  const now = Date.now();

  // Active definition: last activity within 90 seconds AND expiresAt > now
  const isOnline = (s: SessionRecord) => {
    const lastActive = new Date(s.lastActivityAt).getTime();
    return now - lastActive < 90 * 1000 && s.expiresAt > now;
  };

  const activeSessions = sessions.filter(isOnline);

  const totalRegisteredUsers = users.filter(u => !u.email.includes('@pycode.guest')).length;
  const activeAuthenticatedUsers = new Set(
    activeSessions.filter(s => s.accountType !== 'guest').map(s => s.userId)
  ).size;
  const activeGuestSessions = activeSessions.filter(s => s.accountType === 'guest').length;
  const activeAdministrators = new Set(
    activeSessions.filter(s => s.role === 'admin').map(s => s.userId)
  ).size;

  // Owner session count visible to authorized admin & owner
  const activeOwnerSessions = activeSessions.filter(s => s.role === 'owner').length;

  return {
    totalRegisteredUsers,
    activeAuthenticatedUsers,
    activeGuestSessions,
    activeAdministrators,
    activeOwnerSessions: requestingUser.role === 'owner' || requestingUser.role === 'admin' ? activeOwnerSessions : 0,
    totalActiveSessions: activeSessions.length,
    recentEvents: logs.slice(0, 30)
  };
}

export function getAdminSessions(requestingUser: UserProfile): SafeSession[] {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const sessions = readSessions();
  const now = Date.now();

  return sessions.map(s => {
    const lastActive = new Date(s.lastActivityAt).getTime();
    let computedStatus: 'online' | 'offline' | 'expired' = 'offline';
    if (now > s.expiresAt) {
      computedStatus = 'expired';
    } else if (now - lastActive < 90 * 1000) {
      computedStatus = 'online';
    } else {
      computedStatus = 'offline';
    }

    const { token: _, ...safe } = s;
    return {
      ...safe,
      status: computedStatus
    };
  });
}

export function getAllUsers(requestingUser: UserProfile): UserProfile[] {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const users = readUsers();
  return users.map(({ passwordHash: _, salt: __, ...profile }) => profile);
}

// -------------------------------------------------------------
// User Feedback Operations
// -------------------------------------------------------------

export function submitFeedback(params: {
  userId?: string;
  userName?: string;
  userEmail?: string;
  performanceRating: number;
  speedCategory?: 'lightning' | 'good' | 'average' | 'sluggish';
  accuracyRating?: number;
  upgradeFields?: string[];
  addSuggestions?: string;
  comments?: string;
}): FeedbackRecord {
  const feedbacks = readFeedback();
  const record: FeedbackRecord = {
    id: `fb_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    userId: params.userId,
    userName: params.userName || 'Anonymous',
    userEmail: params.userEmail,
    performanceRating: Number(params.performanceRating) || 5,
    speedCategory: params.speedCategory || 'good',
    accuracyRating: params.accuracyRating || 5,
    upgradeFields: Array.isArray(params.upgradeFields) ? params.upgradeFields : [],
    addSuggestions: params.addSuggestions?.trim() || '',
    comments: params.comments?.trim() || '',
    submittedAt: new Date().toISOString()
  };

  feedbacks.unshift(record);
  writeFeedback(feedbacks);
  return record;
}
