'use client';

import { useState } from 'react';

interface AgentAvatarProps {
  src: string;
  alt: string;
  initials: string;
  size: 'large' | 'small';
  avatarRing: string;
  avatarGrad: string;
  avatarShadow: string;
}

export default function AgentAvatar({ src, alt, initials, size, avatarRing, avatarGrad, avatarShadow }: AgentAvatarProps) {
  const [failed, setFailed] = useState(false);

  const large = size === 'large';
  const imgCls = large
    ? `w-28 h-28 md:w-36 md:h-36 rounded-3xl object-cover shadow-2xl border-2 border-white/20 ${avatarRing}`
    : `w-16 h-16 rounded-2xl object-cover border-2 border-white flex-shrink-0 ${avatarRing}`;
  const fallbackCls = large
    ? `w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-4xl md:text-5xl font-black border-2 border-white/20 ${avatarRing}`
    : `w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-xl font-black border-2 border-white flex-shrink-0 ${avatarRing}`;

  if (failed) {
    return (
      <div className={fallbackCls} style={{ boxShadow: avatarShadow }}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={imgCls}
      style={{ boxShadow: avatarShadow }}
      onError={() => setFailed(true)}
    />
  );
}
