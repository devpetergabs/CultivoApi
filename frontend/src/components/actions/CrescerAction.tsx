interface CrescerActionProps {
  onClick: () => void;
  isActive?: boolean;
}

export function CrescerAction({ onClick, isActive = true }: CrescerActionProps) {
  return (
    <button
      type="button"
      disabled={!isActive}
      onClick={isActive ? onClick : undefined}
      title={isActive ? 'Registrar crescimento' : 'Ação indisponível'}
      aria-label="Registrar crescimento"
      className={[
        'shrink-0 flex flex-col items-center justify-center gap-0.5',
        'w-12 rounded-lg px-1 py-2',
        'bg-[#232d3a] border border-[#e7c35a]/30',
        'transition-all duration-200',
        isActive
          ? [
              'cursor-pointer text-[#e7c35a]',
              'hover:-translate-y-0.5',
              'hover:border-[#e7c35a]/60',
              'hover:shadow-[0_0_10px_rgba(231,195,90,0.25)]',
              'hover:bg-[#2b3a4f]',
              'active:scale-95',
            ].join(' ')
          : 'opacity-40 grayscale cursor-not-allowed pointer-events-none text-[#e7c35a]',
      ].join(' ')}
    >
      <span className="text-base leading-none">↑</span>
      <span className="text-[9px] font-black uppercase tracking-widest leading-none">Crescer</span>
    </button>
  );
}
