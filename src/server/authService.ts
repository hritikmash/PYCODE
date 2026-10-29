import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'viewer' | 'member' | 'admin';
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: string;
  lastLoginAt: string;
}

interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LOGIN_LOGS_FILE = path.join(DATA_DIR, 'login_logs.json');

export const OWNER_EMAIL = 'hritikyadav1612@gmail.com';

export interface LoginLogEntry {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  skillLevel?: string;
  accountType: 'guest' | 'registered' | 'google' | 'viewer';
  loginTime: string;
  userAgent?: string;
}

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(LOGIN_LOGS_FILE)) {
    fs.writeFileSync(LOGIN_LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(USERS_FILE)) {
    // Seed default viewer
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('pycode123', salt, 64).toString('hex');
    const defaultViewer: StoredUser = {
      id: 'usr_viewer_default',
      email: 'viewer@pycode.dev',
      name: 'Python Explorer',
      avatar: '🐍',
      role: 'viewer',
      skillLevel: 'Beginner',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      passwordHash: hash,
      salt: salt,
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify([defaultViewer], null, 2), 'utf-8');
  }

  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readUsers(): StoredUser[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  ensureDataFiles();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readSessions(): StoredSession[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(raw) as StoredSession[];
    const now = Date.now();
    return sessions.filter(s => s.expiresAt > now);
  } catch {
    return [];
  }
}

function writeSessions(sessions: StoredSession[]) {
  ensureDataFiles();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function registerUser(params: {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
}): { user: UserProfile; token: string } {
  const users = readUsers();
  const cleanEmail = params.email.trim().toLowerCase();

  if (!cleanEmail || !params.password || !params.name) {
    throw new Error('Email, password, and name are required');
  }

  if (params.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const existing = users.find(u => u.email === cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(params.password, salt);
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: cleanEmail,
    name: params.name.trim(),
    avatar: params.avatar || '⚡',
    role: 'member',
    skillLevel: params.skillLevel || 'Beginner',
    createdAt: now,
    lastLoginAt: now,
    salt,
    passwordHash
  };

  users.push(newUser);
  writeUsers(users);

  // Create session
  const token = createSession(newUser.id);
  const { passwordHash: _, salt: __, ...userProfile } = newUser;
  recordLoginEvent(userProfile, 'registered');
  return { user: userProfile, token };
}

export function loginUser(params: {
  email: string;
  password: string;
}): { user: UserProfile; token: string } {
  const users = readUsers();
  const cleanEmail = params.email.trim().toLowerCase();

  const user = users.find(u => u.email === cleanEmail);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const checkHash = hashPassword(params.password, user.salt);
  if (checkHash !== user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  user.lastLoginAt = new Date().toISOString();
  writeUsers(users);

  const token = createSession(user.id);
  const { passwordHash: _, salt: __, ...userProfile } = user;
  recordLoginEvent(userProfile, 'registered');
  return { user: userProfile, token };
}

export function loginGuest(name?: string): { user: UserProfile; token: string } {
  const users = readUsers();
  const guestNum = Math.floor(1000 + Math.random() * 9000);
  const guestName = name?.trim() || `Viewer #${guestNum}`;
  const guestEmail = `guest_${guestNum}_${Date.now()}@pycode.guest`;
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword('guest_secret', salt);
  const now = new Date().toISOString();

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

  const token = createSession(guestUser.id);
  const { passwordHash: _, salt: __, ...userProfile } = guestUser;
  recordLoginEvent(userProfile, 'guest');
  return { user: userProfile, token };
}

export function loginGoogleUser(params: {
  email: string;
  name?: string;
  avatar?: string;
}): { user: UserProfile; token: string } {
  const users = readUsers();
  const cleanEmail = params.email.trim().toLowerCase();

  let user = users.find(u => u.email === cleanEmail);
  const now = new Date().toISOString();

  if (!user) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(crypto.randomBytes(32).toString('hex'), salt);

    let autoName = params.name?.trim();
    if (!autoName) {
      const prefix = cleanEmail.split('@')[0];
      if (/^hritik/i.test(prefix)) {
        autoName = 'Hritik';
      } else {
        const clean = prefix.replace(/\d+$/, '');
        autoName = clean.length >= 2 ? clean.charAt(0).toUpperCase() + clean.slice(1) : prefix;
      }
    }

    user = {
      id: `usr_google_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      email: cleanEmail,
      name: autoName,
      avatar: params.avatar || '⚡',
      role: 'member',
      skillLevel: 'Intermediate',
      createdAt: now,
      lastLoginAt: now,
      salt,
      passwordHash
    };
    users.push(user);
  } else {
    user.lastLoginAt = now;
    if (params.name && (!user.name || user.name === 'Python Explorer')) {
      user.name = params.name.trim();
    }
  }

  writeUsers(users);
  const token = createSession(user.id);
  const { passwordHash: _, salt: __, ...userProfile } = user;
  recordLoginEvent(userProfile, 'google');
  return { user: userProfile, token };
}

export function createSession(userId: string): string {
  const sessions = readSessions();
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

  sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt
  });

  writeSessions(sessions);
  return token;
}

export function verifySession(token: string): UserProfile | null {
  if (!token) return null;
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) return null;

  const users = readUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return null;

  const { passwordHash: _, salt: __, ...userProfile } = user;
  return userProfile;
}

export function revokeSession(token: string): boolean {
  if (!token) return false;
  const sessions = readSessions();
  const filtered = sessions.filter(s => s.token !== token);
  writeSessions(filtered);
  return true;
}

export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'name' | 'avatar' | 'skillLevel'>>
): UserProfile {
  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const user = users[userIndex];
  if (updates.name) user.name = updates.name.trim();
  if (updates.avatar) user.avatar = updates.avatar.trim();
  if (updates.skillLevel) user.skillLevel = updates.skillLevel;

  writeUsers(users);
  const { passwordHash: _, salt: __, ...userProfile } = user;
  return userProfile;
}

export function recordLoginEvent(
  user: UserProfile, 
  accountType: 'guest' | 'registered' | 'google' | 'viewer',
  userAgent?: string
) {
  ensureDataFiles();
  try {
    let logs: LoginLogEntry[] = [];
    if (fs.existsSync(LOGIN_LOGS_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOGIN_LOGS_FILE, 'utf-8'));
    }
    const newEntry: LoginLogEntry = {
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      skillLevel: user.skillLevel,
      accountType,
      loginTime: new Date().toISOString(),
      userAgent
    };
    logs.unshift(newEntry);
    fs.writeFileSync(LOGIN_LOGS_FILE, JSON.stringify(logs.slice(0, 300), null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to record login event:', err);
  }
}

export function getNonOwnerLogins(): LoginLogEntry[] {
  ensureDataFiles();
  try {
    if (!fs.existsSync(LOGIN_LOGS_FILE)) return [];
    const logs = JSON.parse(fs.readFileSync(LOGIN_LOGS_FILE, 'utf-8')) as LoginLogEntry[];
    // Filter out logins by the owner
    return logs.filter(entry => entry.email.toLowerCase() !== OWNER_EMAIL.toLowerCase());
  } catch {
    return [];
  }
}

export function clearNonOwnerLogins(): boolean {
  ensureDataFiles();
  try {
    fs.writeFileSync(LOGIN_LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function getOrCreateOwnerSession(): { user: UserProfile; token: string } {
  const users = readUsers();
  let owner = users.find(u => u.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
  const now = new Date().toISOString();

  if (!owner) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword('owner_auto_session_secret', salt);
    owner = {
      id: 'usr_owner_hritik',
      email: OWNER_EMAIL,
      name: 'Hritik',
      avatar: '👑',
      role: 'admin',
      skillLevel: 'Advanced',
      createdAt: now,
      lastLoginAt: now,
      salt,
      passwordHash
    };
    users.push(owner);
  } else {
    owner.lastLoginAt = now;
    owner.role = 'admin';
    if (!owner.name || owner.name === 'Python Explorer') {
      owner.name = 'Hritik';
    }
    owner.avatar = '👑';
  }
  writeUsers(users);

  const token = createSession(owner.id);
  const { passwordHash: _, salt: __, ...userProfile } = owner;
  return { user: userProfile, token };
}
