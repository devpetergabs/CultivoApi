import { useState } from 'react';
import type { PlantType } from '../types/pokedex';
import cauleImg from '../assets/caule.png';

interface PokedexFiltersBarProps {
  plantsCount: number;

  searchQuery: string;
  onSearchChange: (query: string) => void;

  selectedType: PlantType | null;
  onTypeChange: (type: PlantType | null) => void;

  sortBy: 'id' | 'widthCm' | 'heightCm' | 'stemWidthCm';
  onSortChange: (sort: 'id' | 'widthCm' | 'heightCm' | 'stemWidthCm') => void;

  hideCannabis: boolean;
  onHideCannabisChange: (hide: boolean) => void;

  onOpenBulkInsecticide: () => void;
}

const STAGES: PlantType[] = [
  'GERMINACAO',
  'VEGETATIVO',
  'FLORACAO_INICIAL',
  'FLORACAO_MEDIA',
  'FLORACAO_AVANCADA',
  'FINALIZACAO',
];

const STAGE_CONFIG: Record<string, { emoji?: string; label: string; selectedClasses: string }> = {
  GERMINACAO: {
    emoji: '🌱',
    label: 'Germinação',
    selectedClasses: 'bg-blue-500/15 border-blue-300/40 text-blue-100',
  },
  VEGETATIVO: {
    emoji: '🍃',
    label: 'Vegetativo',
    selectedClasses: 'bg-emerald-500/15 border-emerald-300/40 text-emerald-100',
  },
  FLORACAO_INICIAL: {
    emoji: '🌸',
    label: 'Floração Inicial',
    selectedClasses: 'bg-rose-500/15 border-rose-300/40 text-rose-100',
  },
  FLORACAO_MEDIA: {
    emoji: '🌺',
    label: 'Floração Média',
    selectedClasses: 'bg-fuchsia-500/15 border-fuchsia-300/40 text-fuchsia-100',
  },
  FLORACAO_AVANCADA: {
    emoji: '🌼',
    label: 'Floração Avançada',
    selectedClasses: 'bg-amber-500/15 border-amber-300/40 text-amber-100',
  },
  FINALIZACAO: {
    emoji: '🧼',
    label: 'Finalização',
    selectedClasses: 'bg-slate-500/15 border-slate-300/40 text-slate-100',
  },
};

