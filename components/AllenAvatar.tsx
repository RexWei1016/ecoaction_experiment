import React from 'react';

interface AllenAvatarProps {
  isSpeaking: boolean;
}

const AllenAvatar: React.FC<AllenAvatarProps> = ({ isSpeaking }) => {
  return (
    <div className="flex flex-col items-center justify-center mb-6 transition-all duration-500">
      <div className={`
        w-20 h-20 rounded-full flex items-center justify-center
        bg-gradient-to-tr from-emerald-100 to-teal-50 shadow-md
        border-2 ${isSpeaking ? 'border-emerald-400' : 'border-slate-100'}
        transition-all duration-300
      `}>
        {/* Simple Abstract Face/Icon */}
        <div className="relative">
          <div className={`w-12 h-12 bg-emerald-500 rounded-full opacity-20 absolute top-0 left-0 ${isSpeaking ? 'animate-ping' : ''}`}></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div className="mt-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">
        AI Assistant Allen
      </div>
    </div>
  );
};

export default AllenAvatar;