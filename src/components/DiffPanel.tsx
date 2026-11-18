import React, { useState } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { Check, Columns2, Copy, GitCompareArrows, Play, Rows3 } from 'lucide-react';

interface DiffPanelProps {
  originalCode: string;
  correctedCode: string;
  onRunInSandbox: () => void;
  isSandboxRunning?: boolean;
}

export const DiffPanel: React.FC<DiffPanelProps> = ({
  originalCode,
  correctedCode,
  onRunInSandbox,
  isSandboxRunning = false,
}) => {
  const [splitView, setSplitView] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyFixed = async () => {
    if (!correctedCode) return;
    await navigator.clipboard.writeText(correctedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden shadow-[0_0_20px_rgba(56,189,248,0.05)]">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0F172A] border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <GitCompareArrows className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-100 whitespace-nowrap">
            Code Diff
          </h3>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-xs text-slate-400 hidden sm:inline truncate">
            Original vs Corrected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Split / Unified Segmented Control */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#090D16] border border-slate-800">
            <button
              type="button"
              onClick={() => setSplitView(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                splitView
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setSplitView(false)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                !splitView
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Rows3 className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyFixed}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Fix</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRunInSandbox}
            disabled={isSandboxRunning || !correctedCode.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-[0_0_14px_rgba(6,182,212,0.28)]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSandboxRunning ? 'Running...' : 'Run in Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Diff Viewport */}
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto bg-[#0B1120] text-xs">
        <ReactDiffViewer
          oldValue={originalCode || ''}
          newValue={correctedCode || ''}
          splitView={splitView}
          useDarkTheme={true}
          disableWorker={true}
          highlightLanguage="python"
          compareMethod={DiffMethod.WORDS}
          leftTitle="Original Code"
          rightTitle="Corrected Code"
          styles={{
            variables: {
              dark: {
                diffViewerBackground: '#0B1120',
                diffViewerColor: '#E2E8F0',
                addedBackground: 'rgba(16, 185, 129, 0.14)',
                addedColor: '#A7F3D0',
                removedBackground: 'rgba(239, 68, 68, 0.15)',
                removedColor: '#FECACA',
                wordAddedBackground: 'rgba(16, 185, 129, 0.32)',
                wordRemovedBackground: 'rgba(239, 68, 68, 0.34)',
                addedGutterBackground: 'rgba(16, 185, 129, 0.2)',
                removedGutterBackground: 'rgba(239, 68, 68, 0.2)',
                gutterBackground: '#090D16',
                gutterBackgroundDark: '#090D16',
                highlightBackground: '#1E293B',
                highlightGutterBackground: '#1E293B',
                codeFoldGutterBackground: '#0F172A',
                codeFoldBackground: '#0F172A',
                emptyLineBackground: '#0B1120',
                gutterColor: '#64748B',
                addedGutterColor: '#6EE7B7',
                removedGutterColor: '#FCA5A5',
                codeFoldContentColor: '#94A3B8',
                diffViewerTitleBackground: '#0F172A',
                diffViewerTitleColor: '#94A3B8',
                diffViewerTitleBorderColor: '#1E293B',
              },
            },
            line: {
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '12px',
              lineHeight: '20px',
            },
          }}
        />
      </div>
    </div>
  );
};
