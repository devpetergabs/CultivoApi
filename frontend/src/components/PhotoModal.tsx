import { useEffect, useMemo, useState } from 'react';
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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<PlantaFotoAnalise | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreviewUrl(null);
      setDescription('');
      setAnalysis(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const contentType = useMemo(() => file?.type ?? '', [file]);

  const fileToBase64 = async (selectedFile: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Invalid file'));
          return;
        }
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(selectedFile);
    });

  const handleAnalyze = async () => {
    const trimmedDescription = description.trim();

    if (!file && !trimmedDescription) {
      setError('Envie uma imagem ou descreva o que deseja analisar.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const base64 = file ? await fileToBase64(file) : undefined;
      const result = await apiService.analisarPlantaFoto(plantId, {
        imagemBase64: base64,
        contentType: file ? contentType || 'image/jpeg' : undefined,
        descricao: trimmedDescription || undefined,
      });

      setAnalysis(result);
      try {
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: { tone: 'success', message: 'Análise visual concluída.' },
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
      title="Inspecionar com IA"
      subtitle={plantName}
      widthClass="w-full max-w-[720px]"
    >
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Imagem</label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-400 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#080B14] hover:file:brightness-110"
          />

          {previewUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/20">
              <img src={previewUrl} alt="Preview" className="h-56 w-full object-cover" />
            </div>
          )}

          <label className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Observação (opcional)</label>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: folhas com manchas nas pontas, amarelando embaixo, aspecto caído..."
            className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
          />

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          {!file && (
            <p className="mt-2 text-xs text-slate-500">
              A foto é opcional por enquanto. Você já pode usar só texto para análise inicial.
            </p>
          )}

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
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Leitura visual</p>
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
              Você pode enviar uma imagem da planta <strong className="text-slate-200">ou apenas descrever os sinais observados</strong> para receber uma leitura inicial da IA.
            </div>
          )}

          {isAnalyzing && (
            <div className="mt-6 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              {file ? 'Processando imagem e gerando hipóteses visuais...' : 'Interpretando o relato e gerando hipóteses iniciais...'}
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
