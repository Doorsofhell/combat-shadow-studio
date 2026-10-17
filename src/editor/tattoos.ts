import { CanvasTexture } from 'three';

/**
 * Original tattoo designs, drawn procedurally (no external artwork, no licence to track).
 * Each design fills a 256 px cell of a 4×4 atlas; only the alpha channel is used (ink), the
 * colour and intensity are chosen per tattoo.
 */
type Draw = (g: CanvasRenderingContext2D) => void;

const star = (g: CanvasRenderingContext2D, cx: number, cy: number, r: number, n = 5, inner = 0.45) => {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
};

export const TATTOO_DESIGNS: { id: string; name: string; draw: Draw }[] = [
  {
    id: 'bande-tribale',
    name: 'Bande tribale',
    draw: (g) => {
      g.fillRect(0, 104, 256, 14);
      g.fillRect(0, 150, 256, 14);
      for (let i = 0; i < 8; i++) {
        const x = i * 32 + 16;
        g.beginPath();
        g.moveTo(x - 14, 104);
        g.quadraticCurveTo(x, 40, x + 6, 70);
        g.quadraticCurveTo(x + 2, 92, x + 14, 104);
        g.fill();
        g.beginPath();
        g.moveTo(x - 14, 164);
        g.quadraticCurveTo(x, 228, x + 6, 198);
        g.quadraticCurveTo(x + 2, 176, x + 14, 164);
        g.fill();
      }
    },
  },
  {
    id: 'soleil',
    name: 'Soleil',
    draw: (g) => {
      g.beginPath();
      g.arc(128, 128, 46, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 12; i++) {
        g.save();
        g.translate(128, 128);
        g.rotate((i * Math.PI) / 6);
        g.beginPath();
        g.moveTo(-12, -58);
        g.lineTo(0, -118);
        g.lineTo(12, -58);
        g.fill();
        g.restore();
      }
    },
  },
  {
    id: 'vague',
    name: 'Vague',
    draw: (g) => {
      g.lineWidth = 14;
      g.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        for (let x = 10; x <= 246; x += 4) g.lineTo(x, 90 + k * 36 + Math.sin(x / 22 + k) * 18);
        g.stroke();
      }
      g.beginPath();
      g.arc(70, 70, 34, Math.PI * 0.2, Math.PI * 1.7);
      g.stroke();
    },
  },
  {
    id: 'flamme',
    name: 'Flamme',
    draw: (g) => {
      g.beginPath();
      g.moveTo(128, 246);
      g.bezierCurveTo(40, 230, 40, 150, 90, 110);
      g.bezierCurveTo(80, 160, 110, 170, 112, 150);
      g.bezierCurveTo(100, 100, 130, 60, 128, 10);
      g.bezierCurveTo(180, 70, 220, 140, 196, 196);
      g.bezierCurveTo(186, 226, 160, 246, 128, 246);
      g.fill();
    },
  },
  { id: 'etoile', name: 'Étoile', draw: (g) => star(g, 128, 132, 118) },
  {
    id: 'eclair',
    name: 'Éclair',
    draw: (g) => {
      g.beginPath();
      g.moveTo(150, 4);
      g.lineTo(60, 140);
      g.lineTo(122, 140);
      g.lineTo(96, 252);
      g.lineTo(200, 100);
      g.lineTo(138, 100);
      g.lineTo(176, 4);
      g.closePath();
      g.fill();
    },
  },
  {
    id: 'mandala',
    name: 'Mandala',
    draw: (g) => {
      g.lineWidth = 7;
      for (const r of [24, 56, 92]) {
        g.beginPath();
        g.arc(128, 128, r, 0, Math.PI * 2);
        g.stroke();
      }
      for (let i = 0; i < 16; i++) {
        g.save();
        g.translate(128, 128);
        g.rotate((i * Math.PI) / 8);
        g.beginPath();
        g.ellipse(0, -74, 9, 18, 0, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.arc(0, -112, 7, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    },
  },
  {
    id: 'griffes',
    name: 'Griffures',
    draw: (g) => {
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        const x = 50 + i * 46;
        g.moveTo(x, 18);
        g.quadraticCurveTo(x + 30, 128, x + 6, 240);
        g.quadraticCurveTo(x + 10, 128, x - 12, 22);
        g.fill();
      }
    },
  },
  {
    id: 'couronne',
    name: 'Couronne',
    draw: (g) => {
      g.beginPath();
      g.moveTo(26, 190);
      g.lineTo(26, 80);
      g.lineTo(76, 130);
      g.lineTo(128, 50);
      g.lineTo(180, 130);
      g.lineTo(230, 80);
      g.lineTo(230, 190);
      g.closePath();
      g.fill();
      g.fillRect(26, 202, 204, 20);
    },
  },
  {
    id: 'fleche',
    name: 'Flèche',
    draw: (g) => {
      g.fillRect(20, 120, 180, 16);
      g.beginPath();
      g.moveTo(250, 128);
      g.lineTo(190, 90);
      g.lineTo(200, 128);
      g.lineTo(190, 166);
      g.closePath();
      g.fill();
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(20 + i * 18, 120);
        g.lineTo(4 + i * 18, 92);
        g.lineTo(18 + i * 18, 92);
        g.lineTo(34 + i * 18, 120);
        g.fill();
        g.beginPath();
        g.moveTo(20 + i * 18, 136);
        g.lineTo(4 + i * 18, 164);
        g.lineTo(18 + i * 18, 164);
        g.lineTo(34 + i * 18, 136);
        g.fill();
      }
    },
  },
  {
    id: 'serpent',
    name: 'Serpent',
    draw: (g) => {
      g.lineWidth = 22;
      g.lineCap = 'round';
      g.beginPath();
      for (let t = 0; t <= 1; t += 0.01) g.lineTo(128 + Math.sin(t * Math.PI * 3) * 70 * (1 - t * 0.3), 236 - t * 200);
      g.stroke();
      g.beginPath();
      g.ellipse(128 + Math.sin(Math.PI * 3) * 49, 30, 22, 16, 0, 0, Math.PI * 2);
      g.fill();
    },
  },
  {
    id: 'chaine',
    name: 'Chaîne',
    draw: (g) => {
      g.lineWidth = 12;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        if (i % 2) g.ellipse(22 + i * 42, 128, 26, 12, 0, 0, Math.PI * 2);
        else g.ellipse(22 + i * 42, 128, 26, 20, 0, 0, Math.PI * 2);
        g.stroke();
      }
    },
  },
  {
    id: 'texte',
    name: 'SHADOW',
    draw: (g) => {
      g.font = '900 64px Rajdhani, Impact, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('SHADOW', 128, 128);
    },
  },
  {
    id: 'boussole',
    name: 'Rose des vents',
    draw: (g) => {
      star(g, 128, 128, 120, 4, 0.18);
      g.save();
      g.translate(128, 128);
      g.rotate(Math.PI / 4);
      star(g, 0, 0, 70, 4, 0.2);
      g.restore();
    },
  },
  {
    id: 'poings',
    name: 'Gants croisés',
    draw: (g) => {
      for (const s of [-1, 1]) {
        g.save();
        g.translate(128, 128);
        g.rotate(s * 0.6);
        g.beginPath();
        g.ellipse(0, -50, 46, 58, 0, 0, Math.PI * 2);
        g.fill();
        g.fillRect(-30, -2, 60, 70);
        g.restore();
      }
    },
  },
  {
    id: 'points',
    name: 'Ligne de points',
    draw: (g) => {
      for (let i = 0; i < 9; i++) {
        g.beginPath();
        g.arc(16 + i * 28, 128, 6 + (i % 3) * 3, 0, Math.PI * 2);
        g.fill();
      }
    },
  },
];

let atlas: CanvasTexture | null = null;

/** 1024² atlas of all designs, built once */
export function tattooAtlas() {
  if (atlas) return atlas;
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  // no 2D canvas (tests, very old WebView): tattoos stay invisible instead of breaking the coach
  TATTOO_DESIGNS.forEach((d, i) => {
    if (!g) return;
    g.save();
    g.translate((i % 4) * 256, Math.floor(i / 4) * 256);
    g.beginPath();
    g.rect(0, 0, 256, 256);
    g.clip();
    g.fillStyle = '#000';
    g.strokeStyle = '#000';
    d.draw(g);
    g.restore();
  });
  atlas = new CanvasTexture(c);
  // canvas y goes down, texture v goes up
  atlas.flipY = true;
  return atlas;
}

/** small preview image of one design, for the editor */
export function tattooPreview(id: string, size = 64) {
  const d = TATTOO_DESIGNS.find((x) => x.id === id);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.scale(size / 256, size / 256);
  g.fillStyle = '#F5F5F5';
  g.strokeStyle = '#F5F5F5';
  d?.draw(g);
  return c.toDataURL();
}
