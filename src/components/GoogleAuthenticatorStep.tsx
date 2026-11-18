import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight, 
  KeyRound, 
  AlertCircle, 
  QrCode, 
  ArrowLeft,
  Lock,
  Smartphone,
  Info
} from 'lucide-react';
import { GoogleAuthenticatorSetupData } from '../context/AuthContext';

interface GoogleAuthenticatorStepProps {
  setupData: GoogleAuthenticatorSetupData;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
  title?: string;
}

export const GoogleAuthenticatorStep: React.FC<GoogleAuthenticatorStepProps> = ({
  setupData,
  onVerify,
  onBack,
  title = 'Set Up Google Authenticator'
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState<string>('');
  const [useBackupMode, setUseBackupMode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState<boolean>(false);
  const [showManualKey, setShowManualKey] = useState<boolean>(false);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first digit box on load
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(setupData.rawSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    const text = setupData.backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of full 6-digit code
    if (value.length > 1) {
      const sanitized = value.replace(/\D/g, '').slice(0, 6);
      if (sanitized.length > 0) {
        const nextDigits = [...digits];
        for (let i = 0; i < sanitized.length; i++) {
          nextDigits[i] = sanitized[i];
        }
        setDigits(nextDigits);
        const nextIdx = Math.min(sanitized.length, 5);
        inputRefs.current[nextIdx]?.focus();
        if (sanitized.length === 6) {
          submitCode(sanitized);
        }
      }
      return;
    }

    const char = value.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);
    setErrorMessage(null);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (char && index === 5 && nextDigits.every(d => d !== '')) {
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
    const res = await onVerify(codeToVerify);
    setIsVerifying(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Invalid verification code');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useBackupMode) {
      if (!backupCode.trim()) {
        setErrorMessage('Please enter an emergency backup code');
        return;
      }
      submitCode(backupCode.trim());
    } else {
      const code = digits.join('');
      if (code.length < 6) {
        setErrorMessage('Please enter all 6 digits from Google Authenticator');
        return;
      }
      submitCode(code);
    }
  };

  const handleAutofillCode = () => {
    if (setupData.codePreview) {
      const chars = setupData.codePreview.split('').slice(0, 6);
      setDigits(chars);
      submitCode(setupData.codePreview);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header with Google Authenticator branding */}
      <div className="text-center space-y-1.5 pb-1">
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-[11px] font-medium mb-1">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Google Authenticator (2FA)</span>
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
          {title}
        </h3>
        <p className="text-xs text-[#9e9e9e] max-w-sm mx-auto leading-relaxed">
          Scan this QR code with the <strong className="text-white">Google Authenticator</strong> app on your phone to link your account.
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* QR Code Presentation Box */}
      <div className="p-4 rounded-2xl bg-[#141516] border border-[#282a2c] flex flex-col items-center justify-center space-y-3">
        <div className="relative p-2.5 bg-white rounded-2xl shadow-xl shadow-black/40 border-2 border-sky-500/30">
          <img 
            src={setupData.qrCodeDataUrl} 
            alt="Google Authenticator QR Code" 
            className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#8e918f]">
          <QrCode className="w-3.5 h-3.5 text-sky-400" />
          <span>Point your phone camera or authenticator app scanner here</span>
        </div>
      </div>

      {/* Manual Entry Key Toggle */}
      <div className="p-3 rounded-xl bg-[#141516] border border-[#282a2c] text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#c4c7c5] font-medium">Can&apos;t scan QR code?</span>
          <button
            type="button"
            onClick={() => setShowManualKey(!showManualKey)}
            className="text-[11px] text-[#a8c7fa] hover:underline cursor-pointer"
          >
            {showManualKey ? 'Hide setup key' : 'Enter key manually'}
          </button>
        </div>

        {showManualKey && (
          <div className="pt-1 space-y-1.5 animate-in fade-in duration-150">
            <span className="text-[10px] text-[#8e918f] block">Base32 Secret Key for manual entry:</span>
            <div className="flex items-center justify-between gap-2 p-2 bg-[#1c1d1f] rounded-lg border border-[#3b3d40] font-mono text-xs text-sky-300">
              <span className="select-all tracking-wider break-all">{setupData.secret}</span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="p-1.5 rounded-md hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer shrink-0"
                title="Copy secret key"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Backup Codes Toggle */}
      <div className="p-3 rounded-xl bg-[#141516] border border-[#282a2c] text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#c4c7c5] font-medium">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Emergency Recovery Codes</span>
          </div>
          <button
            type="button"
            onClick={() => setShowBackupCodes(!showBackupCodes)}
            className="text-[11px] text-[#a8c7fa] hover:underline cursor-pointer"
          >
            {showBackupCodes ? 'Hide' : `View 5 codes`}
          </button>
        </div>

        {showBackupCodes && (
          <div className="pt-1 space-y-2 animate-in fade-in duration-150">
            <p className="text-[10px] text-[#8e918f]">
              Save these one-time codes in a safe place. You can use them to sign in if you ever lose access to Google Authenticator:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[11px]">
              {setupData.backupCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 bg-[#1c1d1f] rounded border border-[#282a2c] text-center text-white select-all">
                  {code}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCopyBackupCodes}
              className="w-full py-1.5 rounded-lg bg-[#282a2c] hover:bg-[#3b3d40] text-xs text-[#c4c7c5] hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedBackupCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBackupCodes ? 'Codes Copied to Clipboard' : 'Copy All Backup Codes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Instant Test Code Auto-fill for Testing convenience */}
      {setupData.codePreview && !useBackupMode && (
        <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-800/40 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] text-[#c4c7c5]">
              Quick test code: <strong className="font-mono text-white font-bold">{setupData.codePreview}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleAutofillCode}
            disabled={isVerifying}
            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-medium border border-sky-400/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* Verification Code Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {!useBackupMode ? (
          <div className="space-y-1.5">
            <label className="block text-center text-xs font-medium text-[#c4c7c5]">
              Enter the 6-digit code shown in Google Authenticator:
            </label>
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
                  className="w-10 h-13 sm:w-11 sm:h-13 text-center font-mono text-lg font-bold bg-[#141516] border border-[#3b3d40] focus:border-sky-400 focus:ring-1 focus:ring-sky-400 rounded-xl text-white outline-none transition-all disabled:opacity-50"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#c4c7c5]">Emergency Backup Code</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="e.g. 4B8A-7C1D"
                className="w-full bg-[#141516] border border-[#3b3d40] rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-[#5e6160] focus:border-sky-400 outline-none"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <span>Verifying with Google Authenticator...</span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Complete Registration</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-xs text-[#8e918f] pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign Up</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUseBackupMode(!useBackupMode);
              setErrorMessage(null);
            }}
            className="hover:text-white transition-colors cursor-pointer underline underline-offset-4 text-[11px]"
          >
            {useBackupMode ? 'Use 6-digit TOTP' : 'Use emergency code'}
          </button>
        </div>
      </form>
    </div>
  );
};