export function PokedexFiltersBar({
  plantsCount,
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortChange,
  hideCannabis,
  onHideCannabisChange,
  onOpenBulkInsecticide,
}: PokedexFiltersBarProps) {
  // 🔒 Requisito: filtros sempre começam desativados ao abrir a tela.
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="sticky top-0 z-50 isolate pokedex-card-frame p-5 space-y-4 border-cyan-500/20">
      {/*
        Sticky HUD (filtros) precisa ficar SEMPRE acima dos cards.
        Os badges dos cards usam z-index alto; sem isso, eles "furam" o painel ao rolar.
      */}

      {/* ===== AÇÕES (sempre visível) ===== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-[#8FD6A4] uppercase tracking-[0.06em]">⚡ Ações</div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-panel-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-slate-200 hover:border-neon-green/40 transition-colors duration-200"
            title={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          >
            {showFilters ? '🧩 Ocultar filtros' : '🧩 Mostrar filtros'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-700 bg-panel-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#8FD6A4]">
            ENCONTRADO: <span className="text-[#7BD389] font-semibold">{plantsCount}</span>
          </div>

          <button
            type="button"
            onClick={onOpenBulkInsecticide}
            disabled={plantsCount === 0}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 ${
              plantsCount === 0
                ? 'bg-slate-800/30 text-slate-500 border-slate-700 cursor-not-allowed opacity-70'
                : 'bg-amber-500/15 text-amber-200 border-amber-400/30 hover:border-amber-300/60 hover:bg-amber-500/20'
            }`}
            title="Aplicar inseticida em várias plantas (lote)"
          >
            🛡️ Inseticida (lote)
          </button>
        </div>
      </div>

      {/* ===== FILTROS (colapsável) ===== */}
      {showFilters && (
        <div className="space-y-4">
          {/* Buscar */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#8FD6A4] uppercase tracking-[0.06em]">🔍 Buscar Pokédex</label>
            <input
              type="text"
              placeholder="Nome, ID ou strain..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-panel-navy border-2 border-panel-navy rounded-lg px-4 py-3 text-white placeholder-slate-500 
                focus:outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/30
                font-medium transition-all duration-200 shadow-[0_6px_18px_rgba(9,15,25,0.35)]"
            />
          </div>

          {/* Estágio */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#8FD6A4] uppercase tracking-[0.06em]">🌱 Filtrar por Estágio</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onTypeChange(null)}
                aria-pressed={selectedType === null}
                className={`inline-flex items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-navy ${
                  selectedType === null
                    ? 'bg-neon-green/20 text-neon-green border-neon-green/50 shadow-neon'
                    : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-neon-green/40'
                }`}
              >
                Todos
              </button>

              {STAGES.map((stage) => {
                const config = STAGE_CONFIG[stage];
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => onTypeChange(selectedType === stage ? null : stage)}
                    title={config.label}
                    aria-label={config.label}
                    aria-pressed={selectedType === stage}
                    className={`inline-flex items-center gap-2 rounded-full border text-sm font-medium transition-colors duration-200 px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-navy ${
                      selectedType === stage
                        ? `${config.selectedClasses} shadow-neon`
                        : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">
                      {config.emoji}
                    </span>
                    <span className="hidden sm:inline text-xs whitespace-nowrap">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ordenar */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#8FD6A4] uppercase tracking-[0.06em]">📊 Ordenar por</label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onSortChange('id')}
                aria-pressed={sortBy === 'id'}
                className={`inline-flex items-center gap-2 rounded-full border text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 px-3 py-1.5 ${
                  sortBy === 'id'
                    ? 'bg-neon-green/20 text-neon-green border-neon-green/50 shadow-neon'
                    : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-neon-green/40'
                }`}
              >
                🆔 <span className="hidden sm:inline">ID</span>
              </button>

              <button
                type="button"
                onClick={() => onSortChange('widthCm')}
                aria-pressed={sortBy === 'widthCm'}
                className={`inline-flex items-center gap-2 rounded-full border text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 px-3 py-1.5 ${
                  sortBy === 'widthCm'
                    ? 'bg-neon-green/20 text-neon-green border-neon-green/50 shadow-neon'
                    : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-neon-green/40'
                }`}
              >
                ↔️ <span className="hidden sm:inline">LARG</span>
              </button>

              <button
                type="button"
                onClick={() => onSortChange('heightCm')}
                aria-pressed={sortBy === 'heightCm'}
                className={`inline-flex items-center gap-2 rounded-full border text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 px-3 py-1.5 ${
                  sortBy === 'heightCm'
                    ? 'bg-neon-green/20 text-neon-green border-neon-green/50 shadow-neon'
                    : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-neon-green/40'
                }`}
              >
                ↕️ <span className="hidden sm:inline">ALT</span>
              </button>

              <button
                type="button"
                onClick={() => onSortChange('stemWidthCm')}
                aria-pressed={sortBy === 'stemWidthCm'}
                className={`inline-flex items-center gap-2 rounded-full border text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 px-3 py-1.5 ${
                  sortBy === 'stemWidthCm'
                    ? 'bg-yellow-900/20 text-yellow-200 border-yellow-700/50 shadow-neon'
                    : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-yellow-700/40'
                }`}
              >
                <img src={cauleImg} alt="Caule" className="w-5 h-5 rounded-full object-cover" />
                <span className="hidden sm:inline">CAULE</span>
              </button>
            </div>
          </div>

          {/* Espécies */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#8FD6A4] uppercase tracking-[0.06em]">🧬 Espécies</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onHideCannabisChange(!hideCannabis)}
                aria-pressed={hideCannabis}
                className={`inline-flex items-center gap-2 rounded-full border text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 px-3 py-1.5 ${
                  hideCannabis
                    ? 'bg-rose-500/15 text-rose-100 border-rose-300/40 shadow-neon'
                    : 'bg-panel-navy text-slate-200 border-slate-700 hover:border-rose-300/40'
                }`}
                title={hideCannabis ? 'Mostrar Cannabis' : 'Ocultar Cannabis'}
              >
                {hideCannabis ? '🙈 Mostrar Cannabis' : '🌿 Ocultar Cannabis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contador mobile */}
      <div className="text-center pt-2 border-t border-slate-700/70 sm:hidden">
        <span className="text-sm font-semibold text-[#8FD6A4]">
          ENCONTRADO: <span className="text-[#7BD389] font-semibold">{plantsCount}</span>
        </span>
      </div>
    </div>
  );
}
