import type { Aditivo } from '../../types';

import logoB52 from './Advanced-Nutrients-B-52-1L.png';
import logoBigBud from './Advanced-Nutrients-Big-Bud-Liquid-1L.png';
import logoBudCandy from './Advanced-Nutrients-Bud-Candy-1L.png';
import logoBudIgnitor from './Advanced-Nutrients-Bud-Ignitor-1L.png';
import logoFlawlessFinish from './Advanced-Nutrients-Flawless-Finish-1L.png';
import logoOverdrive from './Advanced-Nutrients-Overdrive-1L.png';
import logoSensiBloom from './Advanced-Nutrients-Sensi-Bloom-Part-A-B-1L-279x300.png';
import logoSensiGrow from './Advanced-Nutrients-Sensi-Grow-Part-A-B-1L-279x300.png';
import logoConnoisseurGrow from './connoisseur-grow.png';
import logoConnoisseurBloom from './connoisseur-bloom.png';
import logoVaso from './vaso-logo.png';
import logoRevive from './Revive_1L_Bottle_300dpi_2017.png';
import logoRhinoSkin from './Rhino_Skin_1L_Bottle_300dpi_2017.png';
import logoCalMag from './Sensi_Cal-Mag_Xtra_1L_Bottle_300dpi_2017.png';
import logoSpinosad from './spinosad.png';
import logoTastyTerpenes from './Tasty-Terpenes_1L_Bottle_300dpi_2024.png';

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasAny(source: string, terms: string[]): boolean {
  return terms.some((term) => source.includes(term));
}

export function getInventoryLogoSrc(aditivo: Pick<Aditivo, 'nome' | 'marca' | 'descricao' | 'tipo'>): string | null {
  if (String(aditivo.tipo || '').toUpperCase() === 'VASO') {
    return logoVaso;
  }

  const combined = normalize(`${aditivo.nome} ${aditivo.marca} ${aditivo.descricao}`);

  if (hasAny(combined, ['connoisseur bloom a', 'connoisseur bloom b', 'connoisseur bloom part a', 'connoisseur bloom part b'])) {
    return logoConnoisseurBloom;
  }
  if (hasAny(combined, ['connoisseur grow a', 'connoisseur grow b', 'connoisseur grow part a', 'connoisseur grow part b'])) {
    return logoConnoisseurGrow;
  }

  if (hasAny(combined, ['b 52', 'b52'])) return logoB52;
  if (hasAny(combined, ['big bud'])) return logoBigBud;
  if (hasAny(combined, ['bud candy'])) return logoBudCandy;
  if (hasAny(combined, ['bud ignitor'])) return logoBudIgnitor;
  if (hasAny(combined, ['overdrive'])) return logoOverdrive;
  if (hasAny(combined, ['flawless finish', 'flush final'])) return logoFlawlessFinish;
  if (hasAny(combined, ['rhino skin'])) return logoRhinoSkin;
  if (hasAny(combined, ['spinosad', 'spino sad'])) return logoSpinosad;
  if (hasAny(combined, ['sensi cal mag', 'cal mag'])) return logoCalMag;
  if (hasAny(combined, ['tasty terpenes'])) return logoTastyTerpenes;
  if (hasAny(combined, ['revive'])) return logoRevive;

  if (hasAny(combined, ['connoisseur bloom', 'connoisseur ph perfect', 'ph perfect bloom', 'bloom part a', 'bloom part b'])) {
    return logoConnoisseurBloom;
  }
  if (hasAny(combined, ['sensi bloom part a', 'sensi bloom part b', 'flower coco'])) return logoSensiBloom;

  if (hasAny(combined, ['connoisseur grow'])) return logoConnoisseurGrow;
  if (hasAny(combined, ['sensi grow part a', 'sensi grow part b', 'veg coco', 'veg coco grow'])) {
    return logoSensiGrow;
  }

  return null;
}
