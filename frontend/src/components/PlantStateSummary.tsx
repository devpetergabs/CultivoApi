import React, { useMemo } from "react";
import type { PlantaEvento } from "../types/index";

type Props = { events: PlantaEvento[] };

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const totalHours = Math.max(0, Math.floor(ms / 3600000));
  if (totalHours < 24) return `${totalHours}h atrás`;
  const days = Math.floor(totalHours / 24);
  return `${days}d atrás`;
}

function pickLast(events: PlantaEvento[], types: string[]) {
  return events.find((e) => types.includes(e.tipo));
}

export const PlantStateSummary: React.FC<Props> = ({ events }) => {
  const summary = useMemo(() => {
    const lastWater = pickLast(events, ["REGA_NORMAL", "REGA_ADITIVADA"]);
    const lastModel = pickLast(events, ["MODELO_NORMAL", "MODELO_ADITIVADO"]);
    const lastGrowth = pickLast(events, ["CRESCIMENTO"]);
    const lastEvolution = pickLast(events, ["EVOLUCAO"]);
    const lastNote = pickLast(events, ["OBSERVACAO"]);
    const lastInsect = pickLast(events, ["INSETICIDA"]);

    return { lastWater, lastModel, lastGrowth, lastEvolution, lastNote, lastInsect };
  }, [events]);

  const cards = [
    summary.lastWater && { title: "Última Rega", value: timeAgo(summary.lastWater.dataEvento), hint: summary.lastWater.descricao ?? "" },
    summary.lastModel && { title: "Modelo de Rega", value: timeAgo(summary.lastModel.dataEvento), hint: summary.lastModel.descricao ?? "" },
    summary.lastGrowth && { title: "Último Crescimento", value: timeAgo(summary.lastGrowth.dataEvento), hint: summary.lastGrowth.descricao ?? "" },
    summary.lastEvolution && { title: "Última Evolução", value: timeAgo(summary.lastEvolution.dataEvento), hint: summary.lastEvolution.descricao ?? "" },
    summary.lastInsect && { title: "Inseticida", value: timeAgo(summary.lastInsect.dataEvento), hint: summary.lastInsect.descricao ?? "" },
    summary.lastNote && { title: "Observação", value: timeAgo(summary.lastNote.dataEvento), hint: summary.lastNote.descricao ?? "" },
  ].filter(Boolean) as { title: string; value: string; hint: string }[];

  if (cards.length === 0) {
    return <p className="text-xs text-white/40 text-center py-2">Nenhum evento registrado ainda.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <Card key={c.title} title={c.title} value={c.value} hint={c.hint} />
      ))}
    </div>
  );
};

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">{title}</div>
      <div className="mt-1 font-semibold text-white">{value}</div>
      {!!hint && <div className="mt-1 text-[11px] text-white/45 line-clamp-2">{hint}</div>}
    </div>
  );
}