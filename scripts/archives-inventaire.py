# 1.56.4 : régénère _ARCHIVES_HORS_APPLICATION/inventaire-archives.md depuis les fichiers suivis par git.
# Usage (à la racine du dépôt) : python3 scripts/archives-inventaire.py
# Ajouter un nouveau motif dans reason() et R quand on archive autre chose.
import os, collections
import subprocess
A='_ARCHIVES_HORS_APPLICATION/'
MAP=[('anciens-modeles-3d/v1.37-ultra-realiste/public/','backup CS/v1.37-ultra-realiste/public/'),
     ('anciens-scripts/v1.37-ultra-realiste/tools/','backup CS/v1.37-ultra-realiste/tools/'),
     ('anciens-scripts/v1.37.9-morph/scripts/','backup CS/v1.37.9-morph/scripts/'),
     ('anciens-scripts/workflows-retires/','backup CS/workflows/'),
     ('anciennes-versions/backup-CS/','backup CS/'),
     ('anciennes-textures/',''),('anciennes-versions/',''),('anciens-scripts/',''),('anciens-prototypes/',''),('fichiers-temporaires/','')]
files=subprocess.run(['git','ls-files','-z',A],capture_output=True,text=True).stdout.split('\0')
rows=[]
for b in files:
    if not b or b.endswith('/README.md') and b.count('/')==2 or b==A+'inventaire-archives.md': continue
    rel=b[len(A):]
    for d,o in MAP:
        if rel.startswith(d): rows.append((o+rel[len(d):],b)); break
    else: raise SystemExit('no map '+b)
def reason(src):
    if src.startswith('backup CS/'): return 'BACKUP'
    if '/tenues/_tex/' in src: return 'TEX'
    if src.startswith('public/coaches/') and src.endswith('.jpg'): return 'JPG'
    if '__pycache__' in src: return 'PYC'
    if src.startswith('scripts/dev/_'): return 'TMP'
    if src.startswith('lab/groom'): return 'GROOM'
    if src in ('scripts/dev/shot-groom.mjs',): return 'GROOM'
    if src in ('scripts/dev/shot-editor-random.mjs','scripts/dev/shot-random.mjs'): return 'EDITOR'
    if 'regenerate-amara-v137' in src or 'check-amara-garments-v1376' in src: return 'AMARA'
    return '?'
