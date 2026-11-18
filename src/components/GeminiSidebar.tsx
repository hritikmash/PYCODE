import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Code2, 
  Clock,
  Search,
  X,
  Sparkles,
  Zap,
  LogIn,
  LogOut,
  User,
  Settings as SettingsIcon,
  Crown,
  Laptop,
  Terminal,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveUserGreetingName } from '../utils/userName';
import { UserAvatar } from './UserAvatar';
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
      order = 1;
    } else if (diffDays === 1) {
      key = 'yesterday';
      label = 'Yesterday';
      order = 2;
    } else if (diffDays <= 7) {
      key = 'previous_7_days';
      label = 'Previous 7 Days';
      order = 3;
    } else if (diffDays <= 30) {
      key = 'previous_30_days';
      label = 'Previous 30 Days';
      order = 4;
    } else {
      key = 'older';
      label = 'Older Threads';
      order = 5;
    }

    if (!groupsMap.has(key)) {
      groupsMap.set(key, { label, order, items: [] });
    }
    groupsMap.get(key)!.items.push(item);
  }

  return Array.from(groupsMap.entries())
    .map(([key, val]) => ({ key, label: val.label, order: val.order, items: val.items }))
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
  const { 
    user, 
    isAuthenticated, 
    openAuthModal, 
    openAdminModal, 
    openSettingsModal, 
    openFeedbackModal, 
    isOwner, 
    isAdmin, 
    logout 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'threads' | 'explore'>('threads');
  const [searchQuery, setSearchQuery] = useState('');

  const dateGroups = groupHistoryByDate(history);
  const sidebarDisplayName = resolveUserGreetingName(user);

  const filteredGroups = dateGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.question && item.question.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(g => g.items.length > 0);

  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 z-40 flex flex-col bg-[#131414] border-r border-[#242828] transition-all duration-200 ease-in-out select-none ${
        isOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
      }`}
    >
      {/* Top Header & Logo */}
      <div className={`h-14 border-b border-[#242828] flex items-center shrink-0 ${isOpen ? 'px-3.5 justify-between' : 'justify-center'}`}>
        {isOpen ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[#282a2c] border border-[#37393b] flex items-center justify-center text-white font-bold shrink-0">
                🐍
              </div>
              <div className="truncate">
                <span className="text-sm font-semibold text-white tracking-tight block">PythonDecode</span>
                <span className="text-[10px] text-[#8e918f] block -mt-0.5">Gemini 3.8 Intelligence</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-[#1e1f20] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-10 rounded-full border border-[#282a2c] bg-[#1e1f20] hover:bg-[#282a2c] flex items-center justify-center text-[#8e918f] hover:text-white transition-all cursor-pointer shadow-xs"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Thread Button */}
      <div className={`shrink-0 ${isOpen ? 'p-3' : 'py-2 flex justify-center'}`}>
        <button
          type="button"
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 768 && isOpen) onToggle();
          }}
          className={`flex items-center rounded-xl bg-[#1e1f20] hover:bg-[#282a2c] text-white border border-[#282a2c] hover:border-[#37393b] transition-all cursor-pointer shadow-xs active:scale-[0.99] group ${
            isOpen ? 'w-full justify-between px-3 py-2 text-xs font-medium' : 'w-9 h-9 justify-center'
          }`}
          title="Start a new Python decode thread"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#a8c7fa] group-hover:rotate-90 transition-transform duration-200" />
            {isOpen && <span className="font-semibold text-xs tracking-tight">New Thread</span>}
          </div>
          {isOpen && (
            <kbd className="text-[10px] font-mono text-[#8e918f] bg-[#131414] px-1.5 py-0.5 rounded-md border border-[#282a2c]">
              Ctrl+K
            </kbd>
          )}
        </button>
      </div>

      {/* Main Content (when expanded) */}
      {isOpen ? (
        <div className="flex-1 overflow-y-auto px-3 space-y-4">
          {/* Navigation Sub-Tabs: Threads vs Library */}
          <div className="flex items-center bg-[#191a1a] p-0.5 rounded-xl border border-[#242828] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('threads')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'threads'
                  ? 'bg-[#202222] text-white shadow-xs'
                  : 'text-[#858585] hover:text-white'
              }`}
            >
              Threads
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-[#202222] text-white shadow-xs'
                  : 'text-[#858585] hover:text-white'
              }`}
            >
              Explore
            </button>
          </div>

          {/* TAB 1: THREADS */}
          {activeTab === 'threads' && (
            <div className="space-y-4">
              {/* Search threads */}
              {history.length > 3 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#858585]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search past threads..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#191a1a] border border-[#242828] focus:border-[#20b8cd] rounded-xl text-xs text-white placeholder-[#5c6166] outline-none"
                  />
                </div>
              )}

              {/* Grouped Threads */}
              {filteredGroups.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#858585] space-y-2">
                  <MessageSquare className="w-6 h-6 text-[#3d4245] mx-auto" />
                  <p>No conversation threads found.</p>
                  <p className="text-[11px] text-[#5c6166]">Ask a question or paste code to start a thread.</p>
                </div>
              ) : (
                filteredGroups.map(group => (
                  <div key={group.key} className="space-y-1">
                    <div className="px-2 text-[10px] uppercase font-semibold text-[#858585] tracking-wider">
                      {group.label}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map(item => {
                        const isActive = activeId === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              onSelectHistory(item);
                              if (window.innerWidth < 768) onToggle();
                            }}
                            className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#202222] text-white font-medium shadow-xs'
                                : 'text-[#9e9e9e] hover:text-white hover:bg-[#191a1a]'
                            }`}
                          >
                            <span className="truncate max-w-[180px]">{item.title}</span>
                            <button
                              type="button"
                              onClick={(e) => onDeleteHistory(item.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                              title="Delete thread"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: EXPLORE SAMPLES */}
          {activeTab === 'explore' && (
            <div className="space-y-2">
              <div className="px-2 text-[10px] uppercase font-semibold text-[#858585] tracking-wider">
                Sample Python Challenges
              </div>
              <div className="space-y-1">
                {SAMPLE_EXAMPLES.map(sample => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      onSelectSample(sample);
                      if (window.innerWidth < 768) onToggle();
                    }}
                    className="w-full text-left p-2 rounded-xl bg-[#191a1a] hover:bg-[#202222] border border-[#242828] text-xs text-[#c4c7c5] hover:text-white transition-all cursor-pointer"
                  >
                    <span className="font-medium block text-white truncate">{sample.title}</span>
                    <span className="text-[10px] text-[#858585] line-clamp-1">{sample.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Collapsed Icon Bar */
        <div className="flex-1 flex flex-col items-center py-2 space-y-3 text-[#8e918f]">
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-xl hover:bg-[#1e1f20] hover:text-white transition-colors cursor-pointer"
            title="Threads Library"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-xl hover:bg-[#1e1f20] hover:text-white transition-colors cursor-pointer"
            title="Explore Samples"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className={`border-t border-[#242828] bg-[#131414] shrink-0 ${isOpen ? 'p-3 space-y-1' : 'py-3 px-1 flex flex-col items-center space-y-2'}`}>
        {/* Settings Button */}
        <button
          type="button"
          onClick={() => {
            openSettingsModal();
            if (window.innerWidth < 768 && isOpen) onToggle();
          }}
          className={`flex items-center rounded-xl hover:bg-[#1e1f20] text-[#8e918f] hover:text-white transition-all cursor-pointer ${
            isOpen ? 'w-full px-3 py-2 text-xs gap-2.5' : 'p-2 justify-center'
          }`}
          title="Open Settings & Preferences"
        >
          <SettingsIcon className="w-4 h-4 text-[#20b8cd]" />
          {isOpen && <span>Settings</span>}
        </button>

        {/* Owner Console Button (If Owner / Admin) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              openAdminModal();
              if (window.innerWidth < 768 && isOpen) onToggle();
            }}
            className={`flex items-center rounded-xl hover:bg-[#1e1f20] text-[#8e918f] hover:text-white transition-all cursor-pointer ${
              isOpen ? 'w-full px-3 py-2 text-xs gap-2.5' : 'p-2 justify-center'
            }`}
            title="Owner Control Center (Devices, Sessions & RBAC)"
          >
            <Crown className="w-4 h-4 text-[#f59e0b]" />
            {isOpen && <span>{isOwner ? 'Owner Console' : 'Admin Console'}</span>}
          </button>
        )}

        {/* Site Feedback Button */}
        <button
          type="button"
          onClick={() => {
            openFeedbackModal();
            if (window.innerWidth < 768 && isOpen) onToggle();
          }}
          className={`flex items-center rounded-xl hover:bg-[#1e1f20] text-[#8e918f] hover:text-white transition-all cursor-pointer ${
            isOpen ? 'w-full px-3 py-2 text-xs gap-2.5' : 'p-2 justify-center'
          }`}
          title="Submit Feedback & Upgrades"
        >
          <MessageSquare className="w-4 h-4 text-[#38bdf8]" />
          {isOpen && <span>Feedback</span>}
        </button>

        {/* User Account Capsule */}
        <div className={`w-full pt-2 border-t border-[#242828] ${isOpen ? '' : 'flex flex-col items-center'}`}>
          {isAuthenticated && user ? (
            isOpen ? (
              <div className="flex items-center justify-between gap-2 px-1">
                <div 
                  onClick={() => openSettingsModal('profile')}
                  className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden cursor-pointer group"
                >
                  <UserAvatar
                    avatar={user.avatar}
                    name={sidebarDisplayName}
                    email={user.email}
                    sizeClass="w-9 h-9"
                    roundedClass="rounded-full"
                    textClass="text-xs"
                    className="border border-[#282a2c] group-hover:border-[#4285f4]"
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-sm font-medium text-white block truncate group-hover:text-[#a8c7fa] transition-colors">{sidebarDisplayName}</span>
                    <span className="text-xs text-[#8e918f] truncate block">{user.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg hover:bg-[#1e1f20] text-[#8e918f] hover:text-red-400 transition-colors cursor-pointer shrink-0"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => openSettingsModal('profile')}
                className="cursor-pointer group py-0.5 flex items-center justify-center"
                title={`Signed in as ${sidebarDisplayName}`}
              >
                <UserAvatar
                  avatar={user.avatar}
                  name={sidebarDisplayName}
                  email={user.email}
                  sizeClass="w-8 h-8"
                  roundedClass="rounded-full"
                  textClass="text-xs"
                  className="border border-[#282a2c] group-hover:border-[#4285f4]"
                />
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('signin')}
              className={`flex items-center rounded-xl bg-[#282a2c] hover:bg-[#37393b] text-white font-medium transition-all cursor-pointer ${
                isOpen ? 'w-full justify-center gap-2 py-2 text-xs' : 'p-2 justify-center'
              }`}
            >
              <LogIn className="w-4 h-4 text-[#a8c7fa]" />
              {isOpen && <span>Sign In</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
