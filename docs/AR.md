# Réalité augmentée (mode facultatif)

Désactivée par défaut. Bouton « AR » sur l’écran d’entraînement, puis une fiche d’explication (confidentialité,
sécurité, case « espace dégagé » obligatoire) avant toute demande de caméra.

## Ce qui est implémenté (Web App)

- **WebXR `immersive-ar`** avec `hit-test` obligatoire ; `dom-overlay`, `anchors` et `local-floor` facultatifs
  (`src/ar/ArBridge.ts`, `src/three/ArScene.tsx`).
- Détection réelle des capacités avant de proposer l’AR (`src/ar/support.ts`) : contexte non sécurisé, absence de
  WebXR, absence de session `immersive-ar`, application native. Message clair dans chaque cas, le mode classique reste
  disponible. Aucune simple superposition vidéo n’est présentée comme de l’AR.
- Détection du sol par hit-test, réticule, appui pour placer le coach face à l’utilisateur, ancrage quand le navigateur
  le permet, ombre au sol, taille (0,2 à 1), rotation, orientations de démonstration (conseillée, face, profil),
  recentrer, replacer.
- Mêmes animations et mêmes commandes que le mode classique (démarrer, pause, vitesse, précédent, suivant), dans une
  surcouche discrète qui peut être masquée.
- Caméra coupée en quittant l’AR, en quittant l’écran ou quand l’application passe en arrière-plan ; retour au fond
  blanc. Aucune image enregistrée ni envoyée : le flux caméra est traité par le navigateur, l’application ne le lit pas.
- 5 tests unitaires avec un faux `navigator.xr` (démarrage, refus de permission, fin de session, placement, détection).

## Compatibilité attendue (non testée sur appareil)

- Chrome pour Android sur un téléphone compatible ARCore avec « Services Google Play pour la RA » installés.
- Pas d’AR WebXR sur iPhone (Safari ne propose pas `immersive-ar`), ni dans la WebView de l’APK Capacitor.

**La compatibilité AR n’est pas annoncée tant qu’elle n’a pas été testée sur un appareil Android réel.**

## Application Android (prévu, non implémenté)

La WebView Android n’expose pas WebXR. Pour l’APK, il faudra un module natif :

- plugin Capacitor maison utilisant **ARCore** (SDK gratuit, licence Apache 2.0 pour le SDK Android) avec un rendu
  natif (par exemple SceneView, Apache 2.0) et le modèle du coach exporté en glTF ;
- la permission `CAMERA` demandée au premier lancement de l’AR seulement ;
- la synchronisation des animations entre le moteur web et le rendu natif est le point le plus coûteux.

Coût : 0 € de licence. Travail important ; à planifier après validation de la Web App.

## Plan de test sur appareil réel

1. Téléphone ARCore (liste officielle Google), Chrome à jour, HTTPS.
2. Détection : message correct sur appareil non compatible et sur ordinateur.
3. Placement au sol, stabilité de l’ancrage en se déplaçant, taille, rotation, recentrage.
4. Séance complète en AR : pause, vitesse, changement d’exercice.
5. Sortie de l’AR, verrouillage de l’écran, appel entrant : la caméra doit s’arrêter.
6. Lumière faible et sol uni : message d’aide si aucune surface n’est détectée.
