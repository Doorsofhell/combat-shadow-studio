# Coachs 3D : audit et refonte, lot 13 (v0.23.0)

Demandes du 19 octobre 2026 : « Correction biomécanique et refonte visuelle des coachs 3D » (17 h 16) et
« Refonte premium des combattants 3D, zéro régression » (18 h 24, avec deux captures du studio sur téléphone).
Branche de travail `feature/coachs-realisme`, point de restauration `restauration/lot-13`, version précédente
intacte sur `restauration/lot-12` (v0.22.0).

Statuts utilisés : **implémentée**, **testée auto** (tests automatiques réussis), **testée appareil** (vrai
téléphone), **partielle**, **à faire**. Aucun élément de ce lot n'est « testé appareil » : je n'ai pas de
téléphone Android ou iOS dans cet environnement.

## 1. Audit de l'architecture existante

| Couche | Où | Constat |
|---|---|---|
| Moteur 3D | three.js + React Three Fiber + drei | Conservé. Babylon.js a été comparé puis écarté le 19 octobre (décision de Youssef). |
| Géométrie | `public/models/coach_{male,female}[_manga].glb` | Corps MakeHuman (données CC0) produits par `tools/generator/build.py` (Blender + MPFB2, outils non livrés). Quatre fichiers : deux pour Encre/Manga, deux pour Réaliste. Pas de compression Draco (le module `bpy` de pip ne la contient pas). |
| Squelette | Mixamo de MPFB, 52 os, identique homme/femme | Mesuré au chargement par `src/engine/rig.ts`. |
| Morphologie | `src/three/customize.ts` (curseurs) + `src/three/pose.ts` (longueur des jambes) | Les curseurs déplacent la peau le long de la normale, région par région, dans le shader : aucun os ne bouge. |
| Animation | `src/engine/` (poses écrites, `MotionSampler`, cinématique inverse dans `CoachRig`) | Animations procédurales, pas de fichiers d'animation. Mêmes animations dans tous les rendus. |
| Contraintes | `rig.ts` (genou, coude), `balance.ts` (équilibre), `limits.ts` (nouveau, cheville) | Avant ce lot : aucune limite de cheville. |
| Matériaux, rendu | `src/three/manga.ts` (Encre, Manga), `CoachModel.tsx` (Réaliste) | Encre : hachures calculées à partir de la position du pixel à l'écran. Réaliste : autre modèle, sans la personnalisation. |
| Vêtements | `customize.ts` : coques découpées dans le corps | Coque décalée le long de la normale du corps, bord sans épaisseur, peau dessinée dessous. |
| Persistance | `src/store/fighters.ts` (combattants), `src/store/settings.ts` (réglages) | IndexedDB, local à l'appareil. |
| Pages | Studio `/combattant` (`CoachStudio`, `coach/Preview`), Entraînement (`Training` → `CoachStage`), fiches techniques, RA, `#/lab` (captures) | Toutes passent par `CoachStage` → `CoachModel`, sauf le Lab. |

Dépendances : `CoachStage` choisit le modèle et le rendu, `CoachModel` charge le GLB, applique les matériaux et
crée le `Customizer`, puis le `CoachRig` (squelette mesuré) reçoit les poses du `ComboPlayer`. Le studio, les
fiches et l'entraînement partagent donc tout le chemin.

## 2. Défauts identifiés (constat après vérification)

