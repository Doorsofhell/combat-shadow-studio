import { describe, expect, test } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Vector3 } from "three";
import { loadSkeleton } from "../../test/skeleton";
import { CoachRig } from "../rig";
import { getLibrary, getMotion } from "../library";
import { MotionSampler, duration } from "../motion";
import { styleOf } from "../audit";
import { COACH_STANCES } from "../../domain/coaches/motion";
import { TECHNIQUES } from "../../domain/techniques";

/**
 * 1.41.0 (lot 2, Youssef 2026-11-14): a foot that touches the mat does not slide along it faster than a glide.
 * Measured on the posed skeleton of the four coaches (their own guard, orthodox and southpaw), 60 images per second:
 * the ball of each foot that is on the mat at two following images (within 4 mm of its rest height) may move
 * by GLIDE_MAX per image at most (0.9 m/s: a pivot, suri-ashi, a shuffle). Before 1.41.0 the switch kick dragged
 * a foot 20 cm per image (12 m/s). Techniques that sweep a leg along the mat on purpose are bounded by their
 * value in 1.41.0 (they may not get worse) and listed in docs/audit-biomecanique/MESURES_GLISSEMENT.md.
 */
const GLIDE_MAX = 1.5; // cm per image at 60 images/s
/** sweeps along the mat, written as such (reaps, the leg threaded under the body, breakfalls): bound in 1.41.0, cm per image */
const SWEEP_PENDING: Record<string, number> = {
  "sit-out": 13.7,
  "changement-base": 13.2,
  "releve-technique": 10.5,
  "uchikomi-ko-uchi-gari": 8.7,
  "uchikomi-o-uchi-gari": 6.6,
  "releve-genoux": 4.3,
  "ukemi-yoko": 3.2,
  sprawl: 2.9,
  "defense-lutte": 2.6,
  "ukemi-ushiro": 2.3,
  "uchikomi-o-goshi": 2.1,
  kuzushi: 2.0,
  "uchikomi-seoi": 1.9,
  "single-leg": 1.9,
};
const COACHES = [
  ["mma-kadir", "homme"],
  ["mma-amara", "femme"],
  ["nael", "homme"],
  ["inaya", "femme"],
] as const;
const DOC = resolve(
  __dirname,
  "../../../docs/audit-biomecanique/MESURES_GLISSEMENT.md",
);
/** worst values of 1.40.3 (≥ 1 cm per image), measured by this same test on restauration/avant-controles-moteur, for the comparison in the document */
const BEFORE_1403: Record<string, number> = {
  "switch-kick": 19.8,
  "changement-base": 15.1,
  "sit-out": 15.1,
  "releve-technique": 11.9,
  sprawl: 10.5,
  "uchikomi-ko-uchi-gari": 8.6,
  "uchikomi-seoi": 8.3,
  "entree-lutte": 7.6,
  "tai-sabaki": 7.5,
  "uchikomi-o-goshi": 7.5,
  "single-leg": 7,
  "descente-sol": 6.7,
  "uchikomi-o-uchi-gari": 6.6,
  "releve-genoux": 6.3,
  "defense-lutte": 5.8,
  "sortie-hanche": 4.4,
  pont: 4.4,
  "retention-garde": 4.4,
  "uchikomi-o-soto-gari": 3.7,
  kuzushi: 3.5,
  "ukemi-yoko": 3.1,
  "ukemi-ushiro": 2.3,
  "ayumi-ashi": 1.5,
  "check-arriere": 1.1,
};

interface Row {
  technique: string;
  worst: number;
  total: number;
  coach: string;
  style: string;
  southpaw: boolean;
}
const rows = new Map<string, Row>();
let grandTotal = 0;
for (const [id, sex] of COACHES) {
  const rig = new CoachRig(loadSkeleton(sex, `coaches/${id}/photo.glb`));
  for (const t of TECHNIQUES) {
    if (t.mode === "partenaire") continue;
    for (const style of new Set(t.disciplines.map(styleOf)))
      for (const southpaw of [false, true]) {
        const m = getMotion(
          getLibrary(rig, style, { id, offsets: COACH_STANCES[id] }),
          t.motion,
          southpaw,
        );
        if (!m) continue;
        const s = new MotionSampler(rig, m);
        const dur = duration(m);
        const n = Math.max(1, Math.round(dur * 60));
        let prev: Vector3[] | null = null;
        let worst = 0;
        let total = 0;
        for (let i = 0; i <= n; i++) {
          rig.apply(s.sample((dur * i) / n));
          const balls = ["LeftToeBase", "RightToeBase"].map((b) =>
            rig.worldOf(b)!.clone(),
          );
          if (prev)
            balls.forEach((b, k) => {
              const a = prev![k];
              if (
                b.y > rig.metrics.ballRestY + 0.004 ||
                a.y > rig.metrics.ballRestY + 0.004
              )
                return;
              const d =
                (Math.hypot(b.x - a.x, b.z - a.z) * 100 * n) / (dur * 60);
              worst = Math.max(worst, d);
              total += d;
            });
          prev = balls;
        }
        grandTotal += total;
        const r = rows.get(t.id);
        if (!r || worst > r.worst)
          rows.set(t.id, {
            technique: t.id,
            worst,
            total: Math.max(total, r?.total ?? 0),
            coach: id,
            style,
            southpaw,
          });
      }
  }
}
const list = [...rows.values()].sort((a, b) => b.worst - a.worst);
const f = (x: number, d = 1) => x.toFixed(d).replace(".", ",");

