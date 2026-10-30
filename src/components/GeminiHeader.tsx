import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Sparkles, 
  RefreshCw, 
  ChevronDown, 
  Check, 
  Zap, 
  Settings,
  Sliders,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GeminiSparkle } from './GeminiIcons';
import { AnalysisMode, AIEngineId } from '../types';
import { AI_ENGINES } from '../constants/aiEngines';
import { renderEngineIcon } from './AIEngineIcons';
import { UserProfileDropdown } from './UserProfileDropdown';

interface GeminiHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  mode: AnalysisMode;
  onModeChange: (m: AnalysisMode) => void;
  onReset: () => void;
  userEmail?: string;
  selectedEngine?: AIEngineId;
  onSelectEngine?: (engine: AIEngineId) => void;
  onOpenEngineModal?: () => void;
}

export const GeminiHeader: React.FC<GeminiHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  mode,
  onModeChange,
  onReset,
  userEmail = '',
  selectedEngine = 'gemini',
  onSelectEngine,
  onOpenEngineModal
}) => {
  const { isOwner, isAdmin, openAdminModal, openFeedbackModal } = useAuth();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const engine = AI_ENGINES.find(e => e.id === selectedEngine) || AI_ENGINES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-[#282a2c] px-3 sm:px-4 flex items-center justify-between bg-[#131314]/90 backdrop-blur-md z-30 shrink-0 select-none">
      {/* Left Zone: Hamburger + Engine Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* AI Engine Model Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-[#282a2c] border border-transparent hover:border-[#3b3d40] transition-all cursor-pointer group"
          >
            <span className="font-semibold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
              <span>{engine.name}</span>
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-[#a8c7fa] bg-[#1e1f20] px-1.5 py-0.5 rounded-md border border-[#3b3d40]">
              {engine.badge}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8e918f] group-hover:text-white transition-transform" />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-[#1e1f20] border border-[#282a2c] shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-[#8e918f] tracking-wider border-b border-[#282a2c] mb-1">
                Select Active AI Engine
              </div>
              <div className="space-y-1">
                {AI_ENGINES.map((item) => {
                  const isSelected = item.id === selectedEngine;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectEngine?.(item.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#004a77] text-white font-medium'
                          : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[#282a2c] flex items-center justify-center shrink-0">
                          {renderEngineIcon(item.id, 'w-3.5 h-3.5')}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                            <span>{item.name}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-mono text-[#a8c7fa]">
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#8e918f] truncate">{item.tagline}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 mt-1 border-t border-[#282a2c]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    onOpenEngineModal?.();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#282a2c] hover:bg-[#37393b] text-[#a8c7fa] text-xs font-medium transition-colors"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Configure Engines & Fallbacks</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Zone: Output Mode Switcher Pill */}
      <div className="flex items-center bg-[#1e1f20] border border-[#282a2c] p-0.5 sm:p-1 rounded-full shadow-inner">
        <button
          type="button"
          onClick={() => onModeChange('both')}
          className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full transition-all text-[9px] sm:text-xs font-medium leading-tight whitespace-nowrap cursor-pointer ${
            mode === 'both'
              ? 'bg-[#004a77] text-white font-semibold shadow-xs'
              : 'text-[#c4c7c5] hover:text-white'
          }`}
          title="Explain + Code + Execution"
        >
          Comprehensive
        </button>
        <button
          type="button"
          onClick={() => onModeChange('code_only')}
          className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full transition-all text-[9px] sm:text-xs font-medium leading-tight whitespace-nowrap cursor-pointer ${
            mode === 'code_only'
              ? 'bg-[#004a77] text-white font-semibold shadow-xs'
              : 'text-[#c4c7c5] hover:text-white'
          }`}
          title="Fast bug fix & code diff"
        >
          Fix Only
        </button>
        <button
          type="button"
          onClick={() => onModeChange('theory_only')}
          className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full transition-all text-[9px] sm:text-xs font-medium leading-tight whitespace-nowrap cursor-pointer ${
            mode === 'theory_only'
              ? 'bg-[#004a77] text-white font-semibold shadow-xs'
              : 'text-[#c4c7c5] hover:text-white'
          }`}
          title="Full screen conceptual answer"
        >
          Theory Only
        </button>
      </div>

      {/* Right Zone: Feedback + Admin + Clear + User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Site Performance & Upgrade Feedback Button */}
        <button
          type="button"
          onClick={openFeedbackModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3b3d40] text-xs font-medium text-[#c4c7c5] hover:text-white transition-all shadow-xs cursor-pointer group"
          title="Submit feedback on site performance, upgrade fields, or suggestions"
        >
          <MessageSquare className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Feedback</span>
        </button>

        {/* Admin & Multi-Device Control Center (Backend-Enforced Role) */}
        {isAdmin && (
          <button
            type="button"
            onClick={openAdminModal}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-xs cursor-pointer group ${
              isOwner
                ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-600/50 text-amber-300'
                : 'bg-indigo-950/40 hover:bg-indigo-900/50 border-indigo-600/50 text-indigo-300'
            }`}
            title={isOwner ? "Owner Console: Live Multi-Device Tracking & RBAC" : "Admin Console: Live Multi-Device Monitoring"}
          >
            {isOwner ? (
              <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="hidden sm:inline">{isOwner ? 'Owner Console' : 'Admin'}</span>
          </button>
        )}

        {/* Clear Chat Button */}
        <button
          type="button"
          onClick={onReset}
          className="p-2 rounded-full hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
          title="New Chat / Clear"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* User Account Login/Logout & Profile Dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  );
};
