interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: 'green' | 'blue' | 'red' | 'purple' | 'yellow' | 'gold';
}

const COLOR_MAP = {
  green: 'from-[#6fbf86] to-[#3f6f57]',
  blue: 'from-[#5aa6ff] to-[#3b7bdd]',
  red: 'from-[#ef4444] to-[#dc2626]',
  purple: 'from-[#a855f7] to-[#7c3aed]',
  yellow: 'from-[#e8c96a] to-[#d7b04d]',
  gold: 'from-[#e7c35a] via-[#f2dd9b] to-[#d9a441]',
};

export function StatBar({ label, value, max = 100, color = 'blue' }: StatBarProps) {
  const percentage = (value / max) * 100;
  const isOver = value > max;
  const displayColor = isOver ? 'gold' : color;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium uppercase tracking-[0.06em] text-slate-300">{label}</span>
        <span className={`text-sm font-semibold ${isOver ? 'text-[#e7c35a]' : 'text-[#6fbf86]'}`}>
          {Math.round(value)} {isOver && '⭐ ÉPICA'}
        </span>
      </div>
      <div className="w-full bg-[#0B1220]/60 rounded-full overflow-visible h-3 border border-slate-700/60">
        <div
          className={`h-full bg-gradient-to-r ${COLOR_MAP[displayColor]} transition-all duration-300 rounded-full ${isOver ? 'shadow-[0_0_8px_rgba(231,195,90,0.36)]' : 'shadow-[0_0_6px_rgba(111,191,134,0.16)]'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
