import type { PlantType } from '../types/pokedex';

interface TypeBadgeProps {
  type: PlantType;
  size?: 'sm' | 'md' | 'lg';
}

const TYPE_CONFIG: Record<PlantType, { bgGradient: string; borderColor: string; emoji: string; label: string }> = {
  GERMINACAO: { bgGradient: 'from-blue-600/40 to-blue-700/40', borderColor: 'border-blue-500', emoji: '🌱', label: 'Germinação' },
  VEGETATIVO: { bgGradient: 'from-green-600/40 to-green-700/40', borderColor: 'border-green-500', emoji: '🌿', label: 'Vegetativo' },
  FLORACAO_INICIAL: { bgGradient: 'from-pink-600/40 to-pink-700/40', borderColor: 'border-pink-500', emoji: '🌸', label: 'Floração Inicial' },
  FLORACAO_AVANCADA: { bgGradient: 'from-red-600/40 to-red-700/40', borderColor: 'border-red-500', emoji: '🌷', label: 'Floração Avançada' },
};

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <span
      className={`inline-flex items-center font-black uppercase tracking-wide rounded-lg border-2 ${config.borderColor} bg-gradient-to-r ${config.bgGradient} text-white ${sizeClasses[size]} transition-all hover:scale-105 shadow-[0_0_8px_rgba(155,239,0,0.1)]`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
