import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithGooglePopup, signOutFirebase } from '../firebase';
import { isValidEmail, INVALID_EMAIL_ERROR } from '../utils/validation';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  twoFactorEnabled?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface SavedGoogleAccount {
  email: string;
  name: string;
  avatar?: string;
  lastUsed: string;
}

export interface TwoFactorChallengeState {
  tempToken: string;
  email: string;
  maskedEmail: string;
  codePreview?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  deviceId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  hasRegisteredBefore: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'signup' | 'guest';
  openAuthModal: (tab?: 'signin' | 'signup' | 'guest') => void;
  closeAuthModal: () => void;
  isGoogleWindowOpen: boolean;
  openGoogleWindow: () => void;
  closeGoogleWindow: () => void;
  isAdminModalOpen: boolean;
  openAdminModal: () => void;
  closeAdminModal: () => void;
  isSettingsModalOpen: boolean;
  settingsInitialTab: string;
  openSettingsModal: (initialTab?: string) => void;
  closeSettingsModal: () => void;
  isFeedbackModalOpen: boolean;
  openFeedbackModal: () => void;
  closeFeedbackModal: () => void;
  // 2FA Challenge State & Actions
  is2FAModalOpen: boolean;
  twoFactorChallenge: TwoFactorChallengeState | null;
  verify2FACode: (code: string) => Promise<{ success: boolean; error?: string }>;
  toggle2FA: (enable: boolean) => Promise<{ success: boolean; backupCodes?: string[]; error?: string }>;
  cancel2FA: () => void;
  // Standard Auth Actions
  login: (email: string, password: string) => Promise<{ success: boolean; require2FA?: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    avatar?: string,
    skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced'
  ) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: (name?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsOwner: () => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, name?: string, avatar?: string) => Promise<{ success: boolean; require2FA?: boolean; error?: string }>;
  signInWithFirebaseGoogle: () => Promise<{ success: boolean; require2FA?: boolean; error?: string; isPopupBlocked?: boolean }>;
  isEditorWorkshop: boolean;
  savedGoogleAccounts: SavedGoogleAccount[];
  removeSavedGoogleAccount: (email: string) => void;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string; skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'pycode_viewer_auth_token';
const USER_KEY = 'pycode_viewer_profile';
const HAS_REGISTERED_KEY = 'pycode_has_registered';
const SAVED_ACCOUNTS_KEY = 'pycode_google_saved_accounts';
const DEVICE_ID_KEY = 'pycode_client_device_id';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_device';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'temp_device';
  }
}

/**
 * Detects whether the app is executing inside the AI Studio editor workshop preview
 * (rendered inside an embedded editor iframe) vs accessed directly via standalone app link.
 */