describe("pieds qui glissent sur le tapis (4 coachs, droitier et gaucher)", () => {
  test(`un pied posé ne glisse pas plus vite qu’un pas glissé (${GLIDE_MAX} cm par image)`, () => {
    const bad = list
      .filter((r) => r.worst > (SWEEP_PENDING[r.technique] ?? GLIDE_MAX))
      .map(
        (r) =>
          `${r.technique} ${f(r.worst, 2)} cm/image (${r.coach} ${r.style}${r.southpaw ? " gaucher" : ""})`,
      );
    expect(bad).toEqual([]);
  });

  test("le switch kick, les entrées de lutte et de judo ne traînent plus le pied", () => {
    for (const id of [
      "switch-kick",
      "entree-lutte",
      "tai-sabaki",
      "sortie-hanche",
      "pont",
      "retention-garde",
      "uchikomi-o-soto-gari",
    ])
      expect(rows.get(id)!.worst, id).toBeLessThanOrEqual(GLIDE_MAX);
  });

  test("le document de mesures est à jour", () => {
    const md = [
      "# Glissement des pieds sur le tapis",
      "",
      "Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/glide.test.ts`. Ne pas modifier à la main.",
      "",
      "Mesure : à 60 images par seconde, sur le squelette posé de Kadir, Amara, Naël et Inaya (garde du coach, droitier et gaucher), déplacement horizontal de l’avant de chaque pied qui touche le tapis à deux images de suite. 1,5 cm par image correspond à 0,9 m/s : un pivot, un pas glissé (suri-ashi), un shuffle.",
      "",
      "Correction 1.41.0 (moteur, `glideLift` et `lowLift` dans `src/engine/motion.ts`) : un pied écrit au sol à deux endroits différents, ou qui décolle et se pose en restant bas, était traîné sur le tapis. Au-delà d’un pas glissé lent, il quitte maintenant le tapis sur un petit arc (4,5 cm au plus) et se pose à l’endroit écrit. Les pieds immobiles, les pivots lents et les coups de pied qui montent franchement ne changent pas.",
      "",
      `Glissement cumulé de toute la bibliothèque (4 coachs, droitier et gaucher) : ${f(grandTotal / 100, 0)} m (1.40.3, même mesure : 336 m).`,
      "",
      "| Technique | Pire glissement 1.40.3 (cm / image) | Pire glissement (cm / image) | Pire cas | Limite |",
      "|---|---|---|---|---|",
      ...list
        .filter((r) => r.worst > 0.5 || BEFORE_1403[r.technique])
        .map(
          (r) =>
            `| \`${r.technique}\` | ${BEFORE_1403[r.technique] ? f(BEFORE_1403[r.technique]) : "< 1"} | ${f(r.worst, 2)} | ${r.coach} ${r.style}${r.southpaw ? " gaucher" : ""} | ${SWEEP_PENDING[r.technique] ? `${f(SWEEP_PENDING[r.technique])} (balayage, en attente)` : f(GLIDE_MAX)} |`,
        ),
      "",
      "## Balayages encore au-dessus de 1,5 cm par image (en attente de revue)",
      "",
      "Bornés à leur valeur 1.41.0 par le test (ils ne peuvent pas empirer). Une partie est voulue (ko-uchi-gari et o-uchi-gari fauchent le pied le long du tapis, le sit-out et le changement de base passent une jambe sous le corps, les chutes) ; le reste (sprawl, descente au sol, relevés) se règle mouvement par mouvement, avec l’accord de Youssef.",
      "",
      ...Object.entries(SWEEP_PENDING).map(
        ([k, v]) => `- ${k} : jusqu’à ${f(v)} cm par image`,
      ),
      "",
    ].join("\n");
    if (process.env.AUDIT_UPDATE) writeFileSync(DOC, md);
    expect(existsSync(DOC) && readFileSync(DOC, "utf8")).toBe(md);
  });
});
