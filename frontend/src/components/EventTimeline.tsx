import React, { useEffect, useMemo, useState } from 'react';
import type { PlantaEvento } from '../types/index';
import { apiService } from '../services/api';

type Props = {
  /** Necessário para editar/excluir via API */
  plantId?: number | null;
  events: PlantaEvento[];
  onRefresh?: () => void;
  loading?: boolean;
  title?: string;
};

type Filter = 'ALL' | string;
type Scope = 'ACTIONS' | 'GROWTH' | 'ALL';
type ModalMode = 'NONE' | 'CORRECT' | 'REPLACE';

function fmtDateTime(iso: string, showTime: boolean) {
  const d = new Date(iso);
  if (!showTime) {
    // menos poluição visual: dia/mês. Horário fica acessível via tooltip.
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function labelForDay(key: string) {
  const today = new Date().toLocaleDateString('pt-BR');
  const y = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR');
  if (key === today) return 'Hoje';
  if (key === y) return 'Ontem';
  return key;
}

function isGrowthType(tipo: string) {
  return tipo === 'CRESCIMENTO' || tipo === 'EVOLUCAO';
}

function isWaterLike(tipo: string) {
  return (
    tipo === 'REGA_NORMAL' ||
    tipo === 'REGA_ADITIVADA' ||
    tipo === 'MODELO_NORMAL' ||
    tipo === 'MODELO_ADITIVADO'
  );
}

function prettyTipo(tipo: string) {
  switch (tipo) {
    case 'REGA_NORMAL':
      return 'REGA (NORMAL)';
    case 'REGA_ADITIVADA':
      return 'REGA (ADITIVADA)';
    case 'MODELO_NORMAL':
      return 'MODELO (NORMAL)';
    case 'MODELO_ADITIVADO':
      return 'MODELO (ADITIVADO)';
    case 'OBSERVACAO':
      return 'OBSERVAÇÃO';
    case 'INSETICIDA':
      return 'INSETICIDA';
    case 'TROCA_VASO':
      return 'TROCA DE VASO';
    case 'CRESCIMENTO':
      return 'CRESCIMENTO';
    case 'EVOLUCAO':
      return 'EVOLUÇÃO';
    default:
      // fallback: "FOO_BAR" -> "FOO BAR"
      return (tipo || '').replaceAll('_', ' ').toUpperCase();
  }
}

function niceTypeName(tipo: string) {
  switch (tipo) {
    case 'REGA_NORMAL':
      return 'Rega (água pura)';
    case 'REGA_ADITIVADA':
      return 'Rega (aditivada)';
    case 'MODELO_NORMAL':
      return 'Modelo (normal)';
    case 'MODELO_ADITIVADO':
      return 'Modelo (aditivado)';
    case 'OBSERVACAO':
      return 'Observação';
    case 'INSETICIDA':
      return 'Inseticida';
    case 'TROCA_VASO':
      return 'Troca de vaso';
    case 'CRESCIMENTO':
      return 'Crescimento';
    case 'EVOLUCAO':
      return 'Evolução';
    default:
      return tipo;
  }
}

function typeMeta(tipo: string) {
  switch (tipo) {
    case 'REGA_NORMAL':
    case 'REGA_ADITIVADA':
    case 'MODELO_NORMAL':
    case 'MODELO_ADITIVADO':
      return { icon: '💧', badge: 'bg-sky-500/15 text-sky-200 border-sky-400/20' };

    case 'OBSERVACAO':
      return { icon: '📝', badge: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/20' };

    case 'INSETICIDA':
      return { icon: '🛡️', badge: 'bg-amber-500/15 text-amber-200 border-amber-400/20' };

    case 'TROCA_VASO':
      return { icon: '📌', badge: 'bg-rose-500/15 text-rose-200 border-rose-400/20' };

    case 'CRESCIMENTO':
      return { icon: '📈', badge: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20' };

    case 'EVOLUCAO':
      return { icon: '✨', badge: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/20' };

    default:
      return { icon: '📍', badge: 'bg-slate-500/15 text-slate-200 border-white/10' };
  }
}

function defaultDescForEvent(tipo: string, ml: number | null) {
  const base = niceTypeName(tipo);

  if (isWaterLike(tipo)) {
    if (ml != null && ml > 0) {
      // escolhe texto mais “humano”
      if (tipo === 'REGA_NORMAL' || tipo === 'MODELO_NORMAL') return `Rega (água pura): ${ml}mL`;
      if (tipo === 'REGA_ADITIVADA' || tipo === 'MODELO_ADITIVADO') return `Rega (aditivada): ${ml}mL`;
      return `${base}: ${ml}mL`;
    }
    return base;
  }

  return base;
}

function buildAuditLog(params: {
  ev: PlantaEvento;
  oldDesc: string | null;
  oldMl: number | null;
  newDesc: string | null;
  newMl: number | null;
  motivo: string;
}) {
  const { ev, oldDesc, oldMl, newDesc, newMl, motivo } = params;

  const oldMlTxt = oldMl != null ? `${oldMl}mL` : '(sem mL)';
  const newMlTxt = newMl != null ? `${newMl}mL` : '(sem mL)';

  const oldDescTxt = (oldDesc ?? '').trim() || '(sem descrição)';
  const newDescTxt = (newDesc ?? '').trim() || '(sem descrição)';

  let log = `Correção do evento #${ev.id} (${niceTypeName(ev.tipo)}): ${oldMlTxt} → ${newMlTxt}.`;

  if (oldDescTxt !== newDescTxt) {
    log += ` "${oldDescTxt}" → "${newDescTxt}".`;
  }

  const m = motivo.trim();
  if (m.length > 0) {
    log += ` Motivo: ${m}`;
  }

  return log;
}

export const EventTimeline: React.FC<Props> = ({
  plantId,
  events,
  onRefresh,
  loading,
  title = 'Registro de Eventos',
}) => {
  const [scope, setScope] = useState<Scope>('ACTIONS');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [showTime, setShowTime] = useState<boolean>(false);

  // menu “⋯”
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);

  // modal
  const [modalMode, setModalMode] = useState<ModalMode>('NONE');
  const [activeEvent, setActiveEvent] = useState<PlantaEvento | null>(null);

  // inputs do modal
  const [volumeMlStr, setVolumeMlStr] = useState<string>(''); // string pra permitir vazio
  const [eventDesc, setEventDesc] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');

  // replace
  const [deleteOldOnReplace, setDeleteOldOnReplace] = useState<boolean>(true);

  // audit
  const [createAuditObs, setCreateAuditObs] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  
  const scoped = useMemo(() => {
    if (scope === 'ALL') return events;
    if (scope === 'GROWTH') return events.filter((e) => isGrowthType(e.tipo));
    // ACTIONS
    return events.filter((e) => !isGrowthType(e.tipo));
  }, [events, scope]);

  const tipos = useMemo(() => {
    const set = new Set<string>();
    scoped.forEach((e) => set.add(e.tipo));
    return Array.from(set).sort();
  }, [scoped]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return scoped;
    return scoped.filter((e) => e.tipo === filter);
  }, [scoped, filter]);

  
  useEffect(() => {
    if (filter === 'ALL') return;
    const exists = tipos.includes(String(filter));
    if (!exists) setFilter('ALL');
  }, [scope, filter, tipos]);


  const grouped = useMemo(() => {
    const map = new Map<string, PlantaEvento[]>();
    for (const e of filtered) {
      const k = dayKey(e.dataEvento);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    // newest first within day
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => new Date(b.dataEvento).getTime() - new Date(a.dataEvento).getTime());
      map.set(k, list);
    }
    // newest days first
    return Array.from(map.entries()).sort((a, b) => {
      const da = new Date(a[1][0].dataEvento).getTime();
      const db = new Date(b[1][0].dataEvento).getTime();
      return db - da;
    });
  }, [filtered]);

  function closeModal() {
    setModalMode('NONE');
    setActiveEvent(null);
    setVolumeMlStr('');
    setEventDesc('');
    setMotivo('');
    setDeleteOldOnReplace(true);
    setCreateAuditObs(true);
    setErr(null);
  }

  function openCorrect(ev: PlantaEvento) {
    setActiveEvent(ev);
    setModalMode('CORRECT');

    // Prefill REAL do evento (isso é o que vai ser PATCHado)
    setVolumeMlStr(ev.doseEmML != null ? String(ev.doseEmML) : '');
    setEventDesc(ev.descricao ?? '');

    // Motivo começa vazio (você escreve se quiser)
    setMotivo('');

    // Corrigir por padrão cria audit OBS (padrão ON)
    setCreateAuditObs(true);
    setDeleteOldOnReplace(true);

    setErr(null);
    setMenuOpenFor(null);
  }

  function openReplace(ev: PlantaEvento) {
    setActiveEvent(ev);
    setModalMode('REPLACE');

    // Prefill do novo evento
    setVolumeMlStr(ev.doseEmML != null ? String(ev.doseEmML) : '');
    setEventDesc(ev.descricao ?? '');
    setMotivo('');
    setDeleteOldOnReplace(true);

    // Replace não precisa de audit (mas deixo disponível se quiser)
    setCreateAuditObs(false);

    setErr(null);
    setMenuOpenFor(null);
  }

  function parseMlOrNull() {
    const raw = volumeMlStr.trim();
    if (raw.length === 0) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return NaN;
    return Math.round(n);
  }

  async function doDelete(ev: PlantaEvento) {
    if (!plantId) return;
    const ok = window.confirm(`Excluir evento #${ev.id} (${niceTypeName(ev.tipo)})?`);
    if (!ok) return;

    try {
      await apiService.deletePlantaEvento(plantId, ev.id);
      onRefresh?.();
    } catch {
      window.alert('Não foi possível excluir o evento.');
    }
  }

  async function onSave() {
    if (!plantId || !activeEvent) {
      setErr('plantId não está disponível.');
      return;
    }

    const oldMl = activeEvent.doseEmML ?? null;
    const oldDesc = activeEvent.descricao ?? null;

    const parsedMl = parseMlOrNull();
    if (Number.isNaN(parsedMl)) {
      setErr('mL inválido.');
      return;
    }

    const wantsMl = parsedMl != null;
    const nextMl = wantsMl ? parsedMl : oldMl;

    // Validação “AAA”: eventos de rega/modelo precisam de mL > 0
    if (isWaterLike(activeEvent.tipo)) {
      if (nextMl == null || nextMl <= 0) {
        setErr('Para REGA/MODELO, informe um volume maior que 0 mL.');
        return;
      }
    }

    // descrição final: se usuário apagar, gera padrão
    let nextDesc = (eventDesc ?? '').trim();
    if (nextDesc.length === 0) {
      nextDesc = defaultDescForEvent(activeEvent.tipo, nextMl);
    }

    setIsSaving(true);
    setErr(null);

    try {
      if (modalMode === 'CORRECT') {
        // ✅ PATCH DE VERDADE: altera o evento
        await apiService.patchPlantaEvento(plantId, activeEvent.id, {
          descricao: nextDesc,
          doseEmML: nextMl,
        });

        // ✅ (Opcional) cria OBSERVAÇÃO de auditoria
        if (createAuditObs) {
          const audit = buildAuditLog({
            ev: activeEvent,
            oldDesc,
            oldMl,
            newDesc: nextDesc,
            newMl: nextMl,
            motivo,
          });

          await apiService.createPlantaEvento(plantId, {
            tipo: 'OBSERVACAO',
            descricao: audit,
            doseEmML: null,
          });
        }

        onRefresh?.();
        closeModal();
        return;
      }

      if (modalMode === 'REPLACE') {
        // cria um novo evento (mesmo tipo) e opcionalmente apaga o antigo
        await apiService.createPlantaEvento(plantId, {
          tipo: activeEvent.tipo,
          descricao: nextDesc,
          doseEmML: nextMl,
        });

        if (deleteOldOnReplace) {
          await apiService.deletePlantaEvento(plantId, activeEvent.id);
        }

        onRefresh?.();
        closeModal();
        return;
      }
    } catch (e: any) {
      // se o backend ainda estiver bloqueando PATCH pra tipos, vai cair aqui.
      setErr('Falha ao salvar. Se estiver dando 403, o backend ainda está bloqueando PATCH pra este tipo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full" onClick={() => setMenuOpenFor(null)}>
      {/* Header / Controls */}
      <div className="mb-3 rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-black/20 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="mt-0.5 text-[11px] text-white/55">
              A “visão de estado” da planta vem daqui. Ajuste o escopo pra reduzir poluição.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setScope('ACTIONS')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition ${
                  scope === 'ACTIONS' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`}
                title="Ações do dia a dia (menos poluição)"
              >
                ⚡ Ações
              </button>
              <button
                type="button"
                onClick={() => setScope('GROWTH')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition ${
                  scope === 'GROWTH' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`}
                title="Crescimento / Evolução"
              >
                📈 Cresc.
              </button>
              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition ${
                  scope === 'ALL' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`}
                title="Tudo"
              >
                🗂 Tudo
              </button>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 outline-none hover:bg-white/10"
              title="Filtra por tipo"
            >
              <option value="ALL">Todos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {prettyTipo(t)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowTime((v) => !v)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
              title="Alterna exibição de horário (reduz poluição visual)"
            >
              ⏱ {showTime ? 'Ocultar' : 'Horário'}
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={() => onRefresh()}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
                title="Recarrega eventos"
              >
                {loading ? '…' : '↻ Atualizar'}
              </button>
            )}
          </div>
        </div>

        {err && <div className="mt-2 text-xs text-red-300">{err}</div>}
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          Sem eventos ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, list]) => (
            <div key={day} className="relative">
              {/* timeline line */}
              <div className="absolute left-[18px] top-7 bottom-3 w-px bg-white/10" />

              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold text-white/70">{labelForDay(day)}</div>
                <div className="text-[11px] text-white/45">{list.length} evento(s)</div>
              </div>

              <div className="space-y-2">
                {list.map((ev) => {
                  const meta = typeMeta(ev.tipo);
                  const menuOpen = menuOpenFor === ev.id;

                  return (
                    <div key={ev.id} className="relative pl-12" onClick={(e) => e.stopPropagation()}>
                      {/* marker */}
                      <div className="absolute left-1.5 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30 shadow-[0_8px_22px_rgba(0,0,0,0.35)]">
                        <span className="text-base">{meta.icon}</span>
                      </div>

                      <div className="relative rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-black/25 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}
                              >
                                {prettyTipo(ev.tipo)}
                              </span>

                              <span
                                className="text-[11px] text-white/60"
                                title={new Date(ev.dataEvento).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              >
                                {fmtDateTime(ev.dataEvento, showTime)}
                              </span>
                            </div>

                            {ev.descricao && ev.descricao.trim().length > 0 && (
                              <div className="mt-1 text-sm text-white/90 whitespace-pre-line">{ev.descricao}</div>
                            )}

                            {ev.doseEmML != null && (
                              <div className="mt-1 text-[11px] text-white/60">
                                dose/volume: <span className="font-mono text-white/75">{ev.doseEmML} mL</span>
                              </div>
                            )}
                          </div>

                          {plantId ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setMenuOpenFor((prev) => (prev === ev.id ? null : ev.id))}
                                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                                disabled={isSaving}
                                aria-label="Ações"
                              >
                                ⋯
                              </button>

                              {menuOpen && (
                                <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0b1220] shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                                  <div className="px-3 py-2 text-[11px] font-semibold text-white/60">Ações</div>
                                  <div className="h-px bg-white/10" />

                                  <div className="p-1">
                                    <button
                                      type="button"
                                      onClick={() => openReplace(ev)}
                                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10"
                                    >
                                      Substituir…
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openCorrect(ev)}
                                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10"
                                    >
                                      Corrigir…
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuOpenFor(null);
                                        void doDelete(ev);
                                      }}
                                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* MODAL */}
      {modalMode !== 'NONE' && activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#0b1220] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2">
              <div className="text-sm font-semibold text-white">
                {modalMode === 'CORRECT' ? 'Corrigir evento' : 'Substituir evento'}
              </div>
              <div className="text-xs text-white/60">
                #{activeEvent.id} • {niceTypeName(activeEvent.tipo)}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  Volume (mL) — {isWaterLike(activeEvent.tipo) ? 'obrigatório' : 'opcional'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={volumeMlStr}
                  onChange={(e) => setVolumeMlStr(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
                  disabled={isSaving}
                />
                <div className="mt-1 text-[11px] text-white/45">
                  ≈ {(() => {
                    const n = Number(volumeMlStr || 0);
                    if (!Number.isFinite(n)) return '0.00';
                    return (n / 1000).toFixed(2);
                  })()}
                  L
                </div>
              </div>

              {modalMode === 'REPLACE' && (
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={deleteOldOnReplace}
                      onChange={(e) => setDeleteOldOnReplace(e.target.checked)}
                      disabled={isSaving}
                    />
                    Excluir evento antigo após substituir
                  </label>
                </div>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-white/60">
                Descrição (vai ficar no evento)
              </label>
              <textarea
                rows={3}
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
                disabled={isSaving}
              />
              <div className="mt-1 text-[11px] text-white/45">
                Se deixar vazio, o app gera uma descrição padrão coerente com o tipo + mL.
              </div>
            </div>

            {modalMode === 'CORRECT' && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-white/70">Auditoria (Observação automática)</div>
                  <label className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={createAuditObs}
                      onChange={(e) => setCreateAuditObs(e.target.checked)}
                      disabled={isSaving}
                    />
                    Criar observação
                  </label>
                </div>

                <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  Motivo (opcional)
                </label>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
                  disabled={isSaving || !createAuditObs}
                  placeholder="ex: digitei errado / cliquei errado / ajuste fino…"
                />

                <div className="mt-2 text-[11px] text-white/55">
                  Preview do log que será salvo como OBSERVAÇÃO:
                </div>
                <div className="mt-1 rounded-xl border border-white/10 bg-black/20 p-2 text-[11px] text-white/70 whitespace-pre-wrap">
                  {buildAuditLog({
                    ev: activeEvent,
                    oldDesc: activeEvent.descricao ?? null,
                    oldMl: activeEvent.doseEmML ?? null,
                    newDesc: (eventDesc ?? '').trim().length > 0 ? eventDesc.trim() : defaultDescForEvent(activeEvent.tipo, (() => {
                      const raw = volumeMlStr.trim();
                      const n = raw.length ? Number(raw) : NaN;
                      const newMl = Number.isFinite(n) ? Math.round(n) : null;
                      const chosenMl = newMl != null ? newMl : (activeEvent.doseEmML ?? null);
                      return chosenMl;
                    })()),
                    newMl: (() => {
                      const raw = volumeMlStr.trim();
                      const n = raw.length ? Number(raw) : NaN;
                      const newMl = Number.isFinite(n) ? Math.round(n) : null;
                      return newMl != null ? newMl : (activeEvent.doseEmML ?? null);
                    })(),
                    motivo,
                  })}
                </div>
              </div>
            )}

            {err && <div className="mt-3 text-xs text-red-300">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/10"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void onSave()}
                className="rounded-xl bg-emerald-500/90 px-3 py-2 text-xs font-bold text-[#0b1220] hover:brightness-110 disabled:opacity-60"
                disabled={isSaving}
              >
                {isSaving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};