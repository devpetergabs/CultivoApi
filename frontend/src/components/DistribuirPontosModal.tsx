import { useState } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 bg-opacity-80 rounded-2xl p-6 shadow-2xl flex flex-col items-center" style={{ minWidth: 320 }}>
        <h2 className="text-green-400 font-bold text-xl mb-2">Distribuir Pontos</h2>
        <div className="mb-2 text-white text-lg">Level: <span className="font-bold text-green-300">{levelAntes}</span> <span className="mx-2">→</span> <span className="font-bold text-green-300">{levelDepois}</span></div>
        <div className="mb-4 text-white text-lg">Pontos disponíveis: <span className="font-bold text-green-300">{pontosDisponiveis - totalDistribuido}</span></div>
        <div className="flex flex-col gap-3 mb-4 w-full">
          <div className="flex items-center justify-between w-full">
            <span className="text-white">ALTURA</span>
            <div className="flex items-center gap-2">
              <button className="btn-minus" disabled={alt === 0} onClick={() => setAlt(alt - 1)}>-</button>
              <span className="text-green-200 font-bold">{alt}</span>
              <button className="btn-plus" disabled={totalDistribuido >= pontosDisponiveis} onClick={() => setAlt(alt + 1)}>+</button>
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <span className="text-white">LARGURA</span>
            <div className="flex items-center gap-2">
              <button className="btn-minus" disabled={lar === 0} onClick={() => setLar(lar - 1)}>-</button>
              <span className="text-green-200 font-bold">{lar}</span>
              <button className="btn-plus" disabled={totalDistribuido >= pontosDisponiveis} onClick={() => setLar(lar + 1)}>+</button>
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <span className="text-white">CAULE</span>
            <div className="flex items-center gap-2">
              <button className="btn-minus" disabled={caule === 0} onClick={() => setCaule(caule - 1)}>-</button>
              <span className="text-green-200 font-bold">{caule}</span>
              <button className="btn-plus" disabled={totalDistribuido >= pontosDisponiveis} onClick={() => setCaule(caule + 1)}>+</button>
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <button
            className="px-6 py-2 rounded-full font-bold text-white bg-green-500 shadow-lg glow-green transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={!podeConfirmar}
            onClick={() => {
              onConfirm(alt, lar, caule);
              setAlt(0); setLar(0); setCaule(0);
            }}
          >Confirmar</button>
          <button className="px-6 py-2 rounded-full font-bold text-white bg-gray-700 shadow-md transition-all hover:scale-105" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// Tailwind/extra CSS:
// .animate-bounce-in { animation: bounce-in 0.5s; }
// @keyframes bounce-in { 0% { transform: scale(0.8); } 60% { transform: scale(1.05); } 80% { transform: scale(0.95); } 100% { transform: scale(1); } }
// .glow-green { box-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e44; }
// .btn-plus, .btn-minus { background: #222; color: #a7f3d0; border-radius: 50%; width: 32px; height: 32px; font-size: 20px; font-weight: bold; border: none; transition: background 0.2s; }
// .btn-plus:active, .btn-minus:active { background: #22c55e; color: #fff; }
