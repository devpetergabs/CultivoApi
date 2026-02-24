import React, { useMemo, useState } from "react";
import type { PlantaEvento } from "../types/index";

type Props = {
  events: PlantaEvento[];
  onRefresh?: () => void;
  loading?: boolean;
  title?: string;
};

type Filter = "ALL" | string;

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function labelForDay(key: string) {
  const today = new Date().toLocaleDateString("pt-BR");
  const y = new Date(Date.now() - 86400000).toLocaleDateString("pt-BR");
  if (key === today) return "Hoje";
  if (key === y) return "Ontem";
  return key;
}

function typeMeta(tipo: string) {
  // Paleta dark + feedback (sem gritar)
  switch (tipo) {
    case "REGA_NORMAL":
    case "REGA_ADITIVADA":
    case "MODELO_NORMAL":
    case "MODELO_ADITIVADO":
      return { icon: "💧", badge: "bg-sky-500/15 text-sky-200 border-sky-400/30" };
    case "INSETICIDA":
      return { icon: "🛡️", badge: "bg-amber-500/15 text-amber-200 border-amber-400/30" };
    case "OBSERVACAO":
      return { icon: "📝", badge: "bg-violet-500/15 text-violet-200 border-violet-400/30" };
    case "CRESCIMENTO":
      return { icon: "📈", badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30" };
    case "EVOLUCAO":
      return { icon: "✨", badge: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30" };
    default:
      return { icon: "📌", badge: "bg-slate-500/15 text-slate-200 border-slate-400/30" };
  }
}

export const EventTimeline: React.FC<Props> = ({ events, onRefresh, loading, title = "Registro de Eventos" }) => {
  const [filter, setFilter] = useState<Filter>("ALL");

  const types = useMemo(() => {
    const set = new Set(events.map((e) => e.tipo));
    return ["ALL", ...Array.from(set)];
  }, [events]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return events;
    return events.filter((e) => e.tipo === filter);
  }, [events, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, PlantaEvento[]>();
    for (const e of filtered) {
      const key = dayKey(e.dataEvento);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    // Ordena grupos por data (desc)
    const keys = Array.from(map.keys()).sort((a, b) => {
      const da = new Date(a.split("/").reverse().join("-")).getTime();
      const db = new Date(b.split("/").reverse().join("-")).getTime();
      return db - da;
    });
    return keys.map((k) => ({ day: k, items: map.get(k)! }));
  }, [filtered]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-white/60">A “visão de estado” da planta vem daqui.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/30 border border-white/10 text-white text-xs rounded-lg px-2 py-1"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "Todos" : t}
              </option>
            ))}
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            >
              {loading ? "..." : "Atualizar"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {grouped.length === 0 ? (
          <div className="text-sm text-white/60">Nenhum evento ainda.</div>
        ) : (
          grouped.map((g) => (
            <div key={g.day} className="space-y-2">
              <div className="text-xs text-white/60">{labelForDay(g.day)}</div>

              <div className="space-y-2">
                {g.items.map((e) => {
                  const meta = typeMeta(e.tipo);
                  return (
                    <div
                      key={e.id}
                      className="flex gap-3 rounded-xl bg-black/25 border border-white/10 p-3 hover:bg-black/30 transition"
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
                        <span className="text-lg">{meta.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${meta.badge}`}>
                            {e.tipo}
                          </span>
                          <span className="text-[11px] text-white/50">{fmtDateTime(e.dataEvento)}</span>
                        </div>

                        {e.descricao && (
                          <div className="mt-1 text-sm text-white/90 whitespace-pre-wrap break-words">
                            {e.descricao}
                          </div>
                        )}

                        {typeof e.doseEmML === "number" && (
                          <div className="mt-1 text-xs text-white/60">dose/volume: {e.doseEmML} mL</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};