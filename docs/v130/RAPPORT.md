# Version 1.3.0 : consignes enchaînées sous le coach

Demande de Youssef (28/10/2026) : « A avec un enchaînement temporisé des consignes pour gain de place », puis « mode Enchaîné ==> OK » (maquette https://claude.ai/artifact/Wdig7YyuCP15ShMhbHkBpN). Même jour, avec une capture : « on voit le bouton s'entraîner grisé inactif mais qui masque les options de visualisation ».

Point de restauration : `restauration/avant-v130` (= 1.2.0, a2d8b1d). Branche : `feature/consignes-v130`.

## Ce qui change

- **Pendant la séance**, une seule consigne à la fois sur le sol, sous les pieds du coach : la consigne principale, puis chaque point clé, puis on recommence. Au-dessus de la ligne : « Consigne » ou « Point clé n », le nom du mouvement et « 3 / 6 ». En dessous : un trait par consigne, celui en cours se remplit en rouge.
- **Temps par consigne** : 3,5 s par défaut, 2,5 s ou 5 s au choix dans Réglages › Coach et entraînement › Consignes pendant la séance. Le même réglage propose « Point du moment », qui garde l'affichage d'avant la 1.3.0 (le point clé de la phase jouée, sous le nom du mouvement) : rien n'est retiré.
- **Enchaînement de plusieurs mouvements** : un nouveau mouvement ne coupe jamais une ligne en cours de lecture ; il prend la bande à la fin de la ligne, et chaque mouvement reprend là où il en était. Une combinaison rapide passe donc quand même par tous ses points clés.
- **Pause** : l'enchaînement s'arrête (le trait passe en gris) et reprend au même point. En affichage normal, la liste complète revient sous la scène comme avant ; en plein écran, la bande reste, arrêtée.
- **Plein écran** : la bande reste, juste au-dessus de la commande principale.
- **Le texte ne couvre jamais le coach** : la hauteur de la bande est mesurée et la caméra cadre le coach dans la partie au-dessus (`inset` de `StudioStage`). La bulle du Coach IA et la légende des repères montent au-dessus de la bande.
- **Jour et nuit** : le sol de la scène est sombre dans les deux modes (« Lumière vive ») ; la bande garde donc un fond sombre et un texte clair dans les deux.
- **Fiche technique** :
  - « S'entraîner » n'est plus jamais grisé. Constat : 67 couples technique/discipline n'avaient aucun exercice qui les travaille (par exemple le high kick avant en MMA), donc le bouton était inactif. Correction : la technique s'ouvre seule dans une séance (`/entrainement?tech=…&d=…`, `techniquePlan` dans `src/ui/training/plan.ts`).
  - Les angles de caméra étaient sous le gros bouton à l'ouverture de la page. Correction : en portrait, la hauteur de la scène est calculée pour que le coach, les flèches, la vitesse et les angles tiennent au-dessus de la barre du bas.

Fichiers : `src/ui/training/ConsigneBand.tsx`, `src/ui/screens/Training.tsx`, `src/ui/training/training.css`, `src/store/settings.ts` (`consignes`, `consigneSec`), `src/ui/screens/Settings.tsx`, `src/ui/screens/Library.tsx`, `src/ui/styles.css`, `src/three/StudioStage.tsx` (relevé de test seulement : position du sol à l'écran).

## Captures

`docs/v130/captures/` : avant le départ, séance (2 moments), plein écran, en mode nuit (`*-dark.png`) et jour (`*-light.png`) ; `fiche-technique.png`.

## Tests

Voir la fin de ce fichier, complétée après la suite complète.
