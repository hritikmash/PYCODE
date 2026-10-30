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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface SafeSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  accountType: 'registered' | 'google' | 'guest';
  createdAt: string;
  lastActivityAt: string;
  expiresAt: number;
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
  authMethod: 'password' | 'google' | 'guest';
  status: 'success' | 'failed';
  failReason?: string;
  timestamp: string;
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
  createdAt: string;
  lastLoginAt: string;
}

export const AdminDashboardModal: React.FC = () => {
  const { isAdminModalOpen, closeAdminModal, isAdmin, isOwner, token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'sessions' | 'events' | 'users' | 'feedback'>('sessions');
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

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

  const [sessions, setSessions] = useState<SafeSession[]>([]);
  const [events, setEvents] = useState<LoginEventRecord[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

      // 2. Multi-device sessions
      const sessRes = await fetch('/api/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sessData = await getJson(sessRes);
      if (sessData) {
        setSessions(sessData.sessions || []);
      }

      // 3. User List
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const uData = await getJson(usersRes);
      if (uData) {
        setUsersList(uData.users || []);
      }

      // 4. Feedback
      const fbRes = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fbData = await getJson(fbRes);
      if (fbData) {
        setFeedbackList(fbData.feedbacks || []);
      }
    } catch (err) {
      console.warn('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen && isAdmin) {
      fetchData();
      // Controlled 5s polling for real-time live monitoring (Section 7C)
      const timer = setInterval(fetchData, 5000);
      return () => clearInterval(timer);
    }
  }, [isAdminModalOpen, isAdmin, token]);

  if (!isAdminModalOpen) return null;

  // Strict backend-verified role enforcement
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#1e1f20] border border-red-800/80 p-6 rounded-2xl max-w-sm text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h4 className="text-white font-bold">Access Denied</h4>
          <p className="text-xs text-[#8e918f]">
            You do not have administrative privileges to access this dashboard.
          </p>
          <button
            type="button"
            onClick={closeAdminModal}
            className="px-4 py-2 rounded-xl bg-[#282a2c] hover:bg-[#3b3d40] text-xs text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this active device session?')) return;
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage('Device session revoked successfully');
        setTimeout(() => setActionMessage(null), 3000);
        fetchData();
      }
    } catch (err) {
      console.warn('Failed to revoke session:', err);
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : {};
      if (!res.ok) {
        setActionMessage(data.error || 'Failed to update role');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setActionMessage('User role updated successfully');
        setTimeout(() => setActionMessage(null), 3000);
        fetchData();
      }
    } catch (err) {
      console.warn('Role change error:', err);
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
      if (diff < 15) return 'Just now';
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return new Date(isoDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoDate;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
    if (deviceType === 'tablet') return <Tablet className="w-3.5 h-3.5 text-indigo-400" />;
    return <Laptop className="w-3.5 h-3.5 text-sky-400" />;
  };

  const filteredSessions = sessions.filter(s => {
    const q = search.toLowerCase();
    return (
      s.userName.toLowerCase().includes(q) ||
      s.userEmail.toLowerCase().includes(q) ||
      s.browser.toLowerCase().includes(q) ||
      s.os.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-4xl bg-[#171819] border border-[#282a2c] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282a2c] bg-[#121314]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white tracking-tight">Admin & Multi-Device Control Center</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                  isOwner
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                }`}>
                  {isOwner ? '👑 Owner Console' : '🛡️ Administrator'}
                </span>
              </div>
              <p className="text-xs text-[#8e918f]">
                Live authentication tracking, multi-device sessions, RBAC controls & user feedback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={closeAdminModal}
              className="p-2 rounded-xl hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action toast */}
        {actionMessage && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Overview Metric Cards (Section 7A) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-4 sm:p-6 border-b border-[#282a2c] bg-[#151617]">
          <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-1">
            <div className="text-[11px] text-[#8e918f]">Registered Users</div>
            <div className="text-xl font-bold text-white">{overview.totalRegisteredUsers}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-1">
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Auth</span>
            </div>
            <div className="text-xl font-bold text-white">{overview.activeAuthenticatedUsers}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-1">
            <div className="text-[11px] text-amber-400">Active Guests</div>
            <div className="text-xl font-bold text-white">{overview.activeGuestSessions}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-1">
            <div className="text-[11px] text-indigo-400">Active Admins</div>
            <div className="text-xl font-bold text-white">{overview.activeAdministrators}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-1">
            <div className="text-[11px] text-amber-300">Owner Sessions</div>
            <div className="text-xl font-bold text-white">{overview.activeOwnerSessions}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-1">
            <div className="text-[11px] text-sky-400">Total Devices</div>
            <div className="text-xl font-bold text-white">{overview.totalActiveSessions}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-[#282a2c] bg-[#151617]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-[#282a2c] text-white border border-[#3b3d40] shadow-xs'
                  : 'text-[#8e918f] hover:text-white hover:bg-[#1e1f20]'
              }`}
            >
              Multi-Device Sessions ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-[#282a2c] text-white border border-[#3b3d40] shadow-xs'
                  : 'text-[#8e918f] hover:text-white hover:bg-[#1e1f20]'
              }`}
            >
              Auth Events Log ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#282a2c] text-white border border-[#3b3d40] shadow-xs'
                  : 'text-[#8e918f] hover:text-white hover:bg-[#1e1f20]'
              }`}
            >
              User Management ({usersList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-[#282a2c] text-white border border-[#3b3d40] shadow-xs'
                  : 'text-[#8e918f] hover:text-white hover:bg-[#1e1f20]'
              }`}
            >
              User Feedback ({feedbackList.length})
            </button>
          </div>

          <div className="relative w-56 hidden sm:block">
            <Search className="w-3.5 h-3.5 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#1e1f20] border border-[#282a2c] rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 [scrollbar-width:thin]">
          {/* TAB 1: Multi-Device Sessions */}
          {activeTab === 'sessions' && (
            <div className="space-y-2.5">
              {filteredSessions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8e918f] space-y-1">
                  <Activity className="w-8 h-8 text-[#5e6160] mx-auto mb-2" />
                  <p>No matching active device sessions found</p>
                </div>
              ) : (
                filteredSessions.map((sess) => {
                  const isOnline = sess.status === 'online';
                  const isOwnerSession = sess.role === 'owner';
                  return (
                    <div
                      key={sess.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#1e1f20] hover:bg-[#242628] border border-[#282a2c] transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#282a2c] flex items-center justify-center shrink-0">
                          {getDeviceIcon(sess.deviceType)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-[160px] sm:max-w-[200px]">
                              {sess.userName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                              sess.role === 'owner'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : sess.role === 'admin'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                : sess.accountType === 'guest'
                                ? 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}>
                              {sess.role === 'owner' ? '👑 Owner' : sess.role === 'admin' ? '🛡️ Admin' : sess.accountType === 'guest' ? 'Guest' : 'Member'}
                            </span>
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                              isOnline
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                              <span>{isOnline ? 'Online' : 'Offline'}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8e918f] flex items-center gap-2 mt-0.5">
                            <span className="truncate max-w-[180px]">{sess.userEmail}</span>
                            <span>•</span>
                            <span>{sess.browser} on {sess.os}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-[#5e6160]">{sess.id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-right text-[11px]">
                          <div className="text-[#a8c7fa] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>Active: {formatTimeAgo(sess.lastActivityAt)}</span>
                          </div>
                          <div className="text-[10px] text-[#5e6160]">
                            Logged in: {new Date(sess.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {/* Revoke Session button */}
                        {(!isOwnerSession || isOwner) && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            className="p-1.5 rounded-xl hover:bg-red-950/50 text-[#8e918f] hover:text-red-400 transition-colors cursor-pointer"
                            title="Terminate / Revoke device session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Authentication Events Log */}
          {activeTab === 'events' && (
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8e918f]">
                  No login events recorded yet
                </div>
              ) : (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {evt.status === 'success' ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-red-950 border border-red-800 text-red-400 flex items-center justify-center shrink-0">
                          <UserX className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{evt.name}</span>
                          <span className="text-[10px] text-[#8e918f]">({evt.email})</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#282a2c] text-[#a8c7fa]">
                            {evt.authMethod}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8e918f] mt-0.5">
                          {evt.status === 'success' ? 'Authenticated successfully' : `Failed: ${evt.failReason || 'Invalid credentials'}`} • {evt.browser} on {evt.os}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#8e918f] font-mono shrink-0 ml-3">
                      {formatTimeAgo(evt.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: User Management (RBAC) */}
          {activeTab === 'users' && (
            <div className="space-y-2.5">
              {usersList.map((u) => {
                const isTargetOwner = u.role === 'owner';
                const isTargetAdmin = u.role === 'admin';
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1e1f20] border border-[#282a2c]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#282a2c] flex items-center justify-center text-sm shrink-0 overflow-hidden">
                        {u.avatar && u.avatar.startsWith('http') ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.avatar || '👤'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-white truncate">
                            {u.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isTargetOwner
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : isTargetAdmin
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8e918f] truncate">{u.email}</div>
                      </div>
                    </div>

                    {/* Role assignment controls (Owner can appoint/remove admins) */}
                    {isOwner && !isTargetOwner && (
                      <div className="flex items-center gap-2 shrink-0">
                        {isTargetAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleChangeRole(u.id, 'member')}
                            className="px-2.5 py-1 rounded-lg bg-[#282a2c] hover:bg-red-950 text-xs text-red-300 transition-colors cursor-pointer"
                          >
                            Demote to Member
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChangeRole(u.id, 'admin')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-xs text-indigo-300 transition-colors cursor-pointer"
                          >
                            Promote to Admin
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: User Feedback */}
          {activeTab === 'feedback' && (
            <div className="space-y-3">
              {feedbackList.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8e918f] space-y-1">
                  <MessageSquare className="w-8 h-8 text-[#5e6160] mx-auto mb-2" />
                  <p>No user feedback responses submitted yet.</p>
                </div>
              ) : (
                feedbackList.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-2xl bg-[#1e1f20] border border-[#282a2c] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#282a2c] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{fb.userName || 'Anonymous'}</span>
                        {fb.userEmail && <span className="text-[11px] text-[#8e918f]">({fb.userEmail})</span>}
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-950 text-sky-400 border border-sky-800">
                          Performance: {fb.performanceRating}/5 ({fb.speedCategory})
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8e918f] font-mono">
                        {formatTimeAgo(fb.submittedAt)}
                      </span>
                    </div>

                    {/* Upgraded fields requested */}
                    {fb.upgradeFields && fb.upgradeFields.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-[#8e918f] font-medium">Fields needing upgrade:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {fb.upgradeFields.map((f, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] bg-[#282a2c] text-[#a8c7fa]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features to add */}
                    {fb.addSuggestions && (
                      <div className="p-2.5 rounded-xl bg-[#171819] text-xs text-purple-300">
                        <strong className="text-white">Suggested Additions: </strong>
                        {fb.addSuggestions}
                      </div>
                    )}

                    {/* Comments */}
                    {fb.comments && (
                      <div className="text-xs text-[#c4c7c5]">
                        <strong className="text-white">Comments: </strong>
                        {fb.comments}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#282a2c] bg-[#121314] flex items-center justify-between text-[11px] text-[#8e918f]">
          <span>Logged in as <strong>{user?.name}</strong> ({user?.role})</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Multi-Device Stream Active (Zero IP Exposure)
          </span>
        </div>
      </div>
    </div>
  );
};