R={
'TEX':("Copies de travail des textures de tissu écrites par `tools/generator/rocketbox/outfits.py` à côté des tenues. Les GLB "
       "embarquent déjà ces images (JPEG intégrés : aucun des 51 GLB de `public/coaches/` ne référence d'image externe, vérifié le 18/11/2026) ; aucun fichier de `src/`, des tests, des workflows "
       "ou des scripts ne lit `_tex/`. Elles étaient copiées dans `dist/` et dans l'APK (26 Mo). Le générateur écrit maintenant "
       "ces copies hors de `public/` (dossier temporaire, ou `CSS_TEX_DIR`)."),
'BACKUP':("Ancien dossier `backup CS/` (éléments retirés de l'application en 1.37.0 et 1.38.0 : Axel, Kaila, rendus dessinés, "
          "créateur, morph 1.37.9, deux workflows). Déjà hors build ; regroupé ici par catégorie, voir "
          "`anciennes-versions/backup-CS/README.md`."),
'JPG':("Anciennes photos de coach (versions 0.x, coachs « homme »/« femme » avant les modèles 3D). Aucune référence dans "
       "`src/`, `index.html`, les tests ou les scripts ; seul le précache PWA (`includeAssets: coaches/*.jpg`) les "
       "embarquait, motif retiré de `vite.config.ts`."),
'PYC':"Cache Python compilé (`__pycache__/*.pyc`) committé par erreur ; régénéré automatiquement. `.gitignore` l'exclut désormais.",
'TMP':("Scripts jetables d'inspection (préfixe `_`) : non référencés par `package.json`, un workflow, un test ou un autre "
       "script ; `_shots.mjs` vise un serveur local fixe (port 4192) et un ancien chemin de Chromium."),
'GROOM':("Banc d'essai des cheveux en cartes (0.29). Il importe `CoachStyle` de `src/three/CoachModel.tsx` et le module "
         "`groom`, tous deux supprimés en 1.37.0 : il ne compile plus. `shot-groom.mjs` ne servait qu'à ce banc."),
'EDITOR':("Captures du créateur de combattant aléatoire : `shot-random.mjs` importe `src/editor/random.ts` (supprimé en "
          "1.37.0) et `shot-editor-random.mjs` ouvre l'écran `/combattant` (supprimé en 1.37.0)."),
'AMARA':("Recettes successives des tenues d'Amara 1.37.4 à 1.37.6, remplacées par `scripts/dev/regenerate-amara-v1377.sh` et "
         "`check-amara-garments-v1377.py` (utilisés par `.github/workflows/amara-v1377.yml`). Aucun workflow, script ni "
         "test ne les appelle ; le workflow 1.37.6 qui les lançait est lui-même archivé depuis la 1.37.7."),
}
by=collections.OrderedDict()
for a,b in rows: by.setdefault(b.split('/')[1],[]).append((a,b,reason(a)))
assert not [r for r in rows if reason(r[0])=='?'], [r for r in rows if reason(r[0])=='?']
size=lambda p: os.path.getsize(p)
out=['# Inventaire des archives hors application','',
"Créé en 1.56.4 (18/11/2026), réorganisation du dépôt demandée par Youssef : « Tout fichier identifié comme inutilisé doit être déplacé […] Ne supprimer définitivement aucun fichier ».",'',
"## Règles",'',
"- Rien n'est supprimé : chaque fichier a été déplacé avec `git mv` (historique conservé, `git log --follow` fonctionne).",
"- Rien ici n'est compilé, testé ni publié : `tsconfig.json` ne lit que `src/`, Vitest que `src/**/*.test.ts(x)`, Playwright que `tests/e2e/`, Vite ne copie que `public/`. Le test `src/boot/__tests__/archives-hors-build.test.ts` le vérifie.",
"- Chaque fichier garde, sous sa catégorie, son chemin d'origine : `_ARCHIVES_HORS_APPLICATION/<catégorie>/<chemin d'origine>` (pour l'ancien `backup CS/`, voir son README).",
"- Sur GitHub, la vue « fichiers modifiés » peut apparier un fichier déplacé avec un autre fichier au contenu identique (ex. textures identiques d'Axel et de Naël) : le chemin d'origine qui fait foi est celui de la liste ci-dessous.",
"- Restaurer un fichier : `git mv \"_ARCHIVES_HORS_APPLICATION/<catégorie>/<chemin>\" \"<chemin>\"`. Tout restaurer d'un coup : branche `restauration/avant-reorganisation-v1563` (= 1.56.3).",'',
'## Résumé','','| Catégorie | Fichiers | Taille | Motif |','|---|---:|---:|---|']
tot=0
cats=['anciens-modeles-3d','anciennes-textures','anciennes-animations','anciennes-tenues','anciens-scripts','anciens-prototypes','anciennes-versions','fichiers-temporaires']
for c in cats:
    L=by.get(c,[]); s=sum(size(b) for a,b,r in L); tot+=s
    motifs=sorted({r for a,b,r in L})
    out.append(f"| `{c}/` | {len(L)} | {s/1e6:.1f} Mo | {', '.join(motifs) if motifs else 'aucun fichier dont l’inutilité soit démontrée'} |")
out.append(f"| **Total** | **{len(rows)}** | **{tot/1e6:.1f} Mo** | |")
out+=['','Codes des motifs :','']+[f"- **{k}** : {v}" for k,v in R.items()]
out+=['','## Catégories sans fichier','',
"- `anciennes-animations/` : les animations sont des poses clés calculées par le moteur (`src/engine/`), pas des fichiers ; les 91 techniques ont toutes leur vignette et aucune animation enregistrée n'est orpheline.",
"- `anciennes-tenues/` : les 7 tenues de chaque coach (6 disciplines + JJB no-gi) sont chargées par l'application ; les tenues d'arbitre (`arbitre.glb` d'Amara, `arbitre-judo.glb` de Kadir) servent aux illustrations de l'encyclopédie (`src/domain/encyclopedia/images.ts`) : elles restent dans `public/`, mais l'APK ne les embarque plus (`tools/build/nativeOnly.ts`). Les tenues de Kaila et d'Axel sont avec leurs modèles dans `anciens-modeles-3d/`.",
'','## Liste complète','']
for c in cats:
    L=by.get(c,[])
    if not L: continue
    out+=[f'### `{c}/`','','| Chemin d\'origine | Motif | Octets |','|---|---|---:|']
    for a,b,r in sorted(L): out.append(f'| `{a}` | {r} | {size(b)} |')
    out.append('')
open('_ARCHIVES_HORS_APPLICATION/inventaire-archives.md','w').write('\n'.join(out)+'\n')
print(len(rows), tot)
