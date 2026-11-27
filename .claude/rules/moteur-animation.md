---
paths:
  - "src/engine/**"
  - "src/three/CoachStage.tsx"
  - "src/three/PhotoCoach.tsx"
  - "src/ui/training/**"
---

# Moteur d'animation et scène

- Les animations sont des poses clés biomécaniques résolues par notre IK (`src/engine/rig.ts`, `player.ts`, `motion.ts`). Il n'y a pas d'IA dans le moteur : ce sont des corrections par règles et des mesures de test.
- **Le coach reste toujours entièrement visible** pendant tous les mouvements, cadré naturellement, jamais coupé, sans zoom serré : la caméra recule (règle permanente de Youssef).
- Un mouvement validé ne change jamais en silence. Les fautes pédagogiques sont signalées puis corrigées seulement après la validation de Youssef.
- On ne corrige jamais l'utilisateur. Le but est que chaque geste du coach soit réel, humainement faisable, sans torsion anormale, et fluide.
- Les corrections sont rattachées à des sources écrites (fédérations). Ne jamais prétendre avoir analysé une vidéo dont on n'a lu que le titre.
- Les drapeaux du moteur sont dans `src/engine/v230.ts` (Lab `?v230=-drapeau`, tests `V230=`). Pour comparer avant et après : Lab `?torsion=0`, `?v220=0`.
- Limites connues à ne pas casser : `extension-v032` S3 (le pic de l'épaule précède celui du poing), la chaîne bassin vers buste des crochets (`torso-chain-v1331`), et le contact au sol (`floor-contact.test.ts`).
- Les vitesses de pas sont proportionnelles à la taille du coach (`glideSpeedOf`). Les zones de déformation sont mises à l'échelle (`SCALED_FROM`).
- La stabilité WebGL (perte de contexte, mode 3D sûr `src/three/safe3d.ts`) n'est jamais modifiée sans raison (Youssef : « ne touche pas aux corrections de stabilité WebGL »).
