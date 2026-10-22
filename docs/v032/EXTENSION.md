# v0.32 · Extension de la méthode v0.31 aux autres techniques prioritaires

Le 2026-10-22 à 09:11, Youssef a validé la v0.31 (« je valide tout »). La même méthode s'applique maintenant à l'uppercut, au coude horizontal, au middle kick, au high kick et au genou direct : correction dans le moteur procédural (« Moteur amélioré », sans capture de mouvement), mesures sur les deux coachs Ultra-réaliste et vidéos avant/après.

- Branche : `feature/biomeca-v032`, créée depuis `feature/combat-shadow-v030` (`04b0b5e`, v0.31.0).
- Version : `0.32.0-proto1`.
- Rien n'est fusionné ni déployé sans l'accord de Youssef.

**Sources** : uniquement des sources écrites, déjà citées dans `docs/audit-biomecanique/BIBLIOGRAPHIE.md` (S3 uppercut, S27 coudes, S35 genoux). Aucune vidéo n'a été visionnée, puisque YouTube est bloqué depuis l'environnement de travail.

## 1. Constats vérifiés (v0.31)

Toutes les valeurs ont été mesurées sur 161 images par technique, coachs Kadir et Amara (`src/engine/__tests__/extension-v032.test.ts`).

| Technique | Constat |
|---|---|
| Uppercut avant et arrière | Le poing atteignait sa vitesse maximale (174 à 177 ms) **avant** la rotation des hanches et des épaules (210 ms). Le bras soulevait le corps au lieu d'être porté par lui. |
| Coude horizontal avant et arrière | Même chaîne inversée : pic du coude à 198 à 205 ms, hanches à 208 ms. |
| Middle et high kick | À l'arrivée, les hanches descendaient de 4 à 5 cm en une image, soit 4,4 à 6,0 m/s de vitesse de hanche. |
| Genou direct | Le pied frottait le sol sur 4 à 6 cm et frôlait le sol (moins de 6 cm de hauteur) sur 20 à 29 cm. Le bras qui cadre l'adversaire était tendu et verrouillé (coude à 2° de flexion, côté arrière). |

## 2. Corrections dans le moteur (commit `cecf122`)

- **Poussée des jambes avant le bras** (`driveToward` dans `src/engine/author.ts`) : une pose intermédiaire où le bassin, la poitrine, les hanches et les pieds avancent avant le bras. Elle est ajoutée à l'uppercut (`library/boxing.ts`) et au coude (`library/upper.ts`). Côté coude, cette pose est tenue (`hold`), sans quoi la vitesse à l'impact baissait de 5 à 7 %.
- **Décollage du pied propre** : pour le middle kick, le high kick et le genou, une pose « pied décollé » (talon levé, pointe tendue) est ajoutée avant que la jambe monte (`library/legs.ts`).
- **Bras de cadrage** : sur le genou direct, la main se place à 97 % de la longueur du bras au maximum, pour que le coude ne se verrouille plus.
- **Transfert du poids** :
  - `supportDrop` (`motion.ts`) abaisse progressivement les hanches quand le talon d'appui se lève, au lieu de basculer d'un coup ;
  - `balanceKeys` (`balance.ts`) répartit le déplacement du centre de gravité sur l'image de décollage et sur celle d'atterrissage.

## 3. Mesures avant/après (Kadir · Amara)

| Technique | Mesure | v0.31 | v0.32 |
|---|---|---|---|
| Uppercut arrière | Pics hanches → épaules → poing (ms) | 210 → 213 → **174** (inversé) | 147 → 162 → 249 · 147 → 162 → 246 |
| Uppercut arrière | Vitesse du poing à l'impact (m/s) | 1,25 · 1,16 | 2,54 · 2,34 |
| Uppercut avant | Vitesse du poing à l'impact (m/s) | 0,93 · 0,81 | 1,88 · 1,64 |
| Coude horizontal arrière | Pics hanches → épaules → coude (ms) | 208 → 215 → **198** (inversé) | 143 → 156 → 234 |
| Coude horizontal arrière | Vitesse du coude à l'impact (m/s) | 3,26 · 2,79 | 6,26 · 5,43 |
| Middle kick arrière | Vitesse maximale des hanches (m/s) | 6,03 · 5,66 | 3,03 · 2,97 |
| High kick arrière | Vitesse maximale des hanches (m/s) | 6,00 · 5,64 | 2,98 · 2,93 |
| High kick avant | Vitesse du pied à l'impact (m/s) | 7,66 · 7,63 | 10,22 · 10,18 |
| Genou direct arrière | Pied qui frôle le sol (cm) | 23,6 · 20,4 | 13,9 · 14,4 |
| Genou direct arrière | Pied qui frotte le sol (cm) | 5,5 · 5,4 | 1,7 · 1,6 |
| Genou direct arrière | Coude du bras de cadrage (°) | 2 · 2 | 33 · 35 |
| Genou direct arrière | Vitesse du genou à l'impact (m/s) | 3,76 · 3,48 | 9,03 · 8,19 |

Les tableaux complets (10 techniques × 2 coachs) se trouvent dans la page de revue. Aucun glissement du pied d'appui n'a été mesuré, ni avant ni après.

## 4. Limites et compromis (constatés, pas cachés)

- **Arrêts de fluidité** : 339 sur 2 046 poses clés → 595 sur 2 202 (27 % des arrêts d'une interpolation sans flux, toujours sous le seuil de 40 %, `MESURES_FLUIDITE.md`). Ils viennent des poses tenues du coude et des poses de décollage ajoutées.
- **Durée des kicks** : un peu plus longue. L'impact passe de 400 à 440 ms pour le middle kick et de 340 à 370 ms pour le high kick avant.
- **Glissement du pied qui frappe** : sur les kicks, il augmente légèrement dans certains cas (1,3 → 1,8 cm), tout en restant sous le seuil de 3 cm.
- **Genou avant** : le bras de cadrage d'Amara reste presque tendu (12°, au-dessus du seuil de 8°).
- **Teep** : pas modifié (pic de hanche à 3,9 m/s).
- **Non fait** : aucune revue par un entraîneur, aucun test sur un téléphone Android.

## 5. Tests

| Test | Résultat |
|---|---|
| `extension-v032.test.ts` (20 tests, 2 coachs) | TEST RÉUSSI |
| Vitest complet : 559 réussis, 1 ignoré, 1 échec | ÉCHOUÉ (1) : `photo-coach` hanche d'Amara à 53,6° sur `retention-garde` et `pont`. Échec déjà présent en v0.31, non lié à ce lot. |
| Playwright complet : 141 réussis, 2 ignorés | ÉCHOUÉ (3) : `coach-suggest:94` (réussit seul), `training-layout:286` et `:323` (échouent aussi sur la v0.31). Échecs déjà présents. |
| Test sur Android | NON EXÉCUTÉ |
