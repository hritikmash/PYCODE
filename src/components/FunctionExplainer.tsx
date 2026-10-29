import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Layers, HelpCircle, Wrench, Code2 } from 'lucide-react';
import { StepExplanation } from '../types';

interface FunctionExplainerProps {
  steps: StepExplanation[];
}

export const FunctionExplainer: React.FC<FunctionExplainerProps> = ({ steps }) => {
  const [expandedSteps, setExpandedSteps] = useState<number[]>(() => 
    steps.length > 0 ? [steps[0].stepNumber] : []
  );

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev =>
      prev.includes(stepNumber) ? prev.filter(n => n !== stepNumber) : [...prev, stepNumber]
    );
  };

  const expandAll = () => setExpandedSteps(steps.map(s => s.stepNumber));
  const collapseAll = () => setExpandedSteps([]);

  const allFunctions = steps.flatMap(s => s.functionsUsed);

  return (
    <div id="functions-section" className="w-full max-w-full rounded-2xl sm:rounded-3xl border border-[#282a2c] bg-[#1e1f20] text-[#e3e3e3] overflow-hidden shadow-md">
      {/* Header */}
      <div className="p-3.5 sm:p-5 border-b border-[#282a2c] bg-[#1a1b1c]/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-semibold text-white">Step-by-Step Function & Keyword Breakdown</span>
              <span className="text-xs text-[#8e918f]">·</span>
              <span className="text-xs text-[#c4c7c5] font-medium tabular-nums">
                {allFunctions.length} {allFunctions.length === 1 ? 'construct' : 'constructs'}
              </span>
            </div>
            <p className="text-xs text-[#8e918f] mt-0.5">
              Explaining every function used in each step and why only that function was chosen.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="text-[#a8c7fa] hover:text-white font-medium px-2.5 py-1 rounded-full hover:bg-[#282a2c] transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-[#37393b]">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[#8e918f] hover:text-white font-medium px-2.5 py-1 rounded-full hover:bg-[#282a2c] transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Step by step list */}
      <div className="divide-y divide-[#282a2c] w-full max-w-full">
        {steps.map((step) => {
          const isExpanded = expandedSteps.includes(step.stepNumber);

          return (
            <div key={step.stepNumber} className="transition-colors w-full max-w-full">
              {/* Step Accordion Bar */}
              <button
                type="button"
                onClick={() => toggleStep(step.stepNumber)}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-[#282a2c]/50 transition-colors gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#004a77] text-white flex items-center justify-center text-xs font-bold shrink-0 tabular-nums">
                    {step.stepNumber}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs sm:text-sm text-white truncate">{step.title}</span>
                      <span className="text-[11px] text-[#8e918f] font-mono whitespace-nowrap">({step.lineRange})</span>
                    </div>
                    <p className="text-xs text-[#8e918f] mt-0.5 line-clamp-1">{step.purpose}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#8e918f] font-medium hidden sm:inline">
                    {step.functionsUsed.length} {step.functionsUsed.length === 1 ? 'item' : 'items'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#8e918f]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#8e918f]" />
                  )}
                </div>
              </button>

              {/* Step Content */}
              {isExpanded && (
                <div className="px-3.5 sm:px-5 pb-5 pt-1 bg-[#131314]/50 space-y-4 w-full max-w-full">
                  {/* Code snippet for this step */}
                  {step.codeSnippet && (
                    <div className="rounded-xl bg-[#131314] border border-[#282a2c] p-2.5 sm:p-3 text-[11px] sm:text-xs font-mono text-[#c4c7c5] overflow-x-auto w-full">
                      <div className="text-[10px] text-[#8e918f] font-sans uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                        <Code2 className="w-3 h-3 text-[#a8c7fa]" />
                        <span>Step Code Snippet</span>
                      </div>
                      <pre className="text-white whitespace-pre-wrap">{step.codeSnippet}</pre>
                    </div>
                  )}

                  {/* Function Explanations: Flowing in one cohesive explanation div per function */}
                  <div className="space-y-4 w-full">
                    {step.functionsUsed.map((fn, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#282a2c] bg-[#1e1f20] p-4 sm:p-5 shadow-xs space-y-3.5 w-full max-w-full break-words"
                      >
                        {/* Function Title & Category */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#282a2c]">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-[#004a77] text-[#a8c7fa] border border-[#004a77]">
                              {fn.name}
                            </span>
                            <span className="text-xs text-[#8e918f] capitalize">
                              {fn.category.replace('_', ' ')}
                            </span>
                          </div>

                          <span className="text-[11px] text-[#8e918f] font-mono">
                            Step {step.stepNumber}
                          </span>
                        </div>

                        {/* All 4 explanation points unified in ONE clean explanatory flow */}
                        <div className="space-y-3 text-xs sm:text-[13px] text-[#c4c7c5] leading-relaxed">
                          <div>
                            <strong className="text-white block mb-0.5">1. What it does:</strong>
                            <p>{fn.whatItDoes}</p>
                          </div>

                          <div>
                            <strong className="text-amber-300 block mb-0.5">2. Why it is used here:</strong>
                            <p>{fn.whyItIsUsed}</p>
                          </div>

                          <div>
                            <strong className="text-emerald-300 block mb-0.5">3. How it works internally:</strong>
                            <p>{fn.howItWorks}</p>
                          </div>

                          <div className="pt-1 border-t border-[#282a2c]/60">
                            <strong className="text-[#a8c7fa] block mb-0.5">4. Why ONLY this function?</strong>
                            <p className="text-[#e3e3e3] font-medium">{fn.whyOnlyThisFunction}</p>
                          </div>
                        </div>

                        {/* Optional Code Example */}
                        {fn.codeExample && (
                          <div className="mt-2 rounded-xl bg-[#000000] p-2.5 sm:p-3 text-[11px] sm:text-xs font-mono border border-[#282a2c] overflow-x-auto text-[#c4c7c5]">
                            <span className="text-[10px] text-[#8e918f] font-sans font-bold uppercase block mb-1">
                              Example Usage:
                            </span>
                            <pre className="whitespace-pre-wrap">{fn.codeExample}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
