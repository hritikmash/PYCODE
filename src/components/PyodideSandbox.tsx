import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, ChevronUp, Loader2, Play, RotateCcw, Terminal } from 'lucide-react';

export interface SandboxExecutionState {
  status: 'idle' | 'loading_runtime' | 'running' | 'success' | 'error';
  stdout: string;
  stderr: string;
  durationMs?: number;
  errorMessage?: string;
}

interface PyodideSandboxProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  state: SandboxExecutionState;
  onRun: () => void;
  onClear: () => void;
}

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<any>;
    __pyfixPyodidePromise?: Promise<any>;
  }
}

const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

async function getPyodideInstance(): Promise<any> {
  if (window.__pyfixPyodidePromise) {
    return window.__pyfixPyodidePromise;
  }

  window.__pyfixPyodidePromise = (async () => {
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${PYODIDE_CDN_URL}pyodide.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load Pyodide WebAssembly runtime from CDN.'));
        document.head.appendChild(script);
      });
    }

    if (!window.loadPyodide) {
      throw new Error('Pyodide loader failed to initialize.');
    }

    return window.loadPyodide({ indexURL: PYODIDE_CDN_URL });
  })();

  try {
    return await window.__pyfixPyodidePromise;
  } catch (err) {
    window.__pyfixPyodidePromise = undefined;
    throw err;
  }
}

export async function runPythonInPyodide(code: string): Promise<{
  stdout: string;
  stderr: string;
  durationMs: number;
  hasError: boolean;
}> {
  const pyodide = await getPyodideInstance();
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  pyodide.setStdout({
    batched: (text: string) => stdoutLines.push(text),
  });
  pyodide.setStderr({
    batched: (text: string) => stderrLines.push(text),
  });

  const start = performance.now();
  let hasError = false;

  try {
    await pyodide.runPythonAsync(code);
  } catch (err: any) {
    hasError = true;
    stderrLines.push(err?.message || String(err));
  }

  const durationMs = Math.round(performance.now() - start);
  return {
    stdout: stdoutLines.join('\n'),
    stderr: stderrLines.join('\n'),
    durationMs,
    hasError,
  };
}

export const PyodideSandbox: React.FC<PyodideSandboxProps> = ({
  isOpen,
  onToggleOpen,
  state,
  onRun,
  onClear,
}) => {
  const isBusy = state.status === 'loading_runtime' || state.status === 'running';

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
      {/* Drawer Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#0F172A] border-b border-slate-800">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-2 text-left text-xs font-medium text-slate-200 hover:text-white cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold">Python WebAssembly Sandbox</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-slate-400 font-mono text-[11px] tabular-nums">
            {state.status === 'loading_runtime'
              ? 'Loading Pyodide...'
              : state.status === 'running'
              ? 'Executing...'
              : state.durationMs !== undefined
              ? `${state.durationMs}ms`
              : 'Pyodide WASM'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          )}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {(state.stdout || state.stderr || state.errorMessage) && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRun}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isBusy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>{isBusy ? 'Running' : 'Execute'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Terminal Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-[#070B12] font-mono text-xs space-y-3 max-h-[240px] overflow-y-auto">
              {isBusy && (
                <div className="flex items-center gap-2 text-cyan-300 py-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>
                    {state.status === 'loading_runtime'
                      ? 'Downloading Python 3.12 WebAssembly runtime (first run only)...'
                      : 'Running corrected code inside browser sandbox...'}
                  </span>
                </div>
              )}

              {state.status === 'idle' && !state.stdout && !state.stderr && !state.errorMessage && (
                <p className="text-slate-500">
                  Click Run in Sandbox to execute the corrected Python code safely in your browser via WebAssembly.
                </p>
              )}

              {state.errorMessage && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span className="whitespace-pre-wrap">{state.errorMessage}</span>
                </div>
              )}

              {state.stdout && (
                <div className="space-y-1">
                  <span className="text-[11px] text-emerald-400 font-semibold block">stdout</span>
                  <pre className="text-emerald-200 whitespace-pre-wrap leading-relaxed bg-[#0B1120] p-2.5 rounded-lg border border-emerald-900/40">
                    {state.stdout}
                  </pre>
                </div>
              )}

              {state.stderr && (
                <div className="space-y-1">
                  <span className="text-[11px] text-red-400 font-semibold block">stderr</span>
                  <pre className="text-red-300 whitespace-pre-wrap leading-relaxed bg-[#0B1120] p-2.5 rounded-lg border border-red-900/40">
                    {state.stderr}
                  </pre>
                </div>
              )}

              {state.status === 'success' && !state.stdout && !state.stderr && (
                <p className="text-slate-400">
                  Program finished with exit code 0 (no stdout output produced).
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
