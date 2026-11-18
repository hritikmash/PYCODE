import React, { useEffect, useState } from 'react';

interface UserAvatarProps {
  avatar?: string;
  name?: string;
  email?: string;
  sizeClass?: string;
  roundedClass?: string;
  textClass?: string;
  className?: string;
}

function getInitials(name?: string, email?: string): string {
  const cleanedName = (name || '').trim();
  if (cleanedName) {
    const parts = cleanedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const cleanedEmail = (email || '').trim();
  if (cleanedEmail) {
    return cleanedEmail[0].toUpperCase();
  }
  return 'U';
}

function isImageUrl(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return (
    /^https?:\/\//i.test(trimmed) ||
    /^data:image\//i.test(trimmed) ||
    trimmed.startsWith('/assets/')
  );
}

function isBrokenOrUrlText(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return (
    trimmed.includes('http') ||
    trimmed.includes('://') ||
    trimmed.includes('.com') ||
    trimmed.includes('/') ||
    trimmed.length > 6
  );
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  email,
  sizeClass = 'w-9 h-9',
  roundedClass = 'rounded-full',
  textClass = 'text-xs',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  const safeAlt = (name || '').trim() || (email ? email.split('@')[0] : 'User');
  const initials = getInitials(name, email);
  const showImage = isImageUrl(avatar) && !imgError;
  const showEmoji = Boolean(avatar && !isImageUrl(avatar) && !isBrokenOrUrlText(avatar));

  return (
    <div
      className={`${sizeClass} ${roundedClass} overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-sky-600/80 via-indigo-600/80 to-cyan-600/80 text-white font-semibold select-none ${className}`}
    >
      {showImage ? (
        <img
          src={avatar!.trim()}
          alt={safeAlt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : showEmoji ? (
        <span className={`${textClass} leading-none`}>{avatar}</span>
      ) : (
        <span className={`${textClass} font-bold tracking-tight leading-none`}>{initials}</span>
      )}
    </div>
  );
};
