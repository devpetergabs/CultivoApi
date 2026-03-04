import { useCallback, useEffect, useState } from 'react';
import type { AgendaInseticida } from '../types';
import { apiService } from '../services/api';

export function useInseticidaAgenda(plantaId: number | null, opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;

  const [agenda, setAgenda] = useState<AgendaInseticida | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !plantaId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getAgendaInseticida(plantaId);
      setAgenda(data);
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao carregar agenda');
    } finally {
      setLoading(false);
    }
  }, [enabled, plantaId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { agenda, loading, error, refresh };
}
