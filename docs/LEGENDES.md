# Légendes : profils, anecdotes et sources

Catalogue `public/catalog/catalog-v1.json`, version **1.1.0** (schéma 1 inchangé), généré par
`node scripts/build-catalog.mjs` ; les données ajoutées en v0.28 sont dans `scripts/catalog-legends.mjs`.
Demande de Youssef du 2026-10-20 21:52 : « enrichis toutes les disciplines et les légendes ».

## Règles

- **Profils** : « Profil de style général » (même mention de source qu’en v1.0.0). Les traits viennent de
  caractéristiques publiques vérifiées sur la page citée ; quand la page ne décrit pas le style, le profil dit
  simplement ce que les fiches travaillent (ex. « Les fiches travaillent les bases solo : tsugi-ashi, kuzushi,
  uchikomi »). La garde n’est indiquée que si elle est connue (les gardes des 80 profils existants sont inchangées).
- **« Le savais-tu ? »** (`funFact`) : une anecdote par champion (107), relue le 2026-10-20 sur la page Wikipedia en
  anglais citée (source secondaire), avec son lien. **Époque** (`era`) seulement quand les années sont données par la
  page ; **pays** (`country`) pour tous. Rien n’a été ajouté sans cette vérification.
- **Fiches** : toutes « inspirées », séquences originales, jamais présentées comme exécutées en combat. En judo et en
  jiu-jitsu brésilien ce sont des **exercices solo de bases** (déplacements, kuzushi, uchikomi à vide ; descente,
  pont, rétention de garde, changement de base, sortie de hanche, relevé), construits uniquement avec les techniques
  de `src/domain/techniques.ts` ; leur source le dit : « Exercice solo inspiré du profil… ; séquence originale de
  bases, non relevée en combat ». Toutes sont jouables en 3D. Les projections et soumissions associées aux
  champions (uchi-mata, étranglement croisé, clé de bras…) ne sont pas simulées : elles demandent un partenaire.
- **Migration** : les 1100 fiches de la v1.0.0 gardent identifiants, ordre, noms et séquences (empreinte vérifiée par
  `catalog.test.ts`) ; favoris, collections et historique continuent de fonctionner. Les champs ajoutés aux profils
  sont facultatifs. Points clés et erreurs de ces fiches sont relus depuis les textes actuels des techniques.

## Nouveaux profils (27) et disciplines ajoutées

Shevchenko et Jędrzejczyk (profils existants) reçoivent aussi le muay-thaï (titres mondiaux IFMA, voir leur page).
Chaque nouveau profil, et chaque discipline ajoutée, a 12 fiches.

