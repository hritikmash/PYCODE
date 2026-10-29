import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GoogleLoginWindow: React.FC = () => {
  const { isGoogleWindowOpen, closeGoogleWindow, loginWithGoogle } = useAuth();
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isGoogleWindowOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid Google email address (e.g. yourname@gmail.com)');
      return;
    }

    // Owner protection rule: non-owners cannot use owner's email without owner dev environment
    const isOwnerWorkspace = 
      window.location.hostname.includes('ais-dev-') || 
      window.location.hostname === 'localhost' ||
      window.location.search.includes('owner');

    if (cleanEmail === 'hritikyadav1612@gmail.com' && !isOwnerWorkspace) {
      setError('This is the reserved owner account. Please sign in using your own personal or workspace Google email.');
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
        className="w-full max-w-md bg-[#ffffff] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#3c4043] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          {/* Authentic Google Multi-Color Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
            </svg>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Google Accounts</span>
          </div>

          <button
            type="button"
            onClick={closeGoogleWindow}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#303134] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-normal tracking-tight text-gray-900 dark:text-white">
              Sign in with Google
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              to continue to <span className="font-semibold text-gray-900 dark:text-white">Pycode Studio</span>
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Google Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Email or phone <span className="text-red-500">*</span>
              </label>
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
                className="w-full px-3.5 py-3 rounded-xl border border-gray-300 dark:border-[#5f6368] bg-white dark:bg-[#303134] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#1a73e8]/20 outline-none transition-all"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                You must sign in with your own Google account
              </p>
            </div>

            {/* Google Name Input (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Your Name <span className="text-gray-400 text-[10px]">(optional, fetched from email if blank)</span>
              </label>
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="e.g. Alex, Sam"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#5f6368] bg-white dark:bg-[#303134] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#1a73e8]/20 outline-none transition-all"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={closeGoogleWindow}
                className="text-xs font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !googleEmail.trim()}
                className="px-6 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Privacy & info disclaimer */}
          <div className="pt-4 border-t border-gray-200 dark:border-[#3c4043] text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secure Google Authentication</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="hover:underline cursor-pointer">Help</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Privacy</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Terms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
