# Bibliothèque des combinaisons de champions

La bibliothèque propose des fiches d’entraînement (« combinaisons ») classées par discipline et par profil de style de champion. Les données sont **séparées du moteur d’animation** : une fiche ne contient que des identifiants de techniques (`src/domain/techniques.ts`) ; le coach 3D joue les animations déjà existantes de ces techniques.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `public/catalog/catalog-v1.json` | Données versionnées (chargées à la demande, mises en cache hors ligne par le service worker) |
| `scripts/build-catalog.mjs` | Générateur déterministe des fiches « inspirées » (aucun accès réseau) |
| `src/domain/catalog/` | Types, chargement, validation, import, recherche, fiche du jour, plan de séance |
| `src/store/catalog.ts` | Favoris, historique, collections et fiches importées (IndexedDB) |
| `src/ui/screens/Champions.tsx` | Écrans : bibliothèque, fiche, profil de champion |
| `src/domain/__tests__/catalog.test.ts` | Tests sur la totalité du catalogue |

## Contenu actuel (version 1.0.0, 17 octobre 2026)

| Discipline | Fiches | Débutant | Intermédiaire | Avancé | Expert |
| --- | ---: | ---: | ---: | ---: | ---: |
| Boxe anglaise | 300 | 70 | 59 | 90 | 81 |
| Kick-boxing | 250 | 51 | 58 | 80 | 61 |
| MMA | 300 | 60 | 83 | 91 | 66 |
| Muay-thaï | 250 | 42 | 67 | 79 | 62 |
| **Total** | **1100** | | | | |

- **Statuts : 0 vérifiée, 0 adaptée, 1100 inspirées.** 1100 fiches jouables en 3D.
- 80 profils de champions (20 en boxe, 20 en kick-boxing, 24 en MMA, 20 en muay-thaï ; Alex Pereira, Superbon, Buakaw Banchamek et Sitthichai Sitsongpeenong ont un profil dans deux disciplines, chaque fiche respecte les règles de sa discipline).
- Longueurs de 2 à 10 mouvements dans chaque discipline ; gardes : 266 orthodoxe, 135 gaucher, 699 les deux.
- Aucune photo ni représentation des champions : seuls leur nom et une description générale de leur style sont utilisés.

## Statuts : règle d’honnêteté

| Statut | Signification | Exigences vérifiées à l’import |
| --- | --- | --- |
| `verifiee` | Séquence observée dans un combat réel | `source.kind = "combat"`, `source.reference` (combat identifié) **et** `source.timestamp` (moment exact) |
| `adaptee` | Dérivée d’une séquence documentée, adaptée au travail solo | `source.kind = "combat"` ou `"document"` et `source.reference` |
| `inspiree` | Combinaison originale reprenant des traits généraux du style | `source.kind = "profil-style"` |

**Aucune attribution n’est inventée.** Il n’a pas été possible de vérifier des images de combat lors de la création du catalogue : toutes les fiches livrées sont donc `inspiree`. Leur source le dit explicitement (« séquence originale, non relevée en combat ») et l’écran l’explique à côté du badge. Les profils de style restent volontairement généraux et peu contestables (ex. Tyson : peek-a-boo, mouvements de tête, crochets et uppercuts ; Mayweather : shoulder roll, pull counter, check hook, jab au corps ; Saenchai : teeps, coups de pied changés ; Khabib : changements de niveau et entrées en lutte). La garde habituelle (`stance`) n’est indiquée que lorsqu’elle est largement connue.

## Format du fichier (schéma 1)

```json
{
  "schema": 1,
  "version": "1.0.0",
  "updatedAt": "2026-10-17",
  "champions": [ { "id": "tyson", "name": "Mike Tyson", "disciplines": ["boxe"], "stance": "orthodoxe",
                   "style": "…", "traits": ["peek-a-boo", "…"], "source": "Profil de style général…" } ],
  "combos": [ { "id": "boxe-tyson-0001", "...": "voir ci-dessous" } ]
}
```

Champs d’une fiche :

| Champ | Contenu |
| --- | --- |
| `id` | Identifiant stable (`discipline-champion-0001`) : minuscules, chiffres, tirets. Ne jamais réutiliser un identifiant pour une autre séquence. |
| `name` | Nom français parlant |
| `discipline` | `boxe`, `kickboxing`, `mma`, `muaythai` |
| `champion` | Identifiant d’un champion qui a un profil dans cette discipline |
| `status`, `source` | Voir ci-dessus ; `source` : `{ kind, note, reference?, timestamp?, url? }` |
| `guard` | `orthodoxe`, `gaucher` ou `les-deux` (le coach inverse automatiquement en gaucher) |
| `level` | `debutant`, `intermediaire`, `avance`, `expert` |
| `distance` | `longue`, `moyenne`, `courte`, `corps-a-corps`, `sol` |
| `sequence` | 2 à 10 identifiants de techniques autorisées dans la discipline |
| `objective` | Objectif pédagogique (unique dans le catalogue livré) |
| `keyPoints` | 2 à 4 points clés |
| `errors` | 2 ou 3 erreurs fréquentes |
| `estimatedSec` | Durée d’une répétition à vitesse réelle (s) |
| `variants` | 1 à 3 variantes `{ label, sequence? }` ; une séquence de variante est validée comme la principale |
| `goal` | `technique`, `cardio`, `puissance`, `defense`, `deplacement` |
| `tags` | Thèmes pour les filtres (`defense-contre`, `corps`, `angle`, `deplacement`, `genoux`, `coudes`, `changement-niveau`, `defense-lutte`, `sol`, `cardio`…) |
| `addedAt` | Date de version `AAAA-MM-JJ` (sert au tri « Récents ») |

