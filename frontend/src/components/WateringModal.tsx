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
  const [volumeLiters, setVolumeLiters] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [mix, setMix] = useState<StoredWateringMixItem[]>([]);

  const volumeKey = useMemo(() => 'watering-volume-ml', []);

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
    setVolumeLiters(Math.max(0.1, parsed / 1000));
  }, [open, volumeKey]);

  useEffect(() => {
    if (!open) return;
    const stored = loadWateringMix(plantId);
    setMix(stored);
    setWateringType(stored.length > 0 ? 'ADITIVADA' : 'NORMAL');
  }, [open, plantId]);

  if (!open || typeof document === 'undefined') return null;

  const handleSave = async () => {
    const safeVolume = Number.isFinite(volumeLiters) ? volumeLiters : 0;
    if (safeVolume <= 0) {
      setError('Informe um volume maior que 0.');
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
      localStorage.setItem(volumeKey, String(Math.round(safeVolume * 1000)));
      const baseDescription = notes.trim().length > 0 ? notes.trim() : `Rega: ${safeVolume}L`;
      let description = baseDescription;

      if (wateringType === 'ADITIVADA') {
        const selectedEntries = mix
          .filter((item) => item.doseMl > 0)
          .map((item) => {
            const label = item.marca ? `${item.nome} (${item.marca})` : item.nome;
            return `${label} ${item.doseMl}ml`;
          });
        if (selectedEntries.length > 0) {
          description = `${baseDescription} + ${selectedEntries.join(', ')}`;
        }
      }

      await apiService.createPlantaEvento(plantId, {
        tipo: wateringType === 'ADITIVADA' ? 'REGA_ADITIVADA' : 'REGA_NORMAL',
        descricao: description,
        doseEmML: Math.round(safeVolume * 1000),
      });

      if (wateringType === 'ADITIVADA') {
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
          <h3 className="text-sm font-semibold text-white tracking-tight">Registrar rega</h3>
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

        <label className="mt-3 block text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Volume (L)</label>
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={volumeLiters}
          onChange={(event) => setVolumeLiters(Number(event.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
        />

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
                  return (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-100"
                    >
                      <span className="max-w-[220px] truncate">{label}</span>
                      <span className="text-slate-300/80 font-mono">{item.doseMl}ml</span>
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
            className="rounded-lg bg-[#6fbf86] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110"
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <AditivosToolbox
          open={toolboxOpen}
          plantStage={plantStage}
          plantId={plantId}
          initialSelected={mix}
          onClose={() => setToolboxOpen(false)}
          onApply={(selected) => {
            setMix(selected);
            if (selected.length === 0) {
              clearWateringMix(plantId);
              setWateringType('NORMAL');
              return;
            }
            saveWateringMix(plantId, selected);
            setWateringType('ADITIVADA');
          }}
        />
      </div>
    </div>,
    document.body
  );
}
