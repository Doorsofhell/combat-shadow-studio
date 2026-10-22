# Navigation dynamique v0.32

Mission : « PROMPT MAÎTRE — Refonte intégrale de la navigation dynamique premium — V0.32 » (Youssef, 2026-10-22 12:02).

| Élément | Valeur |
|---|---|
| Référence | `docs/design/navigation-dynamique-reference.html`, copiée sans modification depuis `design/navigation-reference-v032` |
| Branche | `feature/navigation-dynamique-v032`, partie de `feature/tenues-premium-v032` (026c92b, PR #5) |
| Point de restauration | `restauration/avant-navigation-v032` (026c92b) |
| Version | 0.32.0-proto3 |

## 1. Audit de l'ancienne navigation (026c92b)

| Élément | Où | Constat |
|---|---|---|
| Barre d'onglets fixe (5 onglets : Accueil, Entraîner, Techniques, Progrès, Légendes) | `App.tsx`, `NAV` | Les onglets sont toujours les mêmes, quel que soit l'écran. |
| Pilule d'actions flottante (0.26) | `components/ActionPill.tsx` | Une deuxième barre au-dessus de la première (jusqu'à 3 actions, plus le Coach IA et un chevron pour la replier). C'est interdit par la mission. |
| Bulle Coach IA flottante | `coach-ai/CoachBubble.tsx` | Un élément flottant qui recouvre les cartes (réglages, profil, entraînement). |
| Boutons Profil et Réglages dans l'en-tête de l'accueil | `Home.tsx` | Profil et Paramètres isolés dans l'en-tête. C'est interdit par la mission. |
| Bouton retour en haut de chaque page | `PageHead.tsx` (`back`) | Un retour en haut de l'écran. C'est interdit par la mission. |
| Rangée de commandes de l'entraînement | `Training.tsx` (`.controls`, `.tr-secondary`) | 9 boutons sous le coach : Retour, Recommencer, Précédent, Démarrer/Pause/Reprendre, Suivant, Décomposer, Comment faire ?, Ralenti, Options. |
| Bouton Caméra sur la scène | `Training.tsx` (`cam-mode`) | Un deuxième accès, en surimpression sur la scène. |

## 2. Nouvelle architecture (centralisée)

