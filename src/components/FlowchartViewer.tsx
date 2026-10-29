import React, { useState } from 'react';
import { ArrowDown, CornerDownRight, Info } from 'lucide-react';
import { FlowchartData, FlowchartNode } from '../types';

interface FlowchartViewerProps {
  flowchart: FlowchartData;
}

export const FlowchartViewer: React.FC<FlowchartViewerProps> = ({ flowchart }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    flowchart.nodes.length > 0 ? flowchart.nodes[0].id : null
  );

  const selectedNode = flowchart.nodes.find(n => n.id === selectedNodeId);

  const getNodeStyling = (type: FlowchartNode['type'], isSelected: boolean) => {
    const base = 'transition-all cursor-pointer rounded-2xl border p-3.5 flex flex-col justify-between text-left w-full max-w-full break-words [overflow-wrap:anywhere] overflow-hidden ';
    const selectedRing = isSelected ? 'ring-2 ring-[#a8c7fa] shadow-lg scale-[1.01] sm:scale-[1.02] ' : 'hover:border-[#37393b] ';

    switch (type) {
      case 'start':
      case 'end':
        return base + selectedRing + (isSelected ? 'bg-[#004a77] text-white border-[#a8c7fa]' : 'bg-[#1a1b1c] text-white border-[#282a2c]');
      case 'decision':
        return base + selectedRing + (isSelected ? 'bg-amber-950/60 text-amber-200 border-amber-500' : 'bg-amber-950/30 text-amber-300 border-amber-800');
      case 'loop':
        return base + selectedRing + (isSelected ? 'bg-purple-950/60 text-purple-200 border-purple-500' : 'bg-purple-950/30 text-purple-300 border-purple-800');
      case 'input':
      case 'output':
        return base + selectedRing + (isSelected ? 'bg-blue-950/60 text-blue-200 border-blue-500' : 'bg-blue-950/30 text-blue-300 border-blue-800');
      case 'process':
      default:
        return base + selectedRing + (isSelected ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500' : 'bg-[#131314] text-[#e3e3e3] border-[#282a2c]');
    }
  };

  const getNodeBadge = (type: FlowchartNode['type']) => {
    switch (type) {
      case 'start':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-[#a8c7fa] shrink-0">Start</span>;
      case 'end':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-[#a8c7fa] shrink-0">End</span>;
      case 'decision':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 shrink-0">Condition</span>;
      case 'loop':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 shrink-0">Loop</span>;
      case 'input':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 shrink-0">Input</span>;
      case 'output':
        return <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 shrink-0">Output</span>;
      case 'process':
      default:
        return <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 shrink-0">Process</span>;
    }
  };

  return (
    <div id="flowchart-section" className="w-full max-w-full rounded-2xl sm:rounded-3xl border border-[#282a2c] bg-[#1e1f20] text-[#e3e3e3] overflow-hidden shadow-md">
      {/* Header */}
      <div className="p-3.5 sm:p-5 border-b border-[#282a2c] bg-[#1a1b1c]/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-semibold text-white">Program Execution Flowchart</span>
              <span className="text-xs text-[#8e918f]">·</span>
              <span className="text-xs text-[#c4c7c5] font-medium tabular-nums">
                {flowchart.nodes.length} stages
              </span>
            </div>
            <p className="text-xs text-[#8e918f] mt-0.5">
              Visual pipeline tracing logic branches, loops, function evaluations, and data transformations.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#8e918f]">
            <Info className="w-3.5 h-3.5 text-[#a8c7fa] shrink-0" />
            <span className="text-[11px] sm:text-xs">Click any node to inspect code line and logic</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full">
        {/* Left 2 Columns: The Visual Flow Sequence */}
        <div className="lg:col-span-2 space-y-3 w-full max-w-full">
          <div className="relative flex flex-col items-center w-full max-w-xl mx-auto space-y-3">
            {flowchart.nodes.map((node, index) => {
              const isSelected = selectedNodeId === node.id;
              const linkFromThis = flowchart.links.find(l => l.from === node.id);

              return (
                <React.Fragment key={node.id}>
                  {/* Node Box with strict overflow prevention and word-wrap */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full ${getNodeStyling(node.type, isSelected)}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-[#c4c7c5] shrink-0">
                          #{index + 1}
                        </span>
                        {getNodeBadge(node.type)}
                      </div>
                      {node.codeLine && (
                        <span 
                          className="text-[10px] sm:text-[11px] font-mono text-[#8e918f] truncate max-w-[45%] text-right shrink-0"
                          title={node.codeLine}
                        >
                          {node.codeLine}
                        </span>
                      )}
                    </div>

                    {/* Node Label with zero word cut-off */}
                    <div className="font-medium text-xs sm:text-sm leading-snug text-white break-words [overflow-wrap:anywhere] hyphens-auto w-full">
                      {node.label}
                    </div>

                    {/* Node Details with word wrapping */}
                    {node.details && (
                      <div className="text-[11px] sm:text-xs opacity-85 mt-1 text-[#c4c7c5] leading-relaxed break-words [overflow-wrap:anywhere] hyphens-auto w-full">
                        {node.details}
                      </div>
                    )}
                  </div>

                  {/* Flow Arrow to Next Node */}
                  {index < flowchart.nodes.length - 1 && (
                    <div className="flex flex-col items-center my-0.5 text-[#8e918f] shrink-0">
                      {linkFromThis?.label && (
                        <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#131314] text-[#a8c7fa] border border-[#282a2c] mb-1 max-w-[200px] truncate">
                          {linkFromThis.label}
                        </span>
                      )}
                      <ArrowDown className="w-4 h-4 text-[#8e918f]" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: Node Inspector */}
        <div className="space-y-4 w-full max-w-full">
          <div className="lg:sticky lg:top-20 rounded-2xl border border-[#282a2c] bg-[#131314] p-3.5 sm:p-4 space-y-3 w-full">
            <div className="text-xs font-semibold text-[#8e918f] uppercase tracking-wider flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-[#a8c7fa] shrink-0" />
              <span>Node Inspector</span>
            </div>

            {selectedNode ? (
              <div className="space-y-3 w-full">
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] w-full">
                  <div className="text-[11px] text-[#8e918f] mb-1">Stage Label:</div>
                  <div className="font-semibold text-xs sm:text-sm text-white break-words [overflow-wrap:anywhere]">
                    {selectedNode.label}
                  </div>
                  <div className="mt-2 text-xs">{getNodeBadge(selectedNode.type)}</div>
                </div>

                {selectedNode.codeLine && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-[#000000] text-emerald-300 font-mono text-xs border border-[#282a2c] w-full overflow-x-auto">
                    <div className="text-[10px] font-sans font-bold text-[#8e918f] uppercase mb-1">
                      Associated Code Line:
                    </div>
                    <code className="break-all whitespace-pre-wrap">{selectedNode.codeLine}</code>
                  </div>
                )}

                {selectedNode.details && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] text-xs text-[#c4c7c5] leading-relaxed w-full">
                    <div className="font-semibold text-white mb-1">What Happens at this Step:</div>
                    <p className="break-words [overflow-wrap:anywhere] leading-relaxed">{selectedNode.details}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#8e918f] italic">Select a node from the flowchart to view details.</p>
            )}

            {/* Quick Flowchart Legend */}
            <div className="pt-3 border-t border-[#282a2c] text-[11px] text-[#8e918f] space-y-1.5">
              <div className="font-semibold text-[#c4c7c5] mb-1">Shape / Color Guide:</div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a8c7fa] shrink-0" />
                <span>Start / Termination</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span>Decision / Branching (`if`/`else`)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
                <span>Loop (`for`/`while`)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span>Computation / Assignment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                <span>I/O / Function Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