| # | Défaut | Vérification | Cause |
|---|---|---|---|
| 1 | Pied tourné d'environ 40° par rapport au tibia en garde | Angles lus sur le squelette animé (`src/engine/joints.ts`) | Direction de la rotule déduite d'une flexion de repos de 6° : 16° vers l'intérieur chez l'homme, 11° vers l'extérieur chez la femme |
| 2 | Pied retourné au front kick (torsion jusqu'à 175°, inversion jusqu'à 176°) | Même mesure, 288 animations × 49 instants × 2 coachs | Orientation du pied en l'air écrite dans le repère du monde, sans lien avec le tibia |
| 3 | Pied d'appui plié vers le haut jusqu'à 63° (limite en charge ≈ 40°), éversion jusqu'à 106° | Même mesure | Aucune limite de cheville, talon jamais levé |
| 4 | Hachures sur la peau et les vêtements (« surface déchirée ») | Captures du 19 octobre, shader | Hachures en espace écran (`gl_FragCoord`), espacées de 8 pixels |
| 5 | Réaliste sans la personnalisation du combattant | Avertissement affiché dans le studio | Autre modèle 3D, créateur désactivé |
| 6 | Vêtements « peints » | Captures zoomées (dos, 3/4, encolure) | Bord sans épaisseur ; coque qui suit chaque creux musculaire ; peau dessinée sous le tissu ; bas du t-shirt découpé le long de la frontière des os du bassin et des cuisses (dents dans le bas du dos) ; encolure et bandes calculées avec des normales bruitées (bords en escalier) ; ceinture du short qui traverse le t-shirt |
| 7 | Combattant petit et pieds cachés dans le studio | Capture du 19 octobre | Aperçu de 38 % de la hauteur, cadrage sur toute la toile, y compris sous les boutons |
| 8 | Musculature peu volumineuse | Captures | Le relief des muscles est une carte de normales : il change la lumière, pas la silhouette. **Non corrigé dans ce lot** (voir limites) |

## 3. Solutions retenues

### Rendu : un modèle, deux looks

- Ultra-réaliste et Encre utilisent **le même GLB**, le même squelette, les mêmes vêtements, les mêmes curseurs et
  les mêmes animations. Seuls les matériaux changent.
- Changer de look ne recrée plus le squelette : `CoachModel` garde la scène et remplace les matériaux. Le lecteur
  et l'animation en cours continuent, la séance n'est pas perdue (test de bout en bout).
- **Ultra-réaliste** : peau physique (sheen, clearcoat léger, relief anatomique en carte de normales), tissus mats
  avec un léger sheen, gants vernis, reflets doux d'un studio calculé sur l'appareil (`RoomEnvironment` de three.js,
  rien n'est téléchargé, fonctionne hors ligne). En qualité « Économie », matériaux standard et pas de reflets.
- **Encre** : trois tons avec transitions lissées sur environ un pixel, relief anatomique qui découpe les tons,
  ombres légèrement froides, contre-jour chaud sur la silhouette, contour encré. Plus aucune hachure.
- **Rendu précédent conservé** : Réglages > « Version du rendu 3D » > « Précédente (secours) » remet exactement le
  rendu v0.22 (Encre à hachures, Manga, Réaliste séparé, vêtements v0.22). Retour arrière sans mise à jour.
- Choix mémorisé dans les réglages de l'appareil (pas de changement des données des combattants, donc pas de
  migration). Sélecteur au même format dans Réglages, dans le studio (onglet Combattant, groupe « Rendu ») et dans
  les options d'entraînement.

### Chevilles et pieds

- Rotule : direction prise sur l'axe du pied au repos (talon → orteils), identique pour toutes les morphologies.
- Pied en l'air : angles anatomiques **par rapport au tibia** (flexion plantaire, inversion, rotation, orteils),
  écrits dans les poses de coup de pied, puis limités en douceur à l'amplitude clinique.
- Pied à plat : le sol commande, la jambe s'adapte : le genou tourne au-dessus du pied, le talon se lève autour de
  la base des orteils quand la cheville plierait au-delà de 40°, le pied roule sur son bord au-delà de l'inversion
  ou de l'éversion. Le pied d'appui ne glisse pas (test existant conservé).
- Amplitudes (`src/engine/limits.ts`) : valeurs cliniques usuelles de l'AAOS reprises par Norkin & White
  (dorsiflexion 20°, flexion plantaire 50°, inversion 35°, éversion 15°, orteils 70°/40°), 40° de dorsiflexion en
  charge. Je ne les ai pas relues en ligne pendant ce lot : à vérifier sur la source.
- Front kick avant : armé du genou, cheville préparée (flexion plantaire 25°, orteils relevés 35°), extension avec
  la base des orteils (45°, orteils 65°), retour. Chiffres mesurés dans `MESURES_CHEVILLES.md`.

