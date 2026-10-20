# Inventaire des icônes

Généré par `node scripts/icon-inventory.mjs` à partir du code : chaque icône du registre (`src/ui/icons/registry.ts`) et chaque endroit où elle est affichée. « Aucun » veut dire que l’icône est dessinée et prête, mais qu’aucun écran ne l’utilise encore (fonction absente de l’application, ou réservée).

## Disciplines (`DisciplineIcon`, 6 icônes)

Boxe anglaise : gant de boxe · Kick-boxing : protège-tibia · MMA : gant à doigts ouverts · Muay-thaï : mongkol · Jiu-jitsu brésilien : ceinture noire à barrette rouge · Judo : judogi et ceinture noire.

Emplacements (10) : components/Cards.tsx:16, components/DisciplineArtwork.tsx:76, screens/Builder.tsx:56, screens/Champions.tsx:1159, screens/Discipline.tsx:84, screens/Home.tsx:139, screens/Library.tsx:75, screens/Train.tsx:65, screens/progress/Dashboard.tsx:180, screens/progress/Dashboard.tsx:597

## Navigation (7)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `home` | Accueil | App.tsx:99 |
| `train` | Entraîner | App.tsx:100, screens/Onboarding.tsx:136, screens/account/Profile.tsx:277 |
| `techniques` | Techniques | App.tsx:101, screens/Library.tsx:34, screens/Library.tsx:546 |
| `coach` | Coach | coach-ai/CoachBubble.tsx:112 |
| `coachAi` | Coach IA | screens/account/Profile.tsx:422 |
| `progress` | Progression | App.tsx:102, screens/Onboarding.tsx:142 |
| `legends` | Légendes | App.tsx:104, screens/Champions.tsx:232, screens/Library.tsx:36, screens/Library.tsx:180 |

## Accès rapides et menus secondaires (14)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `programs` | Programmes | screens/Home.tsx:268, screens/Library.tsx:39, screens/Library.tsx:249 |
| `combos` | Enchaînements | screens/Library.tsx:35 |
| `challenges` | Défis (réservé, aucun écran) | Aucun |
| `favorite` | Favori | components/Cards.tsx:77, components/Cards.tsx:95, screens/Champions.tsx:72, screens/Champions.tsx:228, screens/Discipline.tsx:42, screens/Discipline.tsx:167, screens/Library.tsx:38, screens/Library.tsx:412 |
| `favoriteOutline` | Ajouter aux favoris | screens/Champions.tsx:72, screens/Discipline.tsx:167, screens/Library.tsx:412 |
| `history` | Historique | screens/Champions.tsx:229, screens/Home.tsx:98, screens/Home.tsx:208, screens/progress/Dashboard.tsx:165 |
| `search` | Recherche | screens/Champions.tsx:227 |
| `filters` | Filtres | screens/Champions.tsx:359, screens/progress/Dashboard.tsx:161 |
| `collection` | Collection | screens/Champions.tsx:231 |
| `library` | Bibliothèque | Aucun |
| `calendar` | Séances, objectifs | screens/progress/Dashboard.tsx:141, screens/progress/Dashboard.tsx:201 |
| `compose` | Créer un enchaînement | screens/Library.tsx:37, screens/Library.tsx:190, screens/Library.tsx:250 |
| `trophy` | Légendes du combat (distinction) | Aucun |
| `dumbbell` | Exercice | Aucun |

