import type { CoachAtmosphere } from '../../domain/coaches/atmosphere';
import { mixColor, stableHash } from '../../domain/coaches/atmosphere';

/**
 * Emblème de fond d'un coach (V4 « Ton coach ») : dessiné dans un canevas à partir de son ambiance (CoachAtmosphereResolver),
 * jamais une image importée. Rayures de tigresse, crinière de lionne, griffes de panthère, lune du loup, ailes de l'aigle,
 * ailes en piqué du faucon, monogramme par défaut ; yeux dans l'ombre, traits de vitesse et nom du coach en très grand,
 * à faible opacité. Le dessin est déterministe (graine = identifiant du coach).
 *
 * Repère : u (0 à gauche, 1 à droite) et v (0 en haut, 1 en bas) du panneau placé derrière le coach (AtmosphereScene) ; la
 * tête du coach se projette vers (0,5 ; 0,32), les épaules vers v = 0,42.
 */

export const EMBLEM_ASPECT = 768 / 1080;

type Ctx = CanvasRenderingContext2D;
type P = [number, number];

/** générateur pseudo-aléatoire à graine (mulberry32) */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const m = 1 - t;
  return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]];
};

/**
 * Un trait effilé le long d'une courbe de Bézier (rayure, griffe, rayon, plume) : largeur w au plus large, pointes fines.
 * `bias` déplace le point le plus large (0,5 : au milieu ; 0,25 : près du départ).
 */
