import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import { PokedexModal } from './ui/PokedexModal';
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
      localStorage.setItem(volumeKey, String(safeMl));
      const defaultDesc =
        wateringType === 'ADITIVADA'
          ? `Rega (aditivada): ${safeMl}mL`
          : `Rega (água pura): ${safeMl}mL`;
      const baseDescription = notes.trim().length > 0 ? notes.trim() : defaultDesc;
      let description = baseDescription;
      if (wateringType === 'ADITIVADA') {
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
        saveWateringMix(plantId, mix);
      }
      onClose();
    } catch {
      setError('Nao foi possivel registrar a rega.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Programar modelo de rega"
      subtitle={`Planta: ${plantName}`}
      widthClass="w-full max-w-[400px]"
      onEscape={() => {
        if (toolboxOpen) { setToolboxOpen(false); return; }
        onClose();
      }}
    >
      {/* Tipo de rega */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
          Tipo de rega
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWateringType('NORMAL')}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
              wateringType === 'NORMAL'
                ? 'border-[#6fbf86]/50 bg-[#6fbf86]/15 text-[#6fbf86]'
                : 'border-white/10 bg-[#080B14] text-slate-400 hover:text-slate-200'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setWateringType('ADITIVADA')}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
              wateringType === 'ADITIVADA'
                ? 'border-[#6fbf86]/50 bg-[#6fbf86]/15 text-[#6fbf86]'
                : 'border-white/10 bg-[#080B14] text-slate-400 hover:text-slate-200'
            }`}
          >
            Aditivada
          </button>
        </div>
      </div>

      {/* Volume */}
      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
            Volume (mL)
          </label>
          <input
            type="number"
            min={10}
            step={10}
            value={volumeMl}
            onChange={(event) => setVolumeMl(Number(event.target.value))}
            className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/50 focus:ring-1 focus:ring-[#6fbf86]/20 transition-all duration-150"
          />
        </div>
        <div className="pb-1.5 text-right flex-shrink-0">
          <div className="text-[10px] text-slate-500">≈</div>
          <div className="text-xs font-semibold text-slate-300 tabular-nums">{volumeLiters.toFixed(2)} L</div>
        </div>
      </div>

      {/* Aditivos do mix */}
      {wateringType === 'ADITIVADA' && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Aditivos do mix
            </label>
            <button
              type="button"
              onClick={() => setToolboxOpen(true)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:border-white/20 transition-all duration-150"
            >
              {mix.length > 0 ? 'Editar mix' : 'Selecionar'}
            </button>
          </div>
          {mix.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum aditivo selecionado.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mix.map((item) => {
                const label = item.marca ? `${item.nome} (${item.marca})` : item.nome;
                const totalMl = Math.round(item.doseMl * volumeLiters);
                return (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200"
                  >
                    <span className="max-w-[200px] truncate">{label}</span>
                    <span className="text-slate-400 font-mono tabular-nums text-[11px]">{totalMl}mL</span>
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
                      className="text-slate-500 hover:text-white transition-colors"
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

      {/* Observação */}
      <div className="mt-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
          Observação (opcional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notas sobre esta rega…"
          className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-[#6fbf86]/50 focus:ring-1 focus:ring-[#6fbf86]/20 transition-all duration-150 resize-none"
        />
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:border-white/20 disabled:opacity-50 transition-all duration-150"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-[#6fbf86] px-4 py-2 text-xs font-semibold text-[#080B14] hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all duration-150"
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
            if (next.length === 0) {
              clearWateringMix(plantId);
              setWateringType('NORMAL');
            } else {
              setWateringType('ADITIVADA');
            }
          }}
        />
      )}
    </PokedexModal>
  );
}
