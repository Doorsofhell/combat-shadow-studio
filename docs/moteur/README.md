# Moteur de mouvement Shadow

Le moteur anime les coachs : il lit le squelette du personnage, place les gardes des 6 disciplines, joue les mouvements et les enchaînements, et contrôle les articulations, l'équilibre et les appuis. Depuis la v0.49 (moteur 1.0.0), c'est un module à part, demandé par Youssef le 2026-10-27 : « une espèce de module à part qui est utilisé par l'application et que je peux faire évoluer progressivement ».

## Où il se trouve

- Code : `src/engine/`.
- Porte d'entrée unique : `src/engine/index.ts`. L'application n'importe rien d'autre du moteur.
- Version : `ENGINE_VERSION` dans `src/engine/index.ts`, indépendante de la version de l'application.
- Journal : `docs/moteur/CHANGELOG.md`.
- Registre des mouvements contrôlés : `docs/ANIMATIONS.md`.

## Les règles du module

1. L'application utilise le moteur seulement par `src/engine/index.ts`.
2. Le moteur ne lit rien de l'application : ni écran, ni réglages, ni son, ni scène 3D. Il reçoit un squelette et rend des poses. Seuls deux fichiers de contrôle (`registry.ts`, `audit.ts`) lisent le catalogue des techniques pour le vérifier, et l'application ne les charge jamais.
3. Le test `src/engine/__tests__/boundary.test.ts` vérifie ces deux règles à chaque lancement des tests.
4. Chaque changement de comportement augmente `ENGINE_VERSION` et ajoute une ligne au journal.

## Faire évoluer le moteur étape par étape

1. Partir de la branche principale et créer une branche pour le changement.
2. Modifier le moteur dans `src/engine/`. Si l'application a besoin d'un nouvel outil, l'ajouter à `index.ts`.
3. Lancer les tests du moteur (`npx vitest run src/engine`) : articulations, chevilles, torsions, équilibre, appuis, fluidité, registre.
4. Augmenter `ENGINE_VERSION` (correctif, mineure ou majeure, voir le journal) et écrire la ligne du journal.
5. Ouvrir une PR. Les tests complets et les captures montrent si un mouvement a changé.

## Ce qui vient du labo CME-3D (PR #25)

| Élément de CME | Décision | Pourquoi |
| --- | --- | --- |
| Moteur séparé de l'affichage | Repris | C'est ce module (porte d'entrée unique, frontière testée). |
| Lissage selon la vitesse (`temporal.ts`) | Repris (`MotionSmoother`) | Utile pour un point suivi ou un futur flux de poses (vidéo, capture de mouvement). Il n'est branché sur aucun écran pour l'instant, et les mouvements écrits à la main ne sont jamais filtrés. |
| Lumière du labo | Reprise en option (« Lumière vive ») | Même personnage, rendu plus clair. Studio par défaut tant que Youssef ne l'a pas validée sur son téléphone. |
| Calcul bras et jambes à deux os avec plage de pliage | Déjà présent | `rig.ts` le fait avec en plus les limites des coudes, genoux, chevilles et torsions. |
| Pied d'appui fixé au sol (`contacts.ts`) | Déjà présent | Le contrôle 3 « pied d'appui fixe » du registre le vérifie sur chaque mouvement. |
| Contrôles d'intégrité | Traité ailleurs | Repris en tests dans la PR #28, ouverte par une autre discussion. |
| Petit réseau de neurones (`neural.ts`) | Non repris | 5 entrées, 12 neurones, entraîné sur des formules synthétiques (son code dit « not martial MoCap ») ; il corrige seulement de 7° au plus quelques angles du bassin et du buste. Il n'apporte pas de mouvement plus juste que les contrôles actuels. |
| Mouvements (crochet gauche et droit) | Non repris | Shadow en a déjà 91 contrôlés. |
