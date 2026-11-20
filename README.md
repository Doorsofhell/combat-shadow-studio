# Combat Shadow Studio

<!-- GÉNÉRÉ:presentation — ne pas modifier à la main, lancer « npm run docs:sync » -->
Version **2.4.0** (20 novembre 2026) : Sprawl, o-soto-gari et genoux plus naturels. Version testable en ligne : https://doorsofhell.github.io/combat-shadow-studio/

Application d’entraînement solo en shadow boxing, guidée par un coach 3D, pour six disciplines :
boxe anglaise, kick-boxing, MMA, muay-thaï, jiu-jitsu brésilien et judo, sur quatre niveaux (débutant, intermédiaire, avancé, expert).
Interface entièrement en français, données stockées uniquement sur l’appareil. Web app (PWA) et application Android.

| Discipline | Techniques | Exercices | Combinaisons des légendes |
| --- | ---: | ---: | ---: |
| Boxe anglaise | 30 | 49 | 348 |
| Kick-boxing | 46 | 56 | 286 |
| MMA | 54 | 48 | 348 |
| Muay-thaï | 54 | 48 | 310 |
| Jiu-jitsu brésilien | 13 | 25 | 96 |
| Judo | 15 | 28 | 108 |
| **Total** | **91** | **254** | **1 496** |

Une technique commune à plusieurs disciplines (le direct, par exemple) est une seule définition comptée une fois dans le total.
Programmes : 49. Coachs 3D : 6 (Kadir, Naël, Victor, Amara, Inaya, Kanya). Légendes : 107 champions.
<!-- FIN GÉNÉRÉ:presentation -->

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production dans dist/ (avec service worker, fonctionne hors ligne)
npm run preview      # sert dist/ sur http://localhost:4173
npm test             # tests unitaires (Vitest)
npm run test:e2e     # parcours complets dans Chromium (Playwright, build + preview automatiques)
npm run docs:sync    # régénère les chiffres de ce README et de docs/ETAT.md depuis les catalogues réels
```

Node 20 ou plus. Pour Playwright avec un Chromium déjà installé : `CHROMIUM_PATH=/chemin/vers/chrome npm run test:e2e`.

## Ce que contient l’application

| Écran | Rôle |
| --- | --- |
| Bienvenue (questionnaire) | âge, taille, poids, expérience, niveau par discipline, objectifs, disponibilité, durée, garde, limitations, discipline principale, **choix obligatoire du coach**, recommandations |
| Coach | changement de coach à tout moment, statistiques conservées |
| Accueil | toutes les disciplines, recommandations, temps de la semaine, reprise |
| Discipline | niveaux et exercices de la discipline (nombres exacts dans le tableau ci-dessus), choix du mode |
| Entraînement 3D | coach animé, enchaînement en cours, mouvement actuel et suivant, consigne, chrono de séance (temps actif), cumul de l’exercice, démarrer, pause, reprise, recommencer, vitesse, exercice précédent et suivant, plein écran, caméra, garde |
| Bibliothèque | toutes les techniques (nombre exact dans le tableau ci-dessus), chacune jouée en 3D avec description, consignes et points clés |
| Programmes | programmes structurés (échauffement, technique, combinaisons, cardio, retour au calme) |
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
public/coaches/ les six coachs ultra-réalistes (Kadir, Amara, Naël, Inaya, Victor, Kanya) : photo.glb + tenues/
tools/generator/ scripts de fabrication des coachs Rocketbox et des emblèmes (voir son README)
_ARCHIVES_HORS_APPLICATION/ éléments retirés de l’application, gardés pour l’historique (non compilés, non publiés,
             inventaire-archives.md) ; carte complète des dossiers : docs/ARCHITECTURE.md
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
