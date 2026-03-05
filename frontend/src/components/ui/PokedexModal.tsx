import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PokedexModalProps {
  open: boolean;
  onClose: () => void;
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  /** Tailwind width/max-width classes. Default: 'w-full max-w-md' */
  widthClass?: string;
  /** Slot rendered between the title area and the Fechar button */
  headerActions?: ReactNode;
  /**
   * Overrides the default ESC behaviour (which calls onClose).
   * Useful when a child overlay (e.g. toolbox) should absorb ESC first.
   */
  onEscape?: () => void;
  children: ReactNode;
}

export function PokedexModal({
  open,
  onClose,
  title,
  subtitle,
  widthClass = 'w-full max-w-md',
  headerActions,
  onEscape,
  children,
}: PokedexModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onEscape ? onEscape() : onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onEscape]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${widthClass} rounded-2xl bg-[#080B14] border border-white/5 shadow-2xl overflow-y-auto max-h-[90vh]`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all duration-150"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
