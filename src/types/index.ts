export type AnalysisMode = 'both' | 'code_only' | 'theory_only';

export interface PythonExecutionResult {
  hasSyntaxError: boolean;
  hasRuntimeError: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTimeMs?: number;
  parsedError?: {
    line: number;
    errorType: string;
    message: string;
  };
}

export interface CodeErrorItem {
  id: string;
  line: number;
  errorType: 'syntax' | 'logical' | 'runtime' | 'warning';
  severity: 'error' | 'warning' | 'info';
  verification: 'execution_verified' | 'ai_suggested';
  verificationBadge: string;
  originalSnippet: string;
  correctedSnippet: string;
  explanation: string;
  whyItFailed: string;
}

export interface CodeChange {
  before: string;
  after: string;
  reason: string;
  lineNumber?: number;
}

export interface FunctionExplanation {
  name: string;
  category: 'builtin_function' | 'method' | 'keyword' | 'operator' | 'data_type' | 'module';
  whatItDoes: string;
  whyItIsUsed: string;
  howItWorks: string;
  whyOnlyThisFunction: string;
  codeExample?: string;
}

export interface StepExplanation {
  stepNumber: number;
  title: string;
  lineRange: string;
  codeSnippet: string;
  purpose: string;
  functionsUsed: FunctionExplanation[];
}

export interface FlowchartNode {
  id: string;
  type: 'start' | 'input' | 'process' | 'decision' | 'loop' | 'output' | 'end';
  label: string;
  codeLine?: string;
  details?: string;
}

export interface FlowchartLink {
  from: string;
  to: string;
  label?: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  links: FlowchartLink[];
}

export interface ConceptualSubheading {
  title: string;
  explanation: string;
  codeSnippet?: string;
  keyPoints: string[];
}

export interface ConceptualSection {
  heading: string;
  subheadings: ConceptualSubheading[];
}

export interface ConceptualAnswer {
  title: string;
  overview: string;
  sections: ConceptualSection[];
  keyTakeaways: string[];
  beginnerAnalogies: string[];
  codeExamples?: {
    title: string;
    code: string;
    explanation: string;
  }[];
}

export interface ExecutionTraceStep {
  step: number;
  line: number;
  statement: string;
  variableStates: Record<string, string>;
  explanation: string;
}

export type SearchEngineType = 'google' | 'ms_edge' | 'firefox';

export interface SearchWebSource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface SearchEngineFallbackMeta {
  isFallback: boolean;
  engine: SearchEngineType;
  engineName: string;
  query: string;
  directSearchUrl: string;
  googleUrl: string;
  edgeUrl: string;
  firefoxUrl: string;
  reason: string;
  webSources: SearchWebSource[];
}

export interface PythonDecodeResponse {
  mode: AnalysisMode;
  summary: string;
  realExecution?: PythonExecutionResult;
  errors: CodeErrorItem[];
  correctedCode: string;
  originalCode: string;
  whatChanged: CodeChange[];
  stepByStepBreakdown: StepExplanation[];
  expectedOutput: string;
  flowchart: FlowchartData;
  conceptualAnswer?: ConceptualAnswer;
  executionTrace?: ExecutionTraceStep[];
  engineMeta?: EngineExecutionMeta;
  isPythonRestricted?: boolean;
  isInvalidQuery?: boolean;
  invalidMessageTitle?: string;
  invalidMessageSubtitle?: string;
  searchEngineFallback?: SearchEngineFallbackMeta;
}

export type DocumentType = 'pdf' | 'excel' | 'powerpoint' | 'word' | 'other';

export interface AttachedDocument {
  id: string;
  name: string;
  size: number;
  type: DocumentType;
  file?: File;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  question: string;
  code?: string;
  attachments?: AttachedDocument[];
  analysisResult?: PythonDecodeResponse;
  quickPyOutput?: any;
  engine?: AIEngineId;
  mode?: AnalysisMode;
  isPythonRestricted?: boolean;
  isInvalidQuery?: boolean;
  invalidMessageTitle?: string;
  invalidMessageSubtitle?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  engine?: AIEngineId;
  mode?: AnalysisMode;
}

export interface SampleExample {
  id: string;
  title: string;
  description: string;
  tag: string;
  mode: AnalysisMode;
  code: string;
  question: string;
}

export type AIEngineId = 'turbo_race' | 'gemini' | 'perplexity' | 'deepseek' | 'copilot' | 'groq' | 'chatgpt' | 'blackbox';

export type ExternalEngineId = 'gemini' | 'perplexity' | 'deepseek' | 'copilot' | 'groq' | 'chatgpt';

// Alias preserved for compatibility
export type ConnectorEngineId = ExternalEngineId;

export interface ExternalEngineCredentialMeta {
  engineId: ExternalEngineId;
  status: 'connected' | 'disconnected';
  maskedKey?: string;
  endpointUrl?: string;
  modelName?: string;
  connectedAt?: string;
  lastVerifiedAt?: string;
}

export interface SyncedEngineSession {
  engineId: AIEngineId;
  status: 'connected' | 'disconnected';
  syncedAt?: string;
  sessionTokenRef?: string;
  routeMode?: 'workspace_proxy' | 'custom_server_vault' | 'external_user_key';
}

export interface AIEngineInfo {
  id: AIEngineId;
  name: string;
  shortName?: string;
  provider: string;
  tagline: string;
  badge: string;
  latencyBadge: string;
  accentColor: string;
  iconType: 'gemini' | 'groq' | 'copilot' | 'chatgpt' | 'perplexity' | 'blackbox' | 'deepseek' | 'turbo';
  description: string;
  speedRanking: number;
  supportsRealTimeKeys: boolean;
  envKeyName?: string;
  isBuiltInDefault?: boolean;
  isConnectorEngine?: boolean;
  defaultEnabled?: boolean;
  connectionNote?: string;
  defaultEndpointUrl?: string;
  defaultModel?: string;
  apiKeyPlaceholder?: string;
  requiresEndpoint?: boolean;
}

export interface EngineExecutionMeta {
  engineId: AIEngineId;
  engineName: string;
  provider: string;
  model: string;
  latencyMs: number;
  speedRating: string;
  modelBadge: string;
  timestamp: string;
  isRealProviderKeyUsed?: boolean;
  isExternalByom?: boolean;
}