### Vêtements

- **Tissu drapé** (shorts, t-shirt, débardeur) : la surface est lissée pour passer au-dessus des creux entre les
  muscles, puis maintenue entre 0,75 et 1,6 fois son épaisseur au-dessus de la peau : jamais dans le corps,
  jamais flottante. Normales du tissu recalculées et soudées le long des coutures de texture.
- **Bord épais** : une bande de tissu relie la coupe à la peau, sur tout le bord (bas, manches, encolure, cuisses),
  dans le même maillage (aucun appel de dessin en plus).
- **Peau masquée sous les vêtements opaques** à plus de 1,5 cm du bord : le corps ne peut plus traverser le tissu
  quand une articulation se plie, et la carte graphique dessine moins.
- **Superposition** : un haut porté sur un short passe au-dessus de sa ceinture, et la partie du short cachée par le
  t-shirt n'est plus dessinée (ni son contour).
- Bas du t-shirt à hauteur régulière sur les fesses et le haut des cuisses ; encolure calculée sur la position
  autour du cou ; bandes latérales nettes et lissées.
- Rien n'a été agrandi pour cacher un défaut : les épaisseurs sont celles de v0.22.

### Studio

- Aperçu plus haut (46 % de l'écran au lieu de 38 %).
- Le combattant est cadré dans la partie de l'aperçu que les boutons laissent libre, et centré dedans.
- Cadrages Corps, Visage, Buste, Jambes (jambes et pieds) en plus des vues Face, Profil, Dos, 3/4 et de la rotation
  libre à 360°.

## 4. Ressources open source et licences

| Ressource | Licence | Usage |
|---|---|---|
| three.js (dont `RoomEnvironment`) | MIT | Déjà utilisé. Reflets du rendu Ultra-réaliste. |
| React Three Fiber, drei | MIT | Déjà utilisés. |
| MakeHuman / MPFB2 | Données CC0, outils GPL non livrés | Déjà utilisés pour les corps. |

Aucune nouvelle dépendance, aucun service payant. Évalués sans intégration dans ce lot :

- `@pixiv/three-vrm` (MIT) pour des coachs VRoid : en attente des deux modèles .vrm demandés le 18 octobre.
- glTF-Transform (MIT) pour compresser les GLB (meshopt) : gain à mesurer dans un lot dédié.
- Vêtements MakeHuman (CC0) : téléchargement refusé par le réseau de cet environnement
  (`files.makehumancommunity.org`). Les vêtements restent produits par notre code.

## 5. Fichiers modifiés

- Moteur : `src/engine/rig.ts`, `limits.ts` (nouveau), `joints.ts` (nouveau), `pose.ts`, `motion.ts`,
  `library/legs.ts`.
- Rendu : `src/three/CoachModel.tsx`, `CoachStage.tsx`, `StudioStage.tsx`, `StudioEnvironment.tsx` (nouveau),
  `manga.ts`, `customize.ts`.
- Interface : `src/ui/components/CoachLookPicker.tsx` (nouveau), `src/ui/screens/Settings.tsx`, `Training.tsx`,
  `CoachStudio.tsx`, `coach/FighterPanel.tsx`, `coach/Preview.tsx`, `coach-studio.css`, `src/ui/Lab.tsx`.
- Réglages : `src/store/settings.ts` (champ `coachRender`, valeur par défaut pour les anciens réglages).
- Tests : `src/engine/__tests__/ankle-range.test.ts` (nouveau), `engine.test.ts`, `src/three/__tests__/pose.test.ts`,
  `customize.test.ts`, `src/test/ankles.ts` (nouveau), `tests/e2e/coach-render.spec.ts` (nouveau).
- Documents : ce fichier, `docs/audit-biomecanique/MESURES_CHEVILLES.md` (nouveau, généré), mesures régénérées.

Fichiers 3D (GLB) : **inchangés**.

## 6. Améliorations visuelles

- Encre : plus de hachures ni de lignes de pli bruitées ; tons nets, contours encrés, relief des muscles conservé.
- Ultra-réaliste : même corps et même tenue que le combattant créé (couleur de peau, cheveux, tatouages, vêtements,
  protections), matériaux physiques, reflets doux.
- Vêtements : épaisseur visible aux bords, tissu qui ne colle plus à chaque muscle, plus de peau qui traverse,
  bandes nettes, t-shirt posé sur le short.
- Studio : combattant plus grand, jamais sous les boutons, gros plans du visage, du buste, des jambes et des pieds.

## 7. Corrections biomécaniques

Mesures complètes : `docs/audit-biomecanique/MESURES_CHEVILLES.md` (générées par le test, avant = v0.22.0).

| Pire valeur, coach homme | v0.22.0 | v0.23.0 | Référence |
|---|---|---|---|
| Pied à plat : dorsiflexion | 62° | 43° | 40° en charge |
| Pied à plat : torsion pied/tibia | 109° | 22° | ≈ 15° |
| Pied en l'air : flexion plantaire | 85° | 50° | 50° |
| Pied en l'air : inversion | 172° | 28° | 35° |
| Pied en l'air : torsion | 178° | 15° | ≈ 15° |
| Front kick avant : torsion du pied | 145° | 0° | 0° |

Six techniques au sol (sprawl, sortie de hanche, relevé technique, pont, rétention de garde, changement de base)
dépassent encore l'amplitude du pied à plat (jusqu'à 27°). Le test les borne à leur valeur actuelle : elles ne
peuvent pas empirer. Elles seront reprises avec le lot des techniques au sol.

