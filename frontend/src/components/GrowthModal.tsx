import React, { useState } from 'react';
import { apiService } from '../services/api';

interface GrowthModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  onSubmit?: (data: GrowthData) => void;
}

export interface GrowthData {
  newHeightCm: number;
  newWidthCm: number;
  newStemWidthCm: number;
  notes?: string;
}

export const GrowthModal: React.FC<GrowthModalProps> = ({ open, onClose, plantId, onSubmit }) => {
  const [newHeightCm, setNewHeightCm] = useState(0);
  const [newWidthCm, setNewWidthCm] = useState(0);
  const [newStemWidthCm, setNewStemWidthCm] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.patchPlantaCrescer(plantId, {
        newHeightCm,
        newWidthCm,
        newStemWidthCm,
        notes,
      });
      setLoading(false);
      onClose();
      if (onSubmit) onSubmit({ newHeightCm, newWidthCm, newStemWidthCm, notes });
    } catch (err) {
      setLoading(false);
      // Adicione feedback de erro se desejar
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="bg-[#172232] rounded-xl shadow-lg p-4 w-[260px] max-w-full border border-[#6fbf86]/30 relative">
        <div className="flex items-center justify-center mb-2">
          <span className="text-lg">🌱</span>
          <span className="text-[#A7E5B2] font-bold text-sm ml-2">LEVEL UP</span>
        </div>
        <h2 className="text-base font-bold mb-3 text-[#A7E5B2] text-center">Crescimento</h2>
        <form onSubmit={handleSave}>
          <div className="mb-2">
            <label className="block text-xs text-[#e7c35a] font-bold mb-0.5">Altura (cm)</label>
            <input type="number" value={newHeightCm} onChange={e => setNewHeightCm(Number(e.target.value))} className="w-full rounded border border-[#e7c35a]/30 bg-[#111A2E] px-2 py-1 text-[#A7E5B2] text-xs font-bold focus:border-[#e7c35a] focus:ring-1 focus:ring-[#e7c35a]/20 transition-all" min={0} />
          </div>
          <div className="mb-2">
            <label className="block text-xs text-[#e7c35a] font-bold mb-0.5">Largura (cm)</label>
            <input type="number" value={newWidthCm} onChange={e => setNewWidthCm(Number(e.target.value))} className="w-full rounded border border-[#e7c35a]/30 bg-[#111A2E] px-2 py-1 text-[#A7E5B2] text-xs font-bold focus:border-[#e7c35a] focus:ring-1 focus:ring-[#e7c35a]/20 transition-all" min={0} />
          </div>
          <div className="mb-2">
            <label className="block text-xs text-[#e7c35a] font-bold mb-0.5">Caule (cm)</label>
            <input type="number" value={newStemWidthCm} onChange={e => setNewStemWidthCm(Number(e.target.value))} className="w-full rounded border border-[#e7c35a]/30 bg-[#111A2E] px-2 py-1 text-[#A7E5B2] text-xs font-bold focus:border-[#e7c35a] focus:ring-1 focus:ring-[#e7c35a]/20 transition-all" min={0} />
          </div>
          <div className="mb-2">
            <label className="block text-xs text-[#A7E5B2] font-bold mb-0.5">Obs</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded border border-[#6fbf86]/20 bg-[#111A2E] px-2 py-1 text-[#A7E5B2] text-xs font-semibold focus:border-[#6fbf86] focus:ring-1 focus:ring-[#6fbf86]/20 transition-all" rows={1} placeholder="..." />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={handleCancel} className="px-2 py-1 rounded bg-[#232d3a] text-[#e7c35a] text-xs font-bold border border-[#e7c35a]/30 hover:bg-[#e7c35a] hover:text-[#232d3a] transition-all" disabled={loading}>Cancelar</button>
            <button type="submit" className="px-2 py-1 rounded bg-gradient-to-r from-[#6fbf86] to-[#A7E5B2] text-[#172232] text-xs font-bold border border-[#6fbf86]/30 shadow-sm hover:bg-[#A7E5B2] hover:text-[#172232] transition-all" disabled={loading}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};
