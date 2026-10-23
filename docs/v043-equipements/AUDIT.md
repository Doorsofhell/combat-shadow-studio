# v0.43 · Audit des équipements 3D

Demande de Youssef (2026-10-23, « REFONTE RÉALISTE DES ÉQUIPEMENTS 3D »). Cet audit recense uniquement les équipements qui existent vraiment dans le code et les fichiers 3D, vérifiés un par un.

## 1. Ce qui existe vraiment

### Les coachs

- Le catalogue (`src/domain/coaches/catalog.ts`) contient **2 coachs en 3D** : Kadir (`mma-kadir`) et Amara (`mma-amara`).
- Les « 36 coachs » de la demande n'existent pas comme modèles 3D. La galerie des champions s'appuie sur ces deux corps.
- Les tests « sur les 36 coachs » sont donc faits sur les 2 coachs réels, dans les 7 tenues et les 2 rendus. Aucun autre personnage n'est déclaré testé.

### Deux chaînes d'équipement

| Rendu | Source des équipements | Fichiers |
|---|---|---|
| Ultra-réaliste (par défaut, celui de la capture de Youssef) | fichiers 3D générés par Blender, un par tenue et par coach, liés au squelette du coach | `public/coaches/mma-{kadir,amara}/tenues/*.glb`, générateur `tools/generator/rocketbox/outfits.py`, chargement `src/three/outfit.ts` |
| Anime | pièces construites dans l'application, à partir de primitives | `src/three/customize.ts` (`gloveGeometry`, `boxingGloves`, revêtements « gants-mma », « sous-gants », protège-tibias, chaussures), choix par discipline `src/editor/look.ts` (`recommendedGear`) |

## 2. Inventaire par discipline (Ultra-réaliste)

Mesuré sur les fichiers du dépôt (v0.42.0). Une ligne = une tenue d'un coach.

| Tenue | Kadir : pièces · triangles · appels de dessin | Amara : pièces · triangles · appels de dessin | Contenu |
|---|---|---|---|
| boxe | 10 · 15 680 · 12 | 11 · 20 862 · 14 | short + ceinture, chaussures montantes, 2 gants (4 pièces chacun : moufle, pouce, manchette, sangle) ; brassière (Amara) |
| kick-boxing | 9 · 12 112 · 11 | 11 · 17 038 · 13 | short, 2 gants (4 pièces), protège-tibias ; brassière (Amara) |
| muay-thaï | 10 · 10 672 · 12 | 12 · 15 782 · 14 | short thaï, 2 gants (4 pièces), 2 prajioud (brassards) ; brassière (Amara) |
| MMA | 2 · 7 752 · 3 | 3 · 12 530 · 5 | short MMA, gants ouverts (une coque sur les deux mains) ; brassière (Amara) |
| BJJ (kimono) | 10 · 19 486 · 10 | 11 · 34 896 · 11 | veste, pantalon, jupe de veste, col, ceinture et nœud ; rashguard court (Amara) |
| BJJ (sans kimono) | 3 · 18 542 · 5 | 2 · 19 570 · 2 | rashguard long, short de compression + short (Kadir) ou legging (Amara) |
| judo | 10 · 19 460 · 10 | 11 · 34 784 · 11 | judogi : veste, pantalon, col, ceinture et nœud ; t-shirt court (Amara) |

Rendu Anime (`recommendedGear`) :
- boxe : gants (2 sphères + un tour), chaussures, short ;
- kick-boxing : gants, protège-tibias, short thaï ;
- MMA : gants ouverts peints sur la main ;
- muay-thaï : bandes, chevillères, short thaï ;
- BJJ et judo : short seulement (pas de kimono dans ce rendu).

## 3. Défauts constatés

Captures « avant » : 2 coachs × 7 tenues en Ultra-réaliste + la boxe en Anime, vues de face, profil, trois quarts, gros plan des mains, des pieds, jab et high kick.

### Gants de boxe (priorité 1)

- **Forme** : un œuf aplati pour la moufle et un second œuf pour le pouce. Il n'y a pas de poing (pas de rouleau des doigts, pas de paume creuse, pas de face de frappe). Vus de dos, les gants lisent comme des blocs ronds.
- **Pouce** : posé à côté du poing, sans pli de jonction, il disparaît selon l'angle.
- **Manchette** : un tube ouvert ; au poignet, l'anneau blanc de la sangle flotte autour du tube (visible sur la capture de Youssef).
- **Matière** : relief de cuir faible et régulier, même brillance partout ; pas de couture ni de passepoil.
- **Performance** : 4 pièces par main, soit 8 appels de dessin pour les gants seuls.
- **Anime** : deux sphères et un tour, sans sangle ni forme de poing.

### Chaussures de boxe

- La bande latérale blanche est découpée face par face (condition de position sur les faces) : bord en dents de scie, visible sur la capture de Youssef.
- La semelle n'a ni épaisseur visible ni rebord ; la chaussure suit trop la forme du pied nu.
- 5 748 triangles, plus que le short.

### Shorts

- La ceinture élastique est une bande plate peinte ; sa jonction avec le short est nette mais sans relief de couture.
- Short thaï : les fentes latérales n'existent pas.

### Muay-thaï

- Les prajioud sont un anneau jaune rigide qui flotte autour du bras, sans nœud ni pans.

### MMA

- Les gants ouverts sont une coque collée sur la main : pas de rembourrage sur les phalanges, pas de doigts libres lisibles.

### BJJ et judo

- Kimono et judogi sont complets en Ultra-réaliste (veste, pantalon, col, ceinture nouée).
- En Anime, ils n'existent pas : le coach est en short.

### Ce qui n'existe pas et ne sera pas ajouté d'office

Casque, protège-dents en Ultra-réaliste, coquille, protège-pieds en compétition. La demande dit de ne pas ajouter de protections inadaptées : seules des pièces portées à l'entraînement de la discipline seront proposées, et seulement avec l'accord de Youssef.

## 4. Fichiers de mesure et captures

- Script de capture : `scripts/dev/shot-gear.mjs` (vues : face, profil, trois quarts, mains, pieds, jab, high kick).
- Captures avant : `docs/v043-equipements/captures/avant/`.
