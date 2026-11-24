import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Users, 
  ShieldAlert, 
  Clock, 
  RefreshCw, 
  Trash2, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Search, 
  MessageSquare, 
  ShieldCheck, 
  Crown, 
  Zap, 
  Activity, 
  UserCheck, 
  UserX,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Check,
  ExternalLink,
  KeyRound,
  Shield,
  History,
  CheckCircle2,
  XCircle,
  Calendar,
  LogIn,
  Filter,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { UserAvatar } from './UserAvatar';
import {
  BUILTIN_DEFAULT_ENGINE,
  EXTERNAL_ENGINES,
  normalizeExternalEngines
} from '../constants/aiEngines';
import { renderEngineIcon } from './AIEngineIcons';
import { 
  UniqueDeviceRecord, 
  DeviceSessionDetail,
  UserGroupedDevicesRecord,
  UserDeviceRecord,
  UserDetailHistoryResponse
} from '../server/authService';

export interface SafeSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  accountType: 'registered' | 'google' | 'guest';
  createdAt: string;
  lastActivityAt: string;
  logoutAt?: string;
  expiresAt: number;
  deviceId?: string;
  deviceName?: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  entryRoute: string;
  status: 'online' | 'offline' | 'expired';
}

export interface LoginEventRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  accountType: 'registered' | 'google' | 'guest';
  authMethod: string;
  status: 'success' | 'failed';
  failReason?: string;
  timestamp: string;
  deviceId?: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  entryRoute: string;
}

export interface FeedbackRecord {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  performanceRating: number;
  speedCategory: 'lightning' | 'good' | 'average' | 'sluggish';
  accuracyRating?: number;
  upgradeFields: string[];
  addSuggestions: string;
  comments: string;
  submittedAt: string;
}

export interface UserItem {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  skillLevel: string;
  twoFactorEnabled?: boolean;
  connectedExternalEngines?: string[];
  enabledEngines?: string[];
  hasConfiguredEngines?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export const AdminDashboardModal: React.FC = () => {
  const { isAdminModalOpen, closeAdminModal, isAdmin, isOwner, token, user, deviceId } = useAuth();
  const { subscribeToAdminEvents, lastMessage } = useWebSocket();

  const [activeTab, setActiveTab] = useState<'devices' | 'sessions' | 'events' | 'users' | 'feedback'>('devices');
  
  // User Grouped Devices & Detailed Login History View states
  const [userGroupedDevices, setUserGroupedDevices] = useState<UserGroupedDevicesRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState<UserDetailHistoryResponse | null>(null);
  const [loadingUserHistory, setLoadingUserHistory] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  const [sessionFilter, setSessionFilter] = useState<'all' | 'non-owner' | 'owner-only'>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const [uniqueDevices, setUniqueDevices] = useState<UniqueDeviceRecord[]>([]);
  const [sessions, setSessions] = useState<SafeSession[]>([]);
  const [events, setEvents] = useState<LoginEventRecord[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [overview, setOverview] = useState<{
    totalRegisteredUsers: number;
    activeAuthenticatedUsers: number;
    activeGuestSessions: number;
    activeAdministrators: number;
    activeOwnerSessions: number;
    totalActiveSessions: number;
  }>({
    totalRegisteredUsers: 0,
    activeAuthenticatedUsers: 0,
    activeGuestSessions: 0,
    activeAdministrators: 0,
    activeOwnerSessions: 0,
    totalActiveSessions: 0
  });

  const fetchData = async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    try {
      const getJson = async (res: Response) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? await res.json() : null;
      };

      // 1. Overview
      const ovRes = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ovData = await getJson(ovRes);
      if (ovData) {
        setOverview({
          totalRegisteredUsers: ovData.totalRegisteredUsers || 0,
          activeAuthenticatedUsers: ovData.activeAuthenticatedUsers || 0,
          activeGuestSessions: ovData.activeGuestSessions || 0,
          activeAdministrators: ovData.activeAdministrators || 0,
          activeOwnerSessions: ovData.activeOwnerSessions || 0,
          totalActiveSessions: ovData.totalActiveSessions || 0
        });
        if (ovData.recentEvents) {
          setEvents(ovData.recentEvents);
        }
      }

      // 2. Connected Devices Grouped by User (NO Duplicates, Deduplicated devices)
      const userDevRes = await fetch('/api/owner/user-devices', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-device-id': deviceId || ''
        }
      });
      const userDevData = await getJson(userDevRes);
      if (userDevData?.userDevices && Array.isArray(userDevData.userDevices)) {
        setUserGroupedDevices(userDevData.userDevices);
      }

