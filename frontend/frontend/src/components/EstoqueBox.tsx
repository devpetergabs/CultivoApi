
import { useEffect, useRef } from "react";

type Props = {
  stockML: number;
  warningLevel?: number;
  criticalLevel?: number;
};

export function EstoqueBox({ stockML }: Props) {
  // AAA HUD: glass dark, acento sutil, tipografia técnica, peso visual baixo
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.classList.remove("ring-1");
    void ref.current.offsetWidth;
    ref.current.classList.add("ring-1");
    const t = setTimeout(() => ref.current?.classList.remove("ring-1"), 180);
    return () => clearTimeout(t);
  }, [stockML]);

  // Sutileza: só um dot/acento de cor, sem alertas
  let accent = "border-slate-600/60";
  let dot = "bg-emerald-400/80";
  if (stockML < 30) {
    accent = "border-amber-400/40";
    dot = "bg-amber-400/80";
  } else if (stockML < 80) {
    accent = "border-cyan-400/30";
    dot = "bg-cyan-400/80";
  }

  return (
    <div
      ref={ref}
      className={[
        "group/estoque relative ml-2 flex flex-col items-end justify-center",
        "px-2.5 py-0.5 rounded-lg border",
        "min-w-[62px] max-w-[80px]",
        "bg-black/30 backdrop-blur-sm border border-solid",
        accent,
        "transition-all duration-150",
        "ring-0",
        "shadow-none",
      ].join(" ")}
      title="Quantidade atual disponível"
      style={{ boxShadow: "0 1px 0 0 #2228, 0 0.5px 0 0 #0006 inset" }}
    >
      {/* Dot de acento */}
      <span className={["absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full", dot].join(" ")} />

      <span className="text-[9px] font-semibold text-white/50 uppercase tracking-widest leading-none pl-2 pr-1 select-none">
        Estoque
      </span>

      <span className="text-[14px] font-bold text-white/80 leading-tight select-none font-mono tabular-nums pr-1 pt-0.5">
        {stockML}
        <span className="text-[10px] font-medium text-white/40 ml-0.5">ml</span>
      </span>
    </div>
  );
}
