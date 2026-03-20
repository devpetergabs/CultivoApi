import { useEffect, useMemo, useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';
import { apiService } from '../services/api';
import type { Aditivo, AgendaInseticida, AgendaPlanejado, PlantaEvento } from '../types';
import type { Plant } from '../types/pokedex';
import {
  getAditivoStock,
  setAditivoStock,
  syncAditivoStocksFromApi,
  type AditivoStock,
} from '../utils/aditivoStorage';

interface BulkInsecticideModalProps {
  open: boolean;
  onClose: () => void;
  plants: Plant[];
  initialTab?: 'APPLY' | 'AGENDA';
  /** payload vindo do drawer (InsecticideAgendaPanel) */
  agendaFocus?: {
    produtoNome?: string;
    roundsTotal?: number;
    descansoDias?: number;
    inicioEm?: string;
  } | null;
  sourcePlantId?: number | null;
}

type BulkPreset = {
  aditivoId: number;
  /** dose do produto por litro (mL/L) */
  doseMlPorLitro: number;
  /** volume total de calda preparado (L) */
  volumeLitros: number;
};

type PestSignal = {
  pestType: string;
  intensity: string | null;
};

type InfectedPlant = {
  plant: Plant;
  signal: PestSignal;
};

type ProductMatch = 'recommended' | 'off';

type TabKey = 'APPLY' | 'AGENDA';

type AgendaEntry = {
  plant: Plant;
  agenda: AgendaInseticida;
};

type AgendaGroup = {
  key: string;
  produtoNome: string;
  roundsTotal: number;
  descansoDias: number;
  inicioBucket: string;
  entries: AgendaEntry[];
  alignedNextRound: number | null;
  nextScheduledAt: string | null;
  rounds: Array<{
    roundIndex: number;
    scheduledAt: string | null;
    executed: number;
    pending: number;
    due: boolean;
  }>;
};

const PRESET_KEY = 'pokedex:bulk-insecticide-preset';

function safeParsePreset(raw: string | null): BulkPreset | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const aditivoId = Number(parsed?.aditivoId);

    // novo formato (compatível com o antigo "doseMlPorLitro")
    const doseMlPorLitroRaw = parsed?.doseMlPorLitro ?? parsed?.doseMlPorLitro;
    const volumeLitrosRaw = parsed?.volumeLitros ?? 1;

    const doseMlPorLitro = Number(doseMlPorLitroRaw);
    const volumeLitros = Number(volumeLitrosRaw);

    if (!Number.isFinite(aditivoId) || aditivoId <= 0) return null;
    if (!Number.isFinite(doseMlPorLitro) || doseMlPorLitro <= 0) return null;
    if (!Number.isFinite(volumeLitros) || volumeLitros <= 0) return null;

    return {
      aditivoId: Math.round(aditivoId),
      doseMlPorLitro: Number(doseMlPorLitro.toFixed(2)),
      volumeLitros: Number(volumeLitros.toFixed(2)),
    };
  } catch {
    return null;
  }
}

function clampFloat(value: number, min: number, max: number, decimals = 2): number {
  if (!Number.isFinite(value)) return min;
  const v = Math.max(min, Math.min(max, value));
  return Number(v.toFixed(decimals));
}

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

function resolveStockMl(anyObj: any): number | null {
  if (!anyObj) return null;

  const candidates = [
    anyObj.stockMlAtual,
    anyObj.stockML,
    anyObj.stockMl,
    anyObj.mlAtual,
    anyObj.mlCurrent,
    anyObj.currentMl,
    anyObj.totalMl,
    anyObj.totalML,
    anyObj.mlTotal,
  ];

  for (const c of candidates) {
    const v = Number(c);
    if (Number.isFinite(v)) return v;
  }

  const unidades = Number(anyObj.unidades);
  const mlFrasco = Number(anyObj.mlFrasco);
  if (Number.isFinite(unidades) && Number.isFinite(mlFrasco)) {
    return Math.max(0, unidades * mlFrasco);
  }

  return null;
}

function mergeLocalStock(item: Aditivo): Aditivo {
  try {
    const local: any = getAditivoStock(item.id);
    if (!local?.tracked) return item;
    const localMl = resolveStockMl(local);

    if (local && localMl !== null) {
      return {
        ...item,
        estoque: {
          tracked: true,
          tipoProduto: local.tipoProduto ?? (item as any)?.tipo ?? null,
          stockMlAtual: localMl ?? 0,
          unidades: Number(local.unidades ?? 0),
          mlFrasco: Number(local.mlFrasco ?? 0),
        } as any,
      };
    }
  } catch {
    // ignore
  }
  return item;
}

function parsePestSignal(descricao: string | null | undefined): PestSignal | null {
  const text = String(descricao ?? '');
  if (!text.includes('[PEST_SIGNAL]')) return null;

  const match = text.match(/\[PEST_SIGNAL\]\s*type=([A-Z0-9_\-]+)(?:\s+intensity=([A-Z0-9_\-]+))?/i);
  if (!match) return null;

  const pestType = String(match[1] ?? '').trim().toUpperCase();
  const intensity = String(match[2] ?? '').trim().toUpperCase() || null;

  if (!pestType) return null;

  return { pestType, intensity };
}

function normalizeEventsPayload(payload: any): PlantaEvento[] {
  const content = (payload as any)?.content ?? payload;
  if (!Array.isArray(content)) return [];
  return content as PlantaEvento[];
}

