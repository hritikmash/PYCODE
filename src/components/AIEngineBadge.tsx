import React from 'react';
import { Zap, Sparkles, RefreshCw, Sliders } from 'lucide-react';
import { EngineExecutionMeta, AIEngineId } from '../types';
import { renderEngineIcon } from './AIEngineIcons';
import {
  DEFAULT_BUILTIN_ENGINE_ID,
  getAvailableWorkspaceEngines,
  getEngineById
} from '../constants/aiEngines';
import { useAuth } from '../context/AuthContext';

interface AIEngineBadgeProps {
  meta?: EngineExecutionMeta;
  onQuickReAnalyze?: (engineId: AIEngineId) => void;
  isLoading?: boolean;
}

export const AIEngineBadge: React.FC<AIEngineBadgeProps> = ({
  meta,
  onQuickReAnalyze,
  isLoading = false
}) => {
  const { connectedExternalEngines, openSettingsModal } = useAuth();
  if (!meta) return null;

  const currentEngine = getEngineById(meta.engineId);
  const workspaceEngines = getAvailableWorkspaceEngines(connectedExternalEngines);
  const otherEngines = workspaceEngines.filter((e) => e.id !== meta.engineId);
  const isExternalByom = Boolean(meta.isExternalByom) || meta.engineId !== DEFAULT_BUILTIN_ENGINE_ID;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#18191a] via-[#1e1f20] to-[#18191a] border border-[#282a2c] p-3 sm:p-4 text-xs space-y-3 shadow-md">
      {/* Top Row: Engine Tag, Latency & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#131314] border border-[#282a2c] flex items-center justify-center">
            {renderEngineIcon(currentEngine.iconType, 'w-4 h-4')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">
                {meta.engineName}
              </span>
              {isExternalByom ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-950/80 text-sky-300 border border-sky-700/50">
                  External • User Key
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                  Built-In Default
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-emerald-400" />
                <span>{meta.latencyMs}ms</span>
              </span>
            </div>
            <span className="text-[11px] text-[#8e918f]">
              {meta.provider} · {meta.model}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#131314] text-[#a8c7fa] border border-[#282a2c] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#a8c7fa]" />
            <span>{meta.speedRating}</span>
          </span>
        </div>
      </div>

      {/* Quick Compare / Switch Row (Strictly Connected Workspace Engines Only) */}
      {onQuickReAnalyze && (
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#282a2c]/60">
          {otherEngines.length > 0 ? (
            <>
              <span className="text-[11px] text-[#8e918f] flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                <span>Compare output with:</span>
              </span>

              {otherEngines.map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => onQuickReAnalyze(engine.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131314] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#282a2c] hover:border-[#37393b] text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {renderEngineIcon(engine.iconType, 'w-3 h-3')}
                  <span>{engine.shortName || engine.name}</span>
                </button>
              ))}
            </>
          ) : (
            <button
              type="button"
              onClick={() => openSettingsModal('connectivity')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131414] hover:bg-[#282a2c] text-[#8e918f] hover:text-[#a8c7fa] border border-[#282a2c] text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>Connect external BYOM models in Settings → AI Connectivity to compare outputs</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
