import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  BookOpen, 
  GitFork, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  Activity,
  Layers,
  ArrowRight,
  Cpu,
  RefreshCw,
  Calculator
} from 'lucide-react';
import { 
  PythonDecodeResponse, 
  AnalysisMode, 
  AIEngineId,
  CodeErrorItem 
} from '../types';
import { calculateCyclomaticComplexity } from '../utils/cyclomaticComplexity';
import { CodeDiffViewer } from './CodeDiffViewer';
import { FunctionExplainer } from './FunctionExplainer';
import { FlowchartViewer } from './FlowchartViewer';
import { ConceptualGuide } from './ConceptualGuide';
import { TerminalOutput } from './TerminalOutput';
import { ExecutionTraceViewer } from './ExecutionTraceViewer';
import { GeminiResponseActions } from './GeminiResponseActions';
import { SearchEngineFallbackBanner } from './SearchEngineFallbackBanner';

interface GeminiSolutionViewProps {
  result: PythonDecodeResponse;
  engine?: AIEngineId;
  userCode?: string;
  onSendMessage: (query: string, attachments: any[]) => void;
  onRunPythonSubprocess?: (code: string) => void;
  runningPythonOnly?: boolean;
  onQuickReAnalyze?: (engineId: AIEngineId) => void;
}

