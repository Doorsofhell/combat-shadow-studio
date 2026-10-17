# Déploiement HTTPS

La PWA est un site statique (dossier `dist/`). Le service worker exige HTTPS (sauf sur `localhost`).
Les chemins sont relatifs (`base: './'`) : l’application fonctionne à la racine d’un domaine comme dans un sous-dossier.

```bash
npm ci
npm test
npm run build
```

## Option 1 : Netlify ou Cloudflare Pages (gratuit, HTTPS automatique)

- Commande de build : `npm run build`, dossier publié : `dist`.
- Aucune règle de redirection n’est nécessaire (navigation par `#/`).

## Option 2 : GitHub Pages

Publier le contenu de `dist/` sur la branche `gh-pages` (ou via l’action officielle `actions/deploy-pages`).
HTTPS est fourni par GitHub.

## Option 3 : serveur personnel (nginx)

```nginx
server {
  listen 443 ssl http2;
  server_name shadow.example.fr;
  ssl_certificate     /etc/letsencrypt/live/shadow.example.fr/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/shadow.example.fr/privkey.pem;
  root /var/www/combat-shadow-studio;
  location = /sw.js { add_header Cache-Control "no-cache"; }
  location ~* \.(glb|wasm|js|css|png|jpg|svg)$ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  types { model/gltf-binary glb; application/wasm wasm; }
}
```

Certificat gratuit : `certbot --nginx -d shadow.example.fr`.

## Vérifications après mise en ligne

1. Ouvrir le site sur Android dans Chrome, faire le questionnaire, lancer un exercice.
2. Menu Chrome, « Ajouter à l’écran d’accueil » : l’application s’ouvre en plein écran.
3. Couper le réseau et relancer : l’application et les coachs 3D doivent fonctionner hors ligne (environ 11 Mo mis en cache).
