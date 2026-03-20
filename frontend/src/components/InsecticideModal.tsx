import { useEffect, useMemo, useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';
import { apiService } from '../services/api';
import type { Aditivo } from '../types';

interface InsecticideModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  plantName: string;
}

const PEST_CATALOG = [
  { value: 'PULGAO', label: 'Pulgão' },
  { value: 'MOSCA_BRANCA', label: 'Mosca-branca' },
  { value: 'TRIPES', label: 'Tripes' },
  { value: 'ACARO', label: 'Ácaro' },
  { value: 'COCHONILHA', label: 'Cochonilha' },
  { value: 'LAGARTA', label: 'Lagarta' },
] as const;

type PestType = (typeof PEST_CATALOG)[number]['value'];
type PestIntensity = 'BAIXA' | 'MEDIA' | 'ALTA';

function isInsecticideLike(aditivo: Aditivo): boolean {
  const tipo = String((aditivo as any)?.tipo ?? '').toUpperCase();
  const classe = String((aditivo as any)?.classe ?? '').toUpperCase();
  const label = String((aditivo as any)?.label ?? '').toUpperCase();

  if (tipo === 'INSETICIDA') return true;
  if (label === 'INSETICIDA') return true;
  if (classe === 'PROTECAO' || classe === 'PROTEÇÃO') return true;

  const nome = String(aditivo?.nome ?? '').toLowerCase();
  const marca = String(aditivo?.marca ?? '').toLowerCase();
  const hay = `${nome} ${marca}`;

  return (
    hay.includes('spinosad') ||
    hay.includes('neem') ||
    hay.includes('bacillus') ||
    hay.includes('bt') ||
    hay.includes('fung') ||
    hay.includes('inset')
  );
}

export function InsecticideModal({ open, onClose, plantId, plantName }: InsecticideModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<Aditivo[]>([]);

  const [pestType, setPestType] = useState<PestType>(PEST_CATALOG[0].value);
  const [intensity, setIntensity] = useState<PestIntensity>('MEDIA');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(() => {
    const filtered = inventory.filter(isInsecticideLike);
    return filtered.sort((a, b) => {
      const na = String(a.nome ?? '').toLocaleLowerCase('pt-BR');
      const nb = String(b.nome ?? '').toLocaleLowerCase('pt-BR');
      return na.localeCompare(nb, 'pt-BR');
    });
  }, [inventory]);

  const selectedProduct = selectable[0] ?? null;

  useEffect(() => {
    if (!open) return;

    setError(null);
    setPestType(PEST_CATALOG[0].value);
    setIntensity('MEDIA');
    setNotes('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    setIsLoading(true);
    setError(null);

    apiService
      .getAditivos(0, 500)
      .then((response) => {
        const list = (response as any)?.content ?? response;
        const itemsRaw = Array.isArray(list) ? (list as Aditivo[]) : [];
        if (!active) return;

        setInventory(itemsRaw);
      })
      .catch(() => {
        if (!active) return;
        setInventory([]);
        setError('Não foi possível carregar produtos de referência para registrar o sinal de praga.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  const canInteract = !isSaving && !isLoading;

  const handleAplicar = async () => {
    const id = Number(selectedProduct?.id ?? 0);

    const signalLine = `[PEST_SIGNAL] type=${pestType} intensity=${intensity}`;
    const safeObs = notes.trim();
    const descricao = safeObs ? `${signalLine}\n${safeObs}` : signalLine;

    setIsSaving(true);
    setError(null);
    try {
      await apiService.createPlantaEvento(plantId, {
        tipo: 'PRAGA',
        descricao,
        doseEmML: null,
        produtoId: Number.isFinite(id) && id > 0 ? id : null,
        roundsTotal: null,
        descansoDias: null,
        idempotencyKey: `pest-signal:${plantId}:${pestType}:${intensity}:${Date.now()}`,
      });

      // atualiza o card imediatamente (sem precisar recarregar lista)
      try {
        window.dispatchEvent(new CustomEvent('plant:praga-changed', { detail: { plantId, praga: true } }));
      } catch {
        // ignore
      }

      onClose();
    } catch {
      setError('Não foi possível registrar o sinal de praga.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Sinal de Praga"
      subtitle={`Marcação de praga: ${plantName}`}
      widthClass="w-full max-w-[380px]"
    >
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Tipo de praga</label>
          <select
            value={pestType}
            onChange={(event) => setPestType(event.target.value as PestType)}
            disabled={!canInteract}
            className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60"
          >
            {PEST_CATALOG.map((pest) => (
              <option key={pest.value} value={pest.value}>
                {pest.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Intensidade</label>
          <select
            value={intensity}
            onChange={(event) => setIntensity(event.target.value as PestIntensity)}
            disabled={!canInteract}
            className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60"
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
          </select>
        </div>
      </div>

      <label className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Observação (opcional)</label>
      <textarea
        rows={3}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        disabled={!canInteract}
        className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60"
      />

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-slate-200 transition-all disabled:opacity-60"
          disabled={!canInteract}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleAplicar}
          className="rounded-lg bg-[#f39a5c] px-3 py-2 text-xs font-semibold text-[#080B14] hover:brightness-110 disabled:opacity-60 transition-all"
          disabled={!canInteract || !selectedProduct}
        >
          {isSaving ? 'Registrando...' : 'Registrar sinal'}
        </button>
      </div>
    </PokedexModal>
  );
}