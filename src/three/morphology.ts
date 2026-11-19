import { BufferAttribute, type BufferGeometry, type Skeleton } from 'three';

/**
 * 2.2.0 (expérimentale) — morphologies individuelles des coachs (Youssef 19/11, « REFONTE QUALITATIVE 3D AAA »,
 * § 3 et 4 : « ne pas appliquer une transformation générique commune », « ne modifier une proportion que lorsqu'une
 * incohérence est constatée et justifiée »).
 *
 * Chaque correction est un champ de déformation doux, défini dans l'espace de liaison du modèle (mètres, pieds à 0,
 * +Y vers le haut, +Z vers l'avant), mesuré et justifié coach par coach dans docs/v220/RAPPORT_V220.md (fiches
 * morphologiques, scripts/v220/anatomie.py) :
 * - une « bande » élargit ou affine le tronc autour de son axe dans une tranche de hauteur (gaussienne en hauteur,
 *   rien au-dessus ni au-dessous), séparément en largeur (X) et en profondeur (Z) ;
 * - les bras, avant-bras et mains ne bougent jamais (poids de peau sur ces os) et un sommet loin de l'axe du tronc
 *   n'est pas touché (décroissance radiale) : seule la silhouette du tronc change.
 * Le même champ, fonction de la seule position au repos, est appliqué au corps ET à chaque pièce de tenue : un
 * vêtement suit exactement le corps qu'il habille (« corriger prioritairement le vêtement », jamais de traversée
 * nouvelle). Les GLB ne sont pas modifiés : la forme d'origine reste chargée et les masques de peau sous les tenues
 * (hideBody) lisent toujours les positions d'origine (`cssOriginalMaskPositions`).
 * Coût : un passage sur les sommets au chargement (moins de 2 ms pour 40 000 points), rien par image.
 */
export interface Band {
  /** hauteur du centre de la bande (m, espace de liaison) */
  y: number;
  /** demi-hauteur gaussienne (m) */
  sigma: number;
  /** élargissement relatif en largeur (0,06 = +6 %) et en profondeur */
  sx: number;
  sz: number;
  /** centre du tronc en profondeur à cette hauteur (m) */
  z0: number;
  /** portée radiale : pleine jusqu'à r0, nulle au-delà de r1 (m) */
  r0: number;
  r1: number;
}

export interface Morphology {
  /** ce que corrige le champ et pourquoi (repris dans le rapport) */
  note: string;
  bands: Band[];
}

/**
 * Corrections retenues. Mesures avant (scripts/v220/anatomie.py, tour = enveloppe du tronc) :
 * - Amara 1,73 m : taille 63,3 cm, hanches 94,3 cm, rapport 0,67 ; frappeuse puissante (droite chargée) ;
 * - Inaya 1,74 m : taille 61,1 cm (20,2 cm de large), hanches 96,4 cm, rapport 0,63 ; kickeuse explosive, 65 kg ;
 * - Kanya 1,70 m : taille 59,4 cm, hanches 93,5 cm, rapport 0,64 ; kru de muay-thaï, clinch ;
 * Kadir, Naël et Victor : proportions cohérentes (rapport taille/hanches 0,84, 0,86 et 0,86), tronc non modifié.
 */
export const MORPHOLOGY_V220: Record<string, Morphology> = {
  'mma-amara': {
    note: 'taille un peu moins pincée (rapport taille/hanches 0,67 → 0,69), gainage de frappeuse',
    bands: [{ y: 1.13, sigma: 0.075, sx: 0.045, sz: 0.03, z0: 0, r0: 0.15, r1: 0.22 }],
  },
  inaya: {
    note: 'taille artificiellement étroite (20 cm de large pour 1,74 m) élargie : rapport 0,63 → 0,67',
    bands: [{ y: 1.17, sigma: 0.08, sx: 0.085, sz: 0.035, z0: 0, r0: 0.15, r1: 0.22 }],
  },
  kanya: {
    note: 'taille artificiellement étroite élargie, tronc de clinch : rapport 0,64 → 0,68',
    bands: [{ y: 1.13, sigma: 0.08, sx: 0.095, sz: 0.04, z0: 0, r0: 0.15, r1: 0.22 }],
  },
};

/** l'identifiant du coach dans une adresse de modèle ou de tenue (./coaches/<id>/...) */
export function morphologyFor(url: string): Morphology | undefined {
  const id = Object.keys(MORPHOLOGY_V220).find((k) => url.includes(`/${k}/`));
  return id ? MORPHOLOGY_V220[id] : undefined;
}

/** désactivable pour les comparatifs (Lab : ?morpho=0) */
const off = () => (globalThis as { __cssMorpho?: boolean }).__cssMorpho === false;

const LIMB = /(Arm|ForeArm|Hand|Thumb|Index|Middle|Ring|Pinky)/;

