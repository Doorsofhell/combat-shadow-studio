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

| Corps | Crochet | Flexion | Coude haut | Coude côté | Coude devant | Derrière max | Rot. ext. max | Chemin | Vitesse max / impact | Plan du coude | Tronc |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Kadir (Ultra-réaliste) | crochet-avant | 67.0° | 3.6 | 28.2 | -3.3 | 3.3 | 51.9° | 1.20 | 0.168 / 0.200 | 7.3° | -15.5° |
| Kadir (Ultra-réaliste) | crochet-arriere | 81.9° | 8.9 | 25.3 | 10.0 | -10.0 | 15.1° | 1.27 | 0.208 / 0.230 | 8.7° | 11.5° |
| Kadir (Ultra-réaliste) | crochet-avant-corps | 76.0° | -9.3 | 26.2 | 6.7 | -6.7 | 39.6° | 1.04 | 0.168 / 0.200 | 4.0° | -14.1° |
| Kadir (Ultra-réaliste) | crochet-arriere-corps | 90.9° | -3.7 | 21.4 | 18.6 | -18.6 | 15.9° | 1.28 | 0.208 / 0.230 | 4.9° | 10.1° |
| Amara (Ultra-réaliste) | crochet-avant | 67.0° | 2.7 | 25.0 | -2.9 | 3.0 | 49.8° | 1.04 | 0.160 / 0.200 | 6.3° | -15.0° |
| Amara (Ultra-réaliste) | crochet-arriere | 87.0° | 5.8 | 20.5 | 13.5 | -13.5 | -7.3° | 1.28 | 0.208 / 0.230 | 9.6° | 11.0° |
| Amara (Ultra-réaliste) | crochet-avant-corps | 77.0° | -10.1 | 22.9 | 3.4 | -3.2 | 40.8° | 1.02 | 0.168 / 0.200 | 4.6° | -13.1° |
| Amara (Ultra-réaliste) | crochet-arriere-corps | 95.0° | -6.6 | 17.3 | 17.1 | -17.1 | 6.8° | 1.32 | 0.208 / 0.230 | 5.3° | 9.0° |
| Kadir (Anime) | crochet-avant | 66.0° | 3.2 | 25.8 | -3.5 | 3.5 | 55.1° | 1.18 | 0.168 / 0.200 | 7.2° | -15.5° |
| Kadir (Anime) | crochet-arriere | 81.9° | 7.8 | 23.6 | 8.4 | -8.4 | 17.3° | 1.30 | 0.208 / 0.230 | 8.5° | 11.4° |
| Kadir (Anime) | crochet-avant-corps | 75.0° | -8.6 | 24.0 | 6.1 | -6.0 | 40.9° | 1.04 | 0.168 / 0.200 | 4.0° | -14.1° |
| Kadir (Anime) | crochet-arriere-corps | 91.0° | -3.7 | 20.1 | 16.5 | -16.5 | 17.3° | 1.28 | 0.208 / 0.230 | 4.6° | 10.0° |
| Amara (Anime) | crochet-avant | 64.0° | 2.7 | 25.8 | -3.8 | 4.6 | 56.3° | 1.06 | 0.168 / 0.200 | 6.1° | -15.5° |
| Amara (Anime) | crochet-arriere | 86.0° | 5.9 | 22.1 | 12.9 | -12.9 | -4.2° | 1.28 | 0.208 / 0.230 | 7.8° | 11.5° |
| Amara (Anime) | crochet-avant-corps | 74.0° | -10.9 | 23.7 | 2.1 | -1.3 | 46.6° | 1.03 | 0.168 / 0.200 | 4.9° | -14.1° |
| Amara (Anime) | crochet-arriere-corps | 95.0° | -7.0 | 18.7 | 16.9 | -16.9 | 8.5° | 1.28 | 0.208 / 0.230 | 4.5° | 10.1° |
| Coach homme générique | crochet-avant | 65.0° | 3.0 | 25.5 | -3.4 | 3.9 | 52.7° | 1.13 | 0.168 / 0.200 | 7.9° | -15.6° |
| Coach homme générique | crochet-arriere | 83.0° | 6.5 | 22.8 | 10.6 | -10.6 | 4.9° | 1.29 | 0.208 / 0.230 | 7.9° | 11.6° |
| Coach homme générique | crochet-avant-corps | 74.0° | -9.9 | 23.7 | 3.8 | -2.8 | 40.9° | 1.04 | 0.168 / 0.200 | 4.0° | -14.4° |
| Coach homme générique | crochet-arriere-corps | 93.0° | -5.8 | 19.3 | 16.3 | -16.3 | 11.9° | 1.29 | 0.208 / 0.230 | 4.8° | 10.3° |
| Coach femme générique | crochet-avant | 68.0° | 3.2 | 26.5 | -3.1 | 3.1 | 50.3° | 1.09 | 0.168 / 0.200 | 6.3° | -15.5° |
| Coach femme générique | crochet-arriere | 83.0° | 6.7 | 23.8 | 10.5 | -10.5 | 6.7° | 1.25 | 0.208 / 0.230 | 8.0° | 11.5° |
| Coach femme générique | crochet-avant-corps | 77.0° | -9.8 | 24.5 | 5.0 | -4.9 | 39.7° | 1.03 | 0.168 / 0.200 | 4.4° | -14.1° |
| Coach femme générique | crochet-arriere-corps | 92.0° | -6.1 | 20.3 | 16.6 | -16.6 | 12.6° | 1.25 | 0.208 / 0.230 | 4.2° | 10.1° |
