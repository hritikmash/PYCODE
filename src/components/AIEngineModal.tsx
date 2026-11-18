import React from 'react';
import { X, Check, Globe, Cpu, Sliders } from 'lucide-react';
import { DEFAULT_BUILTIN_ENGINE_ID, getAvailableWorkspaceEngines } from '../constants/aiEngines';
import { renderEngineIcon } from './AIEngineIcons';
import { useAuth } from '../context/AuthContext';
import type { AIEngineId, SearchEngineType } from '../types';

interface AIEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEngine: AIEngineId;
  onSelectEngine: (engine: AIEngineId) => void;
  preferredSearchEngine: SearchEngineType;
  onSelectSearchEngine: (engine: SearchEngineType) => void;
}

export const AIEngineModal: React.FC<AIEngineModalProps> = ({
  isOpen,
  onClose,
  selectedEngine,
  onSelectEngine,
  preferredSearchEngine,
  onSelectSearchEngine
}) => {
  const { connectedExternalEngines, openSettingsModal } = useAuth();

  if (!isOpen) return null;

  const workspaceEngines = getAvailableWorkspaceEngines(connectedExternalEngines);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-[#1e1f20] text-[#e3e3e3] border border-[#37393b] rounded-3xl shadow-2xl p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#2d2f31] pb-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-[#a8c7fa]" />
            <div>
              <h2 className="text-base font-semibold text-white">AI Engine &amp; Search Settings</h2>
              <p className="text-xs text-[#8e918f]">Turbo AI (Default) and your connected external BYOM engines</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Grid (Turbo AI + Connected External BYOM Engines Only) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8e918f]">
              Workspace AI Engines ({workspaceEngines.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                openSettingsModal('connectivity');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#282a2c] hover:bg-[#323437] text-[11px] font-medium text-[#a8c7fa] hover:text-white border border-[#37393b] cursor-pointer transition-colors"
            >
              <Sliders className="w-3 h-3" />
              <span>Manage AI Connectivity</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workspaceEngines.map((engine) => {
              const isSelected = engine.id === selectedEngine;
              const isBuiltIn = engine.id === DEFAULT_BUILTIN_ENGINE_ID || Boolean(engine.isBuiltInDefault);
              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => onSelectEngine(engine.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#282a2c] border-[#a8c7fa]/60 shadow-md'
                      : 'bg-[#171819] border-[#2d2f31] hover:border-[#444746]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#131314] border border-[#2d2f31] flex items-center justify-center shrink-0">
                    {renderEngineIcon(engine.iconType, 'w-5 h-5')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white truncate">{engine.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#a8c7fa] shrink-0" />}
                    </div>
                    {isBuiltIn ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>Built-In Default</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-sky-400 font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span>External • User Key</span>
                      </div>
                    )}
                    <p className="text-[11px] text-[#c4c7c5] mt-1.5 line-clamp-2 leading-relaxed">
                      {engine.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Engine Preference */}
        <div className="space-y-3 pt-2 border-t border-[#2d2f31]">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#a8c7fa]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8e918f]">
              Preferred Web Fallback Search
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                { id: 'google', label: 'Google Search' },
                { id: 'ms_edge', label: 'Microsoft Bing' },
                { id: 'firefox', label: 'DuckDuckGo' },
              ] as const
            ).map((item) => {
              const active = preferredSearchEngine === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSearchEngine(item.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#004a77]/40 border-[#a8c7fa]/60 text-white'
                      : 'bg-[#171819] border-[#2d2f31] text-[#8e918f] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
