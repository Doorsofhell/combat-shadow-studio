---
paths:
  - "vite.config.ts"
  - "tools/build/**"
  - "src/boot/**"
  - "public/sw*"
---

# PWA, cache et démarrage

- Workbox n'applique que la **première** route qui correspond. Règle A (modèles, tenues, salles) : CacheFirst contrôlé par empreinte SHA-1 (en-tête `x-css-empreinte`, empreintes inscrites dans `sw.js` par `vite.config`). Règle B (portraits, arbitre) : NetworkFirst. Les deux font leurs requêtes en `cache:'no-cache'` (GitHub Pages a un max-age de 600). Code : `tools/build/swModeles.ts`.
- Les plugins `generateSW` n'acceptent que des fonctions : les données sont intégrées par `new Function`, et l'état est dans `globalThis.__cssModeles`.
- Garder un précache léger (environ 12 Mo) : un gros précache bloque la mise à jour sur téléphone.
- Test d'une mise à jour de modèle : `tests/e2e/maj-modeles-v236.spec.ts` (une v2 réelle construite avec `CSS_PUBLIC_DIR`, servie sur :4191, puis `registration.update()`).
- Le build écrit `version.json` (version, versionCode, commit), qui sert à vérifier le déploiement.
