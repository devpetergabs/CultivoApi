import { useEffect, useMemo, useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';
import { apiService } from '../services/api';

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreviewUrl(null);
      setDescription('');
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

  const handleSave = async () => {
    if (!file) {
      setError('Selecione uma imagem.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
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
        reader.readAsDataURL(file);
      });

      await apiService.createPlantaFoto(plantId, {
        imagemBase64: base64,
        contentType: contentType || 'image/jpeg',
        descricao: description.trim() || undefined,
      });

      onClose();
    } catch {
      setError('Nao foi possivel salvar a foto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Salvar foto"
      subtitle={plantName}
      widthClass="w-full max-w-[360px]"
    >
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Imagem</label>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-400 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#080B14] hover:file:brightness-110"
      />

      {previewUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
          <img src={previewUrl} alt="Preview" className="h-40 w-full object-cover" />
        </div>
      )}

      <label className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Descrição (opcional)</label>
      <textarea
        rows={2}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
      />

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-slate-200 transition-all"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-[#080B14] hover:brightness-110 disabled:opacity-60 transition-all"
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </PokedexModal>
  );
}
