# Inventaire des icônes

Généré par `node scripts/icon-inventory.mjs` à partir du code : chaque icône du registre (`src/ui/icons/registry.ts`) et chaque endroit où elle est affichée. « Aucun » veut dire que l’icône est dessinée et prête, mais qu’aucun écran ne l’utilise encore (fonction absente de l’application, ou réservée).

## Disciplines (`DisciplineIcon`, 6 icônes)

Boxe anglaise : gant de boxe · Kick-boxing : protège-tibia · MMA : gant à doigts ouverts · Muay-thaï : mongkol · Jiu-jitsu brésilien : ceinture noire à barrette rouge · Judo : judogi et ceinture noire.

Emplacements (10) : components/Cards.tsx:16, components/DisciplineArtwork.tsx:76, screens/Builder.tsx:56, screens/Champions.tsx:1159, screens/Discipline.tsx:84, screens/Home.tsx:143, screens/Library.tsx:77, screens/Train.tsx:65, screens/progress/Dashboard.tsx:180, screens/progress/Dashboard.tsx:597

## Navigation (7)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `home` | Accueil | App.tsx:99 |
| `train` | Entraîner | App.tsx:100, screens/Onboarding.tsx:136, screens/account/Profile.tsx:279 |
| `techniques` | Techniques | App.tsx:101, screens/Library.tsx:36, screens/Library.tsx:538 |
| `coach` | Coach | coach-ai/CoachAskPanel.tsx:181, coach-ai/CoachAskPanel.tsx:211, coach-ai/CoachBubble.tsx:119, components/ActionPill.tsx:130 |
| `coachAi` | Coach IA | screens/account/Profile.tsx:424 |
| `progress` | Progression | App.tsx:102, screens/Onboarding.tsx:142 |
| `legends` | Légendes | App.tsx:104, screens/Champions.tsx:232 |

## Accès rapides et menus secondaires (14)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `programs` | Programmes | screens/Home.tsx:272, screens/Library.tsx:40, screens/Library.tsx:240 |
| `combos` | Enchaînements | screens/Library.tsx:37 |
| `challenges` | Défis (réservé, aucun écran) | Aucun |
| `favorite` | Favori | components/Cards.tsx:77, components/Cards.tsx:95, screens/Champions.tsx:72, screens/Champions.tsx:228, screens/Discipline.tsx:42, screens/Discipline.tsx:167, screens/Library.tsx:39, screens/Library.tsx:403 |
| `favoriteOutline` | Ajouter aux favoris | screens/Champions.tsx:72, screens/Discipline.tsx:167, screens/Library.tsx:403 |
| `history` | Historique | coach-ai/CoachAskPanel.tsx:246, screens/Champions.tsx:229, screens/Home.tsx:99, screens/Home.tsx:212, screens/progress/Dashboard.tsx:165 |
| `search` | Recherche | screens/Champions.tsx:227 |
| `filters` | Filtres | screens/Champions.tsx:359, screens/progress/Dashboard.tsx:161 |
| `collection` | Collection | screens/Champions.tsx:231 |
| `library` | Bibliothèque | Aucun |
| `calendar` | Séances, objectifs | screens/progress/Dashboard.tsx:141, screens/progress/Dashboard.tsx:201 |
| `compose` | Créer un enchaînement | screens/Library.tsx:38, screens/Library.tsx:181, screens/Library.tsx:241 |
| `trophy` | Légendes du combat (distinction) | Aucun |
| `dumbbell` | Exercice | Aucun |