function taper(ctx: Ctx, W: number, H: number, p0: P, p1: P, p2: P, p3: P, w: number, bias = 0.5) {
  const N = 28;
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = bez(p0, p1, p2, p3, Math.max(0, t - 0.01));
    const b = bez(p0, p1, p2, p3, Math.min(1, t + 0.01));
    const p = bez(p0, p1, p2, p3, t);
    let nx = -(b[1] - a[1]) * H;
    let ny = (b[0] - a[0]) * W;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    // profil : monte jusqu'à `bias`, redescend ensuite
    const s = t < bias ? Math.sin((t / bias) * (Math.PI / 2)) : Math.cos(((t - bias) / (1 - bias)) * (Math.PI / 2));
    const half = (w * W * Math.max(0, s)) / 2;
    left.push([p[0] * W + nx * half, p[1] * H + ny * half]);
    right.push([p[0] * W - nx * half, p[1] * H - ny * half]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (const q of left) ctx.lineTo(q[0], q[1]);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
}

/** un calque dessiné à part puis fondu par un masque (dégradé) avant d'être posé */
function layer(W: number, H: number, draw: (c: Ctx) => void, mask: (c: Ctx) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  draw(x);
  x.globalCompositeOperation = 'destination-in';
  mask(x);
  return c;
}

function eyes(ctx: Ctx, W: number, H: number, cx: number, cy: number, size: number, color: string, pupil: 'fente' | 'ronde', alpha: number) {
  for (const side of [-1, 1]) {
    const x = (cx + side * size * 0.95) * W;
    const y = cy * H;
    const r = size * W;
    ctx.save();
    ctx.translate(x, y);
    // regard farouche : coin intérieur plus bas
    ctx.rotate(side * -0.22);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = r * 1.6;
    const g = ctx.createRadialGradient(0, 0, r * 0.05, 0, 0, r);
    g.addColorStop(0, mixColor(color, '#FFFFFF', 0.55));
    g.addColorStop(0.55, color);
    g.addColorStop(1, mixColor(color, '#000000', 0.55));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(-r * 0.1, -r * 0.95, r, -r * 0.08);
    ctx.quadraticCurveTo(r * 0.1, r * 0.6, -r, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.beginPath();
    if (pupil === 'fente') ctx.ellipse(0, -r * 0.12, r * 0.09, r * 0.4, 0, 0, Math.PI * 2);
    else ctx.arc(0, -r * 0.12, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.3, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** fondu horizontal : fort sur les bords, nul au centre (le coach reste net devant) */
function sidesMask(c: Ctx, W: number, H: number, inner = 0.18) {
  const g = c.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.5 - inner, 'rgba(0,0,0,0.75)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.05)');
  g.addColorStop(0.5 + inner, 'rgba(0,0,0,0.75)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

function tigerStripes(W: number, H: number, a: CoachAtmosphere, rnd: () => number) {
  const p = a.palette;
  return layer(
    W,
    H,
    (c) => {
      for (const side of [-1, 1]) {
        const edge = side < 0 ? -0.04 : 1.04;
        for (let i = 0; i < 9; i++) {
          const v = 0.06 + i * 0.105 + (rnd() - 0.5) * 0.04;
          const len = 0.22 + rnd() * 0.16;
          const end = side < 0 ? edge + len : edge - len;
          const sag = (rnd() - 0.3) * 0.08;
          c.fillStyle = rgba(i % 3 === 1 ? p.accent : p.primary, 0.85);
          taper(c, W, H, [edge, v], [edge + side * -len * 0.35, v - 0.04 + sag], [end + side * len * 0.2, v + 0.03 + sag], [end, v + 0.05 + sag], 0.045 + rnd() * 0.02, 0.22);
          // une rayure sur deux se dédouble, comme sur le pelage
          if (rnd() > 0.5) taper(c, W, H, [edge, v + 0.035], [edge - side * len * 0.2, v + 0.03], [end + side * len * 0.45, v + 0.06], [end + side * len * 0.3, v + 0.085], 0.022, 0.2);
        }
      }
    },
    (c) => sidesMask(c, W, H, 0.2),
  );
}

function mane(W: number, H: number, a: CoachAtmosphere, rnd: () => number) {
  const p = a.palette;
  const C: P = [0.5, 0.31];
  return layer(
    W,
    H,
    (c) => {
      const n = 24;
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + ((i / n) * 2 - 1) * Math.PI * 0.82 + (rnd() - 0.5) * 0.08;
        const r0 = 0.1 + rnd() * 0.04;
        const r1 = 0.42 + rnd() * 0.2;
        const curl = (rnd() > 0.5 ? 1 : -1) * (0.2 + rnd() * 0.25);
        const pt = (r: number, d: number): P => [C[0] + (Math.cos(ang + d) * r) / EMBLEM_ASPECT / 1.0, C[1] + Math.sin(ang + d) * r * 0.72];
        c.fillStyle = rgba(i % 4 === 0 ? p.accent : p.primary, 0.8);
        taper(c, W, H, pt(r0, 0), pt(r0 + (r1 - r0) * 0.35, curl * 0.3), pt(r0 + (r1 - r0) * 0.75, -curl * 0.25), pt(r1, curl * 0.1), 0.05 + rnd() * 0.035, 0.3);
      }
    },
    (c) => {
      const g = c.createRadialGradient(C[0] * W, C[1] * H, W * 0.1, C[0] * W, C[1] * H, W * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.2, 'rgba(0,0,0,0.9)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.6)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      sidesMaskSoft(c, W, H);
    },
  );
}

/** adoucit le centre bas (là où se tient le corps) sans toucher au haut */
function sidesMaskSoft(c: Ctx, W: number, H: number) {
  const g = c.createRadialGradient(0.5 * W, 0.66 * H, W * 0.05, 0.5 * W, 0.66 * H, W * 0.4);
  g.addColorStop(0, 'rgba(0,0,0,0.25)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

function claws(W: number, H: number, a: CoachAtmosphere, rnd: () => number) {
  const p = a.palette;
  return layer(
    W,
    H,
    (c) => {
      c.shadowColor = p.accent;
      c.shadowBlur = W * 0.02;
      for (let i = 0; i < 4; i++) {
        const o = i * 0.085;
        c.fillStyle = rgba(i === 1 ? p.accent : p.primary, 0.9);
        const s: P = [0.98 - o * 0.3, 0.06 + o];
        const e: P = [0.08 - o * 0.2, 0.62 + o * 0.9];
        taper(c, W, H, s, [s[0] - 0.22, s[1] + 0.12 + rnd() * 0.02], [e[0] + 0.25, e[1] - 0.2], e, 0.05 - i * 0.004, 0.42);
      }
    },
    (c) => sidesMask(c, W, H, 0.24),
  );
}

function moon(W: number, H: number, a: CoachAtmosphere, rnd: () => number) {
  const p = a.palette;
  const C: P = [0.5, 0.28];
  const R = 0.36 * W;
  return layer(
    W,
    H,
    (c) => {
      const halo = c.createRadialGradient(C[0] * W, C[1] * H, R * 0.8, C[0] * W, C[1] * H, R * 2.1);
      halo.addColorStop(0, rgba(p.accent, 0.35));
      halo.addColorStop(1, rgba(p.accent, 0));
      c.fillStyle = halo;
      c.fillRect(0, 0, W, H);
      const g = c.createRadialGradient(C[0] * W - R * 0.25, C[1] * H - R * 0.3, R * 0.1, C[0] * W, C[1] * H, R);
      g.addColorStop(0, rgba('#FFFFFF', 0.95));
      g.addColorStop(0.6, rgba(p.accent, 0.85));
      g.addColorStop(1, rgba(p.primary, 0.75));
      c.fillStyle = g;
      c.beginPath();
      c.arc(C[0] * W, C[1] * H, R, 0, Math.PI * 2);
      c.fill();
      // mers et cratères, très doux
      for (let i = 0; i < 9; i++) {
        const ang = rnd() * Math.PI * 2;
        const d = Math.sqrt(rnd()) * R * 0.7;
        const r = R * (0.08 + rnd() * 0.2);
        const x = C[0] * W + Math.cos(ang) * d;
        const y = C[1] * H + Math.sin(ang) * d;
        const s = c.createRadialGradient(x, y, 0, x, y, r);
        s.addColorStop(0, rgba(p.secondary, 0.28));
        s.addColorStop(1, rgba(p.secondary, 0));
        c.fillStyle = s;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
      // brume au ras du sol
      for (let i = 0; i < 5; i++) {
        const y = (0.72 + i * 0.06) * H;
        const m = c.createRadialGradient(W * (0.2 + rnd() * 0.6), y, 0, W * 0.5, y, W * 0.7);
        m.addColorStop(0, rgba(p.accent, 0.16));
        m.addColorStop(1, rgba(p.accent, 0));
        c.fillStyle = m;
        c.fillRect(0, y - H * 0.05, W, H * 0.1);
      }
    },
    (c) => {
      c.fillStyle = 'rgba(0,0,0,0.85)';
      c.fillRect(0, 0, W, H);
    },
  );
}

/** une aile (gauche ; la droite est son miroir) : bras de l'aile et plumes en éventail */
function wing(c: Ctx, W: number, H: number, a: CoachAtmosphere, rnd: () => number, swept: boolean) {
  const p = a.palette;
  const A: P = [0.43, 0.42];
  const C1: P = swept ? [0.3, 0.34] : [0.3, 0.16];
  const T: P = swept ? [0.0, 0.5] : [0.0, 0.1];
  const n = swept ? 11 : 12;
  // deux rangées : grandes rémiges derrière, couvertures plus courtes devant
  for (const row of [0, 1]) {
    for (let i = 0; i < n; i++) {
      const t = 0.12 + (i / (n - 1)) * 0.88;
      const b = bez(A, C1, C1, T, t);
      // de « vers le bas » au départ à « vers l'extérieur » au bout de l'aile
      const ang = swept ? Math.PI * (0.62 + 0.3 * t) : Math.PI * (0.55 + 0.55 * t);
      const len = (row ? 0.45 : 1) * (swept ? 0.16 + 0.22 * t : 0.12 + 0.26 * t) * (0.92 + rnd() * 0.16);
      const e: P = [b[0] + (Math.cos(ang) * len) / EMBLEM_ASPECT, b[1] + Math.sin(ang) * len];
      const m1: P = [b[0] + (Math.cos(ang - 0.08) * len * 0.35) / EMBLEM_ASPECT, b[1] + Math.sin(ang - 0.08) * len * 0.35];
      const m2: P = [b[0] + (Math.cos(ang + 0.05) * len * 0.75) / EMBLEM_ASPECT, b[1] + Math.sin(ang + 0.05) * len * 0.75];
      c.fillStyle = rgba(row ? p.accent : p.primary, row ? 0.7 : 0.88);
      taper(c, W, H, b, m1, m2, e, (row ? 0.03 : 0.045) * (swept ? 0.85 : 1), 0.35);
      // rachis : un fil sombre au milieu de la plume
      c.strokeStyle = rgba(p.secondary, 0.55);
      c.lineWidth = W * 0.0025;
      c.beginPath();
      c.moveTo(b[0] * W, b[1] * H);
      c.bezierCurveTo(m1[0] * W, m1[1] * H, m2[0] * W, m2[1] * H, e[0] * W, e[1] * H);
      c.stroke();
    }
  }
}

function wings(W: number, H: number, a: CoachAtmosphere, rnd: () => number, swept: boolean) {
  return layer(
    W,
    H,
    (c) => {
      wing(c, W, H, a, rnd, swept);
      c.save();
      c.translate(W, 0);
      c.scale(-1, 1);
      wing(c, W, H, a, seeded(stableHash(a.coachId) ^ 0x5bd1), swept);
      c.restore();
    },
    (c) => sidesMask(c, W, H, 0.16),
  );
}

function streaks(c: Ctx, W: number, H: number, a: CoachAtmosphere, rnd: () => number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    const v = 0.15 + rnd() * 0.7;
    const x0 = side < 0 ? -0.05 : 1.05;
    const len = 0.18 + rnd() * 0.25;
    c.fillStyle = rgba(i % 3 ? a.palette.accent : a.palette.primary, 0.32);
    taper(c, W, H, [x0, v], [x0 - side * len * 0.3, v + 0.01], [x0 - side * len * 0.7, v + 0.02], [x0 - side * len, v + 0.03], 0.006 + rnd() * 0.006, 0.15);
  }
  c.restore();
}

/**
 * Dessine l'emblème complet. `W` : largeur du canevas (768 en qualité haute, 384 en légère). `font` : famille du titre (déjà
 * chargée par l'appelant, sinon la police de secours dessine le nom).
 */
export function drawEmblem(a: CoachAtmosphere, name: string, W = 768, font = 'Rajdhani, "Arial Narrow", sans-serif'): HTMLCanvasElement {
  const H = Math.round(W / EMBLEM_ASPECT);
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const c = out.getContext('2d')!;
  const rnd = seeded(stableHash(a.coachId));
  const m = a.atmosphere.motif;
  // 1. le nom du coach, très grand et très discret, au-dessus de la tête
  c.save();
  let size = H * 0.2;
  c.font = `800 ${size}px ${font}`;
  const tw = c.measureText(name.toUpperCase()).width;
  if (tw > W * 0.96) size *= (W * 0.96) / tw;
  c.font = `800 ${size}px ${font}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillStyle = rgba(a.palette.accent, 0.1);
  c.fillText(name.toUpperCase(), W / 2, H * 0.53);
  c.restore();
  // 2. le motif de l'animal
  const art =
    m === 'rayures'
      ? tigerStripes(W, H, a, rnd)
      : m === 'criniere'
        ? mane(W, H, a, rnd)
        : m === 'griffes'
          ? claws(W, H, a, rnd)
          : m === 'lune'
            ? moon(W, H, a, rnd)
            : m === 'ailes' || m === 'ailes-vitesse'
              ? wings(W, H, a, rnd, m === 'ailes-vitesse')
              : null;
  if (art) {
    // discret : le motif reste un fond, le coach domine
    c.globalAlpha = m === 'lune' ? 0.42 : 0.24;
    c.drawImage(art, 0, 0);
    c.globalAlpha = 1;
  } else {
    // monogramme : l'initiale du coach, en creux
    c.save();
    c.font = `800 ${H * 0.62}px ${font}`;
    c.textAlign = 'center';
    c.strokeStyle = rgba(a.palette.accent, 0.22);
    c.lineWidth = W * 0.006;
    c.strokeText(name.slice(0, 1).toUpperCase(), W / 2, H * 0.62);
    c.restore();
  }
  // 3. traits de vitesse (jeu rapide)
  if (a.atmosphere.streaks) streaks(c, W, H, a, rnd);
  // 4. les yeux de l'animal dans l'ombre, en haut et de côté (comme un fauve qui observe)
  const e = a.atmosphere.eyes;
  if (e) {
    const left = stableHash(a.coachId) % 2 === 0;
    const at: P = m === 'lune' ? [left ? 0.2 : 0.8, 0.6] : [left ? 0.19 : 0.81, 0.36];
    eyes(c, W, H, at[0], at[1], 0.05, e.color, e.pupil, m === 'lune' ? 0.3 : 0.38);
  }
  return out;
}

/** texture de fumée commune (nuage doux), calculée une fois */
export function drawSmoke(S = 256): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = S;
  out.height = S;
  const c = out.getContext('2d')!;
  const rnd = seeded(7);
  for (let i = 0; i < 26; i++) {
    const x = S * (0.2 + rnd() * 0.6);
    const y = S * (0.3 + rnd() * 0.4);
    const r = S * (0.08 + rnd() * 0.22);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.1 + rnd() * 0.12})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
  }
  // bords effacés : aucune arête visible
  c.globalCompositeOperation = 'destination-in';
  const m = c.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2);
  m.addColorStop(0, 'rgba(0,0,0,1)');
  m.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = m;
  c.fillRect(0, 0, S, S);
  return out;
}
