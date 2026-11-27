---
name: captures-avant-apres
description: Produire des captures WebGL réelles avant/après côte à côte des coachs 3D ou des écrans (mêmes réglages, manifest, planche). À utiliser pour tout changement visuel avant de le montrer à Youssef.
---

# Captures avant/après

Règle (`AGENTS.md`) : uniquement des captures réellement rendues par Three.js/WebGL, jamais d'illustration générée. Seule la variable évaluée change.

1. **Deux builds.** Avant = la version de référence (commit noté) ; après = la branche candidate. Pour le moteur, on peut aussi utiliser les interrupteurs du Lab : `?torsion=0`, `?v220=0`, `?v230=-drapeau`, `rim=0`, `matiere=0`.
2. **Serveur.** `vite preview` sur :4180 (ou `vite dev` sur :5173). Le serveur s'arrête entre deux sessions : le relancer. Ne pas éditer `src/` pendant les captures sur `vite dev`.
3. **Lab.** `#/lab?champion=<id>&look=realiste&d=<discipline>&frame=1&motion=<technique>&az=&el=&span=&fy=`, avec `etat=` pour un état du comportement, `expr=Nom:poids` pour une expression, `face=live` pour le visage vivant. Repères pour un short : `span 0.45`, `fy 0.9`.
4. **Scripts.** `scripts/v2110/captures.mjs` (vues numérotées, environ 9 s par image), `scripts/dev/shot-*.mjs` pour les écrans, `scripts/dev/shot-strip.mjs` pour une suite d'images d'un mouvement (crochets `__labT`/`__labDur`). Chromium : `/opt/pw-browsers/chromium`.
5. **Identique des deux côtés** : même coach, tenue, pose et instant, angle, focale, cadrage, zoom, résolution et décor. Vues de face, trois quarts et profil, plus le dos pour les coutures, le cou et les vêtements. Pour un changement transversal, élargir aux six coachs et aux six disciplines.
6. **Une capture à la fois** : en parallèle, swiftshader rend des images blanches.
7. **Contrôle.** Regarder chaque image en gros plan (500 px, dos et face) avant d'en parler. Signaler les changements sans différence visible.
8. **Livrer.** Une planche côte à côte en JPEG dans `/mnt/project-files/<sujet>/`, plus un manifest (référence, candidate, réglages, erreurs WebGL). Le test échoue si un rendu manque.
