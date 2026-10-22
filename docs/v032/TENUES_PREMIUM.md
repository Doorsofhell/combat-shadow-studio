# v0.32 · Corrections premium des tenues, du chargement et de l'écran « Choisis ton coach »

Demande de Youssef du 2026-10-22 à 10:33, « CORRECTIONS PREMIUM ». À 10:35, il a demandé de partir de la v0.32
(« par sur v32 »).

- Branche : `feature/tenues-premium-v032`, créée depuis `feature/biomeca-v032` (`18ad838`, v0.32.0-proto1).
- Point de restauration : branche `restauration/avant-tenues-premium` (v0.31.0, `04b0b5e`).
- Rien n'est fusionné ni déployé sans l'accord de Youssef.

## Ce qui n'a pas été touché

Les personnages sont strictement conservés : visages, morphologie, peau, cheveux, squelette, rig, animations et
gardes. Les fichiers `photo.glb`, `src/engine/` et `src/three/pose.ts` ne sont pas modifiés par ce lot
(`git diff 18ad838 -- public/coaches/*/photo.glb src/engine` est vide). Les corrections de stabilité WebGL ne sont
pas modifiées.

## 1. Chargement : plus de coach en sous-vêtements (commit `7c8dc78`)

**Constat vérifié** : le corps du coach (déjà en mémoire) s'affichait immédiatement, puis la tenue arrivait quelques
images plus tard. Un nouveau test l'a mesuré : **3 images** dessinées sans la tenue dès le premier chargement.

**Correction** (`src/three/PhotoCoach.tsx`, `src/three/outfit.ts`) :

- le coach reste invisible tant que sa tenue n'est pas portée ;
- l'état « chargement » est actif dès la première image ;
- les textures et les shaders de la tenue sont envoyés à la carte graphique avant l'affichage (`initTexture`,
  `compileAsync`) ;
- si la tenue ne répond pas en 20 s ou échoue, le coach s'affiche avec sa tenue de base et le message existant le
  signale. Il ne reste donc jamais invisible.

**Test** : `tests/e2e/outfit-loading.spec.ts` couvre le premier chargement, le changement de discipline, le
changement de coach et le retour à l'entraînement. Il compte, image par image, les images dessinées sans la tenue :
0 avec la correction, 3 sans elle.

## 2. Judogis et gis BJJ (commit `284c9ae`)

| Défaut constaté | Cause | Correction |
|---|---|---|
| Aspect « gros tricot » | Relief de tissage de 8 mm, très marqué | Grain de riz à l'échelle réelle : judogi en double tissage (2,6 × 3,9 mm), gi BJJ en tissage perle (2 × 3 mm), relief faible, texture couleur qui marque le creux des fils, coton mat |
| Manches dentelées | Tout point de peau avec 5 % de poids de la main était exclu, donc la manche suivait les triangles de la peau | La coupe droite seule décide. Les ourlets sont posés sur leur coupe. Les poids de la main et du pied sont reportés sur l'avant-bras et la jambe |
| Effet gonflé, rembourré | Veste à 1,4–1,8 cm du corps, épaisseur 5–6 mm, jupe à 2,5–4,5 cm | Environ deux fois moins de volume, tissu de 3–4 mm, plis doux, et le tissu se ramasse au-dessus des chevilles |
| Col fin, peu visible | Ruban de 4,5–5 cm sans structure | Col renforcé et cousu (judogi : 5,5 cm, 1,2 cm d'épaisseur, 7 rangs de coutures ; BJJ : 4,2 cm, 1 cm, 4 rangs). Revers prolongé jusqu'à l'ourlet de la veste |
| Ceinture en tube, nœud en boule | Anneau épais et ellipsoïde | Ceinture plate de 4 cm avec 9 rangs de coutures, nœud carré (tour et passage croisé) et deux extrémités plates de 22 et 24 cm |
| Petits trous (nombril) et haut noir qui traverse le gi d'Amara | Trous du maillage du corps, veste plus proche que le rashguard | Petits trous fermés, la veste reste toujours au-dessus du rashguard |

**Judogi et gi BJJ sont distincts** : le judogi a un tissu plus épais à plus gros grain, un col plus large, des
manches plus amples et une jupe plus longue. Le gi BJJ est plus ajusté, avec un tissage perle plus fin.

## 3. Autres tenues (commit `284c9ae`)

- **Shorts** :
  - satin moins brillant (rugosité 0,32 → 0,6) ;
  - polyester mat pour le kick-boxing ;
  - relief adouci, qui dessinait des vagues ;
  - ceinture en élastique côtelé au lieu du tricot, qui ressemblait à une corde ;
  - fente du short MMA retirée : découpée sur les triangles de la peau, elle paraissait déchirée.
- **Gants** : forme moins sphérique (bloc arrondi), cuir moins brillant, sangle en élastique.
- **Protège-tibias** : manchon complet autour du tibia, avec des bords droits sous le genou et au-dessus de la
  cheville. Il est rembourré devant et plus fin derrière. Avant, seule la peau tournée vers l'avant était couverte,
  avec un contour dentelé.
- **Rashguards et leggings** : jersey fin (lycra) à la place du tricot épais. Les manches ont des ourlets droits.

**Test** : `src/three/__tests__/outfit-v032.test.ts` (12 tests sur les fichiers livrés), tous en échec sur les
fichiers v0.31. Il vérifie :

- l'absence de poids de la main sur les manches et du pied sur les pantalons ou les protège-tibias ;
- la texture couleur et le relief du gi, et un coton mat ;
- le nœud, les deux extrémités de la ceinture et les deux revers ;
- la matité des shorts et des ceintures.

## 4. Écran « Choisis ton coach » (commits `f7508c1`, `e7ddf2f`)

- Les dessins cartoon sont remplacés par des rendus des **vrais modèles 3D** (`scripts/dev/shot-portraits.mjs`).
  Le rendu utilise le modèle Ultra-réaliste, la tenue MMA, la garde et l'éclairage de l'entraînement. Les images
  font 900 × 1200 px (450 × 600 points en densité 2), cadrées sur le corps.
- L'écran de bienvenue utilise le même composant.
- La sélection, la validation, la navigation et la sauvegarde ne changent pas.

## 5. Captures

Captures dans la page de revue :

- 14 tenues (2 coachs × 7, avec le gi et le no-gi), avant et après, de face, de profil, de dos et en mouvement ;
- gros plans des gis : torse, ceinture, manche, pantalon, dos ;
- écran de sélection avant et après.

Les scripts sont `scripts/dev/shot-outfits.mjs`, `shot-gi-closeups.mjs` et `shot-coach-select.mjs`.

## 6. Limites

- Pas de simulation de tissu : les gis suivent le corps avec des plis fixes et ne flottent pas.
- Protège-tibias sans partie sur le cou-de-pied. La pièce posée sur le pied ne tombait pas juste, je l'ai retirée
  plutôt que de livrer un objet qui flotte.
- Short MMA sans fente latérale (une fente propre demanderait une découpe dédiée).
- Le haut des sous-vêtements peints sur le corps de Kadir reste visible au-dessus de certaines ceintures de short
  (corps non modifié, par consigne).
- Poids des tenues inchangé : 0,4 à 1,1 Mo pour Kadir, 0,9 à 2,2 Mo pour Amara. Une seule tenue est chargée à la
  fois.
- Aucun test sur un vrai téléphone Android : NON EXÉCUTÉ.
