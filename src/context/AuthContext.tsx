import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'signup' | 'guest';
  openAuthModal: (tab?: 'signin' | 'signup' | 'guest') => void;
  closeAuthModal: () => void;
  isViewerLogsModalOpen: boolean;
  viewerLoginsCount: number;
  openViewerLogsModal: () => void;
  closeViewerLogsModal: () => void;
  isGoogleWindowOpen: boolean;
  openGoogleWindow: () => void;
  closeGoogleWindow: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, avatar?: string, skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced') => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: (name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'name' | 'avatar' | 'skillLevel'>>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'pycode_viewer_auth_token';
const USER_KEY = 'pycode_viewer_profile';
const OWNER_EMAIL = 'hritikyadav1612@gmail.com';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [isViewerLogsModalOpen, setIsViewerLogsModalOpen] = useState<boolean>(false);
  const [viewerLoginsCount, setViewerLoginsCount] = useState<number>(0);
  const [isGoogleWindowOpen, setIsGoogleWindowOpen] = useState<boolean>(false);

  const isOwner = Boolean(
    user && (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase() || user.role === 'admin')
  );

  // Poll viewer logins for owner
  useEffect(() => {
    if (!isOwner) return;
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/owner/viewer-logins');
        if (res.ok) {
          const data = await res.json();
          setViewerLoginsCount(data.totalCount || 0);
        }
      } catch {}
    };
    fetchCount();
    const timer = setInterval(fetchCount, 15000);
    return () => clearInterval(timer);
  }, [isOwner]);

  // Verify session on mount (Secret rule: never ask for authentication from the owner)
  useEffect(() => {
    const checkSession = async () => {
      const isOwnerEnv = 
        window.location.hostname.includes('ais-dev-') || 
        window.location.hostname === 'localhost' ||
        window.location.search.includes('owner') ||
        localStorage.getItem('pycode_is_owner') === 'true';

      // Auto-authenticate owner if on development workspace or owner flag is set
      if (!token && isOwnerEnv) {
        try {
          const ownerRes = await fetch('/api/auth/owner-session');
          if (ownerRes.ok) {
            const ownerData = await ownerRes.json();
            if (ownerData.user && ownerData.token) {
              handleSetAuth(ownerData.token, ownerData.user);
              localStorage.setItem('pycode_is_owner', 'true');
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Owner auto session check failed:', e);
        }
      }

      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            if (data.user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
              localStorage.setItem('pycode_is_owner', 'true');
            }
          } else {
            handleClearAuth();
          }
        } else {
          handleClearAuth();
        }
      } catch (err) {
        console.warn('Auth check network warning, keeping cached session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [token]);

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

  const openAuthModal = (tab: 'signin' | 'signup' | 'guest' = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      handleSetAuth(data.token, data.user);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    avatar?: string,
    skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced'
  ) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, avatar, skillLevel })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      handleSetAuth(data.token, data.user);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const loginAsGuest = async (name?: string) => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Guest login failed' };
      }
      handleSetAuth(data.token, data.user);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during guest login' };
    }
  };

  const loginWithGoogle = async (email: string, name?: string) => {
    if (!email || !email.trim() || !email.includes('@')) {
      return { success: false, error: 'Please enter your own Google email address' };
    }
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(),
          name: name?.trim() || undefined 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google sign-in failed' };
      }
      handleSetAuth(data.token, data.user);
      closeAuthModal();
      closeGoogleWindow();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during Google sign-in' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      handleClearAuth();
    }
  };

  const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'name' | 'avatar' | 'skillLevel'>>
  ) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Update failed' };
    }
  };

  const openViewerLogsModal = () => setIsViewerLogsModalOpen(true);
  const closeViewerLogsModal = () => setIsViewerLogsModalOpen(false);
  const openGoogleWindow = () => setIsGoogleWindowOpen(true);
  const closeGoogleWindow = () => setIsGoogleWindowOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        isOwner,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isViewerLogsModalOpen,
        viewerLoginsCount,
        openViewerLogsModal,
        closeViewerLogsModal,
        isGoogleWindowOpen,
        openGoogleWindow,
        closeGoogleWindow,
        login,
        register,
        loginAsGuest,
        loginWithGoogle,
        logout,
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
