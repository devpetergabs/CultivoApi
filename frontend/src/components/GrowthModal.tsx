import React, { useEffect, useMemo, useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';
import { apiService } from '../services/api';

interface GrowthModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  onSubmit?: (data: GrowthData) => void;
}

export interface GrowthData {
  newHeightCm: number;
  newWidthCm: number;
  newStemWidthCm: number;
  notes?: string;
}

export const GrowthModal: React.FC<GrowthModalProps> = ({ open, onClose, plantId, onSubmit }) => {
  const [newHeightCm, setNewHeightCm] = useState(0);
  const [newWidthCm, setNewWidthCm] = useState(0);
  const [newStemWidthCm, setNewStemWidthCm] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  // Reset clean quando abre (mantém UX de “nova ação”)
  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setLoading(false);
    setNewHeightCm(0);
    setNewWidthCm(0);
    setNewStemWidthCm(0);
    setNotes('');
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await apiService.patchPlantaCrescer(plantId, {
        altura: newHeightCm,
        largura: newWidthCm,
        larguraCaule: newStemWidthCm,
        descricao: notes,
      });

      setLoading(false);
      onClose();
      onSubmit?.({ newHeightCm, newWidthCm, newStemWidthCm, notes });
      // Garante refresh dos dados na página
      window.location.reload();
    } catch (err) {
      setLoading(false);
      const status = (err as any)?.response?.status;
      if (status === 403 || status === 404) {
        setErrorMsg('Você não é o proprietário desta planta.');
      } else {
        setErrorMsg('Falha ao salvar. Tente novamente.');
      }
      console.error('[GrowthModal] erro ao salvar', err);
    }
  };

  const clampNonNegative = (v: number) => Math.max(0, Math.round(v));

  const Stepper = useMemo(() => {
    const Btn = ({
      label,
      onClick,
      tone,
      disabled,
      title,
    }: {
      label: string;
      onClick: () => void;
      tone: 'emerald' | 'amber';
      disabled?: boolean;
      title?: string;
    }) => (
      <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={onClick}
        className={`px-2 py-1 rounded-md text-[11px] font-extrabold border transition-all active:scale-95
          ${
            tone === 'emerald'
              ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/25 hover:border-emerald-300/50 hover:bg-emerald-500/15'
              : 'bg-amber-400/10 text-amber-200 border-amber-300/25 hover:border-amber-200/50 hover:bg-amber-400/15'
          }
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      >
        {label}
      </button>
    );

    return { Btn };
  }, []);


  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Crescimento"
      subtitle="Distribua os pontos do dia para registrar o crescimento."
      widthClass="w-full max-w-[360px]"
      headerActions={
        <div className="text-[11px] font-bold text-slate-300/80 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
          #{plantId}
        </div>
      }
    >
      <form onSubmit={handleSave}>
        {errorMsg && (
          <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-200">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-white/10 bg-[#101726] p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Altura <span className="text-slate-500">(cm)</span></label>
              <div className="flex items-center gap-1.5">
                <Stepper.Btn tone="emerald" label="+1" onClick={() => setNewHeightCm((v) => clampNonNegative(v + 1))} disabled={loading} />
                <Stepper.Btn tone="amber" label="+5" onClick={() => setNewHeightCm((v) => clampNonNegative(v + 5))} disabled={loading} />
              </div>
            </div>
            <input type="number" value={newHeightCm} onChange={(e) => setNewHeightCm(clampNonNegative(Number(e.target.value)))} min={0} className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30" />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#101726] p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Largura <span className="text-slate-500">(cm)</span></label>
              <div className="flex items-center gap-1.5">
                <Stepper.Btn tone="emerald" label="+1" onClick={() => setNewWidthCm((v) => clampNonNegative(v + 1))} disabled={loading} />
                <Stepper.Btn tone="amber" label="+5" onClick={() => setNewWidthCm((v) => clampNonNegative(v + 5))} disabled={loading} />
              </div>
            </div>
            <input type="number" value={newWidthCm} onChange={(e) => setNewWidthCm(clampNonNegative(Number(e.target.value)))} min={0} className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30" />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#101726] p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Caule <span className="text-slate-500">(cm)</span></label>
              <div className="flex items-center gap-1.5">
                <Stepper.Btn tone="emerald" label="+1" onClick={() => setNewStemWidthCm((v) => clampNonNegative(v + 1))} disabled={loading} />
                <Stepper.Btn tone="amber" label="+5" onClick={() => setNewStemWidthCm((v) => clampNonNegative(v + 5))} disabled={loading} />
              </div>
            </div>
            <input type="number" value={newStemWidthCm} onChange={(e) => setNewStemWidthCm(clampNonNegative(Number(e.target.value)))} min={0} className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30" />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#101726] p-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Observações <span className="text-slate-500">(opcional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex: amarrei galhos, aumentei sol, folhas novas..." className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30" />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-slate-200 transition-all disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={loading} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-[#080B14] hover:brightness-110 disabled:opacity-60 transition-all">{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </PokedexModal>
  );
};
