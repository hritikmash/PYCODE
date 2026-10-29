import React from 'react';
import { SAMPLE_EXAMPLES } from '../data/samples';
import { SampleExample, AnalysisMode } from '../types';
import { Sparkles, Code2, BookOpen } from 'lucide-react';

interface SamplePickerProps {
  onSelectSample: (sample: SampleExample) => void;
  selectedId?: string;
}

export const SamplePicker: React.FC<SamplePickerProps> = ({
  onSelectSample,
  selectedId
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Ready-to-Test Learning Labs
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Click any example to load code & conceptual prompt
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SAMPLE_EXAMPLES.map((sample) => {
          const isSelected = selectedId === sample.id;

          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample)}
              className={`p-3 text-left rounded-lg border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-slate-50/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                    {sample.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-600 font-medium">{sample.tag}</span>
                <span className="text-blue-600 font-medium">Load Lab →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