export const isEditorWorkshop = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [hasRegisteredBefore, setHasRegisteredBefore] = useState<boolean>(
    () => localStorage.getItem(HAS_REGISTERED_KEY) === 'true'
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'guest'>('signup');
  const [isGoogleWindowOpen, setIsGoogleWindowOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>('general');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  // 2FA Challenge state
  const [is2FAModalOpen, setIs2FAModalOpen] = useState<boolean>(false);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallengeState | null>(null);

  const deviceId = getOrCreateDeviceId();

  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState<SavedGoogleAccount[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const removeSavedGoogleAccount = (emailToRemove: string) => {
    setSavedGoogleAccounts(prev => {
      const updated = prev.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase());
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  // Safe API helper with automatic device-id tracking
  const safeFetchJson = async <T = any>(
    url: string,
    options?: RequestInit
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> => {
    try {
      const headers = new Headers(options?.headers || {});
      headers.set('x-device-id', deviceId);

      const res = await fetch(url, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return { ok: res.ok, status: res.status, data, error: data?.error };
      }
      return {
        ok: false,
        status: res.status,
        error: res.status === 404
          ? 'Service route not found'
          : `Server communication response (${res.status}). Please try again.`
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 0,
        error: err?.message || 'Network communication error'
      };
    }
  };

  // Session verification and environment-aware direct access
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      if (currentToken) {
        try {
          const result = await safeFetchJson<{ user: UserProfile }>('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${currentToken}`
            }
          });
          if (isMounted) {
            if (result.ok && result.data?.user) {
              setUser(result.data.user);
              setToken(currentToken);
              localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
              setIsLoading(false);
              return;
            } else {
              handleClearAuth();
            }
          }
        } catch (err) {
          console.warn('Session check network warning:', err);
        }
      }

      // In AI Studio editor workshop, allow direct access to owner
      if (isEditorWorkshop()) {
        try {
          const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/owner-instant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entryRoute: window.location.pathname,
              deviceId
            })
          });
          if (isMounted && res.ok && res.data) {
            handleSetAuth(res.data.token, res.data.user);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Owner direct workshop access error:', err);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Periodic heartbeat for active multi-device tracking
  useEffect(() => {
    if (!token || !user) return;

    const sendHeartbeat = () => {
      fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-device-id': deviceId
        }
      }).catch(() => {});
    };

    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 25000);

    const handleBeforeUnload = () => {
      navigator.sendBeacon?.('/api/auth/disconnect', JSON.stringify({ token, deviceId }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token, user]);

  const handleClearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const handleSetAuth = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const openAuthModal = (tab?: 'signin' | 'signup' | 'guest') => {
    if (tab) {
      setAuthModalTab(tab);
    } else {
      setAuthModalTab(hasRegisteredBefore ? 'signin' : 'signup');
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openGoogleWindow = () => setIsGoogleWindowOpen(true);
  const closeGoogleWindow = () => setIsGoogleWindowOpen(false);

  const openAdminModal = () => setIsAdminModalOpen(true);
  const closeAdminModal = () => setIsAdminModalOpen(false);

  const openSettingsModal = (initialTab: string = 'general') => {
    setSettingsInitialTab(initialTab);
    setIsSettingsModalOpen(true);
  };
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  const openFeedbackModal = () => setIsFeedbackModalOpen(true);
  const closeFeedbackModal = () => setIsFeedbackModalOpen(false);

  const cancel2FA = () => {
    setIs2FAModalOpen(false);
    setTwoFactorChallenge(null);
  };

  // Verify 2FA One-Time Code
  const verify2FACode = async (code: string) => {
    if (!twoFactorChallenge) {
      return { success: false, error: 'No active verification session' };
    }
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { success: false, error: 'Please enter verification code' };
    }

    const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tempToken: twoFactorChallenge.tempToken,
        email: twoFactorChallenge.email,
        code: cleanCode,
        deviceId
      })
    });

    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Invalid verification code' };
    }

    handleSetAuth(res.data.token, res.data.user);
    localStorage.setItem(HAS_REGISTERED_KEY, 'true');
    setHasRegisteredBefore(true);
    setIs2FAModalOpen(false);
    setTwoFactorChallenge(null);
    closeAuthModal();
    closeGoogleWindow();
    return { success: true };
  };

  // Toggle 2FA in settings
  const toggle2FA = async (enable: boolean) => {
    if (!token) return { success: false, error: 'Not authenticated' };

    const res = await safeFetchJson<{ success: boolean; twoFactorEnabled: boolean; backupCodes?: string[] }>('/api/auth/2fa/toggle', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ enable })
    });

    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Failed to update 2FA' };
    }

    if (user) {
      const updated = { ...user, twoFactorEnabled: res.data.twoFactorEnabled };
      setUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }

    return { success: true, backupCodes: res.data.backupCodes };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    avatar?: string,
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner'
  ) => {
    const cleanEmail = email.trim().toLowerCase();

    // Strict Rule 2: Email validation
    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: INVALID_EMAIL_ERROR };
    }

    const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: cleanEmail,
        password,
        avatar,
        skillLevel,
        entryRoute: window.location.pathname,
        deviceId
      })
    });

    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Registration failed' };
    }

    handleSetAuth(res.data.token, res.data.user);
    localStorage.setItem(HAS_REGISTERED_KEY, 'true');
    setHasRegisteredBefore(true);
    closeAuthModal();
    return { success: true };
  };

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Strict Rule 2: Email validation
    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: INVALID_EMAIL_ERROR };
    }

    const res = await safeFetchJson<{
      user?: UserProfile;
      token?: string;
      require2FA?: boolean;
      tempToken?: string;
      email?: string;
      maskedEmail?: string;
      codePreview?: string;
    }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password,
        entryRoute: window.location.pathname,
        deviceId
      })
    });

    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Invalid email or password' };
    }

    // 2FA Challenge intercepted
    if (res.data.require2FA && res.data.tempToken) {
      setTwoFactorChallenge({
        tempToken: res.data.tempToken,
        email: res.data.email || cleanEmail,
        maskedEmail: res.data.maskedEmail || cleanEmail,
        codePreview: res.data.codePreview
      });
      setIs2FAModalOpen(true);
      return { success: false, require2FA: true };
    }

    if (res.data.token && res.data.user) {
      handleSetAuth(res.data.token, res.data.user);
      localStorage.setItem(HAS_REGISTERED_KEY, 'true');
      setHasRegisteredBefore(true);
      closeAuthModal();
      return { success: true };
    }

    return { success: false, error: 'Sign in failed' };
  };

  const loginAsGuest = async (name?: string) => {
    const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name?.trim() || undefined,
        entryRoute: window.location.pathname,
        deviceId
      })
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Guest sign-in failed' };
    }
    handleSetAuth(res.data.token, res.data.user);
    closeAuthModal();
    return { success: true };
  };

  const loginAsOwner = async () => {
    const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/owner-instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryRoute: window.location.pathname,
        deviceId
      })
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Owner sign-in failed' };
    }
    handleSetAuth(res.data.token, res.data.user);
    closeAuthModal();
    return { success: true };
  };

  const loginWithGoogle = async (email: string, name?: string, avatar?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Strict Rule 2: Email validation
    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: INVALID_EMAIL_ERROR };
    }

    const res = await safeFetchJson<{
      user?: UserProfile;
      token?: string;
      require2FA?: boolean;
      tempToken?: string;
      email?: string;
      maskedEmail?: string;
      codePreview?: string;
    }>('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: name?.trim() || undefined,
        avatar: avatar || undefined,
        entryRoute: window.location.pathname,
        deviceId
      })
    });

    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Google sign-in failed' };
    }

    // 2FA Challenge intercepted
    if (res.data.require2FA && res.data.tempToken) {
      setTwoFactorChallenge({
        tempToken: res.data.tempToken,
        email: res.data.email || cleanEmail,
        maskedEmail: res.data.maskedEmail || cleanEmail,
        codePreview: res.data.codePreview
      });
      setIs2FAModalOpen(true);
      return { success: false, require2FA: true };
    }

    if (res.data.token && res.data.user) {
      handleSetAuth(res.data.token, res.data.user);
      localStorage.setItem(HAS_REGISTERED_KEY, 'true');
      setHasRegisteredBefore(true);

      const accountEntry: SavedGoogleAccount = {
        email: res.data.user.email,
        name: res.data.user.name,
        avatar: res.data.user.avatar,
        lastUsed: new Date().toISOString()
      };
      setSavedGoogleAccounts(prev => {
        const filtered = prev.filter(a => a.email.toLowerCase() !== accountEntry.email.toLowerCase());
        const updated = [accountEntry, ...filtered].slice(0, 5);
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
        return updated;
      });

      closeAuthModal();
      closeGoogleWindow();
      return { success: true };
    }

    return { success: false, error: 'Google sign-in failed' };
  };

  const signInWithFirebaseGoogle = async () => {
    try {
      const result = await signInWithGooglePopup();
      if (!result.success || !result.user?.email) {
        return { 
          success: false, 
          error: result.error || 'Google sign-in did not provide an email address',
          isPopupBlocked: result.isPopupBlocked
        };
      }
      return await loginWithGoogle(
        result.user.email,
        result.user.displayName || undefined,
        result.user.photoURL || undefined
      );
    } catch (err: any) {
      const errStr = (err?.message || '').toLowerCase();
      const isBlocked = err?.code === 'auth/popup-blocked' || 
                        errStr.includes('popup') || 
                        errStr.includes('cancelled') ||
                        errStr.includes('closed-by-user');
      return {
        success: false,
        error: err?.message || 'Google authentication popup was not completed',
        isPopupBlocked: isBlocked
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-device-id': deviceId
          }
        });
      }
      await signOutFirebase();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      handleClearAuth();
    }
  };

  const logoutAllDevices = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout-all', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-device-id': deviceId
          }
        });
      }
      await signOutFirebase();
    } catch (err) {
      console.warn('Logout all error:', err);
    } finally {
      handleClearAuth();
    }
  };

  const updateProfile = async (updates: {
    name?: string;
    avatar?: string;
    skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  }) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    const res = await safeFetchJson<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Failed to update profile' };
    }
    setUser(res.data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        deviceId,
        isAuthenticated: Boolean(user),
        isLoading,
        isOwner,
        isAdmin,
        hasRegisteredBefore,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isGoogleWindowOpen,
        openGoogleWindow,
        closeGoogleWindow,
        isAdminModalOpen,
        openAdminModal,
        closeAdminModal,
        isSettingsModalOpen,
        settingsInitialTab,
        openSettingsModal,
        closeSettingsModal,
        isFeedbackModalOpen,
        openFeedbackModal,
        closeFeedbackModal,
        // 2FA
        is2FAModalOpen,
        twoFactorChallenge,
        verify2FACode,
        toggle2FA,
        cancel2FA,
        // Methods
        login,
        register,
        loginAsGuest,
        loginAsOwner,
        loginWithGoogle,
        signInWithFirebaseGoogle,
        isEditorWorkshop: isEditorWorkshop(),
        savedGoogleAccounts,
        removeSavedGoogleAccount,
        logout,
        logoutAllDevices,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
