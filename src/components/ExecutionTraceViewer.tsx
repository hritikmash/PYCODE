import React, { useState } from 'react';
import { SkipForward, SkipBack, RotateCcw, Activity } from 'lucide-react';
import { ExecutionTraceStep } from '../types';

interface ExecutionTraceViewerProps {
  trace: ExecutionTraceStep[];
}

export const ExecutionTraceViewer: React.FC<ExecutionTraceViewerProps> = ({ trace }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  if (!trace || trace.length === 0) return null;

  const currentStep = trace[currentStepIdx] || trace[0];
  const totalSteps = trace.length;

  const handleNext = () => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleReset = () => setCurrentStepIdx(0);

  return (
    <div className="rounded-2xl border border-[#282a2c] bg-[#1e1f20] text-[#e3e3e3] overflow-hidden shadow-md">
      {/* Title Bar */}
      <div className="p-4 sm:p-5 border-b border-[#282a2c] bg-[#1a1b1c]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-white">Step-by-Step Execution & Variable Trace</span>
            <span className="text-xs text-[#8e918f]">·</span>
            <span className="text-xs text-[#c4c7c5] font-medium tabular-nums">
              Step {currentStepIdx + 1} of {totalSteps}
            </span>
          </div>
          <p className="text-xs text-[#8e918f] mt-1">
            Simulate how Python allocates frames and updates variables at each instruction.
          </p>
        </div>

        {/* Step Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-[#8e918f] hover:text-white hover:bg-[#282a2c] rounded-full transition-colors"
            title="Reset to step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="px-3 py-1 text-xs font-medium text-[#c4c7c5] bg-[#282a2c] hover:bg-[#37393b] disabled:opacity-30 rounded-full transition-colors flex items-center gap-1"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentStepIdx === totalSteps - 1}
            className="px-3.5 py-1 text-xs font-medium text-[#003355] bg-[#a8c7fa] hover:bg-white disabled:opacity-30 rounded-full transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>Next</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Inspector Body */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Code Statement being evaluated */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8e918f]">
            <span className="font-semibold text-white uppercase tracking-wider">
              Instruction at Line {currentStep.line}:
            </span>
            <span className="font-mono text-[#a8c7fa] font-bold">Step #{currentStep.step}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#000000] border border-[#282a2c] text-emerald-300 font-mono text-xs overflow-x-auto">
            <code>{currentStep.statement}</code>
          </div>

          <div className="p-3.5 rounded-xl bg-[#131314] border border-[#282a2c] text-xs text-[#c4c7c5] leading-relaxed">
            <span className="font-semibold text-white block mb-1">What Happens at this Step:</span>
            <p>{currentStep.explanation}</p>
          </div>
        </div>

        {/* Right: Variable States */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Variable States & Memory Frames:</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#131314] border border-[#282a2c] text-xs font-mono min-h-[120px]">
            {currentStep.variableStates && Object.keys(currentStep.variableStates).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(currentStep.variableStates).map(([varName, val], idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-[#1e1f20] rounded-lg border border-[#282a2c]">
                    <span className="font-bold text-[#a8c7fa]">{varName}</span>
                    <span className="text-emerald-400 text-right">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[#8e918f] italic">No local variable assignments in this step.</span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#131314] rounded-full h-1.5 overflow-hidden border border-[#282a2c]">
            <div
              className="bg-gradient-to-r from-blue-500 to-[#a8c7fa] h-full transition-all duration-300"
              style={{ width: `${((currentStepIdx + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
