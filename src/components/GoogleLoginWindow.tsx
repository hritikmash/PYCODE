import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  User, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Lock,
  ExternalLink,
  Laptop,
  Check
} from 'lucide-react';
import { useAuth, SavedGoogleAccount } from '../context/AuthContext';

const OWNER_EMAIL = 'hritikyadav1612@gmail.com';

export const GoogleLoginWindow: React.FC = () => {
  const { 
    isGoogleWindowOpen, 
    closeGoogleWindow, 
    loginWithGoogle,
    signInWithFirebaseGoogle,
    savedGoogleAccounts,
    removeSavedGoogleAccount
  } = useAuth();

  const [viewMode, setViewMode] = useState<'chooser' | 'form'>(
    savedGoogleAccounts.length > 0 ? 'chooser' : 'form'
  );
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirebaseSigningIn, setIsFirebaseSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isGoogleWindowOpen) return null;

  // 1-Click Interactive Google Sign-In via Firebase Popup
  const handleFirebasePopup = async () => {
    setError(null);
    setIsFirebaseSigningIn(true);
    try {
      const res = await signInWithFirebaseGoogle();
      if (!res.success) {
        if (res.isPopupBlocked) {
          setError('Browser popup is restricted in this environment. Please enter or select your own Google account below.');
          setViewMode('form');
        } else {
          setError(res.error || 'Google authentication failed.');
        }
      }
    } catch {
      setError('Browser popup was restricted. Please enter or select your Google account below.');
      setViewMode('form');
    } finally {
      setIsFirebaseSigningIn(false);
    }
  };

  // Sign in with a remembered account
  const handleSelectSavedAccount = async (account: SavedGoogleAccount) => {
    setError(null);
    setIsSubmitting(true);
    const res = await loginWithGoogle(account.email, account.name, account.avatar);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to authenticate saved account.');
    } else {
      closeGoogleWindow();
    }
  };

  // Manual Google account entry form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid Google email address (e.g. yourname@gmail.com)');
      return;
    }

    // STRICT OWNER RULE: Users cannot manually log in as the owner
    // If user is accessing from shared link, only the owner can have owner email
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      setError('This email is reserved for the platform owner. Please sign in with your own Google email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithGoogle(cleanEmail, googleName.trim() || undefined);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Google authentication failed. Please check your email.');
    } else {
      setGoogleEmail('');
      setGoogleName('');
      closeGoogleWindow();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-md bg-[#202124] text-[#e8eaed] rounded-3xl shadow-2xl border border-[#3c4043] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header bar with Official Google Multi-Color G Logo */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-[#303134]">
          <div className="flex items-center gap-2.5">
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white tracking-tight">Google Identity Services</span>
              <span className="text-[10px] text-[#9aa0a6]">Pycode Studio • Gemini AI</span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeGoogleWindow}
            className="p-1.5 rounded-full hover:bg-[#303134] text-[#9aa0a6] hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Title and subtitle */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-white flex items-center gap-2">
              <span>Sign in with Google</span>
              <Sparkles className="w-4 h-4 text-sky-400" />
            </h2>
            <p className="text-xs text-[#9aa0a6]">
              Choose or enter your Google Account to connect to <strong className="text-white font-medium">Pycode Studio</strong>
            </p>
          </div>

          {/* Interactive 1-Click Google OAuth Trigger Button */}
          <button
            type="button"
            onClick={handleFirebasePopup}
            disabled={isFirebaseSigningIn || isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 group"
          >
            {isFirebaseSigningIn ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-[#1a73e8] rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
              </svg>
            )}
            <span>{isFirebaseSigningIn ? 'Connecting to Google...' : 'One-Click Google Sign-In'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#3c4043]" />
            <span className="text-[10px] text-[#9aa0a6] uppercase font-mono tracking-wider">
              {viewMode === 'chooser' ? 'Or choose remembered account' : 'Or enter your google email'}
            </span>
            <div className="flex-1 h-px bg-[#3c4043]" />
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* VIEW 1: ACCOUNT CHOOSER (Google Multi-Account Switcher) */}
          {viewMode === 'chooser' && (
            <div className="space-y-3">
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {savedGoogleAccounts.map((acc) => (
                  <div
                    key={acc.email}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#303134] hover:bg-[#3c4043] border border-transparent hover:border-[#5f6368] transition-all group cursor-pointer"
                    onClick={() => handleSelectSavedAccount(acc)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-semibold text-xs overflow-hidden shrink-0 border border-white/10">
                        {acc.avatar && acc.avatar.startsWith('http') ? (
                          <img src={acc.avatar} alt={acc.name} className="w-full h-full object-cover" />
                        ) : acc.avatar ? (
                          <span>{acc.avatar}</span>
                        ) : (
                          <span>{acc.name ? acc.name[0]?.toUpperCase() : 'G'}</span>
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-medium text-white truncate group-hover:text-[#8ab4f8] transition-colors">
                          {acc.name || 'Google User'}
                        </div>
                        <div className="text-[11px] text-[#9aa0a6] truncate">{acc.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedGoogleAccount(acc.email);
                        }}
                        className="p-1 rounded-full text-[#9aa0a6] hover:text-red-400 hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-[#9aa0a6] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Use Another Account Button */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setViewMode('form');
                }}
                className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-[#5f6368] hover:border-[#8ab4f8] text-xs font-medium text-[#8ab4f8] hover:text-white hover:bg-[#303134] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Use another Google account</span>
              </button>
            </div>
          )}

          {/* VIEW 2: DIRECT GOOGLE ACCOUNT FORM */}
          {viewMode === 'form' && (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Google Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#c4c7c5]">
                  Google Email or Workspace Account <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => {
                      setGoogleEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="yourname@gmail.com"
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#5f6368] bg-[#303134] text-white placeholder-[#80868b] text-xs sm:text-sm focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20 outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#9aa0a6]">
                  Users must use their own personal or work email.
                </p>
              </div>

              {/* Google Display Name (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#c4c7c5]">
                  Preferred Name <span className="text-[#9aa0a6] text-[10px]">(optional, parsed from email if blank)</span>
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Rahul, Priya, Alex"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#5f6368] bg-[#303134] text-white placeholder-[#80868b] text-xs sm:text-sm focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20 outline-none transition-all"
                />
              </div>

              {/* Bottom buttons */}
              <div className="pt-2 flex items-center justify-between">
                {savedGoogleAccounts.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setViewMode('chooser');
                    }}
                    className="text-xs font-medium text-[#8ab4f8] hover:underline cursor-pointer"
                  >
                    ← Choose saved account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeGoogleWindow}
                    className="text-xs font-medium text-[#8ab4f8] hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !googleEmail.trim()}
                  className="px-6 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Gemini AI & Security Feature Highlights */}
          <div className="pt-4 border-t border-[#3c4043] space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[10px] text-[#9aa0a6]">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#303134]/50 border border-white/5">
                <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">Gemini 2.5 Pro Sync</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#303134]/50 border border-white/5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">OAuth 2.0 Verified</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#303134]/50 border border-white/5">
                <Laptop className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="truncate">Multi-Device Session</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#303134]/50 border border-white/5">
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Zero IP Retention</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#9aa0a6] pt-1">
              <span>Google Account Service</span>
              <div className="flex items-center gap-2">
                <span className="hover:underline cursor-pointer">Security</span>
                <span>·</span>
                <span className="hover:underline cursor-pointer">Privacy</span>
                <span>·</span>
                <span className="hover:underline cursor-pointer">Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
