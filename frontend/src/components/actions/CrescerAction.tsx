interface CrescerActionProps {
  onClick: () => void;
  isActive?: boolean;
}

export function CrescerAction({ onClick, isActive = true }: CrescerActionProps) {
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <button
        type="button"
        disabled={!isActive}
        onClick={isActive ? onClick : undefined}
        title={isActive ? 'Registrar crescimento' : 'Ação indisponível'}
        aria-label="Registrar crescimento"
        className={[
          'relative w-9 h-9 rounded-full flex items-center justify-center',
          'bg-black/60 border border-[#6fbf86]/40',
          'transition-all duration-200',
          isActive
            ? [
                'cursor-pointer',
                'hover:shadow-[0_0_14px_rgba(111,191,134,0.5)]',
                'hover:border-[#6fbf86]/80',
                'hover:scale-110',
                'active:scale-95',
              ].join(' ')
            : 'opacity-40 grayscale cursor-not-allowed pointer-events-none',
        ].join(' ')}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 text-[#6fbf86] drop-shadow-[0_0_4px_rgba(111,191,134,0.7)]"
          aria-hidden="true"
        >
          <path d="M12 3l-7 8h4.5v10h5V11H19L12 3z" />
        </svg>
      </button>
    </div>
  );
}
