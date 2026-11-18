import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import type { PyFixAnalyzeResponse, PyFixMode } from '../types/pyfix.ts';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

const analysisCache = new Map<string, PyFixAnalyzeResponse>();

function buildCacheKey(code: string, query: string, mode: PyFixMode): string {
  const normalized = JSON.stringify({
    code,
    query: query.trim(),
    mode,
  });
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export async function analyzePyFixSubmission(params: {
  query: string;
  code: string;
  mode: PyFixMode;
}): Promise<PyFixAnalyzeResponse> {
  const code = params.code ?? '';
  const query = (params.query ?? '').trim();
  const mode: PyFixMode = params.mode === 'interview' ? 'interview' : 'beginner';

  if (!code.trim() && !query) {
    throw new Error('Please provide Python code or a question to analyze.');
  }

  const cacheKey = buildCacheKey(code, query, mode);
  const cached = analysisCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      cached: true,
    };
  }

  const modeGuidance =
    mode === 'beginner'
      ? 'Target audience is a Python beginner: use clear, jargon-free plain English, explain why the bug happens conceptually, and keep mini examples short and runnable.'
      : 'Target audience is a software engineer preparing for technical interviews: focus on edge cases, algorithmic bottlenecks, Big-O time/space complexity, and idiomatic Python.';

  const systemInstruction = [
    'You are PyFix AI, a senior Python debugging and code-intelligence engine.',
    modeGuidance,
    'Inspect the submitted Python code carefully.',
    '1. Identify any syntax, runtime, or logical bugs. Set error_analysis.error_line to the 1-based line number of the primary issue (or 0 if has_error is false).',
    '2. Provide clean, working corrected_code.',
    '3. Write step_by_step_explanation as concise, clear sentences. Explicitly mention key Python built-ins, methods, or constructs by name (e.g., enumerate(), map(), zip(), set(), range(), len()) that also appear in functions_breakdown so interactive function pills attach cleanly.',
    '4. Populate functions_breakdown with 2 to 6 key Python functions, methods, or constructs used in the corrected code, including syntax, purpose, Big-O time_complexity (e.g., "O(1)", "O(n)", "O(n log n)"), and a concise copyable mini_example.',
    'Return valid JSON strictly matching the response schema.',
  ].join(' ');

  const userPrompt = [
    `Mode: ${mode}`,
    `User Question: ${query || 'Find and fix all bugs, and explain how this code works.'}`,
    '',
    'Python Code:',
    '```python',
    code,
    '```',
  ].join('\n');

  const ai = getGenAI();

  const requestConfig = {
    model: 'gemini-4-hydrogen',
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          corrected_code: {
            type: Type.STRING,
            description: 'The complete, corrected, runnable Python code.',
          },
          error_analysis: {
            type: Type.OBJECT,
            properties: {
              has_error: { type: Type.BOOLEAN },
              error_type: { type: Type.STRING },
              error_line: { type: Type.INTEGER },
              plain_english_reason: { type: Type.STRING },
              fix_summary: { type: Type.STRING },
            },
            required: [
              'has_error',
              'error_type',
              'error_line',
              'plain_english_reason',
              'fix_summary',
            ],
          },
          step_by_step_explanation: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Ordered plain-English explanation steps referencing key functions.',
          },
          functions_breakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                syntax: { type: Type.STRING },
                purpose: { type: Type.STRING },
                time_complexity: { type: Type.STRING },
                mini_example: { type: Type.STRING },
              },
              required: ['name', 'syntax', 'purpose', 'time_complexity', 'mini_example'],
            },
          },
          tokens_used: {
            type: Type.INTEGER,
            description: 'Approximate token count.',
          },
        },
        required: [
          'corrected_code',
          'error_analysis',
          'step_by_step_explanation',
          'functions_breakdown',
          'tokens_used',
        ],
      },
    },
  };

  let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await ai.models.generateContent(requestConfig);
      break;
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err || '');
      const status = err?.status || err?.code;
      const isTransient =
        status === 503 ||
        status === 429 ||
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('RESOURCE_EXHAUSTED');

      if (isTransient && attempt < 2) {
        const delayMs = 700 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Extract readable message if SDK threw JSON string
      let cleanMsg = msg;
      try {
        const parsedErr = JSON.parse(msg);
        if (parsedErr?.error?.message) {
          cleanMsg = parsedErr.error.message;
        }
      } catch {
        // Use raw message
      }
      throw new Error(cleanMsg || 'Gemini API request failed.');
    }
  }

  if (!response) {
    throw new Error(String((lastError as any)?.message || 'Gemini API request failed.'));
  }

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Empty response received from Gemini API.');
  }

  const parsed = JSON.parse(rawText) as PyFixAnalyzeResponse;
  const realTokens =
    response.usageMetadata?.totalTokenCount ??
    (typeof parsed.tokens_used === 'number' && parsed.tokens_used > 0
      ? parsed.tokens_used
      : Math.ceil((userPrompt.length + rawText.length) / 4));

  const normalized: PyFixAnalyzeResponse = {
    corrected_code: parsed.corrected_code || code,
    error_analysis: {
      has_error: Boolean(parsed.error_analysis?.has_error),
      error_type: parsed.error_analysis?.error_type || (parsed.error_analysis?.has_error ? 'Error' : 'No Error Detected'),
      error_line: Number.isFinite(parsed.error_analysis?.error_line) ? parsed.error_analysis.error_line : 0,
      plain_english_reason: parsed.error_analysis?.plain_english_reason || 'No runtime or syntax errors detected.',
      fix_summary: parsed.error_analysis?.fix_summary || 'Code verified and formatted cleanly.',
    },
    step_by_step_explanation: Array.isArray(parsed.step_by_step_explanation)
      ? parsed.step_by_step_explanation
      : [],
    functions_breakdown: Array.isArray(parsed.functions_breakdown)
      ? parsed.functions_breakdown
      : [],
    tokens_used: realTokens,
    cached: false,
  };

  if (analysisCache.size >= 500) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) {
      analysisCache.delete(oldestKey);
    }
  }
  analysisCache.set(cacheKey, normalized);

  return normalized;
}