function parseCsvUpper(raw: string | null | undefined): string[] {
  const text = String(raw ?? '').trim();
  if (!text) return [];

  return text
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function resolveProductMatch(aditivo: Aditivo, pestType: string | null): ProductMatch {
  if (!pestType) return 'off';
  const pragas = parseCsvUpper(aditivo.pragasEfetivas);
  return pragas.includes(pestType.toUpperCase()) ? 'recommended' : 'off';
}

function formatDoseRange(min: number | null | undefined, max: number | null | undefined): string {
  const hasMin = typeof min === 'number' && Number.isFinite(min);
  const hasMax = typeof max === 'number' && Number.isFinite(max);

  if (hasMin && hasMax) return `${min}–${max} mL`;
  if (hasMin) return `${min} mL`;
  if (hasMax) return `${max} mL`;
  return '—';
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function bucketMinute(iso: string) {
  const d = new Date(iso);
  d.setSeconds(0, 0);
  // bucket de minuto local
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function daysDiff(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

function findPlanejado(agenda: AgendaInseticida, roundIndex: number): AgendaPlanejado | null {
  return (agenda.planejados ?? []).find((p) => Number(p.roundIndex) === Number(roundIndex)) ?? null;
}

function nextPending(agenda: AgendaInseticida): AgendaPlanejado | null {
  const list = [...(agenda.planejados ?? [])].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  return list.find((p) => p.status === 'PENDENTE') ?? null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildBatchIcs(group: AgendaGroup) {
  // ICS simples (VTIMEZONE + VEVENTs). Para MVP/demo, resolve bem.
  const tzid = 'America/Sao_Paulo';

  const escape = (v: string) =>
    String(v ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');

  const dtstamp = (() => {
    const d = new Date();
    // UTC
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
  })();

  const fmtLocal = (iso: string) => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}`;
  };

  let ics = '';
  ics += 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//CultivoInteligente//Agenda-Lote//PT-BR\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';

  ics += 'BEGIN:VTIMEZONE\r\n';
  ics += `TZID:${tzid}\r\n`;
  ics += 'BEGIN:STANDARD\r\n';
  ics += 'DTSTART:19700101T000000\r\n';
  ics += 'TZOFFSETFROM:-0300\r\n';
  ics += 'TZOFFSETTO:-0300\r\n';
  ics += 'TZNAME:BRT\r\n';
  ics += 'END:STANDARD\r\n';
  ics += 'END:VTIMEZONE\r\n';

  for (const entry of group.entries) {
    const agenda = entry.agenda;
    for (const p of agenda.planejados ?? []) {
      // Exporta só pendentes (pra não encher o calendário)
      if (p.status !== 'PENDENTE') continue;

      const uid = `cultivo-${entry.plant.id}-${p.id}@cultivo-inteligente`;
      const dtstart = fmtLocal(p.scheduledAt);
      const summary = `[Cultivo] ${entry.plant.name} — ${group.produtoNome} (Round ${p.roundIndex}/${group.roundsTotal})`;
      const desc = `Tratamento em lote. Descanso ${group.descansoDias}d. Você pode marcar como feito no app.`;

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${escape(uid)}\r\n`;
      ics += `DTSTAMP:${dtstamp}\r\n`;
      ics += `DTSTART;TZID=${tzid}:${dtstart}\r\n`;
      ics += 'DURATION:PT15M\r\n';
      ics += `SUMMARY:${escape(summary)}\r\n`;
      ics += `DESCRIPTION:${escape(desc)}\r\n`;
      ics += 'END:VEVENT\r\n';
    }
  }

  ics += 'END:VCALENDAR\r\n';
  return ics;
}

function toast(tone: 'success' | 'warning' | 'error', message: string) {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { tone, message } }));
}

