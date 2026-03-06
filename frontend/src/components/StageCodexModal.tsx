import { useMemo, useState } from 'react';
import type { Plant, PlantType } from '../types/pokedex';
import type { CodexEstagio } from '../types';
import { PokedexModal } from './ui/PokedexModal';
import { getCanabinhoSrc } from '../assets/canabinho/canabinhoMap';

interface StageCodexModalProps {
  open: boolean;
  onClose: () => void;
  plant: Plant | null;
  entry: CodexEstagio | null;
  reason?: 'create' | 'level-up' | 'codex';
}

function BulletList({ items, tone, icon }: { items: string[]; tone: 'emerald' | 'rose' | 'amber' | 'sky'; icon?: string }) {
  if (!items.length) return null;

  const toneClass = {
    emerald: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
    rose: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
    amber: 'border-amber-300/20 bg-amber-300/8 text-amber-100',
    sky: 'border-sky-300/20 bg-sky-300/8 text-sky-100',
  }[tone];

  const iconSvg = {
    emerald: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
    rose: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
    amber: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    sky: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>,
  }[tone];

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className={`rounded-lg border px-3 py-2 text-xs leading-5 ${toneClass} transition-all duration-200 hover:bg-opacity-20`}>
          <div className="flex items-start gap-2">
            {iconSvg}
            <span>{item}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StageCodexModal({ open, onClose, plant, entry, reason = 'create' }: StageCodexModalProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    lore: true,
    strengths: true,
    weaknesses: true,
    care: true,
    curiosities: true,
    alerts: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const artSrc = useMemo(() => {
    if (!entry) return '';
    return getCanabinhoSrc({
      stage: entry.estagio as PlantType,
      state: 'normal',
      frame: 'stealth',
      plantId: plant?.id,
    });
  }, [entry, plant?.id]);

  if (!open || !entry || !plant) return null;

  const title = reason === 'codex'
    ? 'Compêndio de estágio'
    : reason === 'level-up'
      ? 'Novo estágio desbloqueado'
      : 'Personagem desbloqueado';
  const subtitle = reason === 'codex'
    ? `${plant.name} em leitura estratégica de ${entry.nomeExibicao}.`
    : reason === 'level-up'
      ? `${plant.name} alcançou ${entry.nomeExibicao}.`
      : `${plant.name} iniciou a jornada em ${entry.nomeExibicao}.`;

  return (
    <PokedexModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      widthClass="w-full max-w-[920px]"
    >
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] animate-in fade-in duration-300">
        <div className="rounded-2xl border border-[#6fbf86]/20 bg-gradient-to-b from-[#101a2b] to-[#0a1120] p-4 shadow-[0_0_20px_rgba(111,191,134,0.08)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="rounded-full border border-[#6fbf86]/25 bg-[#6fbf86]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b9f0c7]">
              {entry.nomeExibicao}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
              Lvl {entry.ordemDesbloqueio}
            </span>
          </div>

          <div className="relative flex h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#172232] to-[#0B1220]">
            <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="pointer-events-none absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
            <img src={artSrc} alt={entry.nomeExibicao} className="relative h-56 w-56 object-contain object-bottom drop-shadow-[0_16px_30px_rgba(0,0,0,0.55)]" draggable={false} />
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Descrição breve</div>
            <p className="mt-2 text-sm leading-6 text-slate-100">{entry.descricaoBreve}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#101726] to-[#0b1220] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-white">{entry.nomeExibicao}</h3>
                <p className="mt-1 text-sm text-[#a7e5b2]">{entry.subtitulo}</p>
              </div>
              <div className="rounded-xl border border-sky-300/20 bg-sky-300/8 px-3 py-2 text-right">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-100/70">Resistência</div>
                <div className="mt-1 text-sm font-semibold text-sky-100">{entry.resistencia || 'Em leitura'}</div>
              </div>
            </div>

            <div className="mt-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-transparent">
              <p className="text-sm leading-7 text-slate-200 font-serif">{entry.descricaoLore}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/70">Pontos fortes</div>
              </div>
              <BulletList items={entry.pontosFortes} tone="emerald" />
            </div>
            <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-rose-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-200/70">Pontos fracos</div>
              </div>
              <BulletList items={entry.pontosFracos} tone="rose" />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-amber-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-100/70">Cuidados essenciais</div>
              </div>
              <BulletList items={entry.cuidadosPrincipais} tone="amber" />
            </div>
            <div className="rounded-2xl border border-sky-300/15 bg-sky-300/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-sky-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-100/70">Curiosidades</div>
              </div>
              <BulletList items={entry.curiosidades} tone="sky" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101726] p-4">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Match simples de aditivos</div>
            </div>
            {entry.nenhumAditivoRecomendado || !entry.aditivosRecomendados.length ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
                {entry.mensagemAditivos}
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {entry.aditivosRecomendados.map((aditivo) => (
                  <div key={aditivo.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 transition-all duration-200 hover:bg-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{aditivo.nome}</div>
                        <div className="text-xs text-slate-400">{aditivo.marca}</div>
                      </div>
                      {typeof aditivo.dosePadraoEmML === 'number' && (
                        <div className="rounded-lg border border-[#6fbf86]/20 bg-[#6fbf86]/10 px-2 py-1 text-[11px] font-semibold text-[#b9f0c7]">
                          {aditivo.dosePadraoEmML} ml/L
                        </div>
                      )}
                    </div>
                    {aditivo.descricao && <p className="mt-2 text-xs leading-5 text-slate-300">{aditivo.descricao}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!!entry.alertas.length && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-amber-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/80">Atenções da fase</div>
              </div>
              <BulletList items={entry.alertas} tone="amber" />
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Contexto legal e responsabilidade</div>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-300">{entry.observacaoLegal}</p>
          </div>
        </div>
      </div>
    </PokedexModal>
  );
}
