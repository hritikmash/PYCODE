import React, { useState } from 'react';
import { Lightbulb, Copy, Check, Code2, Compass, Sparkles, CheckCircle2 } from 'lucide-react';
import { ConceptualAnswer } from '../types';

interface ConceptualGuideProps {
  answer: ConceptualAnswer;
}

export const ConceptualGuide: React.FC<ConceptualGuideProps> = ({ answer }) => {
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<number | null>(null);

  const handleCopyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedSnippetIndex(index);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  return (
    /* ONE cohesive div class explaining all info without separate fragmented card boxes */
    <div 
      id="theory-section" 
      className="w-full max-w-full rounded-2xl sm:rounded-3xl border border-[#282a2c] bg-[#1e1f20] p-4 sm:p-7 md:p-8 text-[#f0f4f9] shadow-md space-y-6 break-words"
    >
      {/* 1. Header & Overview Title */}
      <div className="space-y-2 pb-4 border-b border-[#282a2c]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#a8c7fa] uppercase tracking-wider">
          <Compass className="w-4 h-4 text-[#a8c7fa] shrink-0" />
          <span>English Explanation & Conceptual Theory</span>
        </div>
        
        <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
          {answer.title}
        </h2>
        
        <p className="text-xs sm:text-sm text-[#c4c7c5] leading-relaxed pt-1">
          {answer.overview}
        </p>

        {/* Beginner Analogies (Inline callout inside the same div) */}
        {answer.beginnerAnalogies && answer.beginnerAnalogies.length > 0 && (
          <div className="mt-3 p-3 sm:p-4 rounded-xl bg-[#282a2c]/60 border border-[#37393b] text-amber-300 text-xs flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white block">Intuitive Real-World Analogy:</span>
              <ul className="list-disc list-inside space-y-1 text-[#d6d9d7] leading-relaxed">
                {answer.beginnerAnalogies.map((analogy, i) => (
                  <li key={i}>{analogy}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 2. Unified Core Content Sections - Flowing in one continuous explanatory document */}
      <div className="space-y-6">
        {answer.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3">
            {/* Section Heading */}
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 pb-1.5 border-b border-[#282a2c]/60">
              <span className="w-5 h-5 rounded-full bg-[#004a77] text-[#a8c7fa] flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
                {sIdx + 1}
              </span>
              <span>{section.heading}</span>
            </h3>

            {/* Subheadings and explanations flowing together */}
            <div className="space-y-4 pl-1 sm:pl-3">
              {section.subheadings.map((sub, subIdx) => (
                <div key={subIdx} className="space-y-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#a8c7fa] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a8c7fa] shrink-0" />
                    <span>{sub.title}</span>
                  </h4>

                  <p className="text-xs sm:text-[13px] text-[#c4c7c5] leading-relaxed">
                    {sub.explanation}
                  </p>

                  {/* Key Points bullet list */}
                  {sub.keyPoints && sub.keyPoints.length > 0 && (
                    <ul className="space-y-1 pt-1 text-xs text-[#e3e3e3] pl-2">
                      {sub.keyPoints.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <span className="text-[#a8c7fa] font-bold shrink-0 mt-0.5">›</span>
                          <span className="leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Subheading Code Snippet */}
                  {sub.codeSnippet && (
                    <div className="mt-2 rounded-xl bg-[#131314] text-emerald-300 p-2.5 sm:p-3 text-[11px] sm:text-xs font-mono border border-[#282a2c] overflow-x-auto w-full">
                      <pre className="whitespace-pre-wrap">{sub.codeSnippet}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Practical Python Demonstrations (Integrated within the same div) */}
      {answer.codeExamples && answer.codeExamples.length > 0 && (
        <div className="pt-3 border-t border-[#282a2c] space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
            <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Practical Python Demonstrations</span>
          </div>

          <div className="space-y-3">
            {answer.codeExamples.map((ex, exIdx) => (
              <div key={exIdx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{ex.title}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(ex.code, exIdx)}
                    className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium text-[#c4c7c5] hover:text-white bg-[#282a2c] hover:bg-[#37393b] rounded-full transition-colors cursor-pointer"
                  >
                    {copiedSnippetIndex === exIdx ? (
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

                <div className="rounded-xl bg-[#131314] p-3 font-mono text-[11px] sm:text-xs overflow-x-auto leading-relaxed text-[#c4c7c5] border border-[#282a2c]">
                  <pre>{ex.code}</pre>
                </div>

                {ex.explanation && (
                  <p className="text-xs text-[#8e918f] leading-relaxed pt-0.5 pl-1">
                    <strong className="text-[#c4c7c5]">Analysis:</strong> {ex.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Key Takeaways & Best Practices (Integrated inside the same div) */}
      {answer.keyTakeaways && answer.keyTakeaways.length > 0 && (
        <div className="pt-3 border-t border-[#282a2c] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#a8c7fa] shrink-0" />
            <span>Key Takeaways & Best Practices</span>
          </div>
          
          <ul className="space-y-1.5 text-xs sm:text-[13px] text-[#c4c7c5] pl-2">
            {answer.keyTakeaways.map((takeaway, tIdx) => (
              <li key={tIdx} className="flex items-start gap-2">
                <span className="text-[#a8c7fa] font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
