# Standards des personnages 3D humains

Règles permanentes et obligatoires pour tous les coachs de Combat Shadow Studio, actuels et futurs.
Demandées par Youssef le 11/11/2026 (« Humanisation globale et règles permanentes des personnages 3D »),
inscrites en 1.34.0. Elles sont appliquées par le code (`src/three/human/`) et vérifiées par des tests
automatiques ; ce document seul ne suffit pas.

## 1. Le moteur commun : Human Behavior & Facial Expression Engine

Un seul moteur pour tous les personnages. Aucune logique faciale propre à un coach.

| Fichier | Rôle |
| --- | --- |
| `src/three/human/behavior.ts` | Les 8 états de comportement, leurs humeurs du visage, les transitions, la fatigue. Logique pure, sans three.js. |
| `src/three/human/capabilities.ts` | Ce que le modèle sait faire, lu dans les noms de ses os et de ses morph targets (niveau `complet`, `os`, `minimal`, `aucun`). |
| `src/three/human/profiles.ts` | Le registre des personnages : un profil par coach (contrat, traits, rythme des clignements). |
| `src/three/face.ts` (`FaceAnimator`) | Applique le tout à chaque image : clignements, regard, tête, épaules, expressions (morphs ou os). |
| `src/three/breath.ts` | Respiration du thorax et du ventre (shader, peau et vêtements). |
| `src/engine/player.ts` (`alive`) | Vie du corps en garde : transferts de poids, buste, garde, tête. |

