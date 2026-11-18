import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { inferFirstNameFromEmail } from '../utils/userName.ts';
import { isValidEmail, INVALID_EMAIL_ERROR } from '../utils/validation.ts';
import {
  createGoogleAuthenticatorSetup,
  verifyTotp,
  generateTotp,
  generateBackupCodes,
  type GoogleAuthenticatorSetup
} from './totpService.ts';

import type {
  AIEngineId,
  ConnectorEngineId,
  ExternalEngineId,
  ExternalEngineCredentialMeta,
  SyncedEngineSession
} from '../types/index.ts';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export const SUPPORTED_EXTERNAL_ENGINES: ExternalEngineId[] = [
  'gemini',
  'perplexity',
  'deepseek',
  'copilot',
  'groq',
  'chatgpt'
];
export const SUPPORTED_CONNECTOR_ENGINES: ConnectorEngineId[] = SUPPORTED_EXTERNAL_ENGINES;

export interface StoredExternalCredential {
  engineId: ExternalEngineId;
  encryptedApiKey: string;
  iv: string;
  authTag: string;
  maskedKey: string;
  endpointUrl?: string;
  modelName?: string;
  connectedAt: string;
  lastVerifiedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string; // Explicit preferred display name
  avatar: string;
  role: UserRole;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  twoFactorEnabled?: boolean;
  connectedExternalEngines?: ExternalEngineId[];
  externalConnections?: Partial<Record<ExternalEngineId, ExternalEngineCredentialMeta>>;
  preferredExternalEngines?: ExternalEngineId[];
  enabledEngines?: ConnectorEngineId[];
  hasConfiguredEngines?: boolean;
  syncedEngineSessions?: Record<string, SyncedEngineSession>;
  openAiRouteMode?: 'workspace_proxy' | 'custom_server_vault';
  createdAt: string;
  lastLoginAt: string;
}

interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
  twoFactorSecret?: string;
  backupCodes?: string[];
  externalCredentials?: Partial<Record<ExternalEngineId, StoredExternalCredential>>;
}

