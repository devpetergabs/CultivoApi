import { useEffect, useMemo, useState } from 'react';
import type { Aditivo } from '../types';
import type { PlantType } from '../types/pokedex';
import { apiService } from '../services/api';
import type { StoredWateringMixItem } from '../utils/wateringMixStorage';

type ToolboxProps = {
  open: boolean;
  plantStage: PlantType;
  plantId: number;
  initialSelected: StoredWateringMixItem[];
  onClose: () => void;
  onApply: (selected: StoredWateringMixItem[]) => void;
};

type Phase = 'VEGETATIVA' | 'FLORACAO' | 'FINALIZACAO';

function plantStageToPhase(stage: PlantType): Phase {
  if (stage === 'FINALIZACAO') return 'FINALIZACAO';
  if (stage === 'GERMINACAO' || stage === 'VEGETATIVO') return 'VEGETATIVA';
  return 'FLORACAO';
}

function phaseLabel(phase: Phase): string {
  if (phase === 'VEGETATIVA') return 'Vegetativa';
  if (phase === 'FINALIZACAO') return 'Finalização';
  return 'Floração';
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    // Strip diacritics without relying on Unicode property escapes (broader runtime support).
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isKnownAditivoPhase(value: unknown): value is Phase {
  return value === 'VEGETATIVA' || value === 'FLORACAO' || value === 'FINALIZACAO';
}

function isNeutralAditivo(aditivo: Aditivo): boolean {
  if (!aditivo || typeof aditivo !== 'object') return true;
  if (String(aditivo.classe) === 'OUTROS') return true;
  if (!isKnownAditivoPhase(aditivo.estagio)) return true;
  return false;
}

type Relevance = 'match' | 'neutral' | 'out';

function getRelevance(aditivo: Aditivo, plantPhase: Phase): Relevance {
  if (isNeutralAditivo(aditivo)) return 'neutral';
  if (isKnownAditivoPhase(aditivo.estagio) && aditivo.estagio === plantPhase) return 'match';
  return 'out';
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function starsFor(aditivo: Aditivo, plantPhase: Phase): number {
  const relevance = getRelevance(aditivo, plantPhase);
  if (relevance === 'out') return 2;

  if (relevance === 'neutral') return 3;

  // match
  const classe = String(aditivo.classe);
  if (plantPhase === 'FINALIZACAO') {
    return classe === 'FINALIZADOR' ? 5 : 4;
  }

  if (plantPhase === 'VEGETATIVA') {
    if (classe === 'BASE_NUTRICIONAL') return 5;
    if (classe === 'FORTIFICANTE' || classe === 'ESTIMULANTE') return 4;
    return 4;
  }

  // FLORACAO
  if (classe === 'ESTIMULANTE') return 5;
  if (classe === 'BOOSTER') return 4;
  if (classe === 'BASE_NUTRICIONAL') return 4;
  return 4;
}

function renderStars(count: number): string {
  const filled = clampInt(count, 0, 5);
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

function buildStoredItem(aditivo: Aditivo, doseMl: number): StoredWateringMixItem {
  return {
    id: aditivo.id,
    nome: aditivo.nome,
    marca: aditivo.marca,
    classe: aditivo.classe,
    estagio: aditivo.estagio,
    dosePadraoEmML: aditivo.dosePadraoEmML,
    doseMl,
  };
}

function briefDescription(value: unknown): string {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '—';
  if (text.length <= 120) return text;
  return `${text.slice(0, 117)}…`;
}

export function AditivosToolbox({
  open,
  plantStage,
  plantId,
  initialSelected,
  onClose,
  onApply,
}: ToolboxProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allAditivos, setAllAditivos] = useState<Aditivo[]>([]);

  const [draft, setDraft] = useState<Record<number, StoredWateringMixItem>>({});

  const plantPhase = useMemo(() => plantStageToPhase(plantStage), [plantStage]);

  useEffect(() => {
    if (!open) return;

    // init draft from parent
    const mapped: Record<number, StoredWateringMixItem> = {};
    for (const item of initialSelected) {
      mapped[item.id] = item;
    }
    setDraft(mapped);
    setQuery('');
    setError(null);

    let active = true;
    setIsLoading(true);
    apiService
      .getAditivos(0, 500)
      .then((response) => {
        const list = (response as any)?.content ?? response;
        const items = Array.isArray(list) ? (list as Aditivo[]) : [];
        if (!active) return;
        setAllAditivos(items.filter((a) => a.ativo));
      })
      .catch((e: any) => {
        if (!active) return;
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setError('Você precisa estar logado para ver o inventário.');
        } else {
          setError('Não foi possível carregar os aditivos do inventário.');
        }
        setAllAditivos([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, initialSelected, plantId]);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    const base = q
      ? allAditivos.filter((a) => {
          const hay = `${a.nome} ${a.marca}`;
          return normalizeText(hay).includes(q);
        })
      : allAditivos;

    const relRank = (r: Relevance) => (r === 'match' ? 0 : r === 'neutral' ? 1 : 2);

    return [...base].sort((a, b) => {
      const ra = getRelevance(a, plantPhase);
      const rb = getRelevance(b, plantPhase);
      if (relRank(ra) !== relRank(rb)) return relRank(ra) - relRank(rb);

      const sa = starsFor(a, plantPhase);
      const sb = starsFor(b, plantPhase);
      if (sa !== sb) return sb - sa;

      const na = String(a.nome ?? '').toLocaleLowerCase('pt-BR');
      const nb = String(b.nome ?? '').toLocaleLowerCase('pt-BR');
      return na.localeCompare(nb, 'pt-BR');
    });
  }, [allAditivos, query, plantPhase]);

  if (!open) return null;

  const handleToggle = (aditivo: Aditivo, checked: boolean) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (checked) {
        const existing = next[aditivo.id];
        const defaultDose =
          typeof aditivo.dosePadraoEmML === 'number' && aditivo.dosePadraoEmML > 0
            ? Math.round(aditivo.dosePadraoEmML)
            : 1;
        next[aditivo.id] = existing ?? buildStoredItem(aditivo, defaultDose);
      } else {
        delete next[aditivo.id];
      }
      return next;
    });
  };

  const handleDoseChange = (aditivo: Aditivo, doseMl: number) => {
    setDraft((prev) => {
      const existing = prev[aditivo.id];
      if (!existing) return prev;
      return {
        ...prev,
        [aditivo.id]: {
          ...existing,
          doseMl: Number.isFinite(doseMl) ? Math.max(0, Math.round(doseMl)) : 0,
        },
      };
    });
  };

  const selectedCount = Object.keys(draft).length;

  return (
    <div className="absolute inset-0 z-10">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />

      <div
        className="absolute left-1/2 top-1/2 w-[640px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#6fbf86]/25 bg-gradient-to-b from-[#101a2b] to-[#0B1220] shadow-[0_16px_40px_rgba(9,15,25,0.62)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Selecionar aditivos"
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-white/10">
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">Aditivos do inventário</div>
            <div className="text-xs text-[#9fb0c0]">Ordenado por relevância para: {phaseLabel(plantPhase)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl transition-colors font-semibold"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Buscar</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou marca"
            className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
          />

          {isLoading ? (
            <div className="mt-3 text-sm text-[#9fb0c0]">Carregando…</div>
          ) : error ? (
            <div className="mt-3 text-sm text-red-300">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="mt-3 text-sm text-[#9fb0c0]">Nenhum aditivo encontrado.</div>
          ) : (
            <div className="mt-3 max-h-[46vh] overflow-auto rounded-lg border border-white/10 bg-black/20">
              <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 px-3 py-2 text-[11px] font-semibold text-slate-300/80 uppercase tracking-[0.06em] bg-[#0B1220]/80 backdrop-blur border-b border-white/10">
                <div className="flex-1">Aditivo</div>
                <div className="flex items-center gap-2">
                  <span className="w-5" aria-hidden="true" />
                  <span className="w-20 text-right">Dose (ml/L)</span>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                {filtered.map((a) => {
                  const relevance = getRelevance(a, plantPhase);
                  const checked = !!draft[a.id];
                  const doseMl = draft[a.id]?.doseMl ?? 0;
                  const stars = starsFor(a, plantPhase);

                  const badge =
                    relevance === 'match'
                      ? `✔ MATCH — ${phaseLabel(plantPhase)}`
                      : relevance === 'neutral'
                      ? 'Neutro'
                      : '⚠ Fora da fase';

                  const dosePadraoText =
                    typeof a.dosePadraoEmML === 'number' && a.dosePadraoEmML > 0
                      ? `${Math.round(a.dosePadraoEmML)} ml`
                      : '—';
                  const desc = briefDescription(a.descricao);

                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 px-3 py-2 text-sm ${
                        relevance === 'out' ? 'opacity-70' : ''
                      }`}
                    >
                      <label className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-600/70 bg-[#0f1726] text-[#6fbf86] focus:ring-1 focus:ring-[#6fbf86]/30"
                          checked={checked}
                          onChange={(e) => handleToggle(a, e.target.checked)}
                        />

                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold border ${
                            relevance === 'match'
                              ? 'border-[#6fbf86]/50 bg-[#6fbf86]/10 text-[#A7E5B2]'
                              : relevance === 'neutral'
                              ? 'border-white/15 bg-white/5 text-slate-200'
                              : 'border-white/15 bg-white/5 text-slate-200'
                          }`}
                        >
                          {badge}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="font-semibold text-slate-100 truncate">{a.nome}</div>
                            <div className="text-[11px] text-slate-300/80 truncate">{a.marca}</div>
                          </div>
                          <div className="text-[11px] text-slate-300/80 font-mono tracking-wide">
                            {renderStars(stars)}
                          </div>
                        </div>
                      </label>

                      <div className="relative shrink-0 group">
                        <button
                          type="button"
                          className="h-5 w-5 rounded-full border border-white/15 bg-white/5 text-[11px] font-semibold text-slate-200/90 hover:border-[#6fbf86]/40 hover:text-white transition"
                          aria-label={`Info: ${a.nome}`}
                          onClick={(e) => {
                            // Discreet hover/focus tooltip; keep click from toggling checkbox.
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          i
                        </button>

                        <div
                          className="pointer-events-none absolute right-0 top-7 z-20 w-56 rounded-lg border border-white/10 bg-[#0B1220]/95 p-2 text-[11px] text-slate-200 shadow-[0_12px_26px_rgba(0,0,0,0.45)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                          role="tooltip"
                        >
                          <div className="font-semibold text-slate-100">Dose padrão: {dosePadraoText}</div>
                          <div className="mt-1 text-slate-300/90">{desc}</div>
                        </div>
                      </div>

                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={checked ? doseMl : ''}
                        disabled={!checked}
                        onChange={(e) => handleDoseChange(a, Number(e.target.value))}
                        placeholder="ml"
                        className="w-20 rounded border border-slate-600/70 bg-[#0f1726] px-2 py-1 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20 disabled:opacity-50"
                        aria-label={`Dose em ml para ${a.nome}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="text-xs text-[#9fb0c0]">Selecionados: {selectedCount}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft({})}
                className="rounded-lg border border-slate-600/70 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-400"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  const applied = Object.values(draft).filter((x) => x.doseMl > 0);
                  onApply(applied);
                  onClose();
                }}
                className="rounded-lg bg-[#6fbf86] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
