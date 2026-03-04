import React, { useEffect, useMemo, useState } from "react";

interface Weather {
  temperature: number;
  humidity: number;
  precipitation: number;
  location: string;
}

type WeatherBoxProps = {
  /** Variante compacta (header) */
  compact?: boolean;
  className?: string;
};

export default function WeatherBox({ compact = true, className }: WeatherBoxProps) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setLoading(true);
    const res = await fetch("/api/weather");
    if (res.ok) {
      const data = await res.json();
      setWeather(data);
      setLocation(data.location);
    }
    setLoading(false);
  };

  const handleLocationChange = async () => {
    setLoading(true);
    const res = await fetch(`/api/weather/location?location=${encodeURIComponent(location)}`, {
      method: "PUT",
    });
    if (res.ok) {
      const data = await res.json();
      setWeather(data);
      setEditMode(false);
    }
    setLoading(false);
  };

  const containerClass = useMemo(() => {
    const base =
      "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_10px_26px_rgba(9,15,25,0.35)]";
    const size = compact ? "px-3 py-2" : "px-4 py-3";
    return [base, size, className].filter(Boolean).join(" ");
  }, [compact, className]);

  if (!weather)
    return (
      <div className={containerClass}>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="inline-block h-2 w-2 rounded-full bg-[#6fbf86] animate-pulse" />
          Carregando clima…
        </div>
      </div>
    );

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-white/85">
          <span className="text-red-300" aria-hidden>
            🌡️
          </span>
          <span className="font-semibold">{weather.temperature?.toFixed(1)}°C</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-white/85">
          <span className="text-sky-300" aria-hidden>
            💧
          </span>
          <span className="font-semibold">{weather.humidity}%</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-white/85">
          <span className="text-cyan-200" aria-hidden>
            🌧️
          </span>
          <span className="font-semibold">{weather.precipitation}mm</span>
        </div>
      </div>

      <div className="h-5 w-px bg-white/10" />

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-white/70 font-medium truncate max-w-[180px]">{weather.location}</span>

        {editMode ? (
          <div className="flex items-center gap-1">
            <input
              className="h-8 w-[150px] rounded-lg px-2 text-xs bg-black/30 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#6fbf86]/30"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
            <button
              className="h-8 rounded-lg px-2 text-xs font-semibold bg-[#6fbf86] text-[#0B1220] hover:brightness-110 transition disabled:opacity-60"
              onClick={handleLocationChange}
              disabled={loading}
              type="button"
              title="Salvar"
            >
              OK
            </button>
            <button
              className="h-8 rounded-lg px-2 text-xs font-semibold bg-white/10 text-white/80 hover:bg-white/15 transition disabled:opacity-60"
              onClick={() => setEditMode(false)}
              disabled={loading}
              type="button"
              title="Cancelar"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            className="h-8 rounded-lg px-2 text-xs font-semibold bg-white/10 text-white/80 hover:bg-white/15 transition"
            onClick={() => setEditMode(true)}
            type="button"
          >
            Alterar
          </button>
        )}
      </div>
    </div>
  );
}
