# Menu Progrès : calculs et règles

Écran `src/ui/screens/progress/Dashboard.tsx`, calculs `src/domain/progress.ts` (tests
`src/domain/__tests__/progress.test.ts` et `tests/e2e/progress-dashboard.spec.ts`).

## Données utilisées

Uniquement les séances enregistrées sur l'appareil (`css-stats`), sans aucune modification : une ligne par
séance et par exercice, avec le temps actif (les pauses ne sont jamais comptées), les répétitions, la discipline,
le niveau et l'exercice. Le nouvel état `css-progress-view` ne garde que la vue choisie (discipline, période,
filtres, onglet) et la taille du parcours vue la dernière fois. L'effacer ne supprime aucune séance.

## Périodes

- 7 jours, 30 jours, 90 jours, 12 mois (365 jours) : la période se termine aujourd'hui et elle est marquée
  « en cours » puisqu'elle n'est pas finie.
- Période personnalisée : du jour de début au jour de fin, inclus.
- La période précédente a toujours le même nombre de jours et se termine la veille du début. Deux périodes de
  longueurs différentes ne sont jamais comparées.
- Les jours sont des jours du calendrier local. Une séance à 23 h 30 compte pour ce jour-là, et un changement
  d'heure n'ajoute ni ne retire de jour. Les tests tournent dans quatre fuseaux horaires.

## Comparaison

| Mesure | Calcul |
|---|---|
| Temps actif | somme des secondes actives |
| Séances | nombre de débuts de séance distincts (une séance de 3 exercices compte une fois) |
| Répétitions | somme des répétitions |
| Exercices distincts | nombre d'exercices différents |
| Jours actifs | jours avec au moins une séance |
| Régularité : plus longue pause | plus longue suite de jours sans séance, comptée à partir du premier jour d'entraînement (les jours avant la première utilisation ne sont pas une pause) et jusqu'à aujourd'hui |

- La période précédente contient une valeur : écart absolu et pourcentage. Un écart de moins de 5 % s'affiche
  « stable ».
- La période précédente est vide : « Nouvelle activité ». Aucun pourcentage n'est calculé à partir de zéro.
- Les deux périodes sont vides : « Aucune donnée ».
- La plus longue pause n'est comparée que si les deux périodes contiennent des séances, sinon « non comparable ».
- États : flèche montante (vert discret), flèche horizontale (gris), flèche descendante (orange discret), toujours
  avec des mots. Pour la pause, plus court est mieux.
- Ces chiffres décrivent le volume et la régularité. Une baisse de temps n'est pas présentée comme une baisse de
  niveau, et la qualité d'exécution n'est jamais mesurée.

## Jauge du parcours

- Parcours : les techniques des exercices du programme de la discipline (ou de toutes), du niveau si un niveau est
  filtré, selon le style de kick-boxing choisi. Les techniques réservées au travail avec partenaire n'y sont pas.
- Une technique est « étudiée » dès qu'elle fait partie d'un exercice pratiqué (programme, combinaison
  personnelle ou fiche du catalogue), jusqu'à la fin de la période affichée. Le temps passé ne fait pas monter la
  jauge.
- La période indique le nombre de techniques étudiées pour la première fois pendant la période (et pendant la
  période précédente, dans le détail).
- Si le parcours change de taille (nouvelles techniques), l'écran garde l'ancien total et l'explique dans le
  détail : les techniques étudiées restent, seul le pourcentage change.
- Une combinaison personnelle supprimée ne permet plus de connaître ses techniques : elles ne sont pas comptées
  (le détail l'indique), son temps reste dans les statistiques.

## Graphiques

- Activité : colonnes appariées, période actuelle (rouge) et période précédente (bleu), un axe en minutes,
  légende, valeur au toucher, tableau pour les lecteurs d'écran. Une colonne par jour jusqu'à 14 jours, par
  semaine jusqu'à 120 jours, puis par tranche d'environ un douzième de la période (30 jours pour 12 mois). La
  colonne du jour en cours est plus claire. La paire rouge et bleue a passé le contrôle des couleurs (daltonisme,
  contraste) sur fond sombre et clair.
- Niveaux et Catégories : temps de la période actuelle et de la précédente, par ligne, avec l'évolution. Les
  catégories sont les types d'exercice (technique, combinaison, défense, déplacement, cardio, round) ; les
  combinaisons personnelles et du catalogue comptent comme combinaisons.
- Exercices : les plus pratiqués, avec le temps, les répétitions et le nombre de séances.
- Historique : les séances de la période et des filtres, avec le détail de chaque séance.
- Chaque onglet affiche ce qui tient dans l'écran ; « Voir tout » ouvre la liste complète.

## Mise en page

Une seule hauteur d'écran, sans défilement vertical : hauteur visible moins la barre de navigation et la zone de
gestes d'Android. Testé en 360×640, 360×740 et 412×915, thèmes clair et sombre. Téléphone couché (hauteur de moins
de 520 px) : l'écran ne peut pas tout contenir, la page défile.

## Fonctions conservées

Objectifs personnels (temps actif et jours par semaine, modification) et techniques favorites : page
« Objectifs » (`/objectifs`), bouton cible en haut du menu. Historique complet : bouton horloge (`/historique`).
Le graphique « semaines / mois » de l'ancien écran est remplacé par l'onglet Activité avec les périodes 90 jours
et 12 mois.
