# Lot 3 : animations de combat, suite (après la 2.3.x)

Demande : Youssef, 20/11/2026 13:33, « On revient à l’amélioration des animations de combat des coachs. Il reste aussi
des choses à faire. » Base : v2.3.2 (`d5b3b9b`), la dernière en ligne. Restauration : `restauration/avant-animations-lot3`.
Branche : `claude/project-thread-8zq3n9`. **Rien n’est fusionné ni publié.**

Travail fait sur la liste des anomalies restantes du rapport 2.3.0 (`docs/v230/RAPPORT_V230.md` § 6), dans l’ordre
annoncé à Youssef, plus les 3 tests d’écran restés en échec.

## 1. Les 3 tests d’écran en échec à la fin de la 2.3.0

| Test | Constat vérifié | Suite |
|---|---|---|
| `training-layout.spec:117` écran sans défilement | réussi seul sur la 2.3.2 | échec dû à la charge de la machine pendant la suite ; rien à corriger |
| `coaching-hud.spec:60` nom du coup Jab → Direct → Low kick | échoue aussi sur la 2.2.0 (build `72d9bd5` refait pour la vérification) | défaut antérieur, sans lien avec les animations ; laissé tel quel |
| `training-layout.spec:336` caméra Auto | réussi sur la 2.2.0, échec sur la 2.3.2 | **corrigé** (test), voir ci-dessous |

Caméra Auto : relevé image par image de la caméra pendant la séance « Pivots et angles » (jab, pivot, direct, pivot,
jab, direct). Pendant le direct, la caméra est bien à 7° de hauteur ; elle monte à 24° pendant le pivot qui suit,
comme prévu. Le test attendait 3,5 s fixes après l’apparition du direct ; depuis la 2.3.0 le direct est plus court (plus
d’arrêt figé à l’impact) et ne reste qu’environ 3 s à l’écran : le test lisait la caméra du pivot. Le test attend
maintenant que la caméra soit immobile, la lit, et vérifie que le direct est toujours joué au moment de la lecture ;
les mêmes seuils sont gardés (hauteur < 12°, angle par rapport au coach < 6°). Réussi 3 fois sur 3.

## 2. Corrections (chacune annulable seule : `?v230=-sprawlPath` etc. dans le Lab)

| Interrupteur | Technique | Constat vérifié | Correction | Résultat (6 coachs) |
|---|---|---|---|---|
| `sprawlPath` | sprawl | en descendant les mains, le bras monte à plus de 110° du buste qui se penche ; l’épaule arrive en butée de rotation interne et le seul moyen de la respecter est de faire tourner le coude autour du bras, d’un côté puis de l’autre d’une image à la suivante | les mains descendent plus bas et moins loin (35 % × 50 % de la taille au lieu de 50 % × 60 %) | rotation parasite du coude : Kadir 163° → 33°, Victor 113° → 33°, Naël 82° → 29° ; plus aucun coude dans les 45° ; aucune butée ni traversée |
| `sotoPole` | uchikomi o-soto-gari | le genou de la jambe qui fauche était écrit « vers l’avant » à l’élan et « vers l’arrière » au fauchage : entre les deux, aucune direction, il basculait | au fauchage, le genou pointe vers le tapis (jambe tendue en arrière) | genou : 83-90° → 13-16° ; saut de vitesse 24-25 → 4-6 |
| `kneeRelease` | genoux direct et circulaire (hors clinch) | le genou attendait 150 ms à l’impact pendant que les mains revenaient en garde (plus long arrêt de tous les coups) | le genou commence à redescendre pendant le retour des mains (35 % du chemin), tenue d’impact 30 ms au lieu de 60 | arrêt 150 ms → 58 ms (Victor genou circulaire avant : 142 → 50 ms) ; vitesse à l’impact inchangée |

Le reste du moteur n’est pas touché : sur 1 272 mesures, seules les 66 de ces techniques changent
(`docs/v230/audit/lot3-avant.json` et `lot3-apres.json`).

| Compte sur les 1 272 mesures | Avant | Après |
|---|---|---|
| Rotation parasite d’un coude ou genou > 90° en 1/60 s | 8 | 6 |
| Rotation parasite > 45° | 34 | 25 |
| Sauts de vitesse > 10 | 38 | 32 |

## 3. Essais annulés (avec la raison)

- **Sprawl, côté moteur** : faire renoncer le solveur aux grandes rotations du coude (bras levé) supprimait la bascule,
  mais l’épaule dépassait alors son amplitude (jusqu’à 81° de rotation interne pour 70°, 90° sur Victor) :
  `torsion-range` et `photo-coach` le refusent à juste titre. Repartir de la rotation de l’image précédente n’aidait pas :
  le chemin des mains imposait vraiment un tour complet du coude. D’où la correction du chemin des mains.
- **Chute sur le côté (yoko-ukemi)** : la bascule de 166-169° du coude vient de la main qui frappe le tapis, écrite
  coude vers le ciel (épaule tournée de 180°, impossible). Coude vers le tapis : bascule 169° → 12°, mais le bras
  entre de 4 à 13 cm dans le tapis en se repliant (`floor-contact`). Six orientations et deux longueurs de bras
  essayées : toujours 4 à 6 cm sous le tapis. Annulé ; il faut réécrire le roulé lui-même (proposition).
- **Genoux en clinch** : même relâchement que les genoux libres, mais le tibia frôle l’autre jambe (2,5 cm pour 2 cm
  admis) : les genoux en clinch gardent leur rythme.

## 4. Vérifié, sans défaut

- **Low kick, middle kick avant, genoux circulaires** (« épaules avant les hanches » dans le rapport 2.3.0) : relevé
  image par image du low kick arrière de Kadir. Pendant le coup (0,24 → 0,44 s), les hanches tournent avant et plus
  vite que les épaules (−2° → −50° contre 2° → −28°). Le pic de vitesse des épaules relevé avant venait du pas de
  préparation (hanches et épaules tournent ensemble, 17° → 1°). Ce n’est pas un défaut ; rien n’a été changé.

## 5. Non fait dans ce lot

- **Coup de pied latéral** : c’est une nouvelle technique (fiche, consignes, vignettes des coachs, pictogramme) ; à
  proposer à Youssef comme un lot à part.
- Chute sur le côté : voir § 3.

## 6. Tests

- Vitest complet (documents de mesures régénérés) : 1 788 réussis ; 4 échecs, tous déjà présents en 2.2.0 et 2.3.x
  (`expressions-v1160` taille du modèle d’Amara, `fluidity` ×2, `hooks-biomeca` « pas d’armé ») ; le pictogramme
  régénéré est à jour (test réussi seul). TEST RÉUSSI pour `torsion-range`, `photo-coach`, `intrusions`,
  `floor-contact`, `integrity`.
- Playwright : `training-layout:336` TEST RÉUSSI (3/3) ; `training-layout:117` TEST RÉUSSI ; `coaching-hud:60` TEST
  ÉCHOUÉ, déjà en échec en 2.2.0.
- `npm run build` : TEST RÉUSSI.
- Téléphone Android : NON EXÉCUTÉ.

## 7. Captures

Rendus WebGL réels du Lab (même coach, tenue, caméra, lumière) : avant = interrupteurs du lot coupés
(`?v230=-sprawlPath,-sotoPole,-kneeRelease`), après = lot 3. Planches dans `docs/v240/captures/`, vidéos côte à côte
au ralenti ×0,5 dans `docs/v240/videos/`.
