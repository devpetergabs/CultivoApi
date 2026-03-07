import { useEffect, useMemo, useRef, useState } from 'react';
import { PokedexModal } from './ui/PokedexModal';
import { apiService } from '../services/api';
import type { DoctorChatMessage, DoctorChatMessageMetadata, DoctorChatMode, DoctorChatSession } from '../types';

type SourceDetail = NonNullable<DoctorChatMessageMetadata['fontesDetalhadas']>[number];

type SourceInfluenceItem = {
  source: string;
  layer: string | null;
  score: number;
  influencePct: number;
  detail: SourceDetail | null;
};

interface PhotoModalProps {
  open: boolean;
  onClose: () => void;
  plantId: number;
  plantName: string;
}

export function PhotoModal({ open, onClose, plantId, plantName }: PhotoModalProps) {
  const modeOptions: Array<{ value: DoctorChatMode; label: string }> = [
    { value: 'AUTO', label: 'Auto' },
    { value: 'CONHECIMENTO_GERAL', label: 'Curiosidade' },
    { value: 'AVALIACAO_BASICA', label: 'Básica' },
    { value: 'AVALIACAO_TECNICA', label: 'Técnica' },
    { value: 'PRAGA', label: 'Praga' },
  ];

  const [description, setDescription] = useState('');
  const [selectedMode, setSelectedMode] = useState<DoctorChatMode>('AUTO');
  const [session, setSession] = useState<DoctorChatSession | null>(null);
  const [messages, setMessages] = useState<DoctorChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDescription('');
  setSelectedMode('AUTO');
    setError(null);
    setIsLoadingSession(true);

    apiService
      .getOrCreateDoctorSession(plantId)
      .then((data) => {
        setSession(data);
        setMessages(data.messages ?? []);
      })
      .catch((err: any) => {
        const serverMessage =
          typeof err?.response?.data === 'string'
            ? err.response.data
            : err?.response?.data?.message;
        setError(serverMessage || 'Nao foi possivel carregar a conversa do Doctor P.');
      })
      .finally(() => setIsLoadingSession(false));
  }, [open, plantId]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isAnalyzing, open]);

  const hasMessages = messages.length > 0;

  const groupedSubtitle = useMemo(() => {
    if (!session?.sessionId) return plantName;
    return `${plantName} • sessão #${session.sessionId}`;
  }, [plantName, session?.sessionId]);

  const inputPlaceholder = useMemo(() => {
    switch (selectedMode) {
      case 'CONHECIMENTO_GERAL':
        return 'Ex.: Me fale uma curiosidade sobre cannabis';
      case 'AVALIACAO_BASICA':
        return 'Ex.: Planta caída, calor alto hoje e folhas moles. O que fazer?';
      case 'AVALIACAO_TECNICA':
        return 'Ex.: Folhas em garra, pH 5.8, EC 2.1, runoff alto. Qual hipótese?';
      case 'PRAGA':
        return 'Ex.: Vi pontinhos claros, teia fina no verso e avanço rápido. Parece qual praga?';
      default:
        return 'Pergunte algo sobre cultivo, peça uma avaliação básica ou uma leitura técnica.';
    }
  }, [selectedMode]);

  const handleAnalyze = async () => {
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError('Descreva o que deseja analisar.');
      return;
    }

    // Optimistic update: mostra a mensagem do usuário imediatamente
    const optimisticMsg: DoctorChatMessage = {
      id: -Date.now(), // id temporário negativo
      role: 'USER',
      content: trimmedDescription,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setDescription('');
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await apiService.sendDoctorMessage(plantId, trimmedDescription, selectedMode);
      setSession((prev) =>
        prev
          ? { ...prev, sessionId: result.sessionId, updatedAt: new Date().toISOString() }
          : prev
      );
      // Substitui a mensagem otimista pela real e adiciona a do ASSISTANT
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticMsg.id),
        result.userMessage,
        result.assistantMessage,
      ]);
      try {
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: { tone: 'success', message: 'Resposta do Doctor P. atualizada.' },
          })
        );
      } catch {
        // noop
      }
    } catch (err: any) {
      // Remove a mensagem otimista em caso de erro e devolve o texto
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setDescription(trimmedDescription);
      const serverMessage =
        typeof err?.response?.data === 'string'
          ? err.response.data
          : err?.response?.data?.message;
      setError(serverMessage || 'Nao foi possivel enviar sua mensagem ao Doctor P.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetSession = async () => {
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm('Limpar o contexto do Doctor P. e começar uma conversa nova para esta planta?');

    if (!confirmed) {
      return;
    }

    setError(null);
    setIsLoadingSession(true);
    try {
      const data = await apiService.resetDoctorSession(plantId);
      setSession(data);
      setMessages(data.messages ?? []);
      setDescription('');
      setSelectedMode('AUTO');
      try {
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: { tone: 'success', message: 'Contexto do Doctor P. limpo.' },
          })
        );
      } catch {
        // noop
      }
    } catch (err: any) {
      const serverMessage =
        typeof err?.response?.data === 'string'
          ? err.response.data
          : err?.response?.data?.message;
      setError(serverMessage || 'Nao foi possivel limpar a sessao do Doctor P.');
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSubmit = async () => {
    await handleAnalyze();
  };

  const formatMessageTime = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseMetadata = (message: DoctorChatMessage): DoctorChatMessageMetadata | null => {
    if (!message.metadataJson) return null;
    try {
      return JSON.parse(message.metadataJson) as DoctorChatMessageMetadata;
    } catch {
      return null;
    }
  };

  const formatModeLabel = (value?: string) => {
    switch (value) {
      case 'CONHECIMENTO_GERAL':
        return 'Curiosidade';
      case 'AVALIACAO_BASICA':
        return 'Básica';
      case 'AVALIACAO_TECNICA':
        return 'Técnica';
      case 'PRAGA':
        return 'Praga';
      case 'AUTO':
        return 'Auto';
      default:
        return value ? value.toLowerCase().replaceAll('_', ' ') : '';
    }
  };

  const formatModuleLabel = (value?: string | null) => {
    switch (value) {
      case 'fenologia_estagio':
        return 'Fenologia / estágio';
      case 'arquitetura_poda_treinamento':
        return 'Arquitetura / poda';
      case 'nutricao_fertilizacao':
        return 'Nutrição / fert.';
      case 'ciclos_fotoperiodo':
        return 'Fotoperíodo';
      case 'pragas_manejo':
        return 'Pragas / manejo';
      case 'extracao':
        return 'Colheita / pós';
      default:
        return value ? value.replaceAll('_', ' ') : '';
    }
  };

  const formatSupportLevel = (value?: string | null) => {
    if (!value) return '';
    return value.replace('media', 'média');
  };

  const riskToneClass = (value?: string | null) => {
    switch (value) {
      case 'alto':
        return 'border-rose-400/30 bg-rose-400/10 text-rose-200';
      case 'moderado':
        return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
      default:
        return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    }
  };

  const confidenceToneClass = (value?: string | null) => {
    switch (value) {
      case 'alta':
        return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200';
      case 'baixa':
        return 'border-slate-400/30 bg-slate-400/10 text-slate-300';
      default:
        return 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200';
    }
  };

  const parseSourceInfluence = (metadata: DoctorChatMessageMetadata): SourceInfluenceItem[] => {
    const detailsByPath = new Map((metadata.fontesDetalhadas ?? []).map((item) => [item.relativePath, item] as const));
    const raw = metadata.debugRecuperacao ?? [];
    const parsed = raw
      .map((entry) => {
        const clean = String(entry ?? '').trim();
        if (!clean) return null;

        const [layerAndSource, scoreRaw] = clean.split('=');
        const score = Number(scoreRaw);
        if (!layerAndSource || Number.isNaN(score) || score <= 0) return null;

        const sourceParts = layerAndSource.split(':');
        const source = sourceParts[sourceParts.length - 1]?.trim();
        const layer = sourceParts.length > 1 ? sourceParts[0]?.trim() : null;
        if (!source) return null;

        return { source, layer, score, detail: detailsByPath.get(source) ?? null };
      })
      .filter((item): item is { source: string; layer: string | null; score: number; detail: SourceInfluenceItem['detail'] } => Boolean(item));

    const grouped = new Map<string, Omit<SourceInfluenceItem, 'influencePct'>>();
    parsed.forEach((item) => {
      const current = grouped.get(item.source);
      if (current) {
        current.score += item.score;
        if (!current.layer && item.layer) current.layer = item.layer;
        if (!current.detail && item.detail) current.detail = item.detail;
      } else {
        grouped.set(item.source, { ...item });
      }
    });

    const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.score, 0);
    if (total <= 0) return [];

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        influencePct: Math.max(1, Math.round((item.score / total) * 100)),
      }))
      .sort((a, b) => b.score - a.score);
  };

  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title="Doctor P."
      subtitle={groupedSubtitle}
      widthClass="w-full max-w-[720px]"
    >
      {/* Chat container — fixed height, flex column */}
      <div className="flex flex-col" style={{ height: '520px' }}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
          {modeOptions.map((option) => {
            const active = selectedMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedMode(option.value)}
                disabled={isAnalyzing || isLoadingSession}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                  active
                    ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                {option.label}
              </button>
            );
          })}
          </div>
          <button
            type="button"
            onClick={() => void handleResetSession()}
            disabled={isAnalyzing || isLoadingSession}
            className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-[11px] font-semibold text-red-200 transition-all hover:border-red-400/40 hover:bg-red-400/15 disabled:opacity-50"
          >
            Limpar
          </button>
        </div>

        {/* ── Messages area ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">

          {isLoadingSession && (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-4 justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <span className="ml-1">Carregando sessão...</span>
            </div>
          )}

          {!hasMessages && !isAnalyzing && !isLoadingSession && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
              <div className="h-12 w-12 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-xl">
                🌿
              </div>
              <p className="text-sm text-center max-w-[260px] leading-5">
                Pergunte uma curiosidade, faça uma leitura básica, entre no modo técnico ou chame o especialista em pragas. O histórico fica salvo por planta.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isAssistant = message.role === 'ASSISTANT';
            const metadata = isAssistant ? parseMetadata(message) : null;
            const sourceInfluence = metadata ? parseSourceInfluence(metadata) : [];
            const decisionSupport = metadata?.apoioDecisao;
            return (
              <div key={message.id} className={`flex gap-2 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                {isAssistant && (
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-emerald-400/15 border border-emerald-400/20 flex items-center justify-center text-[11px] font-bold text-emerald-300 mt-0.5">
                    P
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                    isAssistant
                      ? 'rounded-tl-sm bg-slate-800/80 border border-white/10 text-slate-100'
                      : 'rounded-tr-sm bg-emerald-500 text-[#080B14]'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  {isAssistant && metadata && (
                    <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                      <div className="flex flex-wrap gap-1.5">
                        {metadata.modoUsado && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                            modo {formatModeLabel(metadata.modoUsado)}
                          </span>
                        )}
                        {typeof metadata.groundingLocalForte === 'boolean' && (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${metadata.groundingLocalForte ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
                            {metadata.groundingLocalForte ? 'grounding forte' : 'grounding parcial'}
                          </span>
                        )}
                        {metadata.bloqueadaPorEvidencia && (
                          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                            travada por evidência
                          </span>
                        )}
                        {metadata.usouCodex && (
                          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                            Codex {metadata.estagioCodex ? formatModeLabel(metadata.estagioCodex) : 'ativo'}
                          </span>
                        )}
                        {metadata.usouEspecialistaPraga && (
                          <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[10px] font-medium text-rose-200">
                            especialista praga
                          </span>
                        )}
                        {!!metadata.fontesRecuperadas?.length && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                            {metadata.fontesRecuperadas.length} fonte{metadata.fontesRecuperadas.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {!!sourceInfluence.length && (
                          <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
                            top ref {sourceInfluence[0].influencePct}%
                          </span>
                        )}
                        {decisionSupport?.dominantModule && (
                          <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200">
                            módulo {formatModuleLabel(decisionSupport.dominantModule)}
                          </span>
                        )}
                        {decisionSupport?.riskLevel && (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${riskToneClass(decisionSupport.riskLevel)}`}>
                            risco {formatSupportLevel(decisionSupport.riskLevel)}
                          </span>
                        )}
                        {decisionSupport?.confidenceLevel && (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${confidenceToneClass(decisionSupport.confidenceLevel)}`}>
                            confiança {formatSupportLevel(decisionSupport.confidenceLevel)}
                          </span>
                        )}
                      </div>

                      {!!(metadata.fontesRecuperadas?.length || decisionSupport || metadata.queryRecuperacao || metadata.lacunasCriticas?.length || metadata.dadosCriticosFaltantes?.length || metadata.hipotesesConsideradas?.length) && (
                        <details className="rounded-xl bg-[#0b1020]/70 px-2.5 py-2 text-[11px] text-slate-300">
                          <summary className="cursor-pointer list-none font-medium text-slate-400 marker:hidden">
                            Ver grounding local
                          </summary>
                          <div className="mt-2 space-y-2">
                            {(metadata.rotaTema || metadata.idiomasPreferidos?.length || metadata.bibleObrigatoria) && (
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Roteamento</div>
                                <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-400">
                                  {metadata.rotaTema && <div><span className="text-slate-500">Tema:</span> {metadata.rotaTema}</div>}
                                  {!!metadata.idiomasPreferidos?.length && <div><span className="text-slate-500">Idiomas:</span> {metadata.idiomasPreferidos.join(', ')}</div>}
                                  {typeof metadata.bibleObrigatoria === 'boolean' && <div><span className="text-slate-500">The-bible obrigatório:</span> {metadata.bibleObrigatoria ? 'sim' : 'não'}</div>}
                                </div>
                              </div>
                            )}
                            {metadata.relacoesCruzadas && (
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Relações cruzadas</div>
                                <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] leading-4 text-slate-400">
                                  <div><span className="text-slate-500">Fundamento:</span> {metadata.relacoesCruzadas.foundationSummary}</div>
                                  <div><span className="text-slate-500">Refino:</span> {metadata.relacoesCruzadas.refinementSummary}</div>
                                  <div><span className="text-slate-500">Convergência:</span> {metadata.relacoesCruzadas.convergenceSummary}</div>
                                  <div><span className="text-slate-500">Divergência:</span> {metadata.relacoesCruzadas.divergenceSummary}</div>
                                  <div><span className="text-slate-500">Idioma/escopo:</span> {metadata.relacoesCruzadas.languageSummary}</div>
                                  <div><span className="text-slate-500">Ação prática:</span> {metadata.relacoesCruzadas.practicalActionHint}</div>
                                  {!!metadata.relacoesCruzadas.baseSources?.length && <div><span className="text-slate-500">Base:</span> {metadata.relacoesCruzadas.baseSources.join(' · ')}</div>}
                                  {!!metadata.relacoesCruzadas.refinementSources?.length && <div><span className="text-slate-500">Refino:</span> {metadata.relacoesCruzadas.refinementSources.join(' · ')}</div>}
                                </div>
                              </div>
                            )}
                            {decisionSupport && (
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Mapa mental do caso</div>
                                <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[10px] leading-4 text-slate-300">
                                  {decisionSupport.dominantReason && (
                                    <div>
                                      <span className="text-slate-500">Leitura dominante:</span> {decisionSupport.dominantReason}
                                    </div>
                                  )}
                                  {!!decisionSupport.secondaryModules?.length && (
                                    <div>
                                      <span className="text-slate-500">Módulos cruzados:</span>{' '}
                                      {decisionSupport.secondaryModules.map((moduleKey) => formatModuleLabel(moduleKey)).join(' · ')}
                                    </div>
                                  )}
                                  {decisionSupport.causeEffectChain && (
                                    <div className="grid gap-1 md:grid-cols-3">
                                      <div className="rounded-md border border-white/10 bg-[#0b1220] px-2 py-1.5">
                                        <div className="mb-0.5 text-[9px] uppercase tracking-wide text-slate-500">Ação</div>
                                        <div>{decisionSupport.causeEffectChain.cultivatorAction}</div>
                                      </div>
                                      <div className="rounded-md border border-white/10 bg-[#0b1220] px-2 py-1.5">
                                        <div className="mb-0.5 text-[9px] uppercase tracking-wide text-slate-500">Planta</div>
                                        <div>{decisionSupport.causeEffectChain.plantEffect}</div>
                                      </div>
                                      <div className="rounded-md border border-white/10 bg-[#0b1220] px-2 py-1.5">
                                        <div className="mb-0.5 text-[9px] uppercase tracking-wide text-slate-500">Lote</div>
                                        <div>{decisionSupport.causeEffectChain.lotEffect}</div>
                                      </div>
                                    </div>
                                  )}
                                  {!!decisionSupport.tradeOffs?.length && (
                                    <div>
                                      <div className="mb-1 text-[9px] uppercase tracking-wide text-slate-500">Trade-offs</div>
                                      <ul className="list-disc space-y-0.5 pl-4 text-slate-400">
                                        {decisionSupport.tradeOffs.slice(0, 4).map((item) => (
                                          <li key={item}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {!!decisionSupport.businessWarnings?.length && (
                                    <div>
                                      <div className="mb-1 text-[9px] uppercase tracking-wide text-amber-300/80">Alertas do app</div>
                                      <ul className="list-disc space-y-0.5 pl-4 text-amber-200/90">
                                        {decisionSupport.businessWarnings.slice(0, 4).map((item) => (
                                          <li key={item}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {!!decisionSupport.businessRecommendations?.length && (
                                    <div>
                                      <div className="mb-1 text-[9px] uppercase tracking-wide text-emerald-300/80">Próxima camada</div>
                                      <ul className="list-disc space-y-0.5 pl-4 text-emerald-200/90">
                                        {decisionSupport.businessRecommendations.slice(0, 4).map((item) => (
                                          <li key={item}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {!!decisionSupport.telemetryFocus?.length && (
                                    <div>
                                      <div className="mb-1 text-[9px] uppercase tracking-wide text-cyan-300/80">Foco de telemetria</div>
                                      <ul className="list-disc space-y-0.5 pl-4 text-cyan-200/90">
                                        {decisionSupport.telemetryFocus.slice(0, 4).map((item) => (
                                          <li key={item}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {decisionSupport.appRuleSummary && (
                                    <div>
                                      <span className="text-slate-500">Regra do app:</span> {decisionSupport.appRuleSummary}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div>
                              <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Fontes</div>
                              <div className="space-y-1.5">
                                {(() => {
                                  const fallbackSources: SourceInfluenceItem[] = (metadata.fontesRecuperadas ?? []).map((source) => ({
                                    source,
                                    layer: null,
                                    score: 0,
                                    influencePct: 0,
                                    detail: null,
                                  }));
                                  const renderedSources = sourceInfluence.length ? sourceInfluence : fallbackSources;

                                  return renderedSources.map((item) => (
                                    <div key={item.source} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-300">
                                        <span className="truncate">{item.detail?.sourceName ?? item.source}</span>
                                        <span className="shrink-0 text-slate-400">
                                          {item.influencePct ? `${item.influencePct}%` : '--'}
                                          {item.layer ? ` · ${item.layer}` : ''}
                                        </span>
                                      </div>
                                      {item.detail && (
                                        <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-slate-500">
                                          <span>{item.detail.relativePath}</span>
                                          <span>· {item.detail.language}</span>
                                          <span>· {item.detail.parentTopic}</span>
                                        </div>
                                      )}
                                      {item.influencePct > 0 && (
                                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                                          <div
                                            className="h-full rounded-full bg-emerald-400/80"
                                            style={{ width: `${Math.min(item.influencePct, 100)}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                            {metadata.queryRecuperacao && (
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Consulta</div>
                                <div className="line-clamp-3 text-[10px] leading-4 text-slate-400">{metadata.queryRecuperacao}</div>
                              </div>
                            )}
                            {!!metadata.lacunasCriticas?.length && (
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Lacunas</div>
                                <ul className="list-disc space-y-0.5 pl-4 text-[10px] leading-4 text-slate-400">
                                  {metadata.lacunasCriticas.slice(0, 4).map((gap) => (
                                    <li key={gap}>{gap}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {!!metadata.dadosCriticosFaltantes?.length && (
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Dados impeditivos</div>
                                <ul className="list-disc space-y-0.5 pl-4 text-[10px] leading-4 text-amber-300/90">
                                  {metadata.dadosCriticosFaltantes.slice(0, 4).map((gap) => (
                                    <li key={gap}>{gap}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {!!metadata.hipotesesConsideradas?.length && (
                              <div>
                                <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Hipóteses</div>
                                <ul className="list-disc space-y-0.5 pl-4 text-[10px] leading-4 text-slate-400">
                                  {metadata.hipotesesConsideradas.slice(0, 4).map((hypothesis) => (
                                    <li key={hypothesis}>{hypothesis}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                  <div className={`mt-1 text-[10px] ${isAssistant ? 'text-slate-500' : 'text-emerald-900/70'}`}>
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}

          {isAnalyzing && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-emerald-400/15 border border-emerald-400/20 flex items-center justify-center text-[11px] font-bold text-emerald-300 mt-0.5">
                P
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-emerald-950/70 border border-emerald-400/15 px-4 py-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* ── Error bar ── */}
        {error && (
          <p className="text-xs text-red-400 px-1 pb-1">{error}</p>
        )}

        {/* ── Input area ── */}
        <div className="mt-2 border-t border-white/10 pt-3">
          <div className="flex gap-2 items-end">
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={`${inputPlaceholder} (Ctrl+Enter para enviar)`}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-[#080B14] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 placeholder:text-slate-600"
              disabled={isAnalyzing || isLoadingSession}
            />
            <button
              type="button"
              onClick={() => void handleSubmit()}
              className="flex-shrink-0 self-end rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#080B14] hover:brightness-110 disabled:opacity-50 transition-all"
              disabled={isAnalyzing || isLoadingSession || !description.trim()}
            >
              {isAnalyzing ? '...' : '↑'}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-600">
            Ctrl+Enter envia · modo {selectedMode.toLowerCase().replaceAll('_', ' ')} · histórico salvo por planta{session?.summary ? ' · resumo disponível' : ''}
          </p>
        </div>
      </div>
    </PokedexModal>
  );
}