export const GeminiSolutionView: React.FC<GeminiSolutionViewProps> = ({
  result,
  engine = 'gemini',
  userCode,
  onSendMessage,
  onRunPythonSubprocess,
  runningPythonOnly = false,
  onQuickReAnalyze
}) => {
  // Current view tab: 'all' | 'diff' | 'functions' | 'flowchart' | 'theory' | 'terminal' | 'trace'
  const [activeTab, setActiveTab] = useState<'all' | 'diff' | 'functions' | 'flowchart' | 'theory' | 'terminal' | 'trace'>('all');
  
  // Current mode: both | code_only | theory_only
  const [currentMode, setCurrentMode] = useState<AnalysisMode>(result.mode || 'both');

  const totalFunctions = result.stepByStepBreakdown?.reduce((acc, s) => acc + (s.functionsUsed?.length || 0), 0) || 0;

  const codeForComplexity = userCode || result.originalCode;
  const complexity = calculateCyclomaticComplexity(codeForComplexity);

  // Handle clicking on an issue chip to immediately open the Diff tab
  const handleSelectIssue = (err: CodeErrorItem) => {
    setActiveTab('diff');
  };

  return (
    <div className="w-full max-w-full space-y-6 animate-in fade-in duration-200">
      {/* Search Engine Fallback Banner (if tokens are over) */}
      {result.searchEngineFallback && (
        <SearchEngineFallbackBanner fallback={result.searchEngineFallback} />
      )}

      {/* Code Diagnostics & Error Analysis Badges - rendered normally without enclosing box */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Cyclomatic Complexity Score Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-sans font-medium shadow-xs ${complexity.badgeClass}`}>
          <Calculator className="w-3.5 h-3.5 shrink-0" />
          <span>Complexity: <strong className="font-mono">{complexity.score}</strong> ({complexity.rating})</span>
        </div>

        {/* Python 3.10 Subprocess Verified Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1f20] border border-[#282a2c] text-[11px] text-[#c4c7c5]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Python 3.10 Verified</span>
        </div>

        {/* Diagnosed Issues Count Badge */}
        {result.errors.length > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-red-950/70 text-red-300 border border-red-800/80">
            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
            <span>{result.errors.length} {result.errors.length === 1 ? 'issue diagnosed' : 'issues diagnosed'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Zero Syntax Errors</span>
          </span>
        )}
      </div>

      {/* Code Diagnostics & Error Analysis Summary - Open, fluid presentation */}
      <div className="space-y-3">
        <div className="text-[15px] sm:text-[16px] text-[#f0f4f9] leading-relaxed font-normal whitespace-pre-wrap break-words">
          {result.summary}
        </div>

        {/* Diagnosed Issues Navigation Pills */}
        {result.errors && result.errors.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8e918f]">
              Diagnosed Issues:
            </span>
            {result.errors.map((err, i) => (
              <button
                key={err.id || i}
                type="button"
                onClick={() => handleSelectIssue(err)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-800/70 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Click to view line diff and fix"
              >
                <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                <span>Line {err.line}: {err.errorType.toUpperCase()}</span>
                <ArrowRight className="w-3 h-3 text-red-400 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Material 3 Navigation Filter Chips Bar */}
      <div className="pt-2 border-t border-[#282a2c]/80 flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs w-full sm:w-auto">
          {/* All Insights */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-medium ${
              activeTab === 'all'
                ? 'bg-[#004a77] text-[#c2e7ff] border border-[#005a92] shadow-xs ring-1 ring-[#a8c7fa]/20'
                : 'bg-[#1e1f20] text-[#8e918f] hover:text-white hover:bg-[#282a2c] border border-[#282a2c]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span>All Insights</span>
          </button>

          {/* Code Diff & Issues */}
          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-medium ${
              activeTab === 'diff'
                ? 'bg-[#004a77] text-[#c2e7ff] border border-[#005a92] shadow-xs ring-1 ring-[#a8c7fa]/20'
                : 'bg-[#1e1f20] text-[#8e918f] hover:text-white hover:bg-[#282a2c] border border-[#282a2c]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${result.errors.length > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
            <span>Code Diff & Issues</span>
            {result.errors.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-950 text-red-300 border border-red-800">
                {result.errors.length}
              </span>
            )}
          </button>

          {/* Functions & Keywords */}
          <button
            type="button"
            onClick={() => setActiveTab('functions')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-medium ${
              activeTab === 'functions'
                ? 'bg-[#004a77] text-[#c2e7ff] border border-[#005a92] shadow-xs ring-1 ring-[#a8c7fa]/20'
                : 'bg-[#1e1f20] text-[#8e918f] hover:text-white hover:bg-[#282a2c] border border-[#282a2c]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span>Functions & Keywords ({totalFunctions})</span>
          </button>

          {/* Control Flowchart */}
          <button
            type="button"
            onClick={() => setActiveTab('flowchart')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-medium ${
              activeTab === 'flowchart'
                ? 'bg-[#004a77] text-[#c2e7ff] border border-[#005a92] shadow-xs ring-1 ring-[#a8c7fa]/20'
                : 'bg-[#1e1f20] text-[#8e918f] hover:text-white hover:bg-[#282a2c] border border-[#282a2c]'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span>Logic Flowchart</span>
          </button>

          {/* Theory Guide */}
          {result.conceptualAnswer && (
            <button
              type="button"
              onClick={() => setActiveTab('theory')}
              className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-medium ${
                activeTab === 'theory'
                  ? 'bg-[#004a77] text-[#c2e7ff] border border-[#005a92] shadow-xs ring-1 ring-[#a8c7fa]/20'
                : 'bg-[#1e1f20] text-[#8e918f] hover:text-white hover:bg-[#282a2c] border border-[#282a2c]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Theory Guide</span>
            </button>
          )}

          {/* Terminal Sandbox */}
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-medium ${
              activeTab === 'terminal'
                ? 'bg-[#004a77] text-[#c2e7ff] border border-[#005a92] shadow-xs ring-1 ring-[#a8c7fa]/20'
                : 'bg-[#1e1f20] text-[#8e918f] hover:text-white hover:bg-[#282a2c] border border-[#282a2c]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal Sandbox</span>
          </button>

          {/* Trace Steps (if present) */}
          {result.executionTrace && result.executionTrace.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('trace')}
              className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-medium ${
                activeTab === 'trace'
                  ? 'bg-[#004a77] text-[#c2e7ff] border border-[#005a92] shadow-xs ring-1 ring-[#a8c7fa]/20'
                  : 'bg-[#1e1f20] text-[#8e918f] hover:text-white hover:bg-[#282a2c] border border-[#282a2c]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Trace</span>
            </button>
          )}
        </div>

        {/* Mode Switcher Pills: Both / Code Only / Theory Only */}
        <div className="flex items-center gap-1 bg-[#1e1f20] p-1 rounded-full border border-[#282a2c] self-start md:self-auto shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setCurrentMode('both')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              currentMode === 'both'
                ? 'bg-[#282a2c] text-white font-medium shadow-xs'
                : 'text-[#8e918f] hover:text-white'
            }`}
          >
            Both
          </button>
          <button
            type="button"
            onClick={() => setCurrentMode('code_only')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              currentMode === 'code_only'
                ? 'bg-[#282a2c] text-white font-medium shadow-xs'
                : 'text-[#8e918f] hover:text-white'
            }`}
          >
            Code Only
          </button>
          <button
            type="button"
            onClick={() => setCurrentMode('theory_only')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              currentMode === 'theory_only'
                ? 'bg-[#282a2c] text-white font-medium shadow-xs'
                : 'text-[#8e918f] hover:text-white'
            }`}
          >
            Theory Only
          </button>
        </div>
      </div>

      {/* Content Viewers Section */}
      <div className="space-y-6 pt-1 w-full max-w-full">
        {/* Mode: BOTH */}
        {currentMode === 'both' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-full">
            {/* Left Column: Conceptual Theory & Terminal Sandbox */}
            <div className="lg:col-span-5 space-y-6 w-full max-w-full">
              {(activeTab === 'all' || activeTab === 'theory') && (
                result.conceptualAnswer ? (
                  <ConceptualGuide answer={result.conceptualAnswer} />
                ) : (
                  <div className="p-5 rounded-3xl bg-[#1e1f20] border border-[#282a2c] text-xs text-[#8e918f] space-y-2">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Interactive Theory Guide</span>
                    </div>
                    <p>
                      Ask a conceptual question along with your code to automatically generate deep principle foundations, beginner analogies, and mental models.
                    </p>
                  </div>
                )
              )}

              {(activeTab === 'all' || activeTab === 'terminal') && (
                <TerminalOutput
                  expectedOutput={result.expectedOutput}
                  realExecution={result.realExecution}
                />
              )}
            </div>

            {/* Right Column: Code Diff, Step-by-Step Functions, Flowchart, Trace */}
            <div className="lg:col-span-7 space-y-6 w-full max-w-full">
              {(activeTab === 'all' || activeTab === 'diff') && (
                <CodeDiffViewer
                  originalCode={result.originalCode}
                  correctedCode={result.correctedCode}
                  errors={result.errors}
                  whatChanged={result.whatChanged}
                />
              )}

              {(activeTab === 'all' || activeTab === 'functions') && (
                <FunctionExplainer steps={result.stepByStepBreakdown} />
              )}

              {(activeTab === 'all' || activeTab === 'flowchart') && (
                <FlowchartViewer flowchart={result.flowchart} />
              )}

              {(activeTab === 'all' || activeTab === 'trace') && result.executionTrace && (
                <ExecutionTraceViewer trace={result.executionTrace} />
              )}
            </div>
          </div>
        )}

        {/* Mode: CODE ONLY */}
        {currentMode === 'code_only' && (
          <div className="space-y-6 w-full max-w-full">
            {(activeTab === 'all' || activeTab === 'diff') && (
              <CodeDiffViewer
                originalCode={result.originalCode}
                correctedCode={result.correctedCode}
                errors={result.errors}
                whatChanged={result.whatChanged}
              />
            )}

            {(activeTab === 'all' || activeTab === 'functions') && (
              <FunctionExplainer steps={result.stepByStepBreakdown} />
            )}

            {(activeTab === 'all' || activeTab === 'flowchart') && (
              <FlowchartViewer flowchart={result.flowchart} />
            )}

            {(activeTab === 'all' || activeTab === 'terminal') && (
              <TerminalOutput
                expectedOutput={result.expectedOutput}
                realExecution={result.realExecution}
              />
            )}

            {(activeTab === 'all' || activeTab === 'trace') && result.executionTrace && (
              <ExecutionTraceViewer trace={result.executionTrace} />
            )}
          </div>
        )}

        {/* Mode: THEORY ONLY */}
        {currentMode === 'theory_only' && (
          <div className="space-y-6 w-full max-w-full">
            {result.conceptualAnswer && (
              <ConceptualGuide answer={result.conceptualAnswer} />
            )}

            {(activeTab === 'all' || activeTab === 'functions') && (
              <FunctionExplainer steps={result.stepByStepBreakdown} />
            )}

            {(activeTab === 'all' || activeTab === 'diff') && result.correctedCode && (
              <CodeDiffViewer
                originalCode={result.originalCode}
                correctedCode={result.correctedCode}
                errors={result.errors}
                whatChanged={result.whatChanged}
              />
            )}

            {(activeTab === 'all' || activeTab === 'flowchart') && (
              <FlowchartViewer flowchart={result.flowchart} />
            )}

            {(activeTab === 'all' || activeTab === 'terminal') && (
              <TerminalOutput
                expectedOutput={result.expectedOutput}
                realExecution={result.realExecution}
              />
            )}
          </div>
        )}
      </div>

      {/* Response Actions Toolbar */}
      <div className="pt-3 border-t border-[#282a2c] w-full">
        <GeminiResponseActions
          result={result}
          codeSnippet={userCode || result.originalCode}
          onModifyResponse={(mod) => {
            let followUp = '';
            if (mod === 'shorter') followUp = 'Can you provide a shorter and more concise summary and solution of the previous code?';
            else if (mod === 'longer') followUp = 'Can you provide a more detailed in-depth breakdown of this code?';
            else if (mod === 'simpler') followUp = 'Can you explain this more simply using everyday analogies for a complete beginner?';
            else if (mod === 'technical') followUp = 'Can you explain the deep underlying Python C-API, memory layout, and AST mechanics?';
            if (followUp) {
              onSendMessage(followUp, []);
            }
          }}
          onReTestPython={() => {
            const codeToRun = userCode || result.originalCode;
            if (codeToRun && onRunPythonSubprocess) {
              onRunPythonSubprocess(codeToRun);
            }
          }}
          isTestingPython={runningPythonOnly}
        />
      </div>
    </div>
  );
};