Branchement : `PhotoCoach` crée un `FaceAnimator` pour **chaque** modèle chargé, avec le profil trouvé par
`humanProfileFor(url)` (profil standard si le coach n'est pas encore enregistré). `CoachStage` remplit à chaque
image les signaux de la séance (`HumanSignals` : lecture, pause, repos entre répétitions, phase de la technique,
répétitions terminées) et les passe au moteur.

Ordre d'une image : le moteur d'animation pose le corps (`rig.apply`), puis le visage (`face.update`) : tête,
regard, paupières, expressions. **Le moteur humain ne modifie jamais la technique** : il ne touche ni aux
membres, ni au bassin, ni au buste. Il n'ajoute à la tête et aux clavicules que de petites rotations qu'il
retire à l'image suivante si le moteur d'animation ne les a pas réécrites (pause).

### Les états

| État | Quand | Visage |
| --- | --- | --- |
| neutre | en pause, rien ne joue | détendu, bouche fermée |
| concentration | en garde pendant la séance (et sans séance : Lab, écrans) | sourcils un peu bas, yeux attentifs |
| preparation | phase de préparation d'une technique | regard fixe, lèvres posées, yeux un peu ouverts, pas de coup d'œil |
| effort | exécution d'une technique | sourcils bas, yeux plissés, expiration brève |
| frappe | effort mesuré au-dessus de 0,82 (frappe puissante) | idem plus marqué, maintenu 0,25 s puis relâché |
| fatigue | repos entre répétitions après un long effort | paupières lourdes, sourcils intérieurs relevés, bouche qui s'entrouvre à l'expiration |
| recuperation | repos entre répétitions | respiration qui se calme, bouche qui se referme |
| encouragement | 1,8 s après chaque répétition terminée | léger sourire, sourcils relevés, petit hochement de tête |

Toutes les expressions sont **temporaires** : chaque état a une humeur cible atteinte en douceur
(0,08 à 1,2 s) et l'effort retombe dès que les membres ralentissent. Aucune expression d'effort ne reste figée.

## 2. Contrat technique d'un modèle 3D

Un nouveau coach doit atteindre le niveau **`complet`** :

- format glTF binaire (`public/coaches/<id>/photo.glb`), squelette aux noms Mixamo (`Hips`, `Spine`…`Neck`, `Head`) ;
- os `LeftEye` et `RightEye` au centre des globes oculaires, l'œil regardant vers l'avant du modèle (+Z) au repos ;
- os `Neck` et `Head` ;
- les **25 expressions ARKit** du moteur en morph targets sur le visage (noms `AK_nn_<Nom>`, liste
  `FACE_EXPRESSIONS` de `src/three/face.ts`) : `BrowDownLeft/Right`, `BrowInnerUp`, `CheekPuff`,
  `CheekSquintLeft/Right`, `EyeBlinkLeft/Right`, `EyeSquintLeft/Right`, `EyeWideLeft/Right`, `JawOpen`,
  `MouthClose`, `MouthFrownLeft/Right`, `MouthFunnel`, `MouthPressLeft/Right`, `MouthSmileLeft/Right`,
  `MouthStretchLeft/Right`, `NoseSneerLeft/Right` ;
- la bouche du modèle doit pouvoir être **fermée** au repos (avec `MouthClose` à 0,22 au plus) sans montrer les dents ;
- couleur des lèvres naturelle (ni grise ni bleutée) dans les deux éclairages de l'app ;
- les morphs sont retirés automatiquement des parties qui ne bougent pas (`dropStillMorphs`).

Chaîne Rocketbox : `tools/generator/rocketbox/morph_extract.py` puis `morph_apply.py` après **chaque**
reconstruction d'un `photo.glb`.

Niveaux inférieurs : depuis la 1.37.0, aucun coach de l'application ne les utilise. La liste `LEGACY_DEGRADED`
est vide et ne doit plus jamais recevoir de coach (Axel et Kaila, MakeHuman, niveau « os », et les modèles
générés de secours, niveau « aucun », ont été retirés et rangés dans `backup CS/`). Le moteur sait toujours
reconnaître ces niveaux (`src/three/human/capabilities.ts`).

## 3. Comportements humains obligatoires

- **Respiration** naturelle et irrégulière, plus profonde et plus rapide après l'effort (`breath.ts`), visible au
  thorax, au ventre et aux épaules ; le visage respire avec le thorax (narines, lèvres).
- **Clignements** réalistes : toutes les 3 à 6 s, irréguliers, parfois doubles, souvent avec un coup d'œil,
  plus fréquents fatigué, plus rares concentré ; au pic d'une frappe une fois sur deux.
- **Regard actif** orienté vers l'adversaire (devant le coach, à hauteur de ses yeux), quelle que soit
  l'inclinaison de la tête en garde ; micro-saccades ; coups d'œil de côté au repos, jamais vers le sol,
  jamais pendant la préparation ou la frappe ; la paupière supérieure suit l'œil ; la tête suit les grands
  coups d'œil. Au-delà de 30° (au sol, en rotation) le regard suit la tête.
- **Bouche détendue au repos** : fermée, sans crispation ni sourire figé ; elle ne s'ouvre que brièvement à
  l'expiration de la frappe ou, fatigué, à l'expiration.
- **Expressions contextuelles** : les 8 états ci-dessus, avec retour au neutre.
- **Réactions pendant les frappes**, proportionnelles à la vitesse mesurée des mains et des pieds (mesurée dans
  l'espace du modèle : déplacer le coach n'est pas une frappe ; jamais sur la première image).
- **Micro-mouvements** du corps en garde (transferts de poids, garde, buste) et de la tête (dérive lente).
- **Pause et reprise** : en pause la technique est figée, le visage reste vivant (clignements, respiration) ;
  la reprise repart de l'état courant, sans saut.

## 4. Intégration d'un nouveau personnage (procédure)

1. Modèle conforme au contrat (section 2), licence CC0 ou MIT seulement.
2. Ajouter le coach à `src/domain/coaches/catalog.ts` **et** son profil à `HUMAN_PROFILES`
   (`src/three/human/profiles.ts`) avec `contract: 'complet'`. Ses particularités passent par `traits`
   (expressivité, chaleur du sourire, endurance) et `blinkRate`, jamais par du code à part.
3. Lancer `npx vitest run src/three/human src/three/__tests__/face.test.ts` : les tests de contrat échouent si le
   coach n'est pas enregistré, si son modèle n'a pas les 25 expressions, les yeux, la tête et le cou.
4. Ajouter le coach aux listes `COACHES` des tests `gaze.test.ts` et `face-behavior.test.ts`.
5. Captures de contrôle (Lab, `?etat=` pour chaque état) : face, trois quarts, profil.

## 5. Critères de validation (bloquants)

Un personnage n'est **pas** validé si :

- son visage reste totalement figé (pas de clignement, pas de regard qui bouge) ;
- sa bouche est crispée en permanence, ou entrouverte au repos ;
- son regard est orienté artificiellement (vers le sol, fixe, en dehors de l'adversaire en garde) ;
- ses expressions ne reviennent pas au neutre après l'effort ;
- son squelette provoque des déformations visibles (tests `photo-coach`, `neck-v133`, limites articulaires) ;
- le moteur comportemental ne fonctionne pas sur lui (tests `src/three/human/__tests__`) ;
- ses animations dégradent nettement les performances mobiles.

Tests qui appliquent ces critères :

| Test | Vérifie |
| --- | --- |
| `src/three/human/__tests__/contract.test.ts` | registre complet, capacités de chaque modèle, liste des modèles dégradés figée |
| `src/three/human/__tests__/gaze.test.ts` | regard à moins de 2,5° de l'horizon en garde (4 styles), les deux yeux ensemble |
| `src/three/human/__tests__/face-behavior.test.ts` | bouche au repos, retour au neutre, clignements irréguliers, pas de grimace au démarrage, pause, coût par image |
| `src/three/human/__tests__/behavior.test.ts` | 8 états, transitions douces, fatigue, encouragement |
| `src/three/__tests__/face.test.ts`, `src/three/face-mouth.test.ts`, `src/three/__tests__/expressions-v1160.test.ts` | os du visage, bouche (1.33), expressions |

## 6. Contraintes de performance

- Aucune dépendance ajoutée ; calcul sur le processeur, quelques dizaines d'opérations vectorielles par image.
- Aucun vecteur ni quaternion créé par image dans `FaceAnimator.update` (objets de travail réutilisés).
- Coût mesuré par test : moins de 0,15 ms par image et par coach sur la machine de test.
- Les morphs sont posés sur la seule partie visage (pas de texture de morphs pour le corps : 6 Mo évités).
- Rien ne dépend de la cadence d'images : temps réel borné (pas de saut après une pause ou un onglet en arrière-plan).

## 7. Non-régression

- Ne jamais remplacer un visage validé, changer l'identité d'un coach, ses coiffures ou ses barbes, ni sa
  morphologie sans justification.
- Ne pas dégrader les animations techniques : le moteur humain n'écrit que la tête (petite rotation), les yeux,
  les paupières, les os du visage, les clavicules (respiration) et les morphs du visage.
- Ne jamais affaiblir ni supprimer un test de ce document sans raison écrite dans `docs/JOURNAL_CORRECTIONS.md`.
- Toute modification passe par Vitest, Playwright et la compilation, puis est consignée au journal.

## 8. Limites connues

- Les gants de garde haute masquent souvent la bouche d'Amara et d'Inaya de face.
- Le regard vise un adversaire supposé devant le coach à hauteur de ses yeux (il n'y a pas d'adversaire réel
  dans la scène, sauf en duo).
- Les portraits des cartes (`portrait.webp`) sont des images fixes antérieures : ils ne montrent pas ce regard.
