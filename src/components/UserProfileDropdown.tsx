import React, { useState, useRef, useEffect } from 'react';
import { 
  LogIn, 
  LogOut, 
  User, 
  ChevronDown, 
  Sparkles, 
  Shield, 
  GraduationCap, 
  Check, 
  Clock,
  Zap,
  MessageSquare,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveUserGreetingName } from '../utils/userName';
import { UserAvatar } from './UserAvatar';

export const UserProfileDropdown: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    logout, 
    logoutAllDevices, 
    openAuthModal, 
    openGoogleWindow,
    updateProfile, 
    isAdmin, 
    openAdminModal,
    openFeedbackModal 
  } = useAuth();

  const displayName = resolveUserGreetingName(user);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdatingSkill, setIsUpdatingSkill] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSkillChange = async (skillLevel: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setIsUpdatingSkill(true);
    await updateProfile({ skillLevel });
    setIsUpdatingSkill(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to log out from all devices?')) return;
    setIsOpen(false);
    await logoutAllDevices();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => openAuthModal('signin')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-xs font-medium text-[#c4c7c5] hover:text-white border border-[#3b3d40] transition-all cursor-pointer shadow-xs"
          title="Sign in to your Pycode account"
        >
          <LogIn className="w-3.5 h-3.5 text-sky-400" />
          <span>Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => openAuthModal('guest')}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-[11px] font-medium text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
          title="Instant Guest Viewer access"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Guest</span>
        </button>
      </div>
    );
  }

  const isGuest = user.email.includes('@pycode.guest');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3b3d40] transition-all cursor-pointer group"
        title={`Signed in as ${displayName}`}
      >
        {/* User Avatar Circle */}
        <UserAvatar
          avatar={user.avatar}
          name={displayName}
          email={user.email}
          sizeClass="w-7 h-7"
          roundedClass="rounded-full"
          textClass="text-xs"
          className="shadow-inner"
        />

        {/* User Name Preview (Desktop) */}
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-white tracking-tight leading-none group-hover:text-[#a8c7fa] transition-colors truncate max-w-[100px]">
            {displayName}
          </span>
          <span className="text-[10px] text-[#8e918f] leading-none mt-0.5">
            {isGuest ? 'Guest Viewer' : user.skillLevel}
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-[#8e918f] group-hover:text-white transition-transform" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#1e1f20] border border-[#282a2c] shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Card */}
          <div className="p-3 rounded-xl bg-[#131314] border border-[#282a2c] mb-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <UserAvatar
                  avatar={user.avatar}
                  name={displayName}
                  email={user.email}
                  sizeClass="w-9 h-9"
                  roundedClass="rounded-full"
                  textClass="text-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white text-sm truncate flex items-center gap-1.5">
                    <span className="truncate">{displayName}</span>
                    {user.avatar?.startsWith('http') && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-400/30 px-1 rounded-sm shrink-0" title="Google Verified">G</span>
                    )}
                  </div>
                  <div className="text-xs text-[#8e918f] truncate">{user.email}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                isGuest 
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                  : user.role === 'owner'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-600'
                  : user.role === 'admin'
                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-600'
                  : 'bg-sky-950/60 text-sky-400 border border-sky-800/60'
              }`}>
                {user.role === 'owner' ? '👑 Owner' : user.role === 'admin' ? '🛡️ Admin' : isGuest ? 'Guest' : 'Member'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#282a2c]/60 flex items-center justify-between text-[11px] text-[#8e918f]">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Level: <strong className="text-white">{user.skillLevel}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Active</span>
              </span>
            </div>
          </div>

          {/* Quick Skill Level Selector */}
          <div className="px-2 py-1.5">
            <span className="text-[10px] uppercase font-semibold text-[#8e918f] tracking-wider block mb-1.5">
              Change Learning Depth
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
                const active = user.skillLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSkillChange(level)}
                    disabled={isUpdatingSkill}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all text-center ${
                      active
                        ? 'bg-[#004a77] text-white shadow-xs'
                        : 'bg-[#171819] hover:bg-[#282a2c] text-[#8e918f] hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action links */}
          <div className="pt-1.5 mt-1 border-t border-[#282a2c]/60 space-y-0.5">
            {/* Feedback Button */}
            <button
              type="button"
              onClick={() => { setIsOpen(false); openFeedbackModal(); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors text-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Submit Site Feedback & Ideas</span>
            </button>

            {/* Admin Console (if Admin or Owner) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => { setIsOpen(false); openAdminModal(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-amber-950/30 text-amber-300 transition-colors text-xs cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin & Session Dashboard</span>
              </button>
            )}

            {/* Google Account Switcher */}
            <button
              type="button"
              onClick={() => { setIsOpen(false); openGoogleWindow(); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors text-xs cursor-pointer group"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.9 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Switch / Add Google Account</span>
            </button>
          </div>

          {/* Guest Upgrade Prompt */}
          {isGuest && (
            <div className="mx-1 my-1.5 p-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-[11px] flex items-center justify-between">
              <span>Save sessions permanently?</span>
              <button
                type="button"
                onClick={() => { setIsOpen(false); openAuthModal('signup'); }}
                className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium text-[10px] transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Sign Out Options */}
          <div className="pt-1 mt-1 border-t border-[#282a2c]/60 space-y-0.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-xs font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out This Device</span>
            </button>
            <button
              type="button"
              onClick={handleLogoutAll}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[#8e918f] hover:bg-red-950/20 hover:text-red-300 transition-colors text-[11px] cursor-pointer"
              title="Log out from all phones, tablets, and laptops"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Log Out All Devices</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
