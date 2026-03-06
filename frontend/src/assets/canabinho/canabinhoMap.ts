import type { PlantType } from '../../types/pokedex';

import germinacaoStealth from '../stages/1 -Germinação/germinacao-stealth.png';
import germinacaoReveal from '../stages/1 -Germinação/germinacao-reveal.png';
import germinacaoZombie from '../stages/1 -Germinação/germinacao-zombie.png';

import vegInicialStealth from '../stages/2 -Vegetativo inicial/vegetativo-inicial-stealth.png';
import vegInicialReveal from '../stages/2 -Vegetativo inicial/vegetativo-inicial-reveal.png';
import vegInicialZombie from '../stages/2 -Vegetativo inicial/veg-inicial-zombie.png';

import vegMedioStealth from '../stages/2.1 - Vegetativo Medio/veg-med-stealth.png';
import vegMedioReveal from '../stages/2.1 - Vegetativo Medio/veg-med-reveal.png';
import vegMedioZombie from '../stages/2.1 - Vegetativo Medio/veg-med-zombie.png';

import vegAvancadoStealth from '../stages/2.2 - Vegetativo Avançado/veg-avan-stealth.png';
import vegAvancadoReveal from '../stages/2.2 - Vegetativo Avançado/veg-avan-reveal.png';
import vegAvancadoZombie from '../stages/2.2 - Vegetativo Avançado/veg-avan-zombie.png';
import vegAvancadoZombieV2 from '../stages/2.2 - Vegetativo Avançado/veg-avan-zombie-v2.png';

import floraInicialStealth from '../stages/3 - Flora inicial/flora-inicial-stealth.png';
import floraInicialReveal from '../stages/3 - Flora inicial/flora-inicial-reveal.png';
import floraInicialZombie from '../stages/3 - Flora inicial/flora-inicial-zombie.png';

import floraMediaStealth from '../stages/3.1 - Flora Media/flora-med-stealth.png';
import floraMediaReveal from '../stages/3.1 - Flora Media/flora-med-reveal.png';
import floraMediaZombieMed from '../stages/3.1 - Flora Media/flora-med-zombie-med.png';
import floraMediaZombieHigh from '../stages/3.1 - Flora Media/flora-med-zombie-high.png';

import floraAvancadaStealth from '../stages/3.2 - Flora Avançada/flora-avan-stealth.png';
import floraAvancadaReveal from '../stages/3.2 - Flora Avançada/flora-avan-reveal.png';

import colheitaStealth from '../stages/4 - Colheita/colheita-stealth.png';

export type CanabinhoState = 'normal' | 'zombie';
export type CanabinhoFrame = 'stealth' | 'reveal';
export type CanabinhoBlendClass = 'mix-blend-screen' | 'mix-blend-normal' | 'mix-blend-multiply' | 'mix-blend-darken';

type StageAssetSet = {
  normal: {
    stealth: string;
    reveal: string;
  };
  zombie: string[];
};

const buildStage = (normal: { stealth: string; reveal?: string }, zombie: string[] = []): StageAssetSet => {
  const stealth = normal.stealth || germinacaoStealth;
  const reveal = normal.reveal || stealth;
  return {
    normal: { stealth, reveal },
    zombie,
  };
};

export const CANABINHO_ASSETS: Record<PlantType, StageAssetSet> = {
  GERMINACAO: buildStage(
    { stealth: germinacaoStealth, reveal: germinacaoReveal },
    [germinacaoZombie]
  ),
  VEGETATIVO_INICIAL: buildStage(
    { stealth: vegInicialStealth, reveal: vegInicialReveal },
    [vegInicialZombie]
  ),
  VEGETATIVO_MEDIO: buildStage(
    { stealth: vegMedioStealth, reveal: vegMedioReveal },
    [vegMedioZombie]
  ),
  VEGETATIVO_AVANCADO: buildStage(
    { stealth: vegAvancadoStealth, reveal: vegAvancadoReveal },
    [vegAvancadoZombie, vegAvancadoZombieV2]
  ),
  FLORACAO_INICIAL: buildStage(
    { stealth: floraInicialStealth, reveal: floraInicialReveal },
    [floraInicialZombie]
  ),
  FLORACAO_MEDIA: buildStage(
    { stealth: floraMediaStealth, reveal: floraMediaReveal },
    [floraMediaZombieMed, floraMediaZombieHigh]
  ),
  FLORACAO_AVANCADA: buildStage(
    { stealth: floraAvancadaStealth, reveal: floraAvancadaReveal },
    []
  ),
  FINALIZACAO: buildStage(
    { stealth: colheitaStealth, reveal: colheitaStealth },
    []
  ),
};

const pickZombieVariantByFrame = (
  variants: string[],
  frame: CanabinhoFrame,
  plantId?: number
): string | null => {
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0];

  const seed =
    plantId === undefined || plantId === null || !Number.isFinite(plantId)
      ? 0
      : Math.abs(Math.trunc(plantId));

  const baseIndex = seed % variants.length;
  const nextIndex = (baseIndex + 1) % variants.length;

  return frame === 'reveal' ? variants[nextIndex] : variants[baseIndex];
};

export function getCanabinhoSrc({
  stage,
  state,
  frame,
  plantId,
}: {
  stage: PlantType;
  state: CanabinhoState;
  frame: CanabinhoFrame;
  plantId?: number;
}): string {
  const stageAssets = CANABINHO_ASSETS[stage] ?? CANABINHO_ASSETS.GERMINACAO;
  const stealth = stageAssets.normal.stealth || CANABINHO_ASSETS.GERMINACAO.normal.stealth;
  const reveal = stageAssets.normal.reveal || stealth;

  if (state === 'zombie') {
    const zombie = pickZombieVariantByFrame(stageAssets.zombie, frame, plantId);
    return zombie || reveal || stealth || CANABINHO_ASSETS.GERMINACAO.normal.stealth;
  }

  const normalFrame = frame === 'reveal' ? reveal : stealth;
  return normalFrame || reveal || stealth || CANABINHO_ASSETS.GERMINACAO.normal.stealth;
}

export function getCanabinhoBlendClass({
  stage,
  state,
  frame,
}: {
  stage: PlantType;
  state: CanabinhoState;
  frame: CanabinhoFrame;
}): CanabinhoBlendClass {
  return 'mix-blend-normal';
}
