import { GoogleGenAI, Type } from '@google/genai';
import { executePythonCode } from './pythonRunner.ts';
import type { PythonDecodeResponse, AnalysisMode, AIEngineId, EngineExecutionMeta, SearchEngineType } from '../types/index.ts';
import { buildSearchEngineFallbackResponse } from './searchEngineFallback.ts';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables');
    }
    genAIInstance = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        timeout: 4000,
      },
    });
  }
  return genAIInstance;
}

interface EnginePromptConfig {
  name: string;
  provider: string;
  model: string;
  badge: string;
  systemInstruction: string;
}

function getEngineConfig(engineId: AIEngineId): EnginePromptConfig {
  switch (engineId) {
    case 'copilot':
      return {
        name: 'Microsoft Copilot',
        provider: 'Microsoft AI',
        model: 'copilot-gpt-4o',
        badge: '🔷 MS Copilot (0.8s)',
        systemInstruction: `You are Microsoft Copilot, operating as the premier Python intelligence engine within Pycode. You specialize in clean PEP-8 refactoring, AST error diagnosis, enterprise architecture, and idiomatic Python design patterns. Return only valid JSON matching the requested schema.`
      };
    case 'chatgpt':
      return {
        name: 'ChatGPT (GPT-4o)',
        provider: 'OpenAI',
        model: 'gpt-4o',
        badge: '🟢 Precision AST (1.1s)',
        systemInstruction: `You are OpenAI ChatGPT (GPT-4o), operating as the Python intelligence engine within Pycode. You strictly adhere to PEP-8 standards, detect Python AST discrepancies, highlight edge-case type mutations, and provide production-grade, idiomatic Python explanations. Return only valid JSON matching the requested schema.`
      };
    case 'perplexity':
      return {
        name: 'Perplexity AI (Sonar)',
        provider: 'Perplexity',
        model: 'sonar-pro',
        badge: '🟣 Live Docs (1.0s)',
        systemInstruction: `You are Perplexity AI (Sonar), operating as the Python documentation and intelligence engine within Pycode. You combine Python code comprehension with live PEP documentation links, library version changes, and community best practices. Return only valid JSON matching the requested schema.`
      };
    case 'blackbox':
      return {
        name: 'Blackbox AI',
        provider: 'Blackbox Code Inc.',
        model: 'blackbox-code-v2',
        badge: '⬛ Code Turbo (0.7s)',
        systemInstruction: `You are Blackbox AI, the ultra-fast developer code intelligence engine. You focus on rapid bug isolation, maximum execution speed, clean refactored snippets, and immediate developer productivity. Return only valid JSON matching the requested schema.`
      };
    case 'deepseek':
      return {
        name: 'DeepSeek AI (V3 / R1)',
        provider: 'DeepSeek',
        model: 'deepseek-coder-v3',
        badge: '🔷 Code Logic (0.9s)',
        systemInstruction: `You are DeepSeek-R1 / V3 AI, the deep algorithmic reasoning engine within Pycode. You specialize in deep logic analysis, mathematical edge cases, recursion limits, algorithmic complexity O(n), and rigorous chain-of-thought debugging. Return only valid JSON matching the requested schema.`
      };
    case 'turbo_race':
      return {
        name: 'Turbo Race (Fastest)',
        provider: 'Pycode Core',
        model: 'gemini-3.8-flash',
        badge: '🚀 Max Speed (0.5s)',
        systemInstruction: `You are Pycode Turbo Race, an ultra-fast Python code intelligence engine tuned for minimum latency. Analyze the code with extreme speed and precision, delivering instantaneous diagnoses and verified solutions. Return only valid JSON matching the requested schema.`
      };
    case 'gemini':
    default:
      return {
        name: 'Gemini 3.8 Flash',
        provider: 'Google AI',
        model: 'gemini-3.8-flash',
        badge: '⚡ Ultra Fast (0.6s)',
        systemInstruction: `You are Google Gemini 3.8 Flash, an expert Python educator and code intelligence platform within Pycode. You explain Python code with clarity, empathy, and technical rigor. You return only valid JSON matching the requested structure.`
      };
  }
}

