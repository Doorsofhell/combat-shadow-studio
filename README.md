# Combat Shadow Studio

Application web progressive (PWA) d’entraînement solo en shadow boxing, guidée par un coach 3D, pour quatre disciplines :
boxe anglaise, kick-boxing, MMA et muay-thaï, du niveau débutant à expert. Interface entièrement en français, données
stockées uniquement sur l’appareil.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production dans dist/ (avec service worker, fonctionne hors ligne)
npm run preview      # sert dist/ sur http://localhost:4173
npm test             # tests unitaires (Vitest)
npm run test:e2e     # parcours complets dans Chromium (Playwright, build + preview automatiques)
```

Node 20 ou plus. Pour Playwright avec un Chromium déjà installé : `CHROMIUM_PATH=/chemin/vers/chrome npm run test:e2e`.

## Ce que contient l’application

| Écran | Rôle |
| --- | --- |
| Bienvenue (questionnaire) | âge, taille, poids, expérience, niveau par discipline, objectifs, disponibilité, durée, garde, limitations, discipline principale, **choix obligatoire du coach**, recommandations |
| Coach | changement de coach à tout moment, statistiques conservées |
| Accueil | 4 disciplines, recommandations, temps de la semaine, reprise |
| Discipline | 4 niveaux, 11 à 12 exercices par niveau, choix du mode |
| Entraînement 3D | coach animé, enchaînement en cours, mouvement actuel et suivant, consigne, chrono de séance (temps actif), cumul de l’exercice, démarrer, pause, reprise, recommencer, vitesse, exercice précédent et suivant, plein écran, caméra, garde |
| Bibliothèque | 64 techniques, chacune jouée en 3D avec description, consignes et points clés |
| Programmes | 8 séances structurées (échauffement, technique, combinaisons, cardio, retour au calme) |
| Créateur | enchaînements personnalisés avec validation des transitions |
| Statistiques, Historique | temps actif par discipline, niveau, exercice, semaine, mois ; répétitions ; séances |
| Réglages | voix, volumes séparés, qualité 3D, caméra, rounds par défaut, export et import JSON, effacement |

Modes d’entraînement : libre, technique (lent, commenté), cardio, rounds (1, 2, 3, 5 min ou personnalisé, repos réglable), programme, personnalisé.

## Architecture

```
src/
  domain/      techniques, exercices, programmes, validation des enchaînements, recommandations (données pures)
  engine/      moteur d’animation : pose, cinématique inverse, mouvements clés, lecteur d’enchaînements
    library/   animations des techniques (boxe, jambes, coudes et clinch, lutte et sol)
  three/       rendu React Three Fiber : studio blanc, chargement des coachs
  store/       Zustand persistant dans IndexedDB : profil, réglages, statistiques, enchaînements perso, chrono actif
  audio/       voix française (Web Speech API), cloche et bips synthétisés (Web Audio, aucun fichier)
  ui/          écrans React, moteur de séance (useSession)
public/models/ coach_male.glb, coach_female.glb (glTF binaire, textures JPEG)
generator/     (dans le dossier du projet) scripts Blender qui produisent les deux coachs
```

### Animation

Les mouvements ne sont pas des clips génériques : chaque technique est décrite par des poses clés biomécaniques
(position du bassin, rotations du bassin et du buste, mains, appuis) et résolue sur le squelette du coach par une
cinématique inverse à deux segments pour chaque membre. Les pieds au sol sont définis par la position de l’avant-pied,
l’orientation et le décollement du talon : le pivot se fait autour de l’avant-pied, sans glissement. Le bassin s’abaisse
automatiquement si une jambe d’appui serait trop tendue. Les enchaînements se chevauchent (le coup suivant part avant la
fin du retour en garde) avec un fondu, sans retour à une pose neutre. La garde gaucher est un miroir exact.

Une vue de contrôle existe pour figer une technique : `#/lab?coach=femme&style=muaythai&motion=teep-avant&t=0.32&cam=80`.

## Ajouter une technique

1. Écrire l’animation dans `src/engine/library/*.ts` (poses clés avec `Author`).
2. Déclarer la technique dans `src/domain/techniques.ts` (nom, annonce vocale, disciplines, consignes, points clés).
3. L’utiliser dans `src/domain/exercises.ts`. Les tests vérifient que l’animation existe pour chaque discipline, que les
   mains et les pieds atteignent leurs cibles et que les exercices respectent les règles de la discipline.

Voir aussi `docs/LICENCES.md`, `docs/DEPLOIEMENT.md`, `docs/ANDROID.md` et `docs/ETAT.md`.
