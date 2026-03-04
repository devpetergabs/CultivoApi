import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  dosePorPlanta: number;
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
    const dosePorPlanta = Number(parsed?.dosePorPlanta);

    if (!Number.isFinite(aditivoId) || aditivoId <= 0) return null;
    if (!Number.isFinite(dosePorPlanta) || dosePorPlanta <= 0) return null;

    return {
      aditivoId: Math.round(aditivoId),
      dosePorPlanta: Number(dosePorPlanta.toFixed(2)),
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
  const [dosePorPlanta, setDosePorPlanta] = useState<number>(8);
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

  const dosePorPlantaClamped = useMemo(
    () => clampFloat(Number(dosePorPlanta), 0.1, 100000, 2),
    [dosePorPlanta]
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
    const dose = dosePorPlantaClamped;
    if (!(dose > 0)) return false;

    const abaixoMin = typeof doseRange.min === 'number' ? dose < doseRange.min : false;
    const acimaMax = typeof doseRange.max === 'number' ? dose > doseRange.max : false;
    return abaixoMin || acimaMax;
  }, [dosePorPlantaClamped, doseRange]);

  useEffect(() => {
    if (!isDoseForaFaixa) {
      setConfirmDoseForaFaixa(false);
    }
  }, [isDoseForaFaixa, effectiveSelectedId]);

  const totalEstimado = useMemo(() => {
    return Number((dosePorPlantaClamped * selectedCount).toFixed(2));
  }, [dosePorPlantaClamped, selectedCount]);

  const selectedStockMl = useMemo(() => {
    if (!selected) return null;

    try {
      const local: any = getAditivoStock(selected.id);
      const localMl = resolveStockMl(local);
      if (localMl !== null) return localMl;
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
        setDosePorPlanta(preset.dosePorPlanta);
      } else {
        setSelectedId(null);
        setDosePorPlanta(8);
      }
    } catch {
      setSelectedId(null);
      setDosePorPlanta(8);
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
    if (!(dosePorPlantaClamped > 0)) {
      setError('Informe uma dose por planta válida.');
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
            dosePorPlanta: dosePorPlantaClamped,
          })
        );
      } catch {
        // ignore
      }

      const batchId = `B${Date.now().toString(36)}`;
      const safeObs = notes.trim();
      const baseDesc = `${selected.nome} (${selected.marca}) — tratamento em lote`;

      const createdEvents = await Promise.all(
        selectedPlantIds.map((plantId) => {
          const signal = signalsByPlantId[plantId];
          const pestType = signal?.pestType ?? 'DESCONHECIDA';
          const intensityPart = signal?.intensity ? ` intensity=${signal.intensity}` : '';
          const signalBlock = `[PEST_SIGNAL] type=${pestType}${intensityPart}`;
          const descricao = `${baseDesc} | ${signalBlock}${safeObs ? ` | ${safeObs}` : ''}`;

          return apiService.createPlantaEvento(plantId, {
            tipo: 'INSETICIDA',
            descricao,
            doseEmML: dosePorPlantaClamped,
            produtoId: id,
            roundsTotal: roundsTotalClamped,
            descansoDias: descansoDiasClamped,
            idempotencyKey: `insecticide-bulk:${batchId}:${plantId}:${id}:${dosePorPlantaClamped}:${roundsTotalClamped}:${descansoDiasClamped}`,
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
        const currentMl = resolveStockMl(localAny);
        if (localAny && currentMl !== null) {
          const next = Math.max(0, Number(currentMl ?? 0) - totalEstimado);

          const payload: AditivoStock = {
            tracked: true,
            tipoProduto: localAny.tipoProduto ?? (selected as any)?.tipo ?? null,
            stockMlAtual: next,
            unidades: Number(localAny.unidades ?? 0),
            mlFrasco: Number(localAny.mlFrasco ?? 0),
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div
        className="w-[720px] max-w-[96vw] rounded-xl border border-[#f39a5c]/25 bg-gradient-to-b from-[#101a2b] to-[#0B1220] p-4 shadow-[0_12px_30px_rgba(9,15,25,0.5)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Inseticida em lote"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Inseticida (lote)</h3>
            <p className="text-xs text-[#9fb0c0] font-normal">
              Um tratamento por planta. Aplique em lote e gerencie rounds na agenda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('APPLY')}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] transition ${
                activeTab === 'APPLY'
                  ? 'border-[#f39a5c]/50 bg-[#f39a5c]/15 text-[#f7c6a1]'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
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
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] transition ${
                activeTab === 'AGENDA'
                  ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Agenda do lote
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600/70 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-400"
            >
              Fechar
            </button>
          </div>
        </div>

        {activeTab === 'APPLY' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Plantas infectadas</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      disabled={!canInteract}
                      className="text-[11px] text-slate-200/80 hover:text-white"
                    >
                      tudo
                    </button>
                    <span className="text-slate-500">•</span>
                    <button
                      type="button"
                      onClick={selectNone}
                      disabled={!canInteract}
                      className="text-[11px] text-slate-200/80 hover:text-white"
                    >
                      nada
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-[11px] text-slate-300/90 uppercase tracking-[0.06em]">Filtro por tipo de praga</label>
                  <select
                    value={filterPestType}
                    onChange={(event) => setFilterPestType(event.target.value)}
                    disabled={!canInteract}
                    className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
                  >
                    <option value="ALL">Todos os tipos</option>
                    {pestTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 max-h-[240px] overflow-auto pr-1 space-y-2">
                  {filteredInfectedPlants.length === 0 ? (
                    <div className="text-xs text-slate-400">Nenhuma planta marcada com [PEST_SIGNAL] para este filtro.</div>
                  ) : (
                    filteredInfectedPlants.map((item) => {
                      const checked = selectedPlantIds.includes(item.plant.id);
                      return (
                        <label
                          key={item.plant.id}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition ${
                            checked
                              ? 'border-[#f39a5c]/40 bg-[#f39a5c]/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePlant(item.plant.id)}
                            disabled={!canInteract}
                            className="h-4 w-4 accent-[#f39a5c]"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{item.plant.name}</div>
                            <div className="text-[11px] text-slate-300/70 truncate">
                              type={item.signal.pestType}
                              {item.signal.intensity ? ` | intensity=${item.signal.intensity}` : ''}
                            </div>
                          </div>
                          <div className="ml-auto text-[11px] text-slate-400/70">#{item.plant.id}</div>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="mt-2 text-[11px] text-slate-400/80">
                  Selecionadas: <span className="font-semibold text-slate-200">{selectedCount}</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Produtos do inventário</div>
                  <div className="text-[11px] text-slate-400/80">
                    Estoque — <span className="font-semibold text-slate-200">{estText}</span>
                  </div>
                </div>

                <select
                  value={effectiveSelectedId ?? ''}
                  onChange={(event) => setSelectedId(event.target.value ? Number(event.target.value) : null)}
                  disabled={!canInteract}
                  className="mt-2 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
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
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-[11px] text-slate-300/90">Match para {pestTypeForMatch}</span>
                    {selectedMatch === 'recommended' ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                        Recomendado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                        Fora do recomendado
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Dose por planta (mL)</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={dosePorPlanta}
                      onChange={(event) => setDosePorPlanta(Number(event.target.value))}
                      disabled={!canInteract}
                      className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
                    />
                    <div className="mt-1 text-[11px] text-slate-400/80">
                      Faixa: <span className="font-semibold text-slate-200">{formatDoseRange(doseRange.min, doseRange.max)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Rounds / Descanso</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={roundsTotal}
                        onChange={(event) => { setRoundsTouched(true); setRoundsTotal(Number(event.target.value)); }}
                        disabled={!canInteract}
                        className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
                        title="Rounds totais"
                      />
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={descansoDias}
                        onChange={(event) => { setDescTouched(true); setDescansoDias(Number(event.target.value)); }}
                        disabled={!canInteract}
                        className="w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
                        title="Dias de descanso"
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400/80">Ex.: 6 rounds com 4d descanso</div>
                  </div>
                </div>

                {isDoseForaFaixa && (
                  <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
                    <div className="text-[11px] font-semibold text-amber-200">Dose fora da faixa recomendada.</div>
                    <label className="mt-1 inline-flex items-center gap-2 text-[11px] text-amber-100/90">
                      <input
                        type="checkbox"
                        checked={confirmDoseForaFaixa}
                        onChange={(event) => setConfirmDoseForaFaixa(event.target.checked)}
                        disabled={!canInteract}
                        className="h-3.5 w-3.5 accent-amber-400"
                      />
                      Confirmo aplicar fora da recomendação
                    </label>
                  </div>
                )}

                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300/90 uppercase tracking-[0.06em]">Total estimado</span>
                    <span className={`text-xs font-semibold ${hasStockEnough ? 'text-[#f7c6a1]' : 'text-red-400'}`}>
                      {totalEstimado} mL
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400/80">
                    {hasStockEnough ? 'Ok para aplicar.' : 'Estoque insuficiente para as selecionadas.'}
                  </div>
                </div>

                <div className="mt-2 rounded-lg border border-white/10 bg-[#0f1726] p-3">
                  <div className="text-[11px] text-slate-300/90 uppercase tracking-[0.06em]">Preview de agenda</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {schedulePreview.slice(0, Math.min(6, schedulePreview.length)).map((it) => (
                      <div key={it.round} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                        <div className="text-[10px] text-white/50">R{it.round}</div>
                        <div className="text-[11px] text-white/80">{it.when.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                      </div>
                    ))}
                  </div>
                  {schedulePreview.length > 6 && (
                    <div className="mt-2 text-[11px] text-white/45">+{schedulePreview.length - 6} rounds…</div>
                  )}
                </div>
              </div>
            </div>

            <label className="mt-3 block text-xs font-medium text-slate-300 uppercase tracking-[0.06em]">Observação (opcional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={!canInteract}
              className="mt-1 w-full rounded-lg border border-slate-600/70 bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#f39a5c]/70 focus:ring-1 focus:ring-[#f39a5c]/20 disabled:opacity-60"
            />

            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleAplicar}
                className="rounded-lg bg-[#f39a5c] px-3 py-2 text-xs font-semibold text-[#0B1220] hover:brightness-110 disabled:opacity-60"
                disabled={
                  !canInteract ||
                  !selected ||
                  !hasStockEnough ||
                  selectedPlantIds.length === 0 ||
                  !(dosePorPlantaClamped > 0) ||
                  (isDoseForaFaixa && !confirmDoseForaFaixa)
                }
              >
                {isSaving ? 'Aplicando…' : 'Aplicar lote'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'AGENDA' && (
          <>
            <div className="rounded-xl border border-amber-400/20 bg-[#111A2E]/60 backdrop-blur-sm p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-[0.06em] text-amber-300/90">🛡️ Tratamentos (lote)</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => refreshAgendas()}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 text-xs hover:bg-white/10 disabled:opacity-50"
                    disabled={agendaLoading}
                  >
                    ↻ Atualizar
                  </button>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-white/50">
                Selecionadas no lote: <span className="font-semibold text-white/80">{selectedPlantIds.length}</span> •
                Agrupado por <span className="font-semibold">produto + rounds + descanso + início</span>.
              </div>

              {agendaError && (
                <div className="mt-3 text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                  {agendaError}
                </div>
              )}

              {agendaLoading && <div className="mt-3 text-xs text-white/50">Carregando agenda…</div>}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3">
              {agendaGroups.length === 0 ? (
                <div className="text-sm text-white/60">Nenhum tratamento ativo nas plantas selecionadas.</div>
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
                      className={`rounded-xl border p-4 bg-[#0B1220]/70 ${
                        isFocused ? 'border-amber-400/40' : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {group.produtoNome} • {size} plantas • {group.roundsTotal} rounds
                          </div>
                          <div className="mt-1 text-xs text-white/50">
                            Descanso: {group.descansoDias}d • Início: {group.inicioBucket}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {group.entries.map((e) => (
                              <span
                                key={e.plant.id}
                                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70"
                                title={`Planta #${e.plant.id}`}
                              >
                                {e.plant.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {group.nextScheduledAt ? (
                            <div
                              className={`text-xs font-semibold ${
                                dueTxt != null && dueTxt <= 0 ? 'text-rose-300' : 'text-amber-200'
                              }`}
                              title={group.nextScheduledAt}
                            >
                              {dueTxt != null && dueTxt <= 0 ? 'HOJE / ATRASADO' : `Falta ${dueTxt}d`} • R{nextRound}
                            </div>
                          ) : (
                            <div className="text-xs text-white/40">Sem próximo round</div>
                          )}

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => exportBatchIcs(group)}
                              disabled={agendaBusyKey != null}
                              className="px-3 py-2 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 text-xs font-semibold uppercase tracking-[0.06em] hover:bg-amber-500/15 disabled:opacity-40"
                            >
                              📅 .ics
                            </button>

                            <button
                              type="button"
                              onClick={() => executeNextRoundBatch(group)}
                              disabled={!aligned || agendaBusyKey != null || agendaBusyKey === group.key}
                              className="px-3 py-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 text-xs font-semibold uppercase tracking-[0.06em] hover:bg-emerald-500/15 disabled:opacity-40"
                              title={
                                !aligned
                                  ? 'Plantas desalinhadas (roundAtual diferente).'
                                  : `Executar round ${nextRound} em lote`
                              }
                            >
                              ✅ Próximo
                            </button>
                          </div>
                        </div>
                      </div>

                      {!aligned && (
                        <div className="mt-3 text-xs text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">
                          Plantas desalinhadas: roundAtual diferente. (Regra: lote só executa quando todas estão no mesmo round)
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.rounds.map((r) => (
                          <div
                            key={r.roundIndex}
                            className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 ${
                              r.pending === 0
                                ? 'border-emerald-400/20 bg-emerald-500/10'
                                : r.due
                                  ? 'border-rose-400/20 bg-rose-500/10'
                                  : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white/90">Round {r.roundIndex}/{group.roundsTotal}</div>
                              <div className="text-[11px] text-white/50">{r.scheduledAt ? fmtDateTime(r.scheduledAt) : '—'}</div>
                            </div>
                            <div className="text-[11px] text-white/60">
                              <span className="text-emerald-200 font-semibold">{r.executed}</span> ✅ /{' '}
                              <span className="text-amber-200 font-semibold">{r.pending}</span> 🕓
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 text-[11px] text-white/45">
                        Dica: marque o próximo round em lote aqui. O drawer ainda permite marcar individualmente.
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
