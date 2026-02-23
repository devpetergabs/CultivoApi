import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
  const [mounted, setMounted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

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

  // ESC fecha (padrão modal de game/app)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await apiService.patchPlantaCrescer(plantId, {
        newHeightCm,
        newWidthCm,
        newStemWidthCm,
        notes,
      });

      setLoading(false);
      onClose();
      onSubmit?.({ newHeightCm, newWidthCm, newStemWidthCm, notes });
    } catch (err) {
      setLoading(false);
      setErrorMsg('Falha ao salvar. Tente novamente.');
      console.error('[GrowthModal] erro ao salvar', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // fecha só se clicou no backdrop
    if (e.target === e.currentTarget) onClose();
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

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-md px-4"
          onMouseDown={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Shell com borda “lendária” */}
          <motion.div
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative w-[360px] max-w-full"
            role="dialog"
            aria-modal="true"
            aria-labelledby="growth-modal-title"
          >
            {/* glow */}
            <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-emerald-400/10 blur-2xl opacity-60" />
            <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-amber-300/5 blur-2xl opacity-60" />

            <div className="rounded-2xl p-[1px] bg-gradient-to-br from-emerald-400/35 via-white/10 to-amber-300/25 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
              <div className="rounded-2xl bg-[#0B1220]/92 backdrop-blur-xl border border-white/10 overflow-hidden">
                {/* Header */}
                <div className="relative px-5 pt-5 pb-3 border-b border-white/10">
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-emerald-500/10 via-transparent to-amber-400/10" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.18)]">
                        <span className="text-lg">🌱</span>
                      </div>
                      <div>
                        <div className="text-[11px] tracking-[0.22em] uppercase text-emerald-200/90 font-extrabold">
                          LEVEL UP
                        </div>
                        <h2
                          id="growth-modal-title"
                          className="text-base font-extrabold text-slate-100 leading-tight"
                        >
                          Crescimento
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-bold text-slate-300/80 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                        #{plantId}
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition"
                        aria-label="Fechar"
                        title="Fechar (ESC)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-300/70">
                    Distribua pontos do dia. Dica: use <span className="text-emerald-200 font-bold">+1</span> para ajuste fino e{' '}
                    <span className="text-amber-200 font-bold">+5</span> para salto rápido.
                  </p>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="px-5 py-4">
                  {errorMsg && (
                    <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-200">
                      {errorMsg}
                    </div>
                  )}

                  {/* Campo helper */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* Altura */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-amber-200 font-extrabold tracking-wide">
                          ALTURA <span className="text-slate-300/70 font-bold">(cm)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Stepper.Btn
                            tone="emerald"
                            label="+1"
                            onClick={() => setNewHeightCm((v) => clampNonNegative(v + 1))}
                            disabled={loading}
                            title="Adicionar +1"
                          />
                          <Stepper.Btn
                            tone="amber"
                            label="+5"
                            onClick={() => setNewHeightCm((v) => clampNonNegative(v + 5))}
                            disabled={loading}
                            title="Adicionar +5"
                          />
                        </div>
                      </div>
                      <input
                        type="number"
                        value={newHeightCm}
                        onChange={(e) => setNewHeightCm(clampNonNegative(Number(e.target.value)))}
                        className="w-full rounded-lg border border-amber-300/20 bg-[#111A2E] px-3 py-2 text-emerald-100 text-sm font-extrabold focus:border-amber-200 focus:ring-2 focus:ring-amber-300/15 transition-all"
                        min={0}
                      />
                    </div>

                    {/* Largura */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-amber-200 font-extrabold tracking-wide">
                          LARGURA <span className="text-slate-300/70 font-bold">(cm)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Stepper.Btn
                            tone="emerald"
                            label="+1"
                            onClick={() => setNewWidthCm((v) => clampNonNegative(v + 1))}
                            disabled={loading}
                            title="Adicionar +1"
                          />
                          <Stepper.Btn
                            tone="amber"
                            label="+5"
                            onClick={() => setNewWidthCm((v) => clampNonNegative(v + 5))}
                            disabled={loading}
                            title="Adicionar +5"
                          />
                        </div>
                      </div>
                      <input
                        type="number"
                        value={newWidthCm}
                        onChange={(e) => setNewWidthCm(clampNonNegative(Number(e.target.value)))}
                        className="w-full rounded-lg border border-amber-300/20 bg-[#111A2E] px-3 py-2 text-emerald-100 text-sm font-extrabold focus:border-amber-200 focus:ring-2 focus:ring-amber-300/15 transition-all"
                        min={0}
                      />
                    </div>

                    {/* Caule */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-amber-200 font-extrabold tracking-wide">
                          CAULE <span className="text-slate-300/70 font-bold">(cm)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Stepper.Btn
                            tone="emerald"
                            label="+1"
                            onClick={() => setNewStemWidthCm((v) => clampNonNegative(v + 1))}
                            disabled={loading}
                            title="Adicionar +1"
                          />
                          <Stepper.Btn
                            tone="amber"
                            label="+5"
                            onClick={() => setNewStemWidthCm((v) => clampNonNegative(v + 5))}
                            disabled={loading}
                            title="Adicionar +5"
                          />
                        </div>
                      </div>
                      <input
                        type="number"
                        value={newStemWidthCm}
                        onChange={(e) => setNewStemWidthCm(clampNonNegative(Number(e.target.value)))}
                        className="w-full rounded-lg border border-amber-300/20 bg-[#111A2E] px-3 py-2 text-emerald-100 text-sm font-extrabold focus:border-amber-200 focus:ring-2 focus:ring-amber-300/15 transition-all"
                        min={0}
                      />
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <label className="block text-xs text-emerald-200 font-extrabold tracking-wide mb-2">
                        OBS <span className="text-slate-300/70 font-bold">(opcional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-emerald-400/15 bg-[#111A2E] px-3 py-2 text-emerald-100 text-sm font-semibold focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/15 transition-all"
                        rows={2}
                        placeholder="Ex: amarrei galhos, aumentei sol, folhas novas..."
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-300/70">
                      <span className="text-emerald-200 font-bold">Dica:</span> registrar certo dá XP no futuro 😉
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-3 py-2 rounded-lg bg-[#232d3a] text-amber-200 text-xs font-extrabold border border-amber-300/25 hover:bg-amber-300 hover:text-[#232d3a] transition-all disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-300 text-[#0B1220] text-xs font-extrabold border border-emerald-300/30 shadow-[0_0_16px_rgba(16,185,129,0.20)] hover:brightness-110 transition-all disabled:opacity-60"
                      >
                        {loading ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};