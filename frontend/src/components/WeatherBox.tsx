import React, { useEffect, useState } from "react";

interface Weather {
  temperature: number;
  humidity: number;
  precipitation: number;
  location: string;
}

type WeatherBoxProps = {
  compact?: boolean;
  variant?: 'compact' | 'hud' | 'strip';
  className?: string;
};

function cityAbbr(location: string): string {
  const parts = location.split(',');
  const city = parts[0]?.trim() ?? location;
  const country = parts[1]?.trim() ?? '';
  const initials = city
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return country ? `${initials} · ${country}` : initials;
}

export default function WeatherBox({ variant = 'compact', className }: WeatherBoxProps) {
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

  if (variant === 'strip') {
    if (!weather) {
      return (
        <div className={`flex items-center gap-1 text-[12px] text-white/40 ${className ?? ''}`}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#6fbf86] animate-pulse" />
          carregando clima…
        </div>
      );
    }

    const abbr = cityAbbr(weather.location);

    return (
      <div className={`flex items-center gap-3 text-[12px] text-white/65 ${className ?? ''}`}>
        {editMode ? (
          <div className="flex items-center gap-1">
            <input
              className="h-6 w-[120px] rounded px-1.5 text-[11px] bg-black/40 text-white border border-white/15 focus:outline-none focus:ring-1 focus:ring-[#6fbf86]/40"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLocationChange()}
              disabled={loading}
              autoFocus
            />
            <button className="h-6 rounded px-1.5 text-[11px] font-semibold bg-[#6fbf86] text-[#0B1220] hover:brightness-110 transition disabled:opacity-60" onClick={handleLocationChange} disabled={loading} type="button">OK</button>
            <button className="h-6 rounded px-1.5 text-[11px] text-white/60 hover:text-white transition" onClick={() => setEditMode(false)} disabled={loading} type="button">✕</button>
          </div>
        ) : (
          <button
            className="group flex items-center gap-1 hover:text-white transition-colors"
            onClick={() => setEditMode(true)}
            type="button"
            title="Alterar localização"
          >
            <span>&#x1f4cd;</span>
            <span className="font-medium">{abbr}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        <span className="text-white/20">|</span>
        <span>💧 <span className="font-medium text-white/80">{weather.humidity}%</span></span>
        <span className="text-white/20">|</span>
        <span>🌧️ <span className="font-medium text-white/80">{weather.precipitation}mm</span></span>
        <span className="text-white/20">|</span>
        <span>🌡️ <span className="font-semibold text-white">{weather.temperature?.toFixed(1)}°C</span></span>
      </div>
    );
  }

  if (variant === 'hud') {
    if (!weather) {
      return (
        <div className={`rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md ${className ?? ''}`}>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#6fbf86] animate-pulse" />
            carregando…
          </div>
        </div>
      );
    }

    return (
      <div className={`rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.4)] ${className ?? ''}`}>
        {/* Temperatura principal */}
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none" aria-hidden>&#x1f321;&#xfe0f;</span>
          <span className="text-xl font-bold tracking-tight text-white leading-none">
            {weather.temperature?.toFixed(1)}°C
          </span>
        </div>

        {/* Atributos secundários */}
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/55 font-mono">
          <span>💧 {weather.humidity}%</span>
          <span className="text-white/20">|</span>
          <span>🌧️ {weather.precipitation}mm</span>
        </div>

        {/* Waypoint */}
        <div className="mt-1.5 border-t border-white/8 pt-1.5">
          {editMode ? (
            <div className="flex items-center gap-1">
              <input
                className="h-6 w-[110px] rounded px-1.5 text-[11px] bg-black/40 text-white border border-white/15 focus:outline-none focus:ring-1 focus:ring-[#6fbf86]/40"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLocationChange()}
                disabled={loading}
                autoFocus
              />
              <button
                className="h-6 rounded px-1.5 text-[11px] font-semibold bg-[#6fbf86] text-[#0B1220] hover:brightness-110 transition disabled:opacity-60"
                onClick={handleLocationChange}
                disabled={loading}
                type="button"
              >OK</button>
              <button
                className="h-6 rounded px-1.5 text-[11px] text-white/60 hover:text-white transition"
                onClick={() => setEditMode(false)}
                disabled={loading}
                type="button"
              >✕</button>
            </div>
          ) : (
            <button
              className="group flex items-center gap-1 text-[11px] text-white/45 hover:text-white/80 transition-colors"
              onClick={() => setEditMode(true)}
              type="button"
              title="Alterar localização"
            >
              <span className="text-[10px]">📍</span>
              <span className="font-mono tracking-wide">{cityAbbr(weather.location)}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- variant: compact (fallback) ---
  if (!weather)
    return (
      <div className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md shadow-[0_10px_26px_rgba(9,15,25,0.35)] ${className ?? ''}`}>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="inline-block h-2 w-2 rounded-full bg-[#6fbf86] animate-pulse" />
          Carregando clima…
        </div>
      </div>
    );

  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md shadow-[0_10px_26px_rgba(9,15,25,0.35)] ${className ?? ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-white/85">
          <span className="text-red-300" aria-hidden>&#x1f321;&#xfe0f;</span>
          <span className="font-semibold">{weather.temperature?.toFixed(1)}°C</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/85">
          <span className="text-sky-300" aria-hidden>💧</span>
          <span className="font-semibold">{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/85">
          <span className="text-cyan-200" aria-hidden>🌧️</span>
          <span className="font-semibold">{weather.precipitation}mm</span>
        </div>
      </div>
      <div className="h-5 w-px bg-white/10" />
      <div className="flex items-center gap-2">
        {editMode ? (
          <div className="flex items-center gap-1">
            <input
              className="h-8 w-[150px] rounded-lg px-2 text-xs bg-black/30 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#6fbf86]/30"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
            <button className="h-8 rounded-lg px-2 text-xs font-semibold bg-[#6fbf86] text-[#0B1220] hover:brightness-110 transition disabled:opacity-60" onClick={handleLocationChange} disabled={loading} type="button" title="Salvar">OK</button>
            <button className="h-8 rounded-lg px-2 text-xs font-semibold bg-white/10 text-white/80 hover:bg-white/15 transition disabled:opacity-60" onClick={() => setEditMode(false)} disabled={loading} type="button" title="Cancelar">✕</button>
          </div>
        ) : (
          <button className="group flex items-center gap-1 text-[11px] text-white/70 font-medium truncate max-w-[180px] hover:text-white transition" onClick={() => setEditMode(true)} type="button" title="Alterar cidade">
            <span>{weather.location}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
