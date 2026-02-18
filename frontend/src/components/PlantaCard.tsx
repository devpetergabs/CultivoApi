import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { Planta, PlantaFoto, PlantaCompleta, PlantaAditivo } from '../types';
import './PlantaCard.css';

interface PlantaCardProps {
  planta: Planta;
  onClose?: () => void;
}

const tipos = ['Selvagem', 'Equilibrado', 'Potente', 'Delicado', 'Robusto'];
const cores = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

function getTipo(strain: string): { tipo: string; cor: string; emoji: string } {
  const index = strain.charCodeAt(0) % tipos.length;
  const emojis = ['🌿', '🌱', '💪', '🌸', '🛡️'];
  return {
    tipo: tipos[index],
    cor: cores[index],
    emoji: emojis[index]
  };
}

// Formata tamanho do vaso (ex: VINTE_E_UM_L → 21L)
function formatarTamanhoVaso(tamanhoVaso: string): string {
  const mapa: { [key: string]: string } = {
    'CINCO_L': '5L',
    'VINTE_E_UM_L': '21L',
    'TRINTA_L': '30L'
  };
  return mapa[tamanhoVaso] || tamanhoVaso;
}

// Calcula idade em dias baseado na data de germinação
function calcularIdadeEmDias(data: string | null | undefined): number | null {
  if (!data) return null;
  
  const dataObj = new Date(data);
  if (isNaN(dataObj.getTime())) return null;
  
  const unixEpoch = new Date('1970-01-01');
  if (dataObj.getTime() === unixEpoch.getTime()) return null;
  
  const hoje = new Date();
  const diff = hoje.getTime() - dataObj.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Formata data de germinação (exibe UNDEF se not set)
function formatarDataGerminacao(data: string | null | undefined): string {
  if (!data) return '⚠️ UNDEF';
  
  const dataObj = new Date(data);
  const unixEpoch = new Date('1970-01-01');
  
  // Se for a data padrão do Unix epoch, exibe UNDEF
  if (dataObj.getTime() === unixEpoch.getTime()) {
    return '⚠️ UNDEF';
  }
  
  return dataObj.toLocaleDateString('pt-BR');
}

// Agrupa aditivos por estágio
function agruparAditivosPorEstagio(aditivos: PlantaAditivo[]): { [key: string]: PlantaAditivo[] } {
  const agrupados: { [key: string]: PlantaAditivo[] } = {};
  
  aditivos.forEach(aditivo => {
    if (!agrupados[aditivo.estagio]) {
      agrupados[aditivo.estagio] = [];
    }
    agrupados[aditivo.estagio].push(aditivo);
  });
  
  // Ordenar estágios
  const ordem = ['VEGETATIVA', 'FLORACAO', 'FINALIZACAO'];
  const resultado: { [key: string]: PlantaAditivo[] } = {};
  ordem.forEach(estagio => {
    if (agrupados[estagio]) {
      resultado[estagio] = agrupados[estagio];
    }
  });
  
  return resultado;
}

// Retorna emoji e cor para cada estágio
function getEstagioInfo(estagio: string): { emoji: string; cor: string; label: string } {
  const info: { [key: string]: any } = {
    'VEGETATIVA': { emoji: '🌱', cor: '#22c55e', label: 'Vegetativa' },
    'FLORACAO': { emoji: '🌸', cor: '#ec4899', label: 'Floração' },
    'FINALIZACAO': { emoji: '🍂', cor: '#f59e0b', label: 'Finalização' }
  };
  return info[estagio] || { emoji: '💊', cor: '#6b7280', label: estagio };
}

export function PlantaCard({ planta, onClose }: PlantaCardProps) {
  const [modal, setModal] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [plantaCompleta, setPlantaCompleta] = useState<PlantaCompleta | null>(null);
  const [fotos, setFotos] = useState<PlantaFoto[]>([]);
  const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({});
  const [fotoSelecionada, setFotoSelecionada] = useState<number | null>(null);

  const tipo = getTipo(planta.strain);

  const abrirModal = async () => {
    setCarregando(true);
    try {
      const completa = await apiService.getPlantaCompleta(planta.id);
      const fotosResponse = await apiService.getPlantaFotos(planta.id);
      const fotosList = fotosResponse.content || fotosResponse;
      
      setPlantaCompleta(completa);
      setFotos(Array.isArray(fotosList) ? fotosList : []);
      
      // Carregar primeira foto automaticamente
      if (Array.isArray(fotosList) && fotosList.length > 0) {
        const foto = fotosList[0];
        try {
          const blob = await apiService.getPlantaFotoImagem(planta.id, foto.id);
          setImageUrls({ [foto.id]: URL.createObjectURL(blob) });
          setFotoSelecionada(foto.id);
        } catch (err) {
          console.error('Erro ao carregar foto inicial', err);
        }
      }
      
      setModal(true);
    } catch (err) {
      console.error('Erro ao carregar detalhes', err);
    } finally {
      setCarregando(false);
    }
  };

  const carregarFoto = async (fotoId: number) => {
    if (imageUrls[fotoId]) {
      setFotoSelecionada(fotoId);
      return;
    }
    
    try {
      const blob = await apiService.getPlantaFotoImagem(planta.id, fotoId);
      setImageUrls(prev => ({ ...prev, [fotoId]: URL.createObjectURL(blob) }));
      setFotoSelecionada(fotoId);
    } catch (err) {
      console.error('Erro ao carregar foto', err);
    }
  };

  const fecharModal = () => {
    setModal(false);
    onClose?.();
  };

  return (
    <>
      {/* Card Pokémon */}
      <div className="pokemon-card" style={{ borderColor: tipo.cor }} onClick={abrirModal}>
        <div className="card-header" style={{ background: tipo.cor }}>
          <div className="card-title">
            <h3>{planta.nome}</h3>
            <span className="card-id">#{planta.id}</span>
          </div>
          <span className="card-emoji">{tipo.emoji}</span>
        </div>

        <div className="card-image-container">
          <div className="card-image" style={{ background: `linear-gradient(135deg, ${tipo.cor}22, ${tipo.cor}44)` }}>
            <span className="big-emoji">🌿</span>
          </div>
        </div>

        <div className="card-type">
          <span className="type-badge" style={{ backgroundColor: tipo.cor }}>
            {tipo.tipo}
          </span>
        </div>

        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">ALT</span>
            <span className="stat-value">{Math.round(planta.altura)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">LAR</span>
            <span className="stat-value">{Math.round(planta.largura)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">VASO</span>
            <span className="stat-value">{formatarTamanhoVaso(planta.tamanhoVaso)}</span>
          </div>
        </div>

        <div className="card-strain">
          <small>{planta.strain}</small>
        </div>

        <button className="card-button">Ver Detalhes</button>
      </div>

      {/* Modal Pokédex */}
      {modal && plantaCompleta && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" style={{ borderColor: tipo.cor }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={fecharModal}>✕</button>

            <div className="modal-main">
              {/* Coluna da foto/imagem */}
              <div className="modal-left">
                <div className="modal-image-section">
                  {fotoSelecionada && imageUrls[fotoSelecionada] ? (
                    <img 
                      src={imageUrls[fotoSelecionada]} 
                      alt="Planta"
                      className="modal-image"
                    />
                  ) : (
                    <div className="modal-image-placeholder" style={{ background: `linear-gradient(135deg, ${tipo.cor}22, ${tipo.cor}44)` }}>
                      <span>🌿</span>
                    </div>
                  )}
                </div>

                {fotos.length > 0 && (
                  <div className="modal-fotos-thumbnails">
                    {fotos.map(foto => (
                      <button
                        key={foto.id}
                        className={`thumbnail ${fotoSelecionada === foto.id ? 'active' : ''}`}
                        onClick={() => carregarFoto(foto.id)}
                        title={foto.descricao}
                      >
                        {imageUrls[foto.id] ? (
                          <img src={imageUrls[foto.id]} alt={foto.descricao} />
                        ) : (
                          <span>📸</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna de detalhes */}
              <div className="modal-right">
                <div className="modal-header">
                  <h2>{plantaCompleta.nome}</h2>
                  <span className="modal-type" style={{ backgroundColor: tipo.cor }}>
                    {tipo.tipo}
                  </span>
                </div>

                <div className="modal-info">
                  <div className="info-block">
                    <h4>Características</h4>
                    <div className="info-grid">
                      <div className="info-row">
                        <span className="info-label">Altura:</span>
                        <span className="info-value">{plantaCompleta.altura} cm</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Largura:</span>
                        <span className="info-value">{plantaCompleta.largura} cm</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Caule:</span>
                        <span className="info-value">{plantaCompleta.larguraCaule} cm</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Vaso:</span>
                        <span className="info-value">{formatarTamanhoVaso(plantaCompleta.tamanhoVaso)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Germinação:</span>
                        <span className="info-value">
                          {formatarDataGerminacao(plantaCompleta.dataGerminacao)}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Idade:</span>
                        <span className="info-value">{calcularIdadeEmDias(plantaCompleta.dataGerminacao) !== null ? `${calcularIdadeEmDias(plantaCompleta.dataGerminacao)} dias` : '⚠️ N/A'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Variante:</span>
                        <span className="info-value">{plantaCompleta.strain}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Estágio:</span>
                        <span className="info-value" style={{ color: tipo.cor, fontWeight: 'bold' }}>
                          {plantaCompleta.estagio ? `${tipo.emoji} ${plantaCompleta.estagio}` : '⚠️ N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {plantaCompleta.aditivos && plantaCompleta.aditivos.length > 0 && (
                    <div className="info-block">
                      <h4>Aditivos Advanced Nutrients</h4>
                      {Object.entries(agruparAditivosPorEstagio(plantaCompleta.aditivos)).map(([estagio, aditivos]) => {
                        const estagioInfo = getEstagioInfo(estagio);
                        return (
                          <div key={estagio} className="estagio-section">
                            <div className="estagio-header" style={{ backgroundColor: estagioInfo.cor }}>
                              <span className="estagio-emoji">{estagioInfo.emoji}</span>
                              <span className="estagio-label">{estagioInfo.label}</span>
                            </div>
                            <div className="aditivos-por-estagio">
                              {aditivos.map(aditivo => (
                                <div key={aditivo.id} className="aditivo-card" style={{ borderColor: estagioInfo.cor }}>
                                  <div className="aditivo-header">
                                    <span className="aditivo-nome">{aditivo.aditivoNome}</span>
                                    <span className="aditivo-dose" style={{ backgroundColor: estagioInfo.cor }}>{aditivo.doseEmML}mL</span>
                                  </div>
                                  <div className="aditivo-marca">
                                    <small>🏢 {aditivo.aditivoMarca}</small>
                                  </div>
                                  <div className="aditivo-descricao">
                                    <small>{aditivo.aditivoDescricao}</small>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="info-block">
                    <h4>Cultivador</h4>
                    <div className="cultivador-info">
                      <p><strong>{plantaCompleta.cultivadorNome}</strong></p>
                      <p>@{plantaCompleta.cultivadorLogin}</p>
                      <p>📱 {plantaCompleta.cultivadorTelefone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