## Compte et réglages (18)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `profile` | Profil | screens/Home.tsx:112, screens/Settings.tsx:198, screens/account/Profile.tsx:174, screens/account/Profile.tsx:176, screens/account/SignIn.tsx:194 |
| `settings` | Réglages | screens/CoachHistory.tsx:31, screens/Home.tsx:115, screens/Settings.tsx:238, screens/Training.tsx:553 |
| `notifications` | Notifications (réservé, aucun écran) | Aucun |
| `download` | Télécharger, exporter | screens/Settings.tsx:171, screens/Settings.tsx:254, screens/account/Profile.tsx:458 |
| `upload` | Importer | screens/Champions.tsx:233, screens/Settings.tsx:174 |
| `subscription` | Abonnement (réservé, aucun écran) | Aucun |
| `help` | Aide | Aucun |
| `accessibility` | Accessibilité | screens/account/Profile.tsx:408 |
| `language` | Langue | Aucun |
| `audio` | Voix et sons | screens/Settings.tsx:240 |
| `mute` | Son coupé | Aucun |
| `display` | Affichage 3D | screens/Settings.tsx:242 |
| `theme` | Apparence | screens/Settings.tsx:220 |
| `offline` | Hors ligne | Aucun |
| `privacy` | Confidentialité | screens/Onboarding.tsx:148, screens/Privacy.tsx:11, screens/Settings.tsx:166, screens/Settings.tsx:253, screens/Settings.tsx:255, screens/account/Profile.tsx:431, screens/account/Profile.tsx:454, screens/account/SignIn.tsx:208 |
| `textSize` | Taille du texte | Aucun |
| `signOut` | Se déconnecter | screens/account/Profile.tsx:225 |
| `fighter` | Mon combattant | screens/Onboarding.tsx:364, screens/Settings.tsx:239, screens/account/Profile.tsx:79, screens/account/Profile.tsx:274 |

## Commandes d’entraînement (24)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `play` | Lecture | components/Playback.tsx:11, screens/Builder.tsx:120, screens/Builder.tsx:142, screens/Champions.tsx:108, screens/Champions.tsx:298, screens/Champions.tsx:813, screens/Champions.tsx:1001, screens/Champions.tsx:1086, screens/Discipline.tsx:146, screens/Home.tsx:98, screens/Home.tsx:162, screens/Home.tsx:174, screens/Library.tsx:353, screens/Programs.tsx:110, screens/Training.tsx:566, screens/Training.tsx:570, screens/Training.tsx:618, screens/Training.tsx:622, screens/coach/Preview.tsx:261, screens/progress/Dashboard.tsx:139, training/Study.tsx:194 |
| `pause` | Pause | components/Playback.tsx:11, screens/Training.tsx:574, screens/Training.tsx:626, screens/coach/Preview.tsx:261, training/Study.tsx:190 |
| `stop` | Arrêt | Aucun |
| `replay` | Recommencer | screens/Training.tsx:559 |
| `repeat` | Répétition en boucle | screens/Settings.tsx:241 |
| `slow` | Ralenti | screens/Library.tsx:361, screens/Training.tsx:549 |
| `speed` | Vitesse normale | Aucun |
| `forward` | Avance | Aucun |
| `stepBack` | Précédent | screens/Library.tsx:432, screens/Training.tsx:562, screens/Training.tsx:613, training/Study.tsx:178 |
| `stepForward` | Suivant | screens/Library.tsx:445, screens/Training.tsx:578, screens/Training.tsx:631, training/Study.tsx:199 |
| `decompose` | Décomposer le mouvement | screens/Champions.tsx:830, screens/Champions.tsx:1002, screens/Training.tsx:533 |
| `fullscreen` | Plein écran | screens/Training.tsx:397 |
| `exitFullscreen` | Quitter le plein écran | fullscreen/FullscreenStage.tsx:10, screens/Training.tsx:393 |
| `camera` | Caméra | screens/Training.tsx:383 |
| `rotateLeft` | Tourner à gauche | screens/Training.tsx:510 |
| `rotateRight` | Tourner à droite | screens/Training.tsx:513 |
| `zoomIn` | Zoomer | screens/Training.tsx:519 |
| `zoomOut` | Dézoomer | screens/Training.tsx:516 |
| `hideUi` | Masquer l’interface | Aucun |
| `showUi` | Afficher l’interface | Aucun |
| `ar` | Réalité augmentée | screens/Training.tsx:343 |
| `target` | Recentrer, objectif | screens/Stats.tsx:40, screens/Training.tsx:522, screens/progress/Dashboard.tsx:140, screens/progress/Dashboard.tsx:152 |
| `mic` | Dicter | coach-ai/CoachAskPanel.tsx:294 |
| `send` | Envoyer | coach-ai/CoachAskPanel.tsx:298 |

