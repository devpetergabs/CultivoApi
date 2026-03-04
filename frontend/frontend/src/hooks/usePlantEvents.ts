import { useEffect, useState } from "react";
import { apiService } from "../services/api";
import type { PlantaEvento } from "../types";

type UsePlantEventsOptions = {
  pageSize?: number;
  enabled?: boolean;
};

export function usePlantEvents(plantId: number | null, opts: UsePlantEventsOptions = {}) {
  const { pageSize = 50, enabled = true } = opts;

  const [events, setEvents] = useState<PlantaEvento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!plantId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      // Seu backend retorna Page<> (content)
      const res = await apiService.getPlantaEventos(plantId, 0, pageSize);
      const content = (res?.content ?? res) as PlantaEvento[];
      setEvents(Array.isArray(content) ? content : []);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao carregar eventos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId, enabled, pageSize]);

  return { events, loading, error, refresh };
}