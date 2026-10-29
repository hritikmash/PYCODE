import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  Trash2, 
  Search, 
  Zap, 
  Mail, 
  CheckCircle,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface LoginLogEntry {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  skillLevel?: string;
  accountType: 'guest' | 'registered' | 'google' | 'viewer';
  loginTime: string;
  userAgent?: string;
}

export const ViewerActivityModal: React.FC = () => {
  const { isViewerLogsModalOpen, closeViewerLogsModal, isOwner } = useAuth();
  const [logins, setLogins] = useState<LoginLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchLogins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/viewer-logins');
      if (res.ok) {
        const data = await res.json();
        setLogins(data.logins || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch viewer logins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isViewerLogsModalOpen && isOwner) {
      fetchLogins();
    }
  }, [isViewerLogsModalOpen, isOwner]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear the viewer login history?')) return;
    try {
      await fetch('/api/owner/viewer-logins', { method: 'DELETE' });
      setLogins([]);
      setTotalCount(0);
    } catch (err) {
      console.warn('Failed to clear logins:', err);
    }
  };

  if (!isViewerLogsModalOpen || !isOwner) return null;

  const filtered = logins.filter(item => {
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.accountType.toLowerCase().includes(q)
    );
  });

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return new Date(isoDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-2xl bg-[#1e1f20] border border-[#282a2c] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#282a2c] bg-[#171819]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white tracking-tight">Viewer Logins Tracker</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium">
                  Owner Secret View
                </span>
              </div>
              <p className="text-[11px] text-[#8e918f]">
                Live log of all users & viewers who have logged in to Pycode apart from you
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchLogins}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
              title="Refresh viewer logins"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={closeViewerLogsModal}
              className="p-2 rounded-xl hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Stats & Search */}
        <div className="p-3 sm:p-4 border-b border-[#282a2c] bg-[#151617] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, email, or type..."
              className="w-full bg-[#1e1f20] border border-[#3b3d40] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-[#8e918f]">
              Total external logins: <strong className="text-white">{totalCount}</strong>
            </span>
            {logins.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 [scrollbar-width:thin]">
          {loading && logins.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8e918f] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400" />
              <p>Fetching active viewer logins...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8e918f] space-y-2 bg-[#171819] rounded-2xl border border-[#282a2c]/60 p-6">
              <Users className="w-8 h-8 text-[#5e6160] mx-auto mb-1" />
              <p className="text-white font-medium">No other viewers have logged in yet</p>
              <p className="text-[11px] text-[#8e918f] max-w-sm mx-auto">
                When people open your shared link and sign in or continue as guests, their name, login method, and timestamp will immediately show up here.
              </p>
            </div>
          ) : (
            filtered.map((log) => {
              const isGuest = log.accountType === 'guest' || log.email.includes('@pycode.guest');
              const isGoogle = log.accountType === 'google';
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#171819] hover:bg-[#202224] border border-[#282a2c] transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center text-sm shadow-xs shrink-0">
                      {log.avatar || '👤'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-[160px] sm:max-w-[240px]">
                          {log.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                          isGuest
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                            : isGoogle
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        }`}>
                          {isGuest ? 'Guest Viewer' : isGoogle ? 'Google Sign-In' : 'Member'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8e918f] truncate max-w-[220px] sm:max-w-md mt-0.5">
                        {log.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-3 text-right">
                    <span className="flex items-center gap-1 text-[11px] text-[#a8c7fa] font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(log.loginTime)}</span>
                    </span>
                    {log.skillLevel && (
                      <span className="text-[10px] text-[#8e918f] mt-0.5">
                        Level: <strong className="text-[#c4c7c5]">{log.skillLevel}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#282a2c] bg-[#171819] flex items-center justify-between text-[11px] text-[#8e918f]">
          <span>Logged in as Owner (<strong>hritikyadav1612@gmail.com</strong>)</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Tracking Active
          </span>
        </div>
      </div>
    </div>
  );
};
