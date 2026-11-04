import React from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import { AnalysisMode } from '../types';
import { UserProfileDropdown } from './UserProfileDropdown';

interface GeminiHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  mode: AnalysisMode;
  onModeChange: (m: AnalysisMode) => void;
  onReset: () => void;
  userEmail?: string;
  selectedEngine?: any;
  onSelectEngine?: any;
  onOpenEngineModal?: any;
}

export const GeminiHeader: React.FC<GeminiHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  mode,
  onModeChange,
  onReset
}) => {
  return (
    <header className="h-14 border-b border-[#242828] px-2.5 sm:px-4 flex items-center justify-between bg-[#131414] z-30 shrink-0 select-none w-full gap-2">
      {/* Left: Mobile sidebar menu button (hidden on desktop where rail is visible) */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl bg-[#1e1f20] hover:bg-[#282a2c] text-[#8e918f] hover:text-white border border-[#282a2c] transition-colors cursor-pointer"
          title={sidebarOpen ? 'Close sidebar' : 'Open menu & chats'}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Center: Output Mode Segmented Control (Smoothly sized for mobile and desktop) */}
      <div className="flex items-center justify-center flex-1 max-w-xs sm:max-w-md mx-auto">
        <div className="flex items-center bg-[#1e1f20] border border-[#282a2c] p-0.5 sm:p-1 rounded-full text-xs shadow-xs">
          <button
            type="button"
            onClick={() => onModeChange('both')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all cursor-pointer font-medium text-[11px] sm:text-xs whitespace-nowrap ${
              mode === 'both'
                ? 'bg-[#282a2c] text-white shadow-xs font-semibold'
                : 'text-[#8e918f] hover:text-white'
            }`}
            title="Theory + Code pattern"
          >
            Theory + Code
          </button>
          <button
            type="button"
            onClick={() => onModeChange('code_only')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all cursor-pointer font-medium text-[11px] sm:text-xs whitespace-nowrap ${
              mode === 'code_only'
                ? 'bg-[#282a2c] text-white shadow-xs font-semibold'
                : 'text-[#8e918f] hover:text-white'
            }`}
            title="Code-focused pattern"
          >
            Code
          </button>
          <button
            type="button"
            onClick={() => onModeChange('theory_only')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all cursor-pointer font-medium text-[11px] sm:text-xs whitespace-nowrap ${
              mode === 'theory_only'
                ? 'bg-[#282a2c] text-white shadow-xs font-semibold'
                : 'text-[#8e918f] hover:text-white'
            }`}
            title="Theory-focused pattern"
          >
            Theory
          </button>
        </div>
      </div>

      {/* Right: Reset / New Chat + User Profile Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onReset}
          className="p-2 rounded-xl hover:bg-[#1e1f20] text-[#8e918f] hover:text-white transition-colors cursor-pointer border border-transparent hover:border-[#282a2c]"
          title="New Chat / Reset"
          aria-label="New chat or reset conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <UserProfileDropdown />
      </div>
    </header>
  );
};
