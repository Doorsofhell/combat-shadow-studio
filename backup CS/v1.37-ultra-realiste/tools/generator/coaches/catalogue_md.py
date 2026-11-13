"""Writes docs/coachs-champions/CATALOGUE.md from design.py."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from design import C

DISC = dict(boxe='Boxe anglaise', kickboxing='Kick-boxing', mma='MMA', muaythai='Muay-thaï', bjj='BJJ', judo='Judo')
PROTO = {'mma-kadir', 'mma-amara'}
out = ["# Catalogue des 36 coachs : fiches de conception",
       "",
       "Propositions à valider. Les noms et surnoms sont fictifs. Le champion de référence ne sert qu'à la conception :",
       "il n'apparaît pas dans l'application (voir `AUDIT.md`, section 7). Les tailles sont des ordres de grandeur publics",
       "à vérifier ; elles fixent seulement les proportions relatives. Les descriptions de visage sont des créations",
       "originales : seules la morphologie, la présence et le style de combat évoquent la référence.",
       "",
       "Source unique : `tools/generator/coaches/design.py` (ce fichier est généré par `catalogue_md.py`).",
       "",
       "## Vue d'ensemble", "",
       "| Discipline | Coach | Surnom | Sexe | Référence | Taille | Garde |", "|---|---|---|---|---|---|---|"]
for c in C:
    out.append(f"| {DISC[c['disc']]} | {c['name']} | « {c['nick']} » | {c['sex']} | {c['ref']} | ≈ {c['height']} cm | {c['guard']} |")
out.append("")
for d in DISC:
    out += [f"## {DISC[d]}", ""]
    for c in [x for x in C if x['disc'] == d]:
        status = 'Prototype en cours' if c['id'] in PROTO else 'Fiche proposée, en attente des prototypes'
        out += [f"### {c['name']} « {c['nick']} »", "",
                "| Champ | Proposition |", "|---|---|",
                f"| 1. Référence | {c['ref']} |",
                f"| 2. Nom fictif | {c['name']} |",
                f"| 3. Surnom | « {c['nick']} » |",
                f"| 4. Discipline | {DISC[d]} |",
                f"| 5. Sexe | {c['sex']} |",
                f"| 6. Morphologie | {c['morpho']} ; ≈ {c['height']} cm |",
                f"| 7. Silhouette | {c['silhouette']} |",
                f"| 8. Visage (original) | {c['face']} |",
                f"| 9. Coiffure | {c['hair']} |",
                f"| 10. Tenue | {c['outfit']} |",
                f"| 11. Garde | {c['stance']} (garde naturelle : {c['guard']}) |",
                f"| 12. Déplacements | {c['moves']} |",
                f"| 13. Techniques caractéristiques | {c['techs']} |",
                f"| 14. Profil d'animation | {c['anim']} |",
                f"| 15. Modèle 3D | {'en production (phase 2)' if c['id'] in PROTO else 'à produire (phase 5)'} : `public/coaches/{c['id']}/model.glb` |",
                f"| 16. Matériaux | Encre (cel-shading) et Ultra-réaliste (PBR), même modèle |",
                f"| 17. Miniature | rendu de notre modèle 3D : `public/coaches/{c['id']}/portrait.webp` |",
                f"| 18. Statut | {status} |", ""]
open(os.path.join(os.path.dirname(__file__), '../../../docs/coachs-champions/CATALOGUE.md'), 'w').write("\n".join(out))
print(len(out))
