import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Code2, 
  Compass, 
  Clock,
  Calendar,
  Search,
  X,
  Sparkles,
  Zap,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveUserGreetingName } from '../utils/userName';
import { GeminiSparkle } from './GeminiIcons';
import { renderEngineIcon } from './AIEngineIcons';
import { SampleExample, PythonDecodeResponse, AIEngineId, AnalysisMode, AttachedDocument, ChatMessage } from '../types';
import { SAMPLE_EXAMPLES } from '../data/samples';

export interface HistoryItem {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp: string;
  codeSnippet?: string;
  code?: string;
  question?: string;
  attachments?: AttachedDocument[];
  analysisResult?: PythonDecodeResponse;
  quickPyOutput?: any;
  engine?: AIEngineId;
  mode?: AnalysisMode;
  messages?: ChatMessage[];
}

export interface HistoryDateGroup {
  key: string;
  label: string;
  order: number;
  items: HistoryItem[];
}

interface GeminiSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string, e: React.MouseEvent) => void;
  onClearHistory?: () => void;
  onSelectSample: (sample: SampleExample) => void;
  onReplayIntro?: () => void;
  activeId?: string;
}

export function groupHistoryByDate(history: HistoryItem[]): HistoryDateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const groupsMap = new Map<string, { label: string; order: number; items: HistoryItem[] }>();

  // Ensure items are ordered newest first
  const sorted = [...history].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (!isNaN(Number(a.id)) ? Number(a.id) : 0);
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (!isNaN(Number(b.id)) ? Number(b.id) : 0);
    return timeB - timeA;
  });

  for (const item of sorted) {
    let itemDate: Date;
    if (item.createdAt) {
      itemDate = new Date(item.createdAt);
    } else if (item.id && !isNaN(Number(item.id))) {
      itemDate = new Date(Number(item.id));
    } else {
      itemDate = new Date();
    }

    if (isNaN(itemDate.getTime())) {
      itemDate = new Date();
    }

    const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / (1000 * 60 * 60 * 24));

    let key: string;
    let label: string;
    let order: number;

    if (diffDays === 0) {
      key = 'today';
      label = 'Today';
      order = 0;
    } else if (diffDays === 1) {
      key = 'yesterday';
      label = 'Yesterday';
      order = 1;
    } else if (diffDays > 1 && diffDays <= 7) {
      key = 'prev7';
      label = 'Previous 7 Days';
      order = 2;
    } else if (diffDays > 7 && diffDays <= 30) {
      key = 'prev30';
      label = 'Previous 30 Days';
      order = 3;
    } else {
      const monthYear = itemDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      key = `month-${itemDate.getFullYear()}-${itemDate.getMonth()}`;
      label = monthYear;
      order = 100 + (now.getFullYear() - itemDate.getFullYear()) * 12 + (now.getMonth() - itemDate.getMonth());
    }

    if (!groupsMap.has(key)) {
      groupsMap.set(key, { label, order, items: [] });
    }
    groupsMap.get(key)!.items.push(item);
  }

  return Array.from(groupsMap.entries())
    .map(([key, data]) => ({
      key,
      label: data.label,
      order: data.order,
      items: data.items
    }))
    .sort((a, b) => a.order - b.order);
}

