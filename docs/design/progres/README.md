# Combat Shadow Studio — Référence UX Progrès

## Objectif
Refondre l'écran Progrès actuel pour ne montrer que l'essentiel, avec une esthétique sport premium et des anneaux circulaires cohérents avec le chronomètre existant.

## Références visuelles à déposer dans ce répertoire
- `docs/design/progres/Combat_Shadow_Studio_Plaquette_Progres.pdf` — plaquette de 10 écrans (2 423 678 octets).
- `docs/design/progres/maquettes-progres-10-ecrans.png` — planche de 10 écrans (1 796 189 octets).

Ces deux fichiers ont été ajoutés au dépôt en v0.39.0, copiés tels quels depuis les pièces jointes de la conversation. La réalisation est décrite dans `docs/v039/PROGRES_V2.md`.

## Les dix écrans de référence
1. Vue d'ensemble : un anneau central, au plus trois indicateurs secondaires, bouton pour reprendre l'entraînement.
2. Périodes : 7 jours, 30 jours, 90 jours, 12 mois, sélection claire.
3. Activité : détail du temps actif et historique, histogramme en second niveau.
4. Techniques : anneau de maîtrise, répartition maîtrisées/en cours/à revoir.
5. Disciplines : liste compacte, anneau miniature par discipline, détails au clic.
6. Enchaînements : anneau et trois mesures utiles, accès au détail.
7. Condition physique : **ne pas afficher de scores inventés** ; afficher uniquement des mesures réelles ou omettre cet écran.
8. Objectifs : uniquement objectifs explicitement définis par l'utilisateur, jamais des valeurs supposées.
9. Historique : dernières séances en liste simple, détail au clic.
10. Séance : durée, discipline, mouvements et statistiques réellement mesurées.

## Règles UX
- Ne pas juxtaposer tous les indicateurs et graphiques.
- Écran principal : 1 grand anneau + 2 à 3 KPI maximum + 1 action principale.
- Tout détail secondaire doit être accessible par interaction.
- Reprendre les composants, palettes, espacements et animations du chronomètre existant.
- Garder les six disciplines et les filtres pertinents.
- Utiliser uniquement des données calculées à partir des séances réellement enregistrées.
- Ne pas inventer calories, fréquence cardiaque, intensité, forme physique ou objectifs.
- Ne pas modifier les données historiques, le moteur sportif ou la logique des entraînements.
- Préserver navigation Android/PWA, accessibilité, états vides et petits écrans.

## Réalisation
Auditer les écrans et stores actuels avant modification. Développer en branche dédiée, tester TypeScript, unitaires, parcours utilisateur et régressions, puis ouvrir une PR sans fusion automatique.
