# Impeccable dans Combat Shadow Studio

Installé le 27 novembre 2026 sur la base de la version 2.11.1 (aucun changement d'interface, version inchangée).

## Ce que c'est

[Impeccable](https://github.com/pbakaus/impeccable) (Paul Bakaus, licence Apache-2.0, version 4.11.1, moteur 0.1.31)
est un « directeur artistique » pour les assistants de code. Il apporte :

- un **skill** `impeccable` avec 24 commandes (`/impeccable critique`, `audit`, `polish`, `layout`, `typeset`,
  `colorize`, `clarify`, `harden`, `adapt`, `animate`, `quieter`, `bolder`, `distill`, `document`, `init`…) et
  ses guides de qualité (`reference/`) ;
- un **détecteur** de 62 règles (contraste, typographie, mise en page, animations, tics d'interfaces « générées par IA ») ;
- 5 **agents** spécialisés (relecture finale, mouvement, documentation, application d'éditions manuelles, assets) ;
- 3 **hooks** qui lancent le détecteur automatiquement.

## Ce qui est installé dans le dépôt

| Élément | Chemin |
| --- | --- |
| Skill (installé par l'installateur officiel) | `.claude/skills/impeccable/` |
| Agents | `.claude/agents/impeccable-*.md` |
| Hooks (SessionStart, après chaque Edit/Write, Stop) | `.claude/settings.json` |
| Fiche produit | `PRODUCT.md` |
| Système de design (format DESIGN.md lu par Impeccable) | `DESIGN.md` |
| Consignes d'utilisation automatique | `CLAUDE.md`, section « Design UI/UX : Impeccable » |

Le moteur (binaire de 6 Mo environ) n'est **pas** dans le dépôt : le lanceur `scripts/impeccable` le télécharge une
fois depuis les releases GitHub d'Impeccable, vérifie son empreinte SHA-256 et le garde dans `~/.impeccable/`.

## Méthode d'installation

Le site `impeccable.style` est bloqué par le réseau des sessions cloud : `npx impeccable install` échoue au
téléchargement du paquet de skills. Méthode utilisée, avec l'installateur officiel :

```bash
git clone --depth 1 https://github.com/pbakaus/impeccable.git /tmp/impeccable   # branche main = version publiée
IMPECCABLE_BUNDLE_PATH=/tmp/impeccable npx impeccable install -y --providers=claude --scope=project
mv .claude/settings.local.json .claude/settings.json   # hooks partagés par toutes les sessions
```

`IMPECCABLE_BUNDLE_PATH` est l'option prévue par l'installateur pour un paquet local. Les hooks sont déplacés de
`settings.local.json` (propre à une machine) vers `settings.json` (versionné), sinon les sessions cloud ne les
auraient pas. Mise à jour : même méthode avec `--force`.

## Ce qui a été vérifié (27 novembre 2026)

| Vérification | Résultat |
| --- | --- |
| Paquet npm : auteur, licence, pas de script `postinstall`, téléchargement vérifié par empreinte | TEST RÉUSSI |
| Installation dans le dépôt par l'installateur officiel (paquet local) | TEST RÉUSSI |
| Nouvelle session Claude Code (CLI 2.1.332) lancée dans le dépôt : le skill `impeccable` et les 5 agents sont listés | TEST RÉUSSI |
| Téléchargement du moteur depuis GitHub dans une session neuve (cache vide) : 1,7 s | TEST RÉUSSI |
| `impeccable context` : lit `PRODUCT.md` et `DESIGN.md` | TEST RÉUSSI |
| `impeccable doctor` : plus aucune erreur bloquante | TEST RÉUSSI (2 remarques, ci-dessous) |
| Hook après édition d'un CSS : analyse le fichier, rend son avis | TEST RÉUSSI |
| Hook de fin de tour : liste les remarques des fichiers d'interface touchés | TEST RÉUSSI |
| Hook sur un fichier non UI (`src/engine/rig.ts`) : ne fait rien | TEST RÉUSSI |
| Commande `/impeccable …` exécutée de bout en bout par une session | NON EXÉCUTÉ (pas de modification d'interface demandée) |
| Application mobile Claude | voir ci-dessous |

Remarques restantes de `doctor` : `DESIGN.md` dépasse 4 ko (Impeccable en donne alors un résumé et lit le détail
au besoin : normal) ; la plateforme déclarée est `web` alors qu'il existe un projet Android. C'est voulu : l'app
Android est la même interface web emballée par Capacitor, sans langage natif Android.

## Fonctionnement selon l'endroit où l'on travaille

| Environnement | Skill et commandes | Agents | Hooks | Détecteur |
| --- | --- | --- | --- | --- |
| Session cloud (claude.ai/code, application mobile Claude, projets) | oui, lu dans `.claude/` du dépôt cloné | oui | oui | oui (moteur téléchargé depuis GitHub) |
| Claude Code sur l'ordinateur, dans ce dépôt | oui | oui | oui | oui |
| Fil de projet déjà ouvert avant l'installation | non : les skills sont chargés au démarrage d'une session | non | non | oui, en appelant le lanceur à la main |

L'application mobile Claude pilote des sessions cloud : elles clonent le dépôt et chargent le dossier `.claude/`
de la branche utilisée. **Condition : la branche de travail doit contenir ce dossier**, donc il faut que ces fichiers
soient fusionnés dans la branche de référence (aujourd'hui `claude/project-thread-o7lrt8`, puis `main`).

## Fonctions non disponibles dans le cloud, et alternative

| Fonction | Pourquoi | Alternative |
| --- | --- | --- |
| `npx impeccable install` / `update` en direct | `impeccable.style` bloqué | paquet local `IMPECCABLE_BUNDLE_PATH` (ci-dessus) |
| `impeccable help` (liste en ligne des commandes) | `impeccable.style` bloqué | tableau des commandes dans `.claude/skills/impeccable/SKILL.md` |
| Génération d'images par l'API d'Impeccable, compte Impeccable | service en ligne bloqué, non souhaité | comps faites à partir de nos rendus 3D, chemin « code d'abord » |
| `/impeccable live` (panneau de design dans le navigateur) | demande un navigateur visible et un serveur ouvert | captures Playwright (`impeccable shot` ou nos scripts `scripts/dev/`) |
| `/plugin marketplace add pbakaus/impeccable` | commande `/plugin` absente des sessions cloud | installation dans le dépôt (ce document) ; sur l'ordinateur, la commande `/plugin` fonctionne |

## Premier relevé du détecteur (`impeccable detect src/`, version 2.11.0)

5 remarques, **non corrigées** (aucun changement d'interface demandé) :

1. `src/boot/boot.css:103` : police Inter jugée « trop répandue » (choix assumé, voir `DESIGN.md`) ;
2. `src/ui/coach-ai/coachAi.css:227` : bordure colorée sur un seul côté ;
3. `src/ui/styles.css:692` et `:698` : même motif sur les alertes ;
4. `src/ui/coach-ai/coachAi.css:43` : courbe d'animation à rebond.

## Règles de priorité

Les règles du projet (`CLAUDE.md`, `AGENTS.md`, `docs/HUMAN_CHARACTER_STANDARDS.md`) priment sur Impeccable.
Impeccable ne touche jamais aux coachs 3D, aux visages, aux tenues, ni au moteur d'animation.
