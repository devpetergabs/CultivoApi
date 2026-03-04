import type { ReactNode } from 'react';
import type { PlantType } from '../types/pokedex';

interface TypeBadgeProps {
  type: PlantType;
  size?: 'sm' | 'md' | 'lg';
  action?: ReactNode;
  /**
   * classic = labels completos ("Germinação", "Floração Média"...)
   * rpg = labels curtos com nomenclatura mais científica/clean.
   */
  mode?: 'classic' | 'rpg';
}

const TYPE_CONFIG: Record<
  PlantType,
  { bgGradient: string; borderColor: string; emoji: string; label: string; labelRpg: string }
> = {
  GERMINACAO: {
    bgGradient: 'from-blue-600/30 to-blue-700/30',
    borderColor: 'border-blue-400/70',
    emoji: '🌱',
    // "Germinação"
    label: 'Germina\u00E7\u00E3o',
    // "Gênese"
    labelRpg: 'G\u00EAnese',
  },
  VEGETATIVO: {
    bgGradient: 'from-emerald-600/30 to-emerald-700/30',
    borderColor: 'border-emerald-400/70',
    emoji: '🍃',
    label: 'Vegetativo',
    // "Vigor"
    labelRpg: 'Vigor',
  },
  FLORACAO_INICIAL: {
    bgGradient: 'from-rose-600/30 to-rose-700/30',
    borderColor: 'border-rose-400/70',
    emoji: '🌸',
    // "Floração Inicial"
    label: 'Flora\u00E7\u00E3o Inicial',
    // "Pré-Flor"
    labelRpg: 'Pr\u00E9-Flor',
  },
  FLORACAO_MEDIA: {
    bgGradient: 'from-fuchsia-600/30 to-fuchsia-700/30',
    borderColor: 'border-fuchsia-400/70',
    emoji: '🌺',
    // "Floração Média"
    label: 'Flora\u00E7\u00E3o M\u00E9dia',
    // "Flor"
    labelRpg: 'Flor',
  },
  FLORACAO_AVANCADA: {
    bgGradient: 'from-amber-600/30 to-amber-700/30',
    borderColor: 'border-amber-400/70',
    emoji: '🌼',
    // "Floração Avançada"
    label: 'Flora\u00E7\u00E3o Avan\u00E7ada',
    // "Engorda"
    labelRpg: 'Engorda',
  },
  FINALIZACAO: {
    bgGradient: 'from-slate-600/30 to-slate-700/30',
    borderColor: 'border-slate-400/70',
    emoji: '\uD83C\uDFC1',
    label: 'Finaliza\u00E7\u00E3o',
    // "Final/Colheita"
    labelRpg: 'Final/Colheita',
  },
};

export function getPlantStageLabel(type: PlantType): string {
  return TYPE_CONFIG[type].label;
}

export function TypeBadge({ type, size = 'md', action, mode = 'classic' }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const label = mode === 'rpg' ? config.labelRpg : config.label;

  return (
    <span
      title={label}
      className={`inline-flex max-w-full min-w-0 items-center font-semibold uppercase tracking-[0.12em] rounded-lg border ${config.borderColor} bg-gradient-to-r ${config.bgGradient} text-white ${sizeClasses[size]} transition-all hover:brightness-110 shadow-[0_0_6px_rgba(111,191,134,0.10)]`}
    >
      <span>{config.emoji}</span>
      <span className="min-w-0 truncate">{label}</span>
      {action ? <span className="ml-1.5 inline-flex items-center">{action}</span> : null}
    </span>
  );
}
