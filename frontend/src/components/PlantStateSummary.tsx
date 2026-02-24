import React, { useMemo } from "react";
import type { PlantaEvento } from "../types/index";

type Props = { events: PlantaEvento[] };

function hoursAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 3600000));
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

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card title="Última Rega" value={summary.lastWater ? `${hoursAgo(summary.lastWater.dataEvento)}h atrás` : "—"} hint={summary.lastWater?.descricao ?? ""} />
      <Card title="Modelo de Rega" value={summary.lastModel ? "Definido" : "—"} hint={summary.lastModel?.descricao ?? ""} />
      <Card title="Último Crescimento" value={summary.lastGrowth ? `${hoursAgo(summary.lastGrowth.dataEvento)}h atrás` : "—"} hint={summary.lastGrowth?.descricao ?? ""} />
      <Card title="Última Evolução" value={summary.lastEvolution ? "OK" : "—"} hint={summary.lastEvolution?.descricao ?? ""} />
      <Card title="Inseticida" value={summary.lastInsect ? `${hoursAgo(summary.lastInsect.dataEvento)}h atrás` : "—"} hint={summary.lastInsect?.descricao ?? ""} />
      <Card title="Observação" value={summary.lastNote ? "Existe" : "—"} hint={summary.lastNote?.descricao ?? ""} />
    </div>
  );
};

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
      {!!hint && <div className="mt-1 text-xs text-white/50 line-clamp-2">{hint}</div>}
    </div>
  );
}