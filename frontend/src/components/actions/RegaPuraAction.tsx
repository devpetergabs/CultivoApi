import baldeAgua from '../../assets/balde-agua.png';

interface RegaPuraActionProps {
  onClick: () => void;
  isActive?: boolean;
}

export function RegaPuraAction({ onClick, isActive = true }: RegaPuraActionProps) {
  return (
    <button
      type="button"
      disabled={!isActive}
      onClick={isActive ? onClick : undefined}
      title={isActive ? 'Regar com água pura' : 'Ação indisponível'}
      aria-label="Regar com água pura"
      className={[
        // ── blindagem de layout ──────────────────────────────
        'shrink-0 w-9 h-9 rounded-full',
        'flex items-center justify-center',
        'bg-slate-800/40 border border-white/10',
        // ── transição base ───────────────────────────────────
        'transition-all duration-200',
        // ── estado condicional ───────────────────────────────
        isActive
          ? [
              'cursor-pointer',
              'hover:-translate-y-1',
              'hover:ring-2 hover:ring-blue-500/60',
              'hover:border-blue-400/40',
              'hover:bg-blue-500/10',
              'hover:[filter:drop-shadow(0_0_8px_rgba(59,130,246,0.5))]',
              'active:scale-95 active:translate-y-0',
            ].join(' ')
          : [
              'opacity-40 grayscale cursor-not-allowed pointer-events-none',
            ].join(' '),
      ].join(' ')}
    >
      <img
        src={baldeAgua}
        alt="Balde de água"
        draggable={false}
        className="w-full h-full object-contain p-0.5 drop-shadow-md"
      />
    </button>
  );
}
