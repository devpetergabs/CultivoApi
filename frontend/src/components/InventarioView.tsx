import { useEffect, useMemo, useState } from 'react';
import type { Aditivo } from '../types';
import { apiService } from '../services/api';

type InventarioViewProps = {
  onCountChange?: (count: number) => void;
};

function classeLabel(value: string): string {
  switch (value) {
    case 'BASE_NUTRICIONAL':
      return 'Base';
    case 'FORTIFICANTE':
      return 'Fortificante';
    case 'ESTIMULANTE':
      return 'Estimulante';
    case 'BOOSTER':
      return 'Booster';
    case 'PROTECAO':
      return 'Proteção';
    case 'FINALIZADOR':
      return 'Finalizador';
    case 'OUTROS':
      return 'Outros';
    default:
      return value;
  }
}

function estagioLabel(value: string): string {
  switch (value) {
    case 'VEGETATIVA':
      return 'Vegetativa';
    case 'FLORACAO':
      return 'Floração';
    case 'FINALIZACAO':
      return 'Finalização';
    default:
      return value;
  }
}

export function InventarioView({ onCountChange }: InventarioViewProps) {
  const [aditivos, setAditivos] = useState<Aditivo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mostrarColecionaveis, setMostrarColecionaveis] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.getAditivos(0, 500);
        const list = (response as any)?.content ?? response;
        const items = Array.isArray(list) ? (list as Aditivo[]) : [];
        setAditivos(items);
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setError('Você precisa estar logado para ver o inventário.');
        } else {
          setError('Não foi possível carregar o inventário.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const visible = useMemo(() => {
    if (mostrarColecionaveis) return aditivos;
    return aditivos.filter((a) => a.ativo);
  }, [aditivos, mostrarColecionaveis]);

  useEffect(() => {
    onCountChange?.(visible.length);
  }, [onCountChange, visible.length]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0B1220]">
      <div className="shrink-0 px-6 pt-4">
        <div className="pokedex-card-frame rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Inventário</h2>
              <p className="text-xs text-[#9fb0c0]">Aditivos disponíveis para uso</p>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-200 select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600/70 bg-[#0f1726] text-[#6fbf86] focus:ring-1 focus:ring-[#6fbf86]/30"
                checked={mostrarColecionaveis}
                onChange={(e) => setMostrarColecionaveis(e.target.checked)}
              />
              Mostrar colecionáveis
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
        {isLoading ? (
          <div className="text-sm text-[#9fb0c0]">Carregando aditivos…</div>
        ) : error ? (
          <div className="text-sm text-red-300">{error}</div>
        ) : visible.length === 0 ? (
          <div className="text-sm text-[#9fb0c0]">
            {mostrarColecionaveis
              ? 'Nenhum aditivo cadastrado.'
              : 'Nenhum aditivo ativo disponível no inventário.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((a) => {
              const isCollectible = !a.ativo;
              return (
                <div
                  key={a.id}
                  className={`relative group h-full rounded-xl overflow-hidden transition-all duration-200 text-left border-2
                    ${
                      isCollectible
                        ? 'border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[#111A2E]/70 to-[#0B1220]/70'
                        : 'border-[rgba(255,255,255,0.12)] hover:border-[#6fbf86]/70 hover:shadow-[0_0_10px_rgba(111,191,134,0.18)] bg-gradient-to-br from-[#111A2E]/80 to-[#0B1220]/80'
                    }
                  `}
                >
                  <div className="p-4 h-full flex flex-col pb-6">
                    <div className="absolute top-3 left-3 bg-black/50 rounded px-2.5 py-1 border border-[#7BD389]/50 backdrop-blur-sm">
                      <span className="text-xs font-semibold text-[#A7E5B2] font-mono">#{a.id.toString().padStart(3, '0')}</span>
                    </div>

                    {isCollectible && (
                      <div className="absolute top-3 right-3 bg-black/55 rounded px-2.5 py-1 border border-white/15 backdrop-blur-sm">
                        <span className="text-[11px] font-semibold text-slate-200 font-mono tracking-wide">COLECIONÁVEL</span>
                      </div>
                    )}

                    <div className="flex items-center justify-center h-32 mb-3 bg-gradient-to-b from-[#172232] to-[#0B1220] rounded-lg border border-[#6fbf86]/15 group-hover:border-[#6fbf86]/30 transition-colors">
                      <span className="text-5xl drop-shadow-lg">🧪</span>
                    </div>

                    <h3 className="font-semibold text-slate-100 mb-0.5 text-base line-clamp-2 group-hover:text-[#A7E5B2] transition-colors">
                      {a.nome}
                    </h3>

                    <p className="text-[11px] text-slate-300/80 mb-3 font-normal group-hover:text-[#A7E5B2]/80 transition-colors">
                      {a.marca}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-[0.12em]">
                        {classeLabel(a.classe)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-[0.12em]">
                        {estagioLabel(a.estagio)}
                      </span>
                    </div>

                    <div className="flex-1 pt-3 border-t border-[rgba(255,255,255,0.12)]">
                      <div className="text-[11px] text-slate-300/80">
                        {typeof a.dosePadraoEmML === 'number' ? (
                          <span>
                            Dose padrão: <span className="font-semibold text-slate-100">{a.dosePadraoEmML} ml</span>
                          </span>
                        ) : (
                          <span>Dose padrão: <span className="font-semibold text-slate-100">—</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 50% 0%, rgba(123, 211, 137, 0.05) 0%, transparent 70%)',
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
