# Coachs fidèles aux planches (prototype 2.4.0)

Rapproche le visage d'un coach Rocketbox de sa planche de personnage, sur son propre modèle (squelette, poids,
25 expressions et animations gardés). Outils de fabrication seulement, rien n'est livré dans l'application.

- `references/` : planches de Youssef (images générées, personnages originaux). `premier-envoi-*` : premier envoi
  dont les prénoms ne correspondaient pas (non utilisé).
- `glb.py` : lecture et réécriture d'un photo.glb à l'identique (accesseurs et images remplacés).
- `raster.py` : rendu de face et rasterisation dans l'espace uv.
- `reperes.py` : 478 repères du visage (MediaPipe Face Landmarker ; modèle `face_landmarker.task`, Apache 2.0,
  téléchargé depuis storage.googleapis.com/mediapipe-models, non versionné ; `pip install mediapipe`, `libegl1`).
- `visage.py config.json` : forme et texture du visage, teint, et en option tempes poivre et sel, barbe courte, iris.
  Les configurations utilisées sont dans `configs/` (remplacer `task` par le chemin du modèle ; `src` = modèle
  d'origine archivé dans `_ARCHIVES_HORS_APPLICATION/anciens-modeles-3d/avant-coachs-fideles-v240/`).
- `victor/` : textures livrées de Victor (contrôlées par `victor-peau-v1452.test.ts`).