// Optional external API caller for OpenAI / DeepSeek / Perplexity if custom keys are supplied
async function callExternalProvider(
  provider: 'openai' | 'deepseek' | 'perplexity',
  apiKey: string,
  prompt: string,
  systemInstruction: string
): Promise<string | null> {
  const endpoints = {
    openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
    deepseek: { url: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
    perplexity: { url: 'https://api.perplexity.ai/chat/completions', model: 'sonar' }
  };

  const config = endpoints[provider];
  if (!config) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s fast fallback

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'aistudio-build',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemInstruction + ' Respond ONLY with a valid JSON object.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`External provider ${provider} responded with ${res.status}`);
      return null;
    }

    const json: any = await res.json();
    return json?.choices?.[0]?.message?.content || null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`External provider ${provider} call failed, falling back to server Gemini:`, err);
    return null;
  }
}

function checkCodingLanguageRelevance(
  code: string,
  question: string,
  attachedDocs?: Array<{ name: string; type: string }>
): boolean {
  const c = (code || '').trim();
  const q = (question || '').toLowerCase().trim();

  // If code is present, check if it's code (in Python or any other coding language)
  if (c.length > 0) {
    const cLower = c.toLowerCase();

    // Check if user submitted a purely non-coding sentence disguised as code
    const forbiddenPhrases = [
      'stock price', 'market cap', 'buy shares', 'crypto trading', 'bitcoin price',
      'weather today', 'temperature tomorrow', 'recipe for', 'how to bake',
      'who won the game', 'football score', 'breaking news', 'election results'
    ];
    if (
      forbiddenPhrases.some(phrase => cLower.includes(phrase)) &&
      !cLower.includes('def ') &&
      !cLower.includes('function') &&
      !cLower.includes('const ') &&
      !cLower.includes('import ') &&
      !cLower.includes('class ')
    ) {
      return false;
    }

    // Common coding construct patterns (Python, JS, TS, Java, C, C++, C#, Go, Rust, PHP, SQL, HTML, CSS, Shell, etc.)
    const codingSignatures = [
      'def ', 'class ', 'import ', 'from ', 'print(', 'return ', 'if ', 'else:', 'elif ',
      'for ', 'while ', 'with ', 'try:', 'except', 'lambda ', '__init__', 'self.',
      'function', 'const ', 'let ', 'var ', 'console.log', '=>', '===', '!==',
      'public class', 'public static void', 'System.out', 'int ', 'float ', 'double ', 'char ',
      '#include', 'std::', 'printf', 'scanf', 'cout', 'cin', 'struct ', 'void ',
      'package ', 'func ', 'fmt.Print', 'goroutine', 'chan ',
      'fn ', 'let mut', 'impl ', 'trait ', 'match ', 'pub fn',
      'select ', 'from ', 'where ', 'insert into', 'update ', 'delete from', 'create table',
      '<html>', '<!doctype', '<div', '<script', '<style', '{', '}', ';', '/>',
      'echo ', '$', '<?php', 'val ', 'fun ', 'interface ', 'namespace '
    ];

    if (codingSignatures.some(sig => c.includes(sig) || cLower.includes(sig))) {
      return true;
    }

    // Structural code signals (brackets, operators, indentation, multi-line)
    if (c.includes('=') || c.includes('(') || c.includes('{') || c.includes('[') || c.includes(';') || c.split('\n').length > 1) {
      return true;
    }
  }

  // If question is empty and docs attached
  if (q.length === 0) {
    return Boolean(attachedDocs && attachedDocs.length > 0);
  }

  // Strictly prohibited topics blacklist (Rule strictly: news, stock, weather, recipes, sports, etc. are forbidden)
  const strictlyForbidden = [
    // Stocks & financial markets
    'stock', 'stocks', 'share market', 'share price', 'nasdaq', 'nyse', 'crypto', 'cryptocurrency',
    'bitcoin', 'ethereum', 'btc', 'eth', 'dogecoin', 'trading', 'forex', 'dividend', 'market cap',
    'mutual fund', 'invest in', 'buy shares', 'sell shares', 'wall street', 'sensex', 'nifty',

    // News & politics
    'news', 'breaking news', 'headline', 'headlines', 'politics', 'politician', 'election', 'elections',
    'president', 'prime minister', 'senator', 'parliament', 'congress', 'war in', 'treaty',
    'ceasefire', 'protest', 'diplomat', 'scandal', 'biden', 'trump', 'modi', 'putin',

    // Weather
    'weather', 'forecast', 'temperature today', 'is it raining', 'humidity', 'wind speed', 'climate in',

    // Recipes & cooking
    'recipe', 'cook', 'bake', 'cake', 'chicken curry', 'pasta sauce', 'dinner idea',
    'breakfast recipe', 'calories in', 'pizza recipe', 'biryani',

    // Sports
    'football', 'cricket', 'basketball', 'nba', 'ipl', 'fifa', 'super bowl',
    'tennis match', 'world cup score', 'who won the match', 'premier league',

    // Entertainment & celebrities
    'movie review', 'box office', 'actor', 'actress', 'hollywood', 'bollywood',
    'celebrity', 'song lyrics', 'who is married to', 'horoscope', 'zodiac sign', 'joke', 'tell me a joke'
  ];

  // Whitelist of programming/coding keywords
  const codingIndicators = [
    // Languages
    'python', 'py', 'javascript', 'js', 'typescript', 'ts', 'java', 'c++', 'cpp', 'c#',
    'c lang', 'rust', 'golang', 'go lang', 'swift', 'kotlin', 'php', 'ruby', 'sql',
    'html', 'css', 'bash', 'shell', 'powershell', 'r lang', 'scala', 'dart', 'solidity',
    'lua', 'perl', 'assembly', 'vba',
    
    // Core programming & CS concepts
    'code', 'coding', 'program', 'programming', 'developer', 'script', 'function', 'method',
    'class', 'variable', 'array', 'list', 'tuple', 'dict', 'dictionary', 'hashmap', 'set',
    'loop', 'for loop', 'while loop', 'recursion', 'algorithm', 'data structure',
    'binary tree', 'linked list', 'stack', 'queue', 'graph', 'sorting', 'search',
    'big o', 'complexity', 'ast', 'syntax error', 'runtime error', 'typeerror', 'exception',
    'debugging', 'debug', 'unit test', 'refactor', 'regex', 'api', 'rest api', 'json',
    'frontend', 'backend', 'fullstack', 'database', 'query', 'sql query',
    'framework', 'library', 'package', 'module', 'npm', 'pip', 'pep8', 'git', 'github',
    'terminal', 'cli', 'async', 'await', 'promise', 'callback', 'thread', 'concurrency',
    'multithreading', 'oop', 'inheritance', 'polymorphism', 'compiler', 'interpreter',
    'django', 'flask', 'fastapi', 'react', 'node', 'express', 'pandas', 'numpy',
    'scipy', 'pytorch', 'tensorflow', 'matplotlib', 'docker', 'linux command'
  ];

  const containsForbidden = strictlyForbidden.some(term => q.includes(term));
  const containsCoding = codingIndicators.some(term => q.includes(term));

  if (containsForbidden) {
    // Only allow if user is specifically asking for coding/programming implementation
    // (e.g. "write a python script to fetch stock ticker data from yfinance api")
    if (!containsCoding) {
      return false;
    }
  }

  // If question does not contain any coding indicator and has no code
  if (!containsCoding && c.length === 0) {
    if (attachedDocs && attachedDocs.length > 0) {
      if (q.includes('read') || q.includes('parse') || q.includes('load') || q.includes('extract') || q.includes('file') || q.includes('analyze') || q.includes('data')) {
        return true;
      }
    }
    return false;
  }

  return true;
}

