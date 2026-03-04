import { useEffect, useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';
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
    if (open) {
      setError(null);
      setNotes('');
    }
  }, [open]);

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
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Registrar nota"
      subtitle={plantName}
      widthClass="w-full max-w-[340px]"
    >
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Observação</label>
      <textarea
        rows={4}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
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
