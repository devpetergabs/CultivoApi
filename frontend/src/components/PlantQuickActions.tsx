import { useEffect, useMemo, useRef, useState } from 'react';
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

type ExtendedQuickAction = QuickAction | 'inventory';

const ACTION_RADIUS = 46;

const getPolarPosition = (angleDeg: number, radius: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const y = -radius * Math.sin(rad);
  return { x, y };
};

export function PlantQuickActions({ plant }: PlantQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [auraKey, setAuraKey] = useState<ExtendedQuickAction | null>(null);

  const fabRef = useRef<HTMLButtonElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const actions = useMemo(
    () => [
      {
        key: 'watering' as const,
        label: 'REGAR',
        emoji: '💧',
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
        angle: 0,
        gradient: 'from-[#e8c96a] to-[#d7b04d]',
        border: 'border-[#f2e0ad]',
        shadow: 'shadow-[0_0_10px_rgba(232,201,106,0.26)]',
        enabled: true,
      },
      {
        key: 'photo' as const,
        label: 'FOTO',
        emoji: '📷',
        angle: 180,
        gradient: 'from-[#63b7ff] to-[#3d8bdd]',
        border: 'border-[#b5d9ff]',
        shadow: 'shadow-[0_0_10px_rgba(99,183,255,0.26)]',
        enabled: true,
      },
      {
        key: 'insecticide' as const,
        label: 'INSETICIDA',
        emoji: '☠️',
        angle: 270,
        gradient: 'from-[#f39a5c] to-[#df7a3a]',
        border: 'border-[#f6d2b4]',
        shadow: 'shadow-[0_0_10px_rgba(243,154,92,0.26)]',
        enabled: true,
      },
      // BAÚ: ação global (abre inventário). Fica perto do inseticida.
      {
        key: 'inventory' as const,
        label: 'BAÚ',
        emoji: '🧰',
        angle: 315,
        gradient: 'from-[#e7c35a] to-[#d9a441]',
        border: 'border-[#f2e0ad]',
        shadow: 'shadow-[0_0_10px_rgba(231,195,90,0.22)]',
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

  const handleActionClick = (event: React.MouseEvent, action: ExtendedQuickAction, enabled: boolean) => {
    event.stopPropagation();
    if (!enabled) return;

    // Aura arcana: micro-interação curta pra dar feedback de clique.
    setAuraKey(action);
    window.setTimeout(() => setAuraKey((prev) => (prev === action ? null : prev)), 380);

    if (action === 'inventory') {
      window.dispatchEvent(new CustomEvent('pokedex:switch-view', { detail: { view: 'INVENTARIO' } }));
      setIsOpen(false);
      return;
    }

    setActiveAction(action);
    setIsOpen(false);
  };

  const closeModals = () => {
    setActiveAction(null);
  };

  return (
    <>
      {/* Root ancorado: evita “torto” quando o componente cai em um pai não-positionado */}
      <div ref={rootRef} className="absolute bottom-5 right-4 z-30">
        <button
          type="button"
          ref={fabRef}
          onClick={handleOpen}
          className="h-10 w-10 rounded-full bg-transparent text-[#0b1220] flex items-center justify-center shadow-[0_0_10px_rgba(111,191,134,0.26)] border border-transparent hover:scale-105 hover:shadow-[0_0_12px_rgba(111,191,134,0.32)] transition-transform transition-shadow"
          aria-label="Acoes rapidas da planta"
        >
          <img src={cannabisIcon} alt="Cannabis" className="h-[30px] w-[30px] object-contain" />
        </button>

        {isOpen && (
          <div
            ref={hubRef}
            className="absolute bottom-12 right-0 z-40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-[#0b1324] to-[#0a1220] border border-[#6fbf86]/50 shadow-[0_0_14px_rgba(111,191,134,0.26)] flex items-center justify-center">
              <div className="absolute inset-2 rounded-full border border-[#6fbf86]/24 pointer-events-none" />
              <div className="relative z-10 h-9 w-9 rounded-full bg-black/70 border border-[#6fbf86] flex items-center justify-center text-[#6fbf86] text-lg font-semibold">
                +
              </div>

              {actions.map((action) => {
                const pos = getPolarPosition(action.angle, ACTION_RADIUS);
                const aura = auraKey === action.key;

                return (
                  <button
                    key={action.key}
                    type="button"
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-0.5 bg-gradient-to-r ${action.gradient} text-black text-[10px] font-semibold tracking-wide whitespace-nowrap border ${action.border} ${action.shadow} ${
                      action.enabled ? 'hover:scale-105 transition-transform' : 'opacity-60 cursor-not-allowed'
                    } ${aura ? 'ring-2 ring-white/30 shadow-[0_0_18px_rgba(255,255,255,0.18)]' : ''}`}
                    style={{
                      transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                    }}
                    onClick={(event) => handleActionClick(event, action.key, action.enabled)}
                    aria-disabled={!action.enabled}
                  >
                    {aura && (
                      <span
                        className="pointer-events-none absolute -inset-2 rounded-full border border-white/20 bg-white/5 blur-[1px]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="mr-1">{action.emoji}</span>
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