# Exercices non exécutables en solo (v0.41.0)

Généré par `src/domain/__tests__/programs-inventory.test.ts`.

Ces techniques demandent un partenaire réel et un encadrement qualifié (projections, immobilisations, passages, contrôles, soumissions). Elles restent consultables dans l'application (fiches « partenaire »), mais **aucun programme ne les fait exécuter** : les programmes n'utilisent que des exercices solo animés. Le test `programs-v041.test.ts` vérifie que chaque bloc renvoie à un exercice solo existant.

| Identifiant | Technique | Discipline | Niveau | Raison | Équivalent solo |
|---|---|---|---|---|---|
| `ukemi` | Ukemi (brise-chutes) | Judo | debutant | partenaire et encadrement | préparation solo : `ukemi-ushiro` |
| `o-soto-gari` | O-soto-gari (grand fauchage extérieur) | Judo | debutant | partenaire et encadrement | préparation solo : `uchikomi-o-soto-gari` |
| `o-goshi` | O-goshi (grande hanche) | Judo | debutant | partenaire et encadrement | préparation solo : `uchikomi-o-goshi` |
| `seoi-nage` | Ippon-seoi-nage (projection d’épaule) | Judo | intermediaire | partenaire et encadrement | préparation solo : `uchikomi-seoi` |
| `kesa-gatame` | Kesa-gatame (immobilisation en écharpe) | Judo | debutant | partenaire et encadrement | – |
| `garde-fermee` | Garde fermée : contrôle de la posture | Jiu-jitsu brésilien | debutant | partenaire et encadrement | préparation solo : `retention-garde` |
| `passage-toreando` | Passage de garde toreando | Jiu-jitsu brésilien | intermediaire | partenaire et encadrement | – |
| `controle-lateral` | Contrôle latéral (side control) | Jiu-jitsu brésilien | debutant | partenaire et encadrement | préparation solo : `sortie-hanche` |
| `montee` | Montée (mount) | Jiu-jitsu brésilien | intermediaire | partenaire et encadrement | préparation solo : `pont` |
| `cle-de-bras-garde` | Clé de bras depuis la garde : principes | Jiu-jitsu brésilien | avance | partenaire et encadrement | – |

Exercices solo de l'application : 254, dont 227 utilisés par au moins un programme.
