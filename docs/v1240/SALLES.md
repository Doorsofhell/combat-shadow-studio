# 1.24.0 · Salles immersives

Demande de Youssef (2026-11-05) : « que le coaching se fasse chacun dans une salle distincte par rapport à sa
discipline… adapter l'ambiance et l'éclairage pour mettre en valeur le coach », puis « une ambiance réaliste pas 3D,
une image… avec des éléments naturels de type mouvement, balancement, lumière ».

## Ce qui a été fait

Aucune image générée par IA n'est disponible dans l'environnement de travail. Les salles sont donc des **rendus photo**
calculés avec Blender (Cycles, lumière physique), modélisés ici sans aucun élément téléchargé, sans marque et sans texte.

| Discipline | Salle | Lumière sur le coach |
|---|---|---|
| Boxe anglaise | salle à l'ancienne : briques, parquet, ring sous ses projecteurs, suspensions industrielles | clé chaude, contour chaud et bleuté |
| Kick-boxing | salle de nuit : tapis noirs bordés de rouge, baies vitrées sur la ville, LED rouges | clé neutre, contour rouge et bleu |
| MMA | académie : tapis noirs, cage octogonale sous lumière froide, lignes LED | clé froide, contour bleu |
| Muay-thaï | camp en bois de nuit : toit en tôle, ring aux cordes gainées, ampoules, végétation | clé ambrée, contour doré |
| Judo | dojo de jour : tatamis, shōji éclairés par le jour, alcôve avec un rouleau sans écriture | lumière douce de jour |
| BJJ | académie : tapis gris bordés de noir (le kimono bleu ressort), murs capitonnés, ceintures au mur | clé blanche, contour bleu |

## Comment ça marche

1. `scripts/salles/salles.py` (Blender, `pip install bpy`) construit chaque salle et la rend en **panorama 360°** vu de
   la place du coach, à 1,4 m du sol. Les sacs suspendus sont rendus à part, éclairés par la salle, en images détourées.
2. `scripts/salles/compose.py` ajoute ce qui fait une photo : halo des lampes, air de la salle plus dense au loin,
   arrière-plan très légèrement flou (le sol sous le coach reste net), grain fin. Il écrit aussi le masque des lampes.
3. Dans l'app (`src/three/rooms/`), le panorama est posé sur un dôme à sol plat (`GroundedSkybox` de three.js) : le sol
   reste au bon endroit sous les pieds quand la caméra tourne. La même image éclaire et se reflète sur le coach. Les
   lampes respirent doucement (masque + petit calcul dans le shader), les sacs se balancent comme des pendules de leur
   longueur, avec une amplitude qui varie comme après un coup.

Régénérer : `python3 scripts/salles/salles.py /tmp/salles [salle…]` puis
`python3 -I scripts/salles/compose.py /tmp/salles public/salles [salle…]` (`QUICK=1` pour un essai rapide,
`RES=3072` pour une résolution plus basse).

## Performance téléphone

- une seule image de fond : 2048×1024 en qualité automatique ou économie, 4096×2048 seulement si la qualité « Haute » est choisie ;
- un masque 1024×512, quelques sacs détourés ; aucune lumière supplémentaire sur le décor ;
- les images des salles ne sont pas préchargées à l'installation : chacune est téléchargée à la première séance de sa
  discipline puis gardée (cache `css-modeles`, comme les coachs) ;
- après un incident graphique (niveau de stabilité > 0), la version 2048 est utilisée.

## Réglage

Réglages › Affichage 3D › **Salle immersive** (activée par défaut). Désactivée, l'entraînement retrouve le fond uni
d'avant. Les autres écrans (accueil, techniques, aperçu du coach) ne changent pas. La réalité augmentée n'affiche pas
la salle.

## Tests

- `src/three/rooms/__tests__/rooms.test.ts` : images présentes et au poids prévu, sacs toujours hors du trajet caméra →
  coach, lumière clé et contour sur le coach, fond sombre, balancement doux.
- `tests/e2e/salles.spec.ts` : la boxe et le MMA s'ouvrent dans leur salle, l'interrupteur ramène le fond uni.

## Limites connues

- Ce sont des rendus 3D photoréalistes, pas des photos : si Youssef fournit ses propres images (IA ou photos libres de
  droits pour un usage commercial), elles peuvent remplacer `fond.webp` / `fond-2k.webp` d'une salle ; il faut alors un
  panorama équirectangulaire 2:1 pris à environ 1,4 m du sol.
- Les objets proches sont projetés sur le dôme : quand la caméra s'éloigne beaucoup du coach (mode libre), le décor
  lointain peut se déformer légèrement.
