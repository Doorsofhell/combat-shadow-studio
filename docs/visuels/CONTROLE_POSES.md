# Contrôle des poses des visuels studio

Consigne de Youssef (2026-10-28) : « les positions doivent être humaines et réalistes ». Chaque rendu a été regardé
sur une planche (`scripts/visuels/planche.py`) : 182 vignettes (91 techniques × 2 coachs), 56 illustrations de
l'encyclopédie (trois instants chacune), 6 visuels de discipline et 2 portraits.

## Résultat

| Famille | Vérifiées | Corrigées |
| --- | --- | --- |
| Vignettes des techniques | 182 | 4 (sprawl et sit-out, pour les deux coachs) |
| Encyclopédie | 56 | 2 (tech-sprawl, tech-sit-out : mêmes corrections) |
| Visuels des disciplines | 6 | 1 (judo) |
| Portraits | 2 | 0 |

Les coups de poing, défenses, déplacements, coups de pied, genoux, coudes, clinch, entrées de lutte, travail au sol
et techniques de judo font humains au moment clé : appuis au sol, buste et bras cohérents, pas de membre tordu.

## Corrections (scripts/visuels/poses.json et recipes.mjs)

- **Sprawl** : vu de côté, au moment clé les tibias restent levés en l'air, genoux pliés, au lieu des jambes tendues
  en arrière avec les orteils au sol. Ce n'est pas un problème de capture : l'animation du moteur est ainsi (pose
  « flat » de `src/engine/library/mma.ts`). Correction des images : vue de face (`az` 8°), hanches au sol, mains en
  appui ; on ne voit plus les tibias levés. **À corriger dans le moteur** (lot à part, l'animation se voit aussi à
  l'entraînement).
- **Sit-out** : au moment clé le corps paraît flotter de côté, une jambe lancée, sans appui visible. Correction :
  l'instant où la main est posée et la hanche commence à tourner (`at` 0,71).
- **Visuel du judo** : l'entrée d'o-soto-gari seule, penchée sur une jambe, se lisait mal en grand. Remplacée par la
  garde de saisie (kumi-kata), plus stable et plus représentative du judo.

## Limites connues

- Ce sont des rendus 3D retouchés, pas des photos : de près, on voit que les visages et la peau sont de la 3D.
- Les tenues sont celles des coachs (pas de t-shirt ni de bandes de main pour l'instant).
- La lumière principale vient toujours de la droite : c'est voulu, toutes les images se ressemblent ainsi.
