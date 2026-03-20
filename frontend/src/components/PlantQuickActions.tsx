import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { InsecticideModal } from './InsecticideModal';
import { NoteModal } from './NoteModal';
import { PhotoModal } from './PhotoModal';
import { WateringModal } from './WateringModal';
import type { Plant } from '../types/pokedex';
import cannabisIcon from '../assets/botao-cannabis-main.png';

interface PlantQuickActionsProps {
  plant: Plant;
}

type QuickAction = 'watering' | 'photo' | 'note' | 'insecticide';

const ACTION_RADIUS = 38;

const getPolarPosition = (angleDeg: number, radius: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const y = -radius * Math.sin(rad);
  return { x, y };
};

export function PlantQuickActions({ plant }: PlantQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [auraKey, setAuraKey] = useState<QuickAction | null>(null);
  const [hoveredAction, setHoveredAction] = useState<QuickAction | null>(null);

  const fabRef = useRef<HTMLButtonElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const actions = useMemo(
    () => [
      {
        key: 'watering' as const,
        label: 'REGAR',
        emoji: '💧',
        icon: null as ReactNode,
        angle: 90,
        gradient: 'from-[#6fbf86] to-[#3f6f57]',
        border: 'border-[#b7dfc5]',
        shadow: 'shadow-[0_0_10px_rgba(111,191,134,0.26)]',
        enabled: true,
      },
      {
        key: 'note' as const,
        label: 'NOTA',
        emoji: '📝',
        icon: null as ReactNode,
        angle: 0,
        gradient: 'from-[#e8c96a] to-[#d7b04d]',
        border: 'border-[#f2e0ad]',
        shadow: 'shadow-[0_0_10px_rgba(232,201,106,0.26)]',
        enabled: true,
      },
      {
        key: 'photo' as const,
        label: 'DOCTOR P.',
        emoji: '',
        icon: null as ReactNode,
        angle: 180,
        gradient: 'from-[#63b7ff] to-[#3d8bdd]',
        border: 'border-[#b5d9ff]',
        shadow: 'shadow-[0_0_10px_rgba(99,183,255,0.26)]',
        enabled: true,
      },
      {
        key: 'insecticide' as const,
        label: 'SINAL DE PRAGA',
        emoji: '🐛',
        icon: null as ReactNode,
        angle: 270,
        gradient: 'from-[#f39a5c] to-[#df7a3a]',
        border: 'border-[#f6d2b4]',
        shadow: 'shadow-[0_0_10px_rgba(243,154,92,0.26)]',
        enabled: true,
      },
    ],
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      // Clique dentro do root (FAB + Hub) não fecha.
      if (rootRef.current?.contains(target)) return;

      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const handleOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleActionClick = (event: React.MouseEvent, action: QuickAction, enabled: boolean) => {
    event.stopPropagation();
    if (!enabled) return;

    // Aura arcana: micro-interação curta pra dar feedback de clique.
    setAuraKey(action);
    window.setTimeout(() => setAuraKey((prev) => (prev === action ? null : prev)), 380);

    setActiveAction(action);
    setIsOpen(false);
  };

  const closeModals = () => {
    setActiveAction(null);
  };

  return (
    <>
      {/* Backdrop: blurs card content behind the hub when open */}
      {isOpen && (
        <div
          className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] rounded-xl pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Root ancorado: evita "torto" quando o componente cai em um pai não-positionado */}
      <div ref={rootRef} className="absolute bottom-2 right-2 z-30">
        <button
          type="button"
          ref={fabRef}
          onClick={handleOpen}
          className="h-9 w-9 rounded-full bg-transparent text-[#0b1220] flex items-center justify-center shadow-[0_0_10px_rgba(111,191,134,0.26)] border border-transparent hover:scale-105 hover:shadow-[0_0_12px_rgba(111,191,134,0.32)] transition-transform transition-shadow"
          aria-label="Acoes rapidas da planta"
        >
          <img src={cannabisIcon} alt="Cannabis" className="h-[28px] w-[28px] object-contain" />
        </button>

        {isOpen && (
          <div
            ref={hubRef}
            className="absolute bottom-12 right-8 z-50"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#0b1324] to-[#0a1220] border border-[#6fbf86]/50 shadow-[0_0_22px_rgba(111,191,134,0.38)] animate-[pulse_3s_ease-in-out_infinite] flex items-center justify-center">
              {/* spinning dashed outer ring */}
              <div className="pointer-events-none absolute -inset-[5px] rounded-full border-2 border-dashed border-[#6fbf86]/30 animate-[spin_10s_linear_infinite]" />
              {/* inner soft ring */}
              <div className="absolute inset-2 rounded-full border border-[#6fbf86]/20 pointer-events-none" />
              {/* center: cannabis icon with glow */}
              <button
                type="button"
                onClick={handleOpen}
                className="relative z-10 h-10 w-10 rounded-full bg-black/60 border border-[#6fbf86]/70 flex items-center justify-center shadow-[0_0_14px_rgba(111,191,134,0.45)] hover:shadow-[0_0_20px_rgba(111,191,134,0.65)] transition-shadow duration-200"
                aria-label="Fechar menu"
              >
                <img src={cannabisIcon} alt="" className="h-6 w-6 object-contain drop-shadow-[0_0_4px_rgba(111,191,134,0.8)]" />
              </button>

              {actions.map((action) => {
                const pos = getPolarPosition(action.angle, ACTION_RADIUS);
                const aura = auraKey === action.key;
                const isHovered = hoveredAction === action.key;
                const isSibling = hoveredAction !== null && hoveredAction !== action.key;

                return (
                  <button
                    key={action.key}
                    type="button"
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-0.5 bg-gradient-to-r ${action.gradient} text-black text-[10px] font-semibold tracking-wide whitespace-nowrap border ${action.border} ${
                      !action.enabled ? 'opacity-40 cursor-not-allowed' : ''
                    } ${aura ? 'ring-2 ring-white/30' : ''}`}
                    style={{
                      transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${
                        isHovered ? 1.12 : isSibling ? 0.92 : 1
                      })`,
                      filter: isHovered
                        ? 'brightness(1.15) drop-shadow(0 0 6px currentColor)'
                        : isSibling
                        ? 'brightness(0.55) grayscale(0.3)'
                        : 'brightness(0.7) grayscale(0.4)',
                      opacity: isHovered ? 1 : isSibling ? 0.45 : 0.65,
                      transition: 'transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease',
                    }}
                    onMouseEnter={() => action.enabled && setHoveredAction(action.key)}
                    onMouseLeave={() => setHoveredAction(null)}
                    onClick={(event) => handleActionClick(event, action.key as QuickAction, action.enabled)}
                    aria-disabled={!action.enabled}
                  >
                    {aura && (
                      <span
                        className="pointer-events-none absolute -inset-2 rounded-full border border-white/20 bg-white/5 blur-[1px]"
                        aria-hidden="true"
                      />
                    )}
                    {!!(action.icon ?? action.emoji) && <span className="mr-1 inline-flex items-center justify-center">{action.icon ?? action.emoji}</span>}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <WateringModal
        open={activeAction === 'watering'}
        onClose={closeModals}
        plantId={plant.id}
        plantName={plant.name}
        plantStage={plant.type}
      />

      <NoteModal open={activeAction === 'note'} onClose={closeModals} plantId={plant.id} plantName={plant.name} />

      <PhotoModal open={activeAction === 'photo'} onClose={closeModals} plantId={plant.id} plantName={plant.name} />

      <InsecticideModal open={activeAction === 'insecticide'} onClose={closeModals} plantId={plant.id} plantName={plant.name} />
    </>
  );
}