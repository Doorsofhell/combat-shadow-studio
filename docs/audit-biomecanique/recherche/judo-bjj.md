# Audit documentaire : JUDO et JIU-JITSU BRÉSILIEN (BJJ), Combat Shadow Studio

Date de la recherche : 18 et 19 octobre 2026.
Données auditées : `techniques.json`. On y a retenu 14 fiches solo, 7 de judo et 7 de BJJ (dont 4 étiquetées aussi « mma »), et les 10 fiches avec partenaire.

Conventions :
- **[Sx]** renvoie à la section A.
- **« ND »** signifie « non documenté par les sources consultées ». La formule complète est écrite à la première occurrence de chaque fiche ; « ND » l'abrège ensuite.
- **« Déduction »** signale une conclusion de l'auteur de l'audit, qui ne figure dans aucune source.
- Les citations sont courtes. Elles viennent des extraits que l'outil WebFetch a renvoyés (voir F. Limites).

---

## A. Sources consultées

Les types possibles sont : règlement / démonstration pédagogique / analyse biomécanique / variante technique / exécution observée en compétition. Les nomenclatures officielles (Kodokan, IJF) sont classées « règlement », car ce sont des référentiels normatifs.

| Id | Organisme ou auteurs | Titre | URL | Type | Ce qui a été réellement lu | Accès |
|---|---|---|---|---|---|---|
| S1 | Kodokan Judo Institute | Names of Judo Techniques | https://kdkjd.org/names-of-judo-techniques/ | règlement | Liste des groupes (te-waza 16, koshi-waza 10, ashi-waza 21, ma-sutemi 5, yoko-sutemi 16 ; osaekomi 10, shime 12, kansetsu 10). Définitions d'une phrase de Seoi-nage, Ippon-seoi-nage, Uki-goshi, O-goshi, Koshi-guruma, O-soto-gari, Kesa-gatame, Kuzure-kesa-gatame, Ude-garami et Ude-hishigi-juji-gatame. Liens vidéo. | accessible |
| S2 | Kodokan Judo Institute | Kodokan Definitions of Judo Techniques (01.10.2022), PDF | http://kodokanjudoinstitute.org/en/f905005010274cfdb0c562fa210ee26bb073190d.pdf | règlement | rien | **inaccessible** (erreur de récupération) |
| S3 | Kodokan Judo Institute | Names of Judo techniques, PDF | http://kodokanjudoinstitute.org/news/docs/Names-of-Judo-techniques.pdf | règlement | rien | **inaccessible** |
| S4 | International Judo Federation | Pages techniques de judo.ijf.org : O-soto-gari, Seoi-nage, Ippon-seoi-nage, O-goshi, Kesa-gatame, Ude-hishigi-juji-gatame | https://judo.ijf.org/ et https://judo.ijf.org/techniques/<Nom> | démonstration pédagogique | Texte de définition de chaque page. La page Ude-hishigi-juji-gatame ne contient aucun texte (« Missing video »). | accessible |
| S5 | IJF / Kodokan (PDF hébergé par British Judo) | IJF/Kodokan Classification of Judo. Terminologie d'après le Kodokan New Japanese-English Dictionary of Judo (2000), liste mise à jour le 1er avril 2017 | https://www.britishjudo.org.uk/wp-content/uploads/2025/06/IJF-Kodokan-Classification-of-Judo.pdf | règlement | Groupes et directions de kuzushi des 6 techniques. Glossaire : tori, uke, kumikata, tsugiashi, ayumiashi, suriashi, tai-sabaki, ukemi, kuzushi, tsukuri, kake, osaekomi-waza. | accessible |
| S6 | IJF Academy | Page d'accueil | https://academy.ijf.org/ | — | Page d'accueil seulement : liste des formations, aucun contenu technique en libre accès. | accessible, sans contenu utile |
| S7 | IJF (extrait en français, hébergé par la ligue Hauts-de-France de judo) | Règles sportives et d'organisation de la FIJ, articles 13 à 18 (pages 122 à 131, édition non indiquée) | https://hautsdefrancejudo.ffjudo.com/uploads/sites/hautsdefrancejudo/userfiles/fichier/IJF_Sport_and_Organisation_Rul-1597761161%20p31%20%C3%A0%2040.pdf | règlement | Conditions et durées d'osaekomi, abandon, critères d'ippon, interdictions liées à la sécurité (pont, plongeon tête la première, contrôle de la nuque sans bras). | accessible |
| S8 | Fédération française de judo (FFJDA) | « Le lexique du judo » et « Les principes essentiels du judo » | https://www.ffjudo.com/les-bases-du-judo ; https://www.ffjudo.com/les-principes-essentiels-du-judo | démonstration pédagogique | Deux phrases générales sur la chute et le déséquilibre. Aucun terme technique détaillé. | accessible |
| S9 | FFJDA | Sécuriser la pratique du judo | https://www.ffjudo.com/securiser-judo | démonstration pédagogique | Phrases générales (« savoir chuter », prévention des commotions). | accessible |
| S10 | FFJDA | Apprendre à chuter | https://www.ffjudo.com/apprendre-a-chuter | démonstration pédagogique | rien | **inaccessible** |
| S11 | Francis Drouin (Judo Québec) | Les Chutes, Guide d'instruction (1995, révisé en 2000) | https://judo-quebec.qc.ca/files/Pages/entraineur/Guide_apprentissage_chutes%20%281%29.pdf | démonstration pédagogique | Ushiro-, yoko- et mae-ukemi : menton, frappe, angle de 45°, progression, sécurité. | accessible |
| S12 | Real Federación Española de Judo (circulaire traduite en catalan) | Kihon, Fonaments Judo Peu / Terra (09/01/2026) | https://fedecatjudo.cat/wp-content/uploads/2026/06/KIHON-JUDO.pdf | démonstration pédagogique | Shizen-tai, jigo-tai, tsugi-ashi, ayumi-ashi, suri-ashi, les 4 tai-sabaki, kumi-kata (tsurite et hikite), happo no kuzushi, principes d'ukemi. | accessible |
| S13 | British Judo (st4sport, niveau 3) | Module 16: Biomechanics for Judo | https://britishjudo.org.uk/wp-content/uploads/2024/10/M16-Biomechanics-for-Judo.pdf | analyse biomécanique (synthèse pédagogique) | Kuzushi, tsukuri et kake ; modèle de Sacripanti (couple de forces ou levier) ; types d'entrée de Hirano. | accessible |
| S14 | A. Sacripanti | Biomechanical Classification of Judo Throwing Techniques (Nage Waza), pages 183 à 194 | https://ojs.ub.uni-konstanz.de/cpa/article/view/2314/2187 | analyse biomécanique | Classes « couple de forces » et « levier physique » ; place d'O-soto-gari, de Seoi-nage et d'O-goshi ; point d'appui fourni par le frottement entre le pied et le tapis. | accessible |
| S15 | Imamura, Hreljac, Escamilla, Edwards (2006), J Sports Sci Med 5(CSSI1):122-131 | A three-dimensional analysis of the center of mass for three different judo throwing techniques | https://jssm.org/jssm-05-CSSI1-122.xml-Fulltext | analyse biomécanique | Définition opérationnelle des phases ; centre de masse, quantité de mouvement et impulsion d'uke pour o-soto-gari, seoi-nage et harai-goshi. | accessible |
| S16 | Imamura, Iteya, Hreljac, Escamilla (2007), J Sports Sci Med 6(CSSI2):15-22 | A kinematic comparison of the judo throw harai-goshi during competitive and non-competitive conditions | https://www.jssm.org/jssm-06-CSSI2-15.xml-Fulltext | analyse biomécanique | Phases, légère résistance d'uke, rotation du tronc (harai-goshi seulement). | accessible |
| S17 | Murayama, Hitosugi, Motozawa, Ogino, Koyama (2020), Neurol Med Chir 60(6):307-312 | Ukemi Technique Prevents the Elevation of Head Acceleration of a Person Thrown by the Judo Technique "Osoto-gari" | https://pmc.ncbi.nlm.nih.gov/articles/PMC7301129 | analyse biomécanique | Texte de l'article (résultats chiffrés, contexte épidémiologique, limites). | accessible |
| S18 | Lockhart, Błach, Angioi, Ambroży, Rydzik, Malliaropoulos (2022), IJERPH 19(7):4259 | A Systematic Review on the Biomechanics of Breakfall Technique (Ukemi) in Relation to Injury in Judo within the Adult Judoka Population | https://www.mdpi.com/1660-4601/19/7/4259 (la version PMC PMC8998643 était bloquée par un captcha) | analyse biomécanique | Article lu sur MDPI (100 000 caractères sur 102 892 ; la fin n'a pas été lue). | accessible (PMC bloqué) |
| S19 | Koshida, Ishii, Matsuda, Hashimoto, ISBS 2015 (publié en 2016) | Biomechanics of judo breakfall for osoto-gari in adolescent judokas | https://ojs.ub.uni-konstanz.de/cpa/article/view/6410 | analyse biomécanique | Résumé seulement. | accessible (résumé) |
| S20 | Koshida et Matsuda, ISBS 2012 | Neck and trunk kinematics and electromyographic activity during judo backward breakfalls | https://ojs.ub.uni-konstanz.de/cpa/article/view/5184 | analyse biomécanique | Résumé seulement. | accessible (résumé) |
| S21 | Nakanishi, Hitosugi, Murayama et al. (2021), Healthcare 9(2):214 | Biomechanical Analysis of Serious Neck Injuries Resulting from Judo | https://pmc.ncbi.nlm.nih.gov/articles/PMC7920453/ | analyse biomécanique | Texte de l'article : mannequin projeté en seoi-nage, osoto-gari et ouchi-gari. | accessible |
| S22 | ISBS 2016, vol. 34(1):683-686 (auteurs non affichés) | The centre of mass kinematics for elite women judo athletes in seoi-nage | https://www.iat.uni-leipzig.de/datenbanken/iks/dfb-fechten/Record/4046328 | analyse biomécanique | Notice bibliographique et résumé. | accessible (notice) |
| S23 | Research Journal of Budo 57(2):153-169 (2025), doi:10.11214/budo.2420 (auteurs non affichés) | Unveiling the biomechanical characteristics of uke in seoi-nage | https://lida.sport-iat.de/dbv/Record/4092983?lng=en | analyse biomécanique | Notice et résumé. | accessible (notice) |
| S24 | IBJJF | Page « Books and videos » (index des règlements) | https://ibjjf.com/books-videos | règlement | Liens vers le Rule Book v6.0, le guide des mises à jour, l'affiche des fautes et une playlist YouTube. Aucun texte de règle. | accessible, sans texte de règle |
| S25 | IBJJF | Rule Book v6.0 (2024JUN_IBJJF_Rules_EN.pdf) | lien de S24 | règlement | rien | **inaccessible** (la redirection vers S3 donne une URL trop longue pour le proxy) |
| S26 | JJIF / JJAU (fichier hébergé par l'UAEJJF) | Jiu-Jitsu (Ne-Waza) Rulebook v2.7 (approuvé en 2015, revu en 2024) | https://events.uaejjf.org/en/files/829y/224 | règlement | Barème (amenée au sol, balayage, passage de garde, genou sur le ventre, montée, dos), stabilisation, abandon, techniques interdites, définition de la garde. | accessible |
| S27 | JJAU / JJIF (version française hébergée par la FFJDA) | Règles de compétition Jujitsu Ne Waza V.2.2 | https://www.ffjudo.com/resource-file/document/1703151815_f14cd074cce6cd40029c.pdf | règlement | Montée, garde, passage de garde, abandon (art. 10.2.1 à 10.2.3), sécurité. | accessible |
| S28 | Gracie University | Lesson 1: Trap and Roll Escape (page publique) | https://www.gracieuniversity.com/Pages/Public/Lesson?sh=222 | démonstration pédagogique | Présentation textuelle seulement. Le contenu technique est en vidéo. | accessible (aperçu) |
| S29 | Gracie University | Lesson 19: Straight Armlock (Guard) | https://www.gracieuniversity.com/Pages/Public/Lesson.aspx?sh=244 | démonstration pédagogique | Présentation seulement (variantes « Low » et « High »). Contenu payant. | accessible (aperçu) |
| S30 | Gracie University | Lesson 3: Positional Control (Mount) | https://www.gracieuniversity.com/Pages/Public/Lesson?sh=2055 | démonstration pédagogique | Présentation seulement (« hip pressure »). | accessible (aperçu) |
| S31 | Gracie Combatives (Gracie La Palma) | Programme « Street Readiness in 23 Classes », septembre 2026, PDF | https://www.gracieuniversity.com/UploadsFiles/Documents/UploadsConvert/lc59_it2829_cbad71fc_CombativesSeptember2026.pdf | démonstration pédagogique | Liste des 36 techniques. Aucune description. | accessible |
| S32 | Gracie Barra (Mark Mullen) | The Most Important Escape? | https://graciebarra.com/gb-learning/the-most-important-escape/ | démonstration pédagogique | Trois conseils sur la sortie de contrôle latéral (coudes serrés, cadres, timing). | accessible |
| S33 | Gracie Barra (GB Association Team) | Future Champions 3.0: Two Tips on How to Teach Hip Escapes to Children | https://graciebarra.com/gb-learning/future-champions-3-0-2-tips-on-how-to-teach-hip-escapes-to-little-champions/ | démonstration pédagogique | Deux conseils pour enseigner la sortie de hanche aux enfants. | accessible |
| S34 | GB Institute (Carlos Gracie Jr.) | Week 2: Escape from bottom Side Mount | https://institute.graciebarra.com/blog/week-2-escape-from-bottom-side-mount-with-master-carlos-gracie-jr | démonstration pédagogique | Étapes résumées : cadres, hanches, remise en garde, erreur courante. | accessible |
| S35 | GB Institute (Carlos Gracie Jr.) | Jiu-Jitsu Fundamentals: Guard Bottom | https://institute.graciebarra.com/blog/the-fundamentals-guard-guard-gb1-by-master-carlos-gracie-jr | démonstration pédagogique | Balayage hip bump et kimura depuis la garde fermée. | accessible |
| S36 | Gracie Barra (Mark Mullen) | GB Fundamentals: Passing Open Guard with Technique and Principles | https://graciebarra.com/gb-news/gb-fundamentals-passing-open-guard-with-technique-and-principles | démonstration pédagogique | Principes du passage de garde ouverte, dont le toreando. | accessible |
| S37 | Graciemag (rédaction, 23/07/2014) | Video: Brush up on both ends of the toreando with a pass and a counter | https://www.graciemag.com/?p=121998 | variante technique | Texte de présentation (saisies, direction, position finale) et 3 liens vidéo. | accessible |
| S38 | Stephan Kesting, Grapplearts (20/04/2022) | The Four Variations of the BJJ Technical Standup | https://www.grapplearts.com/the-four-variations-of-the-bjj-technical-standup/ | variante technique | Description textuelle du relevé technique complet. | accessible |
| S39 | S. Kesting, Grapplearts (02/12/2016) | The Ultimate Guide to Developing BJJ Hip Movement Through Shrimping | https://www.grapplearts.com/ultimate-guide-developing-bjj-hip-movement-shrimping/ | démonstration pédagogique | Description du shrimp à deux jambes et de l'erreur courante. | accessible |
| S40 | S. Kesting, Grapplearts (14/01/2020) | How to Escape Side Control | https://www.grapplearts.com/how-to-escape-side-control/ | démonstration pédagogique | Position du dessus (crossface), blocage du bras, pont, shrimp, remise en garde, erreurs. | accessible |
| S41 | S. Kesting, Grapplearts (12/11/2024) | The 4 Most Common Errors For The "Upa" Mount Escape | https://www.grapplearts.com/the-4-most-common-errors-for-the-upa-mount-escape/ | démonstration pédagogique | Les 4 erreurs listées. | accessible |
| S42 | S. Kesting, Grapplearts (19/09/2016) | A Simple Tweak to Develop a Powerful Bridge in BJJ | https://www.grapplearts.com/develop-powerful-bridge-bjj/ | variante technique | Pont sur l'avant des pieds, nuque, erreurs. | accessible |
| S43 | S. Kesting, Grapplearts (2004, modifié en 2015) | Armbar Fundamentals | https://www.grapplearts.com/armbar-fundamentals/ | démonstration pédagogique | Les 3 vérifications (hanches, pincement des jambes, pouce). | accessible |
| S44 | S. Kesting, Grapplearts (26/05/2018) | A 3 Step Process for Making an Angle in the Closed Guard | https://www.grapplearts.com/making-an-angle-in-the-closed-guard/ | variante technique | Prise d'angle en garde fermée. | accessible |
| S45 | S. Kesting, Grapplearts (10/05/2014) | Some Principles and Concepts for an Effective Closed Guard | https://grapplearts.com/some-principles-and-concepts-for-an-effective-closed-guard | démonstration pédagogique | Définition de la garde fermée, rupture de la posture, hanches, erreur courante. | accessible |
| S46 | S. Kesting, Grapplearts (11/08/2014) | BJJ Self Defense Part 2: Escaping the Mount | https://www.grapplearts.com/bjj-self-defense-part-2-escaping-the-mount/ | démonstration pédagogique | Texte d'introduction seulement. | accessible (peu de contenu) |
| S47 | Brad Parker, sur Grapplearts (04/04/2012) | BJJ Self Defense: After the Takedown, Now What? | https://www.grapplearts.com/bjj-self-defense-after-the-takedown-now-what/ | variante technique (contexte de self-défense) | Description de la montée « idéale ». | accessible |
| S48 | R. Conde (2018), Pedagogico-Psychological and Medico-Biological Problems of Physical Culture and Sports 13(2):6-16 | Armlock in the Closed guard: kinematic consequences to the kinetics of the technical gesture | https://cyberleninka.ru/article/n/armlock-in-the-closed-guard-kinematic-consequences-to-the-kinetics-of-the-technical-gesture | analyse biomécanique | Méthode, phases, 3 façons d'exécuter la clé, tableaux (incohérences internes relevées). | accessible |
| S49 | Jiu-Jitsu Global Federation | workbook_Rickson_ENG.pdf | https://jjgf.com/images/educationalServices/workbook_Rickson_ENG.pdf | démonstration pédagogique | Seules les métadonnées du site ont été renvoyées. | **inaccessible** (contenu non lu) |
| S50 | Gracie Sydney | Gracie Kids and Teens Class Syllabus | https://graciesydney.com.au/?p=5926 | démonstration pédagogique | Aucune technique décrite. | accessible, sans contenu utile |

---

## B. Références vidéo repérées (NON visionnées)

Toutes ces références sont « repérées, NON visionnées ». Aucune n'a été analysée.

**Kodokan (liens depuis S1)**
- Seoi-nage : https://youtu.be/zIq0xI0ogxk
- Ippon-seoi-nage : https://youtu.be/FQnOlCxo4oI
- Uki-goshi : https://youtu.be/bPKwtB4lyOQ
- O-goshi : https://youtu.be/yhu1mfy2vJ4
- Koshi-guruma : https://youtu.be/SU7Id6uVJ44
- O-soto-gari : https://www.youtube.com/watch?v=c-A_nP7mKAc
- Kesa-gatame : https://youtu.be/NDaQuJOFBYk
- Kuzure-kesa-gatame : https://youtu.be/Q2fb9jaoUFQ
- Ude-garami : https://youtu.be/AIlTvZb4RlE
- Ude-hishigi-juji-gatame : https://youtu.be/OWgSOlCuMXw

**IJF : animations 3D (liens depuis S4), non visionnées**
- https://judo.ijf.org/techniques/O-soto-gari/animation
- https://judo.ijf.org/techniques/Seoi-nage/animation
- https://judo.ijf.org/techniques/Ippon-seoi-nage/animation
- https://judo.ijf.org/techniques/O-goshi/animation
- Portail vidéo général de l'IJF : https://videos.ijf.org/

**BJJ**
- IBJJF, playlist sur les règles : https://www.youtube.com/watch?v=OUhrE6CnIi8&list=PLndFOMjO-W27bcQWzJbHMhul7llTclJpB
- Gracie University, vidéos des leçons « Trap and Roll Escape » (35 min 33 s), « Straight Armlock (Guard) » (24 min 3 s) et « Positional Control (Mount) » (1 h 16 min 30 s), pages S28 à S30 (contenu payant).
- Gracie Barra, Flavio Almeida, enseigner la sortie de hanche aux enfants : https://youtu.be/0SmcC4y7O_8
- GB Institute, « Technique 8 Class 2A - Escape Side Mount bottom » : https://player.vimeo.com/video/269404751
- GB Institute, « Technique 9 Class 2A - Escape Side mount bottom - High Leg Escape » : https://player.vimeo.com/video/269404755
- GB Institute, « Technique 74 / 75 - Class 13A from GB1 » : https://institute.graciebarra.com/course/gb-1
- Graciemag, toreando de Kev Capel : https://www.youtube.com/watch?v=TYOWQ1jtsmE
- Graciemag, toreando de Leandro Lo : https://www.youtube.com/watch?v=HcrOBNTiYpg
- Graciemag, contre de Flavio Almeida : https://www.youtube.com/watch?v=-FeDvvj-c0I
- Grapplearts, « The Four Types of Technical Standups » (Brandon Mullins) : https://www.youtube.com/embed/quMmk9Xs2HE
- Grapplearts, « 10 Ways to Shrimp and Improve Hip Mobility on the Ground » : https://www.youtube.com/embed/TQ4gJ7E6Xis
- Grapplearts, Thomas Lisboa, sortie de contrôle latéral : https://www.youtube.com/embed/-9Kf1javraQ
- Grapplearts, erreurs de l'upa : https://www.youtube.com/embed/whaSmJBrKZY
- Grapplearts, pont sur l'avant des pieds : https://www.youtube.com/watch?v=JR5VYtIDBdY
- Grapplearts, prise d'angle en garde fermée : https://www.youtube.com/embed/7SsZWyNn4-I
- Grapplearts, principes de la garde fermée : https://www.youtube.com/embed/KKxD5kdOkk0

---

## C. Fiches par technique

Définitions communes (glossaire S5) :
- tori : « The person who applies a throw or other technique » ;
- uke : « The person who receives a technique during repetition » ;
- kuzushi : « An action to unbalance your opponent in preparation for throwing him » ;
- tsukuri : action qui prépare la projection après le déséquilibre ;
- kake : exécution de la technique.

Kumi-kata de base (S12) : une main au revers, l'autre à la manche. La main au revers fait le tsurite, la main à la manche le hikite.
Happo no kuzushi (S12) : 8 directions, soit avant, arrière, côtés et diagonales, à droite et à gauche.
Phases opérationnelles mesurables (S15) :
- le kuzushi commence au premier mouvement de tori vers l'entrée ;
- le tsukuri commence quand les pieds de tori poussent sur le sol ;
- le kake commence quand les pieds d'uke quittent le sol.

Dans le modèle de Sacripanti, l'ordre devient tsukuri, kuzushi, kake en situation dynamique [S13].

### C.1 Judo : fiches avec partenaire

#### O-soto-gari (fiche `o-soto-gari`)
- **Nom et groupe** : O-soto-gari, nage-waza > ashi-waza n° 4 [S1][S5]. Couple de forces selon Sacripanti [S14][S13].
- **Définition** : faucher la jambe droite d'uke par l'extérieur avec la jambe droite [S1].
- **Kuzushi** : vers l'arrière ou l'arrière droit d'uke, pour amener la plus grande partie de son poids sur le talon droit [S4][S5].
- **Tsukuri** : la jambe qui fauche entre en contact pendant le tsukuri ; tori tire uke vers lui en entrant ; la quantité de mouvement médio-latérale culmine pendant le tsukuri, ce que les auteurs relient au contact poitrine contre poitrine [S15].
- **Kake** : fauchage de la jambe avec la jambe droite [S4]. « the osoto-gari tosses the uke backwards » [S15]. C'est, avec harai-goshi, la projection qui donne la plus grande impulsion à uke [S15].
- **Bras** : les bras de tori tirent pendant que le pied droit pousse sur le sol [S15].
- **Rôles** : tori fauche ; uke est projeté en arrière et chute en ushiro-ukemi. Le texte de l'IJF ne nomme pas la chute ; le lien vient de S5 (glossaire), qui définit l'ushiro-ukemi comme la chute vers l'arrière.
- **Résistance d'uke** : une légère résistance d'uke dans l'axe médio-latéral a été mesurée pendant le kuzushi [S15].
- **Chute et sécurité** :
  - environ 70 % des blessures graves à la tête surviennent sur o-soto-gari, et environ 60 % des hématomes sous-duraux aigus en judo viennent d'un choc de l'occiput sur le tatami [S17] ;
  - avec un ukemi d'expert, la tête ne touche pas le tapis ; accélération maximale de 10,3 ± 1,6 G et 679,4 ± 173,6 rad/s² (1 tori et 1 uke, 4 essais) [S17] ;
  - sans ukemi, l'accélération de rotation de la tête atteint 5081,3 ± 691,8 rad/s² ; les judokas qui chutent de façon risquée ne devraient pas être encouragés à pratiquer o-soto-gari [S18] ;
  - chez les adolescents, la cinématique de la chute sur o-soto-gari n'est pas comparable à celle des adultes expérimentés [S19].
- **Fin** : selon les critères d'ippon, uke tombe sur le dos, avec vitesse, force et contrôle jusqu'à la fin [S7].
- **Non documenté par les sources consultées** : placement exact du pied gauche de tori, appuis précis, rôle de chaque main (tirer ou pousser), « jambe d'appui fléchie », mouvement du buste vers l'avant pendant le kake, erreurs courantes du point de vue technique.

#### O-goshi (fiche `o-goshi`)
- **Nom et groupe** : O-goshi, nage-waza > koshi-waza n° 2 [S1][S5]. Levier physique à bras variable selon Sacripanti [S14][S13].
- **Définition (Kodokan)** : charger uke sur l'arrière de la hanche et le projeter, après l'avoir déséquilibré vers l'avant, en passant le bras droit sous son aisselle gauche, en tenant sa hanche et en la rapprochant [S1].
- **Kuzushi** : vers l'avant ou l'avant droit [S4][S5].
- **Tsukuri et kake** : entrer profondément avec la hanche droite pour le faire décoller (« float him up »), puis tourner pour le projeter par-dessus la hanche [S4].
- **Biomécanique** : sur un levier, abaisser le point d'appui sous la taille d'uke réduit l'énergie perdue ; le frottement entre le pied et le tapis fournit le point d'arrêt [S14].
- **Non documenté par les sources consultées** : placement des pieds (« les deux pieds à l'intérieur »), flexion des genoux, hanche « plus basse que sa ceinture », rôle de la main gauche, chute d'uke, erreurs courantes. S14 et S15 n'étudient pas o-goshi ; S15 étudie harai-goshi.

#### Seoi-nage et Ippon-seoi-nage (fiche `seoi-nage`)
- **Nom et groupe** : le Kodokan distingue **Seoi-nage** (te-waza n° 1) et **Ippon-seoi-nage** (te-waza n° 2) [S1][S5]. Tous deux sont des leviers physiques à bras variable, le point d'appui allant de la taille vers les genoux [S14][S13].
- **Seoi-nage (Kodokan)** : déséquilibrer vers l'avant, glisser le coude droit sous l'aisselle droite d'uke pour le charger sur le dos et le projeter par-dessus l'épaule droite [S1].
- **Seoi-nage (IJF)** : kuzushi vers l'avant ou l'avant droit ; pivot vers la gauche, le coude droit plié vient sous l'aisselle droite ; charger sur le dos, projeter par-dessus l'épaule droite [S4].
- **Ippon-seoi-nage (Kodokan)** : tenir le bras droit d'uke par l'intérieur avec le bras droit [S1].
- **Ippon-seoi-nage (IJF)** :
  - kuzushi : faire « flotter » uke vers l'avant ;
  - en pivotant vers la gauche, saisir sa manche droite par l'intérieur ;
  - glisser le bras droit sous son aisselle droite et saisir le haut de la manche droite ou l'épaule ;
  - le tirer sur le dos et le projeter par-dessus l'épaule droite [S4].
- **Tai-sabaki** : rotation de 180° des pieds de tori [S15]. Pivot vers la gauche [S4].
- **Kuzushi (biomécanique)** : la main qui tire emmène uke vers l'avant et en travers ; un « snap pull » pendant le kuzushi provoque une résistance ; seoi-nage donne la plus faible impulsion des trois projections étudiées, et la quantité de mouvement d'uke vers l'avant se maintient jusqu'au kake [S15].
- **Centre de masse d'uke** : il monte légèrement pendant la rotation, puis descend nettement pendant la projection, surtout vers l'avant et le bas. Le moment cinétique augmente, surtout dans l'axe médio-latéral [S23].
- **Centre de masse de tori** : chez les athlètes élites (femmes), la vitesse relative maximale du centre de masse vers l'avant est plus grande ; la durée de la rotation ne diffère pas entre les groupes [S22].
- **Chute et sécurité** :
  - seoi-nage est la projection la plus fréquente chez les judokas victimes de blessures graves au cou (42,9 %) [S18][S21] ;
  - sur mannequin, l'avant et le sommet du crâne touchent le tatami, puis le poids du corps comprime le cou ; les indices de risque (Nij médian 0,68, BC médian 0,90) sont plus élevés qu'avec osoto-gari et ouchi-gari [S21] ;
  - pendant ces essais, tori posait les deux genoux au sol, position que la Fédération japonaise de judo associe aux blessures graves du cou [S21].
- **Non documenté par les sources consultées** : flexion des genoux de tori et position de ses pieds (« parallèles, à l'intérieur »), forme de la chute d'uke (mae-mawari ou yoko), erreurs courantes du point de vue technique.

#### Kesa-gatame (fiche `kesa-gatame`)
- **Nom et groupe** : Kesa-gatame, katame-waza > osaekomi-waza n° 1 [S1][S5].
- **Contrôle** :
  - Kodokan : maintenir le haut du corps d'uke, couché sur le dos, sous le côté droit de la poitrine de tori ; tenir son bras droit avec le bras gauche depuis son côté droit ; saisir l'arrière de son col avec la main droite [S1] ;
  - IJF : face à sa tête, saisir le judogi sous son aisselle droite avec la main gauche ; le bras droit passe derrière sa nuque pour saisir le judogi derrière l'épaule [S4] ;
  - variante Kuzure-kesa-gatame : le bras droit passe sous l'aisselle gauche [S1].
- **Règlement** :
  - uke est contrôlé sur le côté, sur le dos ou par-dessus, le dos entier ou le haut du dos au tapis ; les jambes ou le corps de tori ne doivent pas être contrôlés par les jambes d'uke ; tori reste au-dessus d'uke et presse avec le haut du corps [S7] ;
  - ippon si uke ne sort pas avant 20 s ; waza-ari entre 10 et 19 s [S7] ;
  - une saisie de la seule tête ou de la seule nuque, sans contrôle d'au moins un bras, est interdite [S7].
- **Abandon** : taper deux fois ou plus avec la main ou le pied, ou dire « maitta » [S7].
- **Non documenté par les sources consultées** : position des jambes de tori (« jambe droite fléchie devant, gauche loin derrière »), poids « sur sa poitrine », tête basse, sorties d'uke, erreurs courantes.

#### Ukemi (fiche `ukemi`)
- **Définitions** : ukemi, terme général des chutes qui protègent le corps quand on est projeté ; ushiro-, yoko- et mae-mawari-ukemi sont les chutes vers l'arrière, sur le côté et roulée vers l'avant [S5].
- **Menton et tête** :
  - « garder le menton près de la poitrine », regard vers la ceinture ; la tête ne doit jamais toucher le sol [S11] ;
  - rentrer la tête [S12] ;
  - la flexion du cou est enseignée pour éviter le choc de la tête, mais l'angle de flexion ne distingue pas les débutants des judokas d'élite [S18].
- **Bras** :
  - la frappe se fait paume au sol, avec les deux mains en arrière ou une main sur le côté ; « un angle d'environ 45° par rapport au corps » [S11] ;
  - écarter les bras du corps augmente la surface de contact [S12] ;
  - sur ouchi-gari, l'impact de la main, de l'avant-bras et du tronc réduit la vitesse verticale [S18].
- **Forme du corps** :
  - en chute roulée, la bande de contact va « de la nuque au sacrum » ; jambe arrière allongée à la réception [S11] ;
  - corps courbé « comme une sphère » [S12] ;
  - les judokas expérimentés montrent davantage d'extension du tronc, ce qui pourrait les protéger ; les données sont mitigées [S18].
- **Progression** : couché, assis, accroupi, debout, puis en déplacement et avec partenaire [S11].
- **Sécurité** :
  - pratiquer sous la supervision d'un instructeur qualifié [S11] ;
  - introduire l'ukemi le plus tôt possible, éviter les ukemi « non orthodoxes » et la fatigue ; un sous-tapis ne suffit pas à réduire le choc de la tête [S18] ;
  - la FFJDA fonde la sécurité sur le « savoir chuter » [S9].
- **Expiration au contact** : non documentée par les sources consultées (S11 n'en parle pas).

### C.2 Judo : fiches solo

#### Shizen-tai (`shizen-tai`)
- Pieds écartés d'environ la largeur des épaules, posture droite et relâchée, poids réparti également [S12].
- Jigo-tai : écart d'environ deux fois la largeur des épaules, posture à garder brièvement [S12].
- Kumi-kata : un revers et une manche [S12].
- Le glossaire S5 ne définit pas le terme shizen-tai.

#### Tsugi-ashi avant, arrière, latéral (`tsugi-ashi-*`)
- « stepping with one foot, the drawing the other foot up to meet it » [S5]. Un pied suit toujours l'autre « sans le dépasser » [S12].
- Suri-ashi : la plante des pieds effleure le tapis [S5] ; talons légèrement levés, sans lever les orteils [S12].
- Ayumi-ashi : pas alternés comme la marche [S5][S12].
- Non documenté par les sources consultées : quel pied part en premier vers l'arrière et vers le côté ; « les pieds ne se touchent pas » ; « hanches face au partenaire ».

#### Tai-sabaki (`tai-sabaki`)
- Terme général des mouvements qui déplacent le corps et changent sa direction [S5].
- Quatre types : mae-sabaki (90° vers l'avant), ushiro-sabaki (90° vers l'arrière), mae-mawari-sabaki (180° vers l'avant), ushiro-mawari-sabaki (180° vers l'arrière), à droite et à gauche [S12]. Hirano s'en sert pour classer les entrées [S13].
- Non documenté par les sources consultées : « rester à la même hauteur », « pied d'appui qui ne glisse pas ».

#### Kuzushi solo (`kuzushi`)
- 8 directions [S12]. Le hikite est la main à la manche, le tsurite la main au revers [S12].
- Le kuzushi peut aussi provoquer une légère résistance d'uke, ce qui permet de placer le tsukuri [S15][S16].
- Non documenté par les sources consultées : « tirer vers la hanche », « monter le revers », « reculer le pied » comme recette générale du kuzushi.

#### Uchikomi de seoi-nage (`uchikomi-seoi`)
- Voir la fiche Seoi-nage : pivot vers la gauche, rotation de 180°, coude sous l'aisselle [S4][S15].
- Non documenté par les sources consultées : « pieds finissent à l'intérieur, parallèles », « genoux fléchis, pas le dos ». Aucune source consultée ne décrit l'uchikomi à vide.

### C.3 BJJ : fiches avec partenaire

Règles communes (JJIF ne-waza) :
- stabilisation de 3 s pour marquer, un avantage sinon [S26 art. 8.1-8.2][S27] ;
- abandon : taper de la main sur l'adversaire, le sol ou son propre corps ; le pied ne compte que si l'athlète ne peut pas utiliser ses bras ; abandon verbal, cri ou grognement de douleur [S26 art. 10.2] ; taper au moins deux fois de la main ou du pied [S27 art. 10.2.1-10.2.3].

Le Rule Book de l'IBJJF n'a pas pu être lu [S25].

#### Garde fermée (`garde-fermee`)
- **Position** : « your legs are typically locked around your opponent's torso with your ankles crossed » [S45]. Garde définie comme l'usage d'une ou deux jambes pour bloquer l'adversaire [S26][S27].
- **Contrôle** : contrôler la posture avec les jambes et les bras ; « Pulling your legs towards your own chest is a very important part of controlling/breaking his posture » ; saisies manche et col, manche et pantalon, overhooks, underhooks [S45].
- **Interaction des deux corps** : la plupart des attaques demandent des hanches qui ne restent pas à plat ; un pied sur la hanche, rotation de 90°, l'autre jambe referme [S45] ; prise d'angle en trois temps [S44].
- **Sortie** : le hip bump sert quand l'adversaire se redresse fort et s'apprête à ouvrir les jambes ; contrôler son coude [S35].
- **Erreur courante** : laisser les pieds pendre aux hanches de l'adversaire [S45].
- **Sécurité** : sauter en garde fermée est interdit aux U16 et aux ceintures blanches [S26 art. 15.1.1].
- **Contrôle de la tête** : non documenté par les sources consultées (S45 ne cite pas les saisies de la tête).

#### Passage de garde toreando (`passage-toreando`)
- **Saisies** : « placing your grips on both pant legs » ; pousser ou tirer les jambes sur le côté puis faire un pas de côté ; objectif : contrôle latéral ou nord-sud [S37].
- **Principes** :
  - le passeur joue le matador face au « taureau » des jambes ;
  - casser les saisies de manche est « critical » ;
  - rediriger les hanches d'uke et passer vers son dos ;
  - en garde ouverte, contrôler la distance en s'approchant très près pour ôter leur force aux jambes [S36].
- **Règlement** : passage de garde à 3 points, après 3 s de contrôle [S26 art. 9.3][S27 art. 9.E.1].
- **Non documenté par les sources consultées** : saisie « au niveau des genoux », posture debout droite, retour debout de l'autre côté.

#### Contrôle latéral (`controle-lateral`)
- **Dessus** : le joueur du dessus peut mettre beaucoup de poids ; le crossface (bras sous la tête, visage tourné avec le biceps) « limits your ability to move » ; passages possibles vers la montée ou le dos [S40].
- **Dessous** :
  - bloquer le bras du dessus au niveau du biceps et du triceps [S40] ;
  - cadres avec l'avant-bras pour garder le poids hors de la poitrine ; hanches dehors ; pieds sur les hanches pour revenir en garde [S34] ;
  - coudes serrés, cadres plutôt que pousser [S32] ;
  - pont pour créer l'espace initial, puis shrimp, pour glisser genou et tibia entre les deux corps [S40].
- **Erreurs (dessous)** :
  - shrimper sans cesse dans la même direction ; passer la jambe proche en travers de la ceinture [S40] ;
  - pousser avec la force des bras [S34].
- **Règlement** : le JJIF ne donne pas de points au contrôle latéral en tant que tel [S26].
- **Non documenté par les sources consultées** : genoux collés, « le poids passe par la poitrine, pas par les genoux ».

#### Montée (`montee`)
- **Règlement** : les jambes enjambent le torse ; 4 points [S26 art. 9.5] ; « à cheval avant ou arrière », 4 points après 3 s [S27 art. 9.C].
- **Position (contexte de self-défense)** :
  - « knees high up toward his armpits, both your arms out for balance » ;
  - « weight is relaxed down onto the opponent's upper chest and face » ;
  - « Stay off of his hips so you don't get bumped up » [S47].
- **Contrôle** : appliquer une pression de hanches efficace [S30], sans autre détail.
- **Sorties d'uke** : trap and roll, ou upa [S28][S41] ; elbow escape [S30].
- **Erreurs de l'upa (pour uke)** [S41] :
  - partir avant d'avoir amené au moins une main de l'adversaire au sol ;
  - rester en pont ;
  - ne pas bloquer le bras et la jambe du même côté ;
  - rouler avant d'avoir monté les hanches au maximum.
- **Non documenté par les sources consultées** : « pieds qui crochètent ses jambes », passage depuis le contrôle latéral « genou qui glisse sur le ventre ».

#### Clé de bras depuis la garde (`cle-de-bras-garde`)
- **Nom judo** : Ude-hishigi-juji-gatame, kansetsu-waza n° 2 [S1][S5].
- **Définition Kodokan** : uke est couché sur le dos ; tori, sur son côté droit, saisit son poignet droit à deux mains, tient le haut du bras entre ses cuisses et étend le coude [S1]. Le coude est étendu « in the direction of his little finger » [S5].
- **Depuis la garde fermée (BJJ)** [S48] :
  - l'axe du mouvement est la colonne lombaire de l'adversaire ;
  - la saisie se fait au biceps plutôt qu'au triceps ;
  - le bassin se projette et le tronc se relève ;
  - à la fin, le bras s'étend, la jambe passe, le poignet se met en tension ;
  - la tête de l'adversaire est pressée vers le tapis pendant l'hyperextension.
- **Vérifications** : « Are my hips close to his shoulder? » ; jambes qui pincent le bras ; « Is his thumb pointing up to the ceiling? » [S43].
- **Gracie University** : variantes « Low » et « High » [S29], contenu non lu.
- **Sécurité** :
  - les clés de bras (rotation ou hyperextension de l'épaule ou du coude) sont autorisées dans toutes les catégories d'âge [S26 art. 10.1] ;
  - lésions fréquentes de la capsule articulaire et des ligaments collatéraux, d'après Park cité par S48 ;
  - règles d'abandon : voir plus haut [S26][S27][S7].
- **Non documenté par les sources consultées** : « pression lente et progressive », consigne précise de relâchement.

### C.4 BJJ : fiches solo

| Fiche | Ce que disent les sources | Non documenté par les sources consultées |
|---|---|---|
| `sortie-hanche` | Shrimp à deux jambes : rouler en partie sur le côté, amener les deux pieds près des fesses, soulever les hanches et les emmener vers la tête en se pliant ; erreur : rester à plat, ce qui crée trop de frottement [S39]. Appui sur un ou deux pieds et une épaule, hanches décollées [S40]. Pour enseigner aux enfants, tenir les pieds ou soulever par la ceinture [S33]. | Rôle de la main ; « coude près du corps » en solo (S32 le dit seulement pour la sortie de contrôle latéral). |
| `pont` | Pont sur l'avant des pieds plutôt que sur les talons, pour monter les hanches plus haut ; ne pas faire le pont sur le sommet du crâne (risque pour la nuque) ; ne pas bloquer sa respiration avant d'exploser ; ne pas rester en pont statique [S42]. Dans l'upa, monter les hanches complètement avant de rouler, en bloquant le bras et la jambe du même côté [S41]. En judo, un pont volontaire après une projection compte ippon, pour la sécurité de la colonne [S7]. | « Pieds à plat près des fesses » (S42 propose une variante) ; menton rentré. |
| `releve-technique` | Une main et le pied opposé posés ; soulever les hanches, tourner le ventre vers le sol et ramener la jambe en arrière ; protéger la tête avec le bras libre en self-défense ; finir dans une garde large et stable ; erreur : se lever pieds serrés [S38]. | — |
| `retention-garde` | Pour remettre la garde : glisser genou et tibia entre les deux corps ; la jambe remonte vers l'épaule proche de l'adversaire, pas en travers de la ceinture [S40]. Pieds sur les hanches [S34]. | La version solo, « épaules au sol, hanches qui tournent ». |
| `descente-sol` | Aucune source trouvée. | Fiche entière. |
| `garde-bjj` | Aucune source trouvée. | Fiche entière. |
| `changement-base` | Aucune source trouvée. | Fiche entière. |

---

## D. Écarts entre l'application et les sources, classés par gravité

### Grave (contredit une source, ou omet un risque de sécurité documenté)
1. **`cle-de-bras-garde`, phase « Contrôle » : « Ses épaules restent au sol ».** La fiche part de la garde fermée. Dans cette configuration, l'adversaire est au-dessus ; S48 décrit seulement une pression de sa tête vers le tapis pendant l'hyperextension. « Épaules au sol » correspond à la définition Kodokan de juji-gatame, où uke est couché sur le dos et tori sur son côté [S1][S5]. La fiche mélange donc deux configurations. Il faut choisir l'une ou l'autre.
2. **`o-soto-gari` : risque crânien absent et niveau « débutant ».** Environ 70 % des blessures graves à la tête et environ 60 % des hématomes sous-duraux aigus (choc occipital) sont associés à o-soto-gari [S17]. S18 recommande de ne pas encourager o-soto-gari chez les judokas qui chutent de façon risquée. La fiche demande bien la maîtrise de l'ushiro-ukemi, mais elle ne signale pas ce risque particulier. Le niveau « débutant » est à revoir avec un enseignant (déduction).
3. **`seoi-nage` : la sécurité ne mentionne pas le risque pour le cou.** C'est la projection la plus fréquente parmi les blessures graves au cou (42,9 %), par contact de l'avant ou du sommet du crâne puis compression [S21][S18]. L'application parle seulement d'une « forte hauteur de chute », ce que les sources consultées ne documentent pas. Le keyPoint « Ne pas tomber à genoux sans l'accord de l'enseignant » est cohérent avec S21, qui associe les deux genoux au sol de tori aux blessures du cou. Il faudrait le citer comme raison de sécurité.
4. **Règles d'abandon incomplètes dans toutes les fiches avec partenaire.** L'application dit seulement « tape (main ou pied) ». Les règlements demandent de taper deux fois ou plus, ou de dire « maitta » [S7]. En ne-waza, l'abandon verbal compte aussi, et le pied ne compte que si les bras sont indisponibles [S26][S27]. L'abandon verbal manque partout, ainsi que le cas où uke ne peut pas taper.

### Moyen (imprécision ou divergence avec une source)
5. **Identité de la fiche `seoi-nage`.** L'identifiant dit « seoi-nage », le nom « Ippon-seoi-nage », et la phase tsukuri reprend la formule Kodokan de *Seoi-nage* (« coude sous l'aisselle »). Le Kodokan et l'IJF distinguent les deux techniques [S1][S4]. Pour Ippon-seoi-nage, l'IJF précise que la main gauche saisit la manche droite par l'intérieur et que la main droite saisit le haut de la manche ou l'épaule [S4]. L'application omet ces saisies. Il faut harmoniser l'identifiant, le nom et les saisies.
6. **`o-soto-gari` : « Les deux mains poussent le partenaire vers son arrière ».** S15 décrit des bras qui tirent et un tori qui tire uke vers lui en entrant. La direction du kuzushi vers l'arrière droit est confirmée [S4][S5]. L'action des mains doit être vérifiée.
7. **`montee` : « Assis sur le ventre » et « hanches lourdes ».** S47 recommande des genoux hauts vers les aisselles, le poids sur le haut de la poitrine, et « Stay off of his hips ». C'est un contexte de self-défense : c'est une variante, pas un règlement. Le crochetage des jambes avec les pieds n'est documenté par aucune source.
8. **`tai-sabaki` : un seul geste sous un nom générique.** S12 décrit 4 tai-sabaki. Le geste de l'application (pivot sur le pied avant, 180°, dos tourné à la direction de départ) correspond à un **mae-mawari-sabaki** [S12]. Il faut renommer la fiche ou montrer les variantes.
9. **`kuzushi` : une seule direction présentée comme « le » kuzushi.** Il existe 8 directions [S12]. Le geste montré est un kuzushi vers l'avant. Il faut le dire. L'expression « main avant (manche) » ne correspond à aucune source : S12 ne parle que de hikite (manche) et de tsurite (revers). La main « avant » dépend de la garde (déduction).
10. **`passage-toreando` : « Rester hors de portée de ses pieds ».** S36 décrit, en garde ouverte, un contrôle de la distance où l'on s'approche très près pour ôter leur force aux jambes. La saisie « au niveau des genoux » n'est pas documentée ; S37 dit seulement « pant legs ».
11. **`pont` : « pieds à plat ».** S42 propose une variante sur l'avant des pieds pour monter plus haut. La consigne « pas de la nuque » est cohérente avec S42. La fiche ne mentionne pas les erreurs de l'upa [S41] ni le blocage du bras et de la jambe du même côté.
12. **`sortie-hanche` : il manque la rotation sur le côté et le décollage des hanches**, ainsi que l'erreur « rester à plat » [S39][S40].
13. **Le groupe Kodokan n'apparaît pas dans les fiches judo** : te-waza, koshi-waza, ashi-waza, osaekomi-waza [S1]. La fiche `o-goshi` renvoie à `uchikomi-seoi` comme préparation, alors qu'o-goshi est un koshi-waza où le bras passe autour de la hanche [S1]. Ce lien de préparation est discutable (déduction).

### Faible (affirmations de l'application non documentées par les sources consultées)
- `ukemi` : « On expire au contact » n'a pas de source. La valeur de 45° est confirmée par S11. La progression de l'application omet l'étape « couché » de S11.
- `o-soto-gari` : « jambe d'appui fléchie », « buste descend vers l'avant ».
- `o-goshi` : « deux pieds à l'intérieur », « hanches plus basses ».
- `seoi-nage` et `uchikomi-seoi` : « genoux fléchis », « pieds parallèles à l'intérieur ». Le texte de l'IJF parle de flexion du coude, pas des genoux [S4][S5].
- `kesa-gatame` : position des jambes, poids, tête. Les vidéos qui pourraient le montrer n'ont pas été visionnées.
- `tsugi-ashi-lateral` et `tsugi-ashi-arriere` : ordre des pieds, « ne se touchent pas ».
- `controle-lateral` : « genoux collés », « poids par la poitrine ». La consigne de l'application « ne pas appuyer sur la gorge ou le visage » est un choix pédagogique de sécurité ; S40 décrit au contraire le crossface et la pression sur le visage. Ce n'est pas une contradiction, mais l'écart est à assumer.
- `cle-de-bras-garde` : « pression lente et progressive ».
- `descente-sol`, `garde-bjj`, `changement-base` : aucune source.

### Points confirmés (pour information)
- O-soto-gari : kuzushi vers l'arrière droit, poids sur le talon droit [S4].
- O-goshi : kuzushi vers l'avant, puis rotation par-dessus la hanche [S4].
- Kesa-gatame : bras droit derrière la nuque et bras gauche qui tient le bras droit d'uke [S1][S4].
- Ukemi : menton et angle de 45° [S11].
- Garde fermée : chevilles croisées, traction des jambes, hanches mobiles [S45].
- Relevé technique : conforme à S38.
- Clé de bras : pouce vers le plafond [S43].
- Tsugi-ashi : sans dépasser l'autre pied [S5][S12].
- Shizen-tai : largeur d'épaules, poids réparti [S12].

---

## E. Exigences minimales pour une animation à deux corps

Objectif : ne pas simplement faire tourner ou tomber un personnage rigide. Chaque point porte sa source ou la mention « déduction ».

### E.1 Exigences communes aux projections
1. **Deux squelettes reliés par des contacts nommés et persistants.** Hikite à la manche et tsurite au revers [S12]. Le contact est maintenu jusqu'à la fin, car l'ippon exige un « contrôle avec maîtrise » [S7]. Les mains doivent rester verrouillées sur le judogi d'uke pendant toute l'animation (déduction).
2. **Trois phases calées sur des événements physiques** [S15] :
   - kuzushi : premier mouvement de tori ;
   - tsukuri : les pieds de tori poussent sur le sol ;
   - kake : les pieds d'uke quittent le sol.
3. **Uke est un corps actif.** Il oppose une légère résistance pendant le kuzushi [S15][S16] ; une réaction mesurée dans l'axe médio-latéral est rapportée pour o-soto-gari [S15].
4. **Déplacement du centre de masse d'uke hors de ses appuis.** La projection de son centre de masse doit sortir de son polygone d'appui dans la direction du kuzushi avant la perte d'appui (déduction, à partir de la notion de déséquilibre [S5]).
5. **Appuis de tori.** Le frottement entre le pied et le tapis fournit le point d'arrêt [S14]. Les pieds de tori ne doivent pas glisser au moment où il charge uke (déduction).
6. **Réception d'uke.** Sur le dos [S7], la tête sans contact avec le tapis [S11][S17], les bras frappant à environ 45° [S11], le menton près de la poitrine [S11].
7. **Interdits à respecter à l'écran** : pas de plongeon tête la première [S7] ; pas de pont d'uke pour éviter le dos [S7] ; pas de genoux de tori au sol en seoi-nage [S21].

### E.2 Exigences par projection
- **O-soto-gari (couple de forces [S14])** :
  - action simultanée du haut du corps d'uke vers l'arrière et du fauchage de sa jambe d'appui vers l'avant ou le haut, ce qui fait pivoter uke autour d'un axe transversal ;
  - « couple » signifie deux forces opposées appliquées en même temps [S14] ;
  - poids d'uke sur le talon droit avant le fauchage [S4] ;
  - contact poitrine contre poitrine pendant le tsukuri [S15] ;
  - la jambe de tori entre en contact pendant le tsukuri, pas seulement au kake [S15] ;
  - chute d'uke vers l'arrière en ushiro-ukemi, avec contrôle de l'occiput [S17] ;
  - interdit : faire basculer uke en bloc autour de ses chevilles sans fauchage synchronisé (déduction).
- **Seoi-nage et Ippon-seoi-nage (levier [S14])** :
  - rotation de 180° des pieds de tori [S15] ;
  - le dos de tori sert de point d'appui, qui descend de la taille vers les genoux [S14] ;
  - le centre de masse d'uke monte légèrement pendant la rotation, puis tombe vers l'avant et le bas, avec un moment cinétique dans l'axe médio-latéral, c'est-à-dire une rotation par-dessus l'épaule [S23] ;
  - quantité de mouvement d'uke vers l'avant maintenue jusqu'au kake [S15] ;
  - bras droit sous l'aisselle droite d'uke et main gauche à sa manche intérieure [S4] ;
  - interdit : téléporter uke sur le dos de tori ; le contact dos contre ventre doit s'établir progressivement (déduction).
- **O-goshi (levier [S14])** : hanche droite entrée profondément sous uke [S4] ; uke décolle (« float him up ») [S4] ; bras droit sous l'aisselle gauche d'uke, tenant sa hanche [S1] ; rotation de tori qui fait passer uke par-dessus la hanche [S4].
- **Ukemi seul** : le corps est courbé et le contact avec le sol se déroule « de la nuque au sacrum » en chute roulée [S11][S12]. La frappe doit précéder ou accompagner le contact du tronc, pour montrer sa fonction de réduction de la vitesse verticale [S18], ce qui demande une animation qui sépare les deux instants (déduction).

### E.3 Positions au sol (BJJ et kesa-gatame)
- **Points de contact au sol** de chaque corps à chaque image : genoux, pieds, mains, dos (déduction). Pour la montée, des genoux hauts et des bras écartés comme appuis selon S47, ou une autre variante, mais une variante choisie et nommée.
- **Kesa-gatame** : les jambes de tori ne sont pas prises par celles d'uke [S7] ; contrôle d'un bras obligatoire [S7] ; saisies conformes à S4.
- **Contrôle latéral** : crossface et blocage de la hanche visibles ; le bras d'uke bloque le biceps du dessus [S40].
- **Sorties montrées** : pont, puis shrimp, puis insertion du genou [S40] ; upa avec blocage du bras et de la jambe du même côté et hanches hautes avant la rotation [S41].
- **Garde fermée** : chevilles croisées, traction des genoux vers la poitrine qui casse la posture [S45].
- **Clé de bras** : pouce d'uke vers le haut, hanches de tori près de son épaule, jambes qui pincent [S43]. Ne jamais animer une hyperextension complète du coude ; montrer l'arrêt à l'abandon (déduction de sécurité).
- **Interdit général** : faire glisser un corps sur le sol sans appui moteur visible (déduction).

---

## F. Limites
- **WebFetch renvoie un résumé produit par un modèle, pas le texte brut.** Les citations reprennent ces extraits. Une relecture humaine des documents originaux est nécessaire avant publication, surtout pour les chiffres de S17, S18 et S21.
- **Aucune vidéo n'a été visionnée** : ni celles du Kodokan, ni les animations 3D de l'IJF, ni celles de Gracie University, de Gracie Barra ou de Grapplearts. Une grande partie de la pédagogie du BJJ consultée ne se trouve qu'en vidéo, d'où de nombreux « non documenté ».
- **Pages inaccessibles** : les PDF du Kodokan (S2, S3), la page FFJDA « Apprendre à chuter » (S10), le Rule Book v6.0 de l'IBJJF (S25 : l'URL de redirection est trop longue pour le proxy ; le téléchargement direct par curl est bloqué) et le document de la JJGF (S49). La version PMC de S18 était bloquée par un captcha ; la version MDPI a été lue, sauf les 2 892 derniers caractères.
- **Le règlement BJJ cité est celui de la JJIF/JJAU** [S26][S27], pas celui de l'IBJJF. Les barèmes et interdits de l'IBJJF peuvent différer.
- **Une partie des sources BJJ vient d'un seul site d'instructeur (Grapplearts)**, et S47 relève d'un contexte de self-défense. Ce ne sont pas des référentiels fédéraux.
- **S48** paraît dans une revue modeste, avec des incohérences internes (unités, tableaux). **S19, S20, S22 et S23** n'ont été lus qu'en résumé.
- **S12** est une traduction catalane d'une circulaire espagnole, et S5 un PDF IJF/Kodokan hébergé par British Judo, sans auteur ni date propres.
- **Le site FFJDA consulté ne contient presque aucun contenu technique.** Aucune fiche technique française officielle détaillée n'a été trouvée.
- **Les définitions Kodokan et IJF décrivent toutes les techniques pour un droitier.**
