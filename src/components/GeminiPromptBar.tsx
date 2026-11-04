import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader2, 
  Paperclip,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  X,
  Plus,
  Mic,
  MicOff,
  Globe,
  ArrowUp,
  FileCode,
  Sparkles,
  Sliders
} from 'lucide-react';
import { AIEngineId, AttachedDocument, DocumentType, SearchEngineType } from '../types';
import { AI_ENGINES } from '../constants/aiEngines';

interface GeminiPromptBarProps {
  onSend: (text: string, attachments: AttachedDocument[]) => void;
  loading: boolean;
  selectedEngine: AIEngineId;
  onSelectEngine: (engine: AIEngineId) => void;
  onOpenEngineSettings?: () => void;
  preferredSearchEngine?: SearchEngineType;
  onToggleSearchGrounding?: () => void;
}

function getDocumentType(filename: string): DocumentType {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
  if (['pptx', 'ppt'].includes(ext)) return 'powerpoint';
  if (['docx', 'doc'].includes(ext)) return 'word';
  return 'other';
}

function renderDocIcon(type: DocumentType) {
  switch (type) {
    case 'pdf':
      return <FileText className="w-3.5 h-3.5 text-rose-400" />;
    case 'excel':
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
    case 'powerpoint':
      return <Presentation className="w-3.5 h-3.5 text-amber-400" />;
    case 'word':
      return <FileText className="w-3.5 h-3.5 text-sky-400" />;
    default:
      return <File className="w-3.5 h-3.5 text-purple-400" />;
  }
}

export const GeminiPromptBar: React.FC<GeminiPromptBarProps> = ({
  onSend,
  loading,
  selectedEngine,
  onSelectEngine,
  onOpenEngineSettings,
  preferredSearchEngine = 'google'
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachedDocument[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState<boolean>(false);
  const [searchGroundingActive, setSearchGroundingActive] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeFileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentEngine = AI_ENGINES.find(e => e.id === selectedEngine) || AI_ENGINES[0];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    } catch {
      setSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 180);
    el.style.height = `${Math.max(24, newHeight)}px`;
  }, [inputText]);

  const handleSend = () => {
    const textToSend = inputText.trim();
    const docsToSend = [...attachments];

    if ((textToSend.length > 0 || docsToSend.length > 0) && !loading) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      onSend(textToSend, docsToSend);
      setInputText('');
      setAttachments([]);
      setIsPlusMenuOpen(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = '24px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newDocs: AttachedDocument[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      size: file.size,
      type: getDocumentType(file.name),
      file
    }));

    setAttachments(prev => [...prev, ...newDocs]);
    setIsPlusMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (codeFileInputRef.current) codeFileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(doc => doc.id !== id));
  };

  const canSubmit = (inputText.trim().length > 0 || attachments.length > 0) && !loading;

  return (
    <div 
      className="w-full max-w-3xl mx-auto space-y-1.5 relative select-none"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.pptx,.ppt,.docx,.doc,.txt,.csv"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />
      <input
        ref={codeFileInputRef}
        type="file"
        accept=".py,.txt"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />

      {/* Gemini Prompt Container */}
      <div className={`relative rounded-2xl sm:rounded-3xl bg-[#1e1f20] border transition-all duration-200 shadow-xl ${
        isDragging
          ? 'border-[#4285f4] bg-[#4285f4]/5'
          : 'border-[#282a2c] hover:border-[#37393b] focus-within:border-[#4285f4]/60 focus-within:ring-1 focus-within:ring-[#4285f4]/20'
      }`}>
        {/* Attached Documents Row */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-2 pb-1 border-b border-[#282a2c]">
            {attachments.map(doc => (
              <div 
                key={doc.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-[#282a2c] border border-[#37393b] text-xs text-white"
              >
                {renderDocIcon(doc.type)}
                <span className="truncate max-w-[140px] text-[11px]">{doc.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(doc.id)}
                  className="p-0.5 rounded-full hover:bg-white/10 text-[#8e918f] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea Input & Controls in 50% Reduced Height Layout */}
        <div className="px-3.5 pt-2 pb-1.5 sm:px-4 sm:pt-2.5 sm:pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or paste Python code..."
            className="w-full bg-transparent text-sm sm:text-base text-[#ededed] placeholder-[#6d7175] outline-none resize-none leading-snug min-h-[22px] max-h-[140px]"
          />

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-[#282a2c]/50">
            {/* Left Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Focus / Engine Pill */}
              <button
                type="button"
                onClick={onOpenEngineSettings}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#282a2c] hover:bg-[#323437] text-xs text-white transition-colors cursor-pointer border border-[#37393b] shrink-0"
                title="Change active AI model"
              >
                <span className="w-2 h-2 rounded-full bg-[#20b8cd] shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs text-white">{currentEngine.name}</span>
              </button>

              {/* Attach File Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  className="p-1.5 rounded-full hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
                  title="Attach files or code"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {isPlusMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl bg-[#1e1f20] border border-[#282a2c] shadow-xl p-1.5 z-40 text-xs animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => codeFileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-[#282a2c] text-white text-left cursor-pointer"
                    >
                      <FileCode className="w-4 h-4 text-[#20b8cd]" />
                      <span>Upload Python (.py)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-[#282a2c] text-white text-left cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>Documents (.pdf, .csv)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Web Search Grounding Toggle */}
              <button
                type="button"
                onClick={() => setSearchGroundingActive(!searchGroundingActive)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  searchGroundingActive
                    ? 'text-[#20b8cd] bg-[#20b8cd]/10'
                    : 'text-[#8e918f] hover:bg-[#282a2c]'
                }`}
                title={`Live Search Grounding: ${searchGroundingActive ? 'Active' : 'Off'}`}
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Voice Input (Speech-to-Text) */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    isListening
                      ? 'text-red-400 bg-red-950/50 animate-pulse'
                      : 'text-[#8e918f] hover:bg-[#282a2c]'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Voice dictation'}
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right Submit Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSubmit}
              className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                canSubmit
                  ? 'bg-white text-black hover:bg-[#e3e3e3] shadow-md scale-100'
                  : 'bg-[#282a2c] text-[#5c6166] cursor-not-allowed scale-95 opacity-60'
              }`}
              title={loading ? 'Analyzing...' : 'Send question'}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
