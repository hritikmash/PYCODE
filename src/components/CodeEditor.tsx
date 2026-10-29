import React, { useRef, useState } from 'react';
import { Copy, Check, Trash2, Code2, AlertCircle, ArrowUp, ArrowDown, Upload } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  errorLines?: number[];
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  height?: string;
  title?: string;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  errorLines = [],
  readOnly = false,
  height = '230px',
  maxHeight = '230px',
  title = 'Python Code (main.py)',
  placeholder = '# Paste or write your Python code here...\ndef solution():\n    pass'
}) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      onChange(text);
    }
    e.target.value = '';
  };

  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 1);
  const isScrollable = lineCount > 7;

  // Synchronize scrolling between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Allow scrolling the textarea even when hovering on the line numbers gutter
  const handleGutterWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop += e.deltaY;
    }
  };

  const scrollToTop = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollTo({ top: textareaRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle Tab key to insert 4 spaces like standard Python PEP 8
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);

      // Restore cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-[#37393b] bg-[#171819] overflow-hidden shadow-md">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#202124] border-b border-[#2d2f31] text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono font-medium">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span>{title}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono tabular-nums">{lineCount} lines</span>
          {isScrollable && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#a8c7fa] bg-[#1e2738] border border-[#2b3a55] px-2 py-0.5 rounded-full font-sans font-normal">
              <span>↕</span>
              <span>Scroll up / down to see full code</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {errorLines.length > 0 && (
            <div className="flex items-center gap-1.5 text-red-400 bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded text-[11px] font-medium mr-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Issues on line {errorLines.join(', ')}</span>
            </div>
          )}

          {/* Quick Scroll Up/Down Buttons */}
          {isScrollable && (
            <div className="flex items-center gap-0.5 bg-[#171819] border border-[#2d2f31] rounded-lg p-0.5 mr-1">
              <button
                type="button"
                onClick={scrollToTop}
                className="p-1 text-slate-400 hover:text-white hover:bg-[#282a2c] rounded transition-colors"
                title="Scroll to top of code"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={scrollToBottom}
                className="p-1 text-slate-400 hover:text-white hover:bg-[#282a2c] rounded transition-colors"
                title="Scroll to bottom of code"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {!readOnly && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.pyw,.ipynb,.txt,.json,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-[#00ff88] hover:bg-[#282a2c] rounded transition-colors text-[11px] cursor-pointer"
                title="Add file (.py, .ipynb, .txt)"
              >
                <Upload className="w-3 h-3 text-[#00ff88]" />
                <span className="hidden sm:inline">Add File</span>
              </button>
            </>
          )}

          {!readOnly && value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-[#282a2c] transition-colors cursor-pointer"
              title="Clear editor"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-[#2d2f31] hover:bg-[#37393b] rounded transition-colors font-medium text-[11px]"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body - Fixed Height with Strict Overflow Containment */}
      <div 
        className="relative flex font-mono text-sm overflow-hidden" 
        style={{ height, maxHeight }}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          onWheel={handleGutterWheel}
          className="select-none overflow-hidden bg-[#111213] border-r border-[#282a2c] text-slate-500 py-3 px-3 text-right text-xs shrink-0 tabular-nums leading-[1.625rem] h-full"
          style={{ width: `${Math.max(3.2, (lineCount.toString().length * 0.7) + 2)}rem` }}
        >
          {Array.from({ length: lineCount }).map((_, index) => {
            const lineNum = index + 1;
            const hasError = errorLines.includes(lineNum);
            return (
              <div
                key={lineNum}
                className={`relative h-[1.625rem] flex items-center justify-end pr-1 transition-colors ${
                  hasError ? 'text-red-400 font-bold bg-red-950/40 -mr-3 pr-4' : ''
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Text Area Input with Scroll Up/Down */}
        <div className="relative flex-1 h-full overflow-hidden">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full p-3 font-mono text-[13px] leading-[1.625rem] text-slate-100 bg-transparent resize-none focus:outline-none placeholder:text-slate-600 selection:bg-blue-600/40 overflow-y-auto overflow-x-auto whitespace-pre"
          />
        </div>
      </div>
    </div>
  );
};
