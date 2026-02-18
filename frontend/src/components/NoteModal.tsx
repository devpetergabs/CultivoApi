import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  plantName: string;
}

export function NoteModal({ open, onClose, plantId, plantName }: NoteModalProps) {
  const [notes, setNotes] = useState('');
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
      setError(null);
      setNotes('');
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const handleSave = async () => {
    const description = notes.trim();
    if (description.length === 0) {
      setError('Escreva uma observacao antes de salvar.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await apiService.createPlantaEvento(plantId, {
        tipo: 'OBSERVACAO',
        descricao: description,
      });
      onClose();
    } catch {
      setError('Nao foi possivel salvar a nota.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[340px] rounded-xl border border-[#6fbf86]/20 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">Registrar nota</h3>
          <p className="text-xs text-[#9fb0c0] font-normal">Planta: {plantName}</p>
        </div>

        <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Observacao</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
        />

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600/70 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-400"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[#6fbf86] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110"
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
