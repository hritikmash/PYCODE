import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  UserCheck, 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AVATAR_OPTIONS = ['🐍', '⚡', '🚀', '🧠', '💻', '🤖', '🔮', '✨'];

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalTab, 
    login, 
    register, 
    loginAsGuest,
    openGoogleWindow 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'guest'>(authModalTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐍');
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [guestName, setGuestName] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync tab with context if opened with specific tab
  React.useEffect(() => {
    setActiveTab(authModalTab);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to sign in');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your display name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await register(name, email, password, selectedAvatar, skillLevel);
    setIsSubmitting(false);
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

  const handleGoogleSignIn = () => {
    openGoogleWindow();
  };

  const loadDemoViewer = () => {
    setEmail('viewer@pycode.dev');
    setPassword('pycode123');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
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
              <h3 className="font-semibold text-base text-white tracking-tight">Pycode Viewer Account</h3>
              <p className="text-[11px] text-[#8e918f]">Sign in to save Python sessions & personalized learning</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 rounded-full hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#282a2c] bg-[#1a1b1c] p-1 gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl transition-all ${
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
            onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-[#004a77] text-white shadow-xs'
                : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#232527]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('guest'); setErrorMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl transition-all ${
              activeTab === 'guest'
                ? 'bg-[#004a77] text-white shadow-xs'
                : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#232527]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Guest Access</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              {/* Direct Google Sign In Button */}
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

              <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="viewer@example.com"
                    required
                    className="w-full bg-[#131314] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#131314] border border-[#3b3d40] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e918f] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-sky-950/40"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Pycode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Demo Account Helper */}
              <div className="pt-2 border-t border-[#282a2c]/60 text-center">
                <button
                  type="button"
                  onClick={loadDemoViewer}
                  className="text-[11px] text-[#a8c7fa] hover:text-white hover:underline transition-colors"
                >
                  ⚡ Use Demo Viewer credentials (viewer@pycode.dev / pycode123)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: CREATE ACCOUNT */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    required
                    className="w-full bg-[#131314] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@domain.com"
                    required
                    className="w-full bg-[#131314] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full bg-[#131314] border border-[#3b3d40] rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e918f] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Avatar Picker & Skill Level in 2 columns */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-[#8e918f] mb-1">Pick Avatar</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_OPTIONS.slice(0, 6).map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                          selectedAvatar === av
                            ? 'bg-[#004a77] ring-2 ring-[#a8c7fa] scale-110'
                            : 'bg-[#131314] hover:bg-[#282a2c]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#8e918f] mb-1">Python Skill Level</label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as any)}
                    className="w-full bg-[#131314] border border-[#3b3d40] rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#a8c7fa] outline-none"
                  >
                    <option value="Beginner">Beginner (Simpler)</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced (Deep Dive)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-950/40"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account & Join</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: GUEST INSTANT ACCESS */}
          {activeTab === 'guest' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#131314] border border-[#282a2c] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Zap className="w-4 h-4" />
                  <span>Instant Viewer Access (No Password Required)</span>
                </div>
                <p className="text-[11px] text-[#8e918f] leading-relaxed">
                  Arrived from a shared link? Jump straight into testing Pycode with a temporary viewer handle. You can upgrade to a permanent account at any time.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                  Viewer Display Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Guest Python Explorer"
                    className="w-full bg-[#131314] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-orange-950/40"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Continue as Guest Viewer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
