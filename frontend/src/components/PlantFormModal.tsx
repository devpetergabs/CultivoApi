import { useEffect, useMemo, useState } from 'react';
import type { Plant, PlantType } from '../types/pokedex';
import { apiService } from '../services/api';
import { mapPlantaToPokedexPlant } from '../utils/mapPlantaToPokedex';
import { PokedexModal } from './ui/PokedexModal';
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
type SpeciesValue = 'CANNABIS' | 'ROSEIRA' | 'OUTRA';

interface PlantFormModalProps {
  mode: Mode;
  initialPlant?: Plant | null;
  availableStrains?: string[];
  grower?: { name?: string | null; phone?: string | null };
  onClose: () => void;
  onSaved: (plant: Plant) => void;
}

const ADD_STRAIN_VALUE = '__ADD__';

function coerceSpecies(value: unknown): SpeciesValue {
  const v = String(value ?? '').toUpperCase();
  if (v === 'ROSEIRA') return 'ROSEIRA';
  if (v === 'OUTRA') return 'OUTRA';
  return 'CANNABIS';
}

export function PlantFormModal({
  mode,
  initialPlant,
  availableStrains,
  grower,
  onClose,
  onSaved,
}: PlantFormModalProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<SpeciesValue>('CANNABIS');

  // “strain” aqui vira “variedade/cultivar” para qualquer espécie
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
    const merged = mergeStrains(Array.from(DEFAULT_STRAINS), availableStrains ?? [], fromLocal);

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

      // pega species do plant, mas não quebra se ainda estiver faltando no type
      setSpecies(coerceSpecies((initialPlant as any).species));

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
      setSpecies('CANNABIS');
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

  // quando trocar espécie no CREATE, dá um default mais “humano”
  useEffect(() => {
    if (mode !== 'create') return;

    if (species === 'CANNABIS') {
      if (!strain || strain.trim().length === 0) setStrain(strains[0] ?? '');
      return;
    }

    // espécies não-cannabis: não empurra strains de cannabis no user
    if (!strain || strains.includes(strain)) {
      setStrain(species === 'ROSEIRA' ? 'Roseira-anã' : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species]);

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
      setError(species === 'CANNABIS' ? 'Informe uma strain.' : 'Informe a variedade/cultivar.');
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
          especie: species, // ✅ NOVO
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

        const created = await apiService.createPlantaMe(payload as any);
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
        especie: species, // ✅ NOVO
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

      const updated = await apiService.updatePlanta(initialPlant.id, payload as any);
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

  const isCannabis = species === 'CANNABIS';

  return (
    <PokedexModal
      open={true}
      onClose={onClose}
      title={mode === 'create' ? 'Nova planta' : 'Editar planta'}
      subtitle={mode === 'create' ? 'Cria uma nova entrada na Pokédex.' : 'Atualiza os dados da planta selecionada.'}
      widthClass="w-full max-w-[420px]"
    >
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
        />

        {/* ✅ ESPÉCIE */}
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Espécie</label>
            <select
              value={species}
              onChange={(e) => setSpecies(coerceSpecies(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
            >
              <option value="CANNABIS">Cannabis 🌿</option>
              <option value="ROSEIRA">Roseira 🌹</option>
              <option value="OUTRA">Outra 🌱</option>
            </select>
          </div>

          {/* ✅ STRAIN/VARIEDADE */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              {isCannabis ? 'Strain' : 'Variedade'}
            </label>

            {isCannabis ? (
              <>
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
                  className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
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
                      className="flex-1 rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                    />
                    <button
                      onClick={addCustomStrain}
                      className="rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400/40 hover:bg-white/5 transition"
                      type="button"
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </>
            ) : (
              <input
                type="text"
                value={strain}
                onChange={(e) => setStrain(e.target.value)}
                placeholder={species === 'ROSEIRA' ? 'Ex: Roseira-anã' : 'Ex: Variedade X'}
                className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
              />
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Estágio</label>
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value as any)}
              className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
            >
              <option value="GERMINACAO">Germinação</option>
              <option value="VEGETATIVO_INICIAL">Vegetativo Inicial</option>
              <option value="VEGETATIVO_MEDIO">Vegetativo Médio</option>
              <option value="VEGETATIVO_AVANCADO">Vegetativo Avançado</option>
              <option value="FLORACAO_INICIAL">Floração Inicial</option>
              <option value="FLORACAO_MEDIA">Floração Média</option>
              <option value="FLORACAO_AVANCADA">Floração Avançada</option>
              <option value="FINALIZACAO">Finalização</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Tamanho do vaso</label>
            <select
              value={pot}
              onChange={(event) => setPot(event.target.value as any)}
              className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
            >
              <option value="CINCO_L">5 L</option>
              <option value="VINTE_E_UM_L">21 L</option>
              <option value="TRINTA_L">30 L</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Altura (cm)</label>
            <input
              type="number"
              value={stage === 'GERMINACAO' ? 0 : height}
              onChange={(event) => setHeight(Number(event.target.value))}
              className="w-full rounded-lg border border-white/10 bg-[#080B14] px-2 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
              disabled={stage === 'GERMINACAO'}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Largura (cm)</label>
            <input
              type="number"
              value={stage === 'GERMINACAO' ? 0 : width}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="w-full rounded-lg border border-white/10 bg-[#080B14] px-2 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
              disabled={stage === 'GERMINACAO'}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Caule (cm)</label>
            <input
              type="number"
              value={stage === 'GERMINACAO' ? 0 : stemWidth}
              onChange={(event) => setStemWidth(Number(event.target.value))}
              className="w-full rounded-lg border border-white/10 bg-[#080B14] px-2 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
              disabled={stage === 'GERMINACAO'}
            />
          </div>
        </div>

        {mode === 'edit' && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Campos completos</div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Data de germinação</label>
                <input
                  type="date"
                  value={germinacaoIso}
                  onChange={(event) => setGerminacaoIso(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Sexo</label>
                <select
                  value={sexo}
                  onChange={(event) => setSexo(event.target.value as any)}
                  className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                >
                  <option value="">(não definido)</option>
                  <option value="FEMEA">Fêmea</option>
                  <option value="MACHO">Macho</option>
                  <option value="HERMAFRODITA">Hermafrodita</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Data sexagem</label>
                <input
                  type="date"
                  value={sexagemIso}
                  onChange={(event) => setSexagemIso(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Data início floração</label>
                <input
                  type="date"
                  value={floracaoIso}
                  onChange={(event) => setFloracaoIso(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                />
              </div>
            </div>
          </div>
        )}

        {error && <div className="mt-3 text-xs text-red-300">{error}</div>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-2 rounded-lg font-semibold uppercase tracking-widest text-xs border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
            type="button"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`py-2 rounded-lg font-semibold uppercase tracking-widest text-xs transition-all ${
              isSaving
                ? 'bg-emerald-400/50 text-[#080B14]/70 cursor-not-allowed opacity-70'
                : 'bg-emerald-400 text-[#080B14] hover:bg-emerald-300'
            }`}
            type="button"
          >
            {isSaving ? 'Salvando…' : mode === 'create' ? 'Criar' : 'Salvar'}
          </button>
        </div>
    </PokedexModal>
  );
}