## 8. Tests

Voir l'entrée v0.23.0 de `docs/JOURNAL_CORRECTIONS.md`.

## 9. Comparaisons avant/après

30 planches (15 techniques × 2 coachs ; colonnes Encre v0.22, Encre v0.23, Réaliste v0.22, Ultra-réaliste v0.23 ;
lignes préparation et instant clé, même angle et même instant) : dossier du projet
`combat-shadow-studio/captures/coachs-v0.23.0/`. Quatre exemples dans `docs/captures-coachs/`.

Techniques : garde, jab, direct, crochet, uppercut, esquive, front kick, teep, middle kick, low kick, high kick,
pas latéral, pivot, changement de niveau, sprawl. Les vues face, profil et dos sont contrôlées dans le studio (tests
de cadrage) et par des captures ciblées, pas sur chaque planche.

## 10. Limites restantes

| Sujet | Statut | Détail |
|---|---|---|
| Anatomie en volume (muscles sculptés, mains, pieds détaillés) | à faire | Les volumes viennent toujours de MakeHuman ; le relief est une carte de normales. Il faut un lot sur le générateur (cibles sculptées ou relief déplacé dans la géométrie, mains et pieds plus fins). |
| Plis du tissu, coutures | partielle | Drapé et bords épais faits ; ni plis modélisés ni coutures. Pas de simulation textile (coût mobile). |
| Bord de l'encolure | partielle | Plus régulier, mais il suit encore la résolution du maillage du cou. |
| Peau Ultra-réaliste | partielle | Couleur choisie par le joueur sur la texture du style Encre : moins de variations que la texture réaliste de v0.22. |
| Techniques au sol | partielle | Six techniques hors amplitude du pied à plat (voir 7). |
| Références du front kick | à faire | Capture de Youssef non reçue ; sources pédagogiques non consultées pendant ce lot. |
| Amplitudes articulaires | partielle | Valeurs AAOS / Norkin & White reprises de mémoire, à relire sur la source. Hanches, épaules, poignets, colonne : contraintes existantes (genou, coude, équilibre), pas de nouvelles limites dans ce lot. |
| Performances Android | à faire | Moins de pixels dessinés (peau masquée sous les vêtements), pas de modèle Réaliste séparé à télécharger dans le nouveau rendu, reflets désactivés en qualité Économie. Rien n'est mesuré sur un vrai téléphone. |
| Validation sur appareil | à faire | Aucun test sur un vrai téléphone dans cet environnement. Le rendu précédent reste disponible dans les réglages. |
