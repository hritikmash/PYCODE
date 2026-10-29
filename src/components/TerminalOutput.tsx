import React, { useState } from 'react';
import { Terminal, Check, Copy, Clock, AlertCircle } from 'lucide-react';
import { PythonExecutionResult } from '../types';

interface TerminalOutputProps {
  expectedOutput: string;
  realExecution?: PythonExecutionResult;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  expectedOutput,
  realExecution
}) => {
  const [activeTab, setActiveTab] = useState<'expected' | 'real'>(
    realExecution && (realExecution.stderr || realExecution.stdout) ? 'expected' : 'expected'
  );
  const [copied, setCopied] = useState(false);

  const currentContent = activeTab === 'expected' 
    ? expectedOutput 
    : (realExecution?.stderr || realExecution?.stdout || 'No output recorded');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="terminal-section" className="rounded-2xl border border-[#282a2c] bg-[#1e1f20] text-[#e3e3e3] overflow-hidden shadow-md">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1b1c] border-b border-[#282a2c] text-xs">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <Terminal className="w-3.5 h-3.5 text-[#a8c7fa]" />
          <span className="font-mono font-medium text-white">Terminal Output & Python Sandbox</span>
        </div>

        {/* Output Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#131314] p-0.5 rounded-full border border-[#282a2c] text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('expected')}
              className={`px-3 py-1 rounded-full transition-colors ${
                activeTab === 'expected'
                  ? 'bg-[#282a2c] text-white font-medium'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              Expected Output
            </button>
            {realExecution && (
              <button
                type="button"
                onClick={() => setActiveTab('real')}
                className={`px-3 py-1 rounded-full transition-colors ${
                  activeTab === 'real'
                    ? 'bg-[#282a2c] text-white font-medium'
                    : 'text-[#8e918f] hover:text-white'
                }`}
              >
                Python 3.10 Subprocess Run
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-[#8e918f] hover:text-white bg-[#282a2c] hover:bg-[#37393b] rounded-full transition-colors text-[11px]"
            title="Copy terminal output"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 bg-[#131314] font-mono text-xs leading-relaxed overflow-x-auto min-h-[140px]">
        {activeTab === 'expected' ? (
          <div>
            <div className="text-[#8e918f] select-none mb-1.5 flex items-center gap-2">
              <span className="text-emerald-400">$</span>
              <span>python3 main.py (Simulated Corrected Execution)</span>
            </div>
            {expectedOutput ? (
              <pre className="text-emerald-300 whitespace-pre-wrap">{expectedOutput}</pre>
            ) : (
              <span className="text-[#8e918f] italic">No output produced (program completed silently or with return value).</span>
            )}
          </div>
        ) : (
          <div>
            <div className="text-[#8e918f] select-none mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#a8c7fa]">$</span>
                <span>python3 -c &quot;original_code&quot; (Actual Linux Subprocess)</span>
              </div>
              {realExecution?.executionTimeMs !== undefined && (
                <span className="flex items-center gap-1 text-[10px] text-[#8e918f]">
                  <Clock className="w-3 h-3" />
                  <span>{realExecution.executionTimeMs}ms</span>
                </span>
              )}
            </div>

            {realExecution?.stderr ? (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 mb-2">
                <div className="flex items-center gap-1 text-[11px] font-sans font-bold text-red-400 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Traceback / Exception Raised:</span>
                </div>
                <pre className="whitespace-pre-wrap">{realExecution.stderr}</pre>
              </div>
            ) : null}

            {realExecution?.stdout ? (
              <div>
                <div className="text-[11px] font-sans text-[#8e918f] mb-1">Standard Output:</div>
                <pre className="text-white whitespace-pre-wrap">{realExecution.stdout}</pre>
              </div>
            ) : (
              !realExecution?.stderr && (
                <span className="text-[#8e918f] italic">Subprocess exited cleanly with code 0 (no output printed).</span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
