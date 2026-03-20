import { useEffect, useMemo, useState } from 'react';
import type { CodexEstagio } from '../types';
import type { Plant } from '../types/pokedex';
import { apiService } from '../services/api';
import { StageCodexModal } from './StageCodexModal';

interface StageCodexViewProps {
  plant: Plant | null;
}

export function StageCodexView({ plant }: StageCodexViewProps) {
  const [entries, setEntries] = useState<CodexEstagio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CodexEstagio | null>(null);

  useEffect(() => {
    if (!plant) {
      setEntries([]);
      setError(null);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiService.getPlantaCodexEstagios(plant.id);
        setEntries(data);
      } catch (err) {
        console.error('Erro ao carregar codex da planta:', err);
        setError('Não foi possível carregar o compêndio de estágios.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [plant?.id]);

  const unlockedCount = useMemo(() => entries.filter((entry) => entry.desbloqueado).length, [entries]);

  if (!plant) {
    return (
      <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Nenhuma planta disponível para carregar o compêndio de estágios.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
      <div className="rounded-2xl border border-[#6fbf86]/20 bg-gradient-to-b from-[#101a2b] to-[#0b1220] p-5 shadow-[0_0_18px_rgba(111,191,134,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Compêndio de Estágios</h2>
            <p className="mt-1 text-sm text-[#a7e5b2]">Leitura gamificada da jornada de {plant.name}.</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Cada estágio funciona como um personagem desbloqueável: muda o tom do manejo, revela riscos e ensina o que observar.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Desbloqueados</div>
            <div className="mt-1 text-lg font-semibold text-white">{unlockedCount}/{entries.length}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="text-sm text-slate-400">Carregando compêndio…</div>
        ) : error ? (
          <div className="text-sm text-red-300">{error}</div>
        ) : !entries.length ? (
          <div className="text-sm text-slate-400">Nenhum estágio disponível no compêndio.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => {
              const tone = entry.atual
                ? 'border-[#6fbf86]/45 bg-[#6fbf86]/10 shadow-[0_0_16px_rgba(111,191,134,0.10)]'
                : entry.desbloqueado
                  ? 'border-sky-300/25 bg-sky-300/5'
                  : 'border-white/10 bg-white/5 opacity-75';

              return (
                <button
                  key={entry.estagio}
                  type="button"
                  onClick={() => setSelectedEntry(entry)}
                  className={`rounded-2xl border p-4 text-left transition-all hover:border-[#6fbf86]/50 hover:bg-white/8 ${tone}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Estágio {entry.ordemDesbloqueio}</div>
                      <h3 className="mt-1 text-lg font-semibold text-white">{entry.nomeExibicao}</h3>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                      entry.atual
                        ? 'bg-[#6fbf86]/15 text-[#b9f0c7]'
                        : entry.desbloqueado
                          ? 'bg-sky-300/10 text-sky-100'
                          : 'bg-white/10 text-white/60'
                    }`}>
                      {entry.atual ? 'Atual' : entry.desbloqueado ? 'Desbloqueado' : 'Bloqueado'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[#a7e5b2]">{entry.subtitulo}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{entry.descricaoBreve}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <StageCodexModal
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        plant={plant}
        entry={selectedEntry}
        reason="codex"
      />
    </div>
  );
}