export function BulkInsecticideModal({
  open,
  onClose,
  plants,
  initialTab = 'APPLY',
  agendaFocus,
  sourcePlantId,
}: BulkInsecticideModalProps) {
  if (!open) return null;

  const [activeTab, setActiveTab] = useState<TabKey>('APPLY');

  // --- APPLY tab state ---
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<Aditivo[]>([]);
  const [signalsByPlantId, setSignalsByPlantId] = useState<Record<number, PestSignal>>({});

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [doseMlPorLitro, setDoseMlPorLitro] = useState<number>(3);
  const [volumeLitros, setVolumeLitros] = useState<number>(1);
  const [roundsTotal, setRoundsTotal] = useState<number>(6);
  const [descansoDias, setDescansoDias] = useState<number>(4);
  const [roundsTouched, setRoundsTouched] = useState(false);
  const [descTouched, setDescTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [filterPestType, setFilterPestType] = useState<string>('ALL');

  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDoseForaFaixa, setConfirmDoseForaFaixa] = useState(false);

  // --- AGENDA tab state ---
  const [agendasByPlantId, setAgendasByPlantId] = useState<Record<number, AgendaInseticida | null>>({});
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [agendaBusyKey, setAgendaBusyKey] = useState<string | null>(null);
  const [focusedGroupKey, setFocusedGroupKey] = useState<string | null>(null);

  const pestTypeForMatch = useMemo(() => {
    if (filterPestType === 'ALL') return null;
    return String(filterPestType).toUpperCase();
  }, [filterPestType]);

  const selectable = useMemo(() => {
    const filtered = inventory.filter(isInsecticideLike);
    return filtered.sort((a, b) => {
      if (pestTypeForMatch) {
        const ma = resolveProductMatch(a, pestTypeForMatch);
        const mb = resolveProductMatch(b, pestTypeForMatch);
        if (ma !== mb) return ma === 'recommended' ? -1 : 1;
      }

      const na = String(a.nome ?? '').toLocaleLowerCase('pt-BR');
      const nb = String(b.nome ?? '').toLocaleLowerCase('pt-BR');
      return na.localeCompare(nb, 'pt-BR');
    });
  }, [inventory, pestTypeForMatch]);

  const effectiveSelectedId = useMemo(() => {
    if (selectedId && selectedId > 0) return selectedId;
    return selectable[0]?.id ?? null;
  }, [selectedId, selectable]);

  useEffect(() => {
    if (!open) return;
    setActiveTab(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!effectiveSelectedId) return;
    if (selectedId !== effectiveSelectedId) setSelectedId(effectiveSelectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, effectiveSelectedId]);

  const selected = useMemo(() => {
    if (!effectiveSelectedId) return null;
    return selectable.find((a) => a.id === effectiveSelectedId) ?? null;
  }, [selectable, effectiveSelectedId]);

  // quando troca o produto, sugere rounds/descanso recomendados (sem sobrescrever se o user mexeu)
  useEffect(() => {
    if (!open) return;
    if (!selected) return;

    const recRounds =
      typeof selected.roundsRecomendados === 'number' && selected.roundsRecomendados > 0
        ? selected.roundsRecomendados
        : null;
    const recDesc =
      typeof selected.descansoDiasRecomendados === 'number' && selected.descansoDiasRecomendados >= 0
        ? selected.descansoDiasRecomendados
        : null;

    if (!roundsTouched) setRoundsTotal(recRounds ?? 6);
    if (!descTouched) setDescansoDias(recDesc ?? 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, effectiveSelectedId, roundsTouched, descTouched]);

  const selectedMatch = useMemo(() => {
    if (!selected || !pestTypeForMatch) return null;
    return resolveProductMatch(selected, pestTypeForMatch);
  }, [selected, pestTypeForMatch]);

  const infectedPlants = useMemo<InfectedPlant[]>(() => {
    return plants
      .map((plant) => {
        const signal = signalsByPlantId[plant.id];
        if (!signal) return null;
        return { plant, signal };
      })
      .filter(Boolean) as InfectedPlant[];
  }, [plants, signalsByPlantId]);

  const pestTypeOptions = useMemo(() => {
    return Array.from(new Set(infectedPlants.map((item) => item.signal.pestType))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
  }, [infectedPlants]);

  const filteredInfectedPlants = useMemo(() => {
    if (filterPestType === 'ALL') return infectedPlants;
    return infectedPlants.filter((item) => item.signal.pestType === filterPestType);
  }, [filterPestType, infectedPlants]);

  const filteredIds = useMemo(() => filteredInfectedPlants.map((item) => item.plant.id), [filteredInfectedPlants]);

  useEffect(() => {
    // não derruba seleção quando você está no tab AGENDA
    if (activeTab !== 'APPLY') return;
    setSelectedPlantIds((current) => current.filter((id) => filteredIds.includes(id)));
  }, [filteredIds, activeTab]);

  const selectedCount = selectedPlantIds.length;

  const doseMlPorLitroClamped = useMemo(
    () => clampFloat(Number(doseMlPorLitro), 0.1, 100000, 2),
    [doseMlPorLitro]
  );

  const volumeLitrosClamped = useMemo(
    () => clampFloat(Number(volumeLitros), 0.1, 100000, 2),
    [volumeLitros]
  );

  const roundsTotalClamped = useMemo(
    () => Math.max(1, Math.min(50, Math.round(Number(roundsTotal) || 1))),
    [roundsTotal]
  );

  const descansoDiasClamped = useMemo(
    () => Math.max(0, Math.min(30, Math.round(Number(descansoDias) || 0))),
    [descansoDias]
  );

  const doseRange = useMemo(() => {
    if (!selected) return { min: null as number | null, max: null as number | null };

    const minRaw = selected.doseMinEmML;
    const maxRaw = selected.doseMaxEmML;
    const min = typeof minRaw === 'number' && Number.isFinite(minRaw) ? minRaw : null;
    const max = typeof maxRaw === 'number' && Number.isFinite(maxRaw) ? maxRaw : null;

    return { min, max };
  }, [selected]);

  const isDoseForaFaixa = useMemo(() => {
    const dose = doseMlPorLitroClamped;
    if (!(dose > 0)) return false;

    const abaixoMin = typeof doseRange.min === 'number' ? dose < doseRange.min : false;
    const acimaMax = typeof doseRange.max === 'number' ? dose > doseRange.max : false;
    return abaixoMin || acimaMax;
  }, [doseMlPorLitroClamped, doseRange]);

  useEffect(() => {
    if (!isDoseForaFaixa) {
      setConfirmDoseForaFaixa(false);
    }
  }, [isDoseForaFaixa, effectiveSelectedId]);

  const totalEstimado = useMemo(() => {
    return Number((doseMlPorLitroClamped * volumeLitrosClamped).toFixed(2));
  }, [doseMlPorLitroClamped, volumeLitrosClamped]);

  const selectedStockMl = useMemo(() => {
    if (!selected) return null;

    try {
      const local: any = getAditivoStock(selected.id);
      if (local?.tracked) {
        const localMl = resolveStockMl(local);
        if (localMl !== null) return localMl;
      }
    } catch {
      // ignore
    }

    const est: any = (selected as any)?.estoque;
    const apiMl = resolveStockMl(est);
    if (apiMl !== null) return apiMl;

    return null;
  }, [selected]);

  const hasStockEnough = useMemo(() => {
    if (typeof selectedStockMl !== 'number') return true;
    return selectedStockMl >= totalEstimado;
  }, [selectedStockMl, totalEstimado]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // reset padrão ao abrir
  useEffect(() => {
    if (!open) return;

    setError(null);
    setNotes('');
    setFilterPestType('ALL');
    setConfirmDoseForaFaixa(false);
    setAgendaError(null);
    setAgendaBusyKey(null);
    setRoundsTouched(false);
    setDescTouched(false);

    // preset
    try {
      const preset = safeParsePreset(localStorage.getItem(PRESET_KEY));
      if (preset) {
        setSelectedId(preset.aditivoId);
        setDoseMlPorLitro(preset.doseMlPorLitro);
        setVolumeLitros(preset.volumeLitros);
      } else {
        setSelectedId(null);
        setDoseMlPorLitro(3);
        setVolumeLitros(1);
      }
    } catch {
      setSelectedId(null);
      setDoseMlPorLitro(3);
      setVolumeLitros(1);
    }

    // se veio do drawer: começa no tab agenda e foca o grupo
    if (initialTab === 'AGENDA') {
      setActiveTab('AGENDA');
      setFocusedGroupKey(null);
    }
  }, [open, initialTab]);

  // carrega inventário sempre (leve)
  useEffect(() => {
    if (!open) return;
    let active = true;

    setIsLoading(true);
    setError(null);

    apiService
      .getAditivos(0, 500)
      .then((inventoryResponse) => {
        if (!active) return;
        const inventoryList = (inventoryResponse as any)?.content ?? inventoryResponse;
        const inventoryRaw = Array.isArray(inventoryList) ? (inventoryList as Aditivo[]) : [];

        try {
          syncAditivoStocksFromApi(inventoryRaw as any);
        } catch {
          // ignore
        }

        const inventoryMerged = inventoryRaw.map(mergeLocalStock);
        setInventory(inventoryMerged);

        const firstInsecticide = inventoryMerged.filter(isInsecticideLike)[0];
        setSelectedId((current) => {
          if (current && inventoryMerged.some((x) => x.id === current)) return current;
          return firstInsecticide?.id ?? null;
        });
      })
      .catch(() => {
        if (!active) return;
        setInventory([]);
        setError('Não foi possível carregar inventário.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  // carrega sinais de praga só quando tab APPLY está ativo
  useEffect(() => {
    if (!open) return;
    if (activeTab !== 'APPLY') return;

    let active = true;

    // "infectado" agora é estado (flag) e NÃO histórico de eventos.
    const infectedIds = plants.filter((p) => Boolean(p.pestActive)).map((p) => p.id);
    setSelectedPlantIds(infectedIds);

    if (infectedIds.length === 0) {
      setSignalsByPlantId({});
      return () => {
        active = false;
      };
    }

    Promise.all(
      infectedIds.map(async (plantId) => {
        try {
          const response = await apiService.getPlantaEventos(plantId, 0, 120);
          const eventos = normalizeEventsPayload(response);
          const signalEvent = eventos.find((evento) => parsePestSignal(evento?.descricao ?? null));
          const signal = parsePestSignal(signalEvent?.descricao ?? null);
          return { plantId, signal: signal ?? { pestType: 'DESCONHECIDA', intensity: null } };
        } catch {
          return { plantId, signal: { pestType: 'DESCONHECIDA', intensity: null } };
        }
      })
    )
      .then((signalResults) => {
        if (!active) return;

        const map: Record<number, PestSignal> = {};
        for (const result of signalResults) {
          if (result.signal) map[result.plantId] = result.signal;
        }
        setSignalsByPlantId(map);
      })
      .catch(() => {
        if (!active) return;
        setSignalsByPlantId({});
      });

    return () => {
      active = false;
    };
  }, [open, activeTab, plants]);

  // carrega agendas quando tab AGENDA fica ativo
  async function refreshAgendas(onlyPlantIds?: number[]) {
    if (!open) return;
    const target = Array.isArray(onlyPlantIds) && onlyPlantIds.length > 0 ? onlyPlantIds : plants.map((p) => p.id);

    setAgendaLoading(true);
    setAgendaError(null);
    try {
      const results = await Promise.all(
        target.map(async (pid) => {
          try {
            const ag = await apiService.getAgendaInseticida(pid);
            return { pid, ag };
          } catch {
            return { pid, ag: null };
          }
        })
      );

      setAgendasByPlantId((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.pid] = r.ag;
        return next;
      });
    } catch {
      setAgendaError('Não foi possível carregar agenda de inseticida.');
    } finally {
      setAgendaLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    if (activeTab !== 'AGENDA') return;
    refreshAgendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  // auto-select plantas do mesmo tratamento quando abre pelo drawer
  useEffect(() => {
    if (!open) return;
    if (activeTab !== 'AGENDA') return;
    if (!agendaFocus || !agendaFocus.produtoNome) return;

    // Só tenta depois que carregou pelo menos uma agenda
    const hasAny = Object.values(agendasByPlantId).some((a) => a != null);
    if (!hasAny) return;

    const focusBucket = agendaFocus.inicioEm ? bucketMinute(agendaFocus.inicioEm) : null;

    const matches = plants
      .filter((p) => {
        const ag = agendasByPlantId[p.id];
        if (!ag) return false;
        if (agendaFocus.produtoNome && ag.produtoNome !== agendaFocus.produtoNome) return false;
        if (typeof agendaFocus.roundsTotal === 'number' && ag.roundsTotal !== agendaFocus.roundsTotal) return false;
        if (typeof agendaFocus.descansoDias === 'number' && ag.descansoDias !== agendaFocus.descansoDias) return false;
        if (focusBucket && bucketMinute(ag.inicioEm) !== focusBucket) return false;
        return true;
      })
      .map((p) => p.id);

    if (matches.length > 0) {
      setSelectedPlantIds(matches);
      // tenta focar o grupo
      const key = `${agendaFocus.produtoNome}|${agendaFocus.roundsTotal ?? ''}|${agendaFocus.descansoDias ?? ''}|${focusBucket ?? ''}`;
      setFocusedGroupKey(key);
    } else if (typeof sourcePlantId === 'number') {
      setSelectedPlantIds([sourcePlantId]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, agendaFocus, sourcePlantId, agendasByPlantId]);

  const canInteract = !isSaving && !isLoading;

  const togglePlant = (id: number) => {
    setSelectedPlantIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return [...current, id];
    });
  };

  const selectAllFiltered = () => setSelectedPlantIds(filteredIds);
  const selectNone = () => setSelectedPlantIds([]);

  const handleAplicar = async () => {
    const id = Number(effectiveSelectedId);

    if (!Number.isFinite(id) || id <= 0 || !selected) {
      setError('Selecione um produto do inventário.');
      return;
    }
    if (selectedPlantIds.length <= 0) {
      setError('Selecione ao menos 1 planta.');
      return;
    }
    if (!(doseMlPorLitroClamped > 0)) {
      setError('Informe uma dose (mL/L) válida.');
      return;
    }
    if (!(volumeLitrosClamped > 0)) {
      setError('Informe o volume de calda (L).');
      return;
    }
    if (!hasStockEnough) {
      setError('Estoque insuficiente para esse tratamento em lote.');
      return;
    }
    if (isDoseForaFaixa && !confirmDoseForaFaixa) {
      setError('Dose fora da faixa recomendada. Confirme para continuar.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      try {
        localStorage.setItem(
          PRESET_KEY,
          JSON.stringify({
            aditivoId: id,
            doseMlPorLitro: doseMlPorLitroClamped,
            volumeLitros: volumeLitrosClamped,
          })
        );
      } catch {
        // ignore
      }

      const batchId = `B${Date.now().toString(36)}`;
      const safeObs = notes.trim();
      const baseDesc = `${selected.nome} (${selected.marca}) — tratamento em lote`;
      const doseBlock = `dose=${doseMlPorLitroClamped}ml/L vol=${volumeLitrosClamped}L total=${totalEstimado}ml`;

      const createdEvents = await Promise.all(
        selectedPlantIds.map((plantId) => {
          const signal = signalsByPlantId[plantId];
          const pestType = signal?.pestType ?? 'DESCONHECIDA';
          const intensityPart = signal?.intensity ? ` intensity=${signal.intensity}` : '';
          const signalBlock = `[PEST_SIGNAL] type=${pestType}${intensityPart}`;
          const descricao = `${baseDesc} | ${doseBlock} | ${signalBlock}${safeObs ? ` | ${safeObs}` : ''}`;

          return apiService.createPlantaEvento(plantId, {
            tipo: 'INSETICIDA',
            descricao,
            doseEmML: doseMlPorLitroClamped,
            produtoId: id,
            roundsTotal: roundsTotalClamped,
            descansoDias: descansoDiasClamped,
            idempotencyKey: `insecticide-bulk:${batchId}:${plantId}:${id}:${doseMlPorLitroClamped}:${volumeLitrosClamped}:${roundsTotalClamped}:${descansoDiasClamped}`,
          });
        })
      );

      // se algum tratamento concluiu imediatamente (ex: rounds=1), limpa o flag no store
      try {
        (createdEvents as any[]).forEach((ev, idx) => {
          const pid = selectedPlantIds[idx];
          const ra = Number((ev as any)?.roundAtual ?? 0);
          const rt = Number((ev as any)?.roundsTotal ?? 0);
          if (pid > 0 && rt > 0 && ra >= rt) {
            window.dispatchEvent(new CustomEvent('plant:praga-changed', { detail: { plantId: pid, praga: false } }));
          }
        });
      } catch {
        // ignore
      }

      // atualiza estoque local
      try {
        const localAny: any = getAditivoStock(id);
        const apiAny: any = (selected as any)?.estoque;

        const currentMl = localAny?.tracked
          ? resolveStockMl(localAny)
          : resolveStockMl(apiAny);

        if (currentMl !== null) {
          const next = Math.max(0, Number(currentMl ?? 0) - totalEstimado);

          const payload: AditivoStock = {
            tracked: true,
            tipoProduto:
              (localAny?.tracked ? localAny.tipoProduto : apiAny?.tipoProduto) ??
              (selected as any)?.tipo ??
              null,
            stockMlAtual: next,
            unidades: Number(localAny?.tracked ? localAny.unidades ?? 0 : apiAny?.unidades ?? 0),
            mlFrasco: Number(localAny?.tracked ? localAny.mlFrasco ?? 0 : apiAny?.mlFrasco ?? 0),
          };
          setAditivoStock(id, payload);

          setInventory((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    estoque: {
                      tracked: true,
                      tipoProduto: payload.tipoProduto,
                      stockMlAtual: payload.stockMlAtual,
                      unidades: payload.unidades,
                      mlFrasco: payload.mlFrasco,
                    } as any,
                  }
                : p
            )
          );
        }
      } catch {
        // ignore
      }

      toast('success', `Tratamento em lote registrado (${selectedPlantIds.length} plantas).`);

      // fluxo A: mantém modal aberto e troca pra agenda
      setActiveTab('AGENDA');
      // foca o grupo recém-criado (bucket de minuto do agora)
      const nowIso = new Date().toISOString();
      const key = `${selected.nome}|${roundsTotalClamped}|${descansoDiasClamped}|${bucketMinute(nowIso)}`;
      setFocusedGroupKey(key);
      await refreshAgendas(selectedPlantIds);

      // atualiza timelines/drawers
      for (const plantId of selectedPlantIds) {
        window.dispatchEvent(new CustomEvent('plant:event-created', { detail: { plantId } }));
      }
    } catch {
      setError('Não foi possível registrar o tratamento em lote.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- AGENDA derived ---
  const agendaEntries = useMemo<AgendaEntry[]>(() => {
    return plants
      .filter((p) => selectedPlantIds.includes(p.id))
      .map((plant) => {
        const agenda = agendasByPlantId[plant.id];
        if (!agenda) return null;
        return { plant, agenda };
      })
      .filter(Boolean) as AgendaEntry[];
  }, [plants, selectedPlantIds, agendasByPlantId]);

  const agendaGroups = useMemo<AgendaGroup[]>(() => {
    const map = new Map<string, AgendaEntry[]>();

    for (const entry of agendaEntries) {
      const ag = entry.agenda;
      const inicioBucket = bucketMinute(ag.inicioEm);
      const key = `${ag.produtoNome}|${ag.roundsTotal}|${ag.descansoDias}|${inicioBucket}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }

    const groups: AgendaGroup[] = [];

    for (const [key, entries] of map.entries()) {
      const first = entries[0].agenda;

      // alinhamento: todas precisam ter o mesmo nextRound
      const nextRounds = Array.from(
        new Set(entries.map((e) => (e.agenda.roundAtual ?? 0) + 1))
      );
      const alignedNextRound = nextRounds.length === 1 ? nextRounds[0] : null;

      const roundsTotal = first.roundsTotal;
      const descansoDias = first.descansoDias;
      const inicioBucket = bucketMinute(first.inicioEm);

      // next scheduled (para badge)
      let nextScheduledAt: string | null = null;
      if (alignedNextRound != null && alignedNextRound <= roundsTotal) {
        const p0 = findPlanejado(first, alignedNextRound);
        nextScheduledAt = p0?.scheduledAt ?? null;
      }

      // agregação por round
      const rounds: AgendaGroup['rounds'] = [];
      for (let i = 1; i <= roundsTotal; i++) {
        let scheduledAt: string | null = null;
        let executed = 0;
        let pending = 0;
        for (const e of entries) {
          const p = findPlanejado(e.agenda, i);
          if (p?.scheduledAt && !scheduledAt) scheduledAt = p.scheduledAt;
          if (p?.status === 'EXECUTADO') executed += 1;
          else pending += 1;
        }
        const due = scheduledAt ? daysDiff(scheduledAt) <= 0 : false;
        rounds.push({ roundIndex: i, scheduledAt, executed, pending, due });
      }

      groups.push({
        key,
        produtoNome: first.produtoNome,
        roundsTotal,
        descansoDias,
        inicioBucket,
        entries: entries.slice().sort((a, b) => a.plant.id - b.plant.id),
        alignedNextRound,
        nextScheduledAt,
        rounds,
      });
    }

    // ordena por próximo round (mais urgente primeiro)
    groups.sort((a, b) => {
      const da = a.nextScheduledAt ? new Date(a.nextScheduledAt).getTime() : Number.POSITIVE_INFINITY;
      const db = b.nextScheduledAt ? new Date(b.nextScheduledAt).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });

    return groups;
  }, [agendaEntries]);

  async function executeNextRoundBatch(group: AgendaGroup) {
    if (group.alignedNextRound == null) {
      toast('warning', 'Plantas desalinhadas (roundAtual diferente).');
      return;
    }
    const round = group.alignedNextRound;
    if (round > group.roundsTotal) {
      toast('warning', 'Tratamento já finalizado.');
      return;
    }

    // garante que existe planejado pendente em todas
    const payload = group.entries
      .map((e) => {
        const p = findPlanejado(e.agenda, round);
        if (!p || p.status !== 'PENDENTE') return null;
        return { plantId: e.plant.id, planejadoId: p.id };
      })
      .filter(Boolean) as Array<{ plantId: number; planejadoId: number }>;

    if (payload.length !== group.entries.length) {
      toast('warning', 'Nem todas as plantas estão com o próximo round pendente.');
      return;
    }

    setAgendaBusyKey(group.key);
    try {
      const doneEvents = await Promise.all(payload.map((x) => apiService.marcarAgendaInseticidaDone(x.plantId, x.planejadoId)));
      toast('success', `Round ${round} executado em lote (${payload.length} plantas).`);

      // se concluiu (último round), limpa o estado no pokedex imediatamente
      try {
        doneEvents.forEach((ev, idx) => {
          const pid = payload[idx].plantId;
          const ra = Number((ev as any)?.roundAtual ?? 0);
          const rt = Number((ev as any)?.roundsTotal ?? 0);
          if (pid > 0 && rt > 0 && ra >= rt) {
            window.dispatchEvent(new CustomEvent('plant:praga-changed', { detail: { plantId: pid, praga: false } }));
          }
        });
      } catch {
        // ignore
      }

      // refresh dessas plantas
      await refreshAgendas(payload.map((x) => x.plantId));

      // atualiza timelines/drawers
      for (const x of payload) {
        window.dispatchEvent(new CustomEvent('plant:event-created', { detail: { plantId: x.plantId } }));
      }
    } catch {
      toast('error', 'Falha ao executar round em lote.');
    } finally {
      setAgendaBusyKey(null);
    }
  }

  function exportBatchIcs(group: AgendaGroup) {
    const ics = buildBatchIcs(group);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const filename = `cultivo-lote-${group.produtoNome}-${group.inicioBucket}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    downloadBlob(blob, `${filename || 'cultivo-lote'}.ics`);
  }

  if (!open || typeof document === 'undefined') return null;

  const estText =
    typeof selectedStockMl === 'number' ? `${Math.max(0, Math.round(selectedStockMl))} mL` : '—';

  const schedulePreview = useMemo(() => {
    const now = new Date();
    const base = now.getTime();
    const list: Array<{ round: number; when: Date }> = [];
    for (let i = 1; i <= roundsTotalClamped; i++) {
      const d = new Date(base + (i - 1) * descansoDiasClamped * 86400000);
      list.push({ round: i, when: d });
    }
    return list;
  }, [roundsTotalClamped, descansoDiasClamped]);

  const tabPills = (
    <div className="flex rounded-lg bg-white/5 p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => setActiveTab('APPLY')}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
          activeTab === 'APPLY'
            ? 'bg-[#f39a5c]/10 text-[#f39a5c]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Aplicar lote
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveTab('AGENDA');
          refreshAgendas();
        }}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
          activeTab === 'AGENDA'
            ? 'bg-[#f39a5c]/10 text-[#f39a5c]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Agenda do lote
      </button>
    </div>
  );

  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Inseticida em Lote"
      subtitle="Um tratamento por planta. Aplique em lote e gerencie rounds na agenda."
      widthClass="w-[740px] max-w-[96vw]"
      headerActions={tabPills}
    >
          {/* ── APPLY TAB ── */}
          {activeTab === 'APPLY' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* LEFT: PLANTAS INFECTADAS */}
                <div className="rounded-xl bg-[#101726] border border-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plantas infectadas</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllFiltered}
                        disabled={!canInteract}
                        className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Todas
                      </button>
                      <span className="text-white/20 text-xs">·</span>
                      <button
                        type="button"
                        onClick={selectNone}
                        disabled={!canInteract}
                        className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Nenhuma
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                      Filtro por tipo de praga
                    </label>
                    <select
                      value={filterPestType}
                      onChange={(event) => setFilterPestType(event.target.value)}
                      disabled={!canInteract}
                      className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60 transition-all duration-150"
                    >
                      <option value="ALL">Todos os tipos</option>
                      {pestTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="max-h-[240px] overflow-auto pr-1 space-y-1.5">
                    {filteredInfectedPlants.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">Nenhuma planta com sinal de praga para este filtro.</p>
                    ) : (
                      filteredInfectedPlants.map((item) => {
                        const checked = selectedPlantIds.includes(item.plant.id);
                        return (
                          <label
                            key={item.plant.id}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                              checked
                                ? 'border-[#f39a5c]/50 bg-[#f39a5c]/10'
                                : 'border-white/5 bg-white/3 hover:border-white/10 hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePlant(item.plant.id)}
                              disabled={!canInteract}
                              className="sr-only"
                            />
                            <div
                              className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
                                checked
                                  ? 'bg-[#f39a5c] border-[#f39a5c]'
                                  : 'bg-transparent border-white/20'
                              }`}
                            >
                              {checked && (
                                <svg className="w-2.5 h-2.5 text-[#080B14]" fill="none" viewBox="0 0 12 12">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-white truncate">{item.plant.name}</div>
                              <div className="text-xs text-slate-500 truncate">
                                {item.signal.pestType}
                                {item.signal.intensity ? ` · ${item.signal.intensity}` : ''}
                              </div>
                            </div>
                            <span className="text-xs tabular-nums text-slate-600 flex-shrink-0">#{item.plant.id}</span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Selecionadas</span>
                    <span className="text-sm font-semibold text-[#f39a5c] tabular-nums">{selectedCount}</span>
                    <span className="text-xs text-slate-600">/ {filteredInfectedPlants.length}</span>
                  </div>
                </div>

                {/* RIGHT: PRODUTO & PARÂMETROS */}
                <div className="rounded-xl bg-[#101726] border border-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Produto</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Estoque</span>
                      <span className="text-sm font-semibold text-white tabular-nums">{estText}</span>
                    </div>
                  </div>

                  <select
                    value={effectiveSelectedId ?? ''}
                    onChange={(event) => setSelectedId(event.target.value ? Number(event.target.value) : null)}
                    disabled={!canInteract}
                    className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60 transition-all duration-150"
                  >
                    {selectable.length === 0 ? (
                      <option value="">Nenhum produto de proteção encontrado</option>
                    ) : (
                      <>
                        <option value="">Selecione um produto…</option>
                        {selectable.map((a) => (
                          <option key={a.id} value={a.id}>
                            {pestTypeForMatch
                              ? `${resolveProductMatch(a, pestTypeForMatch) === 'recommended' ? '✅' : '⚠'} ${a.nome} — ${a.marca}`
                              : `${a.nome} — ${a.marca}`}
                          </option>
                        ))}
                      </>
                    )}
                  </select>

                  {pestTypeForMatch && selectedMatch && (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-white/5 bg-white/3 px-3 py-2">
                      <span className="text-xs text-slate-400">Match para {pestTypeForMatch}</span>
                      {selectedMatch === 'recommended' ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                          Recomendado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                          Fora do recomendado
                        </span>
                      )}
                    </div>
                  )}

                  {/* Dose / Calda / Rounds */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 whitespace-nowrap">
                        Dose mL/L
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={doseMlPorLitro}
                        onChange={(event) => setDoseMlPorLitro(Number(event.target.value))}
                        disabled={!canInteract}
                        className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60 transition-all duration-150"
                      />
                      <p className="mt-1 text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                        Faixa: <span className="text-slate-300 tabular-nums">{formatDoseRange(doseRange.min, doseRange.max)}</span>
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 whitespace-nowrap">
                        Calda (L)
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={volumeLitros}
                        onChange={(event) => setVolumeLitros(Number(event.target.value))}
                        disabled={!canInteract}
                        className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60 transition-all duration-150"
                      />
                      <p className="mt-1 text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">Ex.: 2 L foliar</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 whitespace-nowrap">
                        R Total
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={roundsTotal}
                        onChange={(event) => { setRoundsTouched(true); setRoundsTotal(Number(event.target.value)); }}
                        disabled={!canInteract}
                        className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60 transition-all duration-150"
                        title="Rounds totais"
                      />
                      <p className="mt-1 text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">&nbsp;</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 whitespace-nowrap">
                        Desc (d)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={descansoDias}
                        onChange={(event) => { setDescTouched(true); setDescansoDias(Number(event.target.value)); }}
                        disabled={!canInteract}
                        className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60 transition-all duration-150"
                        title="Dias de descanso"
                      />
                      <p className="mt-1 text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">Ex.: 6 rounds, 4 d</p>
                    </div>
                  </div>

                  {/* Out-of-range warning */}
                  {isDoseForaFaixa && (
                    <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/8 px-3 py-2.5">
                      <p className="text-xs font-semibold text-amber-300">Dose fora da faixa recomendada.</p>
                      <label className="mt-2 inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmDoseForaFaixa}
                          onChange={(event) => setConfirmDoseForaFaixa(event.target.checked)}
                          disabled={!canInteract}
                          className="h-3.5 w-3.5 accent-amber-400"
                        />
                        <span className="text-xs text-amber-200/80">Confirmo aplicar fora da recomendação</span>
                      </label>
                    </div>
                  )}

                  {/* Total */}
                  <div className="mt-3 rounded-lg border border-white/5 bg-[#080B14] px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total de produto</span>
                    <span className={`text-sm font-semibold tabular-nums ${hasStockEnough ? 'text-[#f7c6a1]' : 'text-red-400'}`}>
                      {totalEstimado} mL
                    </span>
                  </div>
                  {!hasStockEnough && (
                    <p className="mt-1 text-xs text-red-400">Estoque insuficiente para as plantas selecionadas.</p>
                  )}

                  {/* Schedule preview */}
                  <div className="mt-3 rounded-lg border border-white/5 bg-[#080B14] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Prévia da agenda</p>
                    <div className="grid grid-cols-3 gap-2">
                      {schedulePreview.slice(0, Math.min(6, schedulePreview.length)).map((it) => (
                        <div key={it.round} className="rounded-lg border border-white/5 bg-white/3 px-2 py-1.5">
                          <p className="text-[10px] font-bold text-[#f39a5c] tabular-nums">R{it.round}</p>
                          <p className="text-xs text-slate-400 tabular-nums">
                            {it.when.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                    {schedulePreview.length > 6 && (
                      <p className="mt-2 text-xs text-slate-500">+{schedulePreview.length - 6} rounds</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                  Observação (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={!canInteract}
                  placeholder="Observações adicionais sobre o tratamento..."
                  className="w-full rounded-lg border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-[#f39a5c]/50 focus:ring-1 focus:ring-[#f39a5c]/30 disabled:opacity-60 transition-all duration-150 resize-none"
                />
              </div>

              {error && (
                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleAplicar}
                  className="rounded-lg bg-[#f39a5c] px-5 py-2 text-sm font-semibold text-[#080B14] hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all duration-150"
                  disabled={
                    !canInteract ||
                    !selected ||
                    !hasStockEnough ||
                    selectedPlantIds.length === 0 ||
                    !(doseMlPorLitroClamped > 0) || !(volumeLitrosClamped > 0) ||
                    (isDoseForaFaixa && !confirmDoseForaFaixa)
                  }
                >
                  {isSaving ? 'Aplicando…' : 'Aplicar lote'}
                </button>
              </div>
            </>
          )}

          {/* ── AGENDA TAB ── */}
          {activeTab === 'AGENDA' && (
            <>
              {/* Status bar */}
              <div className="rounded-xl bg-[#101726] border border-white/5 p-4 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tratamentos ativos</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="text-white font-medium tabular-nums">{selectedPlantIds.length}</span> plantas selecionadas &middot; agrupado por produto, rounds, descanso e início
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshAgendas()}
                    className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-white/20 disabled:opacity-40 transition-all duration-150"
                    disabled={agendaLoading}
                  >
                    Atualizar
                  </button>
                </div>

                {agendaError && (
                  <div className="mt-3 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2">
                    <p className="text-xs text-red-400">{agendaError}</p>
                  </div>
                )}

                {agendaLoading && (
                  <p className="mt-3 text-xs text-slate-500">Carregando agenda…</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {agendaGroups.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">Nenhum tratamento ativo nas plantas selecionadas.</p>
                ) : (
                  agendaGroups.map((group) => {
                    const size = group.entries.length;
                    const aligned = group.alignedNextRound != null;
                    const nextRound = group.alignedNextRound;
                    const dueTxt = group.nextScheduledAt ? daysDiff(group.nextScheduledAt) : null;
                    const isFocused = focusedGroupKey != null && group.key.startsWith(focusedGroupKey);

                    return (
                      <div
                        key={group.key}
                        className={`rounded-xl border p-4 bg-[#101726] transition-all duration-200 ${
                          isFocused ? 'border-[#f39a5c]/40' : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">
                              {group.produtoNome}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {size} planta{size !== 1 ? 's' : ''} &middot; {group.roundsTotal} rounds &middot; {group.descansoDias} d descanso &middot; início <span className="tabular-nums">{group.inicioBucket}</span>
                            </p>
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {group.entries.map((e) => (
                                <span
                                  key={e.plant.id}
                                  className="inline-flex items-center rounded-full border border-white/8 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300"
                                  title={`Planta #${e.plant.id}`}
                                >
                                  {e.plant.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                            {group.nextScheduledAt ? (
                              <p
                                className={`text-xs font-semibold tabular-nums ${
                                  dueTxt != null && dueTxt <= 0 ? 'text-rose-300' : 'text-amber-300'
                                }`}
                                title={group.nextScheduledAt}
                              >
                                {dueTxt != null && dueTxt <= 0 ? 'Hoje / Atrasado' : `Em ${dueTxt}d`} &middot; R{nextRound}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500">Sem próximo round</p>
                            )}

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => exportBatchIcs(group)}
                                disabled={agendaBusyKey != null}
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-white/20 disabled:opacity-40 transition-all duration-150"
                              >
                                Exportar .ics
                              </button>

                              <button
                                type="button"
                                onClick={() => executeNextRoundBatch(group)}
                                disabled={!aligned || agendaBusyKey != null || agendaBusyKey === group.key}
                                className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-400/15 hover:border-emerald-400/40 disabled:opacity-40 transition-all duration-150"
                                title={
                                  !aligned
                                    ? 'Plantas desalinhadas (roundAtual diferente).'
                                    : `Executar round ${nextRound} em lote`
                                }
                              >
                                Próximo round
                              </button>
                            </div>
                          </div>
                        </div>

                        {!aligned && (
                          <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-950/30 px-3 py-2">
                            <p className="text-xs text-rose-300">
                              Plantas desalinhadas: <span className="font-medium">roundAtual</span> diferente entre elas. O lote só pode ser executado quando todas estão no mesmo round.
                            </p>
                          </div>
                        )}

                        {/* Rounds grid */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {group.rounds.map((r) => (
                            <div
                              key={r.roundIndex}
                              className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 ${
                                r.pending === 0
                                  ? 'border-emerald-400/20 bg-emerald-400/8'
                                  : r.due
                                    ? 'border-rose-400/20 bg-rose-400/8'
                                    : 'border-white/5 bg-white/3'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  R{r.roundIndex}/{group.roundsTotal}
                                </p>
                                <p className="text-xs text-slate-500 tabular-nums">
                                  {r.scheduledAt ? fmtDateTime(r.scheduledAt) : '—'}
                                </p>
                              </div>
                              <div className="text-xs text-slate-400 flex-shrink-0 tabular-nums">
                                <span className="text-emerald-300 font-semibold">{r.executed}</span>
                                <span className="text-slate-600 mx-0.5">/</span>
                                <span className="text-amber-300 font-semibold">{r.pending}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                          Marque o próximo round em lote aqui. O drawer ainda permite marcar individualmente.
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
    </PokedexModal>
  );
}