L’angle de caméra recommandé n’est pas stocké : il est calculé à l’affichage avec `sequenceView(sequence)` (`src/domain/camera.ts`), ce qui garde les données légères et suit les évolutions de la caméra.

## Validation et « jouable en 3D »

`validateCombo` / `validateCatalogFile` (`src/domain/catalog/validate.ts`) refusent : technique inconnue, technique interdite dans la discipline (ex. coup de pied en boxe, coude hors muay-thaï), enchaînement impossible pour le coach (technique au sol sans descente, séquence qui finit au sol sans relevé technique), champ manquant, statut non justifié, identifiant ou séquence en double.

Une fiche est **jouable en 3D** si toutes ses techniques existent et sont autorisées dans sa discipline et si l’enchaînement est réalisable : le test du moteur (`src/engine/__tests__/engine.test.ts`) garantit qu’il existe une animation pour chaque technique dans chacune de ses disciplines, en garde orthodoxe et gaucher.

## Ajouter ou mettre à jour des fiches sans modifier le code

### Par l’application (import)

Écran **Champions → Importer** : choisir un fichier JSON au format ci-dessus (`"schema": 1`). Les listes `champions` et `combos` sont facultatives mais au moins l’une doit être présente.

- Chaque fiche est validée ; le rapport liste les fiches refusées avec la raison.
- Un champion déjà présent garde son profil officiel ; un nouveau champion peut être ajouté dans le même fichier que ses fiches.
- Réimporter une fiche avec le même `id` la **met à jour**. Les identifiants du catalogue officiel sont protégés.
- **Dédoublonnage** sur (discipline, séquence) : une séquence déjà présente est refusée, sauf si la nouvelle fiche a un statut plus fort qu’une fiche officielle (une fiche `verifiee` remplace la fiche `inspiree` de même séquence, qui est masquée). Une même séquence n’est jamais créditée à deux champions.
- Limite : 5000 fiches par fichier. Les fiches importées sont conservées sur l’appareil (IndexedDB) et peuvent être supprimées une à une ou toutes ensemble.

Exemple minimal de fichier d’import :

```json
{
  "schema": 1,
  "version": "import-2026-11",
  "combos": [
    {
      "id": "boxe-tyson-v-0001",
      "name": "Esquive et riposte au corps",
      "discipline": "boxe",
      "champion": "tyson",
      "status": "verifiee",
      "source": { "kind": "combat", "note": "Relevé image par image", "reference": "Combat, date, organisation", "timestamp": "R1 1:12", "url": "https://…" },
      "guard": "orthodoxe",
      "level": "intermediaire",
      "distance": "courte",
      "sequence": ["esquive-droite", "crochet-avant-corps", "crochet-avant", "uppercut-arriere"],
      "objective": "…",
      "keyPoints": ["…", "…"],
      "errors": ["…", "…"],
      "estimatedSec": 3,
      "variants": [{ "label": "…" }],
      "goal": "defense",
      "tags": ["defense-contre", "corps"],
      "addedAt": "2026-11-02"
    }
  ]
}
```

### Par une nouvelle version du fichier officiel

Remplacer `public/catalog/catalog-v1.json` par un fichier valide (même schéma) en augmentant `version` et `updatedAt`, puis lancer `npx vitest run src/domain` : le test valide la totalité du catalogue. Aucun code n’est à modifier tant que le schéma reste 1 ; un changement de format incompatible passerait par `catalog-v2.json` et `schema: 2`.

Pour régénérer les fiches inspirées : `node scripts/build-catalog.mjs` (résultat identique à chaque exécution). Les fiches vérifiées ou adaptées ne doivent pas être produites par le générateur : elles s’ajoutent par import ou dans un fichier séparé, avec leur source.

## Comment le générateur garantit la qualité

- **Grammaire pondérée par style** : chaque champion a des multiplicateurs d’archétypes (attaque, défense et riposte, échange, changement d’angle, entrée-sortie, corps-tête, feinte, poings-pieds, pied-poings, travail de jambes, coudes, genoux, clinch, changement de niveau, défense de lutte, transition sol, cardio) et des techniques favorites ; les ripostes après une défense suivent une table cohérente (ex. après un roll, crochet du côté de la remontée).
- **Filtres biomécaniques** : au plus 2 mouvements identiques consécutifs (et seulement pour les gestes qui se doublent naturellement : jab, crochet avant, genou dans le clinch…), au plus 3 frappes du même côté d’affilée, jamais deux coups de pied de la même jambe enchaînés ni trois coups de pied de suite, pas de genou/coude/uppercut juste après un coup de pied ni de coup de pied (hors teep) juste après une frappe courte (mêmes règles de distance que le créateur), feinte jamais en dernier, changement de niveau suivi d’une entrée ou d’un coup au corps, clinch commencé par la saisie, techniques au sol encadrées par `descente-sol` … `releve-technique` (au plus 2 sorties de hanche), uniquement des techniques autorisées dans la discipline.
- **Aucune séquence avec avertissement** du validateur de séquences (`validateSequence`).
- **Dédoublonnage global** sur (discipline, séquence), objectifs et noms uniques ; une fiche dont l’objectif reproduirait celui d’une autre est rejetée plutôt que reformulée artificiellement. Si un objectif de discipline n’avait pas pu être atteint sans remplissage, le générateur se serait arrêté en dessous (il ne s’arrête que lorsque plus aucun champion ne produit de fiche valide).
- Niveau calculé à partir de la longueur et de la complexité (coups de pied après poings, high kick, sol, clinch, feintes, angles, défenses), distance à partir des techniques, durée estimée à partir des catégories.
