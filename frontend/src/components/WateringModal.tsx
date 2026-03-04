import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';
import type { PlantType } from '../types/pokedex';
import { AditivosToolbox } from './AditivosToolbox';
import {
  clearWateringMix,
  loadWateringMix,
  saveWateringMix,
  type StoredWateringMixItem,
} from '../utils/wateringMixStorage';

interface WateringModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  plantName: string;
  plantStage: PlantType;
}

export function WateringModal({ open, onClose, plantId, plantName, plantStage }: WateringModalProps) {
  const [wateringType, setWateringType] = useState<'NORMAL' | 'ADITIVADA'>('NORMAL');

  // ✅ Agora a UI trabalha em mL (backend já recebe doseEmML)
  const [volumeMl, setVolumeMl] = useState(1000);

  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [mix, setMix] = useState<StoredWateringMixItem[]>([]);

  const volumeKey = useMemo(() => `plant:${plantId}:watering-volume-ml`, [plantId]);

  // conversão só pra cálculos e preview
  const volumeLiters = Math.max(0, Number.isFinite(volumeMl) ? volumeMl : 0) / 1000;

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (toolboxOpen) {
          setToolboxOpen(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, toolboxOpen]);

  useEffect(() => {
    if (open) {
      setError(null);
      setNotes('');
      setToolboxOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem(volumeKey);
    if (!stored) return;
    const parsed = Number(stored);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setVolumeMl(Math.max(10, Math.round(parsed)));
  }, [open, volumeKey]);

  useEffect(() => {
    if (!open) return;
    const stored = loadWateringMix(plantId);
    setMix(stored);
    setWateringType(stored.some((x) => x.doseMl > 0) ? 'ADITIVADA' : 'NORMAL');
  }, [open, plantId]);

  if (!open || typeof document === 'undefined') return null;

  const handleSave = async () => {
    const safeMl = Number.isFinite(volumeMl) ? Math.round(volumeMl) : 0;

    if (safeMl <= 0) {
      setError('Informe um volume maior que 0 mL.');
      return;
    }

    if (wateringType === 'ADITIVADA') {
      const selectedIds = mix.filter((x) => x.doseMl > 0);
      if (selectedIds.length === 0) {
        setError('Selecione ao menos um aditivo para a rega aditivada.');
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      // ✅ Persistimos em mL (igual a chave já sugere)
      localStorage.setItem(volumeKey, String(safeMl));

      // descrição default agora fica “Rega (água pura): 600mL”
      const defaultDesc =
        wateringType === 'ADITIVADA'
          ? `Rega (aditivada): ${safeMl}mL`
          : `Rega (água pura): ${safeMl}mL`;

      const baseDescription = notes.trim().length > 0 ? notes.trim() : defaultDesc;
      let description = baseDescription;

      if (wateringType === 'ADITIVADA') {
        // doseMl = dose por litro (ml/L). total = dose * litros
        const selectedEntries = mix
          .filter((item) => item.doseMl > 0)
          .map((item) => {
            const label = item.marca ? `${item.nome} (${item.marca})` : item.nome;
            const totalMl = Math.round(item.doseMl * volumeLiters);
            return `${label} ${totalMl}ml`;
          });

        if (selectedEntries.length > 0) {
          description = `${baseDescription} + ${selectedEntries.join(', ')}`;
        }
      }

      await apiService.createPlantaEvento(plantId, {
        tipo: wateringType === 'ADITIVADA' ? 'MODELO_ADITIVADO' : 'MODELO_NORMAL',
        descricao: description,
        doseEmML: safeMl,
      });

      if (wateringType === 'ADITIVADA') {
        // Apenas salva o mix, não deduz estoque aqui.
        saveWateringMix(plantId, mix);
      }

      onClose();
    } catch {
      setError('Nao foi possivel registrar a rega.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => {
        if (toolboxOpen) {
          setToolboxOpen(false);
          return;
        }
        onClose();
      }}
    >
      <div
        className="relative w-[360px] rounded-xl border border-[#6fbf86]/20 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">Programar modelo de rega</h3>
          <p className="text-xs text-[#9fb0c0] font-normal">Planta: {plantName}</p>
        </div>

        <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Tipo de rega</label>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setWateringType('NORMAL')}
            className={`flex-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${
              wateringType === 'NORMAL'
                ? 'border-[#6fbf86]/80 bg-[#6fbf86]/90 text-[#0B1220]'
                : 'border-slate-600/70 bg-[#0f1726] text-slate-300'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setWateringType('ADITIVADA')}
            className={`flex-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${
              wateringType === 'ADITIVADA'
                ? 'border-[#6fbf86]/80 bg-[#6fbf86]/90 text-[#0B1220]'
                : 'border-slate-600/70 bg-[#0f1726] text-slate-300'
            }`}
          >
            Aditivada
          </button>
        </div>

        {/* ✅ Volume agora em mL */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Volume (mL)</label>
            <input
              type="number"
              min={10}
              step={10}
              value={volumeMl}
              onChange={(event) => setVolumeMl(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
            />
          </div>

          <div className="pb-1 text-right">
            <div className="text-[11px] text-white/50">≈</div>
            <div className="text-xs font-semibold text-white/80">{volumeLiters.toFixed(2)} L</div>
          </div>
        </div>

        {wateringType === 'ADITIVADA' && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Aditivos do mix</label>
              <button
                type="button"
                onClick={() => setToolboxOpen(true)}
                className="rounded-lg border border-slate-600/70 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-[#6fbf86]/60 hover:shadow-[0_0_12px_rgba(111,191,134,0.12)] transition"
              >
                {mix.length > 0 ? 'Editar mix' : 'Selecionar'}
              </button>
            </div>

            {mix.length === 0 ? (
              <p className="mt-2 text-xs text-[#9fb0c0]">Nenhum aditivo selecionado.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {mix.map((item) => {
                  const label = item.marca ? `${item.nome} (${item.marca})` : item.nome;
                  const totalMl = Math.round(item.doseMl * volumeLiters);
                  return (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-100"
                    >
                      <span className="max-w-[220px] truncate">{label}</span>
                      <span className="text-slate-300/80 font-mono">{totalMl}ml</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = mix.filter((x) => x.id !== item.id);
                          setMix(next);
                          if (next.length === 0) {
                            clearWateringMix(plantId);
                            setWateringType('NORMAL');
                          } else {
                            saveWateringMix(plantId, next);
                          }
                        }}
                        className="text-slate-200/80 hover:text-white"
                        aria-label={`Remover ${item.nome}`}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <label className="mt-3 block text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Observacao (opcional)</label>
        <textarea
          rows={3}
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
            className="rounded-lg bg-[#6fbf86]/90 px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110 disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>

        {toolboxOpen && (
        <AditivosToolbox
          open={toolboxOpen}
          onClose={() => setToolboxOpen(false)}
          plantId={plantId}
          plantStage={plantStage}
          initialSelected={mix}
          onApply={(next) => {
            setMix(next);
            saveWateringMix(plantId, next);

            // se zerar o mix, volta pra NORMAL
            if (next.length === 0) {
              clearWateringMix(plantId);
              setWateringType('NORMAL');
            } else {
              setWateringType('ADITIVADA');
            }
          }}
  />
)}
      </div>
    </div>,
    document.body
  );
}