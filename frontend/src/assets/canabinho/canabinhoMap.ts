import type { PlantType } from '../../types/pokedex';

import germinacaoStealth from './germinacao-stealth.png';
import germinacaoReveal from './germinacao-reveal.png';
import germinacaoZombie from './germinacao-zombie.png';

import vegetativoInicialStealth from './vegetativo-inicial-stealth.png';
import vegetativoInicialReveal from './vegetativo-inicial-reveal.png';
import vegetativoInicialZombie from './vegetativo-inicial-zombie.png';
import vegetativoInicialZombieV2 from './vegetativo-inicial-zombie-v2.png';

import vegetativoMedioStealth from './vegetativo-medio-stealth.png';
import vegetativoMedioReveal from './vegetativo-medio-reveal.png';
import vegetativoMedioZombie from './vegetativo-medio-zombie.png';

import vegetativoAvancadoStealth from './vegetativo-avancado-stealth.png';
import vegetativoAvancadoReveal from './vegetativo-avancado-reveal.png';
import vegetativoAvancadoZombie from './vegetativo-avancado-zombie.png';
import vegetativoAvancadoZombieV2 from './vegetativo-avancado-zombie-v2.png';

import floracaoInicialStealth from './floracao-inicial-stealth.png';
import floracaoInicialReveal from './floracao-inicial-reveal.png';
import floracaoInicialZombie from './floracao-inicial-zombie.png';

import floracaoMediaStealth from './floracao-media-stealth.png';
import floracaoMediaReveal from './floracao-media-reveal.png';
import floracaoMediaZombie from './floracao-media-zombie.png';
import floracaoMediaZombieV2 from './floracao-media-zombie-v2.png';

import floracaoAvancadaStealth from './floracao-avancada-stealth.png';
import floracaoAvancadaReveal from './floracao-avancada-reveal.png';

import finalizacaoStealth from './finalizacao-stealth.png';

type CanabinhoState = 'normal' | 'zombie';
type CanabinhoFrame = 'stealth' | 'reveal';

type StageConfig = {
  normal: {
    stealth: string;
    reveal: string;
  };
  zombie: string[];
};

type GetCanabinhoSrcArgs = {
  stage: PlantType;
  state: CanabinhoState;
  frame: CanabinhoFrame;
  plantId?: number | null;
};

type GetCanabinhoBlendClassArgs = {
  stage: PlantType;
  state: CanabinhoState;
  frame: CanabinhoFrame;
};

function buildStageConfig(
  normal: Partial<StageConfig['normal']>,
  zombie: string[] = [],
): StageConfig {
  const stealth = normal.stealth ?? germinacaoStealth;
  const reveal = normal.reveal ?? stealth;

  return {
    normal: { stealth, reveal },
    zombie,
  };
}

const stageMap: Record<PlantType, StageConfig> = {
  GERMINACAO: buildStageConfig(
    { stealth: germinacaoStealth, reveal: germinacaoReveal },
    [germinacaoZombie],
  ),
  VEGETATIVO_INICIAL: buildStageConfig(
    { stealth: vegetativoInicialStealth, reveal: vegetativoInicialReveal },
    [vegetativoInicialZombie, vegetativoInicialZombieV2],
  ),
  VEGETATIVO_MEDIO: buildStageConfig(
    { stealth: vegetativoMedioStealth, reveal: vegetativoMedioReveal },
    [vegetativoMedioZombie],
  ),
  VEGETATIVO_AVANCADO: buildStageConfig(
    { stealth: vegetativoAvancadoStealth, reveal: vegetativoAvancadoReveal },
    [vegetativoAvancadoZombie, vegetativoAvancadoZombieV2],
  ),
  FLORACAO_INICIAL: buildStageConfig(
    { stealth: floracaoInicialStealth, reveal: floracaoInicialReveal },
    [floracaoInicialZombie],
  ),
  FLORACAO_MEDIA: buildStageConfig(
    { stealth: floracaoMediaStealth, reveal: floracaoMediaReveal },
    [floracaoMediaZombie, floracaoMediaZombieV2],
  ),
  FLORACAO_AVANCADA: buildStageConfig(
    { stealth: floracaoAvancadaStealth, reveal: floracaoAvancadaReveal },
    [],
  ),
  FINALIZACAO: buildStageConfig(
    { stealth: finalizacaoStealth, reveal: finalizacaoStealth },
    [],
  ),
};

function pickZombieVariant(variants: string[], plantId?: number | null): string | null {
  if (variants.length === 0) return null;
  if (plantId == null || !Number.isFinite(plantId)) return variants[0];

  const index = Math.abs(Math.trunc(plantId)) % variants.length;
  return variants[index];
}

export function getCanabinhoSrc({ stage, state, frame, plantId }: GetCanabinhoSrcArgs): string {
  const config = stageMap[stage] ?? stageMap.GERMINACAO;
  const stealth = config.normal.stealth || stageMap.GERMINACAO.normal.stealth;
  const reveal = config.normal.reveal || stealth;

  if (state === 'zombie') {
    return pickZombieVariant(config.zombie, plantId)
      || reveal
      || stealth
      || stageMap.GERMINACAO.normal.stealth;
  }

  return (frame === 'reveal' ? reveal : stealth)
    || reveal
    || stealth
    || stageMap.GERMINACAO.normal.stealth;
}

export function getCanabinhoBlendClass(_: GetCanabinhoBlendClassArgs): string {
  return 'mix-blend-normal';
}
