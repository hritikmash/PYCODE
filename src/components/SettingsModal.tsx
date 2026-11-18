import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  User, 
  ShieldCheck, 
  Sliders, 
  Users, 
  Terminal, 
  KeyRound, 
  Trash2, 
  Check, 
  Copy, 
  Laptop, 
  Smartphone, 
  Tablet, 
  AlertCircle, 
  Crown, 
  Database, 
  Cpu, 
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Zap,
  LogOut,
  ChevronRight,
  MessageSquare,
  Star,
  Shield,
  UserPlus,
  Info,
  Save,
  PlugZap
} from 'lucide-react';
import { useAuth, UserProfile } from '../context/AuthContext';
import {
  AI_ENGINES,
  BUILTIN_DEFAULT_ENGINE,
  EXTERNAL_ENGINES,
  getAvailableWorkspaceEngines
} from '../constants/aiEngines';
import { AIEngineId, SearchEngineType } from '../types';
import { UserAvatar } from './UserAvatar';
import { AIConnectivityHub } from './EngineConnectorModal';

interface SettingsModalProps {
  selectedEngine: AIEngineId;
  onSelectEngine: (engine: AIEngineId) => void;
  preferredSearchEngine: SearchEngineType;
  onSelectSearchEngine: (se: SearchEngineType) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  selectedEngine,
  onSelectEngine,
  preferredSearchEngine,
  onSelectSearchEngine
}) => {
  const { 
    isSettingsModalOpen, 
    closeSettingsModal, 
    settingsInitialTab,
    user, 
    isOwner, 
    isAdmin, 
    token, 
    deviceId,
    connectedExternalEngines,
    updateProfile, 
    toggle2FA, 
    logoutAllDevices,
    openAdminModal
  } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('general');

  // Profile edit states
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🐍');
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // 2FA state
  const [twoFactorActive, setTwoFactorActive] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Appearance & Editor Preferences
  const [editorFontSize, setEditorFontSize] = useState<string>(() => localStorage.getItem('pycode_font_size') || '14px');
  const [autoRunPython, setAutoRunPython] = useState<boolean>(() => localStorage.getItem('pycode_auto_run_py') !== 'false');
  const [showFlowchartByDefault, setShowFlowchartByDefault] = useState<boolean>(() => localStorage.getItem('pycode_show_flowchart') === 'true');

  // Owner user management states
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  // Owner system stats
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackSpeed, setFeedbackSpeed] = useState<'lightning' | 'good' | 'average' | 'sluggish'>('lightning');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackUpgrades, setFeedbackUpgrades] = useState<string[]>([
    'Code Editor & Autocomplete',
    'AI Response Speed (Gemini 3.8 Flash)'
  ]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // App Management & Updates states (Owner and Administrators have permissions)
  const [appConfig, setAppConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);

  const [cfgAppTitle, setCfgAppTitle] = useState('Pycode');
  const [cfgAppSubtitle, setCfgAppSubtitle] = useState('Python Theory & Code Intelligence Platform');
  const [cfgBannerEnabled, setCfgBannerEnabled] = useState(false);
  const [cfgBannerMessage, setCfgBannerMessage] = useState('');
  const [cfgBannerType, setCfgBannerType] = useState<'info' | 'warning' | 'success'>('info');
  const [cfgDefaultEngine, setCfgDefaultEngine] = useState<AIEngineId>('turbo_race');
  const [cfgDefaultMode, setCfgDefaultMode] = useState<'both' | 'code_only' | 'theory_only'>('both');
  const [cfgSandboxEnabled, setCfgSandboxEnabled] = useState(true);
  const [cfgFlowchartsEnabled, setCfgFlowchartsEnabled] = useState(true);
  const [cfgTraceEnabled, setCfgTraceEnabled] = useState(true);
  const [cfgAutoRunEnabled, setCfgAutoRunEnabled] = useState(true);

  // Appoint Administrator State (Owner Exclusive)
  const [appointEmail, setAppointEmail] = useState('');
  const [isAppointingAdmin, setIsAppointingAdmin] = useState(false);
  const [appointError, setAppointError] = useState<string | null>(null);
  const [appointSuccess, setAppointSuccess] = useState<string | null>(null);

  const handleSettingsFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performanceRating: feedbackRating,
          speedCategory: feedbackSpeed,
          upgradeFields: feedbackUpgrades,
          comments: feedbackComments,
          userName: user?.name || name || 'User',
          userEmail: user?.email || undefined
        })
      });
      if (!res.ok) {
        throw new Error('Failed to submit feedback');
      }
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackSuccess(false);
        setFeedbackComments('');
      }, 3500);
    } catch (err: any) {
      setFeedbackError(err.message || 'Error sending feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    if (isSettingsModalOpen) {
      setActiveTab(settingsInitialTab || 'general');
      if (user) {
        setName(user.name || '');
        setAvatar(user.avatar || '🐍');
        setSkillLevel(user.skillLevel || 'Beginner');
        setTwoFactorActive(Boolean(user.twoFactorEnabled));
      }
      setProfileSaveSuccess(false);
      setUserActionMsg(null);
      if (isAdmin) {
        loadAppConfig();
      }
    }
  }, [isSettingsModalOpen, settingsInitialTab, user, isAdmin]);

  // Load users if owner switches to users tab
  useEffect(() => {
    if (isSettingsModalOpen && activeTab === 'users' && isOwner && token) {
      loadUsers();
    }
    if (isSettingsModalOpen && activeTab === 'system' && isOwner && token) {
      loadSystemStats();
    }
    if (isSettingsModalOpen && activeTab === 'app_management' && isAdmin) {
      loadAppConfig();
    }
  }, [isSettingsModalOpen, activeTab, isOwner, isAdmin, token]);

  if (!isSettingsModalOpen) return null;

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.users) {
        setUserList(data.users);
      }
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const res = await fetch('/api/admin/system/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSystemStats(data);
    } catch (err) {
      console.warn('Failed to load system stats:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);

    const res = await updateProfile({
      name: name.trim(),
      avatar,
      skillLevel
    });
    setIsSavingProfile(false);
    if (res.success) {
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    }
  };

  const handleToggle2FA = async () => {
    setIsToggling2FA(true);
    const newStatus = !twoFactorActive;
    const res = await toggle2FA(newStatus);
    setIsToggling2FA(false);

    if (res.success) {
      setTwoFactorActive(newStatus);
      if (res.backupCodes) {
        setBackupCodes(res.backupCodes);
      } else {
        setBackupCodes([]);
      }
    }
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2500);
    }
  };

  const handleUpdateUserRole = async (targetUserId: string, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setUserActionMsg(`User role updated to ${newRole}`);
        setUserList(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
        setTimeout(() => setUserActionMsg(null), 3000);
      } else {
        setUserActionMsg(data.error || 'Failed to update role');
      }
    } catch (err: any) {
      setUserActionMsg(err.message || 'Network error');
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetEmail: string) => {
    if (!confirm(`Are you sure you want to delete account ${targetEmail}? This will revoke all their active sessions.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUserActionMsg(`Account deleted successfully`);
        setUserList(prev => prev.filter(u => u.id !== targetUserId));
        setTimeout(() => setUserActionMsg(null), 3000);
      }
    } catch (err: any) {
      setUserActionMsg(err.message || 'Delete error');
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const res = await fetch('/api/admin/system/clear-cache', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCacheClearSuccess(true);
        loadSystemStats();
        setTimeout(() => setCacheClearSuccess(false), 3000);
      }
    } finally {
      setIsClearingCache(false);
    }
  };

  const loadAppConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch('/api/app/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setAppConfig(data.config);
          setCfgAppTitle(data.config.appTitle || 'Pycode');
          setCfgAppSubtitle(data.config.appSubtitle || '');
          setCfgBannerEnabled(Boolean(data.config.announcementBanner?.enabled));
          setCfgBannerMessage(data.config.announcementBanner?.message || '');
          setCfgBannerType(data.config.announcementBanner?.type || 'info');
          setCfgDefaultEngine(data.config.defaultEngine || 'turbo_race');
          setCfgDefaultMode(data.config.defaultMode || 'both');
          setCfgSandboxEnabled(data.config.features?.sandboxExecution !== false);
          setCfgFlowchartsEnabled(data.config.features?.interactiveFlowcharts !== false);
          setCfgTraceEnabled(data.config.features?.variableExecutionTrace !== false);
          setCfgAutoRunEnabled(data.config.features?.autoRunCode !== false);
        }
      }
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleSaveAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccessMsg(null);
    try {
      const res = await fetch('/api/app/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          appTitle: cfgAppTitle,
          appSubtitle: cfgAppSubtitle,
          announcementBanner: {
            enabled: cfgBannerEnabled,
            message: cfgBannerMessage,
            type: cfgBannerType
          },
          defaultEngine: cfgDefaultEngine,
          defaultMode: cfgDefaultMode,
          features: {
            sandboxExecution: cfgSandboxEnabled,
            interactiveFlowcharts: cfgFlowchartsEnabled,
            variableExecutionTrace: cfgTraceEnabled,
            autoRunCode: cfgAutoRunEnabled
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAppConfig(data.config);
        setConfigSuccessMsg('App updated successfully! Live changes synchronized across all connected users.');
        setTimeout(() => setConfigSuccessMsg(null), 4000);
      } else {
        alert(data.error || 'Failed to update app configuration');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating app configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAppointAdministrator = async (emailOrId: string) => {
    if (!emailOrId.trim()) return;
    setIsAppointingAdmin(true);
    setAppointError(null);
    setAppointSuccess(null);
    try {
      const res = await fetch('/api/owner/administrators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: emailOrId.includes('@') ? emailOrId.trim() : undefined,
          userId: !emailOrId.includes('@') ? emailOrId.trim() : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAppointSuccess(`Successfully appointed ${data.user.name || data.user.email} as Administrator with app editing permissions!`);
        setAppointEmail('');
        loadUsers();
        setTimeout(() => setAppointSuccess(null), 4000);
      } else {
        setAppointError(data.error || 'Failed to appoint administrator');
      }
    } catch (err: any) {
      setAppointError(err.message || 'Error appointing administrator');
    } finally {
      setIsAppointingAdmin(false);
    }
  };

  const handleRevokeAdministrator = async (targetUserId: string, targetName: string) => {
    if (!confirm(`Are you sure you want to revoke Administrator status from ${targetName}? They will be demoted to Member.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/owner/administrators/${targetUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserActionMsg(`Administrator privileges revoked for ${targetName}. Demoted to Member.`);
        loadUsers();
        setTimeout(() => setUserActionMsg(null), 3500);
      } else {
        alert(data.error || 'Failed to revoke administrator');
      }
    } catch (err: any) {
      alert(err.message || 'Error revoking administrator');
    }
  };

  const filteredUsers = userList.filter(u => 
    (u.name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-4xl h-[90vh] max-h-[720px] bg-[#191a1a] text-[#ededed] border border-[#2d3131] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar Navigation (Perplexity Minimalist Style) */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#2d3131] bg-[#131414] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-[#242828]">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-[#20b8cd]" />
                <span className="text-sm font-semibold text-white tracking-tight">Settings</span>
              </div>
              <button
                type="button"
                onClick={closeSettingsModal}
                className="md:hidden p-1.5 rounded-lg hover:bg-[#202222] text-[#8e918f] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Standard User Tabs */}
            <div className="space-y-1">
              <div className="px-2.5 text-[10px] uppercase font-semibold text-[#858585] tracking-wider mb-1">
                Account & App
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-[#20b8cd]/15 text-[#20b8cd] font-semibold'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>General</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('connectivity')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'connectivity'
                    ? 'bg-[#20b8cd]/15 text-[#20b8cd] font-semibold border border-[#20b8cd]/30'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <PlugZap className="w-3.5 h-3.5" />
                  <span>AI Connectivity</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    connectedExternalEngines.length > 0
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50'
                      : 'bg-[#202222] text-[#858585]'
                  }`}
                >
                  {connectedExternalEngines.length}/{EXTERNAL_ENGINES.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#20b8cd]/15 text-[#20b8cd] font-semibold'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile & Identity</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-[#20b8cd]/15 text-[#20b8cd] font-semibold'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Security & 2FA</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('python')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'python'
                    ? 'bg-[#20b8cd]/15 text-[#20b8cd] font-semibold'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Python Runtime</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'feedback'
                    ? 'bg-[#20b8cd]/15 text-[#20b8cd] font-semibold'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Feedback & Upgrades</span>
              </button>
            </div>

            {/* App Management & Updates: Available to both Administrator and Owner (Edit/Update Permissions) */}
            {isAdmin && (
              <div className="space-y-1.5 pt-3 border-t border-[#242828]">
                <div className="px-2.5 text-[10px] uppercase font-semibold text-[#20b8cd] tracking-wider flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-[#20b8cd]" />
                    <span>App Management</span>
                  </span>
                  <span className="text-[9px] bg-[#20b8cd]/20 text-[#20b8cd] px-1.5 py-0.2 rounded font-mono">
                    {isOwner ? 'ROOT OWNER' : 'ADMIN'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('app_management');
                    loadAppConfig();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'app_management'
                      ? 'bg-[#20b8cd]/15 text-[#20b8cd] font-semibold border border-[#20b8cd]/30'
                      : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-[#20b8cd]" />
                  <span>Edit & Update App</span>
                </button>
              </div>
            )}

            {/* Exclusive Owner-Only Navigation (Strictly root authority) */}
            {isOwner && (
              <div className="space-y-1.5 pt-3 border-t border-[#242828]">
                <div className="px-2.5 text-[10px] uppercase font-semibold text-amber-400/90 tracking-wider flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Owner Console</span>
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">ROOT</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeSettingsModal();
                    openAdminModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-600/50 transition-colors cursor-pointer mb-1 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold">Launch Full Console</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Users & Appoint Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeSettingsModal();
                    openAdminModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9e9e9e] hover:text-white hover:bg-[#202222] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-3.5 h-3.5 text-sky-400" />
                    <span>Device & Sessions</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'system'
                      ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-[#9e9e9e] hover:text-white hover:bg-[#202222]'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span>System & Config</span>
                </button>
              </div>
            )}
          </div>

          {/* User info at bottom of sidebar */}
          <div className="pt-4 border-t border-[#242828] px-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
              <UserAvatar
                avatar={user?.avatar}
                name={user?.name}
                email={user?.email}
                sizeClass="w-8 h-8"
                roundedClass="rounded-full"
                textClass="text-xs"
              />
              <div className="min-w-0 flex-1 text-left">
                <span className="text-sm font-medium text-white block truncate">{user?.name || 'User'}</span>
                <span className="text-xs text-[#858585] capitalize block truncate">{user?.role || 'Viewer'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={closeSettingsModal}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-[#202222] text-[#8e918f] hover:text-white cursor-pointer"
              title="Close Settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-semibold text-white">General &amp; Workspace Preferences</h3>
                <p className="text-xs text-[#9e9e9e] mt-0.5">Select your active workspace AI model, search provider, and editor preferences.</p>
              </div>

              {/* AI Connectivity Summary CTA */}
              <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <PlugZap className="w-4 h-4 text-[#20b8cd]" />
                    <span className="text-xs font-semibold text-white">AI Connectivity Hub (BYOM)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#20b8cd]/10 text-[#20b8cd] border border-[#20b8cd]/30">
                      {connectedExternalEngines.length} External Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-[#858585]">
                    <strong>Turbo AI</strong> is active by default. Connect or disconnect Google Gemini, Perplexity, DeepSeek, Copilot, Groq, or OpenAI with your own API keys.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('connectivity')}
                  className="px-3.5 py-2 rounded-xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#20b8cd]/40 text-xs font-medium text-[#20b8cd] hover:text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <span>Manage AI Connectivity</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active Workspace AI Engine Selector (Turbo AI Default + Connected External Only) */}
              <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-white block">Active Workspace Engine</label>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {1 + connectedExternalEngines.length} Ready (Turbo AI + {connectedExternalEngines.length} External)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getAvailableWorkspaceEngines(connectedExternalEngines).map((engine) => {
                    const isSelected = engine.id === selectedEngine;
                    const isDefault = engine.id === BUILTIN_DEFAULT_ENGINE.id;
                    return (
                      <button
                        key={engine.id}
                        type="button"
                        onClick={() => onSelectEngine(engine.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#20b8cd]/10 border-[#20b8cd]/60 text-white'
                            : 'bg-[#191a1a] border-[#2d3131] hover:border-[#3d4245] text-[#9e9e9e] hover:text-white'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span className="text-xs font-semibold block text-white truncate">{engine.shortName || engine.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#131414] border border-[#2d3131] text-[#9e9e9e] shrink-0">
                              {isDefault ? 'Default' : 'External • User Key'}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#858585] block truncate">{engine.tagline}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#20b8cd] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Grounding Provider */}
              <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-3">
                <label className="text-xs font-semibold text-white block">Real-time Search Provider</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['google', 'bing', 'perplexity', 'duckduckgo'] as SearchEngineType[]).map((se) => (
                    <button
                      key={se}
                      type="button"
                      onClick={() => onSelectSearchEngine(se)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer capitalize text-xs ${
                        preferredSearchEngine === se
                          ? 'bg-[#20b8cd]/15 border-[#20b8cd] text-white font-medium'
                          : 'bg-[#191a1a] border-[#2d3131] hover:border-[#3d4245] text-[#9e9e9e] hover:text-white'
                      }`}
                    >
                      {se}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor Font Size */}
              <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-3">
                <label className="text-xs font-semibold text-white block">Code Editor Font Size</label>
                <div className="flex items-center gap-2">
                  {['12px', '13px', '14px', '15px', '16px'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setEditorFontSize(sz);
                        localStorage.setItem('pycode_font_size', sz);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs cursor-pointer ${
                        editorFontSize === sz
                          ? 'bg-[#20b8cd]/15 border-[#20b8cd] text-white font-semibold'
                          : 'bg-[#191a1a] border-[#2d3131] text-[#9e9e9e] hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI CONNECTIVITY HUB (BYOM) */}
          {activeTab === 'connectivity' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <PlugZap className="w-4 h-4 text-[#20b8cd]" />
                  <span>AI Connectivity Hub (External BYOM)</span>
                </h3>
                <p className="text-xs text-[#9e9e9e] mt-0.5">
                  Manage external Bring-Your-Own-Model API credentials. Every external engine requires verifying your personal API key and never uses server/owner tokens.
                </p>
              </div>

              <AIConnectivityHub compact />
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-semibold text-white">Profile & Identity</h3>
                <p className="text-xs text-[#9e9e9e] mt-0.5">Manage your public persona, greeting name, and Python skill level.</p>
              </div>

              {profileSaveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-4">
                  {/* Avatar Picker */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-2">Display Avatar</label>
                    <div className="flex flex-wrap gap-2">
                      {['🐍', '⚡', '🚀', '🧠', '💻', '🤖', '🔮', '✨', '👑'].map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setAvatar(av)}
                          className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${
                            avatar === av
                              ? 'bg-[#20b8cd]/20 border-[#20b8cd] scale-105'
                              : 'bg-[#191a1a] border-[#2d3131] hover:border-[#3d4245]'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Display Name */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">Preferred Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3.5 py-2.5 bg-[#191a1a] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white outline-none"
                    />
                    <p className="text-[11px] text-[#858585] mt-1">This name is strictly used for all greetings and conversations throughout the application.</p>
                  </div>

                  {/* Registered Email (Read Only) */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">Email Address</label>
                    <input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-[#191a1a]/60 border border-[#2d3131] rounded-xl text-xs text-[#858585] outline-none cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Skill Level */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">Python Experience</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSkillLevel(lvl)}
                          className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                            skillLevel === lvl
                              ? 'bg-[#20b8cd]/15 border-[#20b8cd] text-white'
                              : 'bg-[#191a1a] border-[#2d3131] text-[#9e9e9e] hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#ededed] text-[#131414] font-medium text-xs transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* TAB: SECURITY & 2FA */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-semibold text-white">Security & Two-Step Verification</h3>
                <p className="text-xs text-[#9e9e9e] mt-0.5">Protect your account with optional two-step authentication and session control.</p>
              </div>

              {/* 2FA Toggle Box */}
              <div className="p-5 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${twoFactorActive ? 'text-[#20b8cd]' : 'text-[#858585]'}`} />
                      <span className="text-xs font-semibold text-white">Two-Step Verification (2FA)</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        twoFactorActive
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {twoFactorActive ? 'ACTIVE' : 'OPTIONAL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#858585] max-w-md">
                      Requires a 6-digit verification code whenever signing in on a new device or browser.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggle2FA}
                    disabled={isToggling2FA}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                      twoFactorActive
                        ? 'bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300'
                        : 'bg-[#20b8cd] hover:bg-[#1ba2b5] text-[#131414] font-semibold shadow-sm'
                    }`}
                  >
                    {isToggling2FA ? 'Updating...' : twoFactorActive ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>

                {/* Backup Codes Display when 2FA is newly enabled */}
                {backupCodes.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#191a1a] border border-[#20b8cd]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <KeyRound className="w-3.5 h-3.5 text-[#20b8cd]" />
                        <span>Emergency Backup Codes (Save Securely)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyBackupCodes}
                        className="flex items-center gap-1 text-[11px] text-[#20b8cd] hover:underline cursor-pointer"
                      >
                        {copiedCodes ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCodes ? 'Copied' : 'Copy Codes'}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                      {backupCodes.map((code, idx) => (
                        <div key={idx} className="p-2 bg-[#131414] rounded-lg border border-[#2d3131] text-center text-[#ededed]">
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#858585]">
                      Each backup code can be used once if you cannot access your verification device.
                    </p>
                  </div>
                )}
              </div>

              {/* Active Device Session Management */}
              <div className="p-5 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Multi-Device Session Security</span>
                    <span className="text-[11px] text-[#858585] block font-mono">Current Device ID: {deviceId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to log out all other devices?')) {
                        logoutAllDevices();
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-red-300 text-xs font-medium cursor-pointer transition-all active:scale-95"
                  >
                    Revoke Other Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PYTHON RUNTIME PREFERENCES */}
          {activeTab === 'python' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-semibold text-white">Python Execution Sandbox</h3>
                <p className="text-xs text-[#9e9e9e] mt-0.5">Configure Python 3.10 subprocess behavior and interactive trace views.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-4">
                {/* Auto-run Python toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-[#242828]">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Auto-Execute Python Subprocess</span>
                    <span className="text-[11px] text-[#858585] block">Automatically runs safe Python code in the sandbox to verify output.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRunPython}
                    onChange={(e) => {
                      setAutoRunPython(e.target.checked);
                      localStorage.setItem('pycode_auto_run_py', String(e.target.checked));
                    }}
                    className="w-4 h-4 rounded-sm accent-[#20b8cd] cursor-pointer"
                  />
                </div>

                {/* Show flowchart by default */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Default to Flowchart Tab</span>
                    <span className="text-[11px] text-[#858585] block">Shows AST decision flowchart diagrams automatically for complex logic.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showFlowchartByDefault}
                    onChange={(e) => {
                      setShowFlowchartByDefault(e.target.checked);
                      localStorage.setItem('pycode_show_flowchart', String(e.target.checked));
                    }}
                    className="w-4 h-4 rounded-sm accent-[#20b8cd] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* APP MANAGEMENT & LIVE UPDATES (Owner & Administrators have edit & update permissions) */}
          {activeTab === 'app_management' && isAdmin && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#20b8cd]" />
                    <span>App Management & Live Updates</span>
                  </h3>
                  <p className="text-xs text-[#9e9e9e] mt-0.5">
                    Authorized to edit and update platform branding, broadcast announcements, AI engine defaults, and runtime sandboxes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAppConfig}
                  disabled={isLoadingConfig}
                  className="p-2 rounded-xl bg-[#131414] hover:bg-[#202222] border border-[#2d3131] text-[#9e9e9e] hover:text-white cursor-pointer"
                  title="Refresh app configuration"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConfig ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {configSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{configSuccessMsg}</span>
                </div>
              )}

              {/* App Edit Form */}
              <form onSubmit={handleSaveAppConfig} className="space-y-4">
                {/* 1. App Identity & Branding */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white pb-2 border-b border-[#242828]">
                    <Sliders className="w-3.5 h-3.5 text-[#20b8cd]" />
                    <span>Application Identity & Branding</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-[#858585] block font-medium">App Name / Title</label>
                      <input
                        type="text"
                        value={cfgAppTitle}
                        onChange={(e) => setCfgAppTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191a1a] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white outline-none"
                        placeholder="Pycode"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#858585] block font-medium">App Subtitle / Tagline</label>
                      <input
                        type="text"
                        value={cfgAppSubtitle}
                        onChange={(e) => setCfgAppSubtitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191a1a] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white outline-none"
                        placeholder="Python Theory & Code Intelligence Platform"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Global Live Announcement Banner */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#242828]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                      <span>Live Announcement Banner</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer text-[#858585]">
                      <input
                        type="checkbox"
                        checked={cfgBannerEnabled}
                        onChange={(e) => setCfgBannerEnabled(e.target.checked)}
                        className="w-4 h-4 rounded-sm accent-[#20b8cd] cursor-pointer"
                      />
                      <span className={cfgBannerEnabled ? 'text-white font-medium' : ''}>Active across all sessions</span>
                    </label>
                  </div>
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-xs text-[#858585] block font-medium">Announcement Message</label>
                      <input
                        type="text"
                        value={cfgBannerMessage}
                        onChange={(e) => setCfgBannerMessage(e.target.value)}
                        placeholder="e.g. New Gemini 3.8 Flash analysis engine now live! Try interactive flowcharts."
                        className="w-full px-3 py-2 bg-[#191a1a] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[#858585]">Banner Style:</span>
                      {(['info', 'warning', 'success'] as const).map((t) => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer capitalize">
                          <input
                            type="radio"
                            name="bannerType"
                            value={t}
                            checked={cfgBannerType === t}
                            onChange={() => setCfgBannerType(t)}
                            className="accent-[#20b8cd]"
                          />
                          <span className={cfgBannerType === t ? 'text-white font-medium' : 'text-[#858585]'}>{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. AI Engine & Analysis Mode Defaults */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white pb-2 border-b border-[#242828]">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Default AI Engine & Output Mode</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-[#858585] block font-medium">Default AI Model</label>
                      <select
                        value={cfgDefaultEngine}
                        onChange={(e) => setCfgDefaultEngine(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#191a1a] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white outline-none cursor-pointer"
                      >
                        {AI_ENGINES.map((eng) => (
                          <option key={eng.id} value={eng.id}>
                            {eng.name} ({eng.provider})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#858585] block font-medium">Default Answer Pattern</label>
                      <select
                        value={cfgDefaultMode}
                        onChange={(e) => setCfgDefaultMode(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#191a1a] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="both">Theory + Code (Comprehensive)</option>
                        <option value="code_only">Code (Code & Error Breakdown)</option>
                        <option value="theory_only">Theory (Concept & Visuals)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Runtime Feature Toggles */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white pb-2 border-b border-[#242828]">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Feature Toggles & Runtime Execution</span>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs text-white font-medium block">Python 3.10 Subprocess Sandbox</span>
                        <span className="text-[11px] text-[#858585] block">Enable server-side safe subprocess execution for user code testing</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={cfgSandboxEnabled}
                        onChange={(e) => setCfgSandboxEnabled(e.target.checked)}
                        className="w-4 h-4 rounded-sm accent-[#20b8cd]"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#242828]">
                      <div>
                        <span className="text-xs text-white font-medium block">Interactive AST Decision Flowcharts</span>
                        <span className="text-[11px] text-[#858585] block">Generate interactive visual flow diagrams for algorithm execution</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={cfgFlowchartsEnabled}
                        onChange={(e) => setCfgFlowchartsEnabled(e.target.checked)}
                        className="w-4 h-4 rounded-sm accent-[#20b8cd]"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#242828]">
                      <div>
                        <span className="text-xs text-white font-medium block">Variable Execution Trace Viewer</span>
                        <span className="text-[11px] text-[#858585] block">Step-by-step state tracker showing variable modifications per loop</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={cfgTraceEnabled}
                        onChange={(e) => setCfgTraceEnabled(e.target.checked)}
                        className="w-4 h-4 rounded-sm accent-[#20b8cd]"
                      />
                    </label>
                  </div>
                </div>

                {/* 5. System Cache Maintenance */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">System Cache & Stale Sessions</span>
                    <span className="text-[11px] text-[#858585] block">Purge expired offline session tokens and refresh application state.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    disabled={isClearingCache}
                    className="px-3 py-1.5 rounded-xl bg-[#202222] hover:bg-[#282a2c] border border-[#383c3c] text-xs text-[#ededed] cursor-pointer"
                  >
                    {isClearingCache ? 'Clearing Cache...' : 'Clear System Cache'}
                  </button>
                </div>

                {/* Save Action & Metadata Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-[#858585]">
                    {appConfig?.updatedBy && (
                      <span>
                        Last updated by <strong className="text-white">{appConfig.updatedBy.userName}</strong> ({appConfig.updatedBy.role}) on {new Date(appConfig.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-5 py-2.5 rounded-xl bg-[#20b8cd] hover:bg-[#1ba2b5] text-[#131414] text-xs font-semibold cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingConfig ? 'Publishing Updates...' : 'Publish App Updates'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EXCLUSIVE OWNER TAB: USER MANAGEMENT & APPOINT ADMINISTRATOR (Owner Only) */}
          {activeTab === 'users' && isOwner && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>User Management & Administrator Appointments</span>
                  </h3>
                  <p className="text-xs text-[#9e9e9e] mt-0.5">
                    The Owner possesses supreme root authority. Appoint Administrators to grant them permissions to edit and update the app.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={isLoadingUsers}
                  className="p-2 rounded-xl bg-[#131414] hover:bg-[#202222] border border-[#2d3131] text-[#9e9e9e] hover:text-white cursor-pointer"
                  title="Refresh users"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* CARD: APPOINT ADMINISTRATOR (Owner Exclusive Feature) */}
              <div className="p-5 rounded-2xl bg-[#191a1a] border border-amber-600/40 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>Appoint Administrator</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          App Edit & Update Permissions
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#9e9e9e] mt-0.5">
                        Owner will <strong>always be more powerful than administrators</strong>. Administrators receive access to edit application configuration, update announcements, and modify AI defaults.
                      </p>
                    </div>
                  </div>
                </div>

                {appointSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{appointSuccess}</span>
                  </div>
                )}

                {appointError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{appointError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <UserPlus className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858585]" />
                    <input
                      type="email"
                      value={appointEmail}
                      onChange={(e) => setAppointEmail(e.target.value)}
                      placeholder="Enter user's registered email (e.g. admin@pycode.dev)..."
                      className="w-full pl-9 pr-3.5 py-2 bg-[#131414] border border-[#2d3131] focus:border-amber-400/80 rounded-xl text-xs text-white placeholder-[#5c6166] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAppointAdministrator(appointEmail)}
                    disabled={isAppointingAdmin || !appointEmail.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isAppointingAdmin ? 'Appointing...' : 'Make Administrator'}
                  </button>
                </div>

                {/* Quick list of current administrators */}
                <div className="pt-2 border-t border-[#2d3131] space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#858585] tracking-wider block">
                    Current App Administrators ({userList.filter(u => u.role === 'admin').length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {userList.filter(u => u.role === 'admin').length === 0 ? (
                      <span className="text-xs text-[#858585] italic">No delegated administrators appointed yet.</span>
                    ) : (
                      userList
                        .filter(u => u.role === 'admin')
                        .map(adminUser => (
                          <div 
                            key={`admin-badge-${adminUser.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131414] border border-indigo-700/50 text-xs text-indigo-200"
                          >
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-medium text-white">{adminUser.name}</span>
                            <span className="text-[10px] text-[#858585] font-mono">({adminUser.email})</span>
                            <button
                              type="button"
                              onClick={() => handleRevokeAdministrator(adminUser.id, adminUser.name)}
                              className="ml-1 text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                              title="Revoke administrator role"
                            >
                              Revoke
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {userActionMsg && (
                <div className="p-3 rounded-xl bg-[#202222] border border-[#20b8cd]/40 text-[#20b8cd] text-xs">
                  {userActionMsg}
                </div>
              )}

              {/* User search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858585]" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-9 pr-4 py-2 bg-[#131414] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl text-xs text-white placeholder-[#5c6166] outline-none"
                />
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#858585] bg-[#131414] rounded-2xl border border-[#2d3131]">
                    {isLoadingUsers ? 'Loading registered users...' : 'No users match your search.'}
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === user?.id;
                    const isOwnerAccount = u.role === 'owner';
                    return (
                      <div 
                        key={u.id}
                        className="p-3.5 rounded-2xl bg-[#131414] border border-[#2d3131] hover:border-[#383c3c] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <UserAvatar
                            avatar={u.avatar}
                            name={u.name}
                            email={u.email}
                            sizeClass="w-9 h-9"
                            roundedClass="rounded-full"
                            textClass="text-xs"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold text-white truncate">{u.name || 'User'}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono shrink-0 ${
                                u.role === 'owner' ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40' :
                                u.role === 'admin' ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-600/40' :
                                'bg-[#202222] text-[#9e9e9e]'
                              }`}>
                                {u.role}
                              </span>
                            </div>
                            <span className="text-xs text-[#858585] block truncate font-mono">{u.email}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!isOwnerAccount && (
                            <>
                              {u.role === 'admin' ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAdministrator(u.id, u.name)}
                                  className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-[11px] text-red-300 font-medium cursor-pointer transition-colors"
                                  title="Revoke administrator privileges and demote to member"
                                >
                                  Revoke Admin
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAppointAdministrator(u.id)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/60 text-[11px] text-indigo-200 font-medium cursor-pointer transition-colors flex items-center gap-1"
                                  title="Appoint as administrator with app edit & update permissions"
                                >
                                  <Shield className="w-3 h-3 text-indigo-400" />
                                  <span>Make Admin</span>
                                </button>
                              )}

                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value as any)}
                                className="bg-[#191a1a] border border-[#2d3131] rounded-lg px-2 py-1 text-[11px] text-[#ededed] outline-none cursor-pointer"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                                <option value="viewer">Viewer</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1.5 rounded-lg hover:bg-red-950/50 text-[#858585] hover:text-red-400 cursor-pointer transition-colors"
                                title="Delete user account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {isOwnerAccount && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span>Root Owner</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* EXCLUSIVE OWNER TAB: SYSTEM & CONFIGURATIONS (Owner Only) */}
          {activeTab === 'system' && isOwner && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>System Configuration & Health</span>
                </h3>
                <p className="text-xs text-[#9e9e9e] mt-0.5">Live database statistics, execution limits, and cache controls.</p>
              </div>

              {cacheClearSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Expired cache and stale offline sessions cleared!</span>
                </div>
              )}

              {/* Stats Cards */}
              {systemStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-1">
                    <span className="text-[11px] text-[#858585] block">Total Registered Users</span>
                    <span className="text-xl font-bold text-white font-mono">{systemStats.totalUsers}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-1">
                    <span className="text-[11px] text-[#858585] block">Total Recorded Sessions</span>
                    <span className="text-xl font-bold text-white font-mono">{systemStats.totalSessions}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-1">
                    <span className="text-[11px] text-[#858585] block">Online Active Sessions</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">{systemStats.activeSessions}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-1">
                    <span className="text-[11px] text-[#858585] block">Node Server Uptime</span>
                    <span className="text-xl font-bold text-[#20b8cd] font-mono">{Math.floor(systemStats.uptimeSeconds / 60)}m</span>
                  </div>
                </div>
              )}

              {/* System Operations */}
              <div className="p-5 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Clear Stale Offline Sessions</span>
                    <span className="text-[11px] text-[#858585] block">Removes expired disconnected sessions older than 7 days from storage.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    disabled={isClearingCache}
                    className="px-4 py-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] border border-[#383c3c] text-xs font-medium text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isClearingCache ? 'Clearing...' : 'Clear Stale Cache'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FEEDBACK & UPGRADES */}
          {activeTab === 'feedback' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>Feedback & Feature Requests</span>
                </h3>
                <p className="text-xs text-[#9e9e9e] mt-0.5">Help us optimize Gemini 3.8 Flash, Python diagnostics, and app performance.</p>
              </div>

              {feedbackSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Thank you! Your feedback has been received and helps prioritize upcoming engine upgrades.</span>
                </div>
              )}

              {feedbackError && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{feedbackError}</span>
                </div>
              )}

              <form onSubmit={handleSettingsFeedbackSubmit} className="space-y-5">
                {/* Overall Rating */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-2.5">
                  <label className="text-xs font-semibold text-white block">Overall Experience Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                        title={`${star} stars`}
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= feedbackRating 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-[#383c3c]'
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono text-[#858585] ml-2">
                      {feedbackRating === 5 ? 'Exceptional' : feedbackRating === 4 ? 'Good' : feedbackRating === 3 ? 'Average' : 'Needs Work'}
                    </span>
                  </div>
                </div>

                {/* Engine Speed Category */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-2.5">
                  <label className="text-xs font-semibold text-white block">Gemini 3.8 Flash Speed Rating</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'lightning', label: '⚡ Ultra Fast (0.6s)' },
                      { id: 'good', label: '🚀 Swift (<1.5s)' },
                      { id: 'average', label: '⏱ Moderate' },
                      { id: 'sluggish', label: '⏳ Slow' }
                    ].map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setFeedbackSpeed(sp.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                          feedbackSpeed === sp.id
                            ? 'bg-[#20b8cd]/15 border-[#20b8cd] text-white font-semibold'
                            : 'bg-[#191a1a] border-[#2d3131] hover:border-[#3d4245] text-[#9e9e9e] hover:text-white'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Requested Upgrades */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-2.5">
                  <label className="text-xs font-semibold text-white block">Which features would you like improved most?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Code Editor & Autocomplete',
                      'AI Response Speed (Gemini 3.8 Flash)',
                      'Python Execution Sandbox',
                      'Error Diagnostics & Line Highlighting',
                      'Flowchart & Complexity Analyzer',
                      'Multi-Device Sync',
                      'Dark/Light Theme Customization'
                    ].map((feature) => {
                      const isSelected = feedbackUpgrades.includes(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFeedbackUpgrades(feedbackUpgrades.filter(f => f !== feature));
                            } else {
                              setFeedbackUpgrades([...feedbackUpgrades, feature]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-[#20b8cd]/10 border-[#20b8cd]/60 text-white font-medium'
                              : 'bg-[#191a1a] border-[#2d3131] hover:border-[#3d4245] text-[#9e9e9e]'
                          }`}
                        >
                          <span>{feature}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#20b8cd] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Suggestions and Comments */}
                <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-2">
                  <label className="text-xs font-semibold text-white block">Detailed Suggestions or Feature Requests</label>
                  <textarea
                    rows={3}
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="Tell us what you love or what you'd like to see added..."
                    className="w-full bg-[#191a1a] border border-[#2d3131] focus:border-[#20b8cd] rounded-xl p-3 text-xs text-white placeholder-[#5c6166] outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="px-5 py-2.5 rounded-xl bg-[#20b8cd] hover:bg-[#1ba2b5] text-[#131414] font-semibold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingFeedback ? 'Sending Feedback...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
