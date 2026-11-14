# Mesures des crochets (v0.42)

Généré par `src/engine/__tests__/hooks-biomeca.test.ts` (`AUDIT_UPDATE=1` pour le mettre à jour). Mesures lues sur le squelette posé, 120 images par seconde, garde orthodoxe (la garde gauchère est vérifiée en miroir par le test).

- **Flexion** : flexion du coude à l’impact (0° bras tendu ; « près de 90° » selon USA Boxing).
- **Coude / épaule** : position du coude par rapport à l’épaule dans le repère du buste, en cm : au-dessus (+), sur le côté (+), devant (+).
- **Derrière max** : la plus grande distance du coude derrière la ligne des épaules pendant le mouvement (négatif : jamais derrière).
- **Rot. ext. max** : rotation externe de l’épaule la plus grande (limite du moteur : 90°).
- **Chemin** : longueur du trajet du poing de la garde à l’impact, divisée par la ligne droite.
- **Vitesse max** : instant où le poing est le plus rapide, et instant de l’impact (s).
- **Plan du coude** : plus grande rotation du plan de flexion du coude en 1/120 s.
- **Tronc** : rotation du buste par rapport au bassin à l’impact.

| Corps | Discipline | Crochet | Flexion | Coude haut | Coude côté | Coude devant | Derrière max | Rot. ext. max | Chemin | Vitesse max / impact | Plan du coude | Tronc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kadir (Ultra-réaliste) | boxe | crochet-avant | 68.7° | 7.6 | 27.3 | -3.4 | 3.4 | 54.7° | 1.74 | 0.185 / 0.200 | 8.0° | -15.6° |
| Kadir (Ultra-réaliste) | boxe | crochet-arriere | 83.3° | 9.9 | 24.9 | 10.0 | -10.0 | 18.5° | 2.19 | 0.208 / 0.230 | 9.0° | 11.5° |
| Kadir (Ultra-réaliste) | boxe | crochet-avant-corps | 76.7° | -9.4 | 26.2 | 6.5 | -6.5 | 39.6° | 1.20 | 0.185 / 0.200 | 4.2° | -15.1° |
| Kadir (Ultra-réaliste) | boxe | crochet-arriere-corps | 92.3° | -3.7 | 21.1 | 18.9 | -18.9 | 15.5° | 1.86 | 0.208 / 0.230 | 5.0° | 10.1° |
| Kadir (Ultra-réaliste) | kick-boxing | crochet-avant | 74.4° | 6.6 | 27.7 | -2.4 | 2.4 | 47.9° | 1.78 | 0.185 / 0.200 | 8.0° | -17.2° |
| Kadir (Ultra-réaliste) | kick-boxing | crochet-arriere | 84.2° | 8.2 | 26.4 | 7.3 | -7.3 | 23.3° | 2.17 | 0.208 / 0.230 | 9.5° | 11.5° |
| Kadir (Ultra-réaliste) | kick-boxing | crochet-avant-corps | 77.5° | -9.1 | 26.1 | 7.2 | -7.2 | 35.2° | 1.24 | 0.185 / 0.200 | 4.1° | -16.3° |
| Kadir (Ultra-réaliste) | kick-boxing | crochet-arriere-corps | 88.2° | -5.3 | 22.5 | 16.9 | -16.9 | 17.6° | 1.75 | 0.208 / 0.230 | 4.7° | 10.2° |
| Kadir (Ultra-réaliste) | MMA | crochet-avant | 83.8° | 9.0 | 27.1 | 2.0 | -2.0 | 48.9° | 2.30 | 0.193 / 0.200 | 9.3° | -14.4° |
| Kadir (Ultra-réaliste) | MMA | crochet-arriere | 85.5° | 7.8 | 27.0 | 5.3 | -5.3 | 41.1° | 2.82 | 0.217 / 0.230 | 9.8° | 13.4° |
| Kadir (Ultra-réaliste) | MMA | crochet-avant-corps | 82.8° | -3.6 | 25.1 | 13.1 | -13.1 | 34.0° | 1.29 | 0.185 / 0.200 | 4.0° | -13.9° |
| Kadir (Ultra-réaliste) | MMA | crochet-arriere-corps | 86.5° | -1.3 | 23.0 | 16.9 | -16.9 | 25.9° | 2.06 | 0.217 / 0.230 | 6.3° | 11.9° |
| Kadir (Ultra-réaliste) | muay-thaï | crochet-avant | 90.2° | 7.5 | 27.2 | 4.8 | -4.8 | 16.8° | 1.59 | 0.193 / 0.200 | 7.6° | -23.7° |
| Kadir (Ultra-réaliste) | muay-thaï | crochet-arriere | 92.1° | 7.2 | 26.6 | 7.6 | -7.6 | 9.9° | 2.59 | 0.217 / 0.230 | 8.7° | 17.7° |
| Kadir (Ultra-réaliste) | muay-thaï | crochet-avant-corps | 85.3° | -9.7 | 24.4 | 11.3 | -11.3 | 17.5° | 1.12 | 0.185 / 0.200 | 2.8° | -22.8° |
| Kadir (Ultra-réaliste) | muay-thaï | crochet-arriere-corps | 88.2° | -9.2 | 22.8 | 14.6 | -14.6 | 12.1° | 1.62 | 0.217 / 0.230 | 3.8° | 16.8° |
| Amara (Ultra-réaliste) | boxe | crochet-avant | 69.0° | 6.1 | 24.3 | -2.8 | 2.9 | 50.3° | 1.16 | 0.185 / 0.200 | 6.9° | -14.5° |
| Amara (Ultra-réaliste) | boxe | crochet-arriere | 88.5° | 6.7 | 20.2 | 13.6 | -13.6 | -5.3° | 1.89 | 0.208 / 0.230 | 9.7° | 11.0° |
| Amara (Ultra-réaliste) | boxe | crochet-avant-corps | 79.7° | -10.1 | 22.9 | 3.6 | -3.5 | 40.4° | 1.05 | 0.185 / 0.200 | 4.8° | -14.1° |
| Amara (Ultra-réaliste) | boxe | crochet-arriere-corps | 93.5° | -6.7 | 17.4 | 17.1 | -17.1 | 6.9° | 1.58 | 0.208 / 0.230 | 5.3° | 9.0° |
| Amara (Ultra-réaliste) | kick-boxing | crochet-avant | 75.6° | 5.1 | 24.7 | -1.8 | 1.8 | 41.6° | 1.18 | 0.185 / 0.200 | 7.4° | -16.3° |
| Amara (Ultra-réaliste) | kick-boxing | crochet-arriere | 89.3° | 5.7 | 21.5 | 12.0 | -12.0 | -2.6° | 1.85 | 0.208 / 0.230 | 8.6° | 11.0° |
| Amara (Ultra-réaliste) | kick-boxing | crochet-avant-corps | 79.5° | -10.1 | 22.8 | 4.0 | -3.9 | 33.9° | 1.07 | 0.185 / 0.200 | 4.3° | -15.2° |
| Amara (Ultra-réaliste) | kick-boxing | crochet-arriere-corps | 93.3° | -7.7 | 18.0 | 16.0 | -16.0 | 7.0° | 1.54 | 0.208 / 0.230 | 4.3° | 9.2° |
| Amara (Ultra-réaliste) | MMA | crochet-avant | 84.2° | 6.4 | 24.3 | 2.3 | -2.3 | 36.6° | 1.23 | 0.185 / 0.200 | 8.5° | -13.4° |
| Amara (Ultra-réaliste) | MMA | crochet-arriere | 92.7° | 6.5 | 22.4 | 9.8 | -9.8 | 15.4° | 2.39 | 0.217 / 0.230 | 7.7° | 13.0° |
| Amara (Ultra-réaliste) | MMA | crochet-avant-corps | 84.0° | -6.3 | 22.3 | 10.1 | -10.1 | 33.1° | 1.09 | 0.185 / 0.200 | 4.7° | -13.0° |
| Amara (Ultra-réaliste) | MMA | crochet-arriere-corps | 92.7° | -3.6 | 18.4 | 16.9 | -16.9 | 13.0° | 1.81 | 0.217 / 0.230 | 5.0° | 10.9° |
| Amara (Ultra-réaliste) | muay-thaï | crochet-avant | 90.3° | 4.3 | 24.4 | 4.9 | -4.9 | 11.9° | 1.13 | 0.185 / 0.200 | 7.8° | -22.8° |
| Amara (Ultra-réaliste) | muay-thaï | crochet-arriere | 93.2° | 3.6 | 22.0 | 11.9 | -11.8 | -12.3° | 2.24 | 0.217 / 0.230 | 6.4° | 17.1° |
| Amara (Ultra-réaliste) | muay-thaï | crochet-avant-corps | 85.3° | -11.5 | 21.4 | 7.0 | -7.0 | 16.8° | 1.03 | 0.185 / 0.200 | 4.0° | -21.6° |
| Amara (Ultra-réaliste) | muay-thaï | crochet-arriere-corps | 92.2° | -11.5 | 18.1 | 13.3 | -13.2 | 4.1° | 1.45 | 0.217 / 0.230 | 3.6° | 15.6° |
| Kadir (modèle généré) | boxe | crochet-avant | 67.0° | 6.7 | 25.1 | -3.8 | 3.8 | 58.5° | 1.65 | 0.185 / 0.200 | 8.0° | -15.6° |
| Kadir (modèle généré) | boxe | crochet-arriere | 82.0° | 9.0 | 23.1 | 8.8 | -8.8 | 19.3° | 2.15 | 0.208 / 0.230 | 8.7° | 11.4° |
| Kadir (modèle généré) | boxe | crochet-avant-corps | 75.0° | -8.7 | 24.1 | 5.8 | -5.7 | 41.3° | 1.18 | 0.185 / 0.200 | 4.1° | -15.1° |
| Kadir (modèle généré) | boxe | crochet-arriere-corps | 91.0° | -3.4 | 19.6 | 17.1 | -17.1 | 15.9° | 1.84 | 0.208 / 0.230 | 5.1° | 10.0° |
| Kadir (modèle généré) | kick-boxing | crochet-avant | 72.0° | 5.8 | 25.4 | -2.9 | 2.9 | 51.5° | 1.71 | 0.185 / 0.200 | 8.1° | -17.1° |
| Kadir (modèle généré) | kick-boxing | crochet-arriere | 83.0° | 7.4 | 24.4 | 6.3 | -6.3 | 24.3° | 2.15 | 0.208 / 0.230 | 9.2° | 11.5° |
| Kadir (modèle généré) | kick-boxing | crochet-avant-corps | 76.0° | -8.6 | 24.1 | 6.1 | -6.0 | 36.9° | 1.23 | 0.185 / 0.200 | 4.1° | -16.2° |
| Kadir (modèle généré) | kick-boxing | crochet-arriere-corps | 87.9° | -5.0 | 21.0 | 14.9 | -14.9 | 18.8° | 1.75 | 0.208 / 0.230 | 5.0° | 10.2° |
| Kadir (modèle généré) | MMA | crochet-avant | 82.0° | 8.1 | 24.9 | 1.5 | -1.5 | 49.4° | 1.95 | 0.193 / 0.200 | 9.2° | -14.4° |
| Kadir (modèle généré) | MMA | crochet-arriere | 85.0° | 7.3 | 24.7 | 4.9 | -4.9 | 40.5° | 2.65 | 0.217 / 0.230 | 9.9° | 13.4° |
| Kadir (modèle généré) | MMA | crochet-avant-corps | 81.0° | -3.2 | 23.1 | 12.1 | -12.1 | 33.9° | 1.26 | 0.185 / 0.200 | 3.8° | -13.9° |
| Kadir (modèle généré) | MMA | crochet-arriere-corps | 85.9° | -1.1 | 21.2 | 15.5 | -15.5 | 25.7° | 2.02 | 0.217 / 0.230 | 6.4° | 11.9° |
| Kadir (modèle généré) | muay-thaï | crochet-avant | 88.0° | 6.7 | 25.2 | 3.1 | -3.1 | 20.4° | 1.50 | 0.193 / 0.200 | 7.5° | -23.6° |
| Kadir (modèle généré) | muay-thaï | crochet-arriere | 91.0° | 6.5 | 24.8 | 5.7 | -5.7 | 13.6° | 2.42 | 0.217 / 0.230 | 8.9° | 17.7° |
| Kadir (modèle généré) | muay-thaï | crochet-avant-corps | 84.0° | -9.1 | 22.8 | 9.4 | -9.4 | 19.5° | 1.13 | 0.185 / 0.200 | 2.7° | -22.8° |
| Kadir (modèle généré) | muay-thaï | crochet-arriere-corps | 87.0° | -8.7 | 21.6 | 12.1 | -12.1 | 14.6° | 1.61 | 0.217 / 0.230 | 4.3° | 16.7° |
| Amara (modèle généré) | boxe | crochet-avant | 65.0° | 6.2 | 25.2 | -4.0 | 4.5 | 58.3° | 1.19 | 0.185 / 0.200 | 6.7° | -15.6° |
| Amara (modèle généré) | boxe | crochet-arriere | 87.0° | 6.8 | 21.7 | 13.1 | -13.1 | -2.1° | 1.87 | 0.217 / 0.230 | 7.9° | 11.5° |
| Amara (modèle généré) | boxe | crochet-avant-corps | 75.0° | -10.9 | 23.7 | 2.1 | -1.4 | 46.5° | 1.06 | 0.185 / 0.200 | 5.0° | -15.1° |
| Amara (modèle généré) | boxe | crochet-arriere-corps | 93.0° | -6.9 | 18.0 | 17.8 | -17.8 | 6.8° | 1.59 | 0.217 / 0.230 | 4.5° | 10.1° |
| Amara (modèle généré) | kick-boxing | crochet-avant | 72.0° | 5.0 | 25.5 | -3.5 | 3.7 | 50.1° | 1.23 | 0.185 / 0.200 | 7.7° | -17.1° |
| Amara (modèle généré) | kick-boxing | crochet-arriere | 87.1° | 5.7 | 23.1 | 10.9 | -10.9 | 1.9° | 1.86 | 0.217 / 0.230 | 8.5° | 11.5° |
| Amara (modèle généré) | kick-boxing | crochet-avant-corps | 76.0° | -10.8 | 23.8 | 2.4 | -1.9 | 39.7° | 1.09 | 0.185 / 0.200 | 4.4° | -16.3° |
| Amara (modèle généré) | kick-boxing | crochet-arriere-corps | 92.0° | -8.1 | 19.5 | 15.5 | -15.5 | 9.2° | 1.54 | 0.217 / 0.230 | 4.2° | 10.2° |
| Amara (modèle généré) | MMA | crochet-avant | 82.0° | 6.2 | 25.5 | 0.9 | -0.9 | 42.6° | 1.29 | 0.193 / 0.200 | 8.4° | -14.4° |
| Amara (modèle généré) | MMA | crochet-arriere | 90.1° | 6.4 | 23.7 | 9.1 | -9.1 | 18.4° | 2.28 | 0.217 / 0.230 | 8.3° | 13.4° |
| Amara (modèle généré) | MMA | crochet-avant-corps | 81.0° | -7.0 | 23.5 | 9.3 | -9.3 | 36.1° | 1.12 | 0.185 / 0.200 | 4.9° | -13.9° |
| Amara (modèle généré) | MMA | crochet-arriere-corps | 90.0° | -3.9 | 19.8 | 16.8 | -16.8 | 14.9° | 1.78 | 0.217 / 0.230 | 5.5° | 11.9° |
| Amara (modèle généré) | muay-thaï | crochet-avant | 87.0° | 4.6 | 25.6 | 2.9 | -2.9 | 18.4° | 1.16 | 0.185 / 0.200 | 7.9° | -23.6° |
| Amara (modèle généré) | muay-thaï | crochet-arriere | 93.0° | 3.9 | 23.9 | 9.9 | -9.8 | -6.5° | 2.22 | 0.217 / 0.230 | 7.0° | 17.7° |
| Amara (modèle généré) | muay-thaï | crochet-avant-corps | 83.0° | -11.9 | 22.7 | 5.5 | -5.4 | 20.7° | 1.05 | 0.185 / 0.200 | 4.3° | -22.8° |
| Amara (modèle généré) | muay-thaï | crochet-arriere-corps | 91.0° | -11.9 | 19.9 | 12.3 | -12.2 | 6.4° | 1.48 | 0.217 / 0.230 | 3.6° | 16.8° |
| Coach homme générique | boxe | crochet-avant | 66.0° | 6.7 | 24.8 | -3.2 | 3.6 | 54.2° | 1.37 | 0.185 / 0.200 | 8.6° | -15.9° |
| Coach homme générique | boxe | crochet-arriere | 84.0° | 7.5 | 22.4 | 10.7 | -10.7 | 7.2° | 1.93 | 0.208 / 0.230 | 8.2° | 11.6° |
| Coach homme générique | boxe | crochet-avant-corps | 74.0° | -9.8 | 23.7 | 3.8 | -3.0 | 40.8° | 1.13 | 0.185 / 0.200 | 4.0° | -15.4° |
| Coach homme générique | boxe | crochet-arriere-corps | 93.0° | -5.7 | 18.9 | 16.9 | -16.8 | 10.7° | 1.69 | 0.208 / 0.230 | 4.8° | 10.3° |
| Coach homme générique | kick-boxing | crochet-avant | 72.0° | 5.5 | 25.2 | -2.7 | 2.8 | 47.0° | 1.44 | 0.185 / 0.200 | 9.0° | -17.3° |
| Coach homme générique | kick-boxing | crochet-arriere | 85.0° | 6.3 | 23.8 | 8.1 | -8.1 | 12.6° | 1.91 | 0.208 / 0.230 | 8.9° | 11.6° |
| Coach homme générique | kick-boxing | crochet-avant-corps | 76.1° | -9.6 | 23.7 | 4.4 | -3.8 | 35.0° | 1.16 | 0.185 / 0.200 | 4.4° | -16.5° |
| Coach homme générique | kick-boxing | crochet-arriere-corps | 90.0° | -7.0 | 20.3 | 14.6 | -14.6 | 13.4° | 1.61 | 0.208 / 0.230 | 4.7° | 10.5° |
| Coach homme générique | MMA | crochet-avant | 82.0° | 7.3 | 24.8 | 2.0 | -2.0 | 40.2° | 1.59 | 0.193 / 0.200 | 8.6° | -14.7° |
| Coach homme générique | MMA | crochet-arriere | 87.0° | 6.4 | 24.3 | 6.4 | -6.4 | 28.8° | 2.29 | 0.217 / 0.230 | 9.7° | 13.5° |
| Coach homme générique | MMA | crochet-avant-corps | 81.9° | -5.2 | 22.9 | 10.9 | -10.9 | 30.4° | 1.21 | 0.185 / 0.200 | 3.5° | -14.2° |
| Coach homme générique | MMA | crochet-arriere-corps | 87.9° | -3.1 | 20.6 | 15.4 | -15.4 | 20.0° | 1.84 | 0.217 / 0.230 | 6.4° | 12.2° |
| Coach homme générique | muay-thaï | crochet-avant | 89.0° | 5.5 | 25.1 | 3.6 | -3.5 | 14.2° | 1.31 | 0.185 / 0.200 | 7.1° | -23.8° |
| Coach homme générique | muay-thaï | crochet-arriere | 92.0° | 5.1 | 24.4 | 7.1 | -7.0 | 3.5° | 2.08 | 0.217 / 0.230 | 8.5° | 17.8° |
| Coach homme générique | muay-thaï | crochet-avant-corps | 84.0° | -10.7 | 22.3 | 7.8 | -7.8 | 16.7° | 1.09 | 0.185 / 0.200 | 2.6° | -23.1° |
| Coach homme générique | muay-thaï | crochet-arriere-corps | 88.0° | -10.5 | 20.7 | 11.5 | -11.4 | 10.0° | 1.49 | 0.217 / 0.230 | 4.1° | 17.0° |
| Coach femme générique | boxe | crochet-avant | 68.0° | 7.1 | 25.8 | -2.9 | 2.9 | 51.8° | 1.35 | 0.185 / 0.200 | 6.9° | -15.6° |
| Coach femme générique | boxe | crochet-arriere | 83.0° | 7.8 | 23.3 | 11.1 | -11.1 | 7.7° | 1.84 | 0.208 / 0.230 | 8.2° | 11.5° |
| Coach femme générique | boxe | crochet-avant-corps | 77.0° | -9.8 | 24.6 | 5.0 | -4.9 | 39.7° | 1.10 | 0.185 / 0.200 | 4.6° | -15.2° |
| Coach femme générique | boxe | crochet-arriere-corps | 92.0° | -5.9 | 19.8 | 17.2 | -17.2 | 11.3° | 1.58 | 0.208 / 0.230 | 4.2° | 10.1° |
| Coach femme générique | kick-boxing | crochet-avant | 74.0° | 5.9 | 26.2 | -1.9 | 1.9 | 43.7° | 1.41 | 0.185 / 0.200 | 7.4° | -17.2° |
| Coach femme générique | kick-boxing | crochet-arriere | 85.0° | 6.5 | 24.7 | 8.4 | -8.4 | 12.7° | 1.84 | 0.208 / 0.230 | 8.6° | 11.5° |
| Coach femme générique | kick-boxing | crochet-avant-corps | 78.0° | -9.7 | 24.5 | 5.3 | -5.3 | 33.9° | 1.13 | 0.185 / 0.200 | 4.0° | -16.3° |
| Coach femme générique | kick-boxing | crochet-arriere-corps | 89.0° | -7.3 | 21.3 | 14.8 | -14.8 | 13.9° | 1.52 | 0.208 / 0.230 | 4.3° | 10.3° |
| Coach femme générique | MMA | crochet-avant | 83.0° | 7.7 | 25.6 | 2.5 | -2.5 | 39.0° | 1.54 | 0.193 / 0.200 | 8.6° | -14.5° |
| Coach femme générique | MMA | crochet-arriere | 87.0° | 6.6 | 25.2 | 6.7 | -6.7 | 28.8° | 2.27 | 0.217 / 0.230 | 8.7° | 13.4° |
| Coach femme générique | MMA | crochet-avant-corps | 82.0° | -5.2 | 23.7 | 11.6 | -11.6 | 30.7° | 1.16 | 0.185 / 0.200 | 4.1° | -14.0° |
| Coach femme générique | MMA | crochet-arriere-corps | 87.0° | -3.2 | 21.4 | 16.0 | -16.0 | 20.0° | 1.75 | 0.217 / 0.230 | 5.5° | 12.0° |
| Coach femme générique | muay-thaï | crochet-avant | 89.0° | 5.7 | 25.9 | 4.6 | -4.6 | 12.6° | 1.29 | 0.193 / 0.200 | 7.4° | -23.6° |
| Coach femme générique | muay-thaï | crochet-arriere | 92.0° | 5.3 | 25.2 | 7.8 | -7.8 | 2.0° | 2.05 | 0.217 / 0.230 | 7.2° | 17.7° |
| Coach femme générique | muay-thaï | crochet-avant-corps | 84.0° | -11.1 | 23.0 | 8.4 | -8.4 | 16.5° | 1.07 | 0.185 / 0.200 | 3.2° | -22.8° |
| Coach femme générique | muay-thaï | crochet-arriere-corps | 88.0° | -10.9 | 21.7 | 11.6 | -11.6 | 10.2° | 1.43 | 0.217 / 0.230 | 3.6° | 16.8° |
