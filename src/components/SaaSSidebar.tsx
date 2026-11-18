import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { History, RotateCcw, Trash2, X } from 'lucide-react';
import type { HistoryEntry } from '../types/pyfix';

interface SaaSSidebarProps {
  history: HistoryEntry[];
  activeId: string | null;
  onSelectHistory: (entry: HistoryEntry) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
  onCloseMobile?: () => void;
}

export const SaaSSidebar: React.FC<SaaSSidebarProps> = ({
  history,
  activeId,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  onCloseMobile,
}) => {
  const totals = useMemo(() => {
    const totalTokens = history.reduce((sum, item) => sum + (item.result.tokens_used || 0), 0);
    const totalCost = history.reduce((sum, item) => sum + (item.estimatedCostUsd || 0), 0);
    return { totalTokens, totalCost };
  }, [history]);

  const chartData = useMemo(() => {
    // Oldest -> newest for timeline sparkline
    const ordered = [...history].slice(0, 12).reverse();
    return ordered.map((item, idx) => ({
      run: `#${idx + 1}`,
      tokens: item.result.tokens_used || 0,
      costCents: Number((item.estimatedCostUsd * 100).toFixed(4)),
    }));
  }, [history]);

  return (
    <div className="flex flex-col h-full bg-[#0D1322] border-l border-slate-800/90 text-slate-200">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/90 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Analytics &amp; History</h2>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-red-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Session KPI Strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800/90 bg-[#0B101D] shrink-0">
        <div className="px-3 py-2.5">
          <span className="block text-[11px] text-slate-400">Runs</span>
          <span className="font-mono tabular-nums text-sm font-semibold text-white">
            {history.length}
          </span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[11px] text-slate-400">Tokens</span>
          <span className="font-mono tabular-nums text-sm font-semibold text-cyan-300">
            {totals.totalTokens.toLocaleString()}
          </span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[11px] text-slate-400">Est. Cost</span>
          <span className="font-mono tabular-nums text-sm font-semibold text-emerald-300">
            ${totals.totalCost.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Live Recharts Token & Cost Sparkline */}
      <div className="px-4 py-3 border-b border-slate-800/90 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-300">Token Usage Trend</span>
          <span className="text-[11px] font-mono tabular-nums text-slate-500">
            Last {Math.min(history.length, 12)} runs
          </span>
        </div>
        {chartData.length > 0 ? (
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="pyfixTokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="run"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#E2E8F0',
                  }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} tokens`, 'Usage']}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  fill="url(#pyfixTokenGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
            Run an analysis to chart token usage
          </div>
        )}
      </div>

      {/* Persisted Query History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <RotateCcw className="w-6 h-6 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-300">No saved runs yet</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your analyzed Python snippets, token counts, and fixes are saved here automatically.
            </p>
          </div>
        ) : (
          history.map((entry) => {
            const isActive = entry.id === activeId;
            return (
              <div
                key={entry.id}
                onClick={() => {
                  onSelectHistory(entry);
                  onCloseMobile?.();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectHistory(entry);
                    onCloseMobile?.();
                  }
                }}
                className={`group relative rounded-xl border p-3 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500/45'
                    : 'bg-[#111827] border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-slate-100 line-clamp-2 leading-snug">
                    {entry.title}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistory(entry.id);
                    }}
                    className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
                    title="Delete entry"
                    aria-label="Delete history entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Unboxed metadata row with clean typographic separators */}
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-slate-400 flex-wrap">
                  <span className={entry.result.error_analysis.has_error ? 'text-red-400' : 'text-emerald-400'}>
                    {entry.result.error_analysis.has_error ? entry.result.error_analysis.error_type : 'Clean'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{entry.mode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.result.tokens_used.toLocaleString()} tok</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
