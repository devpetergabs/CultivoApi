import { useEffect, useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';
import { apiService } from '../services/api';
import type { PlantaFotoAnalise } from '../types';

interface PhotoModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  plantName: string;
}

export function PhotoModal({ open, onClose, plantId, plantName }: PhotoModalProps) {
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<PlantaFotoAnalise | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDescription('');
      setAnalysis(null);
      setError(null);
    }
  }, [open]);

  const handleAnalyze = async () => {
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError('Descreva o que deseja analisar.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await apiService.analisarPlantaFoto(plantId, {
        descricao: trimmedDescription || undefined,
      });

      setAnalysis(result);
      try {
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: { tone: 'success', message: 'Leitura textual concluída.' },
          })
        );
      } catch {
        // noop
      }
    } catch (err: any) {
      const serverMessage =
        typeof err?.response?.data === 'string'
          ? err.response.data
          : err?.response?.data?.message;
      setError(serverMessage || 'Nao foi possivel analisar a imagem.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Doctor P."
      subtitle={plantName}
      widthClass="w-full max-w-[680px]"
    >
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Relato</label>
          <textarea
            rows={8}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: folhas com pontas queimadas, amarelamento nas folhas de baixo, presença de pontinhos, planta caída, estagnação, sinais percebidos no relato..."
            className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
          />

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          <p className="mt-2 text-xs text-slate-500">
            MVP em modo texto. Foto entra depois como feature nova.
          </p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-slate-200 transition-all"
              disabled={isAnalyzing}
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-[#080B14] hover:brightness-110 disabled:opacity-60 transition-all"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 min-h-[320px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Leitura textual</p>
              <h4 className="mt-1 text-sm font-semibold text-white">Resposta da IA</h4>
            </div>
            {analysis?.modelo && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                {analysis.modelo}
              </span>
            )}
          </div>

          {!analysis && !isAnalyzing && (
            <div className="mt-6 rounded-lg border border-dashed border-white/10 bg-[#080B14]/70 p-4 text-sm text-slate-400">
              Descreva os sinais observados para receber uma leitura inicial baseada apenas no relato.
            </div>
          )}

          {isAnalyzing && (
            <div className="mt-6 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              Interpretando o relato e gerando hipóteses iniciais...
            </div>
          )}

          {analysis && (
            <>
              <div className="mt-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-[#080B14]/80 p-4 text-sm leading-6 text-slate-100">
                {analysis.resposta}
              </div>
              <p className="mt-3 text-xs text-slate-400">{analysis.observacao}</p>
            </>
          )}
        </div>
      </div>
    </PokedexModal>
  );
}