export interface ClientInfo {
  deviceId?: string;
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
  logoutAt?: string;
  expiresAt: number;
  deviceId: string; // Unique stable device identifier
  deviceName: string; // e.g. "macOS • Chrome"
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
  authMethod: 'password' | 'google' | 'guest' | '2fa';
  status: 'success' | 'failed';
  failReason?: string;
  timestamp: string;
  deviceId?: string;
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

export interface DeviceSessionDetail {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  accountType: string;
  loginAt: string;
  logoutAt?: string;
  lastActivityAt: string;
  durationFormatted: string;
  entryRoute: string;
  status: 'online' | 'offline' | 'expired';
}

export interface UniqueDeviceRecord {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  os: string;
  browser: string;
  status: 'online' | 'offline';
  totalSessionsCount: number;
  firstSeenAt: string;
  lastActiveAt: string;
  associatedUsers: { id: string; name: string; email: string; role: string }[];
  isCurrentDevice?: boolean;
  sessions: DeviceSessionDetail[];
}

export interface UserDeviceRecord {
  deviceId: string;
  deviceKey?: string;
  deviceName: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  os: string;
  browser: string;
  status: 'online' | 'offline';
  lastActiveAt: string;
  firstSeenAt: string;
  sessionsCount: number;
  entryRoute: string;
  isCurrentDevice?: boolean;
  sessions: DeviceSessionDetail[];
}

export interface UserGroupedDevicesRecord {
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  avatar: string;
  skillLevel?: string;
  accountType: 'registered' | 'google' | 'guest';
  status: 'online' | 'offline';
  totalLoginsCount: number;
  activeSessionsCount: number;
  lastLoginAt: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
  connectedExternalEngines?: ExternalEngineId[];
  enabledEngines?: ConnectorEngineId[];
  hasConfiguredEngines?: boolean;
  externalConnections?: Partial<Record<ExternalEngineId, ExternalEngineCredentialMeta>>;
  syncedEngineSessions?: Record<string, SyncedEngineSession>;
  devices: UserDeviceRecord[];
}

export interface UserDetailHistoryResponse {
  user: UserProfile & { twoFactorEnabled?: boolean; createdAt: string; lastLoginAt: string; accountType?: string };
  totalLoginCount: number;
  successfulLoginsCount: number;
  failedLoginsCount: number;
  activeSessionsCount: number;
  status: 'online' | 'offline';
  devices: UserDeviceRecord[];
  loginHistory: LoginEventRecord[];
  sessions: DeviceSessionDetail[];
}

export interface TwoFactorChallenge {
  tempToken: string;
  userId: string;
  userEmail: string;
  code: string;
  accountType: 'registered' | 'google' | 'guest';
  clientInfo?: ClientInfo;
  expiresAt: number;
}

export interface PendingSignupChallenge {
  tempSignupToken: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  avatar?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  clientInfo?: ClientInfo;
  secret: string; // Formatted Base32
  rawSecret: string; // Raw Base32
  otpauthUri: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  expiresAt: number;
}

export type AuthenticatorSetupResult = {
  requireAuthenticatorSetup: true;
  tempSignupToken: string;
  email: string;
  secret: string;
  rawSecret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  codePreview?: string;
};

export interface AppConfig {
  appTitle: string;
  appSubtitle: string;
  announcementBanner: {
    enabled: boolean;
    message: string;
    type: 'info' | 'warning' | 'success';
  };
  defaultEngine: string;
  defaultMode: 'both' | 'code_only' | 'theory_only';
  features: {
    sandboxExecution: boolean;
    interactiveFlowcharts: boolean;
    variableExecutionTrace: boolean;
    autoRunCode: boolean;
  };
  updatedAt: string;
  updatedBy: {
    userId: string;
    userName: string;
    userEmail: string;
    role: 'owner' | 'admin';
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LOGIN_LOGS_FILE = path.join(DATA_DIR, 'login_logs.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const APP_CONFIG_FILE = path.join(DATA_DIR, 'app_config.json');
const REMOVED_DEVICES_FILE = path.join(DATA_DIR, 'removed_devices.json');
const VAULT_KEY_FILE = path.join(DATA_DIR, '.vault.key');

export interface RemovedDeviceRecord {
  id: string;
  userId?: string;
  deviceId?: string;
  deviceKey: string;
  removedAt: string;
  removedBy: string;
}

// Predefined Owner Email configured via server-side environment
export const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'hritikyadav1612@gmail.com').toLowerCase().trim();

const defaultAppConfig: AppConfig = {
  appTitle: 'Pycode',
  appSubtitle: 'Python Theory & Code Intelligence Platform',
  announcementBanner: {
    enabled: false,
    message: 'Welcome to Pycode! Learn Python concepts and execute code safely.',
    type: 'info'
  },
  defaultEngine: 'turbo_race',
  defaultMode: 'both',
  features: {
    sandboxExecution: true,
    interactiveFlowcharts: true,
    variableExecutionTrace: true,
    autoRunCode: true
  },
  updatedAt: new Date().toISOString(),
  updatedBy: {
    userId: 'system',
    userName: 'Platform Owner',
    userEmail: OWNER_EMAIL,
    role: 'owner'
  }
};

// In-memory store for pending 2FA challenges (5 min expiry)
const pending2FAChallenges = new Map<string, TwoFactorChallenge>();

// In-memory store for pending Google Authenticator signup challenges (15 min expiry)
const pendingSignupChallenges = new Map<string, PendingSignupChallenge>();

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

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

  if (!fs.existsSync(APP_CONFIG_FILE)) {
    fs.writeFileSync(APP_CONFIG_FILE, JSON.stringify(defaultAppConfig, null, 2), 'utf-8');
  }

  if (!fs.existsSync(REMOVED_DEVICES_FILE)) {
    fs.writeFileSync(REMOVED_DEVICES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function readAppConfig(): AppConfig {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(APP_CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...defaultAppConfig,
      ...parsed,
      announcementBanner: {
        ...defaultAppConfig.announcementBanner,
        ...(parsed.announcementBanner || {})
      },
      features: {
        ...defaultAppConfig.features,
        ...(parsed.features || {})
      }
    };
  } catch {
    return defaultAppConfig;
  }
}

export function updateAppConfig(updates: Partial<AppConfig>, requestingUser: UserProfile): AppConfig {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized: Administrator or Owner privileges required to edit app configuration');
  }

  const current = readAppConfig();
  const updated: AppConfig = {
    ...current,
    ...updates,
    announcementBanner: {
      ...current.announcementBanner,
      ...(updates.announcementBanner || {})
    },
    features: {
      ...current.features,
      ...(updates.features || {})
    },
    updatedAt: new Date().toISOString(),
    updatedBy: {
      userId: requestingUser.id,
      userName: requestingUser.name,
      userEmail: requestingUser.email,
      role: requestingUser.role === 'owner' ? 'owner' : 'admin'
    }
  };

  ensureDataFiles();
  fs.writeFileSync(APP_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export function normalizeConnectorEngines(engines?: unknown): ExternalEngineId[] {
  if (!Array.isArray(engines) || engines.length === 0) {
    return [];
  }
  const valid = engines.filter((id): id is ExternalEngineId =>
    typeof id === 'string' && SUPPORTED_EXTERNAL_ENGINES.includes(id as ExternalEngineId)
  );
  return Array.from(new Set(valid));
}

function getVaultKey(): Buffer {
  const envSecret = process.env.CREDENTIAL_ENCRYPTION_SECRET || process.env.AUTH_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    return crypto.createHash('sha256').update(envSecret.trim()).digest();
  }
  ensureDataFiles();
  if (fs.existsSync(VAULT_KEY_FILE)) {
    const hex = fs.readFileSync(VAULT_KEY_FILE, 'utf-8').trim();
    if (/^[0-9a-f]{64}$/i.test(hex)) {
      return Buffer.from(hex, 'hex');
    }
  }
  const freshKey = crypto.randomBytes(32);
  fs.writeFileSync(VAULT_KEY_FILE, freshKey.toString('hex'), { mode: 0o600 });
  return freshKey;
}

function encryptSecret(plaintext: string): { encryptedApiKey: string; iv: string; authTag: string } {
  const key = getVaultKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedApiKey: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

function decryptSecret(record: Pick<StoredExternalCredential, 'encryptedApiKey' | 'iv' | 'authTag'>): string {
  const key = getVaultKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(record.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(record.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.encryptedApiKey, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

function maskApiKey(apiKey: string): string {
  const trimmed = (apiKey || '').trim();
  if (trimmed.length <= 8) return '••••' + trimmed.slice(-2);
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export function getConnectedExternalEngineIds(user: Pick<StoredUser, 'externalCredentials'>): ExternalEngineId[] {
  const creds = user.externalCredentials || {};
  return SUPPORTED_EXTERNAL_ENGINES.filter((engId) => Boolean(creds[engId]?.encryptedApiKey));
}

export function buildSafeExternalConnections(
  user: Pick<StoredUser, 'externalCredentials'>
): Partial<Record<ExternalEngineId, ExternalEngineCredentialMeta>> {
  const creds = user.externalCredentials || {};
  const result: Partial<Record<ExternalEngineId, ExternalEngineCredentialMeta>> = {};

  for (const engId of SUPPORTED_EXTERNAL_ENGINES) {
    const rec = creds[engId];
    if (rec && rec.encryptedApiKey) {
      result[engId] = {
        engineId: engId,
        status: 'connected',
        maskedKey: rec.maskedKey,
        endpointUrl: rec.endpointUrl,
        modelName: rec.modelName,
        connectedAt: rec.connectedAt,
        lastVerifiedAt: rec.lastVerifiedAt
      };
    } else {
      result[engId] = {
        engineId: engId,
        status: 'disconnected'
      };
    }
  }
  return result;
}

/**
 * Strictly derives safe user engine state from verified user-supplied external credentials.
 * Never creates placeholder tokens or internal fallbacks for unselected external engines.
 */
export function initializeUserEngineSessions(user: StoredUser): Record<string, SyncedEngineSession> {
  const connected = getConnectedExternalEngineIds(user);
  user.enabledEngines = connected;
  user.connectedExternalEngines = connected;
  if (typeof user.hasConfiguredEngines !== 'boolean') {
    user.hasConfiguredEngines = false;
  }
  return {};
}

function toSafeUserProfile(user: StoredUser): UserProfile {
  const {
    passwordHash: _,
    salt: __,
    backupCodes: ___,
    twoFactorSecret: ____,
    externalCredentials: _____,
    syncedEngineSessions: ______,
    ...profile
  } = user;
  const connected = getConnectedExternalEngineIds(user);
  return {
    ...profile,
    connectedExternalEngines: connected,
    enabledEngines: connected,
    externalConnections: buildSafeExternalConnections(user),
    preferredExternalEngines: normalizeConnectorEngines(user.preferredExternalEngines),
    hasConfiguredEngines: Boolean(user.hasConfiguredEngines)
  };
}

function readUsers(): StoredUser[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const users = JSON.parse(raw) as StoredUser[];
    let changed = false;
    for (const u of users) {
      if (u.email && u.email.toLowerCase().trim() === OWNER_EMAIL && u.role !== 'owner') {
        u.role = 'owner';
        changed = true;
      }
      // Enforce strict BYOM isolation: remove legacy placeholder sessions and any uncredentialed enabledEngines
      const realConnected = getConnectedExternalEngineIds(u);
      const currentEnabled = Array.isArray(u.enabledEngines) ? u.enabledEngines : [];
      if (
        currentEnabled.length !== realConnected.length ||
        currentEnabled.some((id) => !realConnected.includes(id as ExternalEngineId))
      ) {
        u.enabledEngines = realConnected;
        u.connectedExternalEngines = realConnected;
        changed = true;
      }
      if (u.syncedEngineSessions) {
        delete u.syncedEngineSessions;
        changed = true;
      }
      if (typeof u.hasConfiguredEngines !== 'boolean') {
        u.hasConfiguredEngines = false;
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
    if (u.email && u.email.toLowerCase().trim() === OWNER_EMAIL) {
      u.role = 'owner';
    }
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readSessions(): SessionRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(raw) as SessionRecord[];
    let modified = false;
    for (let i = 0; i < sessions.length; i++) {
      if (!sessions[i].id) {
        sessions[i].id = `sess_legacy_${i}_${sessions[i].token ? sessions[i].token.slice(0, 8) : Date.now().toString(36)}`;
        modified = true;
      }
    }
    if (modified) {
      writeSessions(sessions);
    }
    return sessions;
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
    const logs = JSON.parse(raw) as LoginEventRecord[];
    let modified = false;
    for (let i = 0; i < logs.length; i++) {
      if (!logs[i].id) {
        logs[i].id = `evt_legacy_${i}_${Date.now().toString(36)}`;
        modified = true;
      }
    }
    if (modified) {
      writeLogs(logs);
    }
    return logs;
  } catch {
    return [];
  }
}

function writeLogs(logs: LoginEventRecord[]) {
  ensureDataFiles();
  fs.writeFileSync(LOGIN_LOGS_FILE, JSON.stringify(logs.slice(0, 500), null, 2), 'utf-8');
}

export function readRemovedDevices(): RemovedDeviceRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(REMOVED_DEVICES_FILE, 'utf-8');
    return JSON.parse(raw) as RemovedDeviceRecord[];
  } catch {
    return [];
  }
}

export function writeRemovedDevices(records: RemovedDeviceRecord[]) {
  ensureDataFiles();
  fs.writeFileSync(REMOVED_DEVICES_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

export function clearRemovedDevice(deviceKey: string, deviceId?: string, userId?: string) {
  try {
    const records = readRemovedDevices();
    const cleanK = deviceKey.toLowerCase().trim();
    const cleanId = (deviceId || '').toLowerCase().trim();
    const remaining = records.filter(r => {
      const matchKey = r.deviceKey.toLowerCase() === cleanK || (r.deviceId && r.deviceId.toLowerCase() === cleanId);
      const matchUser = !r.userId || !userId || r.userId === userId;
      return !(matchKey && matchUser);
    });
    if (remaining.length !== records.length) {
      writeRemovedDevices(remaining);
    }
  } catch {}
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

  let browser = 'Chrome';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  let os = 'Desktop';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  return { deviceType, browser, os };
}

/**
 * Creates a distinct multi-device session for a user.
 * Assigns a stable deviceId so each physical device appears only once in console.
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

  const deviceType = clientInfo?.deviceType || 'desktop';
  const os = clientInfo?.os || 'Desktop';
  const browser = clientInfo?.browser || 'Browser';

  // Stable deviceId per client: use client-sent deviceId if present, or deterministic hash
  let deviceId = clientInfo?.deviceId?.trim();
  if (!deviceId || deviceId.length < 8) {
    const rawFingerprint = `${deviceType}_${os}_${browser}`;
    deviceId = `dev_${crypto.createHash('sha256').update(rawFingerprint).digest('hex').slice(0, 12)}`;
  }

  const deviceName = `${os} • ${browser}`;
  const deviceKey = `${deviceType}_${os}_${browser}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  clearRemovedDevice(deviceKey, deviceId, user.id);

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
    deviceId,
    deviceName,
    deviceType,
    browser,
    os,
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
  authMethod: 'password' | 'google' | 'guest' | '2fa';
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
    deviceId: params.clientInfo?.deviceId,
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

export type AuthResult = 
  | { user: UserProfile; token: string; session: SafeSession }
  | { require2FA: true; tempToken: string; email: string; maskedEmail: string; codePreview: string };

export type RegisterResult = AuthResult | AuthenticatorSetupResult;

export async function registerUser(params: {
  email: string;
  password: string;
  name: string; // Explicitly entered name
  avatar?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  clientInfo?: ClientInfo;
  setupGoogleAuthenticator?: boolean;
}): Promise<RegisterResult> {
  const users = readUsers();
  const rawEmail = (params.email || '').trim().toLowerCase();

  // Strict Rule 2: Only allow users with valid email addresses. Reject invalid email addresses and display the exact error message: "INVALID EMAIL!"
  if (!isValidEmail(rawEmail)) {
    throw new Error(INVALID_EMAIL_ERROR);
  }

  const explicitName = params.name.trim();

  // FIX OWNER LOGIN (Rule 1): Allow the owner to log in from any device/browser even if reserved
  if (rawEmail === OWNER_EMAIL) {
    return loginUser({ email: rawEmail, password: params.password, clientInfo: params.clientInfo });
  }

  if (!params.password) {
    throw new Error('Email and password are required');
  }

  if (params.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const existing = users.find(u => u.email === rawEmail);
  if (existing) {
    logAuthEvent({
      userId: existing.id,
      name: explicitName || existing.name,
      email: rawEmail,
      role: existing.role,
      accountType: 'registered',
      authMethod: 'password',
      status: 'failed',
      failReason: 'Account already exists',
      clientInfo: params.clientInfo
    });
    throw new Error('An account with this email already exists');
  }

  let role: UserRole = 'member';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(params.password, salt);
  const now = new Date().toISOString();

  const finalName = explicitName || inferFirstNameFromEmail(rawEmail);

  // If user requested Google Authenticator (2FA) setup during signup
  if (params.setupGoogleAuthenticator) {
    const setup = await createGoogleAuthenticatorSetup(rawEmail, 'Pycode');
    const tempSignupToken = `signup_2fa_${crypto.randomBytes(24).toString('hex')}`;
    const codePreview = generateTotp(setup.rawSecret);

    pendingSignupChallenges.set(tempSignupToken, {
      tempSignupToken,
      name: finalName,
      email: rawEmail,
      passwordHash,
      salt,
      avatar: params.avatar || '⚡',
      skillLevel: params.skillLevel || 'Beginner',
      clientInfo: params.clientInfo,
      secret: setup.secret,
      rawSecret: setup.rawSecret,
      otpauthUri: setup.otpauthUri,
      qrCodeDataUrl: setup.qrCodeDataUrl,
      backupCodes: setup.backupCodes,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
    });

    return {
      requireAuthenticatorSetup: true,
      tempSignupToken,
      email: rawEmail,
      secret: setup.secret,
      rawSecret: setup.rawSecret,
      otpauthUri: setup.otpauthUri,
      qrCodeDataUrl: setup.qrCodeDataUrl,
      backupCodes: setup.backupCodes,
      codePreview
    };
  }

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: rawEmail,
    name: finalName,
    avatar: params.avatar || '⚡',
    role,
    skillLevel: params.skillLevel || 'Beginner',
    twoFactorEnabled: false,
    enabledEngines: [],
    connectedExternalEngines: [],
    preferredExternalEngines: [],
    externalCredentials: {},
    hasConfiguredEngines: false,
    createdAt: now,
    lastLoginAt: now,
    salt,
    passwordHash
  };

  users.push(newUser);
  writeUsers(users);

  const userProfile = toSafeUserProfile(newUser);
  const { token, session } = createSessionRecord(userProfile, 'registered', params.clientInfo);

  logAuthEvent({
    userId: newUser.id,
    name: userProfile.name,
    email: rawEmail,
    role: userProfile.role,
    accountType: 'registered',
    authMethod: 'password',
    status: 'success',
    clientInfo: params.clientInfo
  });

  return { user: userProfile, token, session };
}

export function verifyAndCompleteAuthenticatorSignup(params: {
  tempSignupToken: string;
  code: string;
  clientInfo?: ClientInfo;
}): { user: UserProfile; token: string; session: SafeSession } {
  const challenge = pendingSignupChallenges.get(params.tempSignupToken);
  if (!challenge) {
    throw new Error('Registration verification session expired or invalid. Please sign up again.');
  }

  if (Date.now() > challenge.expiresAt) {
    pendingSignupChallenges.delete(params.tempSignupToken);
    throw new Error('Setup session has expired. Please sign up again.');
  }

  const cleanCode = (params.code || '').trim().toUpperCase();
  const isTotpValid = verifyTotp(challenge.rawSecret, cleanCode);
  const isBackupCodeMatch = challenge.backupCodes.includes(cleanCode);

  if (!isTotpValid && !isBackupCodeMatch) {
    throw new Error('Invalid Google Authenticator code. Enter the 6-digit code from your authenticator app or an emergency backup code.');
  }

  let finalBackupCodes = [...challenge.backupCodes];
  if (isBackupCodeMatch) {
    finalBackupCodes = finalBackupCodes.filter(c => c !== cleanCode);
  }

  pendingSignupChallenges.delete(params.tempSignupToken);

  const users = readUsers();
  // Double check uniqueness
  const existing = users.find(u => u.email === challenge.email);
  if (existing) {
    throw new Error('An account with this email was already registered.');
  }

  const now = new Date().toISOString();
  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: challenge.email,
    name: challenge.name,
    avatar: challenge.avatar || '⚡',
    role: 'member',
    skillLevel: challenge.skillLevel || 'Beginner',
    twoFactorEnabled: true,
    twoFactorSecret: challenge.rawSecret,
    backupCodes: finalBackupCodes,
    enabledEngines: [],
    connectedExternalEngines: [],
    preferredExternalEngines: [],
    externalCredentials: {},
    hasConfiguredEngines: false,
    createdAt: now,
    lastLoginAt: now,
    salt: challenge.salt,
    passwordHash: challenge.passwordHash
  };

  users.push(newUser);
  writeUsers(users);

  const clientInfo = params.clientInfo || challenge.clientInfo;
  const userProfile = toSafeUserProfile(newUser);
  const { token, session } = createSessionRecord(userProfile, 'registered', clientInfo);

  logAuthEvent({
    userId: newUser.id,
    name: userProfile.name,
    email: newUser.email,
    role: userProfile.role,
    accountType: 'registered',
    authMethod: '2fa',
    status: 'success',
    clientInfo
  });

  return { user: userProfile, token, session };
}

export function loginUser(params: {
  email: string;
  password?: string;
  clientInfo?: ClientInfo;
}): AuthResult {
  const users = readUsers();
  const rawEmail = (params.email || '').trim().toLowerCase();

  // Strict Rule 2: Email validation
  if (!isValidEmail(rawEmail)) {
    throw new Error(INVALID_EMAIL_ERROR);
  }

  // FIX OWNER LOGIN (Rule 1):
  // Allow the owner to log in from any device, browser, or session, even if email is reserved.
  // Remove restrictions blocking owner login outside the original workspace while maintaining secure authentication.
  if (rawEmail === OWNER_EMAIL) {
    let owner = users.find(u => u.email === OWNER_EMAIL);
    const now = new Date().toISOString();

    if (!owner) {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(params.password || 'owner_secure_access', salt);
      owner = {
        id: `usr_owner_${Date.now()}`,
        email: OWNER_EMAIL,
        name: 'Hritik',
        avatar: '👑',
        role: 'owner',
        skillLevel: 'Advanced',
        twoFactorEnabled: false,
        enabledEngines: [],
        connectedExternalEngines: [],
        preferredExternalEngines: [],
        externalCredentials: {},
        hasConfiguredEngines: false,
        createdAt: now,
        lastLoginAt: now,
        salt,
        passwordHash
      };
      users.push(owner);
    } else {
      owner.role = 'owner';
      owner.lastLoginAt = now;
      if (!owner.name || owner.name === 'Python Explorer') {
        owner.name = 'Hritik';
      }
    }
    writeUsers(users);

    // Two-Step Verification Check
    if (owner.twoFactorEnabled) {
      const tempToken = `2fa_${crypto.randomBytes(24).toString('hex')}`;
      const code = owner.twoFactorSecret 
        ? generateTotp(owner.twoFactorSecret) 
        : Math.floor(100000 + Math.random() * 900000).toString();
      pending2FAChallenges.set(tempToken, {
        tempToken,
        userId: owner.id,
        userEmail: owner.email,
        code,
        accountType: 'registered',
        clientInfo: params.clientInfo,
        expiresAt: Date.now() + 5 * 60 * 1000
      });
      return {
        require2FA: true,
        tempToken,
        email: owner.email,
        maskedEmail: maskEmail(owner.email),
        codePreview: code
      };
    }

    const userProfile = toSafeUserProfile(owner);
    const { token, session } = createSessionRecord(userProfile, 'registered', params.clientInfo);

    logAuthEvent({
      userId: owner.id,
      name: userProfile.name,
      email: rawEmail,
      role: 'owner',
      accountType: 'registered',
      authMethod: 'password',
      status: 'success',
      clientInfo: params.clientInfo
    });

    return { user: userProfile, token, session };
  }

  // Regular user login
  const user = users.find(u => u.email === rawEmail);
  if (!user) {
    logAuthEvent({
      userId: 'unknown',
      name: inferFirstNameFromEmail(rawEmail),
      email: rawEmail,
      role: 'member',
      accountType: 'registered',
      authMethod: 'password',
      status: 'failed',
      failReason: 'User not found',
      clientInfo: params.clientInfo
    });
    throw new Error('Invalid email or password');
  }

  if (params.password) {
    const checkHash = hashPassword(params.password, user.salt);
    if (checkHash !== user.passwordHash) {
      logAuthEvent({
        userId: user.id,
        name: user.name,
        email: rawEmail,
        role: user.role,
        accountType: 'registered',
        authMethod: 'password',
        status: 'failed',
        failReason: 'Incorrect password',
        clientInfo: params.clientInfo
      });
      throw new Error('Invalid email or password');
    }
  }

  user.lastLoginAt = new Date().toISOString();
  writeUsers(users);

  // Two-Step Verification Check
  if (user.twoFactorEnabled) {
    const tempToken = `2fa_${crypto.randomBytes(24).toString('hex')}`;
    const code = user.twoFactorSecret 
      ? generateTotp(user.twoFactorSecret) 
      : Math.floor(100000 + Math.random() * 900000).toString();
    pending2FAChallenges.set(tempToken, {
      tempToken,
      userId: user.id,
      userEmail: user.email,
      code,
      accountType: 'registered',
      clientInfo: params.clientInfo,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    return {
      require2FA: true,
      tempToken,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      codePreview: code
    };
  }

  const userProfile = toSafeUserProfile(user);
  const { token, session } = createSessionRecord(userProfile, 'registered', params.clientInfo);

  logAuthEvent({
    userId: user.id,
    name: userProfile.name,
    email: rawEmail,
    role: userProfile.role,
    accountType: 'registered',
    authMethod: 'password',
    status: 'success',
    clientInfo: params.clientInfo
  });

  return { user: userProfile, token, session };
}

export function loginOwnerDirect(clientInfo?: ClientInfo): AuthResult {
  return loginUser({ email: OWNER_EMAIL, password: '', clientInfo });
}

export function loginGoogleUser(params: {
  email: string;
  name?: string;
  avatar?: string;
  clientInfo?: ClientInfo;
}): AuthResult {
  const users = readUsers();
  const rawEmail = (params.email || '').trim().toLowerCase();

  // Strict Rule 2: Email validation
  if (!isValidEmail(rawEmail)) {
    throw new Error(INVALID_EMAIL_ERROR);
  }

  let user = users.find(u => u.email === rawEmail);
  const now = new Date().toISOString();

  if (!user) {
    // New Google user registration
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(crypto.randomBytes(32).toString('hex'), salt);

    const autoName = params.name?.trim() || inferFirstNameFromEmail(rawEmail);

    let role: UserRole = 'member';
    if (rawEmail === OWNER_EMAIL) {
      role = 'owner';
    }

    user = {
      id: `usr_google_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      email: rawEmail,
      name: autoName,
      avatar: params.avatar || (role === 'owner' ? '👑' : '⚡'),
      role,
      skillLevel: 'Intermediate',
      twoFactorEnabled: false,
      enabledEngines: [],
      connectedExternalEngines: [],
      preferredExternalEngines: [],
      externalCredentials: {},
      hasConfiguredEngines: false,
      createdAt: now,
      lastLoginAt: now,
      salt,
      passwordHash
    };
    users.push(user);
  } else {
    // Returning user
    user.lastLoginAt = now;
    if (!user.name || user.name === 'Python Explorer') {
      user.name = params.name?.trim() || inferFirstNameFromEmail(rawEmail);
    }
    if (params.avatar) {
      user.avatar = params.avatar;
    }
    if (rawEmail === OWNER_EMAIL) {
      user.role = 'owner';
    }
  }

  writeUsers(users);

  // Two-Step Verification Check
  if (user.twoFactorEnabled) {
    const tempToken = `2fa_${crypto.randomBytes(24).toString('hex')}`;
    const code = user.twoFactorSecret 
      ? generateTotp(user.twoFactorSecret) 
      : Math.floor(100000 + Math.random() * 900000).toString();
    pending2FAChallenges.set(tempToken, {
      tempToken,
      userId: user.id,
      userEmail: user.email,
      code,
      accountType: 'google',
      clientInfo: params.clientInfo,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    return {
      require2FA: true,
      tempToken,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      codePreview: code
    };
  }

  const userProfile = toSafeUserProfile(user);
  const { token, session } = createSessionRecord(userProfile, 'google', params.clientInfo);

  logAuthEvent({
    userId: user.id,
    name: userProfile.name,
    email: rawEmail,
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
  const guestId = `guest_${Date.now().toString(36)}_${crypto.randomBytes(2).toString('hex')}`;
  const guestEmail = `${guestId}@pycode.guest`;
  const guestName = params.name?.trim() || 'Python Explorer';
  const now = new Date().toISOString();

  const guestUser: StoredUser = {
    id: guestId,
    email: guestEmail,
    name: guestName,
    avatar: '⚡',
    role: 'viewer',
    skillLevel: 'Beginner',
    twoFactorEnabled: false,
    enabledEngines: [],
    connectedExternalEngines: [],
    preferredExternalEngines: [],
    externalCredentials: {},
    hasConfiguredEngines: false,
    createdAt: now,
    lastLoginAt: now,
    salt: 'guest_salt',
    passwordHash: 'guest_hash'
  };

  users.push(guestUser);
  writeUsers(users);

  const userProfile = toSafeUserProfile(guestUser);
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
// Two-Step Verification (2FA) Operations
// -------------------------------------------------------------

export function enableTwoFactor(userId: string): { backupCodes: string[] } {
  const users = readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');

  const backupCodes: string[] = [];
  for (let i = 0; i < 5; i++) {
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    backupCodes.push(`${p1}-${p2}`);
  }

  user.twoFactorEnabled = true;
  user.backupCodes = backupCodes;
  writeUsers(users);

  return { backupCodes };
}

export async function setupUserAuthenticator(userId: string): Promise<GoogleAuthenticatorSetup> {
  const users = readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');

  const setup = await createGoogleAuthenticatorSetup(user.email, 'Pycode');
  user.twoFactorEnabled = true;
  user.twoFactorSecret = setup.rawSecret;
  user.backupCodes = setup.backupCodes;
  writeUsers(users);

  return setup;
}

export function disableTwoFactor(userId: string): boolean {
  const users = readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.backupCodes = [];
  writeUsers(users);

  return true;
}

export function verifyTwoFactorChallenge(params: {
  tempToken: string;
  code: string;
  email: string;
}): { user: UserProfile; token: string; session: SafeSession } {
  const challenge = pending2FAChallenges.get(params.tempToken);
  if (!challenge) {
    throw new Error('Verification session expired or invalid. Please sign in again.');
  }

  if (Date.now() > challenge.expiresAt) {
    pending2FAChallenges.delete(params.tempToken);
    throw new Error('Verification code has expired. Please sign in again.');
  }

  const cleanCode = (params.code || '').trim().toUpperCase();
  const users = readUsers();
  const user = users.find(u => u.id === challenge.userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isTotpMatch = Boolean(user.twoFactorSecret && verifyTotp(user.twoFactorSecret, cleanCode));
  const isNumericMatch = cleanCode === challenge.code || isTotpMatch;
  const isBackupCodeMatch = Array.isArray(user.backupCodes) && user.backupCodes.includes(cleanCode);

  if (!isNumericMatch && !isBackupCodeMatch) {
    throw new Error('Invalid verification code');
  }

  // If used backup code, consume it
  if (isBackupCodeMatch && user.backupCodes) {
    user.backupCodes = user.backupCodes.filter(c => c !== cleanCode);
    writeUsers(users);
  }

  pending2FAChallenges.delete(params.tempToken);

  writeUsers(users);

  const userProfile = toSafeUserProfile(user);
  const { token, session } = createSessionRecord(userProfile, challenge.accountType, challenge.clientInfo);

  logAuthEvent({
    userId: user.id,
    name: userProfile.name,
    email: user.email,
    role: userProfile.role,
    accountType: challenge.accountType,
    authMethod: '2fa',
    status: 'success',
    clientInfo: challenge.clientInfo
  });

  return { user: userProfile, token, session };
}

// -------------------------------------------------------------
// Session Verification & Multi-Device Tracking
// -------------------------------------------------------------

export function verifySession(token: string): UserProfile | null {
  if (!token) return null;
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) return null;

  // Check expiration
  if (Date.now() > session.expiresAt || session.status === 'offline' && session.logoutAt) {
    return null;
  }

  const users = readUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return null;

  // Synchronize role if owner
  if (user.email && user.email.toLowerCase() === OWNER_EMAIL) {
    user.role = 'owner';
  }

  return toSafeUserProfile(user);
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
  session.logoutAt = new Date().toISOString();
  writeSessions(sessions);
  return true;
}

export function revokeSession(token: string): boolean {
  if (!token) return false;
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token);
  if (!session) return false;

  session.status = 'offline';
  session.logoutAt = new Date().toISOString();
  session.expiresAt = Date.now() - 1000;
  writeSessions(sessions);
  return true;
}

export function revokeSessionById(sessionId: string, requestingUser: UserProfile): boolean {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const sessions = readSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return false;

  if (session.role === 'owner' && requestingUser.role !== 'owner') {
    throw new Error('Only the owner can revoke owner sessions');
  }

  session.status = 'offline';
  session.logoutAt = new Date().toISOString();
  session.expiresAt = Date.now() - 1000;
  writeSessions(sessions);
  return true;
}

export function revokeAllUserSessions(userId: string): boolean {
  const sessions = readSessions();
  const now = new Date().toISOString();
  for (const s of sessions) {
    if (s.userId === userId) {
      s.status = 'offline';
      s.logoutAt = now;
      s.expiresAt = Date.now() - 1000;
    }
  }
  writeSessions(sessions);
  return true;
}

export function removeDevice(
  deviceIdOrKey: string,
  requestingUser: UserProfile,
  targetUserId?: string,
  explicitDeviceKey?: string
): boolean {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized: Administrator or Owner privileges required');
  }

  const cleanTarget = (deviceIdOrKey || '').trim().toLowerCase();
  const cleanExplicitKey = (explicitDeviceKey || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (!cleanTarget && !cleanExplicitKey) return false;

  const sessions = readSessions();
  const now = new Date().toISOString();
  let updated = false;
  let matchedDevKey = cleanExplicitKey;

  // 1. Terminate & invalidate all sessions corresponding to this device
  for (const s of sessions) {
    if (targetUserId && s.userId !== targetUserId && s.userEmail?.toLowerCase() !== targetUserId.toLowerCase()) {
      continue;
    }

    const devType = s.deviceType || 'desktop';
    const osName = s.os || 'Desktop';
    const browserName = s.browser || 'Browser';
    const devKey = `${devType}_${osName}_${browserName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const sDevId = (s.deviceId || `dev_${devKey}`).toLowerCase().trim();

    if (
      sDevId === cleanTarget ||
      devKey === cleanTarget ||
      (cleanExplicitKey && devKey === cleanExplicitKey) ||
      (s.deviceId && s.deviceId.toLowerCase() === cleanTarget) ||
      cleanTarget.includes(devKey) ||
      devKey.includes(cleanTarget)
    ) {
      s.status = 'offline';
      s.logoutAt = now;
      s.expiresAt = Date.now() - 1000;
      updated = true;
      if (!matchedDevKey) matchedDevKey = devKey;
    }
  }

  if (updated) {
    writeSessions(sessions);
  }

  // If no session provided the normalized key, search logs
  if (!matchedDevKey) {
    const logs = readLogs();
    for (const l of logs) {
      if (targetUserId && l.userId !== targetUserId && l.email?.toLowerCase() !== targetUserId.toLowerCase()) {
        continue;
      }
      const devType = l.deviceType || 'desktop';
      const osName = l.os || 'Desktop';
      const browserName = l.browser || 'Browser';
      const devKey = `${devType}_${osName}_${browserName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const lDevId = (l.deviceId || `dev_${devKey}`).toLowerCase().trim();
      if (
        lDevId === cleanTarget ||
        devKey === cleanTarget ||
        (cleanExplicitKey && devKey === cleanExplicitKey) ||
        cleanTarget.includes(devKey) ||
        devKey.includes(cleanTarget)
      ) {
        matchedDevKey = devKey;
        break;
      }
    }
  }

  const effectiveKey = (matchedDevKey || cleanTarget).replace(/^dev_/, '');

  // 2. Persist to removed_devices.json so the device is permanently removed from connected devices
  const removedDevices = readRemovedDevices();
  const exists = removedDevices.some(rd => 
    (
      rd.deviceKey === effectiveKey || 
      rd.deviceKey === cleanTarget || 
      (rd.deviceId && rd.deviceId.toLowerCase() === cleanTarget) ||
      (cleanExplicitKey && rd.deviceKey === cleanExplicitKey)
    ) &&
    (!targetUserId || !rd.userId || rd.userId === targetUserId)
  );

  if (!exists) {
    removedDevices.push({
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: targetUserId || '',
      deviceId: deviceIdOrKey,
      deviceKey: effectiveKey,
      removedAt: now,
      removedBy: requestingUser.email || requestingUser.name
    });
    writeRemovedDevices(removedDevices);
  }

  return true;
}

export function revokeDeviceSessions(
  deviceId: string, 
  requestingUser: UserProfile, 
  targetUserId?: string,
  explicitDeviceKey?: string
): boolean {
  return removeDevice(deviceId, requestingUser, targetUserId, explicitDeviceKey);
}

// -------------------------------------------------------------
// Unique Device & Session History (Rule 6 - No Duplicates)
// -------------------------------------------------------------

export function getOwnerUniqueDevices(requestingUser: UserProfile, currentDeviceId?: string): UniqueDeviceRecord[] {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized: Administrator or Owner privileges required');
  }

  const sessions = readSessions();
  const now = Date.now();

  const deviceMap = new Map<string, {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'tablet' | 'mobile';
    os: string;
    browser: string;
    status: 'online' | 'offline';
    totalSessionsCount: number;
    firstSeenAt: string;
    lastActiveAt: string;
    userSet: Map<string, { id: string; name: string; email: string; role: string }>;
    sessions: DeviceSessionDetail[];
  }>();

  const removedDevices = readRemovedDevices();

  for (const s of sessions) {
    const devType = s.deviceType || 'desktop';
    const osName = s.os || 'Desktop';
    const browserName = s.browser || 'Browser';
    const devKey = `${devType}_${osName}_${browserName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const devId = s.deviceId || `dev_${devKey}`;

    const isRemoved = removedDevices.some(r => 
      (r.deviceKey === devKey || (r.deviceId && r.deviceId.toLowerCase() === devId.toLowerCase())) &&
      (!r.userId || r.userId === s.userId)
    );
    if (isRemoved) continue;

    const lastActiveTime = new Date(s.lastActivityAt || s.createdAt).getTime();
    const isOnline = now - lastActiveTime < 90 * 1000 && s.expiresAt > now && !s.logoutAt;
    const computedStatus: 'online' | 'offline' | 'expired' = s.logoutAt 
      ? 'offline' 
      : (now > s.expiresAt ? 'expired' : (isOnline ? 'online' : 'offline'));

    // Format duration
    let durationFormatted = 'Active Now';
    const startMs = new Date(s.createdAt).getTime();
    const endMs = s.logoutAt ? new Date(s.logoutAt).getTime() : (isOnline ? now : lastActiveTime);
    const durationMins = Math.max(1, Math.round((endMs - startMs) / 60000));
    if (durationMins < 60) {
      durationFormatted = `${durationMins}m${isOnline ? ' (Active)' : ''}`;
    } else {
      const hours = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      durationFormatted = `${hours}h ${mins}m${isOnline ? ' (Active)' : ''}`;
    }

    const sessionDetail: DeviceSessionDetail = {
      sessionId: s.id,
      userId: s.userId,
      userName: s.userName || 'Anonymous',
      userEmail: s.userEmail || '',
      role: s.role,
      accountType: s.accountType,
      loginAt: s.createdAt,
      logoutAt: s.logoutAt,
      lastActivityAt: s.lastActivityAt,
      durationFormatted,
      entryRoute: s.entryRoute || '/',
      status: computedStatus
    };

    if (!deviceMap.has(devId)) {
      const devName = s.deviceName || `${s.os || 'Desktop'} • ${s.browser || 'Browser'}`;
      deviceMap.set(devId, {
        deviceId: devId,
        deviceName: devName,
        deviceType: s.deviceType || 'desktop',
        os: s.os || 'OS',
        browser: s.browser || 'Browser',
        status: isOnline ? 'online' : 'offline',
        totalSessionsCount: 0,
        firstSeenAt: s.createdAt,
        lastActiveAt: s.lastActivityAt || s.createdAt,
        userSet: new Map(),
        sessions: []
      });
    }

    const dev = deviceMap.get(devId)!;
    dev.totalSessionsCount += 1;
    if (new Date(s.createdAt).getTime() < new Date(dev.firstSeenAt).getTime()) {
      dev.firstSeenAt = s.createdAt;
    }
    if (lastActiveTime > new Date(dev.lastActiveAt).getTime()) {
      dev.lastActiveAt = s.lastActivityAt || s.createdAt;
    }
    if (isOnline) {
      dev.status = 'online';
    }
    if (s.userId) {
      dev.userSet.set(s.userId, {
        id: s.userId,
        name: s.userName || 'User',
        email: s.userEmail || '',
        role: s.role
      });
    }
    dev.sessions.push(sessionDetail);
  }

  // Convert map to array with strict uniqueness: EACH DEVICE APPEARS ONLY ONCE
  const result: UniqueDeviceRecord[] = [];
  for (const [, dev] of deviceMap.entries()) {
    dev.sessions.sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime());

    result.push({
      deviceId: dev.deviceId,
      deviceName: dev.deviceName,
      deviceType: dev.deviceType,
      os: dev.os,
      browser: dev.browser,
      status: dev.status,
      totalSessionsCount: dev.totalSessionsCount,
      firstSeenAt: dev.firstSeenAt,
      lastActiveAt: dev.lastActiveAt,
      associatedUsers: Array.from(dev.userSet.values()),
      isCurrentDevice: currentDeviceId ? dev.deviceId === currentDeviceId : false,
      sessions: dev.sessions
    });
  }

  // Sort: online first, then newest activity
  result.sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
  });

  return result;
}

/**
 * Groups connected devices and sessions strictly by user rather than device type,
 * with complete deduplication so each device appears only once per user.
 */
export function getUserGroupedDevices(requestingUser: UserProfile, currentDeviceId?: string): UserGroupedDevicesRecord[] {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized: Administrator or Owner privileges required');
  }

  const users = readUsers();
  const sessions = readSessions();
  const logs = readLogs();
  const now = Date.now();

  const userMap = new Map<string, UserGroupedDevicesRecord>();

  const formatDuration = (s: SessionRecord, isOnline: boolean, lastActiveTime: number) => {
    const startMs = new Date(s.createdAt).getTime();
    const endMs = s.logoutAt ? new Date(s.logoutAt).getTime() : (isOnline ? now : lastActiveTime);
    const durationMins = Math.max(1, Math.round((endMs - startMs) / 60000));
    if (durationMins < 60) {
      return `${durationMins}m${isOnline ? ' (Active)' : ''}`;
    } else {
      const hours = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      return `${hours}h ${mins}m${isOnline ? ' (Active)' : ''}`;
    }
  };

  const processUser = (
    u: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      avatar?: string;
      skillLevel?: string;
      createdAt?: string;
      lastLoginAt?: string;
      twoFactorEnabled?: boolean;
      externalCredentials?: StoredUser['externalCredentials'];
      enabledEngines?: ConnectorEngineId[];
      hasConfiguredEngines?: boolean;
      syncedEngineSessions?: Record<string, SyncedEngineSession>;
    },
    accountType: 'registered' | 'google' | 'guest'
  ): UserGroupedDevicesRecord => {
    const emailLower = (u.email || '').toLowerCase().trim();
    const userSessions = sessions.filter(s => 
      (s.userId && s.userId === u.id) || 
      (s.userEmail && s.userEmail.toLowerCase().trim() === emailLower)
    );
    const userLogs = logs.filter(l => 
      (l.userId && l.userId === u.id) || 
      (l.email && l.email.toLowerCase().trim() === emailLower)
    );

    const removedList = readRemovedDevices();
    const isDeviceRemoved = (devKey: string, devId?: string) => {
      const cleanK = devKey.toLowerCase().replace(/^dev_/, '').trim();
      const cleanId = (devId || '').toLowerCase().trim();
      return removedList.some(r => {
        const rKey = (r.deviceKey || '').toLowerCase().replace(/^dev_/, '').trim();
        const rId = (r.deviceId || '').toLowerCase().trim();
        const matchUser = !r.userId || r.userId === u.id;
        const matchKey = rKey === cleanK || rKey.includes(cleanK) || cleanK.includes(rKey);
        const matchId = (cleanId && rId === cleanId) || (cleanId && rKey === cleanId) || (rId && cleanK === rId);
        return matchUser && (matchKey || matchId);
      });
    };

    // Deduplicate devices by normalized key: `${deviceType}_${os}_${browser}`
    // Eliminates random device ID duplicate entries
    const deviceMap = new Map<string, {
      deviceId: string;
      deviceKey: string;
      deviceName: string;
      deviceType: 'desktop' | 'tablet' | 'mobile';
      os: string;
      browser: string;
      status: 'online' | 'offline';
      lastActiveAt: string;
      firstSeenAt: string;
      sessionsCount: number;
      entryRoute: string;
      sessions: DeviceSessionDetail[];
    }>();

    let userIsOnline = false;
    let activeSessionsCount = 0;

    for (const s of userSessions) {
      const devType = s.deviceType || 'desktop';
      const osName = s.os || 'Desktop';
      const browserName = s.browser || 'Browser';
      const normalizedKey = `${devType}_${osName}_${browserName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

      // Skip devices that have been permanently removed/revoked
      if (isDeviceRemoved(normalizedKey, s.deviceId)) {
        continue;
      }

      const lastActiveTime = new Date(s.lastActivityAt || s.createdAt).getTime();
      const isOnline = now - lastActiveTime < 90 * 1000 && s.expiresAt > now && !s.logoutAt;
      if (isOnline) {
        userIsOnline = true;
        activeSessionsCount++;
      }

      const computedStatus: 'online' | 'offline' | 'expired' = s.logoutAt 
        ? 'offline' 
        : (now > s.expiresAt ? 'expired' : (isOnline ? 'online' : 'offline'));

      const sessionDetail: DeviceSessionDetail = {
        sessionId: s.id,
        userId: s.userId || u.id,
        userName: s.userName || u.name,
        userEmail: s.userEmail || u.email,
        role: s.role || u.role,
        accountType: s.accountType || accountType,
        loginAt: s.createdAt,
        logoutAt: s.logoutAt,
        lastActivityAt: s.lastActivityAt,
        durationFormatted: formatDuration(s, isOnline, lastActiveTime),
        entryRoute: s.entryRoute || '/',
        status: computedStatus
      };

      if (!deviceMap.has(normalizedKey)) {
        const devName = s.deviceName || `${osName} • ${browserName}`;
        deviceMap.set(normalizedKey, {
          deviceId: s.deviceId || `dev_${normalizedKey}`,
          deviceKey: normalizedKey,
          deviceName: devName,
          deviceType: devType,
          os: osName,
          browser: browserName,
          status: isOnline ? 'online' : 'offline',
          lastActiveAt: s.lastActivityAt || s.createdAt,
          firstSeenAt: s.createdAt,
          sessionsCount: 0,
          entryRoute: s.entryRoute || '/',
          sessions: []
        });
      }

      const dev = deviceMap.get(normalizedKey)!;
      dev.sessionsCount++;
      dev.sessions.push(sessionDetail);
      if (isOnline) {
        dev.status = 'online';
      }
      if (new Date(s.createdAt).getTime() < new Date(dev.firstSeenAt).getTime()) {
        dev.firstSeenAt = s.createdAt;
      }
      if (lastActiveTime > new Date(dev.lastActiveAt).getTime()) {
        dev.lastActiveAt = s.lastActivityAt || s.createdAt;
      }
    }

    // Check logs for devices that might not have active sessions
    for (const l of userLogs) {
      const devType = l.deviceType || 'desktop';
      const osName = l.os || 'Desktop';
      const browserName = l.browser || 'Browser';
      const normalizedKey = `${devType}_${osName}_${browserName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (isDeviceRemoved(normalizedKey, l.deviceId)) {
        continue;
      }

      if (!deviceMap.has(normalizedKey)) {
        deviceMap.set(normalizedKey, {
          deviceId: l.deviceId || `dev_${normalizedKey}`,
          deviceKey: normalizedKey,
          deviceName: `${osName} • ${browserName}`,
          deviceType: devType,
          os: osName,
          browser: browserName,
          status: 'offline',
          lastActiveAt: l.timestamp,
          firstSeenAt: l.timestamp,
          sessionsCount: 1,
          entryRoute: l.entryRoute || '/',
          sessions: []
        });
      }
    }

    const devicesList: UserDeviceRecord[] = Array.from(deviceMap.values()).map(d => ({
      ...d,
      isCurrentDevice: currentDeviceId ? (d.deviceId === currentDeviceId || d.deviceKey === currentDeviceId) : false
    }));

    devicesList.sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });

    const totalLoginsCount = Math.max(userLogs.length, userSessions.length, 1);
    const newestLastLogin = u.lastLoginAt || 
      (userSessions[0]?.createdAt) || 
      (userLogs[0]?.timestamp) || 
      u.createdAt || 
      new Date().toISOString();

    return {
      userId: u.id,
      userName: u.name || inferFirstNameFromEmail(u.email),
      userEmail: u.email,
      role: u.role,
      avatar: u.avatar || '👤',
      skillLevel: u.skillLevel || 'Beginner',
      accountType,
      status: userIsOnline ? 'online' : 'offline',
      totalLoginsCount,
      activeSessionsCount,
      lastLoginAt: newestLastLogin,
      createdAt: u.createdAt || newestLastLogin,
      twoFactorEnabled: Boolean(u.twoFactorEnabled),
      connectedExternalEngines: getConnectedExternalEngineIds(u),
      enabledEngines: getConnectedExternalEngineIds(u),
      externalConnections: buildSafeExternalConnections(u),
      hasConfiguredEngines: Boolean(u.hasConfiguredEngines),
      devices: devicesList
    };
  };

  for (const u of users) {
    const accType = u.email === OWNER_EMAIL ? 'registered' : (u.id.includes('google') ? 'google' : 'registered');
    userMap.set(u.id, processUser(u, accType));
  }

  for (const s of sessions) {
    if (s.accountType === 'guest' && s.userId && !userMap.has(s.userId)) {
      userMap.set(s.userId, processUser({
        id: s.userId,
        name: s.userName || 'Guest Viewer',
        email: s.userEmail || `${s.userId}@pycode.guest`,
        role: s.role || 'viewer',
        avatar: '⚡',
        createdAt: s.createdAt,
        lastLoginAt: s.createdAt
      }, 'guest'));
    }
  }

  const result = Array.from(userMap.values());

  result.sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (a.role !== 'owner' && b.role === 'owner') return 1;
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
  });

  return result;
}

/**
 * Returns complete user detail history with total login count and full chronological event list.
 */
export function getUserDetailHistory(targetUserIdOrEmail: string, requestingUser: UserProfile): UserDetailHistoryResponse {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const targetId = (targetUserIdOrEmail || '').trim();
  const users = readUsers();
  const sessions = readSessions();
  const logs = readLogs();
  const now = Date.now();

  let targetUser = users.find(u => u.id === targetId || u.email.toLowerCase() === targetId.toLowerCase());

  if (!targetUser) {
    const guestSess = sessions.find(s => s.userId === targetId || (s.userEmail && s.userEmail.toLowerCase() === targetId.toLowerCase()));
    if (guestSess) {
      targetUser = {
        id: guestSess.userId,
        name: guestSess.userName || 'Guest User',
        email: guestSess.userEmail || `${guestSess.userId}@pycode.guest`,
        avatar: '⚡',
        role: guestSess.role || 'viewer',
        skillLevel: 'Beginner',
        createdAt: guestSess.createdAt,
        lastLoginAt: guestSess.createdAt,
        salt: '',
        passwordHash: ''
      };
    }
  }

  if (!targetUser) {
    throw new Error('User not found');
  }

  const emailLower = (targetUser.email || '').toLowerCase().trim();
  const userSessions = sessions.filter(s => 
    (s.userId && s.userId === targetUser!.id) || 
    (s.userEmail && s.userEmail.toLowerCase().trim() === emailLower)
  );

  const userLogs = logs.filter(l => 
    (l.userId && l.userId === targetUser!.id) || 
    (l.email && l.email.toLowerCase().trim() === emailLower)
  );

  const allEventsMap = new Map<string, LoginEventRecord>();
  for (const l of userLogs) {
    allEventsMap.set(l.id, l);
  }

  for (const s of userSessions) {
    const syntheticId = `evt_sess_${s.id}`;
    if (!allEventsMap.has(syntheticId)) {
      allEventsMap.set(syntheticId, {
        id: syntheticId,
        userId: s.userId,
        name: s.userName || targetUser.name,
        email: s.userEmail || targetUser.email,
        role: s.role,
        accountType: s.accountType,
        authMethod: s.accountType === 'google' ? 'google' : (s.accountType === 'guest' ? 'guest' : 'password'),
        status: 'success',
        timestamp: s.createdAt,
        deviceId: s.deviceId,
        deviceType: s.deviceType || 'desktop',
        browser: s.browser || 'Browser',
        os: s.os || 'Desktop',
        entryRoute: s.entryRoute || '/'
      });
    }
  }

  const chronologicalEvents = Array.from(allEventsMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalLoginCount = chronologicalEvents.length;
  const successfulLoginsCount = chronologicalEvents.filter(e => e.status === 'success').length;
  const failedLoginsCount = chronologicalEvents.filter(e => e.status === 'failed').length;

  const deviceMap = new Map<string, UserDeviceRecord>();
  let userIsOnline = false;
  let activeSessionsCount = 0;
  const removedList = readRemovedDevices();

  for (const s of userSessions) {
    const devType = s.deviceType || 'desktop';
    const osName = s.os || 'Desktop';
    const browserName = s.browser || 'Browser';
    const normalizedKey = `${devType}_${osName}_${browserName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const isRemoved = removedList.some(r => {
      const rKey = (r.deviceKey || '').toLowerCase().replace(/^dev_/, '').trim();
      const rId = (r.deviceId || '').toLowerCase().trim();
      const cleanK = normalizedKey.replace(/^dev_/, '').trim();
      const cleanId = (s.deviceId || '').toLowerCase().trim();
      const matchUser = !r.userId || r.userId === targetUser!.id;
      const matchKey = rKey === cleanK || rKey.includes(cleanK) || cleanK.includes(rKey);
      const matchId = (cleanId && rId === cleanId) || (cleanId && rKey === cleanId) || (rId && cleanK === rId);
      return matchUser && (matchKey || matchId);
    });
    if (isRemoved) continue;

    const lastActiveTime = new Date(s.lastActivityAt || s.createdAt).getTime();
    const isOnline = now - lastActiveTime < 90 * 1000 && s.expiresAt > now && !s.logoutAt;
    if (isOnline) {
      userIsOnline = true;
      activeSessionsCount++;
    }

    if (!deviceMap.has(normalizedKey)) {
      deviceMap.set(normalizedKey, {
        deviceId: s.deviceId || `dev_${normalizedKey}`,
        deviceKey: normalizedKey,
        deviceName: s.deviceName || `${osName} • ${browserName}`,
        deviceType: devType,
        os: osName,
        browser: browserName,
        status: isOnline ? 'online' : 'offline',
        lastActiveAt: s.lastActivityAt || s.createdAt,
        firstSeenAt: s.createdAt,
        sessionsCount: 0,
        entryRoute: s.entryRoute || '/',
        sessions: []
      });
    }

    const dev = deviceMap.get(normalizedKey)!;
    dev.sessionsCount++;
    if (isOnline) dev.status = 'online';
    if (new Date(s.createdAt).getTime() < new Date(dev.firstSeenAt).getTime()) dev.firstSeenAt = s.createdAt;
    if (lastActiveTime > new Date(dev.lastActiveAt).getTime()) dev.lastActiveAt = s.lastActivityAt || s.createdAt;

    dev.sessions.push({
      sessionId: s.id,
      userId: s.userId,
      userName: s.userName,
      userEmail: s.userEmail,
      role: s.role,
      accountType: s.accountType,
      loginAt: s.createdAt,
      logoutAt: s.logoutAt,
      lastActivityAt: s.lastActivityAt,
      durationFormatted: isOnline ? 'Active Now' : 'Completed',
      entryRoute: s.entryRoute || '/',
      status: s.logoutAt ? 'offline' : (now > s.expiresAt ? 'expired' : (isOnline ? 'online' : 'offline'))
    });
  }

  const safeProfile = toSafeUserProfile(targetUser);

  return {
    user: safeProfile,
    totalLoginCount,
    successfulLoginsCount,
    failedLoginsCount,
    activeSessionsCount,
    status: userIsOnline ? 'online' : 'offline',
    devices: Array.from(deviceMap.values()),
    loginHistory: chronologicalEvents,
    sessions: userSessions.map(s => ({
      sessionId: s.id,
      userId: s.userId,
      userName: s.userName,
      userEmail: s.userEmail,
      role: s.role,
      accountType: s.accountType,
      loginAt: s.createdAt,
      logoutAt: s.logoutAt,
      lastActivityAt: s.lastActivityAt,
      durationFormatted: s.status === 'online' ? 'Active Now' : 'Completed',
      entryRoute: s.entryRoute || '/',
      status: s.status
    }))
  };
}

// -------------------------------------------------------------
// External BYOM AI Connectivity & Onboarding Management
// -------------------------------------------------------------

export function completeExternalEngineOnboarding(
  userId: string,
  params: { preferredExternalEngines?: unknown; skipped?: boolean },
  requestingUser: UserProfile
): UserProfile {
  if (requestingUser.id !== userId && requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized to update AI onboarding preferences');
  }

  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const user = users[userIndex];
  user.hasConfiguredEngines = true;
  if (params.skipped) {
    user.preferredExternalEngines = [];
  } else if (Array.isArray(params.preferredExternalEngines)) {
    user.preferredExternalEngines = normalizeConnectorEngines(params.preferredExternalEngines);
  }
  // Never store placeholder credentials or mark non-verified engines connected
  const connected = getConnectedExternalEngineIds(user);
  user.enabledEngines = connected;
  user.connectedExternalEngines = connected;

  writeUsers(users);
  return toSafeUserProfile(user);
}

export function saveVerifiedExternalEngineCredential(
  userId: string,
  params: {
    engineId: ExternalEngineId;
    apiKey: string;
    endpointUrl?: string;
    modelName?: string;
  },
  requestingUser: UserProfile
): UserProfile {
  if (requestingUser.id !== userId && requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized to connect external AI engine');
  }

  if (!SUPPORTED_EXTERNAL_ENGINES.includes(params.engineId)) {
    throw new Error(`Unsupported external AI engine: ${params.engineId}`);
  }

  const cleanKey = (params.apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('A valid API key is required.');
  }

  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const user = users[userIndex];
  if (!user.externalCredentials) {
    user.externalCredentials = {};
  }

  const now = new Date().toISOString();
  const encrypted = encryptSecret(cleanKey);

  user.externalCredentials[params.engineId] = {
    engineId: params.engineId,
    encryptedApiKey: encrypted.encryptedApiKey,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    maskedKey: maskApiKey(cleanKey),
    endpointUrl: params.endpointUrl?.trim() || undefined,
    modelName: params.modelName?.trim() || undefined,
    connectedAt: user.externalCredentials[params.engineId]?.connectedAt || now,
    lastVerifiedAt: now
  };

  user.hasConfiguredEngines = true;
  const connected = getConnectedExternalEngineIds(user);
  user.enabledEngines = connected;
  user.connectedExternalEngines = connected;

  writeUsers(users);
  return toSafeUserProfile(user);
}

export function disconnectExternalEngineCredential(
  userId: string,
  engineId: ExternalEngineId,
  requestingUser: UserProfile
): UserProfile {
  if (requestingUser.id !== userId && requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized to disconnect external AI engine');
  }

  if (!SUPPORTED_EXTERNAL_ENGINES.includes(engineId)) {
    throw new Error(`Unsupported external AI engine: ${engineId}`);
  }

  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const user = users[userIndex];
  if (user.externalCredentials && user.externalCredentials[engineId]) {
    delete user.externalCredentials[engineId];
  }

  if (Array.isArray(user.preferredExternalEngines)) {
    user.preferredExternalEngines = user.preferredExternalEngines.filter(id => id !== engineId);
  }

  const connected = getConnectedExternalEngineIds(user);
  user.enabledEngines = connected;
  user.connectedExternalEngines = connected;

  writeUsers(users);
  return toSafeUserProfile(user);
}

export function getUserDecryptedExternalCredential(
  userId: string,
  engineId: ExternalEngineId
): { apiKey: string; endpointUrl?: string; modelName?: string } | null {
  const users = readUsers();
  const user = users.find(u => u.id === userId);
  const record = user?.externalCredentials?.[engineId];
  if (!record || !record.encryptedApiKey) {
    return null;
  }
  try {
    const apiKey = decryptSecret(record);
    if (!apiKey) return null;
    return {
      apiKey,
      endpointUrl: record.endpointUrl,
      modelName: record.modelName
    };
  } catch {
    return null;
  }
}

export function getUserEngineStatus(userId: string): {
  connectedExternalEngines: ExternalEngineId[];
  enabledEngines: ConnectorEngineId[];
  externalConnections: Partial<Record<ExternalEngineId, ExternalEngineCredentialMeta>>;
  preferredExternalEngines: ExternalEngineId[];
  hasConfiguredEngines: boolean;
} {
  const users = readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  const connected = getConnectedExternalEngineIds(user);
  return {
    connectedExternalEngines: connected,
    enabledEngines: connected,
    externalConnections: buildSafeExternalConnections(user),
    preferredExternalEngines: normalizeConnectorEngines(user.preferredExternalEngines),
    hasConfiguredEngines: Boolean(user.hasConfiguredEngines)
  };
}

// -------------------------------------------------------------
// User Profile & RBAC
// -------------------------------------------------------------

export function updateUserProfile(
  userId: string,
  updates: { name?: string; avatar?: string; skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' },
  requestingUser: UserProfile
): UserProfile {
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
  return toSafeUserProfile(user);
}

export function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  requestingUser: UserProfile
): UserProfile {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized: only owner and administrators can manage roles');
  }

  if (newRole === 'owner') {
    throw new Error('Owner privileges can only be held by the predefined root owner account');
  }

  const users = readUsers();
  const target = users.find(u => u.id === targetUserId);
  if (!target) {
    throw new Error('User not found');
  }

  if (target.email.toLowerCase() === OWNER_EMAIL || target.role === 'owner') {
    throw new Error('Cannot change owner role. Owner maintains supreme root authority.');
  }

  // Only the owner can promote someone to admin or modify an existing admin
  if (newRole === 'admin' && requestingUser.role !== 'owner') {
    throw new Error('Only the Owner has authority to appoint administrators');
  }
  if (target.role === 'admin' && requestingUser.role !== 'owner') {
    throw new Error('Administrators cannot modify fellow administrators. Only the Owner holds this authority.');
  }

  target.role = newRole;
  writeUsers(users);

  const sessions = readSessions();
  sessions.forEach(s => {
    if (s.userId === targetUserId) {
      s.role = newRole;
    }
  });
  writeSessions(sessions);

  const { passwordHash: _, salt: __, backupCodes: ___, twoFactorSecret: ____, ...userProfile } = target;
  return userProfile;
}

export function appointAdministrator(
  target: { email?: string; userId?: string },
  requestingUser: UserProfile
): UserProfile {
  if (requestingUser.role !== 'owner') {
    throw new Error('Only the Owner can appoint administrators with edit and update permissions');
  }

  const users = readUsers();
  let targetUser: StoredUser | undefined;

  if (target.userId) {
    targetUser = users.find(u => u.id === target.userId);
  }

  if (!targetUser && target.email) {
    const cleanEmail = target.email.toLowerCase().trim();
    targetUser = users.find(u => u.email.toLowerCase().trim() === cleanEmail);
  }

  if (!targetUser && target.email) {
    const cleanEmail = target.email.toLowerCase().trim();
    if (!isValidEmail(cleanEmail)) {
      throw new Error(INVALID_EMAIL_ERROR);
    }
    // Pre-create administrator record
    const salt = crypto.randomBytes(16).toString('hex');
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const passwordHash = hashPassword(tempPassword, salt);
    const newId = `usr_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    const nowIso = new Date().toISOString();

    targetUser = {
      id: newId,
      email: cleanEmail,
      name: inferFirstNameFromEmail(cleanEmail),
      avatar: '🛡️',
      role: 'admin',
      skillLevel: 'Intermediate',
      createdAt: nowIso,
      lastLoginAt: nowIso,
      passwordHash,
      salt
    };
    users.push(targetUser);
  }

  if (!targetUser) {
    throw new Error('User not found. Please provide a valid user ID or registered email.');
  }

  if (targetUser.email.toLowerCase().trim() === OWNER_EMAIL) {
    throw new Error('The Owner already possesses supreme root authority and cannot be made an administrator.');
  }

  targetUser.role = 'admin';
  writeUsers(users);

  // Update any active sessions
  const sessions = readSessions();
  sessions.forEach(s => {
    if (s.userId === targetUser!.id) {
      s.role = 'admin';
    }
  });
  writeSessions(sessions);

  const { passwordHash: _, salt: __, backupCodes: ___, twoFactorSecret: ____, ...userProfile } = targetUser;
  return userProfile;
}

export function revokeAdministrator(
  targetUserId: string,
  requestingUser: UserProfile
): UserProfile {
  if (requestingUser.role !== 'owner') {
    throw new Error('Only the Owner can revoke administrator privileges');
  }

  const users = readUsers();
  const target = users.find(u => u.id === targetUserId);
  if (!target) {
    throw new Error('User not found');
  }

  if (target.email.toLowerCase().trim() === OWNER_EMAIL || target.role === 'owner') {
    throw new Error('Cannot revoke Owner status. Owner is root.');
  }

  target.role = 'member';
  writeUsers(users);

  const sessions = readSessions();
  sessions.forEach(s => {
    if (s.userId === targetUserId) {
      s.role = 'member';
    }
  });
  writeSessions(sessions);

  const { passwordHash: _, salt: __, backupCodes: ___, twoFactorSecret: ____, ...userProfile } = target;
  return userProfile;
}

export function deleteUserAccount(targetUserId: string, requestingUser: UserProfile): boolean {
  if (requestingUser.role !== 'owner') {
    throw new Error('Only the platform owner can delete accounts');
  }
  const users = readUsers();
  const target = users.find(u => u.id === targetUserId);
  if (!target) throw new Error('User not found');
  if (target.email.toLowerCase() === OWNER_EMAIL) {
    throw new Error('Cannot delete owner account');
  }

  const updatedUsers = users.filter(u => u.id !== targetUserId);
  writeUsers(updatedUsers);

  revokeAllUserSessions(targetUserId);
  return true;
}

// -------------------------------------------------------------
// Live Admin Monitoring & System Operations
// -------------------------------------------------------------

export function getAdminOverview(requestingUser: UserProfile) {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const users = readUsers();
  const sessions = readSessions();
  const logs = readLogs();
  const now = Date.now();

  const isOnline = (s: SessionRecord) => {
    const lastActive = new Date(s.lastActivityAt || s.createdAt).getTime();
    return now - lastActive < 90 * 1000 && s.expiresAt > now && !s.logoutAt;
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
    const lastActive = new Date(s.lastActivityAt || s.createdAt).getTime();
    let computedStatus: 'online' | 'offline' | 'expired' = 'offline';
    if (s.logoutAt) {
      computedStatus = 'offline';
    } else if (now > s.expiresAt) {
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
  return users.map(toSafeUserProfile);
}

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

export function getSystemStats(requestingUser: UserProfile) {
  if (requestingUser.role !== 'owner') {
    throw new Error('Unauthorized: Owner only');
  }

  const users = readUsers();
  const sessions = readSessions();
  const logs = readLogs();
  const feedback = readFeedback();

  return {
    totalUsers: users.length,
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.status === 'online' && !s.logoutAt).length,
    totalLogs: logs.length,
    totalFeedback: feedback.length,
    ownerEmail: OWNER_EMAIL,
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  };
}

export function clearSystemCache(requestingUser: UserProfile) {
  if (requestingUser.role !== 'owner' && requestingUser.role !== 'admin') {
    throw new Error('Unauthorized: Administrator or Owner privileges required to clear system cache');
  }

  const sessions = readSessions();
  const now = Date.now();
  // Remove expired offline sessions older than 7 days
  const cleaned = sessions.filter(s => {
    if (s.status === 'offline' && s.logoutAt) {
      return now - new Date(s.logoutAt).getTime() < 7 * 24 * 60 * 60 * 1000;
    }
    return true;
  });
  writeSessions(cleaned);

  return { success: true, removedCount: sessions.length - cleaned.length };
}
