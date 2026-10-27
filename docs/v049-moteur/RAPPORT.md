# v0.49.0 · Moteur à part et lumière vive

Demande (Youssef, 2026-10-27 12:47) : « Ok on ne remplace pas le moteur. Mais on améliore le moteur de Shadow avec tout ce qu'il est bon de prendre dans CME. Je voudrais aussi que dans Shadow le moteur soit une espèce de module à part qui est utilisé par l'application et que je peux faire évoluer progressivement. » Puis (12:53) : « Pourquoi j'ai quand même l'impression que les personnages dans CME sont mieux aboutis que ceux de Shadow ? », avec une capture.

Branche `feature/moteur-module-v049`, partie de `feature/combat-shadow-v030` (411d039, v0.48.0).

## 1. Constat

- **CME contre Shadow** : le labo CME (PR #25, commit 3363f88) compte environ 300 lignes, deux mouvements (crochets gauche et droit) et seuls ses bras bougent. Le moteur de Shadow compte environ 6 500 lignes et 91 mouvements contrôlés sur 6 disciplines.
- **« Personnages mieux aboutis »** : le Kadir de CME (`cme-3d/public/fighters/mma-kadir/photo.glb`) est une copie à l'octet près de celui de Shadow (même empreinte sha256 `4a2a13b9…`). La différence vient de la mise en scène : fond sombre, beaucoup plus de lumière ambiante et de ciel, contour bleuté par l'arrière, reflets du studio environ 6 fois plus forts (0,7 contre 0,12).
- **Le moteur** dépendait déjà peu du reste de l'app : seuls des types du catalogue, et deux fichiers de contrôle (registre, audit) qui lisent le catalogue. Mais 16 fichiers de l'app allaient chercher directement des fichiers internes du moteur.
- **L'épaule de Kadir en garde** : en garde, le moteur monte et avance l'épaule de 8° au plus pour couvrir le menton (`rig.ts`, clavicule). Le relief marqué de l'épaule vient de la peau du modèle Rocketbox quand le bras est levé. Je n'ai rien changé : Kadir doit rester « strictement dans son état actuel », et la garde fait partie des mouvements contrôlés. Voir §5.

## 2. Ce qui change

- **Module moteur** :
  - porte d'entrée unique `src/engine/index.ts` ;
  - version propre `ENGINE_VERSION = '1.0.0'` ;
  - journal `docs/moteur/CHANGELOG.md` et mode d'emploi `docs/moteur/README.md` ;
  - les 16 fichiers de l'application passent maintenant par cette porte ;
  - le test `src/engine/__tests__/boundary.test.ts` vérifie que l'application n'entre pas dans le moteur et que le moteur ne lit rien de l'application.
- **Repris de CME** : le lissage selon la vitesse (`src/engine/smoothing.ts`, `MotionSmoother`, avec 4 tests). Il est disponible dans le module mais branché sur aucun écran pour l'instant. Le tableau complet de ce qui est repris ou non, et pourquoi, est dans `docs/moteur/README.md`.
- **Option « Lumière du coach »** (Réglages > Affichage, rendu Ultra-réaliste) :
  - « Studio » (par défaut, inchangé) ;
  - « Vive » : la lumière du labo CME (ambiante 0,7, ciel bleuté 1,3, lumière principale 2,5, contour bleuté 1,5, reflets 0,7 en qualité haute) et le fond sombre de CME sous le coach pendant l'entraînement.
  - Sur les autres écrans, le fond reste celui du thème, car leurs textes et boutons sont posés sur la scène.
  - Les corrections de stabilité WebGL ne changent pas : mêmes règles de qualité, d'ombres et de résolution.
- **Aucun mouvement modifié** : aucune pose, limite ou durée, et aucun test du moteur n'a changé.
- **Tests de bout en bout** : l'aide `seedProfile` écrivait les réglages sous une clé d'utilisateur (`u:local:css-settings`), alors que les réglages sont une clé de l'appareil (`css-settings`). Elle est corrigée. Aucun autre test ne s'en servait.

## 3. Fichiers

`src/engine/{index.ts,smoothing.ts}`, `src/engine/__tests__/{boundary,smoothing}.test.ts`, 16 fichiers de l'application (imports du moteur), `src/three/{CoachStage.tsx,StudioStage.tsx}`, `src/store/settings.ts`, `src/ui/screens/Settings.tsx`, `tests/e2e/{moteur-lumiere.spec.ts,nav-helpers.ts,navigation.spec.ts}`, `scripts/dev/shot-lumiere.mjs`, `src/domain/releases.ts`, `package.json`, `docs/moteur/`, `docs/v049-moteur/`.

## 4. Tests

| Test | Résultat |
| --- | --- |
| TypeScript (`tsc --noEmit`) | RÉUSSI |
| Vitest complet | 814 RÉUSSIS, 1 ignoré, 0 ÉCHOUÉ (dont tous les tests du moteur, inchangés) |
| Nouveaux : frontière du module (4), lissage (4) | 8 RÉUSSIS |
| `tests/e2e/moteur-lumiere.spec.ts` (Studio par défaut, Vive = fond sombre à l'entraînement, gardé au rechargement, pas d'option en Anime) | 2 RÉUSSIS |
| Playwright complet | 214 RÉUSSIS, 2 ignorés (Firebase), 3 ÉCHOUÉS : `coach-suggest:96` et `training-layout:325` (déjà en échec sur les v0.46 à v0.48), `coaching-hud:60` (dépend de la vitesse de la machine : il échoue aussi, relancé seul, sur la v0.48.0 au même moment) |
| Téléphone Android réel | NON EXÉCUTÉ |

## 5. À décider par Youssef

- **Lumière vive par défaut ?** Avant/après : `docs/v049-moteur/avant-apres-lumiere.png`. Elle reste en option tant qu'elle n'est pas validée sur ton téléphone.
- **Épaule de Kadir** : la corriger demande soit de réduire la montée de l'épaule en garde, ce qui change un mouvement contrôlé, soit de retoucher la peau du modèle, ce qui change Kadir. Les deux demandent ton accord.

## 6. Limites

- Captures faites avec un rendu logiciel (SwiftShader), pas sur un téléphone. Test Android réel : NON EXÉCUTÉ.
- `MotionSmoother` n'est encore utilisé par aucun écran.
