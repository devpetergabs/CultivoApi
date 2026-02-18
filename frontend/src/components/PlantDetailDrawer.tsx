import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import type { Plant } from '../types/pokedex';
import { TypeBadge } from './TypeBadge';
import { StatBar } from './StatBar';
import { usePokedexStore } from '../store/pokedexStore';

interface PlantDetailDrawerProps {
  plant: Plant | null;
  allPlants: Plant[];
  onClose: () => void;
}

export function PlantDetailDrawer({ plant, allPlants, onClose }: PlantDetailDrawerProps) {
  const { setSelectedPlant } = usePokedexStore();

  // Keyboard navigation
  useEffect(() => {
    if (!plant) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        const currentIndex = allPlants.findIndex((p) => p.id === plant.id);
        if (currentIndex < allPlants.length - 1) {
          setSelectedPlant(allPlants[currentIndex + 1].id);
        }
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = allPlants.findIndex((p) => p.id === plant.id);
        if (currentIndex > 0) {
          setSelectedPlant(allPlants[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [plant, allPlants, setSelectedPlant, onClose]);

  if (!plant) return null;

  const currentIndex = allPlants.findIndex((p) => p.id === plant.id);
  const canGoNext = currentIndex < allPlants.length - 1;
  const canGoPrev = currentIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setSelectedPlant(allPlants[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setSelectedPlant(allPlants[currentIndex - 1].id);
    }
  };

  // Calculate age in days from germination date
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

  // Format date - converts DD/MM/YYYY to valid Date
  const formatDate = (date: string | null) => {
    if (!date) return '⚠️ UNDEF';
    
    // Parse DD/MM/YYYY format
    const parts = date.split('/');
    if (parts.length !== 3) return '⚠️ INVÁLIDA';
    
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (isNaN(d.getTime())) return '⚠️ INVÁLIDA';
    
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      {/* Drawer - slides from right with Pokédex styling */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full md:w-[520px] z-50 overflow-y-auto border-l-4 border-[#9BEF00]/50 bg-gradient-to-b from-[#111A2E] to-[#0B1220] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-[#E23A3A] to-[#c92a2a] border-b-4 border-[#9BEF00] px-6 py-4 flex justify-between items-center shadow-lg">
          <h2 className="text-lg font-black text-white uppercase tracking-widest">📊 POKÉDEX</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-[#9BEF00] text-3xl transition-colors font-black"
            aria-label="Fechar"
          >
            ⊕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ID and Name */}
          <div className="space-y-3">
            <div className="text-xs font-black text-[#9BEF00]/70 font-mono uppercase tracking-wider">
              #{plant.id.toString().padStart(3, '0')} — POKÉDEX
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {plant.name}
            </h1>
            <TypeBadge type={plant.type} size="lg" />
          </div>

          {/* Image Area - Large display */}
          <div className="rounded-xl p-8 border-2 border-[#9BEF00]/40 bg-gradient-to-b from-[#1a1f2e] to-[#0B1220] text-center shadow-[0_0_20px_rgba(155,239,0,0.15)]">
            <div className="text-8xl animate-float drop-shadow-xl" style={{ textShadow: '0 0 30px rgba(155, 239, 0, 0.4)' }}>
              {plant.imageUrl}
            </div>
          </div>

          {/* Stats Section */}
          <div className={`space-y-4 rounded-xl p-5 border-2 backdrop-blur-sm ${
            plant.heightCm > 180 
              ? 'border-[#ffd700] bg-gradient-to-br from-[#1f1a0f]/70 to-[#111A2E]/60 shadow-[0_0_20px_rgba(255,215,0,0.3)]' 
              : 'border-[#9BEF00]/30 bg-[#111A2E]/60'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-black uppercase tracking-wider ${
                plant.heightCm > 180 ? 'text-[#ffd700]' : 'text-[#9BEF00]'
              }`}>
                📏 DIMENSÕES {plant.heightCm > 180 && '⭐'}
              </h3>
              {plant.heightCm > 180 && (
                <span className="text-[10px] font-black text-[#ffd700] bg-[#1f1a0f] px-2 py-1 rounded-full border border-[#ffd700] animate-pulse">
                  PLANTA ÉPICA
                </span>
              )}
            </div>
            <div className="space-y-3">
              <StatBar label="ALTURA" value={plant.heightCm} max={180} color="blue" />
              <StatBar label="LARGURA" value={plant.widthCm} max={120} color="green" />
              <StatBar label="CAULE" value={plant.stemWidthCm} max={25} color="yellow" />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3 rounded-xl p-5 border-2 border-[#9BEF00]/30 bg-[#111A2E]/60 backdrop-blur-sm">
            <h3 className="text-xs font-black text-[#9BEF00] uppercase tracking-wider">📋 DETALHES</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(155,239,0,0.2)]">
                <div className="text-xs text-[#9BEF00]/60 font-bold uppercase">VARIANTE</div>
                <div className="font-black text-white mt-2">{plant.variant}</div>
              </div>
              <div className="p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(155,239,0,0.2)]">
                <div className="text-xs text-[#9BEF00]/60 font-bold uppercase">VASO</div>
                <div className="font-black text-white mt-2">{plant.potLiters}L</div>
              </div>
              <div className="col-span-2 p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(155,239,0,0.2)]">
                <div className="text-xs text-[#9BEF00]/60 font-bold uppercase">GERMINAÇÃO</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="font-mono text-[#9BEF00] font-black">{formatDate(plant.germinationDate)}</div>
                  <div className="text-right">
                    <div className="text-xs text-[#9BEF00]/60 font-bold">IDADE</div>
                    <div className="font-black text-white text-lg">{calculateAge(plant.germinationDate) !== null ? `${calculateAge(plant.germinationDate)}d` : '⚠️'}</div>
                  </div>
                </div>
              </div>

              {/* Optional Breeding Info */}
              {(plant.sexo || plant.dataSexagem || plant.dataFloracao) && (
                <>
                  {plant.sexo && (
                    <div className="p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(155,239,0,0.2)]">
                      <div className="text-xs text-[#9BEF00]/60 font-bold uppercase">SEXO</div>
                      <div className={`font-black mt-2 ${plant.sexo === 'FEMEA' ? 'text-pink-400' : plant.sexo === 'MACHO' ? 'text-blue-400' : 'text-yellow-400'}`}>
                        {plant.sexo === 'FEMEA' ? '♀ Fêmea' : plant.sexo === 'MACHO' ? '♂ Macho' : '⚥ Hermafrodita'}
                      </div>
                    </div>
                  )}
                  {plant.dataSexagem && (
                    <div className="p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(155,239,0,0.2)]">
                      <div className="text-xs text-[#9BEF00]/60 font-bold uppercase">SEXAGEM</div>
                      <div className="font-mono text-white font-black mt-2 text-sm">{formatDate(plant.dataSexagem)}</div>
                    </div>
                  )}
                  {plant.dataFloracao && (
                    <div className="col-span-2 p-3 bg-[#0B1220]/80 rounded-lg border border-[rgba(155,239,0,0.2)]">
                      <div className="text-xs text-[#9BEF00]/60 font-bold uppercase">🌸 INÍCIO DA FLORAÇÃO</div>
                      <div className="font-mono text-[#9BEF00] font-black mt-2">{formatDate(plant.dataFloracao)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Grower Card */}
          <div className="space-y-3 rounded-xl p-5 border-2 border-[#9BEF00]/50 bg-gradient-to-br from-[#111A2E]/80 to-[#0B1220]/50 shadow-[0_0_15px_rgba(155,239,0,0.15)]">
            <h3 className="text-xs font-black text-[#9BEF00] uppercase tracking-wider">👨‍🌾 CULTIVADOR</h3>
            <div className="space-y-2">
              <div className="font-black text-white text-lg">{plant.growerName}</div>
              {plant.growerPhone && (
                <div className="text-[#9BEF00] font-mono text-sm font-bold">📱 {plant.growerPhone}</div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3 border-t border-[rgba(255,255,255,0.12)] pt-5">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`py-3 rounded-lg font-black uppercase tracking-wide transition-all text-sm border-2 ${
                canGoPrev
                  ? 'bg-[#E23A3A] text-white border-[#E23A3A] hover:bg-[#c92a2a] shadow-[0_0_15px_rgba(226,58,58,0.3)]'
                  : 'bg-[#0B1220]/60 text-slate-500 border-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              ← ANTE
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`py-3 rounded-lg font-black uppercase tracking-wide transition-all text-sm border-2 ${
                canGoNext
                  ? 'bg-[#E23A3A] text-white border-[#E23A3A] hover:bg-[#c92a2a] shadow-[0_0_15px_rgba(226,58,58,0.3)]'
                  : 'bg-[#0B1220]/60 text-slate-500 border-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              PRÓX →
            </button>
          </div>

          {/* Keyboard hints */}
          <div className="text-xs text-[#9BEF00]/40 text-center space-y-1 pb-4 font-mono border-t border-[rgba(255,255,255,0.12)] pt-4">
            <div className="font-bold text-[#9BEF00]/60">[ESC] FECHAR | [←→] NAVEGAR</div>
            <div className="text-[#9BEF00]/30">
              {currentIndex + 1} / {allPlants.length}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

