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
| Kadir (Ultra-réaliste) | boxe | crochet-avant | 68.8° | 7.5 | 27.4 | -3.3 | 3.3 | 54.6° | 1.25 | 0.166 / 0.200 | 7.9° | -15.4° |
| Kadir (Ultra-réaliste) | boxe | crochet-arriere | 85.0° | 9.6 | 24.9 | 10.2 | -10.0 | 18.3° | 1.34 | 0.210 / 0.230 | 9.0° | 10.3° |
| Kadir (Ultra-réaliste) | boxe | crochet-avant-corps | 76.3° | -9.3 | 26.2 | 6.6 | -6.6 | 39.7° | 1.05 | 0.168 / 0.200 | 4.2° | -15.1° |
| Kadir (Ultra-réaliste) | boxe | crochet-arriere-corps | 92.1° | -3.6 | 21.1 | 18.9 | -18.9 | 15.3° | 1.31 | 0.208 / 0.230 | 4.8° | 10.1° |
| Kadir (Ultra-réaliste) | kick-boxing | crochet-avant | 74.6° | 6.6 | 27.7 | -2.3 | 2.3 | 47.8° | 1.22 | 0.166 / 0.200 | 8.0° | -17.0° |
| Kadir (Ultra-réaliste) | kick-boxing | crochet-arriere | 86.0° | 8.0 | 26.4 | 7.5 | -7.3 | 23.3° | 1.28 | 0.210 / 0.230 | 9.4° | 10.3° |
| Kadir (Ultra-réaliste) | kick-boxing | crochet-avant-corps | 77.2° | -9.0 | 26.1 | 7.3 | -7.3 | 35.2° | 1.06 | 0.168 / 0.200 | 4.1° | -16.3° |
| Kadir (Ultra-réaliste) | kick-boxing | crochet-arriere-corps | 88.2° | -5.3 | 22.5 | 16.9 | -16.9 | 17.6° | 1.26 | 0.208 / 0.230 | 4.7° | 10.2° |
| Kadir (Ultra-réaliste) | MMA | crochet-avant | 82.6° | 8.9 | 27.1 | 2.2 | -2.1 | 48.5° | 1.22 | 0.183 / 0.200 | 8.5° | -14.3° |
| Kadir (Ultra-réaliste) | MMA | crochet-arriere | 87.2° | 7.6 | 26.9 | 5.8 | -5.3 | 40.8° | 1.24 | 0.218 / 0.230 | 9.5° | 12.2° |
| Kadir (Ultra-réaliste) | MMA | crochet-avant-corps | 81.5° | -3.8 | 25.3 | 12.8 | -12.8 | 34.7° | 1.08 | 0.176 / 0.200 | 4.0° | -13.9° |
| Kadir (Ultra-réaliste) | MMA | crochet-arriere-corps | 85.3° | -1.3 | 23.0 | 16.9 | -16.9 | 25.8° | 1.21 | 0.217 / 0.230 | 4.0° | 11.9° |
| Kadir (Ultra-réaliste) | muay-thaï | crochet-avant | 90.2° | 7.4 | 27.2 | 4.9 | -4.8 | 16.7° | 1.06 | 0.183 / 0.200 | 7.7° | -23.4° |
| Kadir (Ultra-réaliste) | muay-thaï | crochet-arriere | 93.2° | 6.9 | 26.5 | 8.1 | -7.6 | 9.9° | 1.26 | 0.218 / 0.230 | 8.7° | 16.5° |
| Kadir (Ultra-réaliste) | muay-thaï | crochet-avant-corps | 85.1° | -9.7 | 24.4 | 11.3 | -11.3 | 17.5° | 1.03 | 0.176 / 0.200 | 2.8° | -22.8° |
| Kadir (Ultra-réaliste) | muay-thaï | crochet-arriere-corps | 88.1° | -9.2 | 22.8 | 14.6 | -14.6 | 12.1° | 1.16 | 0.217 / 0.230 | 3.0° | 16.8° |
| Amara (Ultra-réaliste) | boxe | crochet-avant | 70.0° | 6.0 | 23.9 | -2.7 | 2.7 | 49.9° | 1.06 | 0.166 / 0.200 | 6.9° | -14.3° |
| Amara (Ultra-réaliste) | boxe | crochet-arriere | 89.6° | 6.4 | 19.8 | 13.6 | -13.4 | -5.1° | 1.34 | 0.210 / 0.230 | 9.7° | 9.8° |
| Amara (Ultra-réaliste) | boxe | crochet-avant-corps | 79.4° | -9.9 | 22.5 | 3.6 | -3.5 | 40.2° | 1.03 | 0.160 / 0.200 | 4.8° | -14.1° |
| Amara (Ultra-réaliste) | boxe | crochet-arriere-corps | 93.2° | -6.6 | 17.1 | 16.8 | -16.8 | 6.8° | 1.33 | 0.208 / 0.230 | 5.3° | 9.0° |
| Amara (Ultra-réaliste) | kick-boxing | crochet-avant | 75.7° | 4.9 | 24.3 | -1.7 | 1.7 | 41.6° | 1.05 | 0.166 / 0.200 | 7.4° | -16.1° |
| Amara (Ultra-réaliste) | kick-boxing | crochet-arriere | 90.5° | 5.4 | 21.0 | 12.1 | -11.9 | -2.6° | 1.27 | 0.210 / 0.230 | 8.6° | 9.8° |
| Amara (Ultra-réaliste) | kick-boxing | crochet-avant-corps | 79.2° | -9.8 | 22.4 | 4.0 | -3.9 | 33.9° | 1.04 | 0.168 / 0.200 | 4.3° | -15.2° |
| Amara (Ultra-réaliste) | kick-boxing | crochet-arriere-corps | 93.1° | -7.5 | 17.6 | 15.8 | -15.8 | 7.0° | 1.29 | 0.208 / 0.230 | 4.3° | 9.2° |
| Amara (Ultra-réaliste) | MMA | crochet-avant | 83.9° | 6.3 | 23.9 | 2.4 | -2.3 | 36.8° | 1.06 | 0.166 / 0.200 | 7.2° | -13.2° |
| Amara (Ultra-réaliste) | MMA | crochet-arriere | 93.7° | 6.1 | 22.0 | 9.7 | -9.3 | 16.3° | 1.24 | 0.218 / 0.230 | 7.5° | 11.7° |
| Amara (Ultra-réaliste) | MMA | crochet-avant-corps | 83.5° | -6.1 | 21.9 | 10.0 | -10.0 | 33.6° | 1.07 | 0.168 / 0.200 | 4.1° | -13.0° |
| Amara (Ultra-réaliste) | MMA | crochet-arriere-corps | 92.3° | -3.6 | 18.3 | 16.4 | -16.4 | 13.6° | 1.26 | 0.217 / 0.230 | 2.9° | 10.9° |
| Amara (Ultra-réaliste) | muay-thaï | crochet-avant | 90.3° | 4.1 | 24.0 | 4.9 | -4.9 | 12.0° | 1.04 | 0.174 / 0.200 | 5.9° | -22.6° |
| Amara (Ultra-réaliste) | muay-thaï | crochet-arriere | 93.8° | 3.2 | 21.4 | 12.1 | -11.7 | -12.4° | 1.28 | 0.218 / 0.230 | 6.4° | 15.9° |
| Amara (Ultra-réaliste) | muay-thaï | crochet-avant-corps | 85.1° | -11.3 | 21.0 | 6.9 | -6.9 | 16.8° | 1.02 | 0.176 / 0.200 | 3.7° | -21.6° |
| Amara (Ultra-réaliste) | muay-thaï | crochet-arriere-corps | 92.1° | -11.3 | 17.8 | 13.1 | -13.0 | 4.1° | 1.16 | 0.208 / 0.230 | 2.2° | 15.6° |
| Kadir (modèle généré) | boxe | crochet-avant | 67.6° | 6.6 | 25.1 | -3.8 | 3.8 | 58.6° | 1.23 | 0.166 / 0.200 | 7.9° | -15.4° |
| Kadir (modèle généré) | boxe | crochet-arriere | 83.8° | 8.7 | 23.1 | 9.0 | -8.8 | 19.3° | 1.36 | 0.210 / 0.230 | 8.6° | 10.3° |
| Kadir (modèle généré) | boxe | crochet-avant-corps | 75.0° | -8.7 | 24.1 | 5.8 | -5.6 | 41.5° | 1.05 | 0.168 / 0.200 | 4.1° | -15.1° |
| Kadir (modèle généré) | boxe | crochet-arriere-corps | 91.0° | -3.4 | 19.6 | 17.1 | -17.1 | 15.9° | 1.31 | 0.208 / 0.230 | 4.5° | 10.0° |
| Kadir (modèle généré) | kick-boxing | crochet-avant | 72.5° | 5.7 | 25.5 | -2.9 | 2.9 | 51.5° | 1.23 | 0.166 / 0.200 | 8.1° | -16.9° |
| Kadir (modèle généré) | kick-boxing | crochet-arriere | 84.9° | 7.2 | 24.4 | 6.5 | -6.3 | 24.4° | 1.32 | 0.210 / 0.230 | 9.2° | 10.3° |
| Kadir (modèle généré) | kick-boxing | crochet-avant-corps | 76.0° | -8.6 | 24.1 | 6.1 | -5.9 | 36.9° | 1.06 | 0.168 / 0.200 | 4.1° | -16.2° |
| Kadir (modèle généré) | kick-boxing | crochet-arriere-corps | 87.9° | -5.0 | 21.0 | 14.9 | -14.9 | 18.8° | 1.26 | 0.208 / 0.230 | 4.4° | 10.2° |
| Kadir (modèle généré) | MMA | crochet-avant | 82.3° | 8.0 | 25.0 | 1.6 | -1.5 | 49.4° | 1.23 | 0.183 / 0.200 | 8.2° | -14.2° |
| Kadir (modèle généré) | MMA | crochet-arriere | 86.9° | 7.1 | 24.7 | 5.4 | -4.9 | 40.5° | 1.24 | 0.218 / 0.230 | 9.2° | 12.2° |
| Kadir (modèle généré) | MMA | crochet-avant-corps | 81.0° | -3.4 | 23.2 | 11.8 | -11.8 | 34.6° | 1.09 | 0.176 / 0.200 | 3.8° | -13.9° |
| Kadir (modèle généré) | MMA | crochet-arriere-corps | 85.0° | -1.1 | 21.2 | 15.5 | -15.5 | 25.7° | 1.21 | 0.217 / 0.230 | 3.8° | 11.9° |
| Kadir (modèle généré) | muay-thaï | crochet-avant | 88.2° | 6.6 | 25.2 | 3.2 | -3.1 | 20.4° | 1.09 | 0.183 / 0.200 | 7.5° | -23.4° |
| Kadir (modèle généré) | muay-thaï | crochet-arriere | 92.3° | 6.2 | 24.8 | 6.1 | -5.7 | 13.4° | 1.29 | 0.218 / 0.230 | 8.9° | 16.5° |
| Kadir (modèle généré) | muay-thaï | crochet-avant-corps | 84.0° | -9.1 | 22.8 | 9.4 | -9.4 | 19.5° | 1.04 | 0.176 / 0.200 | 2.7° | -22.8° |
| Kadir (modèle généré) | muay-thaï | crochet-arriere-corps | 87.0° | -8.7 | 21.6 | 12.1 | -12.1 | 14.6° | 1.15 | 0.208 / 0.230 | 3.2° | 16.7° |
| Amara (modèle généré) | boxe | crochet-avant | 65.7° | 6.1 | 25.2 | -4.1 | 4.6 | 58.3° | 1.08 | 0.166 / 0.200 | 6.7° | -15.4° |
| Amara (modèle généré) | boxe | crochet-arriere | 88.4° | 6.6 | 21.6 | 13.3 | -13.1 | -2.1° | 1.33 | 0.210 / 0.230 | 7.9° | 10.3° |
| Amara (modèle généré) | boxe | crochet-avant-corps | 75.0° | -10.9 | 23.7 | 2.1 | -1.3 | 46.4° | 1.03 | 0.160 / 0.200 | 5.0° | -15.1° |
| Amara (modèle généré) | boxe | crochet-arriere-corps | 93.0° | -6.9 | 18.0 | 17.8 | -17.8 | 6.8° | 1.29 | 0.208 / 0.230 | 4.5° | 10.1° |
| Amara (modèle généré) | kick-boxing | crochet-avant | 72.6° | 4.9 | 25.5 | -3.5 | 3.7 | 50.2° | 1.08 | 0.166 / 0.200 | 7.8° | -17.0° |
| Amara (modèle généré) | kick-boxing | crochet-arriere | 88.6° | 5.5 | 23.1 | 11.2 | -10.9 | 1.9° | 1.31 | 0.210 / 0.230 | 8.5° | 10.3° |
| Amara (modèle généré) | kick-boxing | crochet-avant-corps | 76.0° | -10.8 | 23.8 | 2.4 | -1.8 | 39.7° | 1.04 | 0.168 / 0.200 | 4.4° | -16.3° |
| Amara (modèle généré) | kick-boxing | crochet-arriere-corps | 92.0° | -8.1 | 19.5 | 15.5 | -15.5 | 9.2° | 1.25 | 0.208 / 0.230 | 4.2° | 10.2° |
| Amara (modèle généré) | MMA | crochet-avant | 82.3° | 6.1 | 25.5 | 0.9 | -0.9 | 42.6° | 1.13 | 0.174 / 0.200 | 6.9° | -14.2° |
| Amara (modèle généré) | MMA | crochet-arriere | 91.4° | 6.2 | 23.6 | 9.6 | -9.1 | 18.4° | 1.25 | 0.218 / 0.230 | 7.6° | 12.2° |
| Amara (modèle généré) | MMA | crochet-avant-corps | 81.0° | -7.0 | 23.5 | 9.3 | -9.3 | 36.5° | 1.08 | 0.176 / 0.200 | 4.0° | -13.9° |
| Amara (modèle généré) | MMA | crochet-arriere-corps | 90.0° | -3.9 | 19.8 | 16.8 | -16.8 | 14.9° | 1.22 | 0.217 / 0.230 | 2.9° | 11.9° |
| Amara (modèle généré) | muay-thaï | crochet-avant | 87.3° | 4.5 | 25.7 | 3.0 | -2.9 | 18.4° | 1.05 | 0.174 / 0.200 | 5.6° | -23.4° |
| Amara (modèle généré) | muay-thaï | crochet-arriere | 94.0° | 3.6 | 23.8 | 10.3 | -9.9 | -6.6° | 1.34 | 0.218 / 0.230 | 7.0° | 16.5° |
| Amara (modèle généré) | muay-thaï | crochet-avant-corps | 83.0° | -11.9 | 22.7 | 5.5 | -5.4 | 20.7° | 1.03 | 0.176 / 0.200 | 3.6° | -22.8° |
| Amara (modèle généré) | muay-thaï | crochet-arriere-corps | 91.0° | -11.9 | 19.9 | 12.3 | -12.2 | 6.4° | 1.15 | 0.208 / 0.230 | 2.4° | 16.8° |
| Coach homme générique | boxe | crochet-avant | 66.7° | 6.5 | 24.9 | -3.2 | 3.6 | 54.2° | 1.16 | 0.166 / 0.200 | 8.6° | -15.7° |
| Coach homme générique | boxe | crochet-arriere | 85.6° | 7.3 | 22.4 | 10.9 | -10.7 | 7.2° | 1.35 | 0.210 / 0.230 | 8.1° | 10.4° |
| Coach homme générique | boxe | crochet-avant-corps | 74.0° | -9.8 | 23.7 | 3.8 | -2.8 | 40.8° | 1.05 | 0.168 / 0.200 | 4.0° | -15.4° |
| Coach homme générique | boxe | crochet-arriere-corps | 93.0° | -5.7 | 18.9 | 16.9 | -16.8 | 10.7° | 1.31 | 0.208 / 0.230 | 4.9° | 10.3° |
| Coach homme générique | kick-boxing | crochet-avant | 72.6° | 5.4 | 25.2 | -2.7 | 2.8 | 47.1° | 1.17 | 0.166 / 0.200 | 9.0° | -17.2° |
| Coach homme générique | kick-boxing | crochet-arriere | 86.7° | 6.1 | 23.8 | 8.3 | -8.1 | 12.6° | 1.32 | 0.210 / 0.230 | 8.9° | 10.4° |
| Coach homme générique | kick-boxing | crochet-avant-corps | 76.1° | -9.6 | 23.7 | 4.4 | -3.7 | 35.0° | 1.06 | 0.168 / 0.200 | 4.4° | -16.5° |
| Coach homme générique | kick-boxing | crochet-arriere-corps | 90.0° | -7.0 | 20.3 | 14.6 | -14.6 | 13.4° | 1.26 | 0.208 / 0.230 | 4.5° | 10.5° |
| Coach homme générique | MMA | crochet-avant | 82.3° | 7.2 | 24.8 | 2.1 | -2.0 | 40.2° | 1.24 | 0.174 / 0.200 | 7.8° | -14.5° |
| Coach homme générique | MMA | crochet-arriere | 88.7° | 6.2 | 24.2 | 6.9 | -6.5 | 28.8° | 1.22 | 0.210 / 0.230 | 8.9° | 12.3° |
| Coach homme générique | MMA | crochet-avant-corps | 82.0° | -5.2 | 22.9 | 10.9 | -10.9 | 30.4° | 1.10 | 0.176 / 0.200 | 3.5° | -14.2° |
| Coach homme générique | MMA | crochet-arriere-corps | 87.9° | -3.1 | 20.6 | 15.4 | -15.4 | 20.0° | 1.23 | 0.217 / 0.230 | 3.7° | 12.2° |
| Coach homme générique | muay-thaï | crochet-avant | 89.3° | 5.3 | 25.1 | 3.6 | -3.6 | 14.1° | 1.09 | 0.174 / 0.200 | 7.1° | -23.6° |
| Coach homme générique | muay-thaï | crochet-arriere | 93.2° | 4.8 | 24.4 | 7.4 | -7.1 | 3.3° | 1.29 | 0.218 / 0.230 | 8.5° | 16.6° |
| Coach homme générique | muay-thaï | crochet-avant-corps | 84.0° | -10.7 | 22.3 | 7.8 | -7.8 | 16.7° | 1.04 | 0.176 / 0.200 | 2.6° | -23.1° |
| Coach homme générique | muay-thaï | crochet-arriere-corps | 88.0° | -10.5 | 20.7 | 11.5 | -11.4 | 10.0° | 1.16 | 0.208 / 0.230 | 3.2° | 17.0° |
| Coach femme générique | boxe | crochet-avant | 68.5° | 6.9 | 25.8 | -2.9 | 2.9 | 51.8° | 1.11 | 0.166 / 0.200 | 6.9° | -15.5° |
| Coach femme générique | boxe | crochet-arriere | 84.7° | 7.5 | 23.2 | 11.2 | -11.1 | 7.9° | 1.30 | 0.210 / 0.230 | 8.2° | 10.3° |
| Coach femme générique | boxe | crochet-avant-corps | 77.0° | -9.8 | 24.6 | 5.0 | -4.9 | 39.8° | 1.03 | 0.168 / 0.200 | 4.6° | -15.2° |
| Coach femme générique | boxe | crochet-arriere-corps | 92.0° | -5.9 | 19.8 | 17.2 | -17.2 | 11.3° | 1.27 | 0.208 / 0.230 | 4.2° | 10.1° |
| Coach femme générique | kick-boxing | crochet-avant | 74.5° | 5.8 | 26.2 | -1.9 | 1.9 | 43.7° | 1.11 | 0.166 / 0.200 | 7.3° | -17.0° |
| Coach femme générique | kick-boxing | crochet-arriere | 86.7° | 6.3 | 24.7 | 8.6 | -8.4 | 12.8° | 1.28 | 0.210 / 0.230 | 8.5° | 10.3° |
| Coach femme générique | kick-boxing | crochet-avant-corps | 78.0° | -9.7 | 24.5 | 5.3 | -5.3 | 33.9° | 1.04 | 0.168 / 0.200 | 4.0° | -16.3° |
| Coach femme générique | kick-boxing | crochet-arriere-corps | 89.0° | -7.3 | 21.3 | 14.8 | -14.8 | 13.9° | 1.23 | 0.208 / 0.230 | 4.3° | 10.3° |
| Coach femme générique | MMA | crochet-avant | 83.2° | 7.6 | 25.7 | 2.6 | -2.5 | 39.0° | 1.18 | 0.174 / 0.200 | 7.5° | -14.3° |
| Coach femme générique | MMA | crochet-arriere | 88.6° | 6.4 | 25.1 | 7.1 | -6.7 | 28.8° | 1.20 | 0.218 / 0.230 | 8.0° | 12.2° |
| Coach femme générique | MMA | crochet-avant-corps | 82.0° | -5.2 | 23.7 | 11.6 | -11.6 | 31.2° | 1.08 | 0.176 / 0.200 | 3.9° | -14.0° |
| Coach femme générique | MMA | crochet-arriere-corps | 87.0° | -3.2 | 21.4 | 16.0 | -16.0 | 20.0° | 1.19 | 0.217 / 0.230 | 3.1° | 12.0° |
| Coach femme générique | muay-thaï | crochet-avant | 89.2° | 5.5 | 25.9 | 4.7 | -4.6 | 12.6° | 1.05 | 0.183 / 0.200 | 6.4° | -23.4° |
| Coach femme générique | muay-thaï | crochet-arriere | 93.1° | 4.9 | 25.1 | 8.2 | -7.8 | 2.0° | 1.24 | 0.218 / 0.230 | 7.2° | 16.5° |
| Coach femme générique | muay-thaï | crochet-avant-corps | 84.0° | -11.1 | 23.0 | 8.4 | -8.4 | 16.5° | 1.02 | 0.176 / 0.200 | 3.2° | -22.8° |
| Coach femme générique | muay-thaï | crochet-arriere-corps | 88.0° | -10.9 | 21.7 | 11.6 | -11.6 | 10.2° | 1.12 | 0.208 / 0.230 | 2.5° | 16.8° |
