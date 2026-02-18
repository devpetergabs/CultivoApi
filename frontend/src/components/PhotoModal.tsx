import { useEffect, useMemo, useState } from 'react';
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
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

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

  if (!open) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[360px] rounded-xl border border-pokedex-neon/40 bg-[#0B1220] p-4 shadow-[0_0_25px_rgba(155,239,0,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-black text-white">Salvar foto</h3>
          <p className="text-xs text-slate-400">Planta: {plantName}</p>
        </div>

        <label className="text-xs font-bold text-slate-300">Imagem</label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-1 w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-pokedex-neon-green file:px-3 file:py-1 file:text-xs file:font-black file:text-black hover:file:brightness-110"
        />

        {previewUrl && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-700">
            <img src={previewUrl} alt="Preview" className="h-40 w-full object-cover" />
          </div>
        )}

        <label className="mt-3 block text-xs font-bold text-slate-300">Descricao (opcional)</label>
        <textarea
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-[#111A2E] px-3 py-2 text-sm text-white outline-none focus:border-pokedex-neon"
        />

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-slate-400"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-pokedex-neon-green px-3 py-2 text-xs font-black text-black hover:brightness-110"
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
