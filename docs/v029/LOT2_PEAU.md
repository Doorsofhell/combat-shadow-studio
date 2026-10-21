# v0.29.0 · Lot 2 · Peau, visages, yeux, ombres

Style concerné : **Ultra-réaliste** des coachs Kadir et Amara. Le style Anime n'est pas modifié.

## Méthode

| Élément | Avant (lot 1) | Après (lot 2) |
|---|---|---|
| Grain de peau | peau lisse, aspect cire | texture de détail répétée (`public/skin/skin_detail.png`, générée par `tools/generator/skin/detail.py`) : pores, rides fines, petites bosses, en relief |
| Couleur de peau | une teinte unie | marbrures légères, nez, joues et oreilles un peu plus rouges |
| Brillance | identique partout | front et nez un peu plus brillants, pores mats |
| Lumière dans la peau | aucune | lumière qui traverse la peau (diffusion sous la surface, version légère calculée par la lumière enveloppante) : lueur rouge sur la ligne d'ombre, oreilles plus translucides |
| Ombres | aucune ombre portée | ombres douces (bras sur le torse, nez, arcades), seulement en Ultra-réaliste et en qualité haute |
| Éclairage du studio | lumière ambiante forte, visage plat | lumière principale chaude, lumière d'appoint froide, contre-jour, peu d'ambiance |
| Blanc des yeux | taches grises | propre : l'iris est trouvé par sa place sur la texture et non plus par sa couleur |
| Iris | couleur choisie posée à plat (iris noir) | la couleur choisie garde les fibres de l'iris |
| Cils | absents | frange de cils courbés sur le bord de la paupière supérieure |
| Sourcils | traits croisés | poils simples orientés |
| Style par défaut | Anime | Ultra-réaliste (voir plus bas) |

Fichiers : `src/three/skin.ts`, `tools/generator/skin/detail.py`, `public/skin/skin_detail.png`,
`src/three/customize.ts` (yeux, branchement peau), `src/three/groom.ts` (cils, sourcils, `fitSphere`),
`src/three/CoachModel.tsx`, `src/three/StudioStage.tsx`, `src/three/CoachStage.tsx`, `src/store/settings.ts`.

## Cause des taches sur le blanc des yeux (constat vérifié)

Le recoloriage de l'iris (pour la couleur des yeux choisie) cherchait l'iris par sa couleur : « saturé et sombre ».
Les petites veines roses et le bord gris du blanc de la texture passaient le test et étaient repeints en sombre.
Vérification : avec le matériau d'origine sans ce recoloriage, le blanc est propre ; ombres et reflets écartés par
des captures sans ombres et sans environnement. Correction : l'iris est un disque à une place fixe de la texture
(la même texture d'yeux dans tous les modèles, centres mesurés sur l'image).

## Cils

Le maillage des yeux n'est que l'avant du globe (plus de sommets sur l'iris) : son point moyen et son sommet le
plus éloigné ne donnaient ni le centre ni le rayon, et les cils se posaient sur le pli de la paupière. Le centre et
le rayon sont maintenant calculés par une sphère ajustée (`fitSphere`, testée), puis le bord avant de la paupière
est cherché tranche par tranche.

## Ultra-réaliste par défaut

- Nouvelle installation, ou réglages enregistrés sans style : **Ultra-réaliste**.
- Un appareil qui avait déjà un style enregistré **le garde** (« conserver les préférences déjà choisies »).
  Limite : avant la v0.29, l'application enregistrait le style par défaut (Anime) même sans choix de l'utilisateur ;
  on ne peut donc pas distinguer « Anime choisi » de « Anime jamais touché ». Ces appareils restent en Anime ; un
  passage en Ultra-réaliste se fait d'un geste dans Réglages.
- Le style est un réglage de l'appareil, pas du profil : créer un nouveau profil ne le change pas.
- La qualité basse garde le rendu réaliste (moins de poils, pas d'ombres portées) : elle ne bascule jamais en Anime.

## Secours

- Texture de détail de peau absente : peau du lot 1, sans pores.
- Texture de mèches absente : coiffure peinte de la v0.28.

## Limites connues

- Captures prises avec le rendu logiciel du navigateur de test (pas de GPU).
- Non testé sur téléphone ; mesures de performance au lot 5.
- Les cils sont visibles en zoom Visage ; à la distance de l'entraînement ils ne forment qu'un trait sombre.
