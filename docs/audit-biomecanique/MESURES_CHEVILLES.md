# Mesures des chevilles et des orteils

Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/ankle-range.test.ts`. Ne pas modifier à la main.

Angles lus sur le squelette animé (rotation du pied par rapport au tibia depuis la position de repos), pour
toutes les animations, les quatre styles, 49 instants chacune. « Avant » : v0.22.0 (`chevilles-avant-v0.22.0.json`,
même mesure). Pires valeurs. Amplitudes de référence : `src/engine/limits.ts`.

| Coach | À plat : dorsiflexion | À plat : éversion | À plat : torsion pied/tibia | En l’air : dorsiflexion | En l’air : flexion plantaire | En l’air : inversion | En l’air : torsion | Orteils relevés |
|---|---|---|---|---|---|---|---|---|
| Homme, avant (v0.22.0) | 62° | 106° | 109° | 74° | 85° | 172° | 178° | 18° |
| Homme, après | 43° | 23° | 22° | 20° | 50° | 28° | 15° | 65° |
| Femme, avant (v0.22.0) | 63° | 102° | 81° | 74° | 85° | 176° | 175° | 18° |
| Femme, après | 42° | 26° | 21° | 20° | 50° | 33° | 15° | 65° |
| Référence | 40° en charge | 15° | ≈ 15° | 20° | 50° | 35° | ≈ 15° | 70° |

## Front kick avant (kick-boxing), pied de frappe

| Coach | Flexion plantaire max | Inversion max | Torsion max | Orteils relevés |
|---|---|---|---|---|
| homme, avant | 76° | 0° | 145° | 18° |
| homme, après | 45° | 0° | 0° | 65° |
| femme, avant | 79° | 0° | 175° | 18° |
| femme, après | 45° | 0° | 0° | 65° |

## Techniques au sol encore hors amplitude (à reprendre, lot A)

Bornées à leur valeur actuelle par le test (elles ne peuvent pas empirer) :

- sprawl : torsion ou éversion du pied à plat jusqu’à 23°
- sortie-hanche : torsion ou éversion du pied à plat jusqu’à 27°
- releve-technique : torsion ou éversion du pied à plat jusqu’à 20°
- pont : torsion ou éversion du pied à plat jusqu’à 27°
- retention-garde : torsion ou éversion du pied à plat jusqu’à 22°
- changement-base : torsion ou éversion du pied à plat jusqu’à 22°
