---
name: graphe-code
description: Reconstruire le graphe du code (graphify) du dépôt dans un bac à sable cloud pour une analyse d'architecture ou de dépendances.
---

# Graphe du code (graphify)

1. graphify n'est pas préinstallé et le classifieur bloque son installation sans l'accord de Youssef dans le fil. Avec cet accord : `uv tool install graphifyy`, puis `graphify install --platform claude`.
2. Vérifier que `.graphifyignore` exclut `_ARCHIVES_HORS_APPLICATION/`, `graphify-out/` et `public/draco/` (sinon le décodeur Draco minifié domine le graphe).
3. Lancer `graphify update .` (analyse AST seule, sans LLM, environ 35 s).
4. Sorties : `graphify-out/` (`GRAPH_REPORT.md`, `graph.html`). En copier une version dans `/mnt/project-files/graphify/`. Ne pas commiter `graphify-out/`.
