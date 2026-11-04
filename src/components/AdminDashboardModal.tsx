import React, { useState, useEffect } from 'react';
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
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { UniqueDeviceRecord, DeviceSessionDetail } from '../server/authService';

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
  createdAt: string;
  lastLoginAt: string;
}

export const AdminDashboardModal: React.FC = () => {
  const { isAdminModalOpen, closeAdminModal, isAdmin, isOwner, token, user, deviceId } = useAuth();
  const { subscribeToAdminEvents, lastMessage } = useWebSocket();

  const [activeTab, setActiveTab] = useState<'devices' | 'sessions' | 'events' | 'users' | 'feedback'>('devices');
  const [selectedDevice, setSelectedDevice] = useState<UniqueDeviceRecord | null>(null);

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

      // 2. Unique Devices (Guaranteed NO duplicates - Rule 6)
      const devRes = await fetch('/api/owner/devices', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-device-id': deviceId
        }
      });
      const devData = await getJson(devRes);
      if (devData?.devices) {
        setUniqueDevices(devData.devices);
        // If a device is currently selected, update its reference
        if (selectedDevice) {
          const updated = devData.devices.find((d: UniqueDeviceRecord) => d.deviceId === selectedDevice.deviceId);
          if (updated) setSelectedDevice(updated);
        }
      }

      // 3. Raw Sessions
      const sessRes = await fetch('/api/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sessData = await getJson(sessRes);
      if (sessData && Array.isArray(sessData.sessions)) {
        setSessions(sessData.sessions);
      }

      // 4. Users
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await getJson(usersRes);
      if (usersData && Array.isArray(usersData.users)) {
        setUsersList(usersData.users);
      }

      // 5. Feedback
      const fbRes = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fbData = await getJson(fbRes);
      if (fbData && Array.isArray(fbData.feedbacks)) {
        setFeedbackList(fbData.feedbacks);
      }
    } catch (err) {
      console.warn('Dashboard fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen) {
      subscribeToAdminEvents();
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    } else {
      setSelectedDevice(null);
    }
  }, [isAdminModalOpen, subscribeToAdminEvents]);

  // Real-time instant data sync on admin WebSocket events
  useEffect(() => {
    if (isAdminModalOpen && lastMessage?.type === 'admin:event') {
      fetchData();
    }
  }, [lastMessage, isAdminModalOpen]);

  if (!isAdminModalOpen) return null;

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

  const handleRevokeDevice = async (targetDeviceId: string) => {
    if (!confirm('Are you sure you want to disconnect all sessions on this device?')) {
      return;
    }
    try {
      const res = await fetch(`/api/owner/devices/${targetDeviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage('All sessions on device terminated');
        fetchData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch {
      setActionMessage('Failed to disconnect device');
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

  const filteredDevices = uniqueDevices.filter(d => 
    d.deviceName.toLowerCase().includes(search.toLowerCase()) ||
    d.os.toLowerCase().includes(search.toLowerCase()) ||
    d.browser.toLowerCase().includes(search.toLowerCase()) ||
    d.associatedUsers.some(u => (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-5xl h-[92vh] max-h-[800px] bg-[#191a1a] text-[#ededed] border border-[#2d3131] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#2d3131] bg-[#131414] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">Owner Control Center</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-700/50 font-semibold">
                  {isOwner ? 'PREDEFINED OWNER' : 'ADMINISTRATOR'}
                </span>
              </div>
              <p className="text-[11px] text-[#858585]">
                Real-time multi-device session tracking, device history, and RBAC security
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
            <span className="text-lg font-bold text-white font-mono">{uniqueDevices.length}</span>
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
              onClick={() => { setActiveTab('devices'); setSelectedDevice(null); }}
              className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'devices'
                  ? 'border-[#20b8cd] text-white font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#ededed]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-[#20b8cd]" />
              <span>Connected Devices ({uniqueDevices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('sessions'); setSelectedDevice(null); }}
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
              onClick={() => { setActiveTab('events'); setSelectedDevice(null); }}
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
              onClick={() => { setActiveTab('users'); setSelectedDevice(null); }}
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
              onClick={() => { setActiveTab('feedback'); setSelectedDevice(null); }}
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
              placeholder="Search devices / users..."
              className="pl-8 pr-3 py-1.5 bg-[#131414] border border-[#2d3131] rounded-xl text-xs text-white placeholder-[#5c6166] outline-none w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: UNIQUE DEVICES (RULE 6 - NO DUPLICATE ENTRIES, CLICKABLE WITH HISTORY) */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              {!selectedDevice ? (
                /* Devices List View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#858585]">
                    <span>Each unique device appears only once. Click any device to inspect its complete session timeline.</span>
                    <span className="font-mono">{filteredDevices.length} Unique Devices</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredDevices.map((dev, devIdx) => {
                      const isCurrent = dev.deviceId === deviceId || dev.isCurrentDevice;
                      const isOnline = dev.status === 'online';

                      return (
                        <div
                          key={`device-${dev.deviceId || 'dev'}-${devIdx}`}
                          onClick={() => setSelectedDevice(dev)}
                          className="p-4 rounded-2xl bg-[#131414] border border-[#2d3131] hover:border-[#20b8cd]/60 hover:bg-[#191a1a] transition-all cursor-pointer group shadow-sm flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                                isOnline 
                                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-400' 
                                  : 'bg-[#202222] border-[#2d3131] text-[#858585]'
                              }`}>
                                {renderDeviceIcon(dev.deviceType, 'w-5 h-5')}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-white group-hover:text-[#20b8cd] transition-colors">
                                    {dev.deviceName}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-sky-950/80 text-sky-400 border border-sky-700/50">
                                      THIS DEVICE
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-[#858585] mt-0.5">
                                  <span>{dev.os}</span>
                                  <span>•</span>
                                  <span>{dev.browser}</span>
                                  <span>•</span>
                                  <span className="font-mono text-[#20b8cd]">{dev.totalSessionsCount} sessions</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                isOnline
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                                <span className="capitalize">{dev.status}</span>
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#858585] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>

                          {/* Associated Users on this device */}
                          <div className="pt-2 border-t border-[#242828] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 text-[#858585]">
                              <span>Users:</span>
                              <span className="text-[#ededed] font-medium truncate max-w-[220px]">
                                {dev.associatedUsers.map(u => u.name || u.email).join(', ') || 'Anonymous'}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#858585] font-mono">
                              Last active: {new Date(dev.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Detail View: Complete Session History on Clicked Device (Requirement 6) */
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Top Bar with Back Button & Device Summary */}
                  <div className="p-5 rounded-2xl bg-[#131414] border border-[#2d3131] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedDevice(null)}
                        className="p-2 rounded-xl bg-[#202222] hover:bg-[#282a2c] text-[#858585] hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>All Devices</span>
                      </button>

                      <div className="w-9 h-9 rounded-xl bg-[#20b8cd]/10 border border-[#20b8cd]/30 flex items-center justify-center text-[#20b8cd]">
                        {renderDeviceIcon(selectedDevice.deviceType, 'w-5 h-5')}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{selectedDevice.deviceName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                            selectedDevice.status === 'online'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {selectedDevice.status}
                          </span>
                        </div>
                        <span className="text-xs text-[#858585] font-mono">
                          ID: {selectedDevice.deviceId} • First Seen: {new Date(selectedDevice.firstSeenAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRevokeDevice(selectedDevice.deviceId)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium cursor-pointer transition-all active:scale-95"
                      >
                        Revoke All Sessions On Device
                      </button>
                    </div>
                  </div>

                  {/* Complete Session History Timeline */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#858585]">
                      <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                        Session Timeline ({selectedDevice.sessions.length} Recorded Sessions)
                      </span>
                      <span>Chronological order (Newest first)</span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedDevice.sessions.map((sess, idx) => {
                        const isSessOnline = sess.status === 'online';

                        return (
                          <div 
                            key={`timeline-${sess.sessionId || 'sess'}-${idx}`}
                            className={`p-4 rounded-2xl border transition-all ${
                              isSessOnline
                                ? 'bg-[#191a1a] border-emerald-800/50 shadow-xs'
                                : 'bg-[#131414] border-[#2d3131]'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-xs font-semibold text-white">{sess.sessionId}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold ${
                                    isSessOnline
                                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 animate-pulse'
                                      : 'bg-[#202222] text-[#858585]'
                                  }`}>
                                    {sess.status}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-[#202222] text-[#9e9e9e] capitalize">
                                    {sess.role}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9e9e9e]">
                                  <span>User: <strong className="text-white">{sess.userName}</strong> ({sess.userEmail || 'guest'})</span>
                                  <span>•</span>
                                  <span>Duration: <strong className="text-[#20b8cd] font-mono">{sess.durationFormatted}</strong></span>
                                  <span>•</span>
                                  <span>Route: <code className="text-[#858585]">{sess.entryRoute}</code></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right text-[11px] text-[#858585] font-mono">
                                  <div>Login: {new Date(sess.loginAt).toLocaleString()}</div>
                                  <div>{sess.logoutAt ? `Logout: ${new Date(sess.logoutAt).toLocaleString()}` : 'Currently Active'}</div>
                                </div>

                                {isSessOnline && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeSession(sess.sessionId)}
                                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs cursor-pointer"
                                    title="Disconnect this individual session"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#202222] flex items-center justify-center text-[#858585]">
                          {renderDeviceIcon(s.deviceType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{s.userName || 'Anonymous'}</span>
                            <span className="text-[10px] text-[#858585] font-mono">{s.userEmail}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#202222] text-[#9e9e9e] capitalize">{s.role}</span>
                          </div>
                          <span className="text-[11px] text-[#858585] font-mono">
                            {s.os} • {s.browser} • Last active {new Date(s.lastActivityAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
                <div key={`event-${evt.id || evt.timestamp || 'evt'}-${idx}`} className="p-3 rounded-xl bg-[#131414] border border-[#2d3131] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${evt.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div>
                      <span className="font-medium text-white">{evt.name}</span>
                      <span className="text-[11px] text-[#858585] ml-2 font-mono">{evt.email}</span>
                      <span className="text-[11px] text-[#858585] ml-2">via {evt.authMethod}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#858585]">{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: USERS & ROLES HIERARCHY */}
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

              {/* Users list */}
              <div className="space-y-2">
                {usersList
                  .filter(u => 
                    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                    (u.email || '').toLowerCase().includes(search.toLowerCase())
                  )
                  .map((u, idx) => {
                    const isOwnerAccount = u.role === 'owner';
                    const isAdminAccount = u.role === 'admin';

                    return (
                      <div 
                        key={`user-item-${u.id || idx}`}
                        className="p-3.5 rounded-2xl bg-[#131414] border border-[#2d3131] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#202222] flex items-center justify-center shrink-0 text-base">
                            {u.avatar || '👤'}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate">{u.name || 'User'}</span>
                              {isOwnerAccount && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono bg-amber-950/80 text-amber-300 border border-amber-600/40 font-semibold">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>ROOT OWNER</span>
                                </span>
                              )}
                              {isAdminAccount && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-600/40 font-semibold">
                                  <Shield className="w-3 h-3 text-indigo-400" />
                                  <span>ADMINISTRATOR (APP EDITOR)</span>
                                </span>
                              )}
                              {!isOwnerAccount && !isAdminAccount && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-[#202222] text-[#9e9e9e] capitalize">
                                  {u.role}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#858585] block truncate font-mono mt-0.5">
                              {u.email} • Level: {u.skillLevel || 'Beginner'} • Member since {new Date(u.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isOwner && !isOwnerAccount && (
                            <>
                              {isAdminAccount ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAdministrator(u.id, u.name)}
                                  className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium cursor-pointer transition-all active:scale-95"
                                  title="Revoke administrator privileges and demote to member"
                                >
                                  Revoke Administrator
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMakeAdministrator(u.id, u.name)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 text-xs font-medium cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                  title="Make administrator with app editing & updating permissions"
                                >
                                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Make Administrator</span>
                                </button>
                              )}
                            </>
                          )}
                          {!isOwner && isAdminAccount && (
                            <span className="text-[11px] text-[#858585] italic">App Editor</span>
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

          {/* TAB 4: FEEDBACK */}
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
    </div>
  );
};
