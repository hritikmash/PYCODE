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
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveUserGreetingName } from '../utils/userName';

export const UserProfileDropdown: React.FC = () => {
  const { user, isAuthenticated, logout, openAuthModal, updateProfile } = useAuth();
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

  const handleSkillChange = async (newLevel: 'Beginner' | 'Intermediate' | 'Advanced') => {
    if (!user || user.skillLevel === newLevel) return;
    setIsUpdatingSkill(true);
    await updateProfile({ skillLevel: newLevel });
    setIsUpdatingSkill(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
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
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
          {user.avatar ? (
            <span className="text-sm select-none">{user.avatar}</span>
          ) : (
            displayName[0].toUpperCase()
          )}
        </div>

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
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">{user.avatar || '👤'}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{displayName}</div>
                  <div className="text-[11px] text-[#8e918f] truncate">{user.email}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                isGuest 
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                  : 'bg-sky-950/60 text-sky-400 border border-sky-800/60'
              }`}>
                {isGuest ? 'Guest' : user.role}
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

          {/* Divider & Sign Out */}
          <div className="pt-1 mt-1 border-t border-[#282a2c]/60">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-xs font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
