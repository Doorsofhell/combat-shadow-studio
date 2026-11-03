# v0.38.0 · Créateur d'enchaînements V2

Demande : Youssef, 2026-10-22 20:37, « Créateur d'enchaînements V2 », avec la plaquette
`maquettes/createur-v2/Plaquette_Enchainements_V2.pdf` (4 écrans). Décision « Entraîner seul » (20:38) : le Créateur
s'ouvre seulement depuis Entraîner, il ne revient pas dans Techniques.

## Constat avant

- `/createur` était un seul écran : l'éditeur, avec la liste « Mes enchaînements » en dessous.
- La liste n'affichait ni les dates, ni l'usage, ni de note. Il n'y avait pas de fiche, pas de duplication, et la
  suppression se faisait sans confirmation.
- Les mouvements n'apparaissaient qu'en texte. Les cartes de « Mes enchaînements » (Entraîner) montraient une image
  du coach.
- Un enregistrement ne gardait que la date de création.

## Écrans

| Écran | Adresse | Barre du bas |
|---|---|---|
| Liste (tuiles) | `/createur` (`?d=`, `?tri=`, `?statut=`) | Retour · Rechercher · Filtrer · Créer · Menu |
| Fiche | `/createur/:id` | Retour · Exécuter · Modifier · Supprimer · Menu |
| Éditeur | `/createur/nouveau?d=` et `/createur/:id/modifier` | Retour · Ajouter · Enregistrer · Annuler · Menu |

- **Tuile** :
  - nom, discipline, nombre de mouvements, pictogrammes (4 au plus, puis « +N ») ;
  - anneau de la note, ou « Non analysé » / « À refaire » ;
  - créé le, modifié le (si modifié), utilisé le ou « Jamais utilisé », nombre d'entraînements ;
  - statut Acquis ou Encore du mal ;
  - le crayon ouvre l'éditeur ; la poubelle demande « Supprimer définitivement cet enchaînement ? » ; toucher la tuile
    ouvre la fiche.
- **Filtres** :
  - disciplines (puces avec icône, en haut de la liste) ;
  - tri : plus récents, plus utilisés ou meilleures évaluations ;
  - statut : acquis ou encore du mal ;
  - recherche par nom.
- **Fiche** :
  - mouvements numérotés dans l'ordre, chacun ouvrant la fiche de la technique ;
  - Exécuter (avec le mode En boucle, Lent et commenté ou Rounds), Modifier, Dupliquer, Supprimer ;
  - l'analyse complète, les informations (dates, usage) et le statut personnel.
- **Éditeur** :
  - nom, discipline, mouvements à monter, descendre ou retirer, vérification de faisabilité (déjà existante) ;
  - aperçu de la note pendant l'édition ;
  - « Ajouter un mouvement » ouvre une grille de pictogrammes (recherche, familles) ;
  - quitter avec des modifications non enregistrées demande confirmation.

Les quatre boutons ajoutés à la barre (plus, crayon, poubelle, disquette, croix) sont dans `NAV_EXTRA_ICONS`
(`src/ui/nav/icons.ts`), dessinés comme ceux de la maquette. Le registre copié de la maquette n'a pas changé : le
test qui le compare caractère par caractère passe toujours.

## Règles de données

`src/ui/screens/creator/actions.ts` et `src/store/custom.ts` :

- **Création** : nouvel identifiant, `createdAt`, analyse enregistrée.
- **Modification** :
  - même identifiant, donc l'historique (`perso-<id>`) et le statut suivent ;
  - `updatedAt` ne change que si le nom, la discipline ou les mouvements changent ;
  - « Enregistrer » sans changement n'écrit rien ;
  - la place dans la liste est gardée.
- **Duplication** : nouvel identifiant, nom « (copie) », aucune statistique, aucun statut et aucune date copiés.
- **Suppression** :
  - l'enchaînement et son statut sont retirés ;
  - l'historique d'entraînement est conservé ;
  - la synchronisation transforme la suppression en marque de suppression sur le compte (`src/account/sync/model.ts`),
    pour qu'un autre appareil ne le fasse pas revenir.
- **Compatibilité** :
  - les enchaînements enregistrés avant la 0.38 gardent leurs données (`updatedAt` et `analysis` sont facultatifs) ;
  - ils s'affichent « Non analysé » jusqu'au bouton « Analyser maintenant », qui ne change pas leurs dates.

## Statut Acquis / Encore du mal (extension de la maîtrise)

