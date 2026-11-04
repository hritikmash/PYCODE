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
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 md:py-12 flex flex-col justify-center items-center text-center space-y-6 sm:space-y-7 animate-in fade-in duration-300 select-none">
      
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

      {/* Two Sleek Quick Cards (Matches exact screenshot layout) */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 text-left">
        <button
          type="button"
          onClick={() => onSelectSample(SAMPLE_EXAMPLES[0])}
          className="group p-4 sm:p-5 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] hover:border-[#37393b] text-[#c4c7c5] transition-all flex items-center justify-between text-left shadow-xs cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-white tracking-wider uppercase">
            <Bug className="w-4 h-4 text-[#a8c7fa]" />
            <span>THEORY + CODE</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#131314] flex items-center justify-center text-[#8e918f] group-hover:text-white transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectSample(SAMPLE_EXAMPLES[1])}
          className="group p-4 sm:p-5 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] hover:border-[#37393b] text-[#c4c7c5] transition-all flex items-center justify-between text-left shadow-xs cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-white tracking-wider uppercase">
            <GitBranch className="w-4 h-4 text-[#a8c7fa]" />
            <span>CODE ONLY</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#131314] flex items-center justify-center text-[#8e918f] group-hover:text-white transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
};
