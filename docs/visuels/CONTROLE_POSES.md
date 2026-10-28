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

## 1.3.2 · Encyclopédie

- **Wai kru** : les genoux flottaient au-dessus du tapis ; pieds reculés (z −0,4) et bassin baissé, vérifié par le
  test `illustrations.test.ts` (genoux à moins de 10 cm du sol sur Kadir et Amara).
- **Échauffement** : bras tendus devant, puis au-dessus de la tête, puis ouverts ; image prise au milieu (bras levés).
- **Styles de kick-boxing** : trois coachs (high kick, low kick, genou), l'homme tourné de −35° pour que les trois
  silhouettes ne se cachent pas.
- **Soumission** (main qui tape) : seule, la pose ne se lisait pas ; reportée au lot 4 avec un partenaire.

## 1.4.1 · Scènes à deux de l’Encyclopédie

Chaque scène a été rendue, regardée, corrigée puis rendue de nouveau (quatre à cinq passes). Le test
`src/engine/__tests__/duo-illustrations.test.ts` vérifie qu'aucune articulation ne passe sous le tapis et que les deux
corps sont bien ensemble sans être l'un dans l'autre.

- **Montée** : les genoux d'Amara passaient sous le tapis (détecté par le test) ; bassin remonté, pieds reculés.
- **Garde fermée** : les jambes de Kadir restaient cachées dans le corps d'Amara (chevilles trop loin, genoux presque
  tendus) ; Amara rapprochée, chevilles croisées plus bas dans son dos, vue de trois quarts.
- **Demi-garde** : lisible seulement vue depuis les jambes (az 20, plongée 35°).
- **Genou sur le ventre** : la jambe gauche, trop loin, ne pouvait pas toucher le sol et faisait descendre les
  hanches (elle paraissait assise) ; pied rapproché, genou orienté vers le ventre.
- **Clé de bras** : la version « depuis la garde » ne se lisait pas ; refaite en juji-gatame classique, couchée en
  travers, jambes sur le buste et le visage, bras tendu entre les cuisses, pouce vers le haut.
- **Triangle** : le buste de Kadir restait haut et les jambes d'Amara passaient dans son dos ; buste plongé, tête
  basse sur sa poitrine, vue depuis le côté où la jambe verrouille.
- **Kesa-gatame** : Amara penchait du mauvais côté (signe du roulis) ; elle s'appuie maintenant sur son buste.
- **Arbitre qui compte** : Kadir paraissait accroupi ; genou droit posé au tapis.
- **Ippon** : sous la veste du costume, la chemise entière traversait le tissu ; remplacée par un plastron visible
  dans le V seulement.
