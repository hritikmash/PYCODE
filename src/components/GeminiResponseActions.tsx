import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Check, 
  Search, 
  SlidersHorizontal, 
  Share2, 
  Play, 
  Download, 
  FileCode, 
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import { PythonDecodeResponse } from '../types';

interface GeminiResponseActionsProps {
  result: PythonDecodeResponse;
  codeSnippet?: string;
  onModifyResponse?: (modification: 'shorter' | 'longer' | 'simpler' | 'technical') => void;
  onReTestPython?: () => void;
  isTestingPython?: boolean;
}

export const GeminiResponseActions: React.FC<GeminiResponseActionsProps> = ({
  result,
  codeSnippet,
  onModifyResponse,
  onReTestPython,
  isTestingPython
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isModifyOpen, setIsModifyOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [doubleChecked, setDoubleChecked] = useState<boolean>(false);

  // Gemini Feature 1: Listen / Read Aloud (Text-to-Speech)
  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Prepare clean text to speak
    const speechText = `${result.summary}. ${
      result.errors.length > 0 
        ? `Found ${result.errors.length} issues in the code. ${result.errors[0].explanation}` 
        : ''
    } ${result.conceptualAnswer ? result.conceptualAnswer.overview : ''}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Gemini Feature 2: Copy Response
  const handleCopy = async () => {
    const textToCopy = `=== Pycode Analysis (${result.engineMeta?.engineName || 'Gemini'}) ===
Summary: ${result.summary}

${result.correctedCode ? `Corrected Code:\n${result.correctedCode}\n` : ''}
${result.expectedOutput ? `Expected Output:\n${result.expectedOutput}` : ''}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Gemini Feature 3: Double-check with Google Search
  const handleDoubleCheck = () => {
    setDoubleChecked(true);
    setTimeout(() => {
      // Open Google Search in a safe background grounding query
      const query = encodeURIComponent(`python ${result.summary.slice(0, 80)}`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
    }, 600);
  };

  // Gemini Feature 4: Export to Markdown
  const handleDownloadMarkdown = () => {
    const content = `# Pycode Analysis Report
Engine: ${result.engineMeta?.engineName || 'Gemini'}
Date: ${new Date().toLocaleString()}

## Summary
${result.summary}

${result.originalCode ? `## Original Code\n\`\`\`python\n${result.originalCode}\n\`\`\`\n` : ''}
${result.correctedCode ? `## Corrected Code\n\`\`\`python\n${result.correctedCode}\n\`\`\`\n` : ''}
${result.expectedOutput ? `## Expected Output\n\`\`\`\n${result.expectedOutput}\n\`\`\`\n` : ''}

${result.conceptualAnswer ? `## Conceptual Guide: ${result.conceptualAnswer.title}\n${result.conceptualAnswer.overview}` : ''}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pycode-analysis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsShareOpen(false);
  };

  return (
    <div className="flex items-center justify-between pt-4 border-t border-[#282a2c] text-xs text-[#8e918f] select-none">
      {/* Left Action Buttons: Authentic Gemini Action Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap relative">
        {/* 1. Listen / TTS */}
        <button
          type="button"
          onClick={handleToggleSpeak}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            isSpeaking 
              ? 'bg-[#004a77] text-white animate-pulse' 
              : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
          }`}
          title={isSpeaking ? 'Stop listening' : 'Listen / Read aloud'}
          aria-label="Listen"
        >
          {isSpeaking ? <VolumeX className="w-4 h-4 text-[#a8c7fa]" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* 2. Copy */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-2 rounded-full hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
          title="Copy response"
          aria-label="Copy"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* 3. Good Response (Thumbs Up) */}
        <button
          type="button"
          onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            feedback === 'up'
              ? 'text-emerald-400 bg-emerald-950/60'
              : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
          }`}
          title="Good response"
          aria-label="Good response"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>

        {/* 4. Bad Response (Thumbs Down) */}
        <button
          type="button"
          onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            feedback === 'down'
              ? 'text-rose-400 bg-rose-950/60'
              : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
          }`}
          title="Bad response"
          aria-label="Bad response"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>

        {/* 5. Gemini Double-Check with Google Search */}
        <button
          type="button"
          onClick={handleDoubleCheck}
          className={`p-2 rounded-full transition-colors cursor-pointer flex items-center gap-1 ${
            doubleChecked
              ? 'text-[#a8c7fa] bg-[#004a77]/50'
              : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
          }`}
          title="Double-check with Google Search"
          aria-label="Double-check with Google Search"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] font-medium pr-1">Double-check</span>
        </button>

        {/* 6. Modify Response Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsModifyOpen(!isModifyOpen);
              setIsShareOpen(false);
            }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isModifyOpen ? 'bg-[#282a2c] text-white' : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
            }`}
            title="Modify response"
            aria-label="Modify response"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {isModifyOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl bg-[#1e1f20] border border-[#282a2c] shadow-2xl p-1.5 z-40 space-y-0.5 text-xs">
              <span className="px-3 py-1 block text-[10px] font-semibold text-[#8e918f] uppercase tracking-wider">
                Modify Response
              </span>
              <button
                type="button"
                onClick={() => {
                  onModifyResponse?.('shorter');
                  setIsModifyOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors"
              >
                Shorter & Concise
              </button>
              <button
                type="button"
                onClick={() => {
                  onModifyResponse?.('longer');
                  setIsModifyOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors"
              >
                More Detailed / In-depth
              </button>
              <button
                type="button"
                onClick={() => {
                  onModifyResponse?.('simpler');
                  setIsModifyOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors"
              >
                Simpler (Beginner Analogy)
              </button>
              <button
                type="button"
                onClick={() => {
                  onModifyResponse?.('technical');
                  setIsModifyOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors"
              >
                Technical / Under the Hood
              </button>
            </div>
          )}
        </div>

        {/* 7. Share / Export Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsShareOpen(!isShareOpen);
              setIsModifyOpen(false);
            }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isShareOpen ? 'bg-[#282a2c] text-white' : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
            }`}
            title="Share & export"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {isShareOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-52 rounded-2xl bg-[#1e1f20] border border-[#282a2c] shadow-2xl p-1.5 z-40 space-y-0.5 text-xs">
              <span className="px-3 py-1 block text-[10px] font-semibold text-[#8e918f] uppercase tracking-wider">
                Export & Share
              </span>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#a8c7fa]" />
                <span>Export as Markdown</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open('https://colab.research.google.com/#create=true', '_blank');
                  setIsShareOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Open in Google Colab</span>
              </button>
            </div>
          )}
        </div>

        {/* Re-test in Python 3.10 button if code exists */}
        {codeSnippet && onReTestPython && (
          <button
            type="button"
            onClick={onReTestPython}
            disabled={isTestingPython}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Re-test in Python 3.10</span>
          </button>
        )}
      </div>

      {/* Right Zone: Engine Latency & Metadata */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
          <Zap className="w-3 h-3 fill-emerald-400" />
          <span>{result.engineMeta?.latencyMs ? `${result.engineMeta.latencyMs}ms` : 'Fast'}</span>
        </span>
        <span className="text-[11px] font-mono text-[#8e918f]">
          {result.engineMeta?.engineName || 'Gemini'}
        </span>
      </div>
    </div>
  );
};
