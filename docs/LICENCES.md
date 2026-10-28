# Ressources externes et licences

| Ressource | Origine | Licence | Coût | Usage |
| --- | --- | --- | --- | --- |
| Maillage humain de base, cibles de morphologie, squelette « mixamo » de MPFB | MakeHuman / MPFB2 (github.com/makehumancommunity) | Ressources : CC0 1.0. Le code de MPFB (GPL v3) sert seulement à générer le modèle, il n’est pas distribué avec l’application | 0 € | corps des deux coachs |
| Yeux « high-poly » et texture d’iris | dépôt makehuman (system assets) | CC0 1.0 | 0 € | yeux |
| Peau, cheveux, short, brassière | générés par nos scripts (`tools/generator/build.py`, relief `anatomy.py`) | propriété du projet | 0 € | textures et vêtements |
| Texture de mèches des hair cards (cheveux, barbe, sourcils, poils) | générée par notre script `tools/generator/groom/atlas.py` (mèches tracées une à une) | propriété du projet | 0 € | pilosité réaliste (v0.29) |
| Avatars « Sports_Male_01 » et « Sports_Female_01 » (maillage, squelette, textures photo de la tête et du corps) | Microsoft Rocketbox Avatar Library, github.com/microsoft/Microsoft-Rocketbox (dossier `Assets/Avatars/Professions`) | MIT, © 2020 Microsoft (texte joint : `public/coaches/LICENSE-ROCKETBOX.txt`) ; usage commercial permis, avis de copyright à conserver | 0 € | coachs Kadir et Amara en Ultra-réaliste (v0.29) ; textures retouchées par `tools/generator/rocketbox/recolor.py` (cheveux, barbe, teint, yeux, tenue), squelette renommé par `convert.py` |
| Visuels studio (vignettes des techniques, illustrations de l’encyclopédie, visuels des disciplines, portraits des coachs) | rendus de nos coachs 3D par `scripts/visuels/generate.mjs`, salle d’ambiance dessinée par le code (`scripts/visuels/compose.py`) : aucune photo ni image externe | propriété du projet | 0 € | toutes les images de coach de l’application (1.3.1) |
| Peaux photo `young_asian_male` et `young_caucasian_female`, yeux `brown` et `bluegreen`, sourcils `eyebrow009` et `eyebrow003`, cils `eyelashes02` (system assets), tresse `braid01` (pack hair01) | MakeHuman Community, files.makehumancommunity.org (packs `makehuman_system_assets_cc0`, `hair01_cc0`, `eyebrows01_cc0`, `eyelashes01_cc0`) | CC0 1.0 (« _cc0 » dans le nom de chaque pack) ; les packs hair02 et hair03 (CC-BY) ne sont pas utilisés | 0 € | coachs Axel et Kaila en Ultra-réaliste (1.6.0), assemblés par `tools/generator/makehuman/build_photo.py` : teint, cheveux plaqués, sous-vêtements et tatouage peints par nos scripts |
| Animations | écrites dans `src/engine/library` | propriété du projet | 0 € | toutes les techniques |
| Décodeur Draco | three.js (`public/draco`) | Apache 2.0 | 0 € | prévu pour compresser les modèles plus tard (non utilisé aujourd’hui) |
| three.js, React, React Three Fiber, drei, Zustand, idb-keyval, React Router | npm | MIT | 0 € | application |
| Sons | synthétisés en direct (Web Audio) | aucun fichier | 0 € | cloche, bips |
| Voix | synthèse vocale du système (Web Speech API) | voix installées sur l’appareil | 0 € | annonces |

Aucune ressource payante n’est utilisée. Le nom « mixamorig » des os vient de la convention de nommage du squelette
généré par MPFB ; aucun fichier ni animation Adobe Mixamo n’est utilisé.

## Options étudiées et non retenues pour l’instant

- **Adobe Mixamo** (personnages et animations gratuits) : licence d’utilisation libre dans un produit, mais animations
  génériques (interdites par le cahier des charges) et téléchargement manuel avec un compte Adobe.
- **Ready Player Me / Avaturn** : avatars stylisés, conditions d’utilisation commerciales à vérifier, dépendance à un service.
- **Capture de mouvement** (Rokoko, Move.ai) : meilleure qualité possible pour les gestes, mais abonnement payant
  (environ 20 à 30 € par mois selon l’offre) et un pratiquant à filmer. Le moteur actuel peut recevoir ces animations plus tard.
- **Personnages Character Creator / Daz** : très réalistes mais licences de redistribution payantes et lourdes pour le web.