## Compte et réglages (18)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `profile` | Profil | screens/Home.tsx:111, screens/Settings.tsx:198, screens/account/Profile.tsx:173, screens/account/Profile.tsx:175, screens/account/SignIn.tsx:194 |
| `settings` | Réglages | screens/CoachHistory.tsx:31, screens/Home.tsx:114, screens/Settings.tsx:238, screens/Training.tsx:554 |
| `notifications` | Notifications (réservé, aucun écran) | Aucun |
| `download` | Télécharger, exporter | screens/Settings.tsx:171, screens/Settings.tsx:254, screens/account/Profile.tsx:456 |
| `upload` | Importer | screens/Champions.tsx:233, screens/Settings.tsx:174 |
| `subscription` | Abonnement (réservé, aucun écran) | Aucun |
| `help` | Aide | Aucun |
| `accessibility` | Accessibilité | screens/account/Profile.tsx:406 |
| `language` | Langue | Aucun |
| `audio` | Voix et sons | screens/Settings.tsx:240 |
| `mute` | Son coupé | Aucun |
| `display` | Affichage 3D | screens/Settings.tsx:242 |
| `theme` | Apparence | screens/Settings.tsx:220 |
| `offline` | Hors ligne | Aucun |
| `privacy` | Confidentialité | screens/Onboarding.tsx:148, screens/Privacy.tsx:11, screens/Settings.tsx:166, screens/Settings.tsx:253, screens/Settings.tsx:255, screens/account/Profile.tsx:429, screens/account/Profile.tsx:452, screens/account/SignIn.tsx:208 |
| `textSize` | Taille du texte | Aucun |
| `signOut` | Se déconnecter | screens/account/Profile.tsx:224 |
| `fighter` | Mon combattant | screens/Onboarding.tsx:364, screens/Settings.tsx:239, screens/account/Profile.tsx:78, screens/account/Profile.tsx:272 |

## Commandes d’entraînement (23)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `play` | Lecture | components/Playback.tsx:11, screens/Builder.tsx:120, screens/Builder.tsx:142, screens/Champions.tsx:108, screens/Champions.tsx:298, screens/Champions.tsx:813, screens/Champions.tsx:1001, screens/Champions.tsx:1086, screens/Discipline.tsx:146, screens/Home.tsx:97, screens/Home.tsx:158, screens/Home.tsx:170, screens/Library.tsx:362, screens/Programs.tsx:110, screens/Training.tsx:567, screens/Training.tsx:571, screens/Training.tsx:619, screens/Training.tsx:623, screens/coach/Preview.tsx:254, screens/progress/Dashboard.tsx:139, training/Study.tsx:194 |
| `pause` | Pause | components/Playback.tsx:11, screens/Training.tsx:575, screens/Training.tsx:627, screens/coach/Preview.tsx:254, training/Study.tsx:190 |
| `stop` | Arrêt | Aucun |
| `replay` | Recommencer | screens/Training.tsx:560 |
| `repeat` | Répétition en boucle | screens/Settings.tsx:241 |
| `slow` | Ralenti | screens/Library.tsx:370, screens/Training.tsx:550 |
| `speed` | Vitesse normale | Aucun |
| `forward` | Avance | Aucun |
| `stepBack` | Précédent | screens/Library.tsx:440, screens/Training.tsx:563, screens/Training.tsx:614, training/Study.tsx:178 |
| `stepForward` | Suivant | screens/Library.tsx:453, screens/Training.tsx:579, screens/Training.tsx:632, training/Study.tsx:199 |
| `decompose` | Décomposer le mouvement | screens/Champions.tsx:830, screens/Champions.tsx:1002, screens/Training.tsx:534 |
| `fullscreen` | Plein écran | screens/Training.tsx:400 |
| `camera` | Caméra | screens/Training.tsx:381 |
| `rotateLeft` | Tourner à gauche | screens/Training.tsx:511 |
| `rotateRight` | Tourner à droite | screens/Training.tsx:514 |
| `zoomIn` | Zoomer | screens/Training.tsx:520 |
| `zoomOut` | Dézoomer | screens/Training.tsx:517 |
| `hideUi` | Masquer l’interface | Aucun |
| `showUi` | Afficher l’interface | Aucun |
| `ar` | Réalité augmentée | screens/Training.tsx:342 |
| `target` | Recentrer, objectif | screens/Stats.tsx:40, screens/Training.tsx:523, screens/progress/Dashboard.tsx:140, screens/progress/Dashboard.tsx:152 |
| `mic` | Dicter | coach-ai/CoachAskPanel.tsx:233 |
| `send` | Envoyer | coach-ai/CoachAskPanel.tsx:237 |

