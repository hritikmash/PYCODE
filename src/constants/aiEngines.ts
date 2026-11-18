import { AIEngineId, AIEngineInfo, ExternalEngineId } from '../types';

export const DEFAULT_BUILTIN_ENGINE_ID: AIEngineId = 'turbo_race';

export const EXTERNAL_ENGINE_IDS: ExternalEngineId[] = [
  'gemini',
  'perplexity',
  'deepseek',
  'copilot',
  'groq',
  'chatgpt'
];

// Alias for compatibility
export const CONNECTOR_ENGINE_IDS: ExternalEngineId[] = EXTERNAL_ENGINE_IDS;

export const AI_ENGINES: AIEngineInfo[] = [
  {
    id: 'turbo_race',
    name: 'Turbo AI (Default)',
    shortName: 'Turbo AI',
    provider: 'Pycode Built-In',
    tagline: 'Built-In Default Engine — Instant Python Debugging',
    badge: '🚀 Built-In Default',
    latencyBadge: '~520ms',
    accentColor: '#10b981', // emerald-500
    iconType: 'turbo',
    description: 'Pycode’s built-in internal engine pre-connected out of the box for instant Python debugging, AST analysis, and code execution.',
    speedRanking: 1,
    supportsRealTimeKeys: false,
    isBuiltInDefault: true,
    isConnectorEngine: false,
    defaultEnabled: true,
    connectionNote: 'Built-In Default • Always Active'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    shortName: 'Google Gemini',
    provider: 'Google AI (External)',
    tagline: 'External BYOM • Google AI Studio Key',
    badge: '✨ External Gemini',
    latencyBadge: '~650ms',
    accentColor: '#38bdf8', // sky-400
    iconType: 'gemini',
    description: 'Connect your personal Google Gemini API key to route Python diagnostics through your own Google AI quota.',
    speedRanking: 1,
    supportsRealTimeKeys: true,
    envKeyName: 'GEMINI_API_KEY',
    isConnectorEngine: true,
    defaultEnabled: false,
    connectionNote: 'External BYOM • Personal Gemini API Key',
    defaultEndpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    apiKeyPlaceholder: 'AIzaSy...'
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    shortName: 'Perplexity AI',
    provider: 'Perplexity (External)',
    tagline: 'External BYOM • Live Web & Docs Grounded',
    badge: '🟣 External Sonar',
    latencyBadge: '~1.0s',
    accentColor: '#06b6d4', // cyan-500
    iconType: 'perplexity',
    description: 'Connect your personal Perplexity Sonar API key for web-grounded Python PEP references and library diagnostics.',
    speedRanking: 3,
    supportsRealTimeKeys: true,
    envKeyName: 'PERPLEXITY_API_KEY',
    isConnectorEngine: true,
    defaultEnabled: false,
    connectionNote: 'External BYOM • Personal Sonar API Key',
    defaultEndpointUrl: 'https://api.perplexity.ai/chat/completions',
    defaultModel: 'sonar',
    apiKeyPlaceholder: 'pplx-...'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    shortName: 'DeepSeek',
    provider: 'DeepSeek (External)',
    tagline: 'External BYOM • Deep Algorithmic Reasoning',
    badge: '🔷 External V3/R1',
    latencyBadge: '~890ms',
    accentColor: '#6366f1', // indigo-500
    iconType: 'deepseek',
    description: 'Connect your personal DeepSeek API key for chain-of-thought algorithmic debugging and complexity analysis.',
    speedRanking: 3,
    supportsRealTimeKeys: true,
    envKeyName: 'DEEPSEEK_API_KEY',
    isConnectorEngine: true,
    defaultEnabled: false,
    connectionNote: 'External BYOM • Personal DeepSeek API Key',
    defaultEndpointUrl: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    apiKeyPlaceholder: 'sk-...'
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    shortName: 'Microsoft Copilot',
    provider: 'Microsoft / Azure AI (External)',
    tagline: 'External BYOM • Azure / GitHub Models Endpoint',
    badge: '🔷 External Copilot',
    latencyBadge: '~790ms',
    accentColor: '#0078d4', // Microsoft Blue
    iconType: 'copilot',
    description: 'Connect your personal Azure OpenAI, GitHub Models, or Copilot-compatible endpoint and API credentials.',
    speedRanking: 2,
    supportsRealTimeKeys: true,
    isConnectorEngine: true,
    defaultEnabled: false,
    connectionNote: 'External BYOM • API Key + Endpoint URL',
    defaultEndpointUrl: 'https://models.inference.ai.azure.com/chat/completions',
    defaultModel: 'gpt-4o',
    apiKeyPlaceholder: 'ghp_... or Azure api-key',
    requiresEndpoint: true
  },
  {
    id: 'groq',
    name: 'Groq',
    shortName: 'Groq',
    provider: 'Groq LPU (External)',
    tagline: 'External BYOM • Ultra-Fast Llama 3.3 Inference',
    badge: '⚡ External Groq LPU',
    latencyBadge: '~320ms',
    accentColor: '#f97316', // orange-500
    iconType: 'groq',
    description: 'Connect your personal Groq Cloud API key for hardware-accelerated sub-second Llama 3.3 inference.',
    speedRanking: 1,
    supportsRealTimeKeys: true,
    envKeyName: 'GROQ_API_KEY',
    isConnectorEngine: true,
    defaultEnabled: false,
    connectionNote: 'External BYOM • Personal Groq API Key',
    defaultEndpointUrl: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    apiKeyPlaceholder: 'gsk_...'
  },
  {
    id: 'chatgpt',
    name: 'OpenAI',
    shortName: 'OpenAI',
    provider: 'OpenAI (External)',
    tagline: 'External BYOM • GPT-4o / OpenAI-Compatible Key',
    badge: '🟢 External OpenAI',
    latencyBadge: '~1.1s',
    accentColor: '#10a37f', // openai green
    iconType: 'chatgpt',
    description: 'Connect your personal OpenAI API key (or custom OpenAI-compatible endpoint) using your own token quota.',
    speedRanking: 3,
    supportsRealTimeKeys: true,
    envKeyName: 'OPENAI_API_KEY',
    isConnectorEngine: true,
    defaultEnabled: false,
    connectionNote: 'External BYOM • Personal OpenAI API Key',
    defaultEndpointUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    apiKeyPlaceholder: 'sk-proj-...'
  },
  {
    id: 'blackbox',
    name: 'Blackbox AI',
    shortName: 'Blackbox AI',
    provider: 'Blackbox Code Inc.',
    tagline: 'Legacy Code Reference',
    badge: '⬛ Legacy',
    latencyBadge: '~750ms',
    accentColor: '#a855f7', // purple-500
    iconType: 'blackbox',
    description: 'Historical chat badge reference.',
    speedRanking: 2,
    supportsRealTimeKeys: false,
    isConnectorEngine: false
  }
];