| Champion | Disciplines | Pays | Le savais-tu ? | Source |
| --- | --- | --- | --- | --- |
| Claressa Shields | Boxe | États-Unis | Double championne olympique (2012, 2016), « T-Rex » a été championne du monde dans cinq catégories. | [Wikipedia](https://en.wikipedia.org/wiki/Claressa_Shields) |
| Katie Taylor | Boxe | Irlande | Championne olympique en 2012, elle a aussi joué en équipe d’Irlande… de football ! | [Wikipedia](https://en.wikipedia.org/wiki/Katie_Taylor) |
| Estelle Mossely | Boxe | France | En 2016, elle est sacrée championne du monde puis championne olympique à Rio. | [Wikipedia](https://en.wikipedia.org/wiki/Estelle_Mossely) |
| Amanda Serrano | Boxe | Porto Rico et États-Unis | « The Real Deal » a été championne du monde dans sept catégories de poids. | [Wikipedia](https://en.wikipedia.org/wiki/Amanda_Serrano) |
| Anissa Meksen | Kick-boxing, Muay-thaï | France | Elle a gagné des titres mondiaux en kick-boxing, en muay-thaï et en savate. | [Wikipedia](https://en.wikipedia.org/wiki/Anissa_Meksen) |
| Tiffany van Soest | Kick-boxing, Muay-thaï | États-Unis | Surnommée « Time Bomb », elle pratique aussi le karaté Shōrin-ryū. | [Wikipedia](https://en.wikipedia.org/wiki/Tiffany_van_Soest) |
| Stamp Fairtex | Muay-thaï, Kick-boxing | Thaïlande | Première championne de ONE dans trois sports : kick-boxing, muay-thaï et MMA. | [Wikipedia](https://en.wikipedia.org/wiki/Stamp_Fairtex) |
| Cris Cyborg | MMA | Brésil et États-Unis | Elle a été championne dans cinq grandes organisations de MMA : Strikeforce, Invicta, UFC, Bellator et PFL. | [Wikipedia](https://en.wikipedia.org/wiki/Cris_Cyborg) |
| Rose Namajunas | MMA | États-Unis | « Thug Rose » a commencé le taekwondo à 5 ans et a été deux fois championne UFC des pailles. | [Wikipedia](https://en.wikipedia.org/wiki/Rose_Namajunas) |
| Zhang Weili | MMA | Chine | Première championne UFC chinoise et asiatique (2019), elle dit vouloir être « comme l’eau » face à chaque adversaire. | [Wikipedia](https://en.wikipedia.org/wiki/Zhang_Weili) |
| Ronda Rousey | MMA, Judo | États-Unis | Médaillée de bronze olympique en judo (2008), elle a été la première combattante signée par l’UFC. | [Wikipedia](https://en.wikipedia.org/wiki/Ronda_Rousey) |
| Teddy Riner | Judo | France | « Teddy Bear » a gagné l’or olympique en individuel en 2012, 2016 et 2024, et onze titres mondiaux individuels. | [Wikipedia](https://en.wikipedia.org/wiki/Teddy_Riner) |
| Clarisse Agbegnenou | Judo | France | Six fois championne du monde, elle a gagné ses cinq combats des Mondiaux 2021 par ippon. | [Wikipedia](https://en.wikipedia.org/wiki/Clarisse_Agbegnenou) |
| Kosei Inoue | Judo | Japon | Champion olympique en 2000 à Sydney ; ses projections favorites : uchi-mata et o-uchi-gari. | [Wikipedia](https://en.wikipedia.org/wiki/Kosei_Inoue) |
| Ryoko Tani | Judo | Japon | Surnommée « Yawara-chan », elle a gagné cinq médailles olympiques, dont l’or en 2000 et 2004, et sept titres mondiaux. | [Wikipedia](https://en.wikipedia.org/wiki/Ryoko_Tani) |
| David Douillet | Judo | France | Double champion olympique (1996, 2000), il est ensuite devenu ministre des Sports. | [Wikipedia](https://en.wikipedia.org/wiki/David_Douillet) |
| Yasuhiro Yamashita | Judo | Japon | Il a enchaîné 203 victoires (et 7 nuls) sans défaite entre 1977 et 1985, et il a été champion olympique en 1984. | [Wikipedia](https://en.wikipedia.org/wiki/Yasuhiro_Yamashita) |
| Majlinda Kelmendi | Judo | Kosovo | Son or à Rio, en 2016, est la toute première médaille olympique de l’histoire du Kosovo. | [Wikipedia](https://en.wikipedia.org/wiki/Majlinda_Kelmendi) |
| Uta Abe | Judo | Japon | Le 25 juillet 2021, à Tokyo, elle et son frère Hifumi deviennent champions olympiques le même jour. | [Wikipedia](https://en.wikipedia.org/wiki/Uta_Abe) |
| Roger Gracie | Jiu-jitsu brésilien | Brésil | Dix fois champion du monde IBJJF (2004 à 2010), souvent avec un étranglement croisé depuis la montée. | [Wikipedia](https://en.wikipedia.org/wiki/Roger_Gracie) |
| Marcelo Garcia | Jiu-jitsu brésilien | Brésil | Quatre fois champion ADCC, « Marcelinho » a popularisé la garde X, l’arm drag et la guillotine haute. | [Wikipedia](https://en.wikipedia.org/wiki/Marcelo_Garcia_(grappler)) |
| Rickson Gracie | Jiu-jitsu brésilien | Brésil | Fils d’Hélio Gracie, il est resté invaincu en MMA : 11 victoires, toutes par soumission. | [Wikipedia](https://en.wikipedia.org/wiki/Rickson_Gracie) |
| Marcus « Buchecha » Almeida | Jiu-jitsu brésilien | Brésil | Sept fois champion du monde IBJJF (2012 à 2019), il est ensuite passé au MMA. | [Wikipedia](https://en.wikipedia.org/wiki/Marcus_Almeida) |
| Gabi Garcia | Jiu-jitsu brésilien | Brésil | En 2019, elle devient la première femme à gagner quatre titres ADCC. | [Wikipedia](https://en.wikipedia.org/wiki/Gabrielle_Garcia) |
| Mackenzie Dern | Jiu-jitsu brésilien | États-Unis et Brésil | Championne du monde IBJJF en 2015 et 2016, elle est devenue championne UFC des pailles en 2025. | [Wikipedia](https://en.wikipedia.org/wiki/Mackenzie_Dern) |
| Beatriz « Bia » Mesquita | Jiu-jitsu brésilien | Brésil | Avec 10 titres mondiaux IBJJF, elle détient le record chez les ceintures noires. | [Wikipedia](https://en.wikipedia.org/wiki/Beatriz_Mesquita) |
| Ffion Davies | Jiu-jitsu brésilien | Pays de Galles | Première championne du monde galloise en ceinture noire, puis première championne ADCC britannique (2022). | [Wikipedia](https://en.wikipedia.org/wiki/Ffion_Davies) |

## Fiches par discipline

| Discipline | v1.0.0 | v1.1.0 |
| --- | ---: | ---: |
| Boxe anglaise | 300 | 348 |
| Kick-boxing | 250 | 286 |
| MMA | 300 | 348 |
| Muay-thaï | 250 | 310 |
| Judo | 0 | 108 |
| Jiu-jitsu brésilien | 0 | 96 |
| **Total** | **1100** | **1496** |

Profils : 80 → 107 (boxe 24, kick-boxing 23, MMA 28, muay-thaï 25, judo 9, jiu-jitsu 8 ; un profil peut avoir
plusieurs disciplines). Championnes : boxe 4, kick-boxing 3, muay-thaï 5, MMA 7, judo 5, jiu-jitsu 4.

## Anecdotes des 80 profils existants

Même règle : page Wikipedia en anglais citée dans `scripts/catalog-legends.mjs` (`INFO`), lue le 2026-10-20. Cas
particuliers : Ernesto Hoost — la page se contredit sur le nombre de titres K-1, l’anecdote cite les quatre années
de son résumé (1997, 1999, 2000, 2002) ; Terence Crawford et Jérôme Le Banner — leur page indique une garde gaucher,
la garde du profil v1.0.0 n’a pas été modifiée (consigne : gardes conservées) ; Tawanchai et Seksan — pages trouvées
par recherche (titres de page différents de leur nom d’usage).
