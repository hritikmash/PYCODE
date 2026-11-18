export type PyFixMode = 'beginner' | 'interview';

export interface ErrorAnalysis {
  has_error: boolean;
  error_type: string;
  error_line: number;
  plain_english_reason: string;
  fix_summary: string;
}

export interface FunctionBreakdown {
  name: string;
  syntax: string;
  purpose: string;
  time_complexity: string;
  mini_example: string;
}

export interface PyFixAnalyzeResponse {
  corrected_code: string;
  error_analysis: ErrorAnalysis;
  step_by_step_explanation: string[];
  functions_breakdown: FunctionBreakdown[];
  tokens_used: number;
  cached?: boolean;
}

export interface HistoryEntry {
  id: string;
  title: string;
  timestamp: string;
  mode: PyFixMode;
  query: string;
  originalCode: string;
  result: PyFixAnalyzeResponse;
  estimatedCostUsd: number;
}

export interface SampleSnippet {
  id: string;
  label: string;
  mode: PyFixMode;
  query: string;
  code: string;
}
