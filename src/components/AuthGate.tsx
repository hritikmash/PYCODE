import React, { useState } from 'react';
import { 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Zap, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Terminal, 
  ShieldCheck, 
  Code2, 
  ArrowRight,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GeminiSparkle } from './GeminiIcons';

const AVATAR_OPTIONS = ['🐍', '⚡', '🚀', '🧠', '💻', '🤖', '🔮', '✨'];

export const AuthGate: React.FC = () => {
  const { login, register, loginAsGuest } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'guest'>('signin');

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Invalid email or password');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
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

  const fillDemoCredentials = () => {
    setEmail('viewer@pycode.dev');
    setPassword('pycode123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#0e0f10] text-[#e3e3e3] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient glowing spheres */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#282a2c]/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <GeminiSparkle className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">Pycode</span>
            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e1f20] text-emerald-400 border border-[#282a2c]">
              Python 3.10
            </span>
          </div>
        </div>
        <div className="text-xs text-[#8e918f] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Protected Gateway</span>
        </div>
      </header>

      {/* Main Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="w-full max-w-lg bg-[#18191a] border border-[#2d2f31] rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col">
          {/* Header Banner */}
          <div className="p-6 pb-4 border-b border-[#282a2c] bg-gradient-to-b from-[#1f2022] to-[#18191a] text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-400 text-xs font-medium mb-3">
              <Lock className="w-3.5 h-3.5" />
              <span>Authentication Required</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Sign In to Access Pycode
            </h1>
            <p className="text-xs text-[#8e918f] mt-1.5 max-w-sm mx-auto">
              Please authenticate to enter your interactive Python learning studio, real execution trace, and flowchart breakdowns.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-[#282a2c] bg-[#141516] p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-[#004a77] text-white shadow-xs font-semibold'
                  : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#1f2022]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-[#004a77] text-white shadow-xs font-semibold'
                  : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#1f2022]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('guest'); setErrorMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'guest'
                  ? 'bg-[#004a77] text-white shadow-xs font-semibold'
                  : 'text-[#8e918f] hover:text-[#c4c7c5] hover:bg-[#1f2022]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Guest Access</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="viewer@pycode.dev"
                      required
                      className="w-full bg-[#121314] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] outline-none transition-all"
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
                      className="w-full bg-[#121314] border border-[#3b3d40] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] outline-none transition-all"
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-sky-950/60"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In & Open Pycode</span>
                        <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                      </>
                    )}
                  </button>
                </div>

                {/* 1-Click Demo Shortcut */}
                <div className="pt-3 border-t border-[#282a2c] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="text-[11px] text-[#a8c7fa] hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fill Demo Credentials (viewer@pycode.dev)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('guest')}
                    className="text-[11px] text-[#8e918f] hover:text-[#c4c7c5]"
                  >
                    Skip as Guest →
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREATE ACCOUNT */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Chen"
                      required
                      className="w-full bg-[#121314] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
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
                      placeholder="alex@example.com"
                      required
                      className="w-full bg-[#121314] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
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
                      className="w-full bg-[#121314] border border-[#3b3d40] rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
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

                {/* Avatar and Skill Level */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8e918f] mb-1">Choose Avatar</label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_OPTIONS.slice(0, 6).map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                            selectedAvatar === av
                              ? 'bg-[#004a77] ring-2 ring-[#a8c7fa] scale-105'
                              : 'bg-[#121314] hover:bg-[#282a2c]'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#8e918f] mb-1">Skill Depth</label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value as any)}
                      className="w-full bg-[#121314] border border-[#3b3d40] rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#a8c7fa] outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-950/60"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account & Enter Pycode</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: GUEST ACCESS */}
            {activeTab === 'guest' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#121314] border border-[#282a2c] space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <Zap className="w-4 h-4" />
                    <span>Instant Shared Viewer Access</span>
                  </div>
                  <p className="text-[11px] text-[#8e918f] leading-relaxed">
                    Opening through a shared link or just checking it out? Jump right in without creating a password. Your session will remain saved until you sign out.
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
                      placeholder="e.g. Python Explorer"
                      className="w-full bg-[#121314] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-orange-950/60"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Continue as Guest Viewer</span>
                        <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Features Bar */}
      <footer className="w-full px-6 py-3 border-t border-[#282a2c]/60 bg-[#121314]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#8e918f]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Subprocess Runner
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Deterministic Syntax & Logic Grounding</span>
        </div>
        <div className="font-mono text-[10px] text-[#5e6160]">
          Pycode v2.0 • AI-Powered Explainer
        </div>
      </footer>
    </div>
  );
};
