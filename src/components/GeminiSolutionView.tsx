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
  Layers,
  ArrowRight,
  Cpu,
  RefreshCw,
  Calculator,
  Copy,
  Check,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Play,
  CornerDownRight,
  Plus
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
import { DEFAULT_BUILTIN_ENGINE_ID } from '../constants/aiEngines';

interface GeminiSolutionViewProps {
  result: PythonDecodeResponse;
  engine?: AIEngineId;
  mode?: AnalysisMode;
  userCode?: string;
  onSendMessage: (query: string, attachments: any[]) => void;
  onRunPythonSubprocess?: (code: string) => void;
  runningPythonOnly?: boolean;
  onQuickReAnalyze?: (engineId: AIEngineId) => void;
}

export const GeminiSolutionView: React.FC<GeminiSolutionViewProps> = ({
  result,
  engine = DEFAULT_BUILTIN_ENGINE_ID,
  mode,
  userCode,
  onSendMessage,
  onRunPythonSubprocess,
  runningPythonOnly = false,
  onQuickReAnalyze
}) => {
  const effectiveMode: AnalysisMode = mode || result.mode || 'both';
  const [activeTab, setActiveTab] = useState<'all' | 'diff' | 'functions' | 'flowchart' | 'theory' | 'terminal' | 'trace'>('all');
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const availableTabs = React.useMemo(() => {
    if (effectiveMode === 'theory_only') {
      return [
        { id: 'all', label: 'All Theory' },
        { id: 'theory', label: 'Concept Theory' }
      ];
    }
    if (effectiveMode === 'code_only') {
      return [
        { id: 'all', label: 'All Code' },
        { id: 'diff', label: 'Code Fix & Diff' },
        { id: 'functions', label: 'Functions Breakdown' },
        { id: 'flowchart', label: 'Logic Flowchart' },
        { id: 'terminal', label: 'Subprocess Terminal' },
        { id: 'trace', label: 'Interactive Trace' }
      ];
    }
    return [
      { id: 'all', label: 'Theory + Code (All)' },
      { id: 'theory', label: 'Concept Theory' },
      { id: 'diff', label: 'Code Fix & Diff' },
      { id: 'functions', label: 'Functions Breakdown' },
      { id: 'flowchart', label: 'Logic Flowchart' },
      { id: 'terminal', label: 'Subprocess Terminal' },
      { id: 'trace', label: 'Interactive Trace' }
    ];
  }, [effectiveMode]);

  const codeForComplexity = userCode || result.originalCode;
  const complexity = calculateCyclomaticComplexity(codeForComplexity);

  // Generate dynamic contextual Perplexity-style related questions
  const relatedQuestions: string[] = React.useMemo(() => {
    const list: string[] = [];
    if (result.errors && result.errors.length > 0) {
      list.push(`Why did this ${result.errors[0]?.errorType || 'syntax'} error occur?`);
      list.push(`How do I write unit tests for this corrected code?`);
    } else {
      list.push(`How can I optimize the time and space complexity of this logic?`);
      list.push(`Can this be refactored into a more Pythonic function or generator?`);
    }
    const allFunctions = result.stepByStepBreakdown?.flatMap(s => s.functionsUsed) || [];
    if (allFunctions.length > 0) {
      list.push(`Explain the internal implementation of '${allFunctions[0].name}' in Python.`);
    } else {
      list.push(`What edge cases should I handle when passing empty or null inputs?`);
    }
    return list.slice(0, 3);
  }, [result]);

  const handleCopyFullAnswer = () => {
    const textToCopy = `Summary:\n${result.summary}\n\nCorrected Code:\n${result.correctedCode || userCode || ''}\n\nBreakdown:\n${result.stepByStepBreakdown?.map(s => s.title + ': ' + s.purpose).join('\n') || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2500);
  };

  return (
    <div className="w-full max-w-full space-y-5 animate-in fade-in duration-200">
      {/* Search Engine Fallback Banner (if tokens over) */}
      {result.searchEngineFallback && (
        <SearchEngineFallbackBanner fallback={result.searchEngineFallback} />
      )}

      {/* Perplexity AI Sources / Verified Engines Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#858585] font-semibold">
          <Layers className="w-3.5 h-3.5 text-[#20b8cd]" />
          <span>Verified Sources & Execution Engines</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {/* Source 1: Python 3.10 Subprocess */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191a1a] border border-[#2d3131] hover:border-[#3d4245] transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[#ededed] font-medium">Python 3.10 Sandbox</span>
            <span className="text-[10px] text-[#858585] font-mono">0ms runtime</span>
          </div>

          {/* Source 2: Big-O Complexity Badge */}
          <div 
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors font-mono text-xs ${complexity.badgeClass}`}
            title={`Big-O Algorithmic Complexity: Time ${complexity.timeComplexity} (${complexity.rating}) · Space ${complexity.spaceComplexity}`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Time: <strong className="font-semibold">{complexity.timeComplexity}</strong></span>
            <span className="opacity-40">·</span>
            <span>Space: <strong className="font-semibold">{complexity.spaceComplexity}</strong></span>
          </div>

          {/* Source 3: Syntax & Runtime Status */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono ${
            result.errors.length > 0 
              ? 'bg-red-950/40 border-red-800/60 text-red-300' 
              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
          }`}>
            {result.errors.length > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>{result.errors.length} {result.errors.length === 1 ? 'Syntax Issue' : 'Syntax Issues'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Syntax Errors</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Answer Container (Perplexity Style) */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#191a1a] border border-[#2d3131] space-y-6 shadow-sm">
        {/* Header with Title & Action Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242828]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#20b8cd]" />
            <h3 className="text-base font-semibold text-white tracking-tight">Answer</h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#858585]">
            <button
              type="button"
              onClick={handleCopyFullAnswer}
              className="p-1.5 rounded-lg hover:bg-[#202222] text-[#858585] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              title="Copy answer"
            >
              {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedAnswer ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => setFeedbackGiven('up')}
              className={`p-1.5 rounded-lg hover:bg-[#202222] transition-colors cursor-pointer ${
                feedbackGiven === 'up' ? 'text-[#20b8cd]' : 'text-[#858585] hover:text-white'
              }`}
              title="Good answer"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setFeedbackGiven('down')}
              className={`p-1.5 rounded-lg hover:bg-[#202222] transition-colors cursor-pointer ${
                feedbackGiven === 'down' ? 'text-red-400' : 'text-[#858585] hover:text-white'
              }`}
              title="Needs improvement"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#131414] p-1 rounded-2xl border border-[#242828] text-xs">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#202222] text-white shadow-xs font-semibold'
                  : 'text-[#858585] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary Paragraph */}
        {result.summary && (
          <div className="text-sm leading-relaxed text-[#ededed] whitespace-pre-wrap">
            {result.summary}
          </div>
        )}

        {/* TAB CONTENTS - DYNAMIC TO MODE */}
        {/* Theory Section (Always shown in Theory mode and Theory + Code mode) */}
        {(activeTab === 'all' || activeTab === 'theory') && effectiveMode !== 'code_only' && result.conceptualAnswer && (
          <ConceptualGuide answer={result.conceptualAnswer} />
        )}

        {/* Code Diff & Fix (Shown in Code and Theory + Code modes) */}
        {(activeTab === 'all' || activeTab === 'diff') && effectiveMode !== 'theory_only' && (result.correctedCode || userCode) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span>Corrected Code Implementation</span>
              {onRunPythonSubprocess && (
                <button
                  type="button"
                  onClick={() => onRunPythonSubprocess(result.correctedCode || userCode || '')}
                  disabled={runningPythonOnly}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-xs font-medium cursor-pointer transition-all active:scale-95"
                >
                  <Play className="w-3 h-3 fill-emerald-300" />
                  <span>{runningPythonOnly ? 'Executing...' : 'Run in Subprocess'}</span>
                </button>
              )}
            </div>

            <CodeDiffViewer 
              originalCode={result.originalCode || userCode || ''}
              correctedCode={result.correctedCode || ''}
              errors={result.errors || []}
              whatChanged={result.whatChanged || []}
            />
          </div>
        )}

        {/* Functions Explainer */}
        {(activeTab === 'all' || activeTab === 'functions') && effectiveMode !== 'theory_only' && result.stepByStepBreakdown && result.stepByStepBreakdown.length > 0 && (
          <FunctionExplainer steps={result.stepByStepBreakdown} />
        )}

        {/* Flowchart AST Viewer */}
        {(activeTab === 'all' || activeTab === 'flowchart') && effectiveMode !== 'theory_only' && result.flowchart && (
          <FlowchartViewer flowchart={result.flowchart} />
        )}

        {/* Terminal Output */}
        {(activeTab === 'all' || activeTab === 'terminal') && effectiveMode !== 'theory_only' && (
          <TerminalOutput 
            expectedOutput={result.expectedOutput || ''}
            realExecution={result.realExecution}
          />
        )}

        {/* Execution Trace */}
        {(activeTab === 'all' || activeTab === 'trace') && effectiveMode !== 'theory_only' && result.executionTrace && (
          <ExecutionTraceViewer trace={result.executionTrace} />
        )}
      </div>

      {/* Perplexity AI Signature "Related" Queries Section */}
      {relatedQuestions.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#191a1a] border border-[#2d3131] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <CornerDownRight className="w-4 h-4 text-[#20b8cd]" />
            <span>Related Questions</span>
          </div>

          <div className="space-y-1.5">
            {relatedQuestions.map((query, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(query, [])}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#131414] hover:bg-[#202222] border border-[#242828] hover:border-[#383c3c] text-left text-xs text-[#c4c7c5] hover:text-white transition-all cursor-pointer group"
              >
                <span className="truncate pr-2">{query}</span>
                <Plus className="w-3.5 h-3.5 text-[#858585] group-hover:text-[#20b8cd] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
