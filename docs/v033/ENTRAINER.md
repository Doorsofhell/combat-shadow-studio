# v0.33 — Refonte premium de l'écran Entraîner

Demande de Youssef du 2026-10-22 (« Refonte premium de l'écran Entraîner + nouvelle identité graphique des six
disciplines »). Branche `feature/entrainer-premium-v033`, partie de `feature/combat-shadow-v030` (v0.32.0 publiée).
Point de restauration : `restauration/avant-entrainer-v033`.

Les coachs 3D, les animations, le moteur et la barre de navigation de la v0.32 ne sont pas modifiés. Seule la
transparence de la barre a été réduite (voir plus bas).

## Ce qui change à l'écran

L'écran présentait quatre sections à la suite : Démarrage rapide, Disciplines, Programmes (3 sur 10) et Mes
enchaînements. Il est maintenant organisé en trois espaces, sélectionnés par un contrôle segmenté en haut de page.
Le dernier espace choisi est retenu. On peut aussi ouvrir un espace par lien direct (`#/entrainer?espace=programmes`).

| Espace | Contenu |
| --- | --- |
| **Séances** (par défaut) | Carte de reprise (4 états), deux séances de démarrage rapide, Mes enchaînements avec « Créer un enchaînement » |
| **Disciplines** | Les 6 disciplines en cartes compactes. Chaque carte montre le niveau réel du profil et une barre de progression réelle : exercices déjà pratiqués sur le nombre d'exercices de ce niveau. |
| **Programmes** | Les 10 programmes complets. Filtres combinables : discipline, niveau, durée, objectif. Un bouton « Filtres (n) » regroupe niveau, durée et objectif. Compteur de résultats et bouton « Réinitialiser ». Chaque programme affiche son statut : en cours (avec %), fait N fois ou pas encore commencé. |

- Les cartes disciplines mesurent 184 px de haut au lieu de 240 px (−23 %).
- Le Coach IA reste accessible par le Menu, comme en v0.32. Aucun bouton flottant n'a été ajouté.
- La barre du bas reste celle de la v0.32. Elle est maintenant presque opaque : `--nav-bg` passe à 0,985 au lieu de 0,94 (sombre) et 0,95 (clair), le texte ne transparaît plus.
- Le dernier élément de chaque espace reste visible au-dessus de la barre (test e2e en 360 × 640).

## Reprise de séance : sauvegarde et restauration

### États de la carte de reprise

La carte ne montre que des données enregistrées. Rien n'est inventé.

| État | Quand | Action |
| --- | --- | --- |
| `reprendre` | une séance interrompue de moins de 30 jours existe, et son exercice existe encore | **Reprendre** : même exercice, même round, même phase, même chrono |
| `programme` | un programme a été suivi dans les 14 derniers jours, sans séance interrompue | **Continuer** le programme |
| `nouvelle` | il y a un historique, mais rien à reprendre | **Commencer une séance** |
| `premiere` | aucun historique | **Choisir une séance** |

### Ce qui est enregistré (`src/domain/resume.ts`)

Une « photo » de la séance est enregistrée. Elle contient :

- l'exercice, sa place dans le plan, le round et la phase ;
- le temps écoulé dans la phase, le temps de séance et le temps de travail fait ;
- la vitesse, le coach, la caméra ;
- l'heure de début et l'heure d'enregistrement.

Elle est enregistrée :

- à la pause ;
- à chaque changement de phase, de round ou d'exercice ;
- toutes les 15 s d'activité ;
- à la fermeture de l'écran.

À la fin d'une séance, la photo est supprimée. Pour un programme, la séance terminée est comptée (« fait N fois »).

### Où elle est rangée (`src/store/resume.ts`)

- **IndexedDB**, clé `css-resume`, rangée par utilisateur comme l'historique.
- **Copie synchrone dans localStorage**, clé `css-resume-mirror:<utilisateur>`. L'écriture IndexedDB est asynchrone : une application fermée juste après « Pause » aurait pu garder une photo plus ancienne. La copie est toujours la plus récente, c'est elle qui est lue au démarrage ; IndexedDB sert de secours.
- Une donnée corrompue ou d'un ancien format est ignorée sans plantage. Seules les photos valides sont gardées : 5 au maximum, de moins de 30 jours.
- Supprimer une photo ne touche jamais l'historique (`css-stats`). Aucune clé existante n'a été supprimée ni renommée.

### Restauration (`src/ui/screens/Training.tsx`, `src/ui/training/useSession.ts`)

- « Reprendre » ouvre `#/entrainement?…&reprise=1`. L'écran attend que le stockage soit chargé, puis relit la photo.
- La séance repart en pause au bon endroit, chronomètres réglés. `ActiveTimer.seed` remet le temps de séance.
- Les statistiques continuent la même séance (même heure de début). Rien n'est compté deux fois.
- Si l'exercice n'existe plus ou ne correspond plus, le dialogue « Reprise impossible » propose de recommencer, sans rien perdre d'autre.

## Matrice d'audit (fonction → composant → changement → risque → test)

| Fonction | Composant | Changement | Risque | Test |
| --- | --- | --- | --- | --- |
| Trois espaces | `Train.tsx`, `train.css`, `settings.trainSpace` | nouveau contrôle segmenté, espace retenu, lien `?espace=` | un lien ancien vers une section disparue | `train-resume.spec` « trois espaces », `app.spec`, `navigation.spec` |
| Carte de reprise | `ResumeCard`, `pickCard` | nouvelle | carte trompeuse si les données sont fausses | `resume.test.ts` (choix de la carte), e2e « reprendre après fermeture » |
| Sauvegarde | `useSession`, `useResume` | nouvelle | séance perdue si l'application est fermée vite | `session-resume.test.tsx` (6 tests), `resume-store.test.ts` (corruption, copie, secours) |
| Restauration | `Training.tsx` | lit `reprise=1` | reprise au mauvais endroit ou double comptage | e2e « même temps après fermeture », « reprise impossible » |
| Démarrage rapide | `Sessions` | déplacé dans Séances | — | `train-resume.spec`, bouton « Démarrer » de la barre (`navigation.spec`) |
| Cartes disciplines | `Disciplines`, `DisciplineEmblem` | −23 % de hauteur, niveau et progression réels, emblème 3D | progression inventée, débordement | `discipline-art.spec`, `emblems.spec`, `bjj-judo.spec`, `contrast.spec` |
| Programmes | `Programmes`, `programMeta.ts` | 10 programmes, filtres combinables, statut | un programme masqué par un filtre resté actif | `programMeta.test.ts`, e2e filtres + réinitialisation |
| Mes enchaînements | `Sessions` | « Créer un enchaînement » toujours visible | — | `train-resume.spec` |
| Coach IA | Menu (v0.32) | inchangé, aucun bouton flottant | doublon de menu | `coach-bubble.spec`, `navigation.spec` |
| Barre du bas | `styles.css --nav-bg` | opacité 0,985 | contraste | `contrast.spec`, `navigation.spec` |

## Tests

Résultats exacts : voir la description de la PR et `docs/JOURNAL_CORRECTIONS.md`.