| Rôle | Fichier |
|---|---|
| Registre d'icônes (copie exacte de l'objet `icons` de la maquette, 23 icônes) | `src/ui/nav/icons.ts`, `NavIcon.tsx` |
| Configuration par écran (5 places, Retour en 1 sauf sur l'accueil, Menu en 5) | `src/ui/nav/config.ts` (`NAV_CONFIG`, `TOGGLE`, `NAV_PARENT`, `MENU_ENTRIES`, `navScreen`) |
| Composant de la barre | `src/ui/nav/BottomBar.tsx` |
| Actions de l'écran (chaque écran donne ses actions et ses commandes) | `src/ui/nav/store.ts` (`useNavActions`) |
| Gestionnaire de panneaux (couches d'historique : Retour Android ou navigateur, puis Échap, ferment d'abord le panneau) | `src/ui/nav/layers.ts`, `NavSheets.tsx` (`NavPanel`, `usePanel`) |
| Menu « Navigation générale » et Nouveautés | `src/ui/nav/NavSheets.tsx` |
| Notes de version (version, releaseDate, title, categories, changes, links, isMajor) | `src/domain/releases.ts` |
| Dernière version ouverte | `settings.newsSeenVersion` (nouvelle clé, valeur par défaut `null`, aucune clé existante supprimée) |
| Sélection Technique / Légende (le dernier élément ouvert dans la session) | `src/ui/nav/selection.ts` |
| Mémoire du défilement pour le retour intelligent | `App.tsx` (`ScrollMemory`) |

## 3. Barres par écran

| Écran | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Accueil | Entraîner | Techniques | Progrès | Profil | Menu |
| Entraînement | Retour | Démarrer → Pause → Reprendre | Décomposer | Caméra | Menu |
| Techniques | Retour | Rechercher | Filtres | Technique | Menu |
| Fiche technique | Retour | S'entraîner | Ralenti | Maîtrise | Menu |
| Progrès | Retour | Période | Statistiques | Historique | Menu |
| Légendes | Retour | Rechercher | Disciplines | Légende | Menu |
| Fiche légende | Retour | Parcours | Techniques | Favoris | Menu |
| Profil | Retour | Activité | Coach | Réglages | Menu |
| Paramètres, Confidentialité, Connexion | Retour | Profil | Affichage | Caméra | Menu |
| Entraîner | Retour | Démarrer | Programmes | Techniques | Menu |
| Discipline | Retour | Démarrer | Techniques | Progrès | Menu |
| Programme | Retour | Démarrer | Programmes | Progrès | Menu |
| Combinaison (fiche du catalogue) | Retour | S'entraîner | Décomposer | Favoris | Menu |
| Créateur | Retour | Lancer | Techniques | Entraîner | Menu |
| Historique | Retour | Statistiques | Entraîner | Objectifs | Menu |
| Objectifs | Retour | Statistiques | Historique | Entraîner | Menu |
| Partenaire | Retour | Techniques | Entraîner | Progrès | Menu |
| Coach (choix Kadir/Amara) | Retour | Profil | Entraîner | Réglages | Menu |
| Programmes, Coach IA, autres | Retour | Entraîner | Techniques | Progrès | Menu |

Pas de barre : l'accueil de bienvenue (questionnaire), le premier choix du coach (`/coach?first=1`) et le labo.

## 4. Matrice : ancienne commande → nouvelle commande

| Ancienne commande | Nouvelle place | Fonction conservée | Test |
|---|---|---|---|
| Onglet Accueil | Menu › Accueil | oui | navigation.spec « chaque entrée ouvre sa page » |
| Onglet Entraîner | Accueil place 1, Menu › Entraîner | oui | app.spec, navigation.spec |
| Onglet Techniques | Accueil place 2, Menu › Techniques | oui | navigation.spec |
| Onglet Progrès | Accueil place 3, Menu › Progrès | oui | navigation.spec |
| Onglet Légendes | Menu › Légendes | oui | coach-bubble.spec « Légendes dans le Menu » |
| En-tête de l'accueil › Profil | Accueil place 4, Menu › Profil | oui | navigation.spec |
| En-tête de l'accueil › Réglages | Menu › Paramètres, Profil place 4 | oui | app.spec, account.spec |
| Bouton retour en haut | Place 1 « Retour » (retour intelligent) | oui, avec filtres et défilement | navigation.spec « catalogue… retour intelligent » |
| Bulle Coach IA | Menu › Sur cet écran › Coach IA (sur chaque écran sauf la page Coach IA) | oui : même panneau, mêmes tailles, mêmes questions | coach-bubble.spec, coach-panel-size.spec, coach-suggest.spec |
| Pilule Accueil : Séance rapide, Reprendre, Technique du jour | Menu › Sur cet écran | oui | navigation.spec « actions de l'ancienne pilule » |
| Pilule Techniques : Au hasard, À revoir | Menu › Sur cet écran (À revoir est aussi dans Filtres) | oui | navigation.spec |
| Pilule Fiche : S'entraîner, Ralenti, Je la maîtrise | Places 2, 3, 4 | oui | navigation.spec « fiche ouverte directement » |
| Pilule Légendes : S'entraîner, Combo du jour, Au hasard | Boutons de la carte « Démarrage rapide » de la page | oui | legendes-quick-start.spec |
| Pilule Fiche de combinaison : S'entraîner | Place 2 | oui | legendes-quick-start.spec |
| Pilule Progrès : Nouvelle séance, Objectifs, Période | Place 2 (Période), Menu › Nouvelle séance, Objectifs | oui | progress-dashboard.spec, navigation.spec |
| Chevron pour replier la pilule | supprimé : il n'y a plus de pilule | sans objet | none |
| Entraînement › Retour | Place 1 : la séance se met en pause et une confirmation est demandée (aussi si elle est déjà en pause) | oui, avec confirmation | navigation.spec « séance » |
| Entraînement › Démarrer / Pause / Reprendre | Place 2 (même place, l'icône s'anime) | oui | navigation.spec, training-layout.spec |
| Entraînement › Décomposer | Place 3 | oui | navigation.spec |
| Entraînement › Caméra (bouton sur la scène) | Place 4 | oui | training-layout.spec « zone Caméra » |
| Entraînement › Recommencer, Précédent, Suivant, Comment faire ?, Ralenti, Options | Menu › Sur cet écran | oui | navigation.spec, training-layout.spec, coach-render.spec |
| Entraînement › Plein écran, Réalité augmentée | inchangés, sur la scène | oui | fullscreen-dbltap.spec |
| Retour Android pendant une séance | Ferme d'abord un panneau ouvert, sinon demande confirmation | oui | navigation.spec (retour navigateur) |

## 5. Écarts par rapport à la maquette

1. **Libellés de 10 px au minimum** (la maquette utilise 9,5 px) : c'est la taille minimale lisible déjà utilisée par l'application.
2. **Libellé actif en `--red-ink`** au lieu du rouge pur de la maquette, pour garder un contraste AA en thème clair.
3. **Menu, section « Sur cet écran »** : la maquette n'a pas d'emplacement pour les actions secondaires d'un écran ni pour le Coach IA. Pour qu'aucune fonction ne disparaisse sans barre secondaire, elles sont placées en tête du panneau Menu, au-dessus des 8 entrées.
4. **Parcours (fiche légende)** : la fiche fait défiler jusqu'au profil de style de la légende. Il n'existe pas de données de carrière détaillées, et je n'en ai pas inventé.
5. **« Technique » et « Légende »** ouvrent la dernière technique ou légende ouverte pendant la session. Ce n'est jamais un choix arbitraire : sans sélection, le bouton est désactivé.
6. **Recherche des Légendes** : elle porte sur le nom de la légende. La recherche de combinaisons reste dans l'onglet Explorer de la page.
7. **Démarrage rapide des Légendes** : ses boutons (S'entraîner, Combo du jour, Au hasard) redeviennent des boutons de la carte, comme avant 0.26.
8. **Retour dans le navigateur** : il ferme un panneau ouvert avant de quitter la page (même règle que le bouton Retour d'Android). Pendant une séance, le geste « retour » du navigateur de la PWA ne demande pas de confirmation. Seuls le bouton Retour de la barre et le bouton Retour d'Android la demandent.

## 6. Limites

- Retour haptique : `navigator.vibrate`, disponible sur Chrome Android et dans la WebView. Rien ne se passe sur iOS ou sur ordinateur. **Pas encore testé sur un appareil Android réel.**
- Le bouton Retour d'Android passe par `@capacitor/app`. Il est testé dans le navigateur avec le retour de l'historique, **pas sur un téléphone**.
- Les notes de Nouveautés couvrent les versions publiées depuis 0.24. Elles sont écrites à partir du journal des corrections (aucune note fictive).
