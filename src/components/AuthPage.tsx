import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Zap, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Terminal,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { useAuth, GoogleAuthenticatorSetupData } from '../context/AuthContext';
import { GoogleLoginWindow } from './GoogleLoginWindow';
import { TwoFactorModal } from './TwoFactorModal';
import { GoogleAuthenticatorStep } from './GoogleAuthenticatorStep';
import { isValidEmail, INVALID_EMAIL_ERROR } from '../utils/validation';

const AVATAR_OPTIONS = ['🐍', '⚡', '🚀', '🧠', '💻', '🤖', '🔮', '✨'];

export const AuthPage: React.FC = () => {
  const { 
    login, 
    register, 
    verifySignupAuthenticator,
    loginAsGuest, 
    openGoogleWindow, 
    signInWithFirebaseGoogle, 
    hasRegisteredBefore 
  } = useAuth();

  // If user has registered before, default to 'signin'; otherwise initial screen defaults to 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'guest'>(() => 
    hasRegisteredBefore ? 'signin' : 'signup'
  );

  useEffect(() => {
    setActiveTab(hasRegisteredBefore ? 'signin' : 'signup');
  }, [hasRegisteredBefore]);

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
      setErrorMessage(res.error || 'Invalid email or password');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
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
      setErrorMessage(res.error || 'Guest access failed');
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
    <div className="min-h-screen w-full bg-[#0e0f10] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-950/50 mb-2 border border-white/10">
            <span className="text-2xl">🐍</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Pycode</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-950/80 text-sky-400 border border-sky-800/60 font-medium">
              v2.0
            </span>
          </h1>
          <p className="text-xs text-[#8e918f] max-w-xs mx-auto leading-relaxed">
            AI-Powered Python Learning & Diagnostic Studio. Please sign in to access your workspace.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#1e1f20]/95 backdrop-blur-md border border-[#282a2c] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5">
          {/* Section 5 Two-Option Authentication Tabs:
              - New visitor: [Sign Up] & [Sign In as Guest]
              - After successful signup / returning user: [Sign In] & [Guest Login] */}
          {!hasRegisteredBefore ? (
            <div className="flex border border-[#282a2c] bg-[#141516] rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-[#004a77] text-white shadow-sm'
                    : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#202224]'
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
                    ? 'bg-[#004a77] text-white shadow-sm'
                    : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#202224]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In as Guest</span>
              </button>
            </div>
          ) : (
            <div className="flex border border-[#282a2c] bg-[#141516] rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-[#004a77] text-white shadow-sm'
                    : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#202224]'
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
                    ? 'bg-[#004a77] text-white shadow-sm'
                    : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#202224]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Guest Login</span>
              </button>
            </div>
          )}


          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm active:scale-[0.99]"
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
                <span className="text-[10px] text-[#8e918f] uppercase font-mono tracking-wider">or sign in with email</span>
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
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 mt-1"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* Secondary switch to signup if user wants to create a new account */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
                  className="text-xs text-[#a8c7fa] hover:underline cursor-pointer"
                >
                  Need a new account? Create one here
                </button>
              </div>
            </div>
          )}

          {/* TAB: SIGN UP (Section 1: Personalized preferred display name) */}
          {activeTab === 'signup' && (
            signupSetupData ? (
              <GoogleAuthenticatorStep
                setupData={signupSetupData}
                onVerify={(code) => verifySignupAuthenticator(signupSetupData.tempSignupToken, code)}
                onBack={() => setSignupSetupData(null)}
              />
            ) : (
            <div className="space-y-4">
              {/* Google Sign In Option */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm active:scale-[0.99]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#282a2c]" />
                <span className="text-[10px] text-[#8e918f] uppercase font-mono tracking-wider">or create account</span>
                <div className="flex-1 h-px bg-[#282a2c]" />
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* Explicit Name Input - prioritized for all greetings */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#c4c7c5]">
                    Your Name <span className="text-[#a8c7fa] text-[10px]">(used to personalize your workspace)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma, Madhav, Priya"
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
                  <label className="block text-xs font-medium text-[#c4c7c5]">Password (min 6 characters)</label>
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
                  <label className="block text-[11px] font-medium text-[#8e918f]">Choose Avatar</label>
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

                {/* Google Authenticator (2FA) Option */}
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
                        <span className="text-xs font-semibold text-white">Protect account with Google Authenticator</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-300 font-medium border border-sky-400/30">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e918f] leading-relaxed">
                        Generate a scannable QR code during sign up to link 6-digit TOTP security for iOS and Android.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 mt-1"
                >
                  {isSubmitting ? 'Creating account...' : protectWithGoogleAuth ? 'Continue to Authenticator Setup' : 'Create Account'}
                </button>
              </form>

              {/* Secondary switch to sign in */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
                  className="text-xs text-[#a8c7fa] hover:underline cursor-pointer"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
            )
          )}

          {/* TAB: GUEST (Temporary guest session) */}
          {activeTab === 'guest' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Instant Guest Access</span>
                </div>
                <p className="text-[11px] text-amber-200/70">
                  Explore Python diagnostics immediately without a password. Guest sessions are limited to viewer privileges.
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
                      placeholder="e.g. Sam, Python Learner"
                      className="w-full bg-[#141516] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Entering as Guest...' : 'Enter Studio as Guest'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Security & Feature Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-[#8e918f]">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Multi-Device Session</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Python 3.10 Sandboxed</span>
          </span>
        </div>
      </div>

      {/* Separate Google Account Login Window */}
      <GoogleLoginWindow />

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal />
    </div>
  );
};
