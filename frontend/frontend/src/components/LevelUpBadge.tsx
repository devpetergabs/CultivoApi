import React from 'react';

interface LevelUpBadgeProps {
  onClick: () => void;
}

export function LevelUpBadge({ onClick }: LevelUpBadgeProps) {
  return (
    <button
      className="levelup-badge animate-pulse rounded-full bg-green-500 text-white px-4 py-2 text-sm font-bold shadow-lg border-2 border-green-300 glow-green flex items-center gap-2 focus:outline-none hover:scale-105 transition-all"
      style={{ fontFamily: 'monospace', letterSpacing: '2px', margin: '0.5rem 0' }}
      onClick={onClick}
      title="Distribuir pontos de atributo"
    >
      <span style={{ fontSize: '1.2em' }}>LEVEL UP</span>
      <span style={{ fontSize: '1.5em', filter: 'drop-shadow(0 0 4px #22c55e)' }}>⬆️</span>
    </button>
  );
}

// CSS (adicionar ao PlantaCard.css ou global):
// .levelup-badge { box-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e44; border-radius: 999px; }
// .levelup-badge:active { background: #22c55e; color: #fff; }
// .glow-green { box-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e44; }
