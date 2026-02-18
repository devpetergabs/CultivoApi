import { motion } from 'framer-motion';
import type { Plant } from '../types/pokedex';
import { TypeBadge } from './TypeBadge';
import { PlantQuickActions } from './PlantQuickActions';

interface PlantCardPreviewProps {
  plant: Plant;
  isSelected: boolean;
  onClick: () => void;
}

const calculateAge = (date: string | null) => {
  if (!date) return null;
  
  const parts = date.split('/');
  if (parts.length !== 3) return null;
  
  const germinationDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  if (isNaN(germinationDate.getTime())) return null;
  
  const today = new Date();
  const diffMs = today.getTime() - germinationDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export function PlantCardPreview({ plant, isSelected, onClick }: PlantCardPreviewProps) {
  const age = calculateAge(plant.germinationDate);
  const isEpic = plant.heightCm > 180;
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className={`relative group h-full rounded-xl overflow-hidden transition-all duration-200 cursor-pointer text-left border-2
        ${
          isEpic
            ? 'border-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.5)] ring-2 ring-[#ffd700]/40 bg-gradient-to-br from-[#1f1a0f] to-[#0B1220]'
            : isSelected
            ? 'border-[#9BEF00] shadow-[0_0_20px_rgba(155,239,0,0.4)] ring-2 ring-[#9BEF00]/50 bg-gradient-to-br from-[#111A2E] to-[#0B1220]'
            : 'border-[rgba(255,255,255,0.12)] hover:border-[#9BEF00] hover:shadow-[0_0_15px_rgba(155,239,0,0.3)] bg-gradient-to-br from-[#111A2E]/80 to-[#0B1220]/80'
        }
      `}
    >
      <div className="p-4 h-full flex flex-col pb-6">
        {/* ID Badge - Top Left */}
        <div className="absolute top-3 left-3 bg-black/60 rounded px-2.5 py-1 border border-[#9BEF00] backdrop-blur-sm">
          <span className="text-xs font-black text-[#9BEF00] font-mono">#{plant.id.toString().padStart(3, '0')}</span>
        </div>

        {/* Selection Star - Top Right */}
        {isSelected && (
          <div className="absolute top-3 right-3 text-2xl animate-float">
            ⭐
          </div>
        )}

        {/* Age + Epic Badges - Top Right (age below epic) */}
        {(age !== null || isEpic) && (
          <div className="absolute top-9 right-3 flex flex-col items-end gap-1">
            {isEpic && (
              <div className="bg-gradient-to-r from-[#ffd700] via-[#ffed4e] to-[#ffa500] rounded px-2.5 py-1 border-2 border-[#fff4d6] backdrop-blur-sm shadow-[0_0_15px_rgba(255,215,0,0.6)] animate-pulse">
                <span className="text-[11px] font-black text-[#1a1f2e] font-mono">⭐ ÉPICA</span>
              </div>
            )}

            {age !== null && (
              <div className="bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] rounded px-2.5 py-1 border border-[#93c5fd] backdrop-blur-sm">
                <span className="text-[11px] font-black text-[#dbeafe] font-mono">⏰ {age}d</span>
              </div>
            )}
          </div>
        )}

        {/* Main Image Area */}
        <div className="flex items-center justify-center h-32 mb-3 bg-gradient-to-b from-[#1a1f2e] to-[#0B1220] rounded-lg border border-[#9BEF00]/20 group-hover:border-[#9BEF00]/40 transition-colors">
          <span className="text-5xl drop-shadow-lg group-hover:animate-bounce">{plant.imageUrl}</span>
        </div>

        {/* Plant Name */}
        <h3 className="font-black text-white mb-0.5 text-base line-clamp-2 group-hover:text-[#9BEF00] transition-colors">
          {plant.name}
        </h3>

        {/* Variant */}
        <p className="text-[11px] text-slate-200/80 mb-3 font-mono group-hover:text-[#9BEF00]/70 transition-colors">
          {plant.variant}
        </p>

        {/* Type Badge */}
        <div className="mb-4">
          <TypeBadge type={plant.type} size="md" />
        </div>

        {/* Stats Bar */}
        <div className="flex-1 space-y-2 pt-3 border-t border-[rgba(255,255,255,0.12)]">
          <div className="flex items-center text-[11px]">
            <span className="w-10 text-slate-400 font-bold">LAR</span>
            <div className="flex-1 mx-2 max-w-[225px] h-1.5 bg-[#0B1220]/80 rounded-full overflow-hidden border border-[#9BEF00]/20">
              <div
                className="h-full bg-gradient-to-r from-[#9BEF00] to-[#22c55e] transition-all duration-300"
                style={{ width: `${Math.min((plant.widthCm / 120) * 100, 100) * 0.75}%` }}
              />
            </div>
            <div className="w-16 text-right text-[#9BEF00] font-bold">
              {plant.widthCm}cm
            </div>
          </div>

          <div className="flex items-center text-[11px]">
            <span className="w-10 text-slate-400 font-bold">ALT</span>
            <div className="flex-1 mx-2 max-w-[225px] h-1.5 bg-[#0B1220]/80 rounded-full overflow-hidden border border-[#9BEF00]/20">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  plant.heightCm > 180
                    ? 'bg-gradient-to-r from-[#ffd700] via-[#ffed4e] to-[#ffa500] shadow-[0_0_12px_rgba(255,215,0,0.8)] animate-pulse'
                    : 'bg-gradient-to-r from-[#9BEF00] to-[#22c55e]'
                }`}
                style={{ width: `${Math.min((plant.heightCm / 180) * 100, 100) * 0.75}%` }}
              />
            </div>
            <div
              className={`relative w-16 font-bold ${
                plant.heightCm > 180
                  ? 'text-[#ffd700] font-black drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]'
                  : 'text-[#9BEF00]'
              }`}
            >
              {plant.heightCm > 180 && <span className="absolute left-0">⭐</span>}
              <span className="block text-right">{plant.heightCm}cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Glow Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: isEpic 
            ? 'radial-gradient(circle at 50% 0%, rgba(255, 215, 0, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 0%, rgba(155, 239, 0, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Epic Permanent Glow for Epic Plants */}
      {isEpic && (
        <div className="absolute inset-0 opacity-30 animate-pulse transition-opacity duration-1000 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255, 215, 0, 0.08) 0%, transparent 70%)',
          }}
        />
      )}

      <PlantQuickActions plant={plant} />

    </motion.button>
  );
}
