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

const ACTION_RADIUS = 40;

const getPolarPosition = (angleDeg: number, radius: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const y = -radius * Math.sin(rad);
  return { x, y };
};

export function PlantQuickActions({ plant }: PlantQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);

  const actions = useMemo(
    () => [
      {
        key: 'watering' as const,
        label: 'REGAR',
        emoji: '💧',
        angle: 90,
        gradient: 'from-[#22c55e] to-[#16a34a]',
        border: 'border-[#bbf7d0]',
        shadow: 'shadow-[0_0_14px_rgba(34,197,94,0.8)]',
        enabled: true,
      },
      {
        key: 'note' as const,
        label: 'NOTA',
        emoji: '📝',
        angle: 0,
        gradient: 'from-[#facc15] to-[#eab308]',
        border: 'border-[#fef08a]',
        shadow: 'shadow-[0_0_14px_rgba(250,204,21,0.9)]',
        enabled: true,
      },
      {
        key: 'photo' as const,
        label: 'FOTO',
        emoji: '📷',
        angle: 180,
        gradient: 'from-[#38bdf8] to-[#0ea5e9]',
        border: 'border-[#bae6fd]',
        shadow: 'shadow-[0_0_14px_rgba(56,189,248,0.8)]',
        enabled: true,
      },
      {
        key: 'insecticide' as const,
        label: 'INSETICIDA',
        emoji: '☠️',
        angle: 270,
        gradient: 'from-[#f97316] to-[#ea580c]',
        border: 'border-[#fed7aa]',
        shadow: 'shadow-[0_0_14px_rgba(249,115,22,0.8)]',
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
      if (hubRef.current?.contains(target)) return;
      if (fabRef.current?.contains(target)) return;
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
    setActiveAction(action);
    setIsOpen(false);
  };

  const closeModals = () => {
    setActiveAction(null);
  };

  return (
    <>
      <button
        type="button"
        ref={fabRef}
        onClick={handleOpen}
        className="absolute bottom-5 right-4 z-20 h-10 w-10 rounded-full bg-transparent text-[#0b1220] flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.5)] border border-transparent hover:scale-105 hover:shadow-[0_0_16px_rgba(34,197,94,0.7)] transition-transform transition-shadow"
        aria-label="Acoes rapidas da planta"
      >
        <img
          src={cannabisIcon}
          alt="Cannabis"
          className="h-[30px] w-[30px] object-contain"
        />
      </button>

      {isOpen && (
        <div
          ref={hubRef}
          className="absolute bottom-16 right-6 z-30"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] border border-pokedex-neon/60 shadow-[0_0_20px_rgba(155,239,0,0.7)] flex items-center justify-center">
            <div className="absolute inset-2 rounded-full border border-pokedex-neon/30 pointer-events-none" />
            <div className="relative z-10 h-9 w-9 rounded-full bg-black/80 border border-pokedex-neon flex items-center justify-center text-pokedex-neon text-lg font-black">
              +
            </div>

            {actions.map((action) => {
              const pos = getPolarPosition(action.angle, ACTION_RADIUS);
              return (
                <button
                  key={action.key}
                  type="button"
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-0.5 bg-gradient-to-r ${action.gradient} text-black text-[10px] font-bold whitespace-nowrap ${action.border} ${action.shadow} ${
                    action.enabled ? 'hover:scale-105 transition-transform' : 'opacity-60 cursor-not-allowed'
                  }`}
                  style={{ transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)` }}
                  onClick={(event) => handleActionClick(event, action.key, action.enabled)}
                  aria-disabled={!action.enabled}
                >
                  <span className="mr-1">{action.emoji}</span>
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <WateringModal
        open={activeAction === 'watering'}
        onClose={closeModals}
        plantId={plant.id}
        plantName={plant.name}
      />

      <NoteModal
        open={activeAction === 'note'}
        onClose={closeModals}
        plantId={plant.id}
        plantName={plant.name}
      />

      <PhotoModal
        open={activeAction === 'photo'}
        onClose={closeModals}
        plantId={plant.id}
        plantName={plant.name}
      />

      <InsecticideModal
        open={activeAction === 'insecticide'}
        onClose={closeModals}
        plantId={plant.id}
        plantName={plant.name}
      />
    </>
  );
}