      // 3. Unique physical devices (for backward-compatibility and overview)
      const devRes = await fetch('/api/owner/devices', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-device-id': deviceId || ''
        }
      });
      const devData = await getJson(devRes);
      if (devData?.devices) {
        setUniqueDevices(devData.devices);
      }

      // 4. Raw Sessions
      const sessRes = await fetch('/api/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sessData = await getJson(sessRes);
      if (sessData && Array.isArray(sessData.sessions)) {
        setSessions(sessData.sessions);
      }

      // 5. Users List
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await getJson(usersRes);
      if (usersData && Array.isArray(usersData.users)) {
        setUsersList(usersData.users);
      }

      // 6. Feedback
      const fbRes = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fbData = await getJson(fbRes);
      if (fbData && Array.isArray(fbData.feedbacks)) {
        setFeedbackList(fbData.feedbacks);
      }

      // If viewing a user's detailed history, refresh their records as well
      if (selectedUserId) {
        fetchUserHistory(selectedUserId);
      }
    } catch (err) {
      console.warn('Dashboard fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (targetUserIdOrEmail: string) => {
    if (!token) return;
    setLoadingUserHistory(true);
    try {
      const res = await fetch(`/api/owner/user-history/${encodeURIComponent(targetUserIdOrEmail)}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-device-id': deviceId || ''
        }
      });
      if (res.ok) {
        const data: UserDetailHistoryResponse = await res.json();
        setSelectedUserHistory(data);
      }
    } catch (err) {
      console.warn('Failed to load user history:', err);
    } finally {
      setLoadingUserHistory(false);
    }
  };

  const handleSelectUser = (targetUserIdOrEmail: string) => {
    setSelectedUserId(targetUserIdOrEmail);
    fetchUserHistory(targetUserIdOrEmail);
  };

  const handleBackFromUserDetail = () => {
    setSelectedUserId(null);
    setSelectedUserHistory(null);
    setHistorySearch('');
    setHistoryStatusFilter('all');
  };

  useEffect(() => {
    if (isAdminModalOpen) {
      subscribeToAdminEvents();
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    } else {
      setSelectedUserId(null);
      setSelectedUserHistory(null);
    }
  }, [isAdminModalOpen, subscribeToAdminEvents]);

  // Real-time instant data sync on admin WebSocket events
  useEffect(() => {
    if (isAdminModalOpen && lastMessage?.type === 'admin:event') {
      fetchData();
    }
  }, [lastMessage, isAdminModalOpen]);

  // Escape closes detail drawer cleanly
  useEffect(() => {
    if (!isAdminModalOpen || !selectedUserId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackFromUserDetail();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAdminModalOpen, selectedUserId]);


  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage('Session disconnected successfully');
        fetchData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch {
      setActionMessage('Failed to disconnect session');
    }
  };

  const handleRevokeDevice = async (
    targetDeviceId: string, 
    targetUserId?: string, 
    targetDeviceName?: string,
    targetDeviceKey?: string
  ) => {
    const label = targetDeviceName ? `"${targetDeviceName}"` : 'this device';
    if (!confirm(`Are you sure you want to remove ${label} and disconnect all its sessions?`)) {
      return;
    }
    try {
      const params = new URLSearchParams();
      if (targetUserId) params.set('userId', targetUserId);
      if (targetDeviceKey) params.set('deviceKey', targetDeviceKey);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const url = `/api/owner/devices/${encodeURIComponent(targetDeviceId)}${qs}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage(`Device ${label} successfully removed`);
        // Optimistic UI update: immediately remove from local state
        setUserGroupedDevices(prev => prev.map(u => {
          if (targetUserId && u.userId !== targetUserId) return u;
          return {
            ...u,
            devices: u.devices.filter(d => 
              d.deviceId !== targetDeviceId && 
              (d as any).deviceKey !== targetDeviceId &&
              (!targetDeviceKey || ((d as any).deviceKey !== targetDeviceKey && d.deviceId !== targetDeviceKey))
            )
          };
        }));
        if (selectedUserId) {
          fetchUserHistory(selectedUserId);
        }
        fetchData();
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionMessage(data.error || 'Failed to remove device');
      }
    } catch {
      setActionMessage('Failed to disconnect device');
    }
  };

  const handleRevokeUserSessions = async (targetUserId: string, targetUserName: string) => {
    if (!confirm(`Are you sure you want to disconnect all active sessions for ${targetUserName}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/owner/users/${encodeURIComponent(targetUserId)}/sessions`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage(`Disconnected all sessions for ${targetUserName}`);
        fetchData();
        if (selectedUserId) {
          fetchUserHistory(selectedUserId);
        }
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setActionMessage('Failed to disconnect user sessions');
      }
    } catch {
      setActionMessage('Failed to disconnect user sessions');
    }
  };

  const handleMakeAdministrator = async (targetUserId: string, targetName: string) => {
    try {
      const res = await fetch('/api/owner/administrators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: targetUserId })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Appointed ${targetName} as Administrator with app editing permissions!`);
        fetchData();
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        alert(data.error || 'Failed to appoint administrator');
      }
    } catch (err: any) {
      alert(err.message || 'Error appointing administrator');
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
        setActionMessage(`Revoked Administrator privileges for ${targetName}. Demoted to Member.`);
        fetchData();
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        alert(data.error || 'Failed to revoke administrator');
      }
    } catch (err: any) {
      alert(err.message || 'Error revoking administrator');
    }
  };

  const renderDeviceIcon = (deviceType: 'desktop' | 'tablet' | 'mobile', className = 'w-4 h-4') => {
    if (deviceType === 'mobile') return <Smartphone className={className} />;
    if (deviceType === 'tablet') return <Tablet className={className} />;
    return <Laptop className={className} />;
  };

  const formatExactTimestamp = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  // Map of userId -> UserGroupedDevicesRecord for rapid lookup in Users & Roles
  const userGroupedMap = useMemo(() => {
    const map = new Map<string, UserGroupedDevicesRecord>();
    for (const ug of userGroupedDevices) {
      map.set(ug.userId, ug);
      if (ug.userEmail) {
        map.set(ug.userEmail.toLowerCase().trim(), ug);
      }
    }
    return map;
  }, [userGroupedDevices]);

  // Total deduplicated devices across all users
  const totalDeduplicatedDevices = useMemo(() => {
    return userGroupedDevices.reduce((sum, u) => sum + (u.devices?.length || 0), 0);
  }, [userGroupedDevices]);

  // Filtered User Grouped Devices
  const filteredUserDevices = useMemo(() => {
    if (!search.trim()) return userGroupedDevices;
    const q = search.toLowerCase().trim();
    return userGroupedDevices.filter(u => 
      u.userName.toLowerCase().includes(q) ||
      u.userEmail.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.devices.some(d => 
        d.deviceName.toLowerCase().includes(q) ||
        d.os.toLowerCase().includes(q) ||
        d.browser.toLowerCase().includes(q)
      )
    );
  }, [userGroupedDevices, search]);

  // External BYOM engine adoption count across registered users
  const engineAdoptionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const eng of EXTERNAL_ENGINES) {
      counts[eng.id] = 0;
    }
    for (const u of usersList) {
      const connected = normalizeExternalEngines(u.connectedExternalEngines || u.enabledEngines);
      for (const engId of connected) {
        if (counts[engId] !== undefined) {
          counts[engId]++;
        }
      }
    }
    return counts;
  }, [usersList]);

  // Filtered History for User Detail View
  const filteredUserHistoryLogs = useMemo(() => {
    if (!selectedUserHistory?.loginHistory) return [];
    return selectedUserHistory.loginHistory.filter(evt => {
      if (historyStatusFilter === 'success' && evt.status !== 'success') return false;
      if (historyStatusFilter === 'failed' && evt.status !== 'failed') return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const matchAuth = (evt.authMethod || '').toLowerCase().includes(q);
        const matchRoute = (evt.entryRoute || '').toLowerCase().includes(q);
        const matchOs = (evt.os || '').toLowerCase().includes(q);
        const matchBrowser = (evt.browser || '').toLowerCase().includes(q);
        const matchReason = (evt.failReason || '').toLowerCase().includes(q);
        return matchAuth || matchRoute || matchOs || matchBrowser || matchReason;
      }
      return true;
    });
  }, [selectedUserHistory, historyStatusFilter, historySearch]);

  if (!isAdminModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-5xl h-[92vh] max-h-[820px] bg-[#191a1a] text-[#ededed] border border-[#2d3131] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#2d3131] bg-[#131414] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-tight truncate">Owner Control Center</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-700/50 font-semibold shrink-0">
                  {isOwner ? 'PREDEFINED OWNER' : 'ADMINISTRATOR'}
                </span>
              </div>
              <p className="text-xs text-[#858585] truncate">
                Real-time user device grouping, complete login history audit, and RBAC security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] border border-[#383c3c] text-[#9e9e9e] hover:text-white transition-all cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={closeAdminModal}
              className="p-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] border border-[#383c3c] text-[#9e9e9e] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 py-3 border-b border-[#242828] bg-[#131414]/50 shrink-0 text-xs">
          <div className="p-2.5 rounded-xl bg-[#191a1a] border border-[#2d3131]">
            <span className="text-[10px] text-[#858585] uppercase tracking-wider block">Connected Devices</span>
            <span className="text-lg font-bold text-white font-mono flex items-center gap-1.5">
              <span>{totalDeduplicatedDevices || uniqueDevices.length}</span>
              <span className="text-[11px] text-[#858585] font-normal">({userGroupedDevices.length} Users)</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#191a1a] border border-[#2d3131]">
            <span className="text-[10px] text-[#858585] uppercase tracking-wider block">Online Sessions</span>
            <span className="text-lg font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{overview.totalActiveSessions}</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#191a1a] border border-[#2d3131]">
            <span className="text-[10px] text-[#858585] uppercase tracking-wider block">Registered Users</span>
            <span className="text-lg font-bold text-[#20b8cd] font-mono">{overview.totalRegisteredUsers}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#191a1a] border border-[#2d3131]">
            <span className="text-[10px] text-[#858585] uppercase tracking-wider block">Owner Sessions</span>
            <span className="text-lg font-bold text-amber-300 font-mono">{overview.activeOwnerSessions}</span>
          </div>
        </div>

        {/* Action message alert */}
        {actionMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-[#202222] border border-[#20b8cd]/40 text-[#20b8cd] text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Main Tabs Navigation */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-[#2d3131] bg-[#191a1a] shrink-0 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('devices'); handleBackFromUserDetail(); }}
              className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'devices'
                  ? 'border-[#20b8cd] text-white font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#ededed]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-[#20b8cd]" />
              <span>Connected Devices ({userGroupedDevices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('sessions'); handleBackFromUserDetail(); }}
              className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'sessions'
                  ? 'border-[#20b8cd] text-white font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#ededed]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>All Sessions</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('events'); handleBackFromUserDetail(); }}
              className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'events'
                  ? 'border-[#20b8cd] text-white font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#ededed]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Audit Logs</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('users'); handleBackFromUserDetail(); }}
              className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-[#20b8cd] text-white font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#ededed]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Users & Roles ({usersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('feedback'); handleBackFromUserDetail(); }}
              className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'feedback'
                  ? 'border-[#20b8cd] text-white font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#ededed]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Feedback ({feedbackList.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative pb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#858585]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users / devices..."
              className="pl-8 pr-3 py-1.5 bg-[#131414] border border-[#2d3131] rounded-xl text-xs text-white placeholder-[#5c6166] outline-none w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: CONNECTED DEVICES GROUPED BY USER (CLEAN UNIFORM SUMMARY CARDS) */}
              {activeTab === 'devices' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#858585]">
                    <div>
                      <span className="text-white font-semibold">Connected user accounts.</span>
                      <span className="ml-1">Click any user card to inspect their complete device history, individual device sessions, and revoke actions.</span>
                    </div>
                    <span className="font-mono text-white shrink-0">
                      {filteredUserDevices.length} Users ({totalDeduplicatedDevices} Distinct Devices)
                    </span>
                  </div>

                  {filteredUserDevices.length === 0 ? (
                    <div className="p-12 text-center text-xs text-[#858585] bg-[#131414] rounded-2xl border border-[#2d3131]">
                      No users match the search criteria.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                      {filteredUserDevices.map((u, uIdx) => {
                        const isUserOnline = u.status === 'online';
                        const isOwnerUser = u.role === 'owner';
                        const isAdminUser = u.role === 'admin';

                        return (
                          <button
                            key={`user-group-${u.userId || u.userEmail}-${uIdx}`}
                            type="button"
                            onClick={() => handleSelectUser(u.userId)}
                            className="w-full h-full text-left p-4 rounded-2xl bg-[#131414] border border-[#2d3131] hover:border-[#20b8cd]/60 hover:bg-[#161717] transition-all cursor-pointer group shadow-sm flex flex-col justify-between gap-3.5"
                          >
                            {/* User Header: Avatar, Username, Role Badge, Email & Status Badge */}
                            <div className="flex items-start justify-between gap-3 w-full">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="relative shrink-0">
                                  <UserAvatar
                                    avatar={u.avatar}
                                    name={u.userName}
                                    email={u.userEmail}
                                    sizeClass="w-10 h-10"
                                    roundedClass="rounded-full"
                                    textClass="text-xs"
                                    className="border border-[#2d3131]"
                                  />
                                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#131414] ${
                                    isUserOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                                  }`} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-semibold text-white group-hover:text-[#20b8cd] transition-colors truncate">
                                      {u.userName}
                                    </span>

                                    {isOwnerUser && (
                                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono bg-amber-950/80 text-amber-300 border border-amber-600/40 font-semibold shrink-0">
                                        <Crown className="w-2.5 h-2.5 text-amber-400" />
                                        <span>OWNER</span>
                                      </span>
                                    )}

                                    {isAdminUser && (
                                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-600/40 font-semibold shrink-0">
                                        <Shield className="w-2.5 h-2.5 text-indigo-400" />
                                        <span>ADMIN</span>
                                      </span>
                                    )}

                                    {!isOwnerUser && !isAdminUser && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[#202222] text-[#9e9e9e] uppercase shrink-0">
                                        {u.role}
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs text-[#858585] font-mono truncate mt-0.5">
                                    {u.userEmail}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  isUserOnline
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isUserOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                                  <span className="capitalize">{u.status}</span>
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#858585] group-hover:text-[#20b8cd] group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>

                            {/* Compact Summary Pills: Total Logins, Distinct Devices, Active Sessions */}
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono pt-1 border-t border-[#202224] w-full">
                              <span className="px-2 py-1 rounded-lg bg-[#202222] text-[#20b8cd] border border-[#20b8cd]/30 font-semibold">
                                Total Logins: {u.totalLoginsCount}
                              </span>
                              <span className="px-2 py-1 rounded-lg bg-[#202222] text-zinc-300 border border-[#2d3131]">
                                {u.devices.length} Distinct Device{u.devices.length === 1 ? '' : 's'}
                              </span>
                              <span className={`px-2 py-1 rounded-lg border ${
                                u.activeSessionsCount > 0
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                                  : 'bg-[#1a1b1c] text-zinc-500 border-[#282a2c]'
                              }`}>
                                {u.activeSessionsCount} Active Session{u.activeSessionsCount === 1 ? '' : 's'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RAW SESSIONS LIST */}
              {activeTab === 'sessions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {(['all', 'non-owner', 'owner-only'] as const).map((flt, fltIdx) => (
                        <button
                          key={`filter-${flt}-${fltIdx}`}
                          type="button"
                          onClick={() => setSessionFilter(flt)}
                          className={`px-3 py-1.5 rounded-xl border text-xs capitalize cursor-pointer ${
                            sessionFilter === flt
                              ? 'bg-[#20b8cd]/15 border-[#20b8cd] text-white font-medium'
                              : 'bg-[#131414] border-[#2d3131] text-[#858585] hover:text-white'
                          }`}
                        >
                          {flt === 'non-owner' ? 'Apart From Owner' : flt}
                        </button>
                      ))}
                    </div>
                    <span className="text-[#858585] font-mono">{sessions.length} Active Records</span>
                  </div>

                  <div className="space-y-2">
                    {sessions
                      .filter(s => {
                        const isOwnerMail = (s.userEmail || '').toLowerCase() === (user?.email || '').toLowerCase();
                        if (sessionFilter === 'non-owner') return !isOwnerMail;
                        if (sessionFilter === 'owner-only') return isOwnerMail;
                        return true;
                      })
                      .map((s, idx) => (
                        <div 
                          key={`raw-session-${s.id || s.deviceId || 'sess'}-${idx}`}
                          className="p-3.5 rounded-2xl bg-[#131414] border border-[#2d3131] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-[#202222] flex items-center justify-center text-[#858585] shrink-0">
                              {renderDeviceIcon(s.deviceType)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-semibold text-white truncate">{s.userName || 'Anonymous'}</span>
                                <span className="text-xs text-[#858585] font-mono truncate">{s.userEmail}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#202222] text-[#9e9e9e] capitalize shrink-0">{s.role}</span>
                              </div>
                              <span className="text-xs text-[#858585] font-mono block truncate">
                                {s.os} • {s.browser} • Last active {new Date(s.lastActivityAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono capitalize ${
                              s.status === 'online' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {s.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(s.id)}
                              className="p-1.5 rounded-lg hover:bg-red-950/50 text-[#858585] hover:text-red-400 cursor-pointer"
                              title="Revoke session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIT LOGS */}
              {activeTab === 'events' && (
                <div className="space-y-2">
                  {events.map((evt, idx) => (
                    <div key={`event-${evt.id || evt.timestamp || 'evt'}-${idx}`} className="p-3 rounded-xl bg-[#131414] border border-[#2d3131] flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${evt.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <div className="flex items-center gap-2 min-w-0 truncate">
                          <span className="text-sm font-medium text-white truncate">{evt.name}</span>
                          <span className="text-xs text-[#858585] font-mono truncate">{evt.email}</span>
                          <span className="text-xs text-[#858585] shrink-0">via {evt.authMethod}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#858585] shrink-0">{formatExactTimestamp(evt.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: USERS & ROLES HIERARCHY (WITH DIRECT CLICK TO DETAILED LOGIN HISTORY) */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Hierarchy Info Box */}
                  <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Authority Hierarchy & Permissions</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[#9e9e9e]">
                      <div className="p-2.5 rounded-xl bg-[#191a1a] border border-amber-600/30 space-y-1">
                        <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" />
                          <span>Platform Owner (Root Authority)</span>
                        </span>
                        <p className="text-[#858585]">
                          Supreme authority. Only the Owner can appoint or revoke Administrators, delete accounts, and inspect physical devices. Cannot be modified or demoted.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#191a1a] border border-indigo-700/40 space-y-1">
                        <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" />
                          <span>App Administrator (Delegated Editor)</span>
                        </span>
                        <p className="text-[#858585]">
                          Appointed exclusively by the Owner. Authorized to edit and update the app (branding, announcements, AI defaults, sandbox toggles, and cache).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Engine Adoption & BYOM Token Routing Summary */}
                  <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <Cpu className="w-4 h-4 text-[#20b8cd]" />
                        <span>Turbo AI Default &amp; External BYOM Adoption</span>
                      </div>
                      <span className="text-[11px] text-[#858585] font-mono">
                        {usersList.length} Users Monitored
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-[#191a1a] border border-emerald-800/40 flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-[#131414] border border-[#2d3131] flex items-center justify-center shrink-0">
                            {renderEngineIcon(BUILTIN_DEFAULT_ENGINE.iconType, 'w-3.5 h-3.5')}
                          </div>
                          <span className="text-[11px] font-medium text-white truncate">
                            {BUILTIN_DEFAULT_ENGINE.shortName} (Default)
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                          {usersList.length}
                        </span>
                      </div>

                      {EXTERNAL_ENGINES.map((eng) => {
                        const count = engineAdoptionStats[eng.id] || 0;
                        return (
                          <div
                            key={`adopt-${eng.id}`}
                            className="p-2.5 rounded-xl bg-[#191a1a] border border-[#282a2c] flex items-center justify-between gap-2 min-w-0"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-[#131414] border border-[#2d3131] flex items-center justify-center shrink-0">
                                {renderEngineIcon(eng.iconType, 'w-3.5 h-3.5')}
                              </div>
                              <span className="text-[11px] font-medium text-white truncate">
                                {eng.shortName || eng.name}
                              </span>
                            </div>
                            <span className={`text-xs font-mono font-bold shrink-0 ${count > 0 ? 'text-sky-400' : 'text-zinc-500'}`}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Users list with deduplicated device counts, connected BYOM engines, total logins, and history view action */}
                  <div className="space-y-2">
                    {usersList
                      .filter(u => 
                        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(search.toLowerCase())
                      )
                      .map((u, idx) => {
                        const isOwnerAccount = u.role === 'owner';
                        const isAdminAccount = u.role === 'admin';
                        const grouped = userGroupedMap.get(u.id) || userGroupedMap.get(u.email.toLowerCase().trim());
                        const deviceCount = grouped?.devices?.length || 1;
                        const totalLogins = grouped?.totalLoginsCount || 1;
                        const isOnline = grouped?.status === 'online';
                        const userExternalEngines = normalizeExternalEngines(u.connectedExternalEngines || u.enabledEngines);

                        return (
                          <div 
                            key={`user-item-${u.id || idx}`}
                            className="p-3.5 rounded-2xl bg-[#131414] border border-[#2d3131] hover:border-[#383c3c] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative shrink-0">
                                <UserAvatar
                                  avatar={u.avatar}
                                  name={u.name}
                                  email={u.email}
                                  sizeClass="w-9 h-9"
                                  roundedClass="rounded-full"
                                  textClass="text-xs"
                                  className="border border-[#2d3131]"
                                />
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#131414] ${
                                  isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                                }`} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <span className="text-sm font-semibold text-white truncate max-w-full">{u.name || 'User'}</span>
                                  
                                  {isOwnerAccount && (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono bg-amber-950/80 text-amber-300 border border-amber-600/40 font-semibold shrink-0">
                                      <Crown className="w-3 h-3 text-amber-400" />
                                      <span>ROOT OWNER</span>
                                    </span>
                                  )}

                                  {isAdminAccount && (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-600/40 font-semibold shrink-0">
                                      <Shield className="w-3 h-3 text-indigo-400" />
                                      <span>ADMINISTRATOR (APP EDITOR)</span>
                                    </span>
                                  )}

                                  {!isOwnerAccount && !isAdminAccount && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-[#202222] text-[#9e9e9e] capitalize shrink-0">
                                      {u.role}
                                    </span>
                                  )}

                                  {u.twoFactorEnabled && (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 shrink-0">
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                      <span>2FA ON</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-x-2 text-xs text-[#858585] mt-1 font-mono min-w-0">
                                  <span className="truncate">{u.email}</span>
                                  <span className="shrink-0">•</span>
                                  <span className="text-[#20b8cd] font-semibold shrink-0">{totalLogins} Total Logins</span>
                                  <span className="shrink-0">•</span>
                                  <span className="shrink-0">{deviceCount} Device{deviceCount === 1 ? '' : 's'}</span>
                                  <span className="hidden sm:inline shrink-0">•</span>
                                  <span className="hidden sm:inline shrink-0">Since {new Date(u.createdAt).toLocaleDateString()}</span>
                                </div>

                                {/* Per-user Built-In & Connected External BYOM Engines */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  <span className="text-[10px] font-mono text-[#858585]">
                                    BYOM ({userExternalEngines.length}/{EXTERNAL_ENGINES.length}):
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#191a1a] border border-emerald-800/40 text-[10px] text-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    {renderEngineIcon(BUILTIN_DEFAULT_ENGINE.iconType, 'w-3 h-3')}
                                    <span>{BUILTIN_DEFAULT_ENGINE.shortName}</span>
                                  </span>
                                  {userExternalEngines.map((engId) => {
                                    const engInfo = EXTERNAL_ENGINES.find((e) => e.id === engId);
                                    if (!engInfo) return null;
                                    return (
                                      <span
                                        key={`usr-eng-${u.id}-${engId}`}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#191a1a] border border-sky-800/40 text-[10px] text-sky-200"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                        {renderEngineIcon(engInfo.iconType, 'w-3 h-3')}
                                        <span className="truncate max-w-[110px]">{engInfo.shortName || engInfo.name}</span>
                                      </span>
                                    );
                                  })}
                                  {userExternalEngines.length === 0 && (
                                    <span className="text-[10px] text-[#5c6166] font-mono">
                                      0 External
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions Column */}
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              {/* View Login History Action Button */}
                              <button
                                type="button"
                                onClick={() => handleSelectUser(u.id)}
                                className="px-3 py-1.5 rounded-xl bg-[#202222] hover:bg-[#282a2c] hover:border-[#20b8cd]/60 border border-[#383c3c] text-[#ededed] hover:text-[#20b8cd] text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5"
                                title="Inspect complete login history and device audit"
                              >
                                <History className="w-3.5 h-3.5 text-[#20b8cd]" />
                                <span>Login History ({totalLogins})</span>
                              </button>

                              {isOwner && !isOwnerAccount && (
                                <>
                                  {isAdminAccount ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeAdministrator(u.id, u.name)}
                                      className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium cursor-pointer transition-all active:scale-95"
                                      title="Revoke administrator privileges and demote to member"
                                    >
                                      Revoke Admin
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleMakeAdministrator(u.id, u.name)}
                                      className="px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 text-xs font-medium cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                      title="Make administrator with app editing & updating permissions"
                                    >
                                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                      <span>Make Admin</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {isOwnerAccount && (
                                <span className="text-[11px] text-amber-400/90 font-medium px-2 py-1">Supreme Root</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 5: FEEDBACK */}
              {activeTab === 'feedback' && (
                <div className="space-y-3">
                  {feedbackList.map((fb, idx) => (
                    <div key={`feedback-${fb.id || fb.submittedAt || 'fb'}-${idx}`} className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{fb.userName} ({fb.userEmail || 'Anonymous'})</span>
                        <span className="text-[10px] text-[#858585] font-mono">{new Date(fb.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#858585]">
                        <span>Performance: <strong className="text-amber-400">{'★'.repeat(fb.performanceRating)}</strong></span>
                        <span>Speed: <strong className="text-white capitalize">{fb.speedCategory}</strong></span>
                      </div>
                      {fb.upgradeFields.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {fb.upgradeFields.map((f, i) => (
                            <span key={`upgrade-${fb.id || idx}-${i}-${f}`} className="px-2 py-0.5 rounded-md bg-[#202222] text-[#20b8cd] text-[10px]">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                      {fb.comments && <p className="text-[#ededed] italic bg-[#191a1a] p-2.5 rounded-xl border border-[#242828]">{fb.comments}</p>}
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>

      {/* SLIDE-OVER USER DEVICE HISTORY & SESSION AUDIT DRAWER */}
      {selectedUserId && (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={handleBackFromUserDetail}
        >
          <div
            className="w-full max-w-3xl h-full bg-[#161718] text-[#ededed] border-l border-[#2d3131] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-[#2d3131] bg-[#131414] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleBackFromUserDetail}
                  className="p-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] text-[#858585] hover:text-white transition-colors cursor-pointer"
                  title="Close drawer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-semibold text-white tracking-tight truncate">
                      {selectedUserHistory?.user?.name || 'User Device History'}
                    </h3>
                    {selectedUserHistory?.status && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                        selectedUserHistory.status === 'online'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedUserHistory.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                        <span className="capitalize">{selectedUserHistory.status}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#20b8cd] font-mono truncate">
                    {selectedUserHistory?.user?.email || selectedUserId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => selectedUserId && fetchUserHistory(selectedUserId)}
                  disabled={loadingUserHistory}
                  className="p-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] text-[#858585] hover:text-white transition-colors cursor-pointer text-xs"
                  title="Refresh device history"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUserHistory ? 'animate-spin' : ''}`} />
                </button>

                {selectedUserHistory?.activeSessionsCount && selectedUserHistory.activeSessionsCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleRevokeUserSessions(selectedUserId, selectedUserHistory?.user?.name || 'User')}
                    className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium cursor-pointer transition-all active:scale-95"
                  >
                    Disconnect All ({selectedUserHistory.activeSessionsCount})
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleBackFromUserDetail}
                  className="p-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] text-[#858585] hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {loadingUserHistory && !selectedUserHistory ? (
                <div className="p-12 text-center text-xs text-[#858585] flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#20b8cd]" />
                  <span>Loading complete device history and sessions...</span>
                </div>
              ) : selectedUserHistory ? (
                <>
                  {/* User Profile Summary Card */}
                  <div className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 w-full">
                      <div className="relative shrink-0">
                        <UserAvatar
                          avatar={selectedUserHistory.user.avatar}
                          name={selectedUserHistory.user.name}
                          email={selectedUserHistory.user.email}
                          sizeClass="w-11 h-11"
                          roundedClass="rounded-full"
                          textClass="text-sm"
                          className="border border-[#2d3131]"
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#131414] ${
                          selectedUserHistory.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-600'
                        }`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-white truncate">
                            {selectedUserHistory.user.name || 'User'}
                          </span>
                          {selectedUserHistory.user.role === 'owner' && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono bg-amber-950/80 text-amber-300 border border-amber-600/40 font-semibold shrink-0">
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>OWNER</span>
                            </span>
                          )}
                          {selectedUserHistory.user.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-600/40 font-semibold shrink-0">
                              <Shield className="w-3 h-3 text-indigo-400" />
                              <span>ADMIN</span>
                            </span>
                          )}
                          {selectedUserHistory.user.role !== 'owner' && selectedUserHistory.user.role !== 'admin' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-[#202222] text-[#9e9e9e] uppercase shrink-0">
                              {selectedUserHistory.user.role}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#858585] mt-1 font-mono min-w-0">
                          <span className="truncate">{selectedUserHistory.user.email}</span>
                          <span>•</span>
                          <span className="text-zinc-400 font-sans capitalize">
                            {selectedUserHistory.user.accountType || 'Registered'}
                          </span>
                          <span>•</span>
                          <span className="font-sans">
                            {selectedUserHistory.user.twoFactorEnabled ? (
                              <span className="text-emerald-400 inline-flex items-center gap-1 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>2FA Active</span>
                              </span>
                            ) : (
                              <span className="text-zinc-500">2FA Off</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-[11px] text-[#858585] font-mono shrink-0 space-y-1">
                      <div>Created: {formatExactTimestamp(selectedUserHistory.user.createdAt)}</div>
                      <div className="text-zinc-400">Last Login: {formatExactTimestamp(selectedUserHistory.user.lastLoginAt)}</div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-[#20b8cd]/15 via-[#191a1a] to-[#131414] border border-[#20b8cd]/50 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-[#20b8cd] mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Logins</span>
                        <LogIn className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl font-black text-white font-mono">
                        {selectedUserHistory.totalLoginCount}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#131414] border border-emerald-800/40">
                      <div className="flex items-center justify-between text-emerald-400 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Successful</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl font-bold text-emerald-400 font-mono">
                        {selectedUserHistory.successfulLoginsCount}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#131414] border border-rose-800/30">
                      <div className="flex items-center justify-between text-rose-400 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Failed</span>
                        <XCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl font-bold text-rose-400 font-mono">
                        {selectedUserHistory.failedLoginsCount}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#131414] border border-[#2d3131]">
                      <div className="flex items-center justify-between text-[#20b8cd] mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Devices</span>
                        <Laptop className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl font-bold text-white font-mono">
                        {selectedUserHistory.devices.length}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#131414] border border-[#2d3131]">
                      <div className="flex items-center justify-between text-amber-400 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Active</span>
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl font-bold text-amber-300 font-mono flex items-center gap-1.5">
                        {selectedUserHistory.activeSessionsCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        <span>{selectedUserHistory.activeSessionsCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Complete Device History & Individual Device Sessions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <Laptop className="w-4 h-4 text-[#20b8cd]" />
                        <span>Device History & Individual Sessions ({selectedUserHistory.devices.length} Distinct Devices)</span>
                      </div>
                    </div>

                    {selectedUserHistory.devices.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#858585] bg-[#131414] rounded-2xl border border-[#2d3131]">
                        No hardware devices recorded for this user.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUserHistory.devices.map((d, dIdx) => {
                          const isDevOnline = d.status === 'online';
                          const isCur = d.isCurrentDevice || d.deviceId === deviceId;
                          const sortedSessions = [...(d.sessions || [])].sort(
                            (a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime()
                          );

                          return (
                            <div
                              key={`drawer-dev-${d.deviceId}-${dIdx}`}
                              className={`p-4 rounded-2xl border space-y-3 ${
                                isDevOnline
                                  ? 'bg-[#131414] border-emerald-800/45 shadow-xs'
                                  : 'bg-[#131414] border-[#282a2c]'
                              }`}
                            >
                              {/* Device Header + Delete/Revoke Action */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isDevOnline
                                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/50'
                                      : 'bg-[#202222] text-[#858585]'
                                  }`}>
                                    {renderDeviceIcon(d.deviceType, 'w-4 h-4')}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                      <span className="text-sm font-semibold text-white truncate">
                                        {d.deviceName}
                                      </span>
                                      {isCur && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-950/80 text-sky-400 border border-sky-700/50 shrink-0">
                                          THIS DEVICE
                                        </span>
                                      )}
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize shrink-0 ${
                                        isDevOnline
                                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                                          : 'bg-zinc-800 text-zinc-400'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isDevOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                                        <span>{d.status}</span>
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#858585] font-mono mt-0.5">
                                      <span>{d.os} • {d.browser}</span>
                                      <span>•</span>
                                      <span>First seen: {formatExactTimestamp(d.firstSeenAt)}</span>
                                      <span>•</span>
                                      <span>Last active: {formatRelativeTime(d.lastActiveAt)}</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevokeDevice(d.deviceId, selectedUserId || selectedUserHistory?.user?.id, d.deviceName, d.deviceKey);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-red-950/35 hover:bg-red-900/55 border border-red-800/40 text-red-300 text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                                  title={`Revoke and delete ${d.deviceName}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Revoke Device</span>
                                </button>
                              </div>

                              {/* Individual Device Sessions List */}
                              <div className="pt-2.5 border-t border-[#222426] space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-mono text-[#858585] uppercase tracking-wider">
                                  <span>Individual Sessions ({sortedSessions.length})</span>
                                  <span>Entry Route: {d.entryRoute || '/'}</span>
                                </div>

                                {sortedSessions.length === 0 ? (
                                  <p className="text-[11px] text-[#5c6166] italic">No recorded sessions on this device.</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {sortedSessions.map((sess, sIdx) => {
                                      const isSessOnline = sess.status === 'online';
                                      const canRevokeSession = !sess.logoutAt && sess.status !== 'expired';

                                      return (
                                        <div
                                          key={`dev-sess-${sess.sessionId || sIdx}`}
                                          className="px-3 py-2 rounded-xl bg-[#191a1b] border border-[#26282a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                                        >
                                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono capitalize shrink-0 ${
                                              isSessOnline
                                                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-700/50'
                                                : sess.status === 'expired'
                                                  ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                                  : 'bg-zinc-800 text-zinc-300'
                                            }`}>
                                              <span className={`w-1.5 h-1.5 rounded-full ${isSessOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                                              <span>{sess.status}</span>
                                            </span>
                                            <span className="font-mono text-white">
                                              Login: {formatExactTimestamp(sess.loginAt)}
                                            </span>
                                            <span className="text-[#858585] font-mono">
                                              • Active: {formatRelativeTime(sess.lastActivityAt)}
                                            </span>
                                            {sess.logoutAt && (
                                              <span className="text-[#858585] font-mono">
                                                • Ended: {formatExactTimestamp(sess.logoutAt)}
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-mono text-[#20b8cd]">
                                              {sess.durationFormatted}
                                            </span>
                                            {canRevokeSession && (
                                              <button
                                                type="button"
                                                onClick={() => handleRevokeSession(sess.sessionId)}
                                                className="px-2 py-0.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-[10px] cursor-pointer transition-colors"
                                                title="Disconnect this session"
                                              >
                                                Revoke
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Complete Login History Timeline */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-sky-400" />
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            Complete Login History ({filteredUserHistoryLogs.length} Events)
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#858585]">
                          Chronological authentication attempts across all devices
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl bg-[#131414] p-0.5 border border-[#2d3131] text-[11px]">
                          {(['all', 'success', 'failed'] as const).map(flt => (
                            <button
                              key={flt}
                              type="button"
                              onClick={() => setHistoryStatusFilter(flt)}
                              className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer transition-all ${
                                historyStatusFilter === flt
                                  ? 'bg-[#20b8cd] text-black font-semibold'
                                  : 'text-[#858585] hover:text-white'
                              }`}
                            >
                              {flt}
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#858585]" />
                          <input
                            type="text"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            placeholder="Filter events..."
                            className="pl-7 pr-2.5 py-1 bg-[#131414] border border-[#2d3131] rounded-xl text-xs text-white placeholder-[#5c6166] outline-none w-32 sm:w-44"
                          />
                        </div>
                      </div>
                    </div>

                    {filteredUserHistoryLogs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#858585] bg-[#131414] rounded-2xl border border-[#2d3131]">
                        No login events match the current filter.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredUserHistoryLogs.map((evt, evtIdx) => {
                          const isEvtSuccess = evt.status === 'success';

                          return (
                            <div
                              key={`drawer-log-evt-${evt.id || evt.timestamp}-${evtIdx}`}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                isEvtSuccess
                                  ? 'bg-[#131414] border-[#242828] hover:border-[#2d3131]'
                                  : 'bg-red-950/20 border-red-900/40'
                              }`}
                            >
                              <div className="flex items-start sm:items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                                  isEvtSuccess
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                    : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                                }`}>
                                  {isEvtSuccess ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                </div>

                                <div className="space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-white">
                                      {isEvtSuccess ? 'Authenticated' : 'Login Failed'}
                                    </span>

                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#202222] text-[#20b8cd] border border-[#20b8cd]/30 flex items-center gap-1">
                                      {evt.authMethod?.includes('2FA') || evt.authMethod?.includes('Authenticator') ? (
                                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                      ) : evt.authMethod?.includes('Google') ? (
                                        <Zap className="w-3 h-3 text-amber-400" />
                                      ) : evt.authMethod?.includes('Guest') ? (
                                        <Activity className="w-3 h-3 text-purple-400" />
                                      ) : (
                                        <KeyRound className="w-3 h-3 text-sky-400" />
                                      )}
                                      <span>{evt.authMethod || 'Password'}</span>
                                    </span>

                                    {!isEvtSuccess && evt.failReason && (
                                      <span className="text-[10px] text-rose-300 font-mono">
                                        Reason: {evt.failReason}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#858585]">
                                    <span className="flex items-center gap-1">
                                      {renderDeviceIcon(evt.deviceType, 'w-3.5 h-3.5')}
                                      <span>{evt.os || 'Desktop'} • {evt.browser || 'Browser'}</span>
                                    </span>
                                    <span>•</span>
                                    <span>Route: <code className="text-zinc-400">{evt.entryRoute || '/'}</code></span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-left sm:text-right font-mono shrink-0 pl-11 sm:pl-0">
                                <div className="text-xs text-white font-medium">
                                  {formatExactTimestamp(evt.timestamp)}
                                </div>
                                <div className="text-[10px] text-[#858585]">
                                  {formatRelativeTime(evt.timestamp)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
