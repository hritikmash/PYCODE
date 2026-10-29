import React, { useState, useEffect } from 'react';
import { GeminiHeader } from './components/GeminiHeader';
import { GeminiSidebar, HistoryItem } from './components/GeminiSidebar';
import { GeminiPromptBar } from './components/GeminiPromptBar';
import { GeminiWelcome } from './components/GeminiWelcome';
import { GeminiSparkle } from './components/GeminiIcons';
import { CodeDiffViewer } from './components/CodeDiffViewer';
import { FunctionExplainer } from './components/FunctionExplainer';
import { FlowchartViewer } from './components/FlowchartViewer';
import { ConceptualGuide } from './components/ConceptualGuide';
import { TerminalOutput } from './components/TerminalOutput';
import { ExecutionTraceViewer } from './components/ExecutionTraceViewer';
import { CinematicIntro } from './components/CinematicIntro';
import { AIEngineModal } from './components/AIEngineModal';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';
import { ViewerActivityModal } from './components/ViewerActivityModal';
import { GoogleLoginWindow } from './components/GoogleLoginWindow';
import { useAuth } from './context/AuthContext';
import { resolveUserGreetingName } from './utils/userName';
import { AIEngineBadge } from './components/AIEngineBadge';
import { GeminiResponseActions } from './components/GeminiResponseActions';
import { GeminiSolutionView } from './components/GeminiSolutionView';
import { SubmittedCodeErrorHighlighter } from './components/SubmittedCodeErrorHighlighter';
import { SearchEngineFallbackBanner } from './components/SearchEngineFallbackBanner';
import { renderEngineIcon } from './components/AIEngineIcons';
import { AI_ENGINES } from './constants/aiEngines';
import { 
  AnalysisMode, 
  PythonDecodeResponse, 
  SampleExample, 
  AIEngineId,
  SearchEngineType,
  AttachedDocument,
  ChatMessage,
  ChatSession
} from './types';
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  Copy, 
  Check, 
  ShieldCheck, 
  Play, 
  Code2, 
  BookOpen, 
  GitFork, 
  Terminal, 
  Activity,
  Layers,
  Zap,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Paperclip,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  ChevronDown
} from 'lucide-react';

const STORAGE_KEY = 'pythonDecode_history_v1';

// Smart extractor to parse Python code vs natural language question from user's input
function parseUserInput(rawText: string): { code: string; question: string } {
  const trimmed = rawText.trim();
  if (!trimmed) return { code: '', question: '' };

  // 1. Markdown code block
  const codeBlockMatch = trimmed.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    const code = codeBlockMatch[1].trim();
    const question = trimmed.replace(codeBlockMatch[0], '').trim();
    return { code, question };
  }

  // 2. Multiline code keywords
  const lines = trimmed.split('\n');
  const codeKeywords = [
    'def ', 'class ', 'import ', 'from ', 'for ', 'while ',
    'if ', 'elif ', 'else:', 'return', 'lambda ', 'try:',
    'except', 'with ', 'print(', '#', 'async def', 'yield'
  ];

  if (codeKeywords.some(kw => trimmed.startsWith(kw))) {
    return { code: trimmed, question: '' };
  }

  const firstCodeIdx = lines.findIndex(l => codeKeywords.some(kw => l.trim().startsWith(kw)));
  if (firstCodeIdx > 0) {
    const question = lines.slice(0, firstCodeIdx).join('\n').trim();
    const code = lines.slice(firstCodeIdx).join('\n').trim();
    return { code, question };
  }

  const hasIndent = lines.some(l => l.startsWith('    ') || l.startsWith('\t'));
  const hasCodePunctuation = (trimmed.includes(':') && (trimmed.includes('for ') || trimmed.includes('if ') || trimmed.includes('while '))) ||
    (trimmed.includes('print(') && trimmed.includes('='));

  if (hasIndent || hasCodePunctuation) {
    return { code: trimmed, question: '' };
  }

  return { code: '', question: trimmed };
}

