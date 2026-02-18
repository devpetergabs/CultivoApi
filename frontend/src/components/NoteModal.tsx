import { useEffect, useState } from 'react';
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

  if (!open) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[340px] rounded-xl border border-pokedex-neon/40 bg-[#0B1220] p-4 shadow-[0_0_25px_rgba(155,239,0,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-black text-white">Registrar nota</h3>
          <p className="text-xs text-slate-400">Planta: {plantName}</p>
        </div>

        <label className="text-xs font-bold text-slate-300">Observacao</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
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