function weightAt(b: Band, x: number, y: number, z: number) {
  const dy = (y - b.y) / b.sigma;
  if (Math.abs(dy) > 3) return 0;
  const r = Math.hypot(x, (z - b.z0) * 1.3);
  const t = r <= b.r0 ? 1 : r >= b.r1 ? 0 : 1 - (r - b.r0) / (b.r1 - b.r0);
  const s = t * t * (3 - 2 * t);
  return Math.exp(-dy * dy) * s;
}

/** déplacement d'un point au repos (m) */
export function displace(m: Morphology, x: number, y: number, z: number, out: [number, number, number]) {
  let dx = 0, dz = 0;
  for (const b of m.bands) {
    const w = weightAt(b, x, y, z);
    if (!w) continue;
    dx += x * b.sx * w;
    dz += (z - b.z0) * b.sz * w;
  }
  out[0] = dx;
  out[1] = 0;
  out[2] = dz;
  return out;
}

/** part du point portée par les os des bras et des mains (0..1), d'après ses poids de peau */
function limbShare(geometry: BufferGeometry, skeleton: Skeleton | undefined, i: number) {
  const si = geometry.getAttribute('skinIndex');
  const sw = geometry.getAttribute('skinWeight');
  if (!si || !sw || !skeleton) return 0;
  let s = 0;
  for (let k = 0; k < 4; k++) {
    const bone = skeleton.bones[si.getComponent(i, k)];
    if (bone && LIMB.test(bone.name)) s += sw.getComponent(i, k);
  }
  return Math.min(1, s);
}

/**
 * Applique la morphologie à une géométrie (corps ou pièce de tenue) déjà propre à cette copie du coach. Garde les
 * positions d'origine pour les masques de peau. Les normales suivent le champ (transposée inverse de sa dérivée,
 * calculée par différences finies), sans recalcul global qui casserait les coutures UV.
 * Renvoie le nombre de points déplacés.
 */
export function applyMorphology(geometry: BufferGeometry, m: Morphology | undefined, skeleton?: Skeleton): number {
  if (!m || off()) return 0;
  const pos = geometry.getAttribute('position') as BufferAttribute;
  const nor = geometry.getAttribute('normal') as BufferAttribute | undefined;
  if (!pos) return 0;
  if (!geometry.userData.cssOriginalMaskPositions) {
    const o = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) o.set([pos.getX(i), pos.getY(i), pos.getZ(i)], i * 3);
    geometry.userData.cssOriginalMaskPositions = o;
  }
  const d: [number, number, number] = [0, 0, 0];
  const e = 1e-3;
  let moved = 0;
  const J = new Float64Array(9);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    displace(m, x, y, z, d);
    if (d[0] === 0 && d[2] === 0) continue;
    const keep = 1 - limbShare(geometry, skeleton, i);
    if (keep <= 0) continue;
    const dx = d[0] * keep, dz = d[2] * keep;
    if (Math.abs(dx) + Math.abs(dz) < 1e-7) continue;
    if (nor) {
      // dérivée du champ p → p + D(p), colonnes ∂/∂x, ∂/∂y, ∂/∂z
      for (let c = 0; c < 3; c++) {
        const px = x + (c === 0 ? e : 0), py = y + (c === 1 ? e : 0), pz = z + (c === 2 ? e : 0);
        displace(m, px, py, pz, d);
        const ax = d[0] * keep, az = d[2] * keep;
        displace(m, x, y, z, d);
        J[c] = (c === 0 ? 1 : 0) + (ax - d[0] * keep) / e;
        J[3 + c] = c === 1 ? 1 : 0;
        J[6 + c] = (c === 2 ? 1 : 0) + (az - d[2] * keep) / e;
      }
      // n' = J^-T n (cofacteurs de J), puis normalisée
      const [a, b, c, dd, ee, f, g, h, k] = J;
      const C = [ee * k - f * h, -(dd * k - f * g), dd * h - ee * g, -(b * k - c * h), a * k - c * g, -(a * h - b * g), b * f - c * ee, -(a * f - c * dd), a * ee - b * dd];
      const nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i);
      let qx = C[0] * nx + C[1] * ny + C[2] * nz;
      let qy = C[3] * nx + C[4] * ny + C[5] * nz;
      let qz = C[6] * nx + C[7] * ny + C[8] * nz;
      const l = Math.hypot(qx, qy, qz) || 1;
      qx /= l; qy /= l; qz /= l;
      nor.setXYZ(i, qx, qy, qz);
    }
    pos.setXYZ(i, x + dx, y, z + dz);
    moved++;
  }
  if (moved) {
    pos.needsUpdate = true;
    if (nor) nor.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  geometry.userData.cssMorphoV220 = moved;
  return moved;
}
