import React, { useEffect, useState } from "react";
import { FaThermometerHalf, FaTint, FaCloudRain } from "react-icons/fa";

interface Weather {
  temperature: number;
  humidity: number;
  precipitation: number;
  location: string;
}

export default function WeatherBox() {
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

  if (!weather) return <div className="bg-gray-800 rounded-xl p-4">Carregando...</div>;

  return (
    <div className="flex items-center bg-gray-800 rounded-xl p-2 gap-3">
      <div className="flex items-center gap-1 text-sm">
        <FaThermometerHalf color="#f87171" />
        <span>{weather.temperature?.toFixed(1)}°C</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <FaTint color="#60a5fa" />
        <span>{weather.humidity}%</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <FaCloudRain color="#67e8f9" />
        <span>{weather.precipitation}mm</span>
      </div>
      <span className="ml-2 text-xs text-gray-300 font-semibold">- {weather.location}</span>
      {editMode ? (
        <div className="flex items-center">
          <input
            className="rounded px-2 py-1 text-sm bg-gray-700 text-white border border-gray-600"
            value={location}
            onChange={e => setLocation(e.target.value)}
            disabled={loading}
            style={{ width: 120 }}
          />
          <button
            className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 text-sm ml-1"
            onClick={handleLocationChange}
            disabled={loading}
          >Salvar</button>
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white rounded px-3 py-1 text-sm ml-1"
            onClick={() => setEditMode(false)}
            disabled={loading}
          >Cancelar</button>
        </div>
      ) : (
        <button
          className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 text-sm ml-2"
          onClick={() => setEditMode(true)}
        >Alterar</button>
      )}
    </div>
  );
}
