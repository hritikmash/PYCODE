import React from 'react';
import { Zap, Settings, ShieldCheck, ChevronRight } from 'lucide-react';
import { AIEngineId } from '../types';
import { AI_ENGINES } from '../constants/aiEngines';
import { renderEngineIcon } from './AIEngineIcons';

interface AIEngineSelectorProps {
  selectedEngine: AIEngineId;
  onSelectEngine: (engine: AIEngineId) => void;
  onOpenSettings?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const AIEngineSelector: React.FC<AIEngineSelectorProps> = ({
  selectedEngine,
  onSelectEngine,
  onOpenSettings,
  disabled = false,
  compact = false
}) => {
  const currentEngine = AI_ENGINES.find(e => e.id === selectedEngine) || AI_ENGINES[0];

  return (
    <div className="w-full">
      {/* Top Banner / Label Row */}
      <div className="flex items-center justify-between pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-white tracking-wide">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>AI Acceleration Engine</span>
          </span>
          <span className="text-[#8e918f] hidden sm:inline">·</span>
          <span className="text-[#8e918f] text-[11px] hidden sm:inline">
            Active: <strong className="text-white font-medium">{currentEngine.name}</strong> ({currentEngine.badge})
          </span>
        </div>

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1 text-[11px] text-[#8e918f] hover:text-[#a8c7fa] transition-colors px-2 py-0.5 rounded-md hover:bg-[#282a2c]"
            title="Configure API Keys & Engine Routing"
          >
            <Settings className="w-3 h-3" />
            <span>Engine Config & Keys</span>
          </button>
        )}
      </div>

      {/* Engine Pill Carousel / Grid */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-700">
        {AI_ENGINES.map((engine) => {
          const isSelected = selectedEngine === engine.id;
          return (
            <button
              key={engine.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectEngine(engine.id)}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 border ${
                isSelected
                  ? 'bg-[#1e1f20] text-white border-white/20 shadow-md ring-1 ring-white/10'
                  : 'bg-[#131314]/80 text-[#8e918f] hover:text-[#e3e3e3] border-[#282a2c] hover:border-[#37393b] hover:bg-[#1a1b1c]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Highlight accent bar on top when selected */}
              {isSelected && (
                <span
                  className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ backgroundColor: engine.accentColor }}
                />
              )}

              {/* Engine Logo */}
              <div className="shrink-0 flex items-center justify-center">
                {renderEngineIcon(engine.iconType, 'w-4 h-4')}
              </div>

              {/* Name & Latency */}
              <div className="flex flex-col text-left">
                <span className={`leading-none font-medium ${isSelected ? 'text-white font-semibold' : ''}`}>
                  {engine.name}
                </span>
                <span className="text-[10px] text-[#8e918f] mt-0.5 leading-none font-mono">
                  {engine.latencyBadge}
                </span>
              </div>

              {/* Speed / Badge indicator */}
              {isSelected && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  FAST
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
