import React, { useMemo, useState } from 'react';
import type { AgendaInseticida, AgendaPlanejado, PlantaEvento } from '../types';
import { apiService } from '../services/api';

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function daysDiff(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const d = Math.ceil(ms / 86400000);
  return d;
}

function nextPending(agenda: AgendaInseticida): AgendaPlanejado | null {
  const sorted = [...(agenda.planejados ?? [])].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  return sorted.find((p) => p.status === 'PENDENTE') ?? null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const InsecticideAgendaPanel: React.FC<{
  plantId: number;
  agenda: AgendaInseticida | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onEventCreated?: (ev: PlantaEvento) => void;
}> = ({ plantId, agenda, loading, error, onRefresh, onEventCreated }) => {
  const [busyId, setBusyId] = useState<number | null>(null);

  const pending = useMemo(() => (agenda ? nextPending(agenda) : null), [agenda]);

  const header = useMemo(() => {
    if (!agenda) return null;
    const total = agenda.roundsTotal ?? 0;
    const atual = agenda.roundAtual ?? 0;
    return {
      title: `${agenda.produtoNome} • ${atual}/${total} rounds` ,
      subtitle: `Descanso: ${agenda.descansoDias ?? 0}d • Início: ${fmtDateTime(agenda.inicioEm)}`,
    };
  }, [agenda]);

  async function handleDownloadIcs() {
    if (!agenda) return;
    try {
      const blob = await apiService.downloadAgendaInseticidaIcs(plantId);
      const filename = `cultivo-${agenda.plantaNome}-${agenda.produtoNome}.ics`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      downloadBlob(blob, filename || 'cultivo-inseticida.ics');
    } catch {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { tone: 'error', message: 'Falha ao baixar .ics' } }));
    }
  }

  async function markDone(p: AgendaPlanejado) {
    if (!agenda) return;
    setBusyId(p.id);
    try {
      const ev = await apiService.marcarAgendaInseticidaDone(plantId, p.id);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { tone: 'success', message: `Round ${p.roundIndex} marcado como aplicado.` } }));
      onEventCreated?.(ev);
      onRefresh?.();
      // atualiza timeline também
      window.dispatchEvent(new CustomEvent('plant:event-created', { detail: { plantId } }));
    } catch (e: any) {
      const msg = e?.response?.status === 400 ? 'Não deu pra marcar (ordem/estado do tratamento).' : 'Falha ao marcar round.';
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { tone: 'warning', message: msg } }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border-2 border-amber-400/20 bg-[#111A2E]/60 backdrop-blur-sm p-4 shadow-[0_0_16px_rgba(245,158,11,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.06em] text-amber-300/90">🛡️ Agenda de Inseticida</div>
          {!agenda ? (
            <div className="mt-2 text-sm text-white/70">Sem tratamento ativo.</div>
          ) : (
            <>
              <div className="mt-1 text-base font-semibold text-white">{header?.title}</div>
              <div className="mt-1 text-xs text-white/50">{header?.subtitle}</div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!agenda}
            onClick={handleDownloadIcs}
            className="px-3 py-2 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 text-xs font-semibold uppercase tracking-[0.06em] hover:bg-amber-500/15 disabled:opacity-40"
          >
            📅 Exportar .ics
          </button>

          <button
            type="button"
            disabled={!agenda || !pending || busyId != null}
            onClick={() => pending && markDone(pending)}
            className="px-3 py-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 text-xs font-semibold uppercase tracking-[0.06em] hover:bg-emerald-500/15 disabled:opacity-40"
            title={pending ? `Marcar round ${pending.roundIndex} como aplicado` : 'Nada pendente'}
          >
            ✅ Marcar próximo
          </button>
        </div>
      </div>

      {error && <div className="mt-3 text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{error}</div>}

      {loading && <div className="mt-3 text-xs text-white/50">Carregando agenda…</div>}

      {!!agenda && (
        <div className="mt-3">
          {pending && (
            <div className="mb-3 rounded-lg border border-amber-400/20 bg-[#0B1220]/70 p-3">
              <div className="text-xs text-white/60 uppercase tracking-[0.06em]">Próxima aplicação</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white">
                  Round {pending.roundIndex}/{agenda.roundsTotal} • {fmtDateTime(pending.scheduledAt)}
                </div>
                <div className={`text-xs font-semibold ${daysDiff(pending.scheduledAt) <= 0 ? 'text-rose-300' : 'text-amber-200'}`}>
                  {daysDiff(pending.scheduledAt) <= 0 ? 'HOJE / ATRASADO' : `Falta ${daysDiff(pending.scheduledAt)}d`}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {agenda.planejados
              ?.slice()
              .sort((a, b) => a.roundIndex - b.roundIndex)
              .map((p) => {
                const isDone = p.status === 'EXECUTADO';
                const isPending = p.status === 'PENDENTE';
                const due = isPending && daysDiff(p.scheduledAt) <= 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 bg-[#0B1220]/70 ${
                      isDone
                        ? 'border-emerald-400/20'
                        : due
                          ? 'border-rose-400/30'
                          : 'border-white/10'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {isDone ? '✅' : due ? '⏰' : '🕓'} Round {p.roundIndex}/{agenda.roundsTotal}
                      </div>
                      <div className="text-xs text-white/50">{fmtDateTime(p.scheduledAt)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full border uppercase tracking-[0.06em] ${
                          isDone
                            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                            : due
                              ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                              : 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>

                      <button
                        type="button"
                        disabled={!isPending || busyId != null}
                        onClick={() => markDone(p)}
                        className="px-2 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 text-xs hover:bg-white/10 disabled:opacity-30"
                        title={isPending ? 'Marcar como aplicado' : 'Já executado'}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-3 text-[11px] text-white/45">
            Dica: o “.ics” coloca os rounds no seu calendário real. No app, você pode marcar o round como feito.
          </div>
        </div>
      )}
    </div>
  );
};
