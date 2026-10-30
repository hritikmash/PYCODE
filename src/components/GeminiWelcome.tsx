import React, { useState } from 'react';
import { 
  Code2, 
  ArrowUpRight, 
  Sparkles, 
  Bug, 
  Cpu, 
  Layers, 
  GitBranch, 
  Zap,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { SAMPLE_EXAMPLES } from '../data/samples';
import { SampleExample } from '../types';
import { GeminiSparkle } from './GeminiIcons';

interface GeminiWelcomeProps {
  onSelectSample: (sample: SampleExample) => void;
  userName?: string;
  onSelectCategory?: (categoryPrompt: string) => void;
}

export const GeminiWelcome: React.FC<GeminiWelcomeProps> = ({ 
  onSelectSample, 
  userName = 'Developer',
  onSelectCategory 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Prompts', icon: Sparkles },
    { id: 'debug', label: 'Debug & Fix', icon: Bug, query: 'Help me find and fix errors in this code' },
    { id: 'understand', label: 'Explain Code', icon: Cpu, query: 'Explain how this code works step by step with beginner analogies' },
    { id: 'algo', label: 'Algorithm & DSA', icon: GitBranch, query: 'Explain time complexity O(n) and algorithm flow for' },
    { id: 'refactor', label: 'PEP-8 Refactor', icon: Layers, query: 'Refactor this code to follow clean PEP-8 pythonic patterns' },
  ];

  const handleCategoryClick = (cat: typeof categories[0]) => {
    setActiveCategory(cat.id);
    if (cat.query && onSelectCategory) {
      onSelectCategory(cat.query);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 md:py-14 flex flex-col justify-center items-center text-center space-y-7 sm:space-y-8 animate-in fade-in duration-300 select-none">
      
      {/* Gemini Pro / Advanced Chip */}
      <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#1e1f20] border border-[#282a2c] hover:border-[#4285f4]/50 transition-all text-xs text-[#c4c7c5] shadow-xs cursor-default">
        <GeminiSparkle className="w-3.5 h-3.5" />
        <span className="text-white font-medium">Gemini 3.8 Intelligence</span>
        <span className="text-[#8e918f]">·</span>
        <span className="text-[#a8c7fa] font-mono text-[11px]">Python & Code Studio</span>
      </div>

      {/* Gemini Authentic Two-Tone Heading */}
      <div className="space-y-1.5 sm:space-y-2 px-2">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight">
          <span className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent font-semibold">
            Hello, {userName}
          </span>
        </h1>
        <p className="text-2xl sm:text-3xl md:text-4xl font-normal text-[#606367] tracking-tight">
          How can I help you code today?
        </p>
      </div>

      {/* Gemini Category Quick Action Pills */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap max-w-2xl px-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#282a2c] text-white border border-[#4285f4]/60 shadow-xs'
                  : 'bg-[#1e1f20] text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] border border-[#282a2c]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#a8c7fa]' : 'text-[#8e918f]'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Gemini Suggestion Prompt Cards (4 Cards Grid) */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 md:gap-4 pt-1 text-left">
        {SAMPLE_EXAMPLES.slice(0, 4).map((sample, idx) => {
          const cardIcons = [Bug, GitBranch, Cpu, Layers];
          const CardIcon = cardIcons[idx % cardIcons.length];

          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample)}
              className="group p-4 sm:p-5 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] hover:border-[#37393b] text-[#c4c7c5] transition-all flex flex-col justify-between h-36 sm:h-40 text-left relative overflow-hidden shadow-xs hover:shadow-md cursor-pointer hover:scale-[1.01]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#a8c7fa] uppercase tracking-wider">
                    <CardIcon className="w-3.5 h-3.5 text-[#a8c7fa]" />
                    <span>{sample.tag}</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#131314] flex items-center justify-center text-[#8e918f] group-hover:text-white group-hover:bg-[#004a77] transition-all">
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                <div className="text-sm font-semibold text-white group-hover:text-[#a8c7fa] transition-colors line-clamp-1">
                  {sample.title}
                </div>

                <p className="text-xs text-[#8e918f] line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="text-[11px] text-[#8e918f] flex items-center justify-between pt-2 border-t border-[#282a2c]/60">
                <span className="flex items-center gap-1 text-[#a8c7fa]">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Interactive Walkthrough</span>
                </span>
                <span className="text-[10px] text-[#8e918f] font-mono">Python 3.10</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Gemini Capabilities Feature Banner */}
      <div className="w-full max-w-2xl px-4 py-3 rounded-2xl bg-[#1e1f20]/60 border border-[#282a2c] text-xs text-[#8e918f] flex items-center justify-between flex-wrap gap-2 text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Rule: Python & other coding languages only</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#c4c7c5]">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Sub-second AST
          </span>
          <span>·</span>
          <span>Web Grounding</span>
        </div>
      </div>
    </div>
  );
};
