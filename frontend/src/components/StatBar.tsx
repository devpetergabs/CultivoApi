interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: 'green' | 'blue' | 'red' | 'purple' | 'yellow' | 'gold';
}

const COLOR_MAP = {
  green: 'from-[#9BEF00] to-[#22c55e]',
  blue: 'from-[#3b82f6] to-[#1d4ed8]',
  red: 'from-[#ef4444] to-[#dc2626]',
  purple: 'from-[#a855f7] to-[#7c3aed]',
  yellow: 'from-[#fbbf24] to-[#f59e0b]',
  gold: 'from-[#ffd700] via-[#ffed4e] to-[#ffa500]',
};

export function StatBar({ label, value, max = 100, color = 'blue' }: StatBarProps) {
  const percentage = (value / max) * 100;
  const isOver = value > max;
  const displayColor = isOver ? 'gold' : color;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</span>
        <span className={`text-sm font-black ${isOver ? 'text-[#ffd700] animate-pulse drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : 'text-[#9BEF00]'}`}>
          {Math.round(value)} {isOver && '⭐ ÉPICA'}
        </span>
      </div>
      <div className="w-full bg-[#0B1220]/60 rounded-full overflow-visible h-3 border border-[rgba(155,239,0,0.2)]">
        <div
          className={`h-full bg-gradient-to-r ${COLOR_MAP[displayColor]} transition-all duration-300 rounded-full ${isOver ? 'shadow-[0_0_20px_rgba(255,215,0,0.9)] animate-pulse' : 'shadow-[0_0_10px_rgba(155,239,0,0.3)]'}`}
          style={{ width: `${Math.min(percentage, 120)}%` }}
        />
      </div>
    </div>
  );
}
