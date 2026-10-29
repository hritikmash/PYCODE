import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Code2, 
  Zap, 
  Layers, 
  GitFork, 
  Calendar, 
  Play, 
  Check, 
  HelpCircle,
  Terminal,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  MousePointerClick
} from 'lucide-react';
import { GeminiSparkle } from './GeminiIcons';
import { AI_ENGINES } from '../constants/aiEngines';
import { renderEngineIcon } from './AIEngineIcons';
import { SAMPLE_EXAMPLES } from '../data/samples';
import { SampleExample } from '../types';

interface AppTutorialModalProps {
  isOpen: boolean;
  onClose: (markCompleted?: boolean) => void;
  onSelectSample?: (sample: SampleExample) => void;
}

export const AppTutorialModal: React.FC<AppTutorialModalProps> = ({
  isOpen,
  onClose,
  onSelectSample
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  // Reset to step 0 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(dontShowAgain);
      } else if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, dontShowAgain, onClose]);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'welcome',
      badge: 'Welcome to Pycode',
      badgeColor: 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30',
      title: 'Accelerated Python Decoding & Learning',
      subtitle: 'Pycode transforms complex Python code and tricky questions into crystal-clear explanations, visual flowcharts, and instant bug fixes.',
      icon: <Sparkles className="w-6 h-6 text-[#00ff88]" />,
      renderContent: () => (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#1e1f20] border border-[#282a2c] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00ff88]/20 to-[#4285f4]/20 border border-[#00ff88]/40 flex items-center justify-center shrink-0">
              <GeminiSparkle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Your Personal Python Intelligence Co-Pilot</h4>
              <p className="text-xs text-[#8e918f] mt-0.5 leading-relaxed">
                Whether you're fixing a subtle recursion bug, understanding list mutation, or mastering decorators, Pycode breaks down code with surgical precision.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#1a1b1c] border border-[#282a2c]/80 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#a8c7fa] mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Multi-AI Engines</span>
              </div>
              <p className="text-[11px] text-[#8e918f] leading-normal">
                Choose from 6 specialized models: Gemini, ChatGPT, Perplexity, DeepSeek, Blackbox & Turbo.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1a1b1c] border border-[#282a2c]/80 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00ff88] mb-1">
                <GitFork className="w-4 h-4 text-[#00ff88]" />
                <span>Visual Flowcharts</span>
              </div>
              <p className="text-[11px] text-[#8e918f] leading-normal">
                See execution control flow, decision branches, loops, and return points charted in SVG.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1a1b1c] border border-[#282a2c]/80 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#c7ffd8] mb-1">
                <Calendar className="w-4 h-4 text-[#c7ffd8]" />
                <span>Date-Separated History</span>
              </div>
              <p className="text-[11px] text-[#8e918f] leading-normal">
                All previous prompts, code snippets, and complete AI outputs saved and organized by date.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dual-input',
      badge: 'Dual Input System',
      badgeColor: 'text-[#a8c7fa] bg-[#a8c7fa]/10 border-[#a8c7fa]/30',
      title: 'Prompt & File Uploads (+)',
      subtitle: 'Type or paste Python code and questions directly into the chat bar, or attach documents with the "+" button on the left. Press Enter directly to search.',
      icon: <Code2 className="w-6 h-6 text-[#a8c7fa]" />,
      renderContent: () => (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#1a1b1c] border border-[#282a2c] space-y-3 font-mono text-xs">
            {/* Visual simulation of Prompt Input */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-[#8e918f] font-sans font-medium flex items-center justify-between">
                <span>1. Chat & Code Input (Natural Language or Python)</span>
                <span className="text-[#a8c7fa] text-[10px]">Press Enter to search · Shift+Enter for newline</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#282a2c] border border-[#37393b] text-white flex items-center justify-between">
                <span className="text-white">def fib(n): return n if n &lt;= 1 else fib(n-1) + fib(n-2)</span>
                <span className="text-[10px] text-[#00ff88] px-2 py-0.5 rounded-full bg-[#1e1f20]">↵ Enter (Search)</span>
              </div>
            </div>

            {/* Visual simulation of Add File documents */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-[#8e918f] font-sans font-medium flex items-center justify-between">
                <span>2. Document Attachments ("+" Button)</span>
                <span className="text-[#00ff88] text-[10px]">PDF · Excel · Word · PowerPoint</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0f1110] border border-[#00ff66]/20 text-[#8ec89e] space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px]">
                    PDF Document
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px]">
                    Excel (.xlsx)
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-950/80 border border-sky-800 text-sky-300 text-[11px]">
                    Word (.docx)
                  </span>
                </div>
                <p className="text-[11px] text-[#8e918f] font-sans pt-1">
                  Uploaded files remain separate reference attachments and are never dumped into code editors.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#00ff88]" />
            </div>
            <p className="text-xs text-[#c4c7c5]">
              <strong className="text-white">Python-Only & Instant Enter-to-Send:</strong> Pressing Enter immediately sends your Python question or code. Inquiries are strictly focused on Python and errors are highlighted inline!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'ai-engines',
      badge: 'Multi-AI Switcher',
      badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      title: '6 Accelerated AI Engines at Your Fingertips',
      subtitle: 'Seamlessly switch models depending on whether you need fast syntax checks, deep reasoning, or documentation grounding.',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      renderContent: () => (
        <div className="space-y-3.5">
          <p className="text-xs text-[#8e918f]">
            Click the <strong className="text-white">AI Engine icon</strong> on the top left of the header anytime to open the model selector:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {AI_ENGINES.map((engine) => (
              <div 
                key={engine.id}
                className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] flex items-start gap-2.5 hover:border-[#37393b] transition-all"
              >
                <div className="p-1.5 rounded-lg bg-[#282a2c] text-white shrink-0 mt-0.5">
                  {renderEngineIcon(engine.iconType, 'w-4 h-4')}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{engine.name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">{engine.latencyBadge}</div>
                  <div className="text-[10px] text-[#8e918f] truncate mt-0.5">{engine.tagline}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] text-xs text-[#8e918f] flex items-center justify-between">
            <span>⚡ Ultra-low latency pipeline:</span>
            <span className="text-[#00ff88] font-mono font-medium">All engines optimized for 0.4s – 1.2s outputs</span>
          </div>
        </div>
      )
    },
    {
      id: 'workspace-modes',
      badge: '3 Learning Modes',
      badgeColor: 'text-[#d96570] bg-[#d96570]/10 border-[#d96570]/30',
      title: 'Tailor the Workspace to Your Style',
      subtitle: 'Switch between balanced dual-view, focused code debugging, or pure conceptual theory.',
      icon: <Layers className="w-6 h-6 text-[#d96570]" />,
      renderContent: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#1e1f20] border border-[#004a77] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-sky-500/10 rounded-bl-full pointer-events-none" />
              <div>
                <span className="text-xs font-bold text-[#a8c7fa] uppercase tracking-wider">Mode 1</span>
                <h4 className="text-sm font-semibold text-white mt-1">Theory + Code</h4>
                <p className="text-xs text-[#8e918f] mt-1.5 leading-relaxed">
                  Split view side-by-side. Deep theoretical concepts on the left, bug diffs and code on the right.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#282a2c] text-[10px] text-[#a8c7fa] font-medium">
                ★ Recommended for general learning
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1e1f20] border border-[#282a2c] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#8e918f] uppercase tracking-wider">Mode 2</span>
                <h4 className="text-sm font-semibold text-white mt-1">Code Only</h4>
                <p className="text-xs text-[#8e918f] mt-1.5 leading-relaxed">
                  Full-screen editor, line-by-line syntax fixes, functions explainer, and live execution traces.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#282a2c] text-[10px] text-[#8e918f]">
                Best for fast debugging & bug fixes
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1e1f20] border border-[#282a2c] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#8e918f] uppercase tracking-wider">Mode 3</span>
                <h4 className="text-sm font-semibold text-white mt-1">Theory Only</h4>
                <p className="text-xs text-[#8e918f] mt-1.5 leading-relaxed">
                  Deep conceptual guide, algorithmic complexity, Python internals, and foundational principles.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#282a2c] text-[10px] text-[#8e918f]">
                Best for interview prep & mental models
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-[#8e918f]">
            Switch modes at any time using the center pill switcher in the top navigation header.
          </p>
        </div>
      )
    },
    {
      id: 'visual-tools',
      badge: 'Visual Output & Flowcharts',
      badgeColor: 'text-[#c678dd] bg-[#c678dd]/10 border-[#c678dd]/30',
      title: 'Interactive Diagnostics & Flowcharts',
      subtitle: 'Understand why code works (or fails) with comprehensive diagnostic tools.',
      icon: <GitFork className="w-6 h-6 text-[#c678dd]" />,
      renderContent: () => (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <GitFork className="w-3.5 h-3.5" />
                </div>
                <span>Interactive Logic Flowchart</span>
              </div>
              <p className="text-xs text-[#8e918f] leading-relaxed">
                Automatically maps conditionals, loops, function calls, and return paths into visual SVG diagrams.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                <span>Side-by-Side Bug Diff Viewer</span>
              </div>
              <p className="text-xs text-[#8e918f] leading-relaxed">
                Highlights precise syntax & logic issues with red/green diffing, explaining why each correction is required.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>Execution Trace & Step Timeline</span>
              </div>
              <p className="text-xs text-[#8e918f] leading-relaxed">
                Step through runtime variables and loop iterations sequentially to pinpoint logic anomalies.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <span>Live Sandboxed Terminal</span>
              </div>
              <p className="text-xs text-[#8e918f] leading-relaxed">
                Inspect expected terminal outputs and verify corrected Python code in an in-browser sandbox.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'history-and-labs',
      badge: 'History & Learning Labs',
      badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
      title: 'Organized History & Ready-To-Run Labs',
      subtitle: 'Every question, piece of code, and AI response is safely preserved and categorized by date.',
      icon: <Calendar className="w-6 h-6 text-emerald-400" />,
      renderContent: () => (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00ff88]" />
              <span>Full History Restored on Click</span>
            </h4>
            <p className="text-xs text-[#8e918f] leading-relaxed">
              In the left sidebar, past sessions are organized chronologically under <strong>Today</strong>, <strong>Yesterday</strong>, and <strong>Previous 7 Days</strong>. Clicking any chat immediately restores your question, original Python snippet, and full AI diagnostic output.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#c4c7c5] flex items-center justify-between">
              <span>Ready-To-Run Learning Labs:</span>
              <span className="text-[11px] text-[#8e918f]">Pick one to test right now</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_EXAMPLES.slice(0, 2).map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    if (onSelectSample) {
                      onSelectSample(sample);
                    }
                    onClose(dontShowAgain);
                  }}
                  className="p-3 rounded-xl bg-[#1a1b1c] hover:bg-[#282a2c] border border-[#282a2c] hover:border-[#00ff66]/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-[#00ff88] transition-colors truncate">
                    {sample.title}
                  </div>
                  <div className="text-[10px] text-[#8e918f] line-clamp-1 mt-0.5">
                    {sample.description}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#a8c7fa] mt-2 font-medium">
                    <span>Load & Explore</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  const current = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose(dontShowAgain);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#131314] border border-[#282a2c] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#282a2c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1e1f20] border border-[#282a2c]">
              {current.icon}
            </div>
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${current.badgeColor}`}>
                {current.badge}
              </span>
              <div className="text-xs text-[#8e918f] font-mono mt-0.5">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClose(dontShowAgain)}
            className="p-2 rounded-full hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
            title="Close Tutorial (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar Indicator */}
        <div className="w-full bg-[#1e1f20] h-1 flex">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= currentStep ? 'bg-[#00ff88]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
          <div className="space-y-1.5">
            <h2 id="tutorial-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {current.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#c4c7c5] leading-relaxed">
              {current.subtitle}
            </p>
          </div>

          {/* Render Step Interactive Content */}
          <div className="pt-1">
            {current.renderContent()}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-6 py-4 bg-[#1a1b1c] border-t border-[#282a2c] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Step Indicator Dots & Don't Show Again */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStep 
                      ? 'bg-[#00ff88] w-6' 
                      : idx < currentStep 
                        ? 'bg-[#00ff88]/60 hover:bg-[#00ff88]' 
                        : 'bg-[#282a2c] hover:bg-[#37393b]'
                  }`}
                  title={`Go to Step ${idx + 1}`}
                />
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-[#8e918f] hover:text-[#c4c7c5] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#37393b] bg-[#282a2c] text-[#00ff88] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#00ff88]"
              />
              <span className="text-[11px]">Don't show again on startup</span>
            </label>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#282a2c] hover:bg-[#37393b] text-[#c4c7c5] hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                isLast
                  ? 'bg-[#00ff88] hover:bg-[#00e575] text-[#050807] font-bold shadow-[0_0_15px_rgba(0,255,136,0.3)]'
                  : 'bg-[#4285f4] hover:bg-[#3b78e7] text-white'
              }`}
            >
              <span>{isLast ? 'Get Started' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
