# Méthode pour chaque technique, actuelle ou future

Une technique n’avance d’une étape que si la précédente est faite et vérifiable dans le dépôt.

## Les 10 étapes

1. **Inventaire.** La technique existe dans le catalogue (`src/domain/techniques.ts` ou `src/domain/partner.ts`) et apparaît dans [INVENTAIRE.md](INVENTAIRE.md).
2. **Recherche.** Lire d’abord les règlements et les fédérations (Kodokan, IJF, World Boxing, IFMA, WAKO, IMMAF, IBJJF ou JJIF…), puis les manuels pédagogiques, puis les études biomécaniques. Classer chaque source : règlement, pédagogique, biomécanique, variante, compétition. Noter ce qui a **réellement** été lu (page entière, résumé, extrait) et les pages inaccessibles.
3. **Vidéos.** Une vidéo est « repérée » tant que personne ne l’a regardée. Elle ne passe « visionnée » que si une personne l’a vue, avec qui, quand et ce qu’elle a observé. Jamais de téléchargement ni de réutilisation d’une vidéo protégée.
4. **Fiche structurée.** Remplir tous les champs de `BiomechSheet` (`src/domain/biomech/types.ts`). Chaque affirmation porte ses sources ; une affirmation sans source est écrite comme telle, et une déduction est marquée `inference`.
5. **Écarts.** Comparer le texte et l’animation de l’application aux sources. Noter chaque écart dans `findings`, avec sa gravité.
6. **Mesure.** Lancer `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/audit.test.ts` : équilibre, contact au sol, glissements, torsion, transitions. Lancer le registre : `UPDATE_REGISTRY=1 npx vitest run src/engine/__tests__/registry.test.ts`.
7. **Correction.** Corriger le texte et l’animation dans un petit lot, sur sa propre branche. Ne jamais affaiblir un test.
8. **Vérification automatique.** tsc, tests unitaires, Playwright complet, contrôle visuel des captures. Les deux squelettes et les deux extrémités du curseur de longueur de jambes doivent passer.
9. **Revue d’expert.** Un entraîneur qualifié regarde l’animation et la fiche. Sa revue est enregistrée dans `review` (qui, qualification, date, critères, notes).
10. **Publication et historique.** Le statut de la fiche est mis à jour, l’historique de la fiche reçoit une ligne, le journal `docs/JOURNAL_CORRECTIONS.md` aussi, puis la version est publiée.

## Statuts

| Statut | Condition |
|---|---|
| À documenter | Pas de fiche structurée. |
| Documentée | Fiche remplie avec ses sources (étapes 2 à 5). |
| Animation en cours | Correction de l’animation en cours (étape 7). |
| À corriger | Un écart P1 ou P2 est ouvert, ou un contrôle automatique échoue. |
| Validation technique nécessaire | Écarts corrigés et contrôles automatiques réussis ; en attente de la revue d’expert. |
| Validée | Revue d’expert enregistrée. Un test refuse ce statut sans revue (`src/domain/__tests__/biomech.test.ts`). |

## Règles fixes

- Ne jamais inventer une source, une analyse, une validation ou un résultat de test.
- Ne jamais dire qu’une vidéo a été analysée si seuls son titre, sa description ou sa transcription ont été lus.
- Un règlement ne décrit pas comment un geste doit être fait : il dit ce qui est permis.
- Les fiches officielles et les Légendes ne sont modifiables que par l’éditeur, jamais par l’utilisateur.
- Judo et BJJ avec partenaire : pas de projection simulée par un personnage qui tourne ou tombe seul. Il faut deux corps, leurs contacts et la réception.
