<!-- GÉNÉRÉ:etat — ne pas modifier à la main, lancer « npm run docs:sync » -->
# État du projet — version 2.7.0

Dernière version annoncée dans Nouveautés : **2.7.0** du 24 novembre 2026, « Choisir son coach en un geste » (124 versions au total).

## Version et publication

| Élément | Valeur | Origine |
| --- | --- | --- |
| Version de l’application | 2.7.0 | `package.json` (source unique) |
| Titre de la page, Réglages › À propos, écran de démarrage | v2.7.0 | injectée au build (`vite.config.ts`) |
| Android versionName / versionCode | 2.7.0 / 20700 | `scripts/android-version.mjs` (x × 10000 + y × 100 + z) |
| Nouveautés | 2.7.0 | première entrée de `src/domain/releases.ts` |
| Informations de publication | `version.json` | écrit à chaque build (`tools/build/releaseInfo.ts`) |

Version testable en ligne (GitHub Pages) : https://doorsofhell.github.io/combat-shadow-studio/ ; version réellement déployée : https://doorsofhell.github.io/combat-shadow-studio/version.json

## Contenu réel de l’application

| Discipline | Techniques | Exercices | Combinaisons des légendes |
| --- | ---: | ---: | ---: |
| Boxe anglaise | 30 | 49 | 348 |
| Kick-boxing | 46 | 56 | 286 |
| MMA | 54 | 48 | 348 |
| Muay-thaï | 54 | 48 | 310 |
| Jiu-jitsu brésilien | 13 | 25 | 96 |
| Judo | 15 | 28 | 108 |
| **Total** | **91** | **254** | **1 496** |

- Six disciplines, quatre niveaux : Débutant, Intermédiaire, Avancé, Expert.
- 91 techniques (une technique commune à plusieurs disciplines compte une fois dans le total).
- 254 exercices et 49 programmes.
- 6 coachs 3D : Kadir « L’Aigle », Naël « Le Faucon », Victor « Le Loup gris », Amara « La Lionne », Inaya « La Panthère », Kanya « La Tigresse ».
- Catalogue des légendes 1.1.0 (2026-10-20) : 107 champions, 1 496 combinaisons (1 496 inspirées).
- Catalogue des programmes : 30 enchaînements.
<!-- FIN GÉNÉRÉ:etat -->

> Tout ce qui précède est généré depuis `package.json`, `src/domain/releases.ts` et les catalogues réels
> (`src/domain/projectFacts.ts`). `src/domain/version-sync.test.ts` échoue si ce fichier ou le README ne
> correspondent plus à l’application. La suite est tenue à la main ; l’historique complet est dans
> `docs/JOURNAL_CORRECTIONS.md`.

## Publication (mis à jour à la main le 20 novembre 2026)

- Web app : déployée par `.github/workflows/preview.yml` (GitHub Pages) à chaque envoi sur la branche de
  production `claude/project-thread-o7lrt8`. La branche `main` n’est pas la branche de production et peut être en
  retard : toujours repartir de la dernière version déployée.
- Android : AAB et APK signés par `.github/workflows/android-release.yml` (voir `docs/PLAY_STORE.md`). La 2.3.1
  (versionCode 20301) a été signée pour le Play Store ; chaque nouvel envoi demande une version plus haute.
- Play Store : compte personnel, donc test fermé obligatoire (12 testeurs pendant 14 jours) avant la production ;
  à faire par le propriétaire dans la Play Console.
- Premium : prix affichés à titre indicatif ; le paiement n’est pas ouvert.

## Non vérifié à ce jour

- Ce qui demande un vrai téléphone n’est pas testé automatiquement ici : fluidité du coach 3D, voix française,
  réalité augmentée, installation de l’AAB par le Play Store.
- Les combinaisons des légendes sont toutes « inspirées » du style des champions (comptage ci-dessus) : aucune n’est
  « vérifiée » sur une vidéo de combat.

## Limites connues

- Animations par poses clés résolues par notre moteur, pas de capture de mouvement.
- Un seul rendu (Ultra-réaliste, depuis la 1.37.0) ; les éléments retirés sont rangés dans
  `_ARCHIVES_HORS_APPLICATION/`.
