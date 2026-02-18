import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { PlantaCard } from '../components/PlantaCard';
import type { Planta } from '../types';
import './Dashboard.css';

export function Dashboard() {
  const { usuario, logout } = useAuth();
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    carregarPlantas();
  }, [page]);

  const carregarPlantas = async () => {
    setCarregando(true);
    setErro('');
    try {
      const response = await apiService.getPlantasListagem(page, 12);
      setPlantas(response.content || response);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      setErro('Erro ao carregar plantas');
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🌿 Pokédex Plantas 🌿</h1>
          <div className="header-info">
            <span className="usuario-nome">Treinador: {usuario?.login}</span>
            <button onClick={logout} className="logout-btn">Sair</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="pokedex-container">
          <div className="pokedex-header">
            <h2>Suas Plantas Capturadas</h2>
            <span className="plantas-badge">{plantas.length}/{totalPages * 12}</span>
          </div>

          {carregando && <div className="loading-spinner">Carregando Pokédex...</div>}
          {erro && <div className="error-message">{erro}</div>}

          {!carregando && plantas.length === 0 && (
            <div className="empty-state">
              <p>Nenhuma planta capturada ainda!</p>
              <small>Comece a cultivar novas plantas</small>
            </div>
          )}

          <div className="cards-grid">
            {plantas.map((planta) => (
              <PlantaCard key={planta.id} planta={planta} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← Anterior
              </button>
              <span className="page-info">
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages - 1}
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