## Actions (21)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `random` | Au hasard | screens/Champions.tsx:300, screens/Champions.tsx:1087, screens/Library.tsx:94 |
| `add` | Ajouter, créer | screens/Champions.tsx:552, screens/Champions.tsx:965, screens/Discipline.tsx:108, screens/Programs.tsx:42, screens/Train.tsx:100, screens/coach/FighterPanel.tsx:86, screens/coach/panels.tsx:216 |
| `edit` | Modifier | screens/Builder.tsx:139, screens/Settings.tsx:217 |
| `duplicate` | Dupliquer | screens/Champions.tsx:948, screens/Champions.tsx:962, screens/coach/FighterPanel.tsx:59 |
| `delete` | Supprimer | screens/Builder.tsx:145, screens/Champions.tsx:591, screens/Champions.tsx:724, screens/CoachHistory.tsx:74, screens/Settings.tsx:186, screens/account/Profile.tsx:461, screens/coach/FighterPanel.tsx:66, screens/coach/panels.tsx:251, screens/coach/panels.tsx:296 |
| `share` | Partager (réservé, aucune fonction) | Aucun |
| `save` | Enregistrer | screens/Builder.tsx:117 |
| `sync` | Synchroniser | screens/account/Profile.tsx:443 |
| `link` | Lien | Aucun |
| `details` | Détails | screens/Champions.tsx:230, screens/Settings.tsx:244, screens/account/Profile.tsx:232 |
| `info` | Informations, comment faire | screens/Training.tsx:546 |
| `back` | Retour | coach-ai/SuggestRail.tsx:90, components/PageHead.tsx:17, screens/Training.tsx:330, screens/Training.tsx:499 |
| `chevron` | Ouvrir | coach-ai/SuggestRail.tsx:108, components/Cards.tsx:100, components/Cards.tsx:132, components/SettingsPanel.tsx:40, screens/Champions.tsx:826, screens/Champions.tsx:974, screens/Home.tsx:179, screens/Home.tsx:236, screens/Home.tsx:258, screens/Home.tsx:284, screens/Library.tsx:205, screens/Library.tsx:259, screens/Programs.tsx:37, screens/Settings.tsx:249, screens/Train.tsx:42, screens/Train.tsx:80, screens/Train.tsx:115, screens/Training.tsx:505, screens/progress/Dashboard.tsx:614 |
| `chevronDown` | Déplier | screens/Champions.tsx:826 |
| `close` | Fermer | coach-ai/CoachAskPanel.tsx:149, coach-ai/CoachAskPanel.tsx:188, coach-ai/CoachBubble.tsx:112, components/KickboxingStyle.tsx:57, components/Sheet.tsx:49, screens/Builder.tsx:67, screens/Training.tsx:527 |
| `confirm` | Confirmer | Aucun |
| `cancel` | Annuler | Aucun |
| `minus` | Retirer | components/KickboxingStyle.tsx:58, screens/Champions.tsx:602 |
| `grid` | Vue grille | Aucun |
| `list` | Vue liste | Aucun |
| `compare` | Comparer | Aucun |

## Statuts et niveaux (18)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `verified` | Vérifiée | screens/Champions.tsx:27 |
| `adapted` | Adaptée | screens/Champions.tsx:27 |
| `inspired` | Inspirée | screens/Champions.tsx:27 |
| `pending` | À valider | Aucun |
| `free` | Gratuit (réservé) | Aucun |
| `premium` | Premium (réservé) | Aucun |
| `locked` | Verrouillé (réservé) | Aucun |
| `downloaded` | Téléchargé (réservé) | Aucun |
| `check` | Fait, sélectionné | components/KickboxingStyle.tsx:55, components/KickboxingStyle.tsx:56, components/Toast.tsx:28, screens/CoachSelect.tsx:34, screens/coach/FighterPanel.tsx:47 |
| `mastered` | Technique assimilée | components/Playback.tsx:61, screens/Library.tsx:387, screens/progress/Dashboard.tsx:745 |
| `struggling` | Encore du mal, à revoir | components/Playback.tsx:61, screens/Library.tsx:104, screens/progress/Dashboard.tsx:749, screens/progress/Dashboard.tsx:763 |
| `star` | Étoile vide | Aucun |
| `starFilled` | Étoile pleine | Aucun |
| `flame` | Série | Aucun |
| `bolt` | Intensité | screens/Champions.tsx:123, screens/Champions.tsx:299, screens/Home.tsx:99 |
| `shield` | Protection, sécurité | screens/account/Profile.tsx:374 |
| `wrench` | À corriger | Aucun |
| `trend` | Progression guidée | Aucun |

**Total** : 101 icônes d’interface dont 68 affichées, et 6 icônes de discipline affichées à 10 endroits.
