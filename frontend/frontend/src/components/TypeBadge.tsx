import type { ReactNode } from 'react';
import type { PlantType } from '../types/pokedex';

interface TypeBadgeProps {
  type: PlantType;
  size?: 'sm' | 'md' | 'lg';
  action?: ReactNode;
}

const TYPE_CONFIG: Record<PlantType, { bgGradient: string; borderColor: string; emoji: string; label: string }> = {
  GERMINACAO: { bgGradient: 'from-blue-600/30 to-blue-700/30', borderColor: 'border-blue-400/70', emoji: '🌱', label: 'Germinação' },
  VEGETATIVO: { bgGradient: 'from-emerald-600/30 to-emerald-700/30', borderColor: 'border-emerald-400/70', emoji: '🍃', label: 'Vegetativo' },
  FLORACAO_INICIAL: { bgGradient: 'from-rose-600/30 to-rose-700/30', borderColor: 'border-rose-400/70', emoji: '🌸', label: 'Floração Inicial' },
  FLORACAO_MEDIA: { bgGradient: 'from-fuchsia-600/30 to-fuchsia-700/30', borderColor: 'border-fuchsia-400/70', emoji: '🌺', label: 'Floração Média' },
  FLORACAO_AVANCADA: { bgGradient: 'from-amber-600/30 to-amber-700/30', borderColor: 'border-amber-400/70', emoji: '🌼', label: 'Floração Avançada' },
  FINALIZACAO: { bgGradient: 'from-slate-600/30 to-slate-700/30', borderColor: 'border-slate-400/70', emoji: '🧼', label: 'Finalização' },
};

export function getPlantStageLabel(type: PlantType): string {
  return TYPE_CONFIG[type].label;
}

export function TypeBadge({ type, size = 'md', action }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-[0.14em] rounded-lg border ${config.borderColor} bg-gradient-to-r ${config.bgGradient} text-white ${sizeClasses[size]} transition-all hover:scale-105 shadow-[0_0_6px_rgba(111,191,134,0.10)]`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
      {action ? <span className="ml-1.5 inline-flex items-center">{action}</span> : null}
    </span>
  );
}
