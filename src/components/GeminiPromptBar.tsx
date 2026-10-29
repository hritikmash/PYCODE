import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader2, 
  Paperclip,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  X,
  Upload,
  Plus,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Globe,
  ArrowUp,
  FileCode
} from 'lucide-react';
import { AIEngineId, AttachedDocument, DocumentType, SearchEngineType } from '../types';

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
      return <FileText className="w-4 h-4 text-rose-400" />;
    case 'excel':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    case 'powerpoint':
      return <Presentation className="w-4 h-4 text-amber-400" />;
    case 'word':
      return <FileText className="w-4 h-4 text-sky-400" />;
    default:
      return <File className="w-4 h-4 text-purple-400" />;
  }
}

function getDocBadgeColor(type: DocumentType): string {
  switch (type) {
    case 'pdf':
      return 'bg-rose-950/60 border-rose-800 text-rose-200';
    case 'excel':
      return 'bg-emerald-950/60 border-emerald-800 text-emerald-200';
    case 'powerpoint':
      return 'bg-amber-950/60 border-amber-800 text-amber-200';
    case 'word':
      return 'bg-sky-950/60 border-sky-800 text-sky-200';
    default:
      return 'bg-purple-950/60 border-purple-800 text-purple-200';
  }
}

export const GeminiPromptBar: React.FC<GeminiPromptBarProps> = ({
  onSend,
  loading,
  selectedEngine,
  onSelectEngine,
  onOpenEngineSettings,
  preferredSearchEngine = 'google',
  onToggleSearchGrounding
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachedDocument[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [canScrollDown, setCanScrollDown] = useState<boolean>(false);
  const [canScrollUp, setCanScrollUp] = useState<boolean>(false);
  const [isMultiLine, setIsMultiLine] = useState<boolean>(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState<boolean>(false);
  
  // Gemini Feature: Speech-to-Text (Microphone)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Gemini Feature: Search Grounding Toggle
  const [searchGroundingActive, setSearchGroundingActive] = useState<boolean>(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeFileInputRef = useRef<HTMLInputElement>(null);

  // Check Web Speech API support
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

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

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

  const checkScrollState = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
      setCanScrollUp(scrollTop > 4);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);
    }
  };

  const handleScrollDown = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollTo({
        top: textareaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollUp = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Auto-expand textarea while typing up to 7 lines (168px), then apply scroll up and down
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    if (!inputText) {
      el.style.height = '20px';
      setIsMultiLine(false);
      setCanScrollDown(false);
      setCanScrollUp(false);
      return;
    }

    el.style.height = 'auto';
    const singleLineHeight = 20;
    const maxLines = 7;
    const maxHeight = singleLineHeight * maxLines;

    const calculatedHeight = Math.min(Math.max(el.scrollHeight, singleLineHeight), maxHeight);
    el.style.height = `${calculatedHeight}px`;

    const multi = calculatedHeight > 26 || el.scrollHeight > 26;
    setIsMultiLine(multi);

    el.scrollTop = el.scrollHeight;
    checkScrollState();
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
        textareaRef.current.style.height = '20px';
      }
      setIsMultiLine(false);
      setCanScrollDown(false);
      setCanScrollUp(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const canSubmit = (inputText.trim().length > 0 || attachments.length > 0) && !loading;

  return (
    <div 
      className="w-full max-w-[480px] sm:max-w-[540px] mx-auto space-y-1 relative select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Inputs */}
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
        accept=".py,.js,.ts,.tsx,.jsx,.cpp,.c,.java,.rs,.go,.html,.css,.sql,.json"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />

      {/* Drag & Drop Visual Scrim */}
      {isDragging && (
        <div className="absolute inset-0 z-30 rounded-3xl bg-black/90 border-2 border-dashed border-[#4285f4] backdrop-blur-xs flex items-center justify-center pointer-events-none text-[#a8c7fa] px-3 py-1.5 text-center animate-in fade-in duration-150">
          <Upload className="w-4 h-4 animate-bounce text-[#4285f4] mr-2" />
          <span className="font-semibold text-xs text-white">Drop code or documents here</span>
        </div>
      )}

      {/* Attached Documents Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 px-1.5 py-0.5 animate-in fade-in duration-150">
          <span className="text-[9px] font-medium text-[#8e918f] flex items-center gap-1 mr-0.5">
            <Paperclip className="w-2.5 h-2.5 text-[#a8c7fa]" />
            <span>Files:</span>
          </span>
          {attachments.map((doc) => (
            <div
              key={doc.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono transition-all ${getDocBadgeColor(doc.type)}`}
            >
              <div className="shrink-0">{renderDocIcon(doc.type)}</div>
              <span className="truncate max-w-[110px] sm:max-w-[150px]" title={doc.name}>
                {doc.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(doc.id)}
                className="p-0.5 rounded-full hover:bg-black/40 hover:text-white transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-2 h-2" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Authentic Gemini Search Bar - Decreased by 30% in size */}
      <div className={`relative transition-all duration-200 border border-[#282a2c] bg-[#1e1f20] hover:border-[#37393b] focus-within:border-[#4285f4]/80 shadow-lg px-2.5 sm:px-3 ${
        isMultiLine ? 'rounded-2xl py-1.5 sm:py-2' : 'rounded-full h-[38px] sm:h-[42px] flex items-center'
      }`}>
        <div className={`flex w-full gap-1.5 sm:gap-2 ${isMultiLine ? 'items-start' : 'items-center'}`}>
          {/* Gemini "+" Attachment Button with Dropdown Menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[#9aa0a6] hover:text-white hover:bg-[#282a2c] transition-all cursor-pointer active:scale-90 ${
                isPlusMenuOpen ? 'bg-[#282a2c] text-white' : ''
              } ${isMultiLine ? 'mt-0.5' : ''}`}
              title="Add files or code"
              aria-label="Add files or code"
            >
              <Plus className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* "+" Options Dropdown */}
            {isPlusMenuOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl bg-[#1e1f20] border border-[#282a2c] shadow-2xl p-1.5 z-40 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[11px]">Upload Documents</span>
                </button>
                <button
                  type="button"
                  onClick={() => codeFileInputRef.current?.click()}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">Upload Code File</span>
                </button>
              </div>
            )}
          </div>

          {/* Chat / Code Input Textarea - Scaled down 30% */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={checkScrollState}
            rows={1}
            placeholder="Ask Gemini or enter code..."
            className="flex-1 bg-transparent text-[#e3e3e3] placeholder-[#8e918f] placeholder:truncate text-xs sm:text-sm resize-none focus:outline-none leading-5 font-sans selection:bg-[#004a77] py-0 overflow-y-auto max-h-[140px] [scrollbar-width:thin] [scrollbar-color:#37393b_transparent]"
            style={{ height: '20px' }}
          />

          {/* Right Action Icons: Scroll, Web Search, Microphone, Send */}
          <div className={`shrink-0 flex items-center gap-1 ${isMultiLine ? 'mt-0.5' : ''}`}>
            {/* Scroll Down button when textarea overflows */}
            {canScrollDown && (
              <button
                type="button"
                onClick={handleScrollDown}
                className="w-5 h-5 rounded-full bg-[#282a2c] hover:bg-[#37393b] text-[#00ff88] flex items-center justify-center transition-all cursor-pointer shadow-xs animate-bounce"
                title="Scroll down"
                aria-label="Scroll down"
              >
                <ChevronDown className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}

            {/* Scroll Up button */}
            {canScrollUp && !canScrollDown && (
              <button
                type="button"
                onClick={handleScrollUp}
                className="w-5 h-5 rounded-full bg-[#282a2c] hover:bg-[#37393b] text-[#8e918f] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Scroll up"
                aria-label="Scroll up"
              >
                <ChevronUp className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}

            {/* Gemini Feature: Search Grounding Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setSearchGroundingActive(!searchGroundingActive);
                onToggleSearchGrounding?.();
              }}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                searchGroundingActive
                  ? 'text-[#a8c7fa] bg-[#004a77]/40 border border-[#004a77]'
                  : 'text-[#8e918f] hover:text-white hover:bg-[#282a2c]'
              }`}
              title={searchGroundingActive ? 'Web Search Grounding Active' : 'Enable Web Search Grounding'}
              aria-label="Web search grounding"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>

            {/* Gemini Feature: Microphone / Speech-to-Text */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                    : 'text-[#8e918f] hover:text-white hover:bg-[#282a2c]'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Use microphone / voice input'}
                aria-label="Voice input"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Loading Spinner or Gemini Send Button */}
            {loading ? (
              <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[#a8c7fa]" title="Gemini is analyzing...">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSubmit}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  canSubmit
                    ? 'bg-[#e3e3e3] hover:bg-white text-[#131314] shadow-md hover:scale-105 active:scale-95'
                    : 'bg-[#282a2c]/60 text-[#8e918f]/50 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
