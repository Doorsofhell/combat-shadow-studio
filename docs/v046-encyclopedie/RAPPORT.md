# v0.46.0 · Encyclopédie du combat, version 1.0 · rapport

Demande de Youssef (2026-10-23, « Création de l'Encyclopédie du combat — Version 1.0 ») et maquette `maquettes/encyclopedie-2026-10-23/maquette-encyclopedie.png` (11 vues).

Documents liés, générés à partir des données : [INVENTAIRE.md](INVENTAIRE.md) (fiches, matrice familles × disciplines), [ILLUSTRATIONS.md](ILLUSTRATIONS.md) (provenance et briefs), [SOURCES.md](SOURCES.md).

## 1. Audit de départ (v0.45.1)

| Point | Constat |
|---|---|
| Glossaire ou encyclopédie | aucun écran ; le mot « glossaire » n'apparaissait que dans des commentaires du moteur (sources IJF/Kodokan) |
| Vocabulaire existant | 91 techniques solo et les fiches « avec partenaire » (`src/domain/techniques`, `partner.ts`), chacune avec ses propres textes ; pas de définition des termes eux-mêmes (équipements, lieux, règles, culture) |
| Sources | registre `src/domain/biomech/sources.ts` (fédérations, guides) déjà utilisé par les fiches techniques |
| Favoris | magasin `css-goals` (techniques favorites), aucun favori de terme |
| Menu | grille Profil, Premium, Réglages… : aucune entrée pour une référence |

## 2. Architecture

- **Données** (`src/domain/encyclopedia/`) : `types.ts` (Terme, famille, sous-famille, sections typées règle / convention / variante / conseil / histoire, statut éditorial, provenance d'image), `families.ts` (8 familles et leurs sous-familles), `terms/*.ts` (une fichier par famille), `sources.ts` (sources propres à l'encyclopédie, datées, fusionnées avec le registre existant), `images.ts` (recettes de rendu, scènes, briefs), `index.ts` (index, recherche normalisée, A–Z, couverture, lien technique ↔ terme).
- **Une notion = une fiche** : un nom canonique, ses alias et traductions ; un test refuse un alias partagé par deux fiches et une technique de l'application expliquée par deux fiches.
- **Écrans** (`src/ui/encyclopedia/`) : accueil (recherche, 8 familles), liste (famille, sous-famille, discipline, recherche ; filtres dans l'adresse), fiche (image, noms, disciplines, onglets selon le contenu, sources, provenance), A–Z, favoris. Routes `/encyclopedie…` chargées à la demande.
- **Navigation** : entrée « Encyclopédie » du Menu (livre ouvert, « Dictionnaire illustré des 6 disciplines »), sans Premium ; barre Retour | Classement | A–Z | Favoris | Menu (règle monochrome de la v0.45.1). Retour depuis une fiche revient à la liste avec ses filtres.
- **Liens avec l'application** : « Voir la technique » sur une fiche ; « Comprendre ce terme » sur la fiche technique et la fiche avec partenaire.
- **Favoris** : `favTerms` dans `css-goals` ; un ancien enregistrement sans ce champ reçoit une liste vide (aucune donnée effacée).
- **Hors ligne** : textes et images font partie de l'application (pas d'appel réseau pour lire une fiche) ; les liens vers les sources ouvrent le navigateur.

## 3. Contenu

136 fiches dans 8 familles (détail dans [INVENTAIRE.md](INVENTAIRE.md)). Chaque fiche cite au moins une source avec son adresse et sa date de consultation (71 sources). Aucune fiche n'est présentée comme relue par un expert : le statut affiché est « vérifiée sur ces sources, relecture par un expert : à venir ».

Règles de rédaction appliquées : distinction règle officielle (avec l'organisation citée) / convention / variante / conseil / histoire ; « The Octagon » présenté comme une marque déposée de l'UFC, la fiche s'appelle « Cage » ; les affirmations qu'aucune source consultée ne confirmait ont été retirées (par exemple certaines immobilisations de judo, les couleurs des grades kyu, l'usage du salut) plutôt que laissées sans source.

La base n'est pas exhaustive : elle couvre le vocabulaire courant des 6 disciplines et ce que l'application utilise.

## 4. Illustrations

- **73 produites**, toutes faites dans le dépôt, aucune image téléchargée :
  - rendus du coach Kadir ou Amara dans la tenue de la discipline, en trois instants (début, mi-chemin, moment clé) pour les techniques et déplacements (`scripts/encyclopedie/renders.mjs`, vue Lab, moteur et modèles de l'application) ; un plan rapproché pour les gants de MMA, portés ;
  - scènes Blender (`scripts/encyclopedie/scenes.py`) : gants, protège-tibias, shorts, rashguard, judogi, kimono à partir des tenues des coachs ; ring, cage, aire de tatamis et ceintures modélisés ;
  - composées en WebP 720 × 400 et miniature 160 × 160 (`scripts/encyclopedie/webp.py`).
- **45 à produire** : positions au sol à deux, situations d'arbitrage, objets non modélisés (bandes, protège-dents, casque, sac, pattes d'ours, paos), planches d'anatomie. Chacune a un brief ; l'application affiche « Illustration à produire » à sa place.
- Chaque fiche dit, dans l'onglet Sources, d'où vient son illustration.

## 5. Écarts avec la maquette

| Maquette | Application | Raison |
|---|---|---|
| Titre « Glossaire » sur plusieurs vues | « Encyclopédie », jamais « Glossaire » | demande de Youssef (nom public) |
| Entrée du Menu en ligne avec chevron | carte du Menu sur toute la largeur, avec la description | la grille du Menu (v0.32) reste la même pour toutes les entrées |
| Photos de combattants réels, gants de marque, cage « MMA » | rendus de nos coachs et scènes du dépôt | aucune image sans droits ; aucun logo |
| Fiche Jab : onglets Exécution, Erreurs, Variantes | onglets construits selon le contenu : Définition, sections propres au terme, Par discipline, Sources | la technique détaillée reste dans la fiche technique de l'application (lien « Voir la technique ») ; pas de double texte |
| Gants de boxe : types Entraînement / Sparring / Compétition avec photos | sections texte sourcées | pas de photos produites pour chaque type |
| Anatomie : planches du corps | « Illustration à produire » avec brief | aucune planche anatomique produite dans cette version |
| Barre du bas : Classement en rouge | barre monochrome | règle de la v0.45.1 demandée après la maquette |

## 6. Tests

| Vérification | Résultat |
|---|---|
| TypeScript (`tsc --noEmit`) | RÉUSSI |
| Vitest complet | RÉUSSI : 792 réussis, 1 ignoré, 0 échec (dont 17 tests de l'encyclopédie : une notion = une fiche, alias uniques, sources datées, images existantes, recherche, favoris) |
| Playwright `encyclopedie.spec` (12 tests : Menu, familles, filtres, recherche, Retour, fiche, illustration à produire, A–Z, favoris, 360 × 640 clair et sombre avec axe, Octagon) | RÉUSSI |
| Playwright complet (version compilée) | 198 réussis, 2 ignorés (Firebase), 5 échecs au premier passage : `navigation.spec:51` (le Menu a désormais l'entrée Encyclopédie : test mis à jour, RÉUSSI) ; `encyclopedie.spec:155` clair (contraste mesuré pendant la transition d'entrée : le test attend maintenant la fin de l'animation, RÉUSSI) ; `training-layout:126` (RÉUSSI au second passage) ; `training-layout:325` (caméra Auto, ÉCHOUÉ, déjà en échec avant cette version) ; `coach-suggest:96` (ÉCHOUÉ, échoue aussi sur la v0.45.1 de référence) |
| Coach IA | entrée « L'Encyclopédie du combat » dans le guide, écran `encyclopedie`, deux questions proposées sur cet écran : RÉUSSI |
| Noms réels | l'histoire du JJB ne cite plus le nom de la famille fondatrice (règle : aucun nom des champions de référence dans l'application) : RÉUSSI |
| Android réel | NON EXÉCUTÉ |

## 7. Captures

`captures/` : les vues de la maquette dans l'application (accueil, liste, fiches technique, équipement, lieu, règle, sécurité, A–Z, favoris, Menu) en clair et en sombre, 412 × 915 et 360 × 640.

## 8. Limites

- Aucune relecture par un expert de chaque discipline : prévue, pas faite.
- 45 illustrations à produire (positions au sol à deux, arbitrage, objets non modélisés, anatomie).
- Les règles citées sont celles des documents consultés à leur date ; une fédération peut les modifier.
- Le règlement officiel de l'IBJJF (PDF) n'a pas pu être téléchargé : les points de JJB s'appuient sur une source secondaire, et la fiche le dit.
- Recherche en français et dans les langues des noms d'origine seulement ; pas de recherche phonétique.