## Actions (25)

| Identifiant | Nom | Emplacements |
|---|---|---|
| `random` | Au hasard | screens/Champions.tsx:300, screens/Champions.tsx:1087, screens/Library.tsx:96 |
| `add` | Ajouter, créer | screens/Champions.tsx:552, screens/Champions.tsx:965, screens/Discipline.tsx:108, screens/Programs.tsx:42, screens/Train.tsx:100, screens/coach/FighterPanel.tsx:86, screens/coach/panels.tsx:216 |
| `edit` | Modifier | screens/Builder.tsx:139, screens/Settings.tsx:217 |
| `duplicate` | Dupliquer | screens/Champions.tsx:948, screens/Champions.tsx:962, screens/coach/FighterPanel.tsx:59 |
| `delete` | Supprimer | screens/Builder.tsx:145, screens/Champions.tsx:591, screens/Champions.tsx:724, screens/CoachHistory.tsx:74, screens/Settings.tsx:186, screens/account/Profile.tsx:463, screens/coach/FighterPanel.tsx:66, screens/coach/panels.tsx:251, screens/coach/panels.tsx:296 |
| `share` | Partager (réservé, aucune fonction) | Aucun |
| `save` | Enregistrer | screens/Builder.tsx:117 |
| `sync` | Synchroniser | screens/account/Profile.tsx:445 |
| `link` | Lien | Aucun |
| `details` | Détails | screens/Champions.tsx:230, screens/Settings.tsx:244, screens/account/Profile.tsx:233 |
| `info` | Informations, comment faire | screens/Training.tsx:545 |
| `back` | Retour | coach-ai/SuggestRail.tsx:90, components/PageHead.tsx:17, screens/Training.tsx:331, screens/Training.tsx:498 |
| `fold` | Replier | components/ActionPill.tsx:94 |
| `panelExpand` | Agrandir la fenêtre | coach-ai/CoachAskPanel.tsx:243 |
| `panelShrink` | Réduire la fenêtre | coach-ai/CoachAskPanel.tsx:232 |
| `quickActions` | Actions rapides (pilule repliée) | components/ActionPill.tsx:94 |
| `chevron` | Ouvrir | coach-ai/SuggestRail.tsx:108, components/Cards.tsx:100, components/Cards.tsx:132, components/SettingsPanel.tsx:40, screens/Champions.tsx:826, screens/Champions.tsx:974, screens/Home.tsx:183, screens/Home.tsx:240, screens/Home.tsx:262, screens/Home.tsx:288, screens/Library.tsx:196, screens/Library.tsx:250, screens/Programs.tsx:37, screens/Settings.tsx:249, screens/Train.tsx:42, screens/Train.tsx:80, screens/Train.tsx:115, screens/Training.tsx:504, screens/progress/Dashboard.tsx:614 |
| `chevronDown` | Déplier | screens/Champions.tsx:826 |
| `close` | Fermer | coach-ai/CoachAskPanel.tsx:186, coach-ai/CoachAskPanel.tsx:249, coach-ai/CoachBubble.tsx:119, components/KickboxingStyle.tsx:57, components/Sheet.tsx:49, fullscreen/FullscreenStage.tsx:24, screens/Builder.tsx:67, screens/Training.tsx:526 |
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
| `mastered` | Technique assimilée | components/Playback.tsx:61, screens/Library.tsx:378, screens/progress/Dashboard.tsx:745 |
| `struggling` | Encore du mal, à revoir | components/Playback.tsx:61, screens/Library.tsx:106, screens/progress/Dashboard.tsx:749, screens/progress/Dashboard.tsx:763 |
| `star` | Étoile vide | Aucun |
| `starFilled` | Étoile pleine | Aucun |
| `flame` | Série | Aucun |
| `bolt` | Intensité | screens/Champions.tsx:123, screens/Champions.tsx:299, screens/Home.tsx:100 |
| `shield` | Protection, sécurité | screens/account/Profile.tsx:376 |
| `wrench` | À corriger | Aucun |
| `trend` | Progression guidée | Aucun |

**Total** : 106 icônes d’interface dont 73 affichées, et 6 icônes de discipline affichées à 10 endroits.