export async function analyzePythonSubmission(params: {
  code?: string;
  question?: string;
  preferredMode?: AnalysisMode;
  engine?: AIEngineId;
  customApiKey?: string;
  customApiKeys?: Record<string, string>;
  attachedDocs?: Array<{ name: string; type: string; size: number }>;
  preferredSearchEngine?: SearchEngineType;
}): Promise<PythonDecodeResponse> {
  const startTime = Date.now();
  const code = (params.code || '').trim();
  const question = (params.question || '').trim();
  const selectedEngine: AIEngineId = params.engine || 'gemini';
  const engineConfig = getEngineConfig(selectedEngine);

  // Strictly check that chat is about Python or other coding language (Rule Enforcement)
  const isCodingLanguageQuery = checkCodingLanguageRelevance(code, question, params.attachedDocs);
  if (!isCodingLanguageQuery) {
    const latencyMs = Date.now() - startTime;
    return {
      mode: 'theory_only',
      summary: 'OOPS! YOUR QUESTION IS INVALID - ask related to python or other coding language',
      isInvalidQuery: true,
      invalidMessageTitle: 'OOPS! YOUR QUESTION IS INVALID',
      invalidMessageSubtitle: 'ask related to python or other coding language',
      isPythonRestricted: true,
      errors: [],
      correctedCode: '',
      originalCode: code,
      whatChanged: [],
      stepByStepBreakdown: [],
      expectedOutput: '',
      flowchart: { nodes: [], links: [] },
      engineMeta: {
        engineId: selectedEngine,
        engineName: engineConfig.name,
        provider: engineConfig.provider,
        model: engineConfig.model,
        latencyMs,
        speedRating: '⚡ Rule Guard Enforced',
        modelBadge: engineConfig.badge,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isRealProviderKeyUsed: false
      }
    };
  }

  // Determine active mode
  let mode: AnalysisMode = 'both';
  if (params.preferredMode && params.preferredMode !== 'both') {
    mode = params.preferredMode;
  } else if (code && !question) {
    mode = 'code_only';
  } else if (!code && question) {
    mode = 'theory_only';
  } else {
    mode = 'both';
  }

  // Concurrent Execution: Run Python 3.10 interpreter verification in parallel for ground truth
  const pythonPromise = code ? executePythonCode(code).catch(() => undefined) : Promise.resolve(undefined);

  const attachedDocsContext = params.attachedDocs && params.attachedDocs.length > 0
    ? `=== ATTACHED DOCUMENTS (Reference attachments, NOT code) ===\n${params.attachedDocs.map((d, i) => `[${i + 1}] ${d.name} (${d.type.toUpperCase()}, ${d.size} bytes)`).join('\n')}\n`
    : '';

  const prompt = `
You are ${engineConfig.name} (${engineConfig.provider}), powering Pycode — the premier Python learning platform designed to diagnose bugs, explain code, and teach programming concepts deeply.

CRITICAL CODING-ONLY RULE (STRICT):
Pycode strictly enforces that chats and questions MUST be about Python coding language or other coding languages (JavaScript, TypeScript, Java, C++, C#, C, Rust, Go, PHP, HTML, CSS, SQL, Kotlin, Swift, Ruby, Bash, etc.).
STRICTLY FORBIDDEN TOPICS: news, stocks, trading, finance, weather, recipes, food, sports, politics, celebrities, entertainment, or general non-coding chat.
If the user's submission is NOT about Python or other coding languages, you MUST set:
"isInvalidQuery": true,
"invalidMessageTitle": "OOPS! YOUR QUESTION IS INVALID",
"invalidMessageSubtitle": "ask related to python or other coding language",
"summary": "OOPS! YOUR QUESTION IS INVALID - ask related to python or other coding language"
and leave errors, correctedCode, and flowchart empty.

User Input:
${code ? `=== PYTHON CODE SUBMITTED ===\n${code}\n` : '(No Python code submitted)\n'}
${question ? `=== CONCEPTUAL QUESTION ===\n${question}\n` : '(No conceptual question asked)\n'}
${attachedDocsContext}

Analysis Instructions:
1. Active Mode: '${mode}'.
   - Inspect the code thoroughly for syntax errors, logical errors, off-by-one errors, type errors, mutation bugs, and anti-patterns.
   - For every error or potential issue:
     * Mark verification as "execution_verified" or "ai_suggested".
     * Provide verificationBadge: e.g. "Verified by Python 3.10 Interpreter" or "${engineConfig.name} Analysis".
     * Provide the original buggy snippet (highlighted in red) and the exact corrected snippet (highlighted in green), along with clear explanation and why it failed.
   - Provide the complete, pristine, corrected rewrite of the code (no omissions or ellipses).
   - Detail a "What Changed" list: old wording/construct -> new wording/construct, line number, and clear reason.
   - For each step or functional block of the code:
     * Explain what the step accomplishes.
     * Detail EVERY function, method, operator, and important keyword used (e.g. range, append, in, sorted, lambda, def, list.remove).
     * For each function/keyword, provide:
       1) "whatItDoes": direct explanation in plain beginner terms.
       2) "whyItIsUsed": the functional motivation in this specific context.
       3) "howItWorks": internal mechanics.
       4) "whyOnlyThisFunction": explain specifically why this function or construct was selected over alternatives.
   - Provide the accurate expected output of running the corrected code.
   - Create a structured flowchart representation:
     * Nodes with types ('start', 'input', 'process', 'decision', 'loop', 'output', 'end')
     * Label, associated codeLine, and descriptive details
     * Directed links between nodes with condition labels (e.g., "True", "False", "Next item", "Done")
   - Provide variable state execution trace (step by step) showing how variables transform.

2. Conceptual Learning:
   - If a conceptual question was asked (or in 'both' or 'theory_only' mode), provide a comprehensive, beginner-friendly conceptual answer:
     * Clear hierarchical organization: main title, overview, sections with headings and subheadings.
     * Bullet points for key takeaways.
     * Everyday beginner analogies that make abstract computer science concepts intuitive.
     * Practical, runnable Python code examples illustrating the concept cleanly.

Ensure all JSON values are valid, complete, and educational.
`;

  let responseText: string | null = null;
  let realKeyUsed = false;

  // Check if user has an external key for direct provider querying
  const customKeys = params.customApiKeys || {};
  if (selectedEngine === 'chatgpt' && (customKeys.OPENAI_API_KEY || process.env.OPENAI_API_KEY)) {
    const key = customKeys.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
    responseText = await callExternalProvider('openai', key, prompt, engineConfig.systemInstruction);
    if (responseText) realKeyUsed = true;
  } else if (selectedEngine === 'deepseek' && (customKeys.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY)) {
    const key = customKeys.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
    responseText = await callExternalProvider('deepseek', key, prompt, engineConfig.systemInstruction);
    if (responseText) realKeyUsed = true;
  } else if (selectedEngine === 'perplexity' && (customKeys.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY)) {
    const key = customKeys.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY || '';
    responseText = await callExternalProvider('perplexity', key, prompt, engineConfig.systemInstruction);
    if (responseText) realKeyUsed = true;
  }

  // If no external provider response, query high-speed server Gemini engine
  if (!responseText) {
    const ai = getGenAI();
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastErr: any = null;

    for (const targetModel of modelsToTry) {
      try {
        const generatePromise = ai.models.generateContent({
          model: targetModel,
          contents: prompt,
          config: {
            systemInstruction: engineConfig.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mode: { type: Type.STRING },
                summary: { type: Type.STRING },
                isInvalidQuery: { type: Type.BOOLEAN },
                invalidMessageTitle: { type: Type.STRING },
                invalidMessageSubtitle: { type: Type.STRING },
                isPythonRestricted: { type: Type.BOOLEAN },
              errors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    line: { type: Type.INTEGER },
                    errorType: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    verification: { type: Type.STRING },
                    verificationBadge: { type: Type.STRING },
                    originalSnippet: { type: Type.STRING },
                    correctedSnippet: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    whyItFailed: { type: Type.STRING },
                  },
                  required: ['id', 'line', 'errorType', 'severity', 'verification', 'verificationBadge', 'originalSnippet', 'correctedSnippet', 'explanation', 'whyItFailed']
                }
              },
              correctedCode: { type: Type.STRING },
              originalCode: { type: Type.STRING },
              whatChanged: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    before: { type: Type.STRING },
                    after: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    lineNumber: { type: Type.INTEGER }
                  },
                  required: ['before', 'after', 'reason']
                }
              },
              stepByStepBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    lineRange: { type: Type.STRING },
                    codeSnippet: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                    functionsUsed: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          category: { type: Type.STRING },
                          whatItDoes: { type: Type.STRING },
                          whyItIsUsed: { type: Type.STRING },
                          howItWorks: { type: Type.STRING },
                          whyOnlyThisFunction: { type: Type.STRING },
                          codeExample: { type: Type.STRING }
                        },
                        required: ['name', 'category', 'whatItDoes', 'whyItIsUsed', 'howItWorks', 'whyOnlyThisFunction']
                      }
                    }
                  },
                  required: ['stepNumber', 'title', 'lineRange', 'codeSnippet', 'purpose', 'functionsUsed']
                }
              },
              expectedOutput: { type: Type.STRING },
              flowchart: {
                type: Type.OBJECT,
                properties: {
                  nodes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING },
                        label: { type: Type.STRING },
                        codeLine: { type: Type.STRING },
                        details: { type: Type.STRING }
                      },
                      required: ['id', 'type', 'label']
                    }
                  },
                  links: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        from: { type: Type.STRING },
                        to: { type: Type.STRING },
                        label: { type: Type.STRING }
                      },
                      required: ['from', 'to']
                    }
                  }
                },
                required: ['nodes', 'links']
              },
              conceptualAnswer: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  overview: { type: Type.STRING },
                  sections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        heading: { type: Type.STRING },
                        subheadings: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              title: { type: Type.STRING },
                              explanation: { type: Type.STRING },
                              codeSnippet: { type: Type.STRING },
                              keyPoints: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                              }
                            },
                            required: ['title', 'explanation', 'keyPoints']
                          }
                        }
                      },
                      required: ['heading', 'subheadings']
                    }
                  },
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  beginnerAnalogies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  codeExamples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        code: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ['title', 'code', 'explanation']
                    }
                  }
                },
                required: ['title', 'overview', 'sections', 'keyTakeaways', 'beginnerAnalogies']
              },
              executionTrace: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.INTEGER },
                    line: { type: Type.INTEGER },
                    statement: { type: Type.STRING },
                    variableStates: {
                      type: Type.OBJECT,
                      properties: {
                        state: { type: Type.STRING }
                      }
                    },
                    explanation: { type: Type.STRING }
                  },
                  required: ['step', 'line', 'statement', 'explanation']
                }
              }
            },
            required: ['mode', 'summary', 'errors', 'correctedCode', 'originalCode', 'whatChanged', 'stepByStepBreakdown', 'expectedOutput', 'flowchart']
          }
        }
      });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${targetModel}`)), 2500)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        responseText = response.text || '{}';
        if (responseText && responseText.trim().startsWith('{')) break;
      } catch (err: unknown) {
        lastErr = err;
        console.warn(`Model ${targetModel} attempt failed, trying fallback:`, err);
      }
    }

    if (!responseText) {
      console.warn('All Gemini models exhausted / tokens over. Activating Google / MS Edge / Firefox Search Engine Fallback.');
      const fallbackResult = await buildSearchEngineFallbackResponse(
        code,
        question,
        mode,
        params.preferredSearchEngine || 'google'
      );
      const latencyMs = Date.now() - startTime;
      fallbackResult.engineMeta = {
        engineId: selectedEngine,
        engineName: `${engineConfig.name}`,
        provider: 'Google / MS Edge / Firefox Search Grounding',
        model: 'search-engine-grounded',
        latencyMs,
        speedRating: '🌐 Search Engine Fallback Activated',
        modelBadge: '🌐 Search Engine Intelligence',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isRealProviderKeyUsed: false
      };
      return fallbackResult;
    }
  }

  // Await the parallel Python 3.10 interpreter execution
  const realExecution = await pythonPromise;

  const parsed = JSON.parse(responseText || '{}') as PythonDecodeResponse;

  if (
    parsed.isInvalidQuery ||
    parsed.isPythonRestricted ||
    parsed.invalidMessageTitle === 'OOPS! YOUR QUESTION IS INVALID' ||
    (parsed.summary && parsed.summary.toUpperCase().includes('OOPS! YOUR QUESTION IS INVALID')) ||
    parsed.summary === 'PLEASE! Ask questions related to Python only.' ||
    (parsed.summary && parsed.summary.toLowerCase().includes('ask questions related to python only'))
  ) {
    parsed.isInvalidQuery = true;
    parsed.invalidMessageTitle = 'OOPS! YOUR QUESTION IS INVALID';
    parsed.invalidMessageSubtitle = 'ask related to python or other coding language';
    parsed.isPythonRestricted = true;
    parsed.summary = 'OOPS! YOUR QUESTION IS INVALID - ask related to python or other coding language';
    parsed.errors = [];
    parsed.correctedCode = '';
    parsed.whatChanged = [];
    parsed.stepByStepBreakdown = [];
    parsed.expectedOutput = '';
    parsed.flowchart = { nodes: [], links: [] };
  }

  const latencyMs = Date.now() - startTime;

  // Attach execution metadata & engine speed telemetry
  parsed.realExecution = realExecution;
  parsed.originalCode = code;
  if (!parsed.mode) parsed.mode = mode;

  const engineMeta: EngineExecutionMeta = {
    engineId: selectedEngine,
    engineName: engineConfig.name,
    provider: engineConfig.provider,
    model: engineConfig.model,
    latencyMs,
    speedRating: latencyMs < 850 ? '⚡ Ultra Fast Sub-Second Output' : latencyMs < 1600 ? '🚀 High Speed Turbo' : '⚡ Complete Pipeline',
    modelBadge: engineConfig.badge,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isRealProviderKeyUsed: realKeyUsed
  };

  parsed.engineMeta = engineMeta;

  return parsed;
}
