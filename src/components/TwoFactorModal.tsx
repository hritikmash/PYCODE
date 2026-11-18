import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, X, Copy, Check, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TwoFactorModal: React.FC = () => {
  const { is2FAModalOpen, twoFactorChallenge, verify2FACode, cancel2FA } = useAuth();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState<string>('');
  const [useBackupMode, setUseBackupMode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (is2FAModalOpen) {
      setDigits(['', '', '', '', '', '']);
      setBackupCode('');
      setErrorMessage(null);
      setUseBackupMode(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [is2FAModalOpen]);

  if (!is2FAModalOpen || !twoFactorChallenge) return null;

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of whole 6-digit code
    if (value.length > 1) {
      const sanitized = value.replace(/\D/g, '').slice(0, 6);
      if (sanitized.length > 0) {
        const nextDigits = [...digits];
        for (let i = 0; i < sanitized.length; i++) {
          nextDigits[i] = sanitized[i];
        }
        setDigits(nextDigits);
        const nextIndex = Math.min(sanitized.length, 5);
        inputRefs.current[nextIndex]?.focus();
        if (sanitized.length === 6) {
          submitCode(sanitized);
        }
      }
      return;
    }

    const nextChar = value.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextChar;
    setDigits(nextDigits);
    setErrorMessage(null);

    if (nextChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    if (nextChar && index === 5 && nextDigits.every(d => d !== '')) {
      submitCode(nextDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    const res = await verify2FACode(codeToVerify);
    setIsVerifying(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Invalid verification code');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useBackupMode) {
      if (!backupCode.trim()) {
        setErrorMessage('Please enter your backup code');
        return;
      }
      submitCode(backupCode.trim());
    } else {
      const code = digits.join('');
      if (code.length < 6) {
        setErrorMessage('Please enter all 6 digits');
        return;
      }
      submitCode(code);
    }
  };

  const handleAutofillDemoCode = () => {
    if (twoFactorChallenge.codePreview) {
      const code = twoFactorChallenge.codePreview;
      const chars = code.split('').slice(0, 6);
      setDigits(chars);
      submitCode(code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-md bg-[#191a1a] text-[#ededed] border border-[#2d3131] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={cancel2FA}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          title="Cancel verification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center mx-auto text-sky-400 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Google Authenticator Verification</h2>
          <p className="text-xs text-[#9e9e9e] leading-relaxed max-w-sm mx-auto">
            Open the <strong className="text-white">Google Authenticator</strong> app on your device and enter the 6-digit security code for{' '}
            <span className="text-[#ececec] font-medium font-mono">{twoFactorChallenge.maskedEmail}</span>.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo One-Time Code Preview Assistant */}
        {twoFactorChallenge.codePreview && !useBackupMode && (
          <div className="p-3.5 rounded-2xl bg-[#202222] border border-[#2d3131] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#20b8cd]" />
              <div>
                <span className="text-[#9e9e9e] text-[11px] block">Security Code Generated:</span>
                <span className="font-mono text-sm font-bold text-white tracking-wider">{twoFactorChallenge.codePreview}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutofillDemoCode}
              disabled={isVerifying}
              className="px-3 py-1.5 rounded-xl bg-[#20b8cd]/15 hover:bg-[#20b8cd]/25 border border-[#20b8cd]/40 text-[#20b8cd] font-medium text-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              Auto-fill Code
            </button>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {!useBackupMode ? (
            /* 6-Digit Code Inputs */
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={isVerifying}
                  className="w-11 h-14 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold bg-[#131414] border border-[#2d3131] focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] rounded-xl text-white outline-none transition-all disabled:opacity-50"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          ) : (
            /* Backup Code Input */
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#c4c7c5]">Emergency Backup Code</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e918f]" />
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 4B8A-7C1D"
                  className="w-full pl-10 pr-4 py-3 bg-[#131414] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-sm font-mono text-white placeholder-[#5c6166] outline-none"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#ededed] text-[#131414] font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] shadow-sm"
          >
            {isVerifying ? (
              <span>Verifying code...</span>
            ) : (
              <>
                <span>Complete Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Toggle Backup Code Mode */}
          <div className="flex items-center justify-between text-xs text-[#9e9e9e] pt-1">
            <button
              type="button"
              onClick={() => {
                setUseBackupMode(!useBackupMode);
                setErrorMessage(null);
              }}
              className="hover:text-white transition-colors cursor-pointer underline underline-offset-4"
            >
              {useBackupMode ? 'Use 6-digit verification code' : 'Lost device? Use emergency backup code'}
            </button>
            <button
              type="button"
              onClick={cancel2FA}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
