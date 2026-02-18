import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface InsecticideModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  plantName: string;
}

export function InsecticideModal({ open, onClose, plantId, plantName }: InsecticideModalProps) {
  const [doseMl, setDoseMl] = useState<number>(10);
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
      setDoseMl(10);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    const safeDose = Number.isFinite(doseMl) ? doseMl : 0;
    if (safeDose <= 0) {
      setError('Informe uma dose maior que 0.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const description = notes.trim().length > 0 ? notes.trim() : `Inseticida: ${safeDose}mL`;
      await apiService.createPlantaEvento(plantId, {
        tipo: 'INSETICIDA',
        descricao: description,
        doseEmML: Math.round(safeDose),
      });
      onClose();
    } catch {
      setError('Nao foi possivel registrar o inseticida.');
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
        className="w-[320px] rounded-xl border border-pokedex-neon/40 bg-[#0B1220] p-4 shadow-[0_0_25px_rgba(155,239,0,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-black text-white">Registrar inseticida</h3>
          <p className="text-xs text-slate-400">Planta: {plantName}</p>
        </div>

        <label className="text-xs font-bold text-slate-300">Dose (mL)</label>
        <input
          type="number"
          min={1}
          step={1}
          value={doseMl}
          onChange={(event) => setDoseMl(Number(event.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-[#111A2E] px-3 py-2 text-sm text-white outline-none focus:border-pokedex-neon"
        />

        <label className="mt-3 block text-xs font-bold text-slate-300">Observacao (opcional)</label>
        <textarea
          rows={3}
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