Le statut réutilise le mécanisme de maîtrise des techniques (`goals.mastery`, v0.24), sous la clé
`combo:<id>`, avec les mêmes valeurs : `acquise` (Acquis) ou `a-revoir` (Encore du mal).

- Un second appui sur le même état l'annule.
- Les comptes de maîtrise de Progrès comptent des techniques précises (`masteryCount`). Ils ne sont pas changés par
  ces clés.
- Limite connue : comme la maîtrise des techniques, ce statut n'est pas encore synchronisé avec le compte. Il reste sur
  l'appareil.

## Analyse locale

`src/domain/comboAnalysis.ts` calcule l'analyse sur l'appareil, à partir de règles fixes et lisibles. Elle n'utilise
ni IA générative, ni réseau, ni service payant. Le même enchaînement donne toujours le même résultat.

| Critère | Poids | Ce qui est mesuré |
|---|---|---|
| Cohérence | 25 % | contrôles du créateur (`validateSequence`) : −40 par erreur, −12 par point d'attention |
| Fluidité | 20 % | transitions : alternance avant/arrière, changement de distance sans pas, projection sans déséquilibre avant (judo), retour en garde au milieu |
| Variété | 15 % | part de mouvements différents (60 %) et nombre de familles, jusqu'à 3 (40 %) |
| Défense / sécurité | 20 % | frappe : finir par une défense ou un déplacement ; judo : finir équilibré ; JJB : protection au sol |
| Faisabilité | 20 % | longueur (idéal 3 à 6), 4 coups de pied ou plus, technique demandant un partenaire |

- La fiche affiche :
  - la note globale (moyenne pondérée) et le verdict ;
  - chaque critère avec sa note et ce qui a été mesuré ;
  - les points forts, les points faibles, les conseils (qui nomment de vraies techniques de la discipline) ;
  - l'explication du calcul et les limites.
- **Invalidation** : l'analyse enregistrée garde l'empreinte (`hash`) de la discipline et des mouvements, et la version
  des règles. Si les mouvements ou les règles changent, l'anneau affiche « À refaire ». Un enregistrement depuis
  l'éditeur la recalcule.
- **Limites** (écrites sur la fiche) :
  - l'analyse juge l'ordre des mouvements, pas l'exécution ;
  - ses règles sont générales ;
  - elle ne tient pas compte de l'adversaire, de la morphologie ni de la condition physique.

## Pictogrammes

`src/ui/pictos/` contient un pictogramme vectoriel neutre par technique : les 91 techniques ont le leur.

- **Comment ils sont produits** :
  - ils sont calculés depuis les vraies animations du moteur, au moment le plus marqué du geste (`analyseMotion`) ;
  - ils sont projetés en 2D, avec le membre qui travaille en rouge ;
  - la génération se fait une fois, avec `PICTOS_WRITE=1`, vers `techniquePictos.json`, utilisable hors ligne.
- **Aucune image du coach** : pas de visage, pas de tenue, pas de morphologie.
- **Technique inconnue** : un symbole de famille avec son nom, jamais une posture inventée.
- **Où ils servent** : liste, fiche, éditeur, grille d'ajout, et les cartes « Mes enchaînements » d'Entraîner (qui
  montraient avant une image du coach).
- **Test** (`pictos.test.ts`) : chaque technique a son pictogramme, il correspond à l'animation actuelle, et tous les
  points tiennent dans le cadre.

## Tests

- **Vitest** :
  - `comboAnalysis.test.ts` (10) : déterminisme, poids, explication et limites, cohérence, défense, adaptation à la
    discipline, fluidité, variété, empreinte, états ;
  - `creator/__tests__/actions.test.ts` (9) : création, modification, place et statut gardés, duplication,
    suppression, ancien enchaînement, filtres et tris ;
  - `pictos.test.ts` (3) et `nav.test.ts` (barres, adresses, icônes ajoutées).
- **Playwright** :
  - `createur-v2.spec.ts` (5) : liste et barre, création avec la grille et le réordonnancement, modification (même
    enchaînement, statut gardé), annulation avec confirmation, duplication puis suppression confirmée avec
    l'historique conservé ;
  - `app.spec.ts`, `entrainer-techniques.spec.ts` et `contrast.spec.ts` sont mis à jour pour les nouvelles adresses.
- **Résultats** : voir le journal (`docs/JOURNAL_CORRECTIONS.md`, entrée v0.38.0).

## Captures

Le dossier `captures/` contient la liste, la fiche, l'éditeur et la grille d'ajout, en thème sombre et clair
(393 × 851).
