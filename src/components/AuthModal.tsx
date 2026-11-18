import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth, GoogleAuthenticatorSetupData } from '../context/AuthContext';
import { GoogleAuthenticatorStep } from './GoogleAuthenticatorStep';
import { isValidEmail, INVALID_EMAIL_ERROR } from '../utils/validation';

const AVATAR_OPTIONS = ['🐍', '⚡', '🚀', '🧠', '💻', '🤖', '🔮', '✨'];

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalTab, 
    login, 
    register, 
    verifySignupAuthenticator,
    loginAsGuest,
    openGoogleWindow,
    signInWithFirebaseGoogle,
    hasRegisteredBefore
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'guest'>(authModalTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐍');
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [guestName, setGuestName] = useState('');
  const [protectWithGoogleAuth, setProtectWithGoogleAuth] = useState(true);
  const [signupSetupData, setSignupSetupData] = useState<GoogleAuthenticatorSetupData | null>(null);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync tab with context if opened with specific tab
  React.useEffect(() => {
    setActiveTab(authModalTab);
    setErrorMessage(null);
    setSignupSetupData(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage(INVALID_EMAIL_ERROR);
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await login(cleanEmail, password);
    setIsSubmitting(false);
    if (!res.success && !res.require2FA) {
      setErrorMessage(res.error || 'Failed to sign in');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your preferred name');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage(INVALID_EMAIL_ERROR);
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await register(
      name.trim(), 
      email.trim(), 
      password, 
      selectedAvatar, 
      skillLevel, 
      protectWithGoogleAuth
    );
    setIsSubmitting(false);

    if (res.requireAuthenticatorSetup && res.setupData) {
      setSignupSetupData(res.setupData);
      return;
    }

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create account');
    }
  };

  const handleGuestSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await loginAsGuest(guestName.trim() || undefined);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Guest sign-in failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Redirect user to the dedicated Google login window where they can use their own email
      openGoogleWindow();
      const res = await signInWithFirebaseGoogle();
      if (!res.success && !res.isPopupBlocked) {
        setErrorMessage(res.error || 'Google authentication failed');
      }
    } catch {
      openGoogleWindow();
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-md bg-[#1e1f20] border border-[#282a2c] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282a2c] bg-[#171819]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white tracking-tight">Pycode Account</h3>
              <p className="text-[11px] text-[#8e918f]">Multi-device synced Python workspace</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 rounded-full hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 5 Two-Option Authentication Tabs */}
        {!hasRegisteredBefore ? (
          <div className="flex border-b border-[#282a2c] bg-[#1a1b1c] p-1 gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-[#004a77] text-white shadow-xs'
                  : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#232527]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('guest'); setErrorMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'guest'
                  ? 'bg-[#004a77] text-white shadow-xs'
                  : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#232527]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In as Guest</span>
            </button>
          </div>
        ) : (
          <div className="flex border-b border-[#282a2c] bg-[#1a1b1c] p-1 gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-[#004a77] text-white shadow-xs'
                  : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#232527]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('guest'); setErrorMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'guest'
                  ? 'bg-[#004a77] text-white shadow-xs'
                  : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#232527]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Guest Login</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4">

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#282a2c]" />
                <span className="text-[10px] text-[#8e918f] uppercase font-mono tracking-wider">or email password</span>
                <div className="flex-1 h-px bg-[#282a2c]" />
              </div>

              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#c4c7c5]">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-[#141516] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#c4c7c5]">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#141516] border border-[#3b3d40] rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e918f] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
                  className="text-xs text-[#a8c7fa] hover:underline cursor-pointer"
                >
                  Need an account? Sign up
                </button>
              </div>
            </div>
          )}

          {/* TAB: SIGN UP */}
          {activeTab === 'signup' && (
            signupSetupData ? (
              <GoogleAuthenticatorStep
                setupData={signupSetupData}
                onVerify={(code) => verifySignupAuthenticator(signupSetupData.tempSignupToken, code)}
                onBack={() => setSignupSetupData(null)}
              />
            ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#c4c7c5]">
                    Your Name <span className="text-[#a8c7fa] text-[10px]">(preferred display name)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma, Madhav"
                      required
                      className="w-full bg-[#141516] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#c4c7c5]">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-[#141516] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#c4c7c5]">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-[#141516] border border-[#3b3d40] rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e918f] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Avatar Picker */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-[#8e918f]">Avatar Icon</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                          selectedAvatar === av
                            ? 'bg-sky-500/20 border-2 border-sky-400 scale-105'
                            : 'bg-[#141516] border border-[#282a2c] hover:border-[#3b3d40]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Google Authenticator Option */}
                <div className="p-3 rounded-xl bg-[#141516] border border-[#282a2c] hover:border-sky-500/40 transition-colors">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={protectWithGoogleAuth}
                      onChange={(e) => setProtectWithGoogleAuth(e.target.checked)}
                      className="mt-0.5 rounded border-[#3b3d40] text-sky-500 focus:ring-sky-400 bg-[#1c1d1f] cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-white">Protect with Google Authenticator</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-300 font-medium border border-sky-400/30">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e918f] leading-relaxed">
                        Scannable QR code setup to generate standard 6-digit TOTP codes from your phone.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating account...' : protectWithGoogleAuth ? 'Continue to Authenticator Setup' : 'Create Account'}
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
                  className="text-xs text-[#a8c7fa] hover:underline cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
            )
          )}

          {/* TAB: GUEST */}
          {activeTab === 'guest' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Instant Guest Access</span>
                </div>
                <p className="text-[11px] text-amber-200/70">
                  Quick guest session with Python execution. No password required.
                </p>
              </div>

              <form onSubmit={handleGuestSignIn} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#c4c7c5]">
                    Your Name or Handle <span className="text-[10px] text-[#8e918f]">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Sam, Python Explorer"
                      className="w-full bg-[#141516] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Entering as Guest...' : 'Enter Studio as Guest'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