export const BUILTIN_DEFAULT_ENGINE: AIEngineInfo =
  AI_ENGINES.find((e) => e.id === DEFAULT_BUILTIN_ENGINE_ID) || AI_ENGINES[0];

export const EXTERNAL_ENGINES: AIEngineInfo[] = AI_ENGINES.filter((e) => e.isConnectorEngine);

// Alias preserved for compatibility
export const CONNECTOR_ENGINES: AIEngineInfo[] = EXTERNAL_ENGINES;

/**
 * Strictly normalizes a list of external engine IDs.
 * Returns [] when none are connected (NEVER defaults to any external engine).
 */
export const normalizeExternalEngines = (engines?: AIEngineId[] | string[] | null): ExternalEngineId[] => {
  if (!Array.isArray(engines) || engines.length === 0) {
    return [];
  }
  const valid = (engines as string[]).filter((id): id is ExternalEngineId =>
    EXTERNAL_ENGINE_IDS.includes(id as ExternalEngineId)
  );
  return Array.from(new Set(valid));
};

// Compatibility export — strict isolation (returns [] instead of ['gemini'])
export const normalizeEnabledEngines = normalizeExternalEngines;

export const getAvailableWorkspaceEngines = (connectedExternal: ExternalEngineId[]): AIEngineInfo[] => {
  const externalInfos = EXTERNAL_ENGINES.filter((e) =>
    connectedExternal.includes(e.id as ExternalEngineId)
  );
  return [BUILTIN_DEFAULT_ENGINE, ...externalInfos];
};

export const getEngineById = (id: string): AIEngineInfo => {
  return AI_ENGINES.find((e) => e.id === id) || BUILTIN_DEFAULT_ENGINE;
};
