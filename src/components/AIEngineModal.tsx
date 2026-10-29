import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  Clock, 
  Sparkles,
  Server,
  Cpu,
  Layers,
  Info
} from 'lucide-react';
import { AI_ENGINES } from '../constants/aiEngines';
import { renderEngineIcon } from './AIEngineIcons';
import { AIEngineId, SearchEngineType } from '../types';

interface AIEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEngine: AIEngineId;
  onSelectEngine: (engine: AIEngineId) => void;
  preferredSearchEngine?: SearchEngineType;
  onSelectSearchEngine?: (se: SearchEngineType) => void;
}

export const AIEngineModal: React.FC<AIEngineModalProps> = ({
  isOpen,
  onClose,
  selectedEngine,
  onSelectEngine,
  preferredSearchEngine = 'google',
  onSelectSearchEngine
}) => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    COPILOT_API_KEY: '',
    OPENAI_API_KEY: '',
    DEEPSEEK_API_KEY: '',
    PERPLEXITY_API_KEY: '',
    BLACKBOX_API_KEY: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'search_fallback' | 'keys'>('overview');

  // Load custom API keys from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pycode_custom_api_keys');
      if (stored) {
        setApiKeys(JSON.parse(stored));
      }
    } catch {}
  }, []);

  if (!isOpen) return null;

  const handleSaveKeys = () => {
    try {
      localStorage.setItem('pycode_custom_api_keys', JSON.stringify(apiKeys));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.warn('Could not save custom keys', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#1e1f20] border border-[#282a2c] rounded-3xl shadow-2xl text-[#e3e3e3] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#282a2c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Zap className="w-5 h-5 fill-sky-400 text-sky-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                <span>Multi-AI Acceleration Engines</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                  Turbo Enabled
                </span>
              </h3>
              <p className="text-xs text-[#8e918f]">
                Integrated ChatGPT, Gemini, Perplexity, Blackbox AI & DeepSeek for lightning-fast Python outputs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-[#282a2c] gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#a8c7fa] text-white font-semibold'
                : 'border-transparent text-[#8e918f] hover:text-white'
            }`}
          >
            Engines & Latency Benchmarks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('search_fallback')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'search_fallback'
                ? 'border-[#a8c7fa] text-white font-semibold'
                : 'border-transparent text-[#8e918f] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Search Engines (Tokens Fallback)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'keys'
                ? 'border-[#a8c7fa] text-white font-semibold'
                : 'border-transparent text-[#8e918f] hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Custom Provider Keys (Optional)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'overview' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-sky-950/30 to-purple-950/40 border border-emerald-800/40 text-xs flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-emerald-300 block">
                    Zero-Config Instant Speed
                  </span>
                  <p className="text-[#c4c7c5] leading-relaxed">
                    All 5 AI engines are ready to use immediately without needing any personal subscriptions. Pycode operates a high-speed server pipeline with Gemini 2.5 Flash acceleration and fine-tuned model personas. You can also provide your own custom API keys in the tab above.
                  </p>
                </div>
              </div>

              {/* Engine Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_ENGINES.map((engine) => {
                  const isSelected = selectedEngine === engine.id;
                  return (
                    <div
                      key={engine.id}
                      onClick={() => onSelectEngine(engine.id)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#282a2c] border-sky-500/80 shadow-lg ring-1 ring-sky-500/40'
                          : 'bg-[#18191a] border-[#282a2c] hover:border-[#37393b] hover:bg-[#1e1f20]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {renderEngineIcon(engine.iconType, 'w-5 h-5')}
                            <span className="font-semibold text-sm text-white">
                              {engine.name}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#131314] text-[#a8c7fa] border border-[#282a2c]">
                            {engine.latencyBadge}
                          </span>
                        </div>

                        <p className="text-xs text-[#c4c7c5] leading-relaxed">
                          {engine.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#282a2c]/60 text-[11px]">
                        <span className="text-[#8e918f] font-mono">
                          {engine.provider}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          isSelected
                            ? 'bg-sky-500 text-black font-semibold'
                            : 'text-[#8e918f] group-hover:text-white'
                        }`}>
                          {isSelected ? 'Active Selected' : 'Click to Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'search_fallback' ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-emerald-950/40 border border-sky-600/40 space-y-1.5">
                <span className="font-semibold text-white flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Tokens Over & Search Engine Fallback Grounding</span>
                </span>
                <p className="text-[#c4c7c5] leading-relaxed">
                  When AI tokens or API quota limits are reached, Pycode automatically switches to live search engine intelligence to ground your code solutions, syntax fixes, and explanations with official Python docs and top verified community answers.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white block">
                  Select Preferred Search Engine Fallback:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'google', name: 'Google Search', icon: '🌐', color: 'border-sky-500/70', badge: 'Default & Most Accurate', desc: 'Google Python index & StackOverflow grounding' },
                    { id: 'ms_edge', name: 'Microsoft Edge (Bing)', icon: '🔷', color: 'border-emerald-500/70', badge: 'Microsoft Learn Docs', desc: 'Enterprise Python & MS Learn ecosystem' },
                    { id: 'firefox', name: 'Firefox / DuckDuckGo', icon: '🦊', color: 'border-amber-500/70', badge: 'Private & Clean', desc: 'MDN & developer documentation focused' }
                  ].map((se) => {
                    const isSelected = preferredSearchEngine === se.id;
                    return (
                      <div
                        key={se.id}
                        onClick={() => onSelectSearchEngine && onSelectSearchEngine(se.id as SearchEngineType)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                          isSelected
                            ? `bg-[#282a2c] ${se.color} shadow-md ring-1 ring-sky-500/50`
                            : 'bg-[#18191a] border-[#282a2c] hover:border-[#37393b] hover:bg-[#1e1f20]'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-base">{se.icon}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              isSelected ? 'bg-sky-500 text-black font-semibold' : 'text-[#8e918f] bg-[#131314]'
                            }`}>
                              {isSelected ? 'Active' : 'Select'}
                            </span>
                          </div>
                          <div className="font-semibold text-white text-xs">{se.name}</div>
                          <p className="text-[11px] text-[#8e918f] leading-tight">{se.desc}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#282a2c]/60 text-[10px] text-sky-300 font-mono">
                          {se.badge}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#18191a] border border-[#282a2c] space-y-1">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#a8c7fa]" />
                  <span>Client-Side Local Storage Privacy</span>
                </span>
                <p className="text-[#8e918f] leading-relaxed">
                  Keys are stored exclusively in your browser and used only to authenticate requests to the respective provider. If left blank, Pycode seamlessly uses the native built-in high-speed Gemini AI engine.
                </p>
              </div>

              <div className="space-y-3">
                {/* Copilot Key */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between font-semibold text-white">
                    <span>Microsoft Copilot (API Key / Auth)</span>
                    <span className="text-[10px] text-[#8e918f] font-mono">ms-copilot-...</span>
                  </label>
                  <input
                    type="password"
                    placeholder="copilot-..."
                    value={apiKeys.COPILOT_API_KEY || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, COPILOT_API_KEY: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131314] border border-[#282a2c] focus:border-[#a8c7fa] text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                {/* OpenAI Key */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between font-semibold text-white">
                    <span>ChatGPT (OpenAI API Key)</span>
                    <span className="text-[10px] text-[#8e918f] font-mono">sk-proj-...</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKeys.OPENAI_API_KEY || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, OPENAI_API_KEY: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131314] border border-[#282a2c] focus:border-[#a8c7fa] text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                {/* DeepSeek Key */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between font-semibold text-white">
                    <span>DeepSeek AI Key</span>
                    <span className="text-[10px] text-[#8e918f] font-mono">sk-...</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKeys.DEEPSEEK_API_KEY || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, DEEPSEEK_API_KEY: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131314] border border-[#282a2c] focus:border-[#a8c7fa] text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                {/* Perplexity Key */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between font-semibold text-white">
                    <span>Perplexity AI Key</span>
                    <span className="text-[10px] text-[#8e918f] font-mono">pplx-...</span>
                  </label>
                  <input
                    type="password"
                    placeholder="pplx-..."
                    value={apiKeys.PERPLEXITY_API_KEY || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, PERPLEXITY_API_KEY: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131314] border border-[#282a2c] focus:border-[#a8c7fa] text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                {/* Blackbox Key */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between font-semibold text-white">
                    <span>Blackbox AI Key</span>
                    <span className="text-[10px] text-[#8e918f] font-mono">bb-...</span>
                  </label>
                  <input
                    type="password"
                    placeholder="bb-..."
                    value={apiKeys.BLACKBOX_API_KEY || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, BLACKBOX_API_KEY: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131314] border border-[#282a2c] focus:border-[#a8c7fa] text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSaveKeys}
                    className="px-5 py-2 rounded-xl bg-[#a8c7fa] text-[#003355] font-semibold hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <span>Save Key Preferences</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cleared = { OPENAI_API_KEY: '', DEEPSEEK_API_KEY: '', PERPLEXITY_API_KEY: '', BLACKBOX_API_KEY: '' };
                      setApiKeys(cleared);
                      localStorage.removeItem('pycode_custom_api_keys');
                    }}
                    className="text-[#8e918f] hover:text-red-400 transition-colors"
                  >
                    Clear Keys
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#282a2c] bg-[#18191a] flex items-center justify-between text-xs text-[#8e918f]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>High-Speed API Pipeline Online</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#282a2c] text-white hover:bg-[#37393b] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
