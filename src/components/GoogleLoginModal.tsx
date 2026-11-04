import React, { useState } from 'react';
import { X, ArrowRight, Shield, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OWNER_EMAIL = 'hritikyadav1612@gmail.com';

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useAuth();
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = googleEmail.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('INVALID EMAIL!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Auto derive clean display name if not typed
    let finalName = googleName.trim();
    if (!finalName) {
      const prefix = cleanEmail.split('@')[0];
      const clean = prefix.replace(/\d+$/, '');
      finalName = clean.length >= 2 
        ? clean.charAt(0).toUpperCase() + clean.slice(1) 
        : prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    const res = await loginWithGoogle(cleanEmail, finalName);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Google authentication failed. Please try again.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#202124] border border-[#3c4043] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#e8eaed] relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Google Bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          {/* Official Google G Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
            </svg>
            <span className="text-sm font-medium text-[#bdc1c6]">Google Sign-In</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#303134] text-[#9aa0a6] hover:text-white transition-colors cursor-pointer"
            title="Close window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-normal text-white tracking-tight">
              Sign in with Google
            </h2>
            <p className="text-xs text-[#9aa0a6]">
              to continue to <strong className="text-white font-medium">Pycode Studio</strong>
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#bdc1c6] mb-1.5">
                Your Google Email Address
              </label>
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => {
                  setGoogleEmail(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="name@gmail.com"
                required
                autoFocus
                className="w-full bg-[#171717] border border-[#5f6368] focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#80868b] outline-none transition-all"
              />
              <p className="text-[11px] text-[#9aa0a6] mt-1">
                Enter your personal or work Google email. You will be authenticated as yourself.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#bdc1c6] mb-1.5">
                Your Full Name (Optional)
              </label>
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full bg-[#171717] border border-[#5f6368] focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#80868b] outline-none transition-all"
              />
            </div>

            {/* Privacy notice */}
            <div className="p-3 rounded-xl bg-[#292a2d] border border-[#3c4043] text-[11px] text-[#9aa0a6] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#8ab4f8] shrink-0" />
              <span>Pycode will remember this device so you don&apos;t have to log in again.</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#8ab4f8] hover:bg-[#303134] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#202124] font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-95"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-[#202124]/30 border-t-[#202124] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Google Footer */}
        <div className="px-6 py-3 border-t border-[#3c4043] bg-[#18191b] flex items-center justify-between text-[11px] text-[#9aa0a6]">
          <span>English (United States)</span>
          <div className="flex items-center gap-3">
            <span className="hover:text-[#bdc1c6] cursor-pointer">Help</span>
            <span className="hover:text-[#bdc1c6] cursor-pointer">Privacy</span>
            <span className="hover:text-[#bdc1c6] cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
