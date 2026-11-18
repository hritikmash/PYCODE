import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Cpu } from 'lucide-react';
import type { FunctionBreakdown } from '../types/pyfix';

interface FunctionChipProps {
  fn: FunctionBreakdown;
  label?: string;
}

export const FunctionChip: React.FC<FunctionChipProps> = ({ fn, label }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleCopyExample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(fn.mini_example);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const displayLabel = label || (fn.name.endsWith(')') ? fn.name : `${fn.name}()`);

  return (
    <span
      ref={containerRef}
      className="relative inline-block align-baseline mx-0.5"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[12px] font-medium text-sky-300 bg-sky-500/15 border border-sky-400/45 shadow-[0_0_12px_rgba(56,189,248,0.22)] hover:bg-sky-500/25 hover:border-cyan-300/70 transition-colors cursor-pointer whitespace-nowrap"
      >
        {displayLabel}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label={`${fn.name} documentation`}
            className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-xl border border-cyan-500/35 bg-[#0F172A] p-4 shadow-[0_14px_38px_rgba(2,6,23,0.85)] text-left"
          >
            {/* Header & Complexity Contrast Badge */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <div className="font-mono text-xs font-semibold text-cyan-300 truncate">
                  {fn.syntax || displayLabel}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-semibold whitespace-nowrap shrink-0 tabular-nums">
                <Cpu className="w-3 h-3" />
                <span>Complexity: {fn.time_complexity}</span>
              </span>
            </div>

            {/* Purpose */}
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {fn.purpose}
            </p>

            {/* Copyable Mini Example */}
            <div className="rounded-lg bg-[#090D16] border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800/80 text-[10px] text-slate-400">
                <span className="font-medium">Mini Example</span>
                <button
                  type="button"
                  onClick={handleCopyExample}
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {fn.mini_example}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

interface InteractiveExplanationTextProps {
  text: string;
  functions: FunctionBreakdown[];
}

export const InteractiveExplanationText: React.FC<InteractiveExplanationTextProps> = ({
  text,
  functions,
}) => {
  const parts = useMemo(() => {
    if (!functions || functions.length === 0) {
      return [{ type: 'text' as const, value: text }];
    }

    // Build lookup map keyed by normalized base function name (e.g. "enumerate", "map")
    const lookup = new Map<string, FunctionBreakdown>();
    const patterns: string[] = [];

    for (const fn of functions) {
      const baseName = fn.name.replace(/\(\)$/, '').trim();
      if (!baseName) continue;
      lookup.set(baseName.toLowerCase(), fn);
      const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match optional backticks and optional trailing ()
      patterns.push(`\`?\\b${escaped}(?:\\(\\))?\`?`);
    }

    if (patterns.length === 0) {
      return [{ type: 'text' as const, value: text }];
    }

    // Sort longest first to avoid partial matches
    patterns.sort((a, b) => b.length - a.length);
    const regex = new RegExp(`(${patterns.join('|')})`, 'gi');

    const segments: Array<
      { type: 'text'; value: string } | { type: 'chip'; label: string; fn: FunctionBreakdown }
    > = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      const rawMatched = match[0];
      const cleanedKey = rawMatched.replace(/`/g, '').replace(/\(\)$/, '').toLowerCase();
      const matchedFn = lookup.get(cleanedKey);
      if (matchedFn) {
        segments.push({
          type: 'chip',
          label: rawMatched.replace(/`/g, ''),
          fn: matchedFn,
        });
      } else {
        segments.push({ type: 'text', value: rawMatched });
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return segments;
  }, [text, functions]);

  return (
    <span className="leading-relaxed">
      {parts.map((part, idx) =>
        part.type === 'chip' ? (
          <FunctionChip key={`${part.fn.name}-${idx}`} fn={part.fn} label={part.label} />
        ) : (
          <React.Fragment key={idx}>{part.value}</React.Fragment>
        )
      )}
    </span>
  );
};
