import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  RefreshCw,
  CheckCircle2,
  Power,
  PlugZap,
  Unplug,
  Eye,
  EyeOff,
  KeyRound,
  Globe,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  BUILTIN_DEFAULT_ENGINE,
  EXTERNAL_ENGINES
} from '../constants/aiEngines';
import { renderEngineIcon } from './AIEngineIcons';
import type { AIEngineInfo, ExternalEngineId } from '../types';

interface AIConnectivityHubProps {
  highlightEngineIds?: ExternalEngineId[];
  compact?: boolean;
}

export const AIConnectivityHub: React.FC<AIConnectivityHubProps> = ({
  highlightEngineIds = [],
  compact = false
}) => {
  const {
    connectedExternalEngines,
    externalConnections,
    preferredExternalEngines,
    testAndConnectExternalEngine,
    disconnectExternalEngine
  } = useAuth();

  const [expandedEngineId, setExpandedEngineId] = useState<ExternalEngineId | null>(() => {
    if (highlightEngineIds.length > 0) return highlightEngineIds[0];
    if (preferredExternalEngines.length > 0) {
      const firstUnconnected = preferredExternalEngines.find(
        (id) => !connectedExternalEngines.includes(id)
      );
      return firstUnconnected || null;
    }
    return null;
  });

  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [endpointInputs, setEndpointInputs] = useState<Record<string, string>>({});
  const [modelInputs, setModelInputs] = useState<Record<string, string>>({});
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});
  const [testingEngineId, setTestingEngineId] = useState<ExternalEngineId | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<ExternalEngineId | null>(null);
  const [feedbackByEngine, setFeedbackByEngine] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});

  useEffect(() => {
    // Pre-fill default endpoint/model values for convenience without marking connected
    setEndpointInputs((prev) => {
      const next = { ...prev };
      for (const eng of EXTERNAL_ENGINES) {
        if (next[eng.id] === undefined) {
          next[eng.id] =
            externalConnections[eng.id as ExternalEngineId]?.endpointUrl ||
            eng.defaultEndpointUrl ||
            '';
        }
      }
      return next;
    });
    setModelInputs((prev) => {
      const next = { ...prev };
      for (const eng of EXTERNAL_ENGINES) {
        if (next[eng.id] === undefined) {
          next[eng.id] =
            externalConnections[eng.id as ExternalEngineId]?.modelName ||
            eng.defaultModel ||
            '';
        }
      }
      return next;
    });
  }, [externalConnections]);

  const handleTestAndConnect = async (engine: AIEngineInfo) => {
    const engineId = engine.id as ExternalEngineId;
    const rawKey = (apiKeyInputs[engineId] || '').trim();
    const rawEndpoint = (endpointInputs[engineId] || engine.defaultEndpointUrl || '').trim();
    const rawModel = (modelInputs[engineId] || engine.defaultModel || '').trim();

    if (!rawKey) {
      setFeedbackByEngine((prev) => ({
        ...prev,
        [engineId]: {
          type: 'error',
          message: `Please enter your personal ${engine.shortName || engine.name} API key.`
        }
      }));
      return;
    }

    if (engine.requiresEndpoint && !rawEndpoint) {
      setFeedbackByEngine((prev) => ({
        ...prev,
        [engineId]: {
          type: 'error',
          message: 'Please enter the external endpoint URL.'
        }
      }));
      return;
    }

    setTestingEngineId(engineId);
    setFeedbackByEngine((prev) => {
      const copy = { ...prev };
      delete copy[engineId];
      return copy;
    });

    const res = await testAndConnectExternalEngine({
      engineId,
      apiKey: rawKey,
      endpointUrl: rawEndpoint || undefined,
      modelName: rawModel || undefined
    });

    setTestingEngineId(null);

    if (!res.success) {
      setFeedbackByEngine((prev) => ({
        ...prev,
        [engineId]: {
          type: 'error',
          message: res.error || 'Key verification failed. Credentials were not saved.'
        }
      }));
      return;
    }

    // Clear raw key from component input state immediately after encrypted server persistence
    setApiKeyInputs((prev) => ({ ...prev, [engineId]: '' }));
    setShowKeyMap((prev) => ({ ...prev, [engineId]: false }));
    setExpandedEngineId(null);
    setFeedbackByEngine((prev) => ({
      ...prev,
      [engineId]: {
        type: 'success',
        message: `Verified & connected externally${res.latencyMs ? ` (${res.latencyMs}ms)` : ''}. Requests now use your personal tokens.`
      }
    }));
  };

  const handleDisconnect = async (engineId: ExternalEngineId) => {
    setDisconnectingId(engineId);
    const res = await disconnectExternalEngine(engineId);
    setDisconnectingId(null);
    if (!res.success) {
      setFeedbackByEngine((prev) => ({
        ...prev,
        [engineId]: {
          type: 'error',
          message: res.error || 'Failed to disconnect engine.'
        }
      }));
      return;
    }
    setApiKeyInputs((prev) => ({ ...prev, [engineId]: '' }));
    setFeedbackByEngine((prev) => ({
      ...prev,
      [engineId]: {
        type: 'success',
        message: 'Disconnected and purged encrypted credentials from your account.'
      }
    }));
  };

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {/* Built-In Default Engine Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/35 via-[#131414] to-[#131414] border border-emerald-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#131414] border border-emerald-600/40 flex items-center justify-center shrink-0">
            {renderEngineIcon(BUILTIN_DEFAULT_ENGINE.iconType, 'w-5 h-5')}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">
                {BUILTIN_DEFAULT_ENGINE.name}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Built-In Default • Active</span>
              </span>
            </div>
            <p className="text-xs text-[#9e9e9e] leading-snug">
              Sole built-in Pycode engine pre-connected out of the box. External BYOM engines below remain completely disconnected until you connect your own keys.
            </p>
          </div>
        </div>
      </div>

      {/* External BYOM Engines Header */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <PlugZap className="w-4 h-4 text-[#20b8cd]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9e9e9e]">
            External BYOM Connectors ({connectedExternalEngines.length}/{EXTERNAL_ENGINES.length} Connected)
          </h4>
        </div>
        <span className="text-[11px] text-[#858585] hidden sm:inline">
          Encrypted with AES-256-GCM · Never uses server keys
        </span>
      </div>

      {/* External BYOM Engine Cards */}
      <div className="space-y-2.5">
        {EXTERNAL_ENGINES.map((engine) => {
          const engineId = engine.id as ExternalEngineId;
          const meta = externalConnections[engineId];
          const isConnected =
            connectedExternalEngines.includes(engineId) && meta?.status === 'connected';
          const isExpanded = expandedEngineId === engineId;
          const isTesting = testingEngineId === engineId;
          const isDisconnecting = disconnectingId === engineId;
          const isPreferred = preferredExternalEngines.includes(engineId) && !isConnected;
          const fb = feedbackByEngine[engineId];
          const showSecret = Boolean(showKeyMap[engineId]);

          return (
            <div
              key={engine.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isConnected
                  ? 'bg-[#151817] border-emerald-700/45 shadow-sm'
                  : isPreferred
                    ? 'bg-[#17191c] border-[#20b8cd]/40'
                    : 'bg-[#131414] border-[#26282a] hover:border-[#37393b]'
              }`}
            >
              {/* Card Top Row */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isConnected
                        ? 'bg-[#111312] border-emerald-700/40'
                        : 'bg-[#101112] border-[#26282a]'
                    }`}
                  >
                    {renderEngineIcon(engine.iconType, 'w-5 h-5')}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">
                        {engine.shortName || engine.name}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                          isConnected
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                          }`}
                        />
                        <span>{isConnected ? 'Connected (External)' : 'Not Connected'}</span>
                      </span>

                      {isPreferred && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#20b8cd]/15 text-[#20b8cd] border border-[#20b8cd]/30">
                          Selected in Onboarding
                        </span>
                      )}
                    </div>

                    {isConnected ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#9e9e9e] font-mono">
                        <span className="text-emerald-300/90">Key: {meta?.maskedKey || '••••'}</span>
                        {meta?.modelName && <span>Model: {meta.modelName}</span>}
                        {meta?.lastVerifiedAt && (
                          <span className="text-[#858585]">
                            Verified {new Date(meta.lastVerifiedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#8e918f] leading-snug">
                        {engine.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpandedEngineId(isExpanded ? null : engineId)}
                        className="px-3 py-1.5 rounded-xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#323638] text-xs font-medium text-[#d4d4d8] hover:text-white transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Close' : 'Update Key'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(engineId)}
                        disabled={isDisconnecting}
                        className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-xs font-medium text-red-300 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Unplug className="w-3.5 h-3.5" />
                        <span>{isDisconnecting ? 'Removing...' : 'Disconnect'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedEngineId(isExpanded ? null : engineId)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isExpanded
                          ? 'bg-[#282a2c] border-[#3d4245] text-white'
                          : 'bg-[#1e1f20] hover:bg-[#282a2c] border-[#20b8cd]/45 text-[#20b8cd] hover:text-white'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Cancel' : 'Connect'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Per-Engine Inline Feedback */}
              {fb && (
                <div
                  className={`mx-3.5 mb-3 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    fb.type === 'success'
                      ? 'bg-emerald-950/45 border-emerald-800/50 text-emerald-300'
                      : 'bg-red-950/45 border-red-800/50 text-red-300'
                  }`}
                >
                  {fb.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{fb.message}</span>
                </div>
              )}

              {/* Expandable BYOM Credentials Form */}
              {isExpanded && (
                <div className="px-3.5 pb-4 pt-3 border-t border-[#242828] bg-[#101112] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-medium text-[#c4c7c5] flex items-center justify-between">
                        <span>Personal {engine.shortName || engine.name} API Key</span>
                        <span className="text-[10px] text-[#858585] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          Encrypted server-side
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={apiKeyInputs[engineId] || ''}
                          onChange={(e) =>
                            setApiKeyInputs((prev) => ({ ...prev, [engineId]: e.target.value }))
                          }
                          placeholder={engine.apiKeyPlaceholder || 'Paste your personal API key...'}
                          autoComplete="off"
                          className="w-full pl-3.5 pr-10 py-2 bg-[#171819] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white font-mono outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKeyMap((prev) => ({ ...prev, [engineId]: !showSecret }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#858585] hover:text-white cursor-pointer"
                          title={showSecret ? 'Hide API key' : 'Show API key'}
                        >
                          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#c4c7c5] flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#858585]" />
                        <span>
                          Endpoint URL {engine.requiresEndpoint ? '(Required)' : '(Optional)'}
                        </span>
                      </label>
                      <input
                        type="url"
                        value={endpointInputs[engineId] ?? engine.defaultEndpointUrl ?? ''}
                        onChange={(e) =>
                          setEndpointInputs((prev) => ({ ...prev, [engineId]: e.target.value }))
                        }
                        placeholder={engine.defaultEndpointUrl || 'https://...'}
                        className="w-full px-3 py-2 bg-[#171819] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white font-mono outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#c4c7c5]">
                        Model ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={modelInputs[engineId] ?? engine.defaultModel ?? ''}
                        onChange={(e) =>
                          setModelInputs((prev) => ({ ...prev, [engineId]: e.target.value }))
                        }
                        placeholder={engine.defaultModel || 'Default model'}
                        className="w-full px-3 py-2 bg-[#171819] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-[#858585]">
                      We verify your credentials directly with {engine.provider.replace(' (External)', '')} before saving.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTestAndConnect(engine)}
                      disabled={isTesting}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#20b8cd] to-[#38bdf8] hover:from-[#27cbe2] hover:to-[#60a5fa] text-[#090d16] font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing &amp; Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Test &amp; Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const EngineConnectorModal: React.FC = () => {
  const {
    isEngineConnectorOpen,
    closeEngineConnector,
    openSettingsModal,
    user,
    connectedExternalEngines,
    completeEngineOnboarding,
    testAndConnectExternalEngine
  } = useAuth();

  // Strictly opt-in: nothing checked by default
  const [checkedEngines, setCheckedEngines] = useState<ExternalEngineId[]>([]);
  const [inlineKeys, setInlineKeys] = useState<Record<string, string>>({});
  const [inlineEndpoints, setInlineEndpoints] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<ExternalEngineId | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});
  const [isFinishing, setIsFinishing] = useState(false);

  if (!isEngineConnectorOpen || !user) return null;

  const toggleChecked = (engineId: ExternalEngineId) => {
    setCheckedEngines((prev) =>
      prev.includes(engineId) ? prev.filter((id) => id !== engineId) : [...prev, engineId]
    );
  };

  const handleInlineTestAndConnect = async (engine: AIEngineInfo) => {
    const engineId = engine.id as ExternalEngineId;
    const apiKey = (inlineKeys[engineId] || '').trim();
    const endpointUrl = (inlineEndpoints[engineId] || engine.defaultEndpointUrl || '').trim();

    if (!apiKey) {
      setInlineFeedback((prev) => ({
        ...prev,
        [engineId]: { type: 'error', message: 'Enter your personal API key to verify & connect.' }
      }));
      return;
    }

    setTestingId(engineId);
    setInlineFeedback((prev) => {
      const next = { ...prev };
      delete next[engineId];
      return next;
    });

    const res = await testAndConnectExternalEngine({
      engineId,
      apiKey,
      endpointUrl: endpointUrl || undefined,
      modelName: engine.defaultModel
    });
    setTestingId(null);

    if (!res.success) {
      setInlineFeedback((prev) => ({
        ...prev,
        [engineId]: { type: 'error', message: res.error || 'Verification failed.' }
      }));
      return;
    }

    setInlineKeys((prev) => ({ ...prev, [engineId]: '' }));
    setInlineFeedback((prev) => ({
      ...prev,
      [engineId]: {
        type: 'success',
        message: `Connected externally${res.latencyMs ? ` (${res.latencyMs}ms)` : ''}!`
      }
    }));
  };

  const handleSkipTurboOnly = async () => {
    setIsFinishing(true);
    await completeEngineOnboarding({ skipped: true, preferredExternalEngines: [] });
    setIsFinishing(false);
    closeEngineConnector();
  };

  const handleContinueSelected = async () => {
    setIsFinishing(true);
    const unconnectedChecked = checkedEngines.filter(
      (id) => !connectedExternalEngines.includes(id)
    );
    await completeEngineOnboarding({
      skipped: checkedEngines.length === 0,
      preferredExternalEngines: unconnectedChecked
    });
    setIsFinishing(false);
    closeEngineConnector();
    if (unconnectedChecked.length > 0) {
      openSettingsModal('connectivity');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#191a1a] text-[#ededed] border border-[#2d3131] rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#242828]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-[#20b8cd]/20 to-sky-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate">
                Choose External AI Engines (Optional)
              </h2>
              <p className="text-xs text-[#9e9e9e] mt-0.5 leading-relaxed">
                <strong>Turbo AI</strong> is already pre-connected as your built-in default. Optionally select external BYOM engines below to connect using your own personal API keys—unselected models stay 100% isolated and disconnected.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkipTurboOnly}
            disabled={isFinishing}
            className="p-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] border border-[#323638] text-[#8e918f] hover:text-white transition-colors cursor-pointer shrink-0"
            title="Skip — Use Turbo AI Only"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sole Built-In Default Engine Callout */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-700/45 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#131414] border border-emerald-600/40 flex items-center justify-center shrink-0">
              {renderEngineIcon(BUILTIN_DEFAULT_ENGINE.iconType, 'w-4 h-4')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Turbo AI</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  Built-In Default • Ready
                </span>
              </div>
              <p className="text-[11px] text-[#9e9e9e] truncate">
                Always ready immediately upon sign-in with zero external setup needed.
              </p>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>

        {/* Optional External BYOM Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8e918f]">
              Optional External BYOM Models ({connectedExternalEngines.length} Connected)
            </span>
            <span className="text-[11px] text-[#858585]">None connected unless verified</span>
          </div>

          {EXTERNAL_ENGINES.map((engine) => {
            const engineId = engine.id as ExternalEngineId;
            const isConnected = connectedExternalEngines.includes(engineId);
            const isChecked = isConnected || checkedEngines.includes(engineId);
            const isTesting = testingId === engineId;
            const fb = inlineFeedback[engineId];

            return (
              <div
                key={engine.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isConnected
                    ? 'bg-[#141817] border-emerald-700/45'
                    : isChecked
                      ? 'bg-[#17191c] border-[#20b8cd]/50'
                      : 'bg-[#131414] border-[#26282a] hover:border-[#37393b]'
                }`}
              >
                <div
                  onClick={() => {
                    if (!isConnected) toggleChecked(engineId);
                  }}
                  className={`p-3.5 flex items-center justify-between gap-3 ${
                    isConnected ? '' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isConnected
                          ? 'bg-emerald-500 border-emerald-400 text-[#090d16]'
                          : isChecked
                            ? 'bg-[#20b8cd] border-[#20b8cd] text-[#090d16]'
                            : 'bg-[#191a1a] border-[#3d4245]'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-[#101112] border border-[#26282a] flex items-center justify-center shrink-0">
                      {renderEngineIcon(engine.iconType, 'w-4 h-4')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">
                          {engine.shortName || engine.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            isConnected
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-700/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? 'bg-emerald-400' : 'bg-zinc-500'
                            }`}
                          />
                          <span>{isConnected ? 'Connected (External)' : 'Not Connected'}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e918f] truncate">{engine.tagline}</p>
                    </div>
                  </div>
                </div>

                {/* Inline Key Verification Drawer if checked and not yet connected */}
                {isChecked && !isConnected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="px-3.5 pb-3.5 pt-2.5 border-t border-[#242828] bg-[#101112] space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        value={inlineKeys[engineId] || ''}
                        onChange={(e) =>
                          setInlineKeys((prev) => ({ ...prev, [engineId]: e.target.value }))
                        }
                        placeholder={`Personal ${engine.shortName || engine.name} API Key (${engine.apiKeyPlaceholder || 'key...'})`}
                        autoComplete="off"
                        className="flex-1 px-3 py-2 bg-[#171819] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white font-mono outline-none"
                      />
                      {engine.requiresEndpoint && (
                        <input
                          type="url"
                          value={inlineEndpoints[engineId] ?? engine.defaultEndpointUrl ?? ''}
                          onChange={(e) =>
                            setInlineEndpoints((prev) => ({ ...prev, [engineId]: e.target.value }))
                          }
                          placeholder="Endpoint URL"
                          className="sm:w-56 px-3 py-2 bg-[#171819] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white font-mono outline-none"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleInlineTestAndConnect(engine)}
                        disabled={isTesting}
                        className="px-3.5 py-2 rounded-xl bg-[#20b8cd] hover:bg-[#27cbe2] text-[#090d16] font-semibold text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {isTesting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Test &amp; Connect</span>
                          </>
                        )}
                      </button>
                    </div>

                    {fb && (
                      <div
                        className={`text-[11px] flex items-center gap-1.5 ${
                          fb.type === 'success' ? 'text-emerald-300' : 'text-red-300'
                        }`}
                      >
                        {fb.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{fb.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[#242828] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-[#8e918f]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Unselected engines remain isolated with zero keys or tokens.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              type="button"
              onClick={handleSkipTurboOnly}
              disabled={isFinishing}
              className="px-4 py-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] border border-[#323638] text-xs font-medium text-[#d4d4d8] hover:text-white transition-colors cursor-pointer"
            >
              Skip — Use Turbo AI Only
            </button>

            {(checkedEngines.length > 0 || connectedExternalEngines.length > 0) && (
              <button
                type="button"
                onClick={handleContinueSelected}
                disabled={isFinishing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#20b8cd] to-[#38bdf8] hover:from-[#27cbe2] hover:to-[#60a5fa] text-[#090d16] font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>
                  {checkedEngines.some((id) => !connectedExternalEngines.includes(id))
                    ? 'Continue to AI Connectivity'
                    : 'Enter Workspace'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
