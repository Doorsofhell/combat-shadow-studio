# Programmes et sources (v0.41.0)

Généré par `src/domain/__tests__/programs-inventory.test.ts`.

## Officiel, adapté ou original

- **Officiel** : aucun. Les sites demandés (England Boxing, WAKO, IJF Academy, IBJJF) ont été consultés le 2026-10-22 ; ils présentent la formation des entraîneurs, les règlements et les grades, mais ne publient aucun programme d'entraînement à reproduire.
- **Adapté** : aucun pour la même raison.
- **Original** : les 49 programmes. Chacun suit les principes des documents cités ci-dessous, et la fiche de chaque programme le dit en clair.

## Sources

| Identifiant | Document | Consulté | Ce qui a été réellement lu | Programmes |
|---|---|---|---|---|
| `boxe-S1` | AIBA (aujourd’hui IBA), 2010 – [AIBA Coaches Manual](https://st.jtsu.uz/elfinder-files/boks/aiba_coaches_manual.pdf) | 2026-10-18 | Chap. II §2.5 (garde, pas, coups, défenses, feintes) ; texte extrait en partie illisible. | 8 |
| `boxe-S2` | USA Boxing, Grassroots Task Force, 2014 – [Best Practices: Training Manual v01.1](https://www.ncbaboxing.org/_files/ugd/22b546_9157f9cf4cce442481d5906947bb271b.pdf) | 2026-10-18 | p. 34–62 : garde, pas, directs, crochets, uppercuts, défenses, erreurs. | 8 |
| `jb-S11` | F. Drouin, Judo Québec (1995, révisé en 2000) – [Les Chutes, guide d’instruction](https://judo-quebec.qc.ca/files/Pages/entraineur/Guide_apprentissage_chutes%20%281%29.pdf) | 2026-10-20 | Ushiro- et yoko-ukemi : menton, frappe à 45°, jambes non croisées, progression couché, assis, accroupi ; sécurité. | 7 |
| `jb-S5` | IJF / Kodokan (PDF hébergé par British Judo), liste du 1er avril 2017 – [IJF/Kodokan Classification of Judo](https://www.britishjudo.org.uk/wp-content/uploads/2025/06/IJF-Kodokan-Classification-of-Judo.pdf) | 2026-10-20 | Fiches o-soto-gari, o-uchi-gari, ko-uchi-gari, o-goshi (groupe, direction du déséquilibre, description) ; glossaire (ayumi-ashi, tsugi-ashi, kumikata, tsurite, hikite, ukemi). | 7 |
| `jb-S51` | S. Kesting, Grapplearts – [The Ultimate Guide to BJJ Solo Drills](https://grapplearts.com/the-ultimate-guide-to-bjj-solo-drills/) | 2026-10-20 | Article entier : chutes assises, relevé depuis les genoux, sit-out, sprawl, entrées de lutte, roulades. | 7 |
| `jb-S52` | Jitsu IQ – [Sit-Out (Movement Mechanics)](https://jitsuiq.com/movement-mechanics/sit-out.html) | 2026-10-20 | Page entière : main posée, jambe qui passe, rotation des hanches, cadres, erreurs. | 7 |
| `kbmt-S15` | WAKO Deutschland, règlement low kick 2021 – [Regelwerk für Ringsportarten – Low Kick](https://www.wako-deutschland.de/wp-content/uploads/2022/06/Ringsport_Lowkick.pdf) | 2026-10-18 | Sections 1, 5.3, 6.1, 6.2, 7. | 8 |
| `kbmt-S16` | WAKO, règles du K1 (2026) – [WAKO Rules Change – K1 Style](https://kickboxingeurope.com/wp-content/uploads/2026/04/Changes-of-rules-K1-Style.pdf) | 2026-10-18 | Document complet (3 p.). | 8 |
| `kbmt-S28` | Evolve MMA (Evolve Daily) – [Muay Thai 101: The Roundhouse Kick](https://evolve-mma.com/blog/muay-thai-101-the-roundhouse-kick/) | 2026-10-18 | Article entier. | 8 |
| `kbmt-S30` | Evolve MMA – [10 Essential Muay Thai Defense Techniques To Master](https://evolve-mma.com/blog/10-essential-muay-thai-defense-techniques-to-master/) | 2026-10-20 | Article entier : garde longue, rattrapage du coup de pied, retrait. | 8 |
| `mma-S13` | Evolve MMA, 2021 – [What Is Sprawling In MMA?](https://evolve-mma.com/blog/what-is-sprawling-in-mma/) | 2026-10-18 | Article complet. | 8 |
| `mma-S15` | Evolve MMA, 2018 – [5 Effective Ways To Defend Against Takedowns In MMA](https://evolve-mma.com/blog/5-effective-ways-to-defend-against-takedowns-in-mma/) | 2026-10-18 | Article complet. | 8 |
| `mma-S26` | American Journal of Sports Medicine 30(6):791-795, 2002 – [Catastrophic injuries in wrestlers](https://sponet.de/sponet/Record/4007688?lng=en) | 2026-10-18 | Résumé (notice SPONET) uniquement ; étude épidémiologique. | 8 |
| `prog-EB` | England Boxing – [Boxing – A Beginner’s Guide](https://www.englandboxing.org/get-involved/boxing-a-beginners-guide/) | 2026-10-22 | Page entière : apprendre en club « dans un environnement sûr et contrôlé », combats amateurs en trois rounds de trois minutes. Aucun programme d’entraînement publié. | 8 |
| `prog-IBJJF` | IBJJF – [Graduation System](https://ibjjf.com/graduation-system) | 2026-10-22 | Page de présentation des ceintures ; le détail est dans un PDF non lu. Aucun programme d’entraînement publié. | 7 |
| `prog-IJF` | IJF Academy – [Classification of Judo and 100 Kodokan Techniques](https://academy.ijf.org/news/100-kodokan-techniques) | 2026-10-22 | Page d’annonce seulement ; le contenu est dans une présentation séparée, non lue. Aucun programme d’entraînement publié. | 7 |
| `prog-WAKO` | WAKO – [Rules overview](https://www.wako.sport/rules-overview) | 2026-10-22 | Page d’accueil des règlements (liens vers les règles par discipline). Aucun programme d’entraînement publié. | 8 |

Sources propres aux programmes : `prog-EB`, `prog-WAKO`, `prog-IJF`, `prog-IBJJF`. Les autres viennent des fiches biomécaniques (`src/domain/biomech/sources.ts`).

## Programme par programme

| Programme | Origine | Sources et usage |
|---|---|---|
| `boxe-initiation-4-semaines` | original | `boxe-S2` (Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.) ; `boxe-S1` (Contenu technique de base : garde, pas, coups, défenses, feintes.) ; `prog-EB` (Format de référence du round amateur : trois minutes.) |
| `kick-poings-pieds` | original | `kbmt-S15` (Techniques autorisées en low kick.) ; `kbmt-S16` (Techniques autorisées en K1 (genoux).) ; `prog-WAKO` (Règlements de la fédération internationale.) |
| `mma-striking-mobilite` | original | `mma-S13` (Le sprawl : principe et placement.) ; `mma-S15` (Défense contre les amenées au sol, debout.) ; `mma-S26` (Risques des chutes et de la lutte : travail sur tapis.) |
| `muay-fondamentaux` | original | `kbmt-S30` (Défenses thaï : check, garde longue, rattrapage.) ; `kbmt-S28` (Le coup de pied circulaire.) |
| `cardio-combat-20` | original | aucune source écrite |
| `coordination-15` | original | aucune source écrite |
| `technique-avancee-30` | original | aucune source écrite |
| `muay-armes-completes` | original | `kbmt-S30` (Défenses thaï : check, garde longue, rattrapage.) ; `kbmt-S28` (Le coup de pied circulaire.) |
| `judo-bases-solo` | original | `jb-S5` (Déplacements, saisies et entrées des techniques travaillées en solo.) ; `jb-S11` (Progression des chutes (couché, assis, accroupi) et sécurité.) ; `prog-IJF` (Classification des techniques (annonce seulement).) |
| `bjj-mobilite-solo` | original | `jb-S51` (Exercices solo : chutes assises, relevé, sit-out, entrées de lutte.) ; `jb-S52` (Le sit-out : mécanique et erreurs.) ; `prog-IBJJF` (Système de grades (présentation seulement).) |
| `boxe-defense-deplacements-debutant` | original | `boxe-S2` (Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.) ; `boxe-S1` (Contenu technique de base : garde, pas, coups, défenses, feintes.) ; `prog-EB` (Format de référence du round amateur : trois minutes.) |
| `boxe-enchainements-intermediaire` | original | `boxe-S2` (Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.) ; `boxe-S1` (Contenu technique de base : garde, pas, coups, défenses, feintes.) ; `prog-EB` (Format de référence du round amateur : trois minutes.) |
| `boxe-defense-contre-intermediaire` | original | `boxe-S2` (Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.) ; `boxe-S1` (Contenu technique de base : garde, pas, coups, défenses, feintes.) ; `prog-EB` (Format de référence du round amateur : trois minutes.) |
| `boxe-angles-avance` | original | `boxe-S2` (Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.) ; `boxe-S1` (Contenu technique de base : garde, pas, coups, défenses, feintes.) ; `prog-EB` (Format de référence du round amateur : trois minutes.) |
| `boxe-combinaisons-avance` | original | `boxe-S2` (Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.) ; `boxe-S1` (Contenu technique de base : garde, pas, coups, défenses, feintes.) ; `prog-EB` (Format de référence du round amateur : trois minutes.) |
| `boxe-endurance-avance` | original | `boxe-S2` (Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.) ; `boxe-S1` (Contenu technique de base : garde, pas, coups, défenses, feintes.) ; `prog-EB` (Format de référence du round amateur : trois minutes.) |
| `boxe-rounds-expert` | original | `boxe-S2` (Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.) ; `boxe-S1` (Contenu technique de base : garde, pas, coups, défenses, feintes.) ; `prog-EB` (Format de référence du round amateur : trois minutes.) |
| `kick-fondamentaux-debutant` | original | `kbmt-S15` (Techniques autorisées en low kick.) ; `kbmt-S16` (Techniques autorisées en K1 (genoux).) ; `prog-WAKO` (Règlements de la fédération internationale.) |
| `kick-defense-intermediaire` | original | `kbmt-S15` (Techniques autorisées en low kick.) ; `kbmt-S16` (Techniques autorisées en K1 (genoux).) ; `prog-WAKO` (Règlements de la fédération internationale.) |
| `kick-distance-intermediaire` | original | `kbmt-S15` (Techniques autorisées en low kick.) ; `kbmt-S16` (Techniques autorisées en K1 (genoux).) ; `prog-WAKO` (Règlements de la fédération internationale.) |
| `kick-genoux-k1-intermediaire` | original | `kbmt-S15` (Techniques autorisées en low kick.) ; `kbmt-S16` (Techniques autorisées en K1 (genoux).) ; `prog-WAKO` (Règlements de la fédération internationale.) |
| `kick-enchainements-avance` | original | `kbmt-S15` (Techniques autorisées en low kick.) ; `kbmt-S16` (Techniques autorisées en K1 (genoux).) ; `prog-WAKO` (Règlements de la fédération internationale.) |
| `kick-endurance-avance` | original | `kbmt-S15` (Techniques autorisées en low kick.) ; `kbmt-S16` (Techniques autorisées en K1 (genoux).) ; `prog-WAKO` (Règlements de la fédération internationale.) |
| `kick-rounds-expert` | original | `kbmt-S15` (Techniques autorisées en low kick.) ; `kbmt-S16` (Techniques autorisées en K1 (genoux).) ; `prog-WAKO` (Règlements de la fédération internationale.) |
| `mma-fondamentaux-debutant` | original | `mma-S13` (Le sprawl : principe et placement.) ; `mma-S15` (Défense contre les amenées au sol, debout.) ; `mma-S26` (Risques des chutes et de la lutte : travail sur tapis.) |
| `mma-defense-lutte-debutant` | original | `mma-S13` (Le sprawl : principe et placement.) ; `mma-S15` (Défense contre les amenées au sol, debout.) ; `mma-S26` (Risques des chutes et de la lutte : travail sur tapis.) |
| `mma-enchainements-intermediaire` | original | `mma-S13` (Le sprawl : principe et placement.) ; `mma-S15` (Défense contre les amenées au sol, debout.) ; `mma-S26` (Risques des chutes et de la lutte : travail sur tapis.) |
| `mma-entrees-sol-intermediaire` | original | `mma-S13` (Le sprawl : principe et placement.) ; `mma-S15` (Défense contre les amenées au sol, debout.) ; `mma-S26` (Risques des chutes et de la lutte : travail sur tapis.) |
| `mma-defense-lutte-avance` | original | `mma-S13` (Le sprawl : principe et placement.) ; `mma-S15` (Défense contre les amenées au sol, debout.) ; `mma-S26` (Risques des chutes et de la lutte : travail sur tapis.) |
| `mma-endurance-avance` | original | `mma-S13` (Le sprawl : principe et placement.) ; `mma-S15` (Défense contre les amenées au sol, debout.) ; `mma-S26` (Risques des chutes et de la lutte : travail sur tapis.) |
| `mma-rounds-expert` | original | `mma-S13` (Le sprawl : principe et placement.) ; `mma-S15` (Défense contre les amenées au sol, debout.) ; `mma-S26` (Risques des chutes et de la lutte : travail sur tapis.) |
| `muay-defense-intermediaire` | original | `kbmt-S30` (Défenses thaï : check, garde longue, rattrapage.) ; `kbmt-S28` (Le coup de pied circulaire.) |
| `muay-coudes-genoux-intermediaire` | original | `kbmt-S30` (Défenses thaï : check, garde longue, rattrapage.) ; `kbmt-S28` (Le coup de pied circulaire.) |
| `muay-enchainements-intermediaire` | original | `kbmt-S30` (Défenses thaï : check, garde longue, rattrapage.) ; `kbmt-S28` (Le coup de pied circulaire.) |
| `muay-enchainements-avance` | original | `kbmt-S30` (Défenses thaï : check, garde longue, rattrapage.) ; `kbmt-S28` (Le coup de pied circulaire.) |
| `muay-endurance-avance` | original | `kbmt-S30` (Défenses thaï : check, garde longue, rattrapage.) ; `kbmt-S28` (Le coup de pied circulaire.) |
| `muay-rounds-expert` | original | `kbmt-S30` (Défenses thaï : check, garde longue, rattrapage.) ; `kbmt-S28` (Le coup de pied circulaire.) |
| `judo-deplacements-debutant` | original | `jb-S5` (Déplacements, saisies et entrées des techniques travaillées en solo.) ; `jb-S11` (Progression des chutes (couché, assis, accroupi) et sécurité.) ; `prog-IJF` (Classification des techniques (annonce seulement).) |
| `judo-ukemi-intermediaire` | original | `jb-S5` (Déplacements, saisies et entrées des techniques travaillées en solo.) ; `jb-S11` (Progression des chutes (couché, assis, accroupi) et sécurité.) ; `prog-IJF` (Classification des techniques (annonce seulement).) |
| `judo-uchikomi-intermediaire` | original | `jb-S5` (Déplacements, saisies et entrées des techniques travaillées en solo.) ; `jb-S11` (Progression des chutes (couché, assis, accroupi) et sécurité.) ; `prog-IJF` (Classification des techniques (annonce seulement).) |
| `judo-kuzushi-avance` | original | `jb-S5` (Déplacements, saisies et entrées des techniques travaillées en solo.) ; `jb-S11` (Progression des chutes (couché, assis, accroupi) et sécurité.) ; `prog-IJF` (Classification des techniques (annonce seulement).) |
| `judo-endurance-avance` | original | `jb-S5` (Déplacements, saisies et entrées des techniques travaillées en solo.) ; `jb-S11` (Progression des chutes (couché, assis, accroupi) et sécurité.) ; `prog-IJF` (Classification des techniques (annonce seulement).) |
| `judo-rounds-expert` | original | `jb-S5` (Déplacements, saisies et entrées des techniques travaillées en solo.) ; `jb-S11` (Progression des chutes (couché, assis, accroupi) et sécurité.) ; `prog-IJF` (Classification des techniques (annonce seulement).) |
| `bjj-bases-debutant` | original | `jb-S51` (Exercices solo : chutes assises, relevé, sit-out, entrées de lutte.) ; `jb-S52` (Le sit-out : mécanique et erreurs.) ; `prog-IBJJF` (Système de grades (présentation seulement).) |
| `bjj-garde-sorties-intermediaire` | original | `jb-S51` (Exercices solo : chutes assises, relevé, sit-out, entrées de lutte.) ; `jb-S52` (Le sit-out : mécanique et erreurs.) ; `prog-IBJJF` (Système de grades (présentation seulement).) |
| `bjj-lutte-debout-intermediaire` | original | `jb-S51` (Exercices solo : chutes assises, relevé, sit-out, entrées de lutte.) ; `jb-S52` (Le sit-out : mécanique et erreurs.) ; `prog-IBJJF` (Système de grades (présentation seulement).) |
| `bjj-enchainements-avance` | original | `jb-S51` (Exercices solo : chutes assises, relevé, sit-out, entrées de lutte.) ; `jb-S52` (Le sit-out : mécanique et erreurs.) ; `prog-IBJJF` (Système de grades (présentation seulement).) |
| `bjj-endurance-avance` | original | `jb-S51` (Exercices solo : chutes assises, relevé, sit-out, entrées de lutte.) ; `jb-S52` (Le sit-out : mécanique et erreurs.) ; `prog-IBJJF` (Système de grades (présentation seulement).) |
| `bjj-rounds-expert` | original | `jb-S51` (Exercices solo : chutes assises, relevé, sit-out, entrées de lutte.) ; `jb-S52` (Le sit-out : mécanique et erreurs.) ; `prog-IBJJF` (Système de grades (présentation seulement).) |
