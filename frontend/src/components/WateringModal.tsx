import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import type { PlantaAditivo } from '../types';

interface WateringModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  plantName: string;
}

export function WateringModal({ open, onClose, plantId, plantName }: WateringModalProps) {
  const [wateringType, setWateringType] = useState<'NORMAL' | 'ADITIVADA'>('NORMAL');
  const [volumeLiters, setVolumeLiters] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAditivos, setIsLoadingAditivos] = useState(false);
  const [aditivos, setAditivos] = useState<PlantaAditivo[]>([]);
  const [selectedAditivos, setSelectedAditivos] = useState<Record<number, number>>({});

  const templateKey = useMemo(() => `plant-${plantId}-watering-mix`, [plantId]);

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

  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem(templateKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Array<{ id: number; doseMl: number }>;
        const initialSelection: Record<number, number> = {};
        parsed.forEach((item) => {
          if (typeof item.id === 'number' && typeof item.doseMl === 'number') {
            initialSelection[item.id] = item.doseMl;
          }
        });
        setSelectedAditivos(initialSelection);
        setWateringType('ADITIVADA');
      } catch {
        setSelectedAditivos({});
      }
    } else {
      setSelectedAditivos({});
      setWateringType('NORMAL');
    }
  }, [open, templateKey]);

  useEffect(() => {
    if (!open || wateringType !== 'ADITIVADA') return;
    let isActive = true;
    setIsLoadingAditivos(true);
    apiService
      .getPlantaAditivos(plantId)
      .then((response) => {
        const list = Array.isArray(response?.content) ? response.content : response;
        if (isActive) {
          setAditivos(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (isActive) {
          setAditivos([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingAditivos(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [open, wateringType, plantId]);

  if (!open) return null;

  const handleSave = async () => {
    const safeVolume = Number.isFinite(volumeLiters) ? volumeLiters : 0;
    if (safeVolume <= 0) {
      setError('Informe um volume maior que 0.');
      return;
    }

    if (wateringType === 'ADITIVADA') {
      const selectedIds = Object.keys(selectedAditivos).filter((key) => selectedAditivos[Number(key)] > 0);
      if (selectedIds.length === 0) {
        setError('Selecione ao menos um aditivo para a rega aditivada.');
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      const baseDescription = notes.trim().length > 0 ? notes.trim() : `Rega: ${safeVolume}L`;
      let description = baseDescription;

      if (wateringType === 'ADITIVADA') {
        const selectedEntries = Object.entries(selectedAditivos)
          .filter(([, dose]) => dose > 0)
          .map(([id, dose]) => {
            const aditivo = aditivos.find((item) => item.id === Number(id));
            const name = aditivo ? aditivo.aditivoNome : `Aditivo ${id}`;
            return `${name} ${dose}ml`;
          });
        if (selectedEntries.length > 0) {
          description = `${baseDescription} + ${selectedEntries.join(', ')}`;
        }
      }

      await apiService.createPlantaEvento(plantId, {
        tipo: 'REGA',
        descricao: description,
        doseEmML: Math.round(safeVolume * 1000),
      });

      if (wateringType === 'ADITIVADA') {
        const template = Object.entries(selectedAditivos)
          .filter(([, dose]) => dose > 0)
          .map(([id, dose]) => ({ id: Number(id), doseMl: dose }));
        localStorage.setItem(templateKey, JSON.stringify(template));
      }

      onClose();
    } catch {
      setError('Nao foi possivel registrar a rega.');
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
          <h3 className="text-sm font-black text-white">Registrar rega</h3>
          <p className="text-xs text-slate-400">Planta: {plantName}</p>
        </div>

        <label className="text-xs font-bold text-slate-300">Tipo de rega</label>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setWateringType('NORMAL')}
            className={`flex-1 rounded-lg border px-2 py-1 text-xs font-bold transition-colors ${
              wateringType === 'NORMAL'
                ? 'border-pokedex-neon bg-pokedex-neon text-black'
                : 'border-slate-700 bg-[#111A2E] text-slate-300'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setWateringType('ADITIVADA')}
            className={`flex-1 rounded-lg border px-2 py-1 text-xs font-bold transition-colors ${
              wateringType === 'ADITIVADA'
                ? 'border-pokedex-neon bg-pokedex-neon text-black'
                : 'border-slate-700 bg-[#111A2E] text-slate-300'
            }`}
          >
            Aditivada
          </button>
        </div>

        <label className="mt-3 block text-xs font-bold text-slate-300">Volume (L)</label>
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={volumeLiters}
          onChange={(event) => setVolumeLiters(Number(event.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-[#111A2E] px-3 py-2 text-sm text-white outline-none focus:border-pokedex-neon"
        />

        {wateringType === 'ADITIVADA' && (
          <div className="mt-3">
            <label className="text-xs font-bold text-slate-300">Aditivos do mix</label>
            {isLoadingAditivos ? (
              <p className="mt-2 text-xs text-slate-400">Carregando aditivos...</p>
            ) : aditivos.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">Nenhum aditivo cadastrado.</p>
            ) : (
              <div className="mt-2 space-y-2 max-h-36 overflow-y-auto">
                {aditivos.map((aditivo) => {
                  const checked = selectedAditivos[aditivo.id] !== undefined;
                  const doseValue = selectedAditivos[aditivo.id] ?? aditivo.doseEmML ?? 0;
                  return (
                    <div key={aditivo.id} className="flex items-center justify-between gap-2 text-xs">
                      <label className="flex items-center gap-2 text-slate-200">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const isChecked = event.target.checked;
                            setSelectedAditivos((prev) => {
                              const next = { ...prev };
                              if (isChecked) {
                                next[aditivo.id] = doseValue || 1;
                              } else {
                                delete next[aditivo.id];
                              }
                              return next;
                            });
                          }}
                        />
                        <span>{aditivo.aditivoNome}</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={doseValue}
                        disabled={!checked}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setSelectedAditivos((prev) => ({
                            ...prev,
                            [aditivo.id]: Number.isFinite(value) ? value : 0,
                          }));
                        }}
                        className="w-16 rounded border border-slate-700 bg-[#111A2E] px-2 py-1 text-xs text-white"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
