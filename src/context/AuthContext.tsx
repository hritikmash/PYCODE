import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithGooglePopup, signOutFirebase } from '../firebase';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: string;
  lastLoginAt: string;
}

export interface SavedGoogleAccount {
  email: string;
  name: string;
  avatar?: string;
  lastUsed: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
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
  isFeedbackModalOpen: boolean;
  openFeedbackModal: () => void;
  closeFeedbackModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    avatar?: string,
    skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced'
  ) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: (name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, name?: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithFirebaseGoogle: () => Promise<{ success: boolean; error?: string; isPopupBlocked?: boolean }>;
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
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
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

  // Safe API helper to prevent 'Unexpected token < in JSON' SyntaxErrors if server or proxy returns HTML
  const safeFetchJson = async <T = any>(
    url: string,
    options?: RequestInit
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return { ok: res.ok, status: res.status, data, error: data?.error };
      }
      // Non-JSON (e.g. HTML error or doctype)
      const text = await res.text();
      console.warn(`Server returned non-JSON (${res.status}) from ${url}:`, text.slice(0, 100));
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

  // Session verification on mount (Restores session across refreshes without prompt)
  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await safeFetchJson<{ user: UserProfile }>('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (result.ok && result.data?.user) {
          setUser(result.data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
        } else {
          handleClearAuth();
        }
      } catch (err) {
        console.warn('Session check network warning, keeping cached session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [token]);

  // Periodic heartbeat for active multi-device tracking
  useEffect(() => {
    if (!token || !user) return;

    const sendHeartbeat = () => {
      fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    };

    // Send immediate heartbeat on session start
    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 25000);

    const handleBeforeUnload = () => {
      navigator.sendBeacon?.('/api/auth/disconnect', JSON.stringify({ token }));
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
      // Default: If user has registered before, offer Sign In & Guest; else Sign Up & Guest
      setAuthModalTab(hasRegisteredBefore ? 'signin' : 'signup');
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openGoogleWindow = () => setIsGoogleWindowOpen(true);
  const closeGoogleWindow = () => setIsGoogleWindowOpen(false);

  const openAdminModal = () => setIsAdminModalOpen(true);
  const closeAdminModal = () => setIsAdminModalOpen(false);

  const openFeedbackModal = () => setIsFeedbackModalOpen(true);
  const closeFeedbackModal = () => setIsFeedbackModalOpen(false);

  const register = async (
    name: string,
    email: string,
    password: string,
    avatar?: string,
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner'
  ) => {
    const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        avatar,
        skillLevel,
        entryRoute: window.location.pathname
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
    const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        entryRoute: window.location.pathname
      })
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Invalid credentials' };
    }
    handleSetAuth(res.data.token, res.data.user);
    localStorage.setItem(HAS_REGISTERED_KEY, 'true');
    setHasRegisteredBefore(true);
    closeAuthModal();
    return { success: true };
  };

  const loginAsGuest = async (name?: string) => {
    const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name?.trim() || undefined,
        entryRoute: window.location.pathname
      })
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Guest sign-in failed' };
    }
    handleSetAuth(res.data.token, res.data.user);
    closeAuthModal();
    return { success: true };
  };

  const loginWithGoogle = async (email: string, name?: string, avatar?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter your own Google email address' };
    }

    const res = await safeFetchJson<{ user: UserProfile; token: string }>('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: name?.trim() || undefined,
        avatar: avatar || undefined,
        entryRoute: window.location.pathname
      })
    });

    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Google sign-in failed' };
    }

    handleSetAuth(res.data.token, res.data.user);
    localStorage.setItem(HAS_REGISTERED_KEY, 'true');
    setHasRegisteredBefore(true);

    // Save to remembered accounts on this device
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
  };

  /**
   * Google Sign-In with official Account Chooser.
   * If popup is restricted in the iframe, automatically and smoothly opens the separate
   * dedicated Google login window so user can sign in with their own email.
   */
  const signInWithFirebaseGoogle = async () => {
    try {
      const result = await signInWithGooglePopup();
      if (!result.success || !result.user) {
        // As requested: "if user select google method then redirect them to separate login window there they will login from their own email"
        openGoogleWindow();
        return {
          success: true,
          isPopupBlocked: true
        };
      }

      const { email, displayName, photoURL } = result.user;
      return await loginWithGoogle(email, displayName, photoURL);
    } catch {
      openGoogleWindow();
      return {
        success: true,
        isPopupBlocked: true
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
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
          headers: { Authorization: `Bearer ${token}` }
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
        isFeedbackModalOpen,
        openFeedbackModal,
        closeFeedbackModal,
        login,
        register,
        loginAsGuest,
        loginWithGoogle,
        signInWithFirebaseGoogle,
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
