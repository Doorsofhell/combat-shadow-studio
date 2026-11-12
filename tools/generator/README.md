# Outils de fabrication des coachs 3D

Depuis la 1.37.0 (Youssef, 2026-11-12 : « ne garder que les coachs ultra-réalistes »), l'application n'affiche que
les quatre coachs photo **Microsoft Rocketbox** (licence MIT) : Kadir, Amara, Naël et Inaya
(`public/coaches/<id>/photo.glb` et `tenues/`).

| Dossier | Rôle |
|---|---|
| `rocketbox/` | conversion des avatars Rocketbox (`convert.py`), tenues par discipline (`outfits.py`, `regen_outfits.sh`), visages et expressions (`face_transfer.py`, `morph_extract.py`, `morph_apply.py`), peau, barbe, gants. |
| `emblems/` | emblèmes des disciplines. |
| `coaches/design.py` | liste de référence des champions qui ont inspiré les coachs (lue par `no-real-names.test.ts` : aucun de ces noms dans l'application). |

Après toute reconstruction d'un `photo.glb` Rocketbox : relancer `rocketbox/morph_apply.py`.

## Retiré en 1.37.0 (rangé dans `backup CS/v1.37-ultra-realiste/tools/generator/`)

- `build.py`, `install.py`, `anatomy.py`, `coaches/` (sauf `design.py`) : générateur Blender + MPFB2 des anciens coachs générés
  (`public/models/coach_*`, `coaches/*/model.glb`), du créateur de combattant et des anciens rendus dessinés.
- `makehuman/` : Axel et Kaila (MakeHuman CC0), retirés de l'application.
- `groom/`, `skin/`, `rocketbox/glove_ts.py` : cheveux en cartes, grain de peau et gant sculpté du coach généré.

Les squelettes de quatre de ces modèles générés restent dans `tests/fixtures/modeles-generes/` : les tests du
moteur d'animation les mesurent (ils ne font pas partie de l'application).
