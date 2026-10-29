import { AIEngineInfo } from '../types';

export const AI_ENGINES: AIEngineInfo[] = [
  {
    id: 'gemini',
    name: 'Gemini 3.8 Flash',
    provider: 'Google AI',
    tagline: 'Ultra-Fast Ground-Truth Engine',
    badge: '⚡ Ultra Fast (0.6s)',
    latencyBadge: '~650ms',
    accentColor: '#38bdf8', // sky-400
    iconType: 'gemini',
    description: 'Blazing fast sub-second analysis powered by Google Gemini 3.8 Flash with built-in Python 3.10 runtime verification.',
    speedRanking: 1,
    supportsRealTimeKeys: true,
    envKeyName: 'GEMINI_API_KEY'
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    provider: 'Microsoft AI',
    tagline: 'Enterprise Code & AST Intelligence',
    badge: '🔷 MS Copilot (0.8s)',
    latencyBadge: '~790ms',
    accentColor: '#0078d4', // Microsoft Blue
    iconType: 'copilot',
    description: 'Microsoft Copilot Python intelligence specializing in AST parsing, clean PEP-8 refactoring, and enterprise architectural design patterns.',
    speedRanking: 2,
    supportsRealTimeKeys: true,
    envKeyName: 'COPILOT_API_KEY'
  },
  {
    id: 'turbo_race',
    name: 'Turbo Race (Fastest)',
    provider: 'Pycode Core',
    tagline: 'Minimum Latency Route',
    badge: '🚀 Max Speed (0.5s)',
    latencyBadge: '~520ms',
    accentColor: '#10b981', // emerald-500
    iconType: 'turbo',
    description: 'Runs parallel low-latency optimization with streamlined token streaming to deliver the fastest diagnostic output possible.',
    speedRanking: 1,
    supportsRealTimeKeys: false
  },
  {
    id: 'blackbox',
    name: 'Blackbox AI',
    provider: 'Blackbox Code Inc.',
    tagline: 'Developer Code Acceleration',
    badge: '⬛ Code Turbo (0.7s)',
    latencyBadge: '~750ms',
    accentColor: '#a855f7', // purple-500
    iconType: 'blackbox',
    description: 'Specialized developer model tuned for immediate code refactoring, bug fixes, and lightning-fast syntax autocompletions.',
    speedRanking: 2,
    supportsRealTimeKeys: true,
    envKeyName: 'BLACKBOX_API_KEY'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI (V3 / R1)',
    provider: 'DeepSeek',
    tagline: 'Deep Algorithmic Reasoning',
    badge: '🔷 Code Logic (0.9s)',
    latencyBadge: '~890ms',
    accentColor: '#6366f1', // indigo-500
    iconType: 'deepseek',
    description: 'Exceptional chain-of-thought mathematical and algorithmic analysis. Finds subtle logical bugs and boundary condition pitfalls.',
    speedRanking: 3,
    supportsRealTimeKeys: true,
    envKeyName: 'DEEPSEEK_API_KEY'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT (GPT-4o)',
    provider: 'OpenAI',
    tagline: 'Precision Syntax & PEP-8 Standards',
    badge: '🟢 Precision AST (1.1s)',
    latencyBadge: '~1.1s',
    accentColor: '#10a37f', // openai green
    iconType: 'chatgpt',
    description: 'Industry-standard Python intelligence with strict adherence to PEP-8, AST parsing, and idiomatic Python design patterns.',
    speedRanking: 4,
    supportsRealTimeKeys: true,
    envKeyName: 'OPENAI_API_KEY'
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI (Sonar)',
    provider: 'Perplexity',
    tagline: 'Web & Documentation Grounded',
    badge: '🟣 Live Docs (1.0s)',
    latencyBadge: '~1.0s',
    accentColor: '#06b6d4', // cyan-500
    iconType: 'perplexity',
    description: 'Combines Python code comprehension with live PEP documentation links, library version changes, and community best practices.',
    speedRanking: 3,
    supportsRealTimeKeys: true,
    envKeyName: 'PERPLEXITY_API_KEY'
  }
];

export const getEngineById = (id: string): AIEngineInfo => {
  return AI_ENGINES.find(e => e.id === id) || AI_ENGINES[0];
};
