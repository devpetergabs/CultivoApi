import baldeMistico from '../../assets/balde-mistico.png';

interface RegaAditivadaActionProps {
  onClick: () => void;
  isActive?: boolean;
  /** Quando true, há aditivos com estoque zerado — bloqueia a ação com aviso vermelho */
  hasEmpty?: boolean;
  /** Quando true, há aditivos com estoque baixo — realça com âmbar */
  hasLow?: boolean;
}

export function RegaAditivadaAction({
  onClick,
  isActive = true,
  hasEmpty = false,
  hasLow = false,
}: RegaAditivadaActionProps) {
  const blocked = !isActive || hasEmpty;

  const activeRing = hasEmpty
    ? 'ring-2 ring-red-400 bg-red-500/10 shadow-[0_0_12px_rgba(248,113,113,.24)] animate-[pulse_3s_ease-in-out_infinite] opacity-60'
    : hasLow
    ? 'ring-2 ring-amber-300 bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,.20)]'
    : '';

  return (
    <button
      type="button"
      disabled={blocked}
      onClick={blocked ? undefined : onClick}
      title={
        hasEmpty
          ? 'Estoque de aditivo zerado'
          : hasLow
          ? 'Estoque de aditivo baixo'
          : isActive
          ? 'Regar com água aditivada'
          : 'Ação indisponível'
      }
      aria-label="Regar com água aditivada"
      className={[
        // ── blindagem de layout ──────────────────────────────
        'shrink-0 w-9 h-9 rounded-full',
        'flex items-center justify-center',
        'bg-slate-800/40 border border-white/10',
        // ── transição base ───────────────────────────────────
        'transition-all duration-200',
        // ── anel de estado ativo ─────────────────────────────
        isActive ? activeRing : '',
        // ── interatividade / bloqueio ─────────────────────────
        blocked
          ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none'
          : [
              'cursor-pointer',
              'hover:-translate-y-1',
              'hover:ring-2 hover:ring-purple-500/60',
              'hover:border-purple-400/40',
              'hover:bg-purple-500/10',
              'hover:[filter:drop-shadow(0_0_8px_rgba(168,85,247,0.55))]',
              'active:scale-95 active:translate-y-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40',
            ].join(' '),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={baldeMistico}
        alt="Balde místico"
        draggable={false}
        className="w-full h-full object-contain p-0.5 drop-shadow-md"
      />
    </button>
  );
}