// Render document attachment badge with appropriate icon (Requirement 7 & 8)
function renderDocumentBadge(doc: AttachedDocument) {
  let icon = <File className="w-3.5 h-3.5 text-purple-400" />;
  let color = 'bg-purple-950/60 border-purple-800 text-purple-200';

  if (doc.type === 'pdf') {
    icon = <FileText className="w-3.5 h-3.5 text-rose-400" />;
    color = 'bg-rose-950/60 border-rose-800 text-rose-200';
  } else if (doc.type === 'excel') {
    icon = <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
    color = 'bg-emerald-950/60 border-emerald-800 text-emerald-200';
  } else if (doc.type === 'powerpoint') {
    icon = <Presentation className="w-3.5 h-3.5 text-amber-400" />;
    color = 'bg-amber-950/60 border-amber-800 text-amber-200';
  } else if (doc.type === 'word') {
    icon = <FileText className="w-3.5 h-3.5 text-sky-400" />;
    color = 'bg-sky-950/60 border-sky-800 text-sky-200';
  }

  const formattedSize = doc.size < 1024 * 1024 
    ? `${(doc.size / 1024).toFixed(1)} KB` 
    : `${(doc.size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div key={doc.id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono ${color}`}>
      {icon}
      <span className="font-semibold uppercase text-[10px] opacity-75">{doc.type}</span>
      <span className="truncate max-w-[200px]" title={doc.name}>{doc.name}</span>
      <span className="text-[10px] opacity-70">({formattedSize})</span>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Cinematic Intro state (plays once per page load)
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Navigation & Layout - NEVER open sidebar automatically on start/restart
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const [activeMode, setActiveMode] = useState<AnalysisMode>('both');
  const [activeTab, setActiveTab] = useState<'all' | 'diff' | 'functions' | 'flowchart' | 'theory' | 'terminal' | 'trace'>('all');

  // Multi-AI Engine State (Microsoft Copilot, ChatGPT, Gemini, Perplexity, Blackbox AI, DeepSeek, Turbo)
  const [selectedEngine, setSelectedEngine] = useState<AIEngineId>('gemini');
  const [preferredSearchEngine, setPreferredSearchEngine] = useState<SearchEngineType>('google');
  const [isEngineModalOpen, setIsEngineModalOpen] = useState<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);

  // Multi-Chat Sessions Management (Requirement 2)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          // Backward compatibility: If it's already a session with messages array
          if (item.messages && Array.isArray(item.messages)) {
            return item;
          }
          // Convert legacy item into a full session
          const msg: ChatMessage = {
            id: `legacy-${item.id}`,
            sender: 'assistant',
            timestamp: item.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            question: item.question || '',
            code: item.code || item.codeSnippet || '',
            attachments: item.attachments || [],
            analysisResult: item.analysisResult,
            quickPyOutput: item.quickPyOutput,
            engine: item.engine || 'gemini',
            mode: item.mode || 'both',
            isPythonRestricted: item.analysisResult?.isPythonRestricted
          };
          return {
            id: String(item.id),
            title: item.title || 'Python Conversation',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.createdAt || new Date().toISOString(),
            messages: [msg],
            engine: item.engine || 'gemini',
            mode: item.mode || 'both'
          };
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  // Active Session Pointer
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Processing & UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [runningPythonOnly, setRunningPythonOnly] = useState<boolean>(false);
  const [quickPyOutput, setQuickPyOutput] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Get current active session
  const activeSession = sessions.find(s => s.id === currentSessionId) || null;

  // Persist sessions to localStorage
  const persistSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions.slice(0, 50)));
    } catch (err) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions.slice(0, 20)));
      } catch {}
    }
  };

  // Convert sessions into HistoryItem format for GeminiSidebar
  const sidebarHistory: HistoryItem[] = sessions.map(s => {
    const lastMsg = s.messages[s.messages.length - 1];
    return {
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      timestamp: lastMsg?.timestamp || new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      code: lastMsg?.code,
      question: lastMsg?.question,
      attachments: lastMsg?.attachments,
      analysisResult: lastMsg?.analysisResult,
      quickPyOutput: lastMsg?.quickPyOutput,
      engine: s.engine || 'gemini',
      mode: s.mode || 'both',
      messages: s.messages
    };
  });

  // Requirement 1 & 2: Clicking a history item loads the conversation WITHOUT copying/duplicating question in input
  const handleSelectHistory = (item: HistoryItem) => {
    setCurrentSessionId(item.id);
    if (item.mode) setActiveMode(item.mode);
    if (item.engine) setSelectedEngine(item.engine);
    setErrorMessage(null);
    setQuickPyOutput(item.quickPyOutput || null);

    // Position conversation at the top so the user can read from the beginning
    setTimeout(() => {
      const scrollEl = document.getElementById('chat-scroll-container');
      if (scrollEl) {
        scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 80);
  };

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isScrolledUp = el.scrollTop + el.clientHeight < el.scrollHeight - 120;
    setShowScrollToBottom(isScrolledUp);
  };

  const scrollToChatBottom = () => {
    const scrollEl = document.getElementById('chat-scroll-container');
    if (scrollEl) {
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
    }
  };

  // Requirement 2: Create a brand new independent conversation
  const handleNewChat = () => {
    setCurrentSessionId('');
    setErrorMessage(null);
    setQuickPyOutput(null);
    setActiveTab('all');
  };

  // Delete an individual chat conversation
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    persistSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : '');
    }
  };

  // Clear all chats
  const handleClearHistory = () => {
    persistSessions([]);
    setCurrentSessionId('');
    setErrorMessage(null);
    setQuickPyOutput(null);
  };

  // Run raw Python test
  const handleRunPythonSubprocess = async (codeToRun: string) => {
    if (!codeToRun.trim()) return;
    setRunningPythonOnly(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToRun })
      });
      const data = await res.json();
      setQuickPyOutput(data);
    } catch (err: any) {
      setErrorMessage('Could not connect to Python runner: ' + err.message);
    } finally {
      setRunningPythonOnly(false);
    }
  };

  // Requirement 4, 6, 7, 8: Enter-to-send message handler
  const handleSendMessage = async (rawText: string, attachments: AttachedDocument[]) => {
    if (!rawText.trim() && attachments.length === 0) return;

    const { code: parsedCode, question: parsedQuestion } = parseUserInput(rawText);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessageId = `msg-${Date.now()}-u`;

    // Create User Message
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      timestamp: timeStr,
      question: parsedQuestion,
      code: parsedCode,
      attachments: attachments
    };

    // Determine target session ID and title
    let targetSessionId = currentSessionId;
    let isBrandNewSession = false;

    if (!targetSessionId) {
      targetSessionId = `session-${Date.now()}`;
      isBrandNewSession = true;
    }

    const sessionTitle = (
      parsedQuestion || 
      (parsedCode ? parsedCode.split('\n')[0].replace(/^#\s*/, '') : (attachments[0]?.name ? `File: ${attachments[0].name}` : 'Python Decode'))
    ).slice(0, 50);

    setLoading(true);
    setErrorMessage(null);

    // Retrieve any custom API keys
    let customApiKeys = {};
    try {
      const stored = localStorage.getItem('pycode_custom_api_keys');
      if (stored) customApiKeys = JSON.parse(stored);
    } catch {}

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: parsedCode,
          question: parsedQuestion,
          preferredMode: activeMode,
          engine: selectedEngine,
          customApiKeys,
          attachedDocs: attachments.map(d => ({ name: d.name, type: d.type, size: d.size })),
          preferredSearchEngine
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data: PythonDecodeResponse = await response.json();

      // Create Assistant Message
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        question: parsedQuestion,
        code: parsedCode,
        analysisResult: data,
        quickPyOutput: data.realExecution,
        engine: selectedEngine,
        mode: data.mode || activeMode,
        isPythonRestricted: data.isPythonRestricted,
        isInvalidQuery: data.isInvalidQuery,
        invalidMessageTitle: data.invalidMessageTitle,
        invalidMessageSubtitle: data.invalidMessageSubtitle
      };

      if (data.mode) {
        setActiveMode(data.mode);
      }

      // Update Sessions
      setSessions(prevSessions => {
        let updated: ChatSession[];
        if (isBrandNewSession) {
          const newSession: ChatSession = {
            id: targetSessionId,
            title: sessionTitle,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [userMsg, assistantMsg],
            engine: selectedEngine,
            mode: activeMode
          };
          updated = [newSession, ...prevSessions];
        } else {
          updated = prevSessions.map(sess => {
            if (sess.id === targetSessionId) {
              return {
                ...sess,
                updatedAt: new Date().toISOString(),
                messages: [...sess.messages, userMsg, assistantMsg]
              };
            }
            return sess;
          });
        }
        persistSessions(updated);
        return updated;
      });

      setCurrentSessionId(targetSessionId);

      // Keep the solution positioned at the top so the user can read it from the beginning
      setTimeout(() => {
        const scrollEl = document.getElementById('chat-scroll-container');
        const solutionEl = document.getElementById(`solution-${assistantMsg.id}`);
        if (scrollEl && solutionEl) {
          const containerRect = scrollEl.getBoundingClientRect();
          const solutionRect = solutionEl.getBoundingClientRect();
          // Scroll so the top of the solution aligns comfortably near the top of the viewport
          const targetScrollTop = scrollEl.scrollTop + (solutionRect.top - containerRect.top) - 16;
          scrollEl.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('AI engine analysis failed:', err);
      setErrorMessage(err.message || 'Failed to analyze code with AI engine. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Sample loading from welcome cards or sidebar
  const handleSelectSample = (sample: SampleExample) => {
    setActiveMode(sample.mode);
    handleSendMessage(`${sample.question}\n\n${sample.code}`, []);
  };

  const handleCopySummary = async (analysisResult: PythonDecodeResponse) => {
    if (!analysisResult) return;
    const textToCopy = `=== Pycode Analysis (${analysisResult.engineMeta?.engineName || 'AI'}) ===
Summary: ${analysisResult.summary}

Corrected Code:
${analysisResult.correctedCode}

Expected Output:
${analysisResult.expectedOutput}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const currentEngineObj = AI_ENGINES.find(e => e.id === selectedEngine) || AI_ENGINES[0];

  // Loading state while restoring saved token
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0e0f10] text-white flex flex-col items-center justify-center p-4 select-none">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-2xl shadow-xl shadow-indigo-950/50 mb-3 animate-pulse">
          🐍
        </div>
        <p className="text-xs text-[#8e918f] font-mono">Verifying authentication...</p>
      </div>
    );
  }

  // Mandatory Authentication Rule: without authentication never start the app, keep user on authentication page
  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  const greetingName = resolveUserGreetingName(user);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#131314] text-[#e3e3e3] font-sans antialiased">
      {/* Cinematic Intro Animation (plays once per page load) */}
      {showIntro && (
        <CinematicIntro onComplete={() => setShowIntro(false)} />
      )}

      {/* AI Engine Configuration Modal */}
      <AIEngineModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        selectedEngine={selectedEngine}
        onSelectEngine={(eng) => {
          setSelectedEngine(eng);
          setIsEngineModalOpen(false);
        }}
        preferredSearchEngine={preferredSearchEngine}
        onSelectSearchEngine={(se) => setPreferredSearchEngine(se)}
      />

      {/* Viewer Authentication Modal */}
      <AuthModal />

      {/* Owner Secret View: Viewer Activity Tracker Modal */}
      <ViewerActivityModal />

      {/* Separate Google Account Login Window */}
      <GoogleLoginWindow />

      {/* Left Sidebar with Multiple Chats and Date Groups */}
      <GeminiSidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        onSelectSample={handleSelectSample}
        onNewChat={handleNewChat}
        history={sidebarHistory}
        activeId={currentSessionId}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearHistory={handleClearHistory}
        onReplayIntro={() => setShowIntro(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <GeminiHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          mode={activeMode}
          onModeChange={setActiveMode}
          onReset={handleNewChat}
          userEmail={user?.email || 'viewer@pycode.dev'}
          selectedEngine={selectedEngine}
          onSelectEngine={setSelectedEngine}
          onOpenEngineModal={() => setIsEngineModalOpen(true)}
        />

        {/* Scrollable Center Content Container */}
        <div 
          id="chat-scroll-container" 
          onScroll={handleChatScroll}
          className="flex-1 overflow-y-auto px-2.5 sm:px-6 py-3 sm:py-6 space-y-6 pb-28 sm:pb-32 w-full max-w-full"
        >
          {/* Quick Python Subprocess Output Banner if present */}
          {quickPyOutput && (
            <div className={`max-w-4xl mx-auto p-3.5 rounded-2xl border text-xs font-mono transition-all ${
              quickPyOutput.hasSyntaxError || quickPyOutput.hasRuntimeError
                ? 'bg-red-950/40 border-red-800 text-red-200'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
            }`}>
              <div className="flex items-center justify-between font-sans font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#a8c7fa]" />
                  {quickPyOutput.hasSyntaxError
                    ? 'Python 3.10 Subprocess: Syntax Error Confirmed'
                    : quickPyOutput.hasRuntimeError
                    ? 'Python 3.10 Subprocess: Runtime Exception Raised'
                    : 'Python 3.10 Subprocess: Execution Successful (Code 0)'}
                </span>
                <span className="text-[11px] font-mono text-[#8e918f]">
                  {quickPyOutput.executionTimeMs}ms
                </span>
              </div>
              {quickPyOutput.stderr && (
                <pre className="text-red-300 text-[11px] whitespace-pre-wrap mt-1 p-2.5 bg-[#000000] rounded-xl border border-red-900/60 overflow-x-auto">
                  {quickPyOutput.stderr}
                </pre>
              )}
              {quickPyOutput.stdout && (
                <pre className="text-emerald-300 text-[11px] whitespace-pre-wrap mt-1 p-2.5 bg-[#000000] rounded-xl border border-emerald-900/60 overflow-x-auto">
                  {quickPyOutput.stdout}
                </pre>
              )}
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5 text-white">Engine Analysis Error</span>
                <p className="text-xs text-red-200">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* If No Messages in Current Session and not loading: Show GeminiWelcome */}
          {(!activeSession || activeSession.messages.length === 0) && !loading && (
            <GeminiWelcome 
              onSelectSample={handleSelectSample} 
              userName={greetingName}
              onSelectCategory={(query) => handleSendMessage(query, [])}
            />
          )}

          {/* Active Conversation Messages Stream (Multiple Chats Support) */}
          {activeSession && activeSession.messages.length > 0 && (
            <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-32">
              {activeSession.messages.map((msg, index) => {
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id || index} id={`user-msg-${msg.id || index}`} className="flex justify-end animate-in fade-in duration-200 w-full">
                      <div className="w-full sm:max-w-3xl sm:w-auto sm:max-w-[85%] rounded-2xl sm:rounded-3xl bg-[#282a2c]/80 hover:bg-[#282a2c] border border-[#37393b]/70 p-3.5 sm:p-5 text-[#f0f4f9] shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#37393b]/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                              {user?.avatar || (greetingName ? greetingName[0].toUpperCase() : 'U')}
                            </div>
                            <span className="font-medium text-[#c4c7c5] text-xs">{greetingName}</span>
                          </div>
                          <span className="text-[11px] font-mono text-[#8e918f]">{msg.timestamp}</span>
                        </div>

                        {/* Attached Documents - Shown as separate reference attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-1 pt-0.5">
                            <div className="text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-[#00ff88]" />
                              <span>Attached Documents:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {msg.attachments.map(renderDocumentBadge)}
                            </div>
                          </div>
                        )}

                        {/* Natural Language Question */}
                        {msg.question && (
                          <div className="text-sm sm:text-base text-white font-medium whitespace-pre-wrap leading-relaxed">
                            {msg.question}
                          </div>
                        )}

                        {/* Submitted Python Code with Inline Error Highlighting */}
                        {msg.code && (
                          <SubmittedCodeErrorHighlighter
                            originalCode={msg.code}
                            errors={msg.analysisResult?.errors || []}
                            title="Submitted Python Code"
                          />
                        )}
                      </div>
                    </div>
                  );
                }

                // Assistant Response
                const result = msg.analysisResult;
                const isInvalid = msg.isInvalidQuery || result?.isInvalidQuery || 
                  msg.isPythonRestricted || result?.isPythonRestricted || 
                  result?.summary?.includes('OOPS! YOUR QUESTION IS INVALID') ||
                  result?.invalidMessageTitle === 'OOPS! YOUR QUESTION IS INVALID' ||
                  result?.summary === 'PLEASE! Ask questions related to Python only.';

                return (
                  <div key={msg.id || index} id={`solution-${msg.id || index}`} className="space-y-4 animate-in fade-in duration-200">
                    {/* Strict Rule: Python or other coding language only */}
                    {isInvalid ? (
                      <div className="p-8 sm:p-10 rounded-3xl bg-[#1e1f20] border-2 border-red-500/60 text-center max-w-2xl mx-auto shadow-2xl space-y-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                          <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-red-400 tracking-tight font-sans uppercase">
                            OOPS! YOUR QUESTION IS INVALID
                          </h2>
                          <p className="text-sm sm:text-base text-[#c4c7c5] font-medium">
                            ask related to python or other coding language
                          </p>
                        </div>
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-red-500/10 text-red-300 border border-red-500/20">
                            Rule: Python & Coding Languages Only
                          </span>
                        </div>
                      </div>
                    ) : result ? (
                      <GeminiSolutionView
                        result={result}
                        engine={msg.engine || 'gemini'}
                        userCode={msg.code}
                        onSendMessage={handleSendMessage}
                        onRunPythonSubprocess={handleRunPythonSubprocess}
                        runningPythonOnly={runningPythonOnly}
                        onQuickReAnalyze={(eng) => {
                          setSelectedEngine(eng);
                          if (msg.question || msg.code) {
                            handleSendMessage(msg.question || '', msg.attachments || []);
                          }
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading Animation with Selected Engine Branding */}
          {loading && (
            <div className="max-w-4xl mx-auto p-8 rounded-3xl border border-[#282a2c] bg-[#1e1f20] text-center space-y-4 shadow-lg animate-pulse pb-16">
              <div className="w-12 h-12 rounded-full bg-[#131314] border border-[#282a2c] flex items-center justify-center mx-auto text-sky-400">
                {renderEngineIcon(currentEngineObj.iconType, 'w-6 h-6')}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-white flex items-center justify-center gap-2">
                  <span>{currentEngineObj.name} is analyzing your Python code...</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    {currentEngineObj.latencyBadge}
                  </span>
                </h3>
                <p className="text-xs text-[#8e918f] max-w-md mx-auto">
                  Verifying Python 3.10 execution, diagnosing syntax line-by-line, highlighting diffs, and charting control flow.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Search Bar (Anchored at the bottom of screen no matter what) */}
        <div className="sticky bottom-0 shrink-0 w-full z-30 pb-2.5 sm:pb-3 pt-1 px-3 sm:px-4 bg-[#131314]/90 backdrop-blur-xs flex flex-col items-center relative">
          {/* Scroll Down Floating Button when scrolled up in conversation */}
          {showScrollToBottom && (
            <button
              type="button"
              onClick={scrollToChatBottom}
              className="absolute -top-11 right-4 sm:right-1/4 z-40 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#a8c7fa] hover:text-white border border-[#37393b] shadow-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-bottom-2 active:scale-95"
              title="Scroll down to latest messages"
            >
              <ChevronDown className="w-3.5 h-3.5 animate-bounce text-[#00ff88]" />
              <span className="text-[11px] font-medium">Scroll down</span>
            </button>
          )}

          <GeminiPromptBar
            onSend={handleSendMessage}
            loading={loading}
            selectedEngine={selectedEngine}
            onSelectEngine={setSelectedEngine}
            onOpenEngineSettings={() => setIsEngineModalOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}
