# Glissement des pieds sur le tapis

Généré par `AUDIT_UPDATE=1 npx vitest run src/engine/__tests__/glide.test.ts`. Ne pas modifier à la main.

Mesure : à 60 images par seconde, sur le squelette posé de Kadir, Amara, Naël et Inaya (garde du coach, droitier et gaucher), déplacement horizontal de l’avant de chaque pied qui touche le tapis à deux images de suite. 1,5 cm par image correspond à 0,9 m/s : un pivot, un pas glissé (suri-ashi), un shuffle.

Correction 1.41.0 (moteur, `glideLift` et `lowLift` dans `src/engine/motion.ts`) : un pied écrit au sol à deux endroits différents, ou qui décolle et se pose en restant bas, était traîné sur le tapis. Au-delà d’un pas glissé lent, il quitte maintenant le tapis sur un petit arc (4,5 cm au plus) et se pose à l’endroit écrit. Les pieds immobiles, les pivots lents et les coups de pied qui montent franchement ne changent pas.

Glissement cumulé de toute la bibliothèque (4 coachs, droitier et gaucher) : 81 m (1.40.3, même mesure : 336 m).

| Technique | Pire glissement 1.40.3 (cm / image) | Pire glissement (cm / image) | Pire cas | Limite |
|---|---|---|---|---|
| `sit-out` | 15,1 | 13,68 | inaya bjj gaucher | 13,7 (balayage, en attente) |
| `changement-base` | 15,1 | 13,16 | nael bjj gaucher | 13,2 (balayage, en attente) |
| `releve-technique` | 11,9 | 10,44 | inaya mma | 10,5 (balayage, en attente) |
| `uchikomi-ko-uchi-gari` | 8,6 | 8,65 | mma-amara judo | 8,7 (balayage, en attente) |
| `uchikomi-o-uchi-gari` | 6,6 | 6,58 | nael judo gaucher | 6,6 (balayage, en attente) |
| `releve-genoux` | 6,3 | 4,25 | mma-amara bjj | 4,3 (balayage, en attente) |
| `ukemi-yoko` | 3,1 | 3,15 | mma-amara judo | 3,2 (balayage, en attente) |
| `sprawl` | 10,5 | 2,81 | nael mma gaucher | 2,9 (balayage, en attente) |
| `defense-lutte` | 5,8 | 2,57 | nael mma | 2,6 (balayage, en attente) |
| `ukemi-ushiro` | 2,3 | 2,29 | mma-amara judo gaucher | 2,3 (balayage, en attente) |
| `uchikomi-o-goshi` | 7,5 | 2,07 | nael judo | 2,1 (balayage, en attente) |
| `kuzushi` | 3,5 | 1,99 | inaya judo gaucher | 2,0 (balayage, en attente) |
| `uchikomi-seoi` | 8,3 | 1,84 | nael judo | 1,9 (balayage, en attente) |
| `single-leg` | 7,0 | 1,83 | nael mma | 1,9 (balayage, en attente) |
| `switch-kick` | 19,8 | 1,37 | nael kickboxing gaucher | 1,5 |
| `tai-sabaki` | 7,5 | 1,28 | mma-kadir judo | 1,5 |
| `check-arriere` | 1,1 | 0,98 | mma-kadir mma | 1,5 |
| `descente-sol` | 6,7 | 0,89 | nael bjj gaucher | 1,5 |
| `pont` | 4,4 | 0,88 | inaya bjj gaucher | 1,5 |
| `retention-garde` | 4,4 | 0,88 | inaya bjj gaucher | 1,5 |
| `entree-lutte` | 7,6 | 0,74 | inaya bjj gaucher | 1,5 |
| `check-hook` | < 1 | 0,55 | mma-kadir mma | 1,5 |
| `ayumi-ashi` | 1,5 | 0,54 | nael judo | 1,5 |
| `uchikomi-o-soto-gari` | 3,7 | 0,46 | nael judo | 1,5 |
| `sortie-hanche` | 4,4 | 0,39 | nael mma | 1,5 |

## Balayages encore au-dessus de 1,5 cm par image (en attente de revue)

Bornés à leur valeur 1.41.0 par le test (ils ne peuvent pas empirer). Une partie est voulue (ko-uchi-gari et o-uchi-gari fauchent le pied le long du tapis, le sit-out et le changement de base passent une jambe sous le corps, les chutes) ; le reste (sprawl, descente au sol, relevés) se règle mouvement par mouvement, avec l’accord de Youssef.

- sit-out : jusqu’à 13,7 cm par image
- changement-base : jusqu’à 13,2 cm par image
- releve-technique : jusqu’à 10,5 cm par image
- uchikomi-ko-uchi-gari : jusqu’à 8,7 cm par image
- uchikomi-o-uchi-gari : jusqu’à 6,6 cm par image
- releve-genoux : jusqu’à 4,3 cm par image
- ukemi-yoko : jusqu’à 3,2 cm par image
- sprawl : jusqu’à 2,9 cm par image
- defense-lutte : jusqu’à 2,6 cm par image
- ukemi-ushiro : jusqu’à 2,3 cm par image
- uchikomi-o-goshi : jusqu’à 2,1 cm par image
- kuzushi : jusqu’à 2,0 cm par image
- uchikomi-seoi : jusqu’à 1,9 cm par image
- single-leg : jusqu’à 1,9 cm par image
