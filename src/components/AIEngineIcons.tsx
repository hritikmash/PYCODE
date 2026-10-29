import React from 'react';

interface EngineIconProps {
  className?: string;
}

export const GeminiIcon: React.FC<EngineIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
      fill="url(#gemini-engine-grad)"
    />
    <defs>
      <linearGradient id="gemini-engine-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="0.5" stopColor="#818cf8" />
        <stop offset="1" stopColor="#c084fc" />
      </linearGradient>
    </defs>
  </svg>
);

export const ChatGPTIcon: React.FC<EngineIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 10.15c-.2-.93-.65-1.78-1.32-2.45-.66-.66-1.5-1.12-2.42-1.33-.2-.58-.52-1.11-.94-1.55-.42-.44-.94-.78-1.51-1-.87-.33-1.82-.4-2.73-.2-.48.11-.94.3-1.36.56-.42-.26-.88-.45-1.36-.56-.91-.2-1.86-.13-2.73.2-.57.22-1.09.56-1.51 1-.42.44-.74.97-.94 1.55-.92.21-1.76.67-2.42 1.33-.67.67-1.12 1.52-1.32 2.45-.29.87-.33 1.81-.1 2.7.23.88.69 1.68 1.33 2.31-.05.32-.05.65 0 .97.1.66.36 1.28.76 1.81.4.53.93.94 1.54 1.2.87.37 1.83.47 2.76.3.36.46.82.84 1.35 1.1.53.27 1.12.41 1.72.41s1.19-.14 1.72-.41c.53-.26.99-.64 1.35-1.1.93.17 1.89.07 2.76-.3.61-.26 1.14-.67 1.54-1.2.4-.53.66-1.15.76-1.81.05-.32.05-.65 0-.97.64-.63 1.1-1.43 1.33-2.31.23-.89.19-1.83-.1-2.7zM12 14.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

export const PerplexityIcon: React.FC<EngineIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v7" />
    <path d="M12 15v7" />
    <path d="M4.93 4.93l4.95 4.95" />
    <path d="M14.12 14.12l4.95 4.95" />
    <path d="M2 12h7" />
    <path d="M15 12h7" />
    <path d="M4.93 19.07l4.95-4.95" />
    <path d="M14.12 9.88l4.95-4.95" />
  </svg>
);

export const BlackboxIcon: React.FC<EngineIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#09090b" stroke="#a855f7" strokeWidth="1.5" />
    <path d="M8 8l4 4-4 4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="14" y1="16" x2="17" y2="16" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const DeepSeekIcon: React.FC<EngineIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L3 21l3.5-.95C8.01 20.62 9.94 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" fill="#1e1b4b" stroke="#6366f1" />
    <circle cx="9" cy="11" r="1.5" fill="#818cf8" stroke="none" />
    <circle cx="15" cy="11" r="1.5" fill="#818cf8" stroke="none" />
    <path d="M8.5 15.5c1.5 1 5.5 1 7 0" stroke="#818cf8" />
  </svg>
);

export const TurboIcon: React.FC<EngineIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#10b981" stroke="#34d399" />
  </svg>
);

export const CopilotIcon: React.FC<EngineIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.5 7.5C17.5 5.01472 15.4853 3 13 3C10.5147 3 8.5 5.01472 8.5 7.5C8.5 8.13628 8.63228 8.74163 8.8711 9.29054L5.61715 12.5445C4.60803 13.5536 4.04163 14.9224 4.04163 16.3498C4.04163 19.3242 6.45137 21.734 9.42579 21.734C10.8532 21.734 12.222 21.1676 13.2311 20.1585L16.4851 16.9045C17.034 17.1434 17.6393 17.2756 18.2756 17.2756C20.7609 17.2756 22.7756 15.2609 22.7756 12.7756C22.7756 10.2904 20.7609 8.27563 18.2756 8.27563C18.0125 8.27563 17.7533 8.29822 17.5 8.34149V7.5Z"
      fill="url(#copilot-grad-1)"
    />
    <path
      d="M14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5C13.3807 14.5 14.5 13.3807 14.5 12Z"
      fill="#ffffff"
      fillOpacity="0.85"
    />
    <defs>
      <linearGradient id="copilot-grad-1" x1="4" y1="3" x2="22.7" y2="21.7" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00d2ff" />
        <stop offset="0.35" stopColor="#0078d4" />
        <stop offset="0.7" stopColor="#8040ff" />
        <stop offset="1" stopColor="#ff4080" />
      </linearGradient>
    </defs>
  </svg>
);

export const renderEngineIcon = (iconType: string, className = 'w-4 h-4') => {
  switch (iconType) {
    case 'gemini':
      return <GeminiIcon className={className} />;
    case 'copilot':
      return <CopilotIcon className={className} />;
    case 'chatgpt':
      return <ChatGPTIcon className={className} />;
    case 'perplexity':
      return <PerplexityIcon className={className} />;
    case 'blackbox':
      return <BlackboxIcon className={className} />;
    case 'deepseek':
      return <DeepSeekIcon className={className} />;
    case 'turbo':
    default:
      return <TurboIcon className={className} />;
  }
};