export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({
  isOpen,
  onToggle,
  onNewChat,
  history,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  onSelectSample,
  onReplayIntro,
  activeId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { user, isAuthenticated, logout, openAuthModal, openFeedbackModal } = useAuth();
  const sidebarDisplayName = resolveUserGreetingName(user);

  if (!isOpen) return null;

  // Filter history by search query if any
  const filteredHistory = searchQuery.trim()
    ? history.filter(item => {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.question && item.question.toLowerCase().includes(q)) ||
          (item.code && item.code.toLowerCase().includes(q)) ||
          (item.codeSnippet && item.codeSnippet.toLowerCase().includes(q))
        );
      })
    : history;

  const dateGroups = groupHistoryByDate(filteredHistory);

  const handleSelectHistoryItem = (item: HistoryItem) => {
    onSelectHistory(item);
    if (window.innerWidth < 640) {
      onToggle(); // Close full-screen sidebar on mobile after selecting
    }
  };

  const handleNewChatClick = () => {
    onNewChat();
    setIsHistoryOpen(false);
    if (window.innerWidth < 640) {
      onToggle();
    }
  };

  const handleSampleClick = (sample: SampleExample) => {
    onSelectSample(sample);
    if (window.innerWidth < 640) {
      onToggle();
    }
  };

  return (
    <aside className="fixed inset-0 w-full h-full z-50 sm:static sm:w-80 sm:h-screen sm:shrink-0 sm:z-40 flex flex-col bg-[#1e1f20] text-[#e3e3e3] border-r border-[#282a2c] select-none shadow-2xl sm:shadow-none">
      {/* View 1: Whole Previous Chats History View */}
      {isHistoryOpen ? (
        <div className="flex flex-col h-full">
          {/* History Header with Back button */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#282a2c]/60">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="flex items-center gap-1.5 text-xs text-[#a8c7fa] hover:text-white px-2.5 py-1.5 rounded-full hover:bg-[#282a2c] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#a8c7fa]" />
              <span className="font-semibold text-xs sm:text-sm text-white">Chat History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#004a77] text-white">
                {filteredHistory.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {history.length > 0 && onClearHistory && (
                confirmClear ? (
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        onClearHistory();
                        setConfirmClear(false);
                      }}
                      className="text-red-400 hover:text-red-300 font-semibold"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="text-[#8e918f]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-[10px] text-[#8e918f] hover:text-red-400 transition-colors px-2 py-1"
                    title="Clear all stored history"
                  >
                    Clear all
                  </button>
                )
              )}

              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-full hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer sm:hidden"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Search across all previous chats */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e918f]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search whole previous chats..."
                className="w-full bg-[#131314] text-xs text-[#e3e3e3] placeholder-[#8e918f] pl-8 pr-7 py-2 rounded-full border border-[#282a2c] focus:outline-none focus:border-[#a8c7fa]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8e918f] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Whole Previous Chats List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs">
            {filteredHistory.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#8e918f] text-xs bg-[#1a1b1c]/60 rounded-2xl border border-[#282a2c]/50 my-4 space-y-2">
                <Clock className="w-6 h-6 mx-auto text-[#8e918f]/60" />
                {searchQuery ? (
                  <span>No chats found matching &ldquo;{searchQuery}&rdquo;</span>
                ) : (
                  <>
                    <span className="font-medium text-white block">No previous chats stored yet.</span>
                    <span className="text-[11px] text-[#8e918f]/80 block">
                      Ask a Python question or paste code to save your conversations here.
                    </span>
                  </>
                )}
              </div>
            ) : (
              dateGroups.map((group) => (
                <div key={group.key} className="space-y-1">
                  {/* Date Group Header Divider */}
                  <div className="sticky top-0 z-10 bg-[#1e1f20]/95 backdrop-blur-xs py-1 px-3 flex items-center justify-between border-b border-[#282a2c]/60 text-[11px] font-medium text-[#a8c7fa]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#a8c7fa]/80" />
                      <span className="tracking-wide uppercase text-[10px] font-semibold">{group.label}</span>
                    </div>
                    <span className="text-[10px] text-[#8e918f] font-mono">
                      {group.items.length} {group.items.length === 1 ? 'chat' : 'chats'}
                    </span>
                  </div>

                  {/* Chats inside this Date */}
                  <div className="space-y-0.5 pt-0.5">
                    {group.items.map((item) => {
                      const isSelected = activeId === item.id;
                      const hasCode = Boolean((item.code || item.codeSnippet)?.trim());
                      const engineType = item.engine || item.analysisResult?.engineMeta?.engineId || 'gemini';

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectHistoryItem(item)}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-[#004a77] border-[#005a92] text-white shadow-xs'
                              : 'border-transparent hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-1">
                            <div className="mt-0.5 shrink-0">
                              {renderEngineIcon(engineType, 'w-3.5 h-3.5')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium leading-snug">
                                {item.title || 'Python Decode'}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#8e918f] mt-0.5">
                                <span>{item.timestamp}</span>
                                {hasCode && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-[#131314] text-[#a8c7fa] border border-[#282a2c]">
                                    <Code2 className="w-2.5 h-2.5" />
                                    <span>Code</span>
                                  </span>
                                )}
                                {item.analysisResult && (
                                  <span className="text-emerald-400 font-mono">
                                    Output saved
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => onDeleteHistory(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 rounded-full transition-opacity cursor-pointer shrink-0"
                            title="Delete this chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* View 2: Main Sidebar Menu with New Decode & Dedicated "History" Option */
        <div className="flex flex-col h-full">
          {/* Top Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#282a2c]/60">
            <div className="flex items-center gap-2.5">
              <GeminiSparkle className="w-6 h-6" />
              <span className="font-semibold text-sm tracking-tight text-white">pythonDecode</span>
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 rounded-full hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <span className="sm:hidden text-xs font-medium px-1.5">Close</span>
              <ChevronLeft className="w-5 h-5 hidden sm:inline" />
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="p-3 pb-2 space-y-2.5">
            {/* New Decode Button */}
            <button
              type="button"
              onClick={handleNewChatClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#282a2c] hover:bg-[#37393b] text-white text-xs font-medium transition-all shadow-xs group cursor-pointer border border-[#37393b]/50"
            >
              <Plus className="w-4 h-4 text-[#a8c7fa] group-hover:rotate-90 transition-transform duration-200" />
              <span>New Python Decode</span>
            </button>

            {/* Dedicated "History" Option Button */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-[#1e1f20] to-[#282a2c] hover:from-[#282a2c] hover:to-[#37393b] border border-[#282a2c] hover:border-[#a8c7fa]/40 text-white text-xs font-medium transition-all shadow-xs group cursor-pointer"
              title="Open full history to view whole previous chats"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#131314] border border-[#282a2c] flex items-center justify-center text-[#a8c7fa] group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4 text-[#a8c7fa]" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">History</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#004a77] text-white font-semibold">
                      {history.length} {history.length === 1 ? 'chat' : 'chats'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8e918f] mt-0.5">
                    Click to view whole previous chats
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8e918f] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Scrollable Labs & Info */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs">
            {/* Quick Python Labs & Topics */}
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Learning Labs</span>
              </div>

              <div className="mt-1 space-y-1">
                {SAMPLE_EXAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSampleClick(sample)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors flex flex-col gap-0.5 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="truncate text-white group-hover:text-[#a8c7fa]">{sample.title}</span>
                    </div>
                    <span className="text-[10px] text-[#8e918f] line-clamp-1">{sample.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Replay Cinematic Intro Button */}
            {onReplayIntro && (
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onReplayIntro();
                    if (window.innerWidth < 640) onToggle();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/30 text-[#00ff88] text-xs font-mono transition-all group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping" />
                    <span>Replay Intro</span>
                  </span>
                  <span className="text-[10px] text-[#8e918f] group-hover:text-white">▶</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openFeedbackModal();
                    if (window.innerWidth < 640) onToggle();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] text-[#c4c7c5] hover:text-white text-xs transition-all cursor-pointer mt-1.5"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>Site Feedback & Upgrades</span>
                  </span>
                  <span className="text-[10px] text-[#8e918f]">★</span>
                </button>
              </div>
            )}
          </div>

          {/* Viewer Account Card */}
          <div className="p-3 border-t border-[#282a2c] bg-[#171819]">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {user.avatar || '👤'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate max-w-[130px]">{sidebarDisplayName}</div>
                    <div className="text-[10px] text-[#8e918f] truncate">{user.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-red-400 transition-colors"
                  title="Sign out / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#004a77] hover:bg-[#005a92] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Create Account</span>
              </button>
            )}
          </div>

          {/* Bottom Environment Status Bar */}
          <div className="p-3 border-t border-[#282a2c] bg-[#1a1b1c] text-[11px] text-[#8e918f] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Python 3.10 Engine
              </span>
              <span className="font-mono text-[10px] text-[#8e918f]">Sandboxed</span>
            </div>
            <div className="text-[10px] text-[#8e918f] flex items-center justify-between">
              <span>AI Engine</span>
              <span className="text-[#a8c7fa] font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#a8c7fa]" />
                Multi-AI Turbo
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
