import { useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';

interface DistribuirPontosModalProps {
  pontosDisponiveis: number;
  onConfirm: (alt: number, lar: number, caule: number) => void;
  onCancel: () => void;
  levelAntes: number;
  levelDepois: number;
}

export function DistribuirPontosModal({ pontosDisponiveis, onConfirm, onCancel, levelAntes, levelDepois }: DistribuirPontosModalProps) {
  const [alt, setAlt] = useState(0);
  const [lar, setLar] = useState(0);
  const [caule, setCaule] = useState(0);

  const totalDistribuido = alt + lar + caule;
  const podeConfirmar = totalDistribuido <= pontosDisponiveis && totalDistribuido > 0;

  return (
    <PokedexModal
      open={true}
      onClose={onCancel}
      title="Distribuir Pontos"
      subtitle={`Level ${levelAntes} → ${levelDepois} · ${pontosDisponiveis - totalDistribuido} pts restantes`}
      widthClass="w-full max-w-[340px]"
    >
      <div className="flex flex-col gap-3">
        {[
          { label: 'ALTURA', value: alt, set: setAlt },
          { label: 'LARGURA', value: lar, set: setLar },
          { label: 'CAULE', value: caule, set: setCaule },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={value === 0}
                onClick={() => set(value - 1)}
                className="h-7 w-7 rounded-full border border-white/10 bg-white/5 text-sm font-bold text-white/80 hover:border-white/20 hover:bg-white/10 disabled:opacity-40 transition"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-bold text-emerald-300">{value}</span>
              <button
                type="button"
                disabled={totalDistribuido >= pontosDisponiveis}
                onClick={() => set(value + 1)}
                className="h-7 w-7 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-sm font-bold text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-40 transition"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!podeConfirmar}
          onClick={() => {
            onConfirm(alt, lar, caule);
            setAlt(0); setLar(0); setCaule(0);
          }}
          className="rounded-lg bg-emerald-400 py-2 text-xs font-semibold text-[#080B14] hover:bg-emerald-300 transition disabled:opacity-50"
        >
          Confirmar
        </button>
      </div>
    </PokedexModal>
  );
}
