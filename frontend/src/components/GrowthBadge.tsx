import React from 'react';

interface GrowthBadgeProps {
  level?: number;
  onClick?: () => void;
}

export const GrowthBadge: React.FC<GrowthBadgeProps> = ({ level, onClick }) => (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded bg-gradient-to-r from-[#6fbf86] to-[#A7E5B2] text-xs font-bold text-[#1a1f2e] border border-[#7BD389]/50 shadow-sm cursor-pointer"
    title="A planta cresceu!"
    style={{ marginLeft: 8 }}
    onClick={onClick}
  >
    🌱 Cresceu{level ? ` (Lv.${level})` : ''}
  </span>
);
