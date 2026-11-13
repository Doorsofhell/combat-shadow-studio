# Combat Shadow Studio — consignes pour Claude Code

Application d'entraînement au shadow boxing (React, TypeScript, Vite, Three.js / React Three Fiber, Capacitor
Android). Le propriétaire travaille en français : réponses, journal et textes de l'app en français.

## Règles de travail permanentes

- **Améliorer sans casser** : point de restauration git (branche `restauration/...`) avant tout changement,
  petits lots, `docs/NON_REGRESSION.md`.
- Tests réels avant toute livraison : `npx vitest run`, `npx playwright test` (Chromium :
  `/opt/pw-browsers/chromium` si besoin), `npm run build`. Ne jamais affaiblir ni supprimer un test sans raison
  écrite au journal. Résultats étiquetés TEST RÉUSSI / ÉCHOUÉ / NON EXÉCUTÉ / NON APPLICABLE.
- Toute correction ou amélioration est consignée dans le fichier unique `docs/JOURNAL_CORRECTIONS.md`
  (date, version, constat vérifié, correction, fichiers, tests, restauration).
- Chaque livraison change la version (`package.json`, affichée dans le titre) et sa note dans
  `src/domain/releases.ts`.
- Pour une anomalie signalée : vérifier d'abord, puis donner le constat et la méthode de correction.
- Ressources libres seulement (CC0 ou MIT), rien d'acheté, pas de CC-BY.

## Personnages 3D : règles obligatoires

Lire **`docs/HUMAN_CHARACTER_STANDARDS.md`** avant de toucher à un coach, à un modèle 3D, au visage ou au
comportement. En résumé :

1. Tous les coachs passent par le moteur commun **Human Behavior & Facial Expression Engine**
   (`src/three/human/` + `FaceAnimator` dans `src/three/face.ts`). Ne jamais écrire de logique faciale propre à un
   coach : ses particularités vont dans son profil (`src/three/human/profiles.ts`).
2. Tout nouveau coach est enregistré dans `HUMAN_PROFILES` avec `contract: 'complet'` et son modèle porte les
   25 expressions ARKit, les os `LeftEye`/`RightEye`, `Neck`, `Head`. La liste `LEGACY_DEGRADED` est vide depuis
   la 1.37.0 et doit le rester.
3. Comportements obligatoires : respiration naturelle, clignements irréguliers, regard actif vers l'adversaire
   (jamais vers le sol en garde), bouche fermée et détendue au repos, expressions contextuelles temporaires
   (8 états) avec retour au neutre, réactions aux frappes, micro-mouvements, pause et reprise respectées.
4. Le moteur humain ne modifie jamais la technique (membres, bassin, buste) ; il n'agit que sur les yeux, les
   paupières, le visage, une petite rotation de la tête et les clavicules (respiration).
5. Critères bloquants : visage figé, bouche crispée ou entrouverte au repos, regard artificiel, expression qui
   ne revient pas au neutre, déformation du squelette, moteur inactif, perte de performance mobile.
6. Les tests `src/three/human/__tests__/` (contrat, regard, comportement, visage) doivent passer ; un nouveau coach
   est ajouté à leurs listes.
7. Ne jamais remplacer un visage validé, changer l'identité, les coiffures, les barbes ou la morphologie d'un
   coach, ni ses tenues sans raison.

## Repères techniques

- Coachs : `src/domain/coaches/catalog.ts` ; modèles `public/coaches/<id>/photo.glb` (Rocketbox MIT : Kadir,
  Amara, Naël, Inaya). Un seul rendu, Ultra-réaliste (1.37.0) : pas de style dessiné, pas de coach généré, pas de
  créateur de combattant. Axel et Kaila (MakeHuman) sont retirés.
- Tout ce qui est retiré de l'application est rangé dans `backup CS/` (hors build, gardé sur GitHub). Les squelettes
  générés que mesurent les tests du moteur sont dans `tests/fixtures/modeles-generes/`.
- Moteur d'animation : `src/engine/` (`rig.ts`, `player.ts`, `motion.ts`) ; scène : `src/three/CoachStage.tsx`,
  `src/three/PhotoCoach.tsx`.
- Lab de captures : `#/lab?champion=<id>&look=realiste&d=<discipline>&frame=1&motion=garde&az=&el=&span=&fy=`,
  `etat=<état>` pour un état du comportement, `expr=Nom:poids` pour une expression, `face=live` pour le visage vivant.
- Après toute reconstruction d'un `photo.glb` Rocketbox : relancer `tools/generator/rocketbox/morph_apply.py`.
