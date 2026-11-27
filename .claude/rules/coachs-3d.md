---
paths:
  - "src/three/**"
  - "public/coaches/**"
  - "tools/generator/**"
  - "src/domain/coaches/**"
  - "scripts/v2*/**"
---

# Coachs 3D : modèles, visages, tenues

Lire `docs/HUMAN_CHARACTER_STANDARDS.md` avant tout changement. Les règles « Personnages 3D » de `CLAUDE.md` s'appliquent.

## Identité (règles permanentes de Youssef)
- Six coachs : Kadir, Amara, Naël, Inaya (Rocketbox MIT), Victor (copie de Kadir), Kanya (copie d'Inaya, 1,68 m). Ne jamais changer leur identité, leur visage validé, leur coiffure, leur barbe ni leur morphologie.
- **Aucune mise à jour de Kadir sans validation de Youssef.** `photo.glb` de Kadir et les tenues verrouillées (Inaya toutes, Kadir toutes, Naël MMA) sont protégés par empreinte SHA dans les tests (`outfit-rollback-v1373`).
- Ne jamais réduire la musculature d'Inaya. Les coachs restent athlétiques avec une musculature naturelle, rien de saillant.
- Aucune jointure visible entre la tête et le corps (couture du cou).
- Humaniser un visage n'ajoute jamais de traits ou de marques dessinés (rides procédurales désactivées : `WRINKLES_ON_COACHES=false`).
- Le chantier cou/nuque 1.52.0 est abandonné : ne pas le réutiliser.
- Jamais de photos de personnes réelles ni de ressemblance avec un champion réel (refus de la ressemblance avec Khabib).
- Cheveux des femmes : garder les cheveux actuels, ne plus proposer de cheveux 3D.
- Ressources : CC0 ou MIT seulement, pas de CC-BY, rien d'acheté (Youssef, 27/11/2026).
- Visée : qualité de jeu de combat premium (niveau Street Fighter 6) sans copier aucun élément protégé.

## Pièges de génération
- Après une reconstruction de `photo.glb` Rocketbox : relancer `tools/generator/rocketbox/morph_apply.py`.
- Ne jamais reconstruire Victor depuis le GLB de Kadir. Ne jamais relancer `peau_propre.py`/`peau_unie.py` (les `donnees/*.jpg` sont déjà nettoyés), ni `tenues_suivent.py` sur des tenues déjà déplacées.
- `short_poids.py --auto` décolle le short de la cuisse (peau visible) et ne doit jamais tourner sur le short MMA de Victor.
- Les scripts glTF-Transform doivent écrire `VertexLayout.SEPARATE`, sinon `outfit.test` échoue. Les textures de tête sont en JPEG (q92). Chaque GLB doit faire moins de 3,5 Mo.
- Scripts de construction : `set -eo pipefail`. Ne jamais les passer dans `head` (le SIGPIPE coupe la construction sans erreur). Ne jamais nommer un script bpy `inspect.py`.
- La hauteur du rig vient du haut du maillage : les cheveux ne doivent pas monter le haut de la tête.
- Le build compresse la géométrie, pas les textures. Les fichiers `_proto-*.glb` ne sont jamais commités.
- Avant de refaire un correctif, chercher s'il existe déjà sur une branche non fusionnée : `git log --all -- <fichier>`.
- Un nouveau corps de coach reçoit automatiquement les os de torsion (`src/three/twist.ts`) : relancer `torsion-v250.test.ts`.

## Lab et captures
- Paramètres du Lab : voir `CLAUDE.md`. `style=` doit être un StanceStyle (`boxing`, `kickboxing`, `mma`, `muaythai`, `judo`, `bjj`). `style=boxe` fait planter le Lab.
- Ne jamais lancer plusieurs captures swiftshader en parallèle (images blanches). Ne pas éditer `src/` pendant des captures sur `vite dev` (le rechargement à chaud les fausse).
- Toujours vérifier les captures finales en gros plan (500 px, dos et face) avant d'en parler. Méthode complète : skill `captures-avant-apres`.

## Règles « Personnages 3D » (reprises de CLAUDE.md)
comportement. En résumé :

1. Tous les coachs passent par le moteur commun **Human Behavior & Facial Expression Engine**
   (`src/three/human/` + `FaceAnimator` dans `src/three/face.ts`). Ne jamais écrire de logique faciale propre à un
   coach : ses particularités vont dans son profil (`src/three/human/profiles.ts`).
2. Tout nouveau coach est enregistré dans `HUMAN_PROFILES` avec `contract: 'complet'` et son modèle porte les
   25 expressions ARKit, les os `LeftEye`/`RightEye`, `Neck`, `Head`. La liste `LEGACY_DEGRADED` est vide depuis
   la 1.37.0 et doit le rester.
3. Comportements obligatoires : respiration naturelle, clignements irréguliers, regard actif vers l'adversaire
   (jamais vers le sol en garde), bouche fermée et détendue au repos, expressions contextuelles temporaires
   (8 états) avec retour au neutre, réactions aux frappes, micro-mouvements, pause et reprise respectées.
4. Le moteur humain ne modifie jamais la technique (membres, bassin, buste) ; il n'agit que sur les yeux, les
   paupières, le visage, une petite rotation de la tête et les clavicules (respiration).
5. Critères bloquants : visage figé, bouche crispée ou entrouverte au repos, regard artificiel, expression qui
   ne revient pas au neutre, déformation du squelette, moteur inactif, perte de performance mobile.
6. Les tests `src/three/human/__tests__/` (contrat, regard, comportement, visage) doivent passer ; un nouveau coach
   est ajouté à leurs listes.
7. Ne jamais remplacer un visage validé, changer l'identité, les coiffures, les barbes ou la morphologie d'un
   coach, ni ses tenues sans raison.

## Repères techniques
- Coachs : `src/domain/coaches/catalog.ts` ; modèles `public/coaches/<id>/photo.glb` (Rocketbox MIT : Kadir,
  Amara, Naël, Inaya ; Victor sur Kadir et Kanya sur Inaya, chaînes dans `tools/generator/{victor,kanya}/`). Un seul rendu, Ultra-réaliste (1.37.0) : pas de style dessiné, pas de coach généré, pas de
  créateur de combattant. Axel et Kaila (MakeHuman) sont retirés.
- Tout ce qui est retiré de l'application est rangé dans `_ARCHIVES_HORS_APPLICATION/<catégorie>/<chemin d'origine>`
  (hors build, gardé sur GitHub, motif dans `inventaire-archives.md` ; l'ancien `backup CS/` y est depuis la 1.56.4).
  Carte des dossiers : `docs/ARCHITECTURE.md`. Les squelettes
  générés que mesurent les tests du moteur sont dans `tests/fixtures/modeles-generes/`.
- Moteur d'animation : `src/engine/` (`rig.ts`, `player.ts`, `motion.ts`) ; scène : `src/three/CoachStage.tsx`,
  `src/three/PhotoCoach.tsx`.
- Lab de captures : `#/lab?champion=<id>&look=realiste&d=<discipline>&frame=1&motion=garde&az=&el=&span=&fy=`,
  `etat=<état>` pour un état du comportement, `expr=Nom:poids` pour une expression, `face=live` pour le visage vivant.
- Après toute reconstruction d'un `photo.glb` Rocketbox : relancer `tools/generator/rocketbox/morph_apply.py`.
