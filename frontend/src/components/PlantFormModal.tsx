import { useEffect, useMemo, useState } from 'react';
import type { Plant, PlantType } from '../types/pokedex';
import { apiService } from '../services/api';
import { mapPlantaToPokedexPlant } from '../utils/mapPlantaToPokedex';
import {
  DEFAULT_STRAINS,
  brDateToIso,
  loadCustomStrains,
  mergeStrains,
  normalizeStrain,
  potLitersToEnum,
  saveCustomStrains,
} from '../utils/plantFormUtils';

type Mode = 'create' | 'edit';

type SexoValue = 'FEMEA' | 'MACHO' | 'HERMAFRODITA';

interface PlantFormModalProps {
  mode: Mode;
  initialPlant?: Plant | null;
  availableStrains?: string[];
  grower?: { name?: string | null; phone?: string | null };
  onClose: () => void;
  onSaved: (plant: Plant) => void;
}

const ADD_STRAIN_VALUE = '__ADD__';

export function PlantFormModal({
  mode,
  initialPlant,
  availableStrains,
  grower,
  onClose,
  onSaved,
}: PlantFormModalProps) {
  const [name, setName] = useState('');
  const [strain, setStrain] = useState('');
  const [customStrainInput, setCustomStrainInput] = useState('');
  const [isAddingStrain, setIsAddingStrain] = useState(false);

  const [stage, setStage] = useState<PlantType>('GERMINACAO');
  const [pot, setPot] = useState<'CINCO_L' | 'VINTE_E_UM_L' | 'TRINTA_L'>('CINCO_L');
  const [height, setHeight] = useState(10);
  const [width, setWidth] = useState(10);
  const [stemWidth, setStemWidth] = useState(1);

  // Full fields (edit)
  const [germinacaoIso, setGerminacaoIso] = useState<string>('');
  const [sexo, setSexo] = useState<SexoValue | ''>('');
  const [sexagemIso, setSexagemIso] = useState<string>('');
  const [floracaoIso, setFloracaoIso] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strains = useMemo(() => {
    const fromLocal = loadCustomStrains();
    const merged = mergeStrains(
      Array.from(DEFAULT_STRAINS),
      availableStrains ?? [],
      fromLocal
    );

    // Keep deterministic ordering: defaults first, then rest alpha.
    const defaults = Array.from(DEFAULT_STRAINS);
    const rest = merged
      .filter((s) => !defaults.includes(s as any))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return [...defaults, ...rest];
  }, [availableStrains]);

  useEffect(() => {
    if (mode === 'edit' && initialPlant) {
      setName(initialPlant.name ?? '');
      setStrain(initialPlant.variant ?? '');
      setStage(initialPlant.type);
      setPot(potLitersToEnum(initialPlant.potLiters));
      setHeight(initialPlant.heightCm);
      setWidth(initialPlant.widthCm);
      setStemWidth(initialPlant.stemWidthCm);

      setGerminacaoIso(brDateToIso(initialPlant.germinationDate) ?? '');
      setSexo((initialPlant.sexo as SexoValue) ?? '');
      setSexagemIso(brDateToIso(initialPlant.dataSexagem) ?? '');
      setFloracaoIso(brDateToIso(initialPlant.dataFloracao) ?? '');
    } else {
      setName('');
      setStrain(strains[0] ?? '');
      setStage('GERMINACAO');
      setPot('CINCO_L');
      setHeight(10);
      setWidth(10);
      setStemWidth(1);

      setGerminacaoIso('');
      setSexo('');
      setSexagemIso('');
      setFloracaoIso('');
    }

    setIsAddingStrain(false);
    setCustomStrainInput('');
    setIsSaving(false);
    setError(null);
  }, [mode, initialPlant, strains]);

  const addCustomStrain = () => {
    const normalized = normalizeStrain(customStrainInput);
    if (!normalized) return;

    const current = loadCustomStrains();
    const updated = mergeStrains(current, [normalized]);
    saveCustomStrains(updated);

    setStrain(normalized);
    setCustomStrainInput('');
    setIsAddingStrain(false);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe um nome para a planta.');
      return;
    }

    const normalizedStrain = normalizeStrain(strain);
    if (!normalizedStrain) {
      setError('Informe uma strain para a planta.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Se estágio for germinação, força altura/largura/caule para 0
      const alturaPayload = stage === 'GERMINACAO' ? 0 : height;
      const larguraPayload = stage === 'GERMINACAO' ? 0 : width;
      const caulePayload = stage === 'GERMINACAO' ? 0 : stemWidth;

      if (mode === 'create') {
        const payload = {
          nome: trimmedName,
          strain: normalizedStrain,
          altura: alturaPayload,
          largura: larguraPayload,
          larguraCaule: caulePayload,
          tamanhoVaso: pot,
          estagio: stage,
          dataGerminacao: null,
          sexo: null,
          dataSexagem: null,
          dataFloracao: null,
        };

        const created = await apiService.createPlantaMe(payload);
        const mapped = mapPlantaToPokedexPlant(created, {
          name: grower?.name ?? null,
          phone: grower?.phone ?? null,
        });
        onSaved(mapped);
        onClose();
        return;
      }

      if (!initialPlant) {
        setError('Planta inválida para edição.');
        return;
      }

      const payload = {
        nome: trimmedName,
        strain: normalizedStrain,
        dataGerminacao: germinacaoIso ? germinacaoIso : null,
        altura: alturaPayload,
        largura: larguraPayload,
        larguraCaule: caulePayload,
        tamanhoVaso: pot,
        estagio: stage,
        sexo: sexo || null,
        dataSexagem: sexagemIso ? sexagemIso : null,
        dataFloracao: floracaoIso ? floracaoIso : null,
      };

      const updated = await apiService.updatePlanta(initialPlant.id, payload);
      const mapped = mapPlantaToPokedexPlant(updated, {
        name: grower?.name ?? null,
        phone: grower?.phone ?? null,
      });

      onSaved(mapped);
      onClose();
    } catch {
      setError(mode === 'create' ? 'Não foi possível criar a planta.' : 'Não foi possível salvar a edição.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[420px] max-w-[92vw] rounded-xl border border-[#6fbf86]/20 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              {mode === 'create' ? 'Nova planta' : 'Editar planta'}
            </h3>
            <p className="text-xs text-[#9fb0c0] font-normal">
              {mode === 'create'
                ? 'Cria uma nova entrada na Pokédex.'
                : 'Atualiza os dados da planta selecionada.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl transition-colors font-semibold"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
        />

        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Espécie / Strain</label>
          <select
            value={isAddingStrain ? ADD_STRAIN_VALUE : strain}
            onChange={(event) => {
              const v = event.target.value;
              if (v === ADD_STRAIN_VALUE) {
                setIsAddingStrain(true);
                setCustomStrainInput('');
                return;
              }
              setIsAddingStrain(false);
              setStrain(v);
            }}
            className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
          >
            {strains.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value={ADD_STRAIN_VALUE}>Adicionar…</option>
          </select>

          {isAddingStrain && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customStrainInput}
                onChange={(event) => setCustomStrainInput(event.target.value)}
                placeholder="Nova strain"
                className="flex-1 rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
              />
              <button
                onClick={addCustomStrain}
                className="rounded-lg border-2 border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#6fbf86]/60 hover:shadow-[0_0_12px_rgba(111,191,134,0.12)] transition"
                type="button"
              >
                Adicionar
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Estágio</label>
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value as any)}
              className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
            >
              <option value="GERMINACAO">Germinação</option>
              <option value="VEGETATIVO">Vegetativo</option>
              <option value="FLORACAO_INICIAL">Floração Inicial</option>
              <option value="FLORACAO_MEDIA">Floração Média</option>
              <option value="FLORACAO_AVANCADA">Floração Avançada</option>
              <option value="FINALIZACAO">Finalização</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Tamanho do vaso</label>
            <select
              value={pot}
              onChange={(event) => setPot(event.target.value as any)}
              className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
            >
              <option value="CINCO_L">5 L</option>
              <option value="VINTE_E_UM_L">21 L</option>
              <option value="TRINTA_L">30 L</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Altura (cm)</label>
            <input
              type="number"
              value={stage === 'GERMINACAO' ? 0 : height}
              onChange={(event) => setHeight(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-2 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
              disabled={stage === 'GERMINACAO'}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Largura (cm)</label>
            <input
              type="number"
              value={stage === 'GERMINACAO' ? 0 : width}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-2 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
              disabled={stage === 'GERMINACAO'}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Caule (cm)</label>
            <input
              type="number"
              value={stage === 'GERMINACAO' ? 0 : stemWidth}
              onChange={(event) => setStemWidth(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-2 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
              disabled={stage === 'GERMINACAO'}
            />
          </div>
        </div>

        {mode === 'edit' && (
          <div className="mt-4 rounded-lg border border-[#6fbf86]/20 bg-[#111A2E]/40 p-3">
            <div className="text-xs font-medium text-[#6fbf86] uppercase tracking-[0.06em] mb-2">Campos completos</div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Data de germinação</label>
                <input
                  type="date"
                  value={germinacaoIso}
                  onChange={(event) => setGerminacaoIso(event.target.value)}
                  className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Sexo</label>
                <select
                  value={sexo}
                  onChange={(event) => setSexo(event.target.value as any)}
                  className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                >
                  <option value="">(não definido)</option>
                  <option value="FEMEA">Fêmea</option>
                  <option value="MACHO">Macho</option>
                  <option value="HERMAFRODITA">Hermafrodita</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Data sexagem</label>
                <input
                  type="date"
                  value={sexagemIso}
                  onChange={(event) => setSexagemIso(event.target.value)}
                  className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-medium text-slate-300 uppercase tracking-[0.06em] mb-1">Data início floração</label>
                <input
                  type="date"
                  value={floracaoIso}
                  onChange={(event) => setFloracaoIso(event.target.value)}
                  className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-xs text-white outline-none focus:border-[#6fbf86]/60 focus:ring-1 focus:ring-[#6fbf86]/20"
                />
              </div>
            </div>
          </div>
        )}

        {error && <div className="mt-3 text-xs text-red-300">{error}</div>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-2 rounded-lg font-semibold uppercase tracking-[0.06em] transition-all text-xs border-2 bg-[#0B1220]/60 text-slate-200 border-slate-600 hover:border-[#6fbf86]/60"
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`py-2 rounded-lg font-semibold uppercase tracking-[0.06em] transition-all text-xs border-2 ${
              isSaving
                ? 'bg-[#0B1220]/60 text-slate-400 border-slate-700 cursor-not-allowed opacity-70'
                : 'bg-[#7a1f1f] text-white border-[#7a1f1f] hover:bg-[#8c2626] shadow-[0_0_10px_rgba(122,31,31,0.22)]'
            }`}
            type="button"
          >
            {isSaving ? 'Salvando…' : mode === 'create' ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
