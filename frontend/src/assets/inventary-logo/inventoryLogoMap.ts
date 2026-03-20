import type { Aditivo } from '../../types';

import b52 from './b52.png';
import bigBud from './big-bud.png';
import budCandy from './bud-candy.png';
import budIgnitor from './bud-ignitor.png';
import flawlessFinish from './flawless-finish.png';
import overdrive from './overdrive.png';
import sensiBloom from './sensi-bloom.png';
import sensiGrow from './sensi-grow.png';
import connoisseurGrow from './connoisseur-grow.png';
import connoisseurBloom from './connoisseur-bloom.png';
import vaso from './vaso.png';
import revive from './revive.png';
import rhinoSkin from './rhino-skin.png';
import sensiCalMag from './sensi-cal-mag.png';
import spinosad from './spinosad.png';
import tastyTerpenes from './tasty-terpenes.png';

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export function getInventoryLogoSrc(aditivo: Aditivo): string | null {
  if (String(aditivo.tipo || '').toUpperCase() === 'VASO') return vaso;

  const text = normalizeText(`${aditivo.nome} ${aditivo.marca} ${aditivo.descricao}`);

  if (includesAny(text, ['connoisseur bloom a', 'connoisseur bloom b', 'connoisseur bloom part a', 'connoisseur bloom part b'])) return connoisseurBloom;
  if (includesAny(text, ['connoisseur grow a', 'connoisseur grow b', 'connoisseur grow part a', 'connoisseur grow part b'])) return connoisseurGrow;
  if (includesAny(text, ['b 52', 'b52'])) return b52;
  if (includesAny(text, ['big bud'])) return bigBud;
  if (includesAny(text, ['bud candy'])) return budCandy;
  if (includesAny(text, ['bud ignitor'])) return budIgnitor;
  if (includesAny(text, ['overdrive'])) return overdrive;
  if (includesAny(text, ['flawless finish', 'flush final'])) return flawlessFinish;
  if (includesAny(text, ['rhino skin'])) return rhinoSkin;
  if (includesAny(text, ['spinosad', 'spino sad'])) return spinosad;
  if (includesAny(text, ['sensi cal mag', 'cal mag'])) return sensiCalMag;
  if (includesAny(text, ['tasty terpenes'])) return tastyTerpenes;
  if (includesAny(text, ['revive'])) return revive;
  if (includesAny(text, ['connoisseur bloom', 'connoisseur ph perfect', 'ph perfect bloom', 'bloom part a', 'bloom part b'])) return connoisseurBloom;
  if (includesAny(text, ['sensi bloom part a', 'sensi bloom part b', 'flower coco'])) return sensiBloom;
  if (includesAny(text, ['connoisseur grow'])) return connoisseurGrow;
  if (includesAny(text, ['sensi grow part a', 'sensi grow part b', 'veg coco'])) return sensiGrow;

  return null;
}
