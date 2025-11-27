import React from 'react';

interface AvatarProps {
  name: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, className = "w-8 h-8 text-xs" }) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className={`flex items-center justify-center bg-indigo-500 text-white font-bold rounded-full select-none ${className}`}>
      {getInitials(name)}
    </div>
  );
};
