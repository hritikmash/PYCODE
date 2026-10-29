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
  Users
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
  const { isOwner, openViewerLogsModal, viewerLoginsCount } = useAuth();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = userEmail ? userEmail[0].toUpperCase() : 'U';
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
    <header className="sticky top-0 z-30 h-16 bg-[#131314]/90 backdrop-blur-md border-b border-[#282a2c] text-white flex items-center justify-between px-3 sm:px-6 select-none">
      {/* Left Zone: Sidebar Hamburger + Gemini Wordmark & Model Selector Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Gemini Logo + Model Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-[#1e1f20] transition-colors cursor-pointer group"
          >
            <GeminiSparkle className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-lg tracking-tight text-white group-hover:text-[#a8c7fa] transition-colors">
              Gemini
            </span>
            <span className="text-xs text-[#8e918f] font-normal hidden sm:inline">
              {engine.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8e918f] group-hover:text-white transition-transform" />
          </button>

          {/* Model Switcher Popover */}
          {isModelDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl bg-[#1e1f20] border border-[#282a2c] shadow-2xl p-1.5 z-50 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-[#282a2c]/60">
                <span className="text-[10px] font-semibold text-[#8e918f] uppercase tracking-wider">
                  Select AI Model
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">0.5s - 1.1s</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-0.5 [scrollbar-width:thin]">
                {AI_ENGINES.map((eng) => {
                  const isSelected = eng.id === selectedEngine;
                  return (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => {
                        onSelectEngine?.(eng.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-[#004a77] text-white font-medium' 
                          : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0">
                          {renderEngineIcon(eng.iconType, 'w-4 h-4')}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{eng.name}</div>
                          <div className="text-[10px] text-[#8e918f] line-clamp-1">{eng.provider}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 border-t border-[#282a2c]/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    onOpenEngineModal?.();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-[#a8c7fa] hover:text-white transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  <span>Configure API Keys & Engines</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Zone: Mode Tabs (Segmented Pill) */}
      <div className="flex items-center bg-[#1e1f20] p-0.5 sm:p-1 rounded-full border border-[#282a2c]">
        <button
          type="button"
          onClick={() => onModeChange('both')}
          className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full transition-all text-[9px] sm:text-xs font-medium leading-tight whitespace-nowrap cursor-pointer ${
            mode === 'both'
              ? 'bg-[#004a77] text-white font-semibold shadow-xs'
              : 'text-[#c4c7c5] hover:text-white'
          }`}
          title="Split View: Theory on left, Code on right"
        >
          Theory + Code
        </button>
        <button
          type="button"
          onClick={() => onModeChange('code_only')}
          className={`px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full transition-all text-[9px] sm:text-xs font-medium leading-tight whitespace-nowrap cursor-pointer ${
            mode === 'code_only'
              ? 'bg-[#004a77] text-white font-semibold shadow-xs'
              : 'text-[#c4c7c5] hover:text-white'
          }`}
          title="Full screen code editor and explanations"
        >
          Code Only
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

      {/* Right Zone: Gemini Advanced Sparkle Pill + Clear + User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Gemini Advanced Pill */}
        <button
          type="button"
          onClick={onOpenEngineModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#1e1f20] to-[#282a2c] hover:from-[#282a2c] hover:to-[#37393b] border border-[#4285f4]/40 text-xs font-medium text-[#a8c7fa] hover:text-white transition-all shadow-xs cursor-pointer group"
          title="Gemini Advanced Engine Settings"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>Gemini Advanced</span>
        </button>

        {/* Clear Chat Button */}
        <button
          type="button"
          onClick={onReset}
          className="p-2 rounded-full hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
          title="New Chat / Clear"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Owner Secret View: Viewers who logged in apart from owner */}
        {isOwner && (
          <button
            type="button"
            onClick={openViewerLogsModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/50 text-amber-300 text-xs font-medium transition-all shadow-xs cursor-pointer group"
            title="Owner Secret View: See who logged in to Pycode apart from you"
          >
            <Users className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Viewers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-black font-bold">
              {viewerLoginsCount}
            </span>
          </button>
        )}

        {/* User Account Login/Logout & Profile Dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  );
};
