# Audit documentaire : kick-boxing et muay-thaï (Combat Shadow Studio)

Date de la recherche : 18 octobre 2026. Périmètre : les techniques `solo` de `techniques.json` dont `disciplines` contient `kickboxing` ou `muaythai`, sauf les coups de poing purs (catégorie `poing`) et les feintes. Cela fait 42 techniques : garde (1), déplacement (7), défense (10), pied (12), genou (4), coude (6), clinch (3).

Conventions :
- [Sx] renvoie au tableau A. Une affirmation sans [Sx] est une **déduction**, et elle est marquée comme telle.
- « ND » veut dire « non documenté par les sources consultées ».
- Les sources en anglais sont traduites en français. Les citations courtes restent dans leur langue d'origine, entre guillemets.
- Les pages ont été lues avec WebFetch, qui renvoie un extrait ou un résumé produit par un modèle. Ce n'est pas une lecture humaine intégrale (voir E).

---

## A. Sources consultées

Types : **R** = règlement · **P** = démonstration pédagogique · **B** = analyse biomécanique · **V** = variante technique · **C** = exécution observée en compétition (aucune source de ce type n'a été trouvée ni lue).

| Id | Organisme ou auteurs | Titre | URL | Type | Ce qui a été réellement lu | Accès |
|---|---|---|---|---|---|---|
| S1 | Gavagan C.J., Sayers M.G.L. (Univ. Sunshine Coast), *PLoS ONE* 2017;12(8):e0182645 | A biomechanical analysis of the roundhouse kicking technique of expert practitioners: Muay Thai, Karate, Taekwondo | https://pmc.ncbi.nlm.nih.gov/articles/PMC5571909 | B | Texte intégral PMC : méthodes, résultats (angles, vitesses, phases), passages de la discussion | Lu |
| S2 | Vagner M., Cleather D.J., Olah V., Vacek J., Stastny P., *Sports* 2023, 11, 141 | A Systematic Review of Dynamic Forces and Kinematic Indicators of Front and Roundhouse Kicks… | https://research.stmarys.ac.uk/id/eprint/6037/1/A%20Systematic%20Review%20of%20Dynamic%20Forces%20and%20Kinematic%20Indicators%20of%20Front%20and%20Roundhouse%20Kicks%20across%20Varied%20Conditions%20and%20Participant%20Experience.pdf | B | PDF : introduction, discussion, limites | Lu |
| S3 | Corcoran D., Climstein M., Whitting J., Del Vecchio L., *Sports* 2024, 12(3), 74 | Impact Force and Velocities for Kicking Strikes in Combat Sports: A Literature Review | https://www.mdpi.com/2075-4663/12/3/74 | B | Texte en ligne : classification throw/push, plages de vitesse et de force, nombre d'études par discipline | Lu |
| S4 | Sabri Razm S. et al., *Healthcare* (MDPI) 2026, 14, 430 | Mechanical Efficiency and Injury Risk in Leg Kicks Across Combat Sports: A Narrative Review… | https://art.torvergata.it/retrieve/81fa7483-0812-434a-abf5-77d9e1668872/Razm%20et%20al_Healthcare%20%282026%29.pdf | B | PDF : passages sur la surface de frappe, les blessures, la jambe d'appui, les limites | Lu |
| S5 | Chang W.-G., Lin K.-Y., Chu M.-Y., Chow T.-H., *J Sports Sci Med* 2021, 20(3):457-465 | Differences in Pivot Leg Kinematics and Electromyography Activation in Various Round House Kicking Heights | https://www.jssm.org/jssm-20-457.xml-Fulltext | B (taekwondo) | Texte intégral : intro, résultats sur le genou, discussion, conclusion. Tableaux 2 et 3 non récupérés | Lu (partiel) |
| S6 | Wang Y.-X., Kuo S.-Y., Wang L.-H., Cheng K.B., ISBS 2011 (Porto) | Kinematic Analysis of the Supporting Leg Between Different Weight Divisions in the Roundhouse Kick of Taekwondo | https://ojs.ub.uni-konstanz.de/cpa/article/view/4863/4503 | B (taekwondo, n = 4) | Actes de conférence, texte complet | Lu |
| S7 | Riansoi Y. et al., *J Sports Sci Technol* 2019, 19(2):72-81 | Mechanical Analysis of Supporting Leg During Roundhouse Kick in Muay Thai Beginners | https://he01.tci-thaijo.org/index.php/JSST/article/view/215734 | B | Résumé seulement | Lu (résumé) |
| S8 | Grymanowski J. et al., *Ido Movement for Culture* 2019, XIX(1S) | Analysis of time-space parameters of the front kick using the example of an athlete training in Muay Thai | https://imcjournal.com/index.php/en/volume-xix-2019/contents-number-1s/1463-abstract-analysis-of-time-space-parameters-of-the-front-kick-using-the-example-of-an-athlete-training-in-muay-thai | B (n = 1) | Résumé seulement | Lu (résumé) |
| S9 | *Journal of Human Kinetics* (titre d'après le résultat de recherche, auteurs non affichés sur la page lue) | Differences in Velocities of Crucial Body Segments while Executing Roundhouse Kicks | https://jhk.termedia.pl/Differences-in-Velocities-of-Crucial-Body-Segments-while-Executing-Roundhouse-Kicks,159451,0,2.html | B (taekwon-do ITF) | Page partielle : participants, vitesses, séquence segmentaire | Lu (partiel) |
| S10 | IFMA | IFMA Rules and Regulations V2.01 (2020) | https://muaythai.sport/wp-content/uploads/2020/08/IFMA-Rules-and-Regulations-V2.01.pdf | R | Art. 10 (équipements), 18.3, 20 (scoring), 22 (fautes), lus en deux passes | Lu |
| S11 | IFMA | IFMA Rules and Regulations v3.057 (mai 2026) | https://muaythai.sport/wp-content/uploads/2026/05/IFMA-Rules-and-Regulations-v3.057_110526.pdf | R | Table des matières et définitions (1.5.x, 1.6.5) seulement. Le texte des articles 29 et 31 n'a pas été extrait | Partiel (téléchargement direct bloqué par le proxy) |
| S12 | IFMA | Scoring 101 | https://muaythai.sport/scoring-101 | R | Page entière | Lu |
| S13 | IFMA | A Coach and Manager's Guide | https://muaythai.sport/muaythai-rules/a-coach-and-managers-guide/ | R | Page entière | Lu |
| S14 | WMC (World Muaythai Council) | WMC Rules & Regulations 2020 | https://wmc.muaythai.sport/wp-content/uploads/2020/04/WMC-Rules-Regulations-2020.pdf | R | Art. 14 (scoring) et 15 (fautes) | Lu |
| S15 | WAKO Deutschland e.V. | Regelwerk für Ringsportarten – Low Kick, Version 2021/V1 | https://www.wako-deutschland.de/wp-content/uploads/2022/06/Ringsport_Lowkick.pdf | R | Sections 1, 5.3, 6.1, 6.2, 7 | Lu |
| S16 | WAKO | WAKO Rules Change – K1 Style (non daté, mis en ligne en 2026) | https://kickboxingeurope.com/wp-content/uploads/2026/04/Changes-of-rules-K1-Style.pdf | R | Document complet (3 p.) | Lu |
| S17 | WAKO (R. Desa, directeur technique) | New WAKO Rules (proposition, juin 2020) | https://wako.sport/_files/ugd/6445bf_4f72130bbc01422180f5d3639bfcad66.pdf | R | Titres du chapitre Low kick seulement (sans texte) et une phrase K1 sur le balayage | Lu (peu exploitable) |
| S18 | WAKO India | Kickboxing Technical Book (brochure) | https://www.wakoindia.org/wp-content/uploads/2024/06/KICKBOXING-TECHNICAL-BOOK.pdf | R | Brochure : organisation et règles, sans aucune technique | Lu (sans contenu technique) |
| S19 | FFKMDA | Glossaire technique Kickboxing 2025 | https://www.ffkmda.com/wp-content/uploads/2025/09/GLOSSAIRE-TECHNIQUE-KICKBOXING-2025.pdf | P | Définitions : pivot, roundhouse, front kick, genoux, esquives, parades, surfaces de frappe. Lu en deux passes. Une passe a daté le contenu de « juillet 2024 » : version à vérifier | Lu |
| S20 | FFKMDA | Fiche de contenus d'apprentissage par niveau – Grades (Low kick / Kick light) | https://www.ffkmda.com/wp-content/uploads/2025/09/contenus_grades_low-kick_kick-light.pdf | P | Contenus par gant (du blanc au bronze) | Lu |
| S21 | FFKMDA | Référentiel des techniques et des grades – Muaythai (sept. 2022), 1er Khan | https://claco-ffkmda.univ-lyon1.fr/clarolinepdfplayerbundle/pdf/9951 | P | Liste des techniques du 1er Khan, avec noms thaïs et définitions courtes. Khan 2 et 3 absents | Lu |
| S22 | FFKMDA | Référentiel des grades – Mitaines (Pancrace) | https://claco-ffkmda.univ-lyon1.fr/clarolinepdfplayerbundle/pdf/9953 | P | Lu, mais hors périmètre (pancrace). Non utilisé | Lu (non utilisé) |
| S23 | J. Garner, muaythai.com | Muay Thai Stance: Explained | https://muaythai.com/?p=627 | P | Article entier | Lu |
| S24 | J. Garner, muaythai.com | Teep Kick – Thai Push Kick | https://muaythai.com/?p=235 | P | Article entier | Lu |
| S25 | T. Wheaton, muaythai.com (étapes attribuées à Sam-A Gaiyanghadao et Liam Harrison) | Muay Thai Low Kicks: A Guide From the Experts | https://muaythai.com/?p=3451 | P | Article entier | Lu |
| S26 | T. Wheaton, muaythai.com (Nong-O Gaiyanghadao, L. Harrison) | Muay Thai Switch Kick | https://muaythai.com/?p=1256 | V | Article entier | Lu |
| S27 | B. Bradshaw, muaythai.com | Muay Thai Elbows: Everything You Need To Know | https://muaythai.com/?p=36 | P | Article entier | Lu |
| S28 | Evolve MMA (Evolve Daily) | Muay Thai 101: The Roundhouse Kick | https://evolve-mma.com/blog/muay-thai-101-the-roundhouse-kick/ | P | Article entier | Lu |
| S29 | « chaowalit », Evolve MMA | Mastering The Teep | https://evolve-mma.com/blog/mastering-the-teep-how-to-use-muay-thais-push-kick-to-control-distance/ | P | Article entier | Lu |
| S30 | Evolve MMA | 10 Essential Muay Thai Defense Techniques To Master | https://evolve-mma.com/blog/10-essential-muay-thai-defense-techniques-to-master/ | P | Article entier | Lu |
| S31 | « chaowalit », Evolve MMA | How To Check Kicks In Muay Thai | https://evolve-mma.com/blog/how-to-check-kicks-in-muay-thai | P | Article entier | Lu |
| S32 | « chaowalit », Evolve MMA | The Ultimate Guide To The Muay Thai Clinch | https://evolve-mma.com/blog/the-ultimate-guide-to-the-muay-thai-clinch/ | P | Article entier | Lu |
| S33 | Evolve MMA (2022) | 10 Muay Thai Elbow Techniques To Add To Your Arsenal | https://evolve-mma.com/blog/10-muay-thai-elbow-techniques-to-add-to-your-arsenal/ | P | Article entier | Lu |
| S34 | Evolve MMA | The Art Of The Switch Kick | https://evolve-mma.com/blog/the-art-of-the-switch-kick-how-to-generate-maximum-power-and-speed/ | V | Article entier | Lu |
| S35 | Evolve University (2021, sans auteur) | The Ultimate Guide To Muay Thai Knees | https://evolve-university.com/blog/the-ultimate-guide-to-muay-thai-knees/ | P | Article entier | Lu |
| S36 | Evolve University (sans auteur) | The Complete Guide To The Muay Thai Push Kick | https://evolve-university.com/blog/the-complete-guide-to-the-muay-thai-push-kick/ | P | Article entier | Lu |
| S37 | Evolve University (2021, sans auteur) | The Ultimate Guide To Muay Thai Low Kicks | https://evolve-university.com/blog/the-ultimate-guide-to-muay-thai-low-kicks/ | P | Article entier | Lu |
| S38 | Evolve University (2021, sans auteur) | A Beginner's Guide To Footwork And Guards In Muay Thai | https://evolve-university.com/blog/a-beginners-guide-to-footwork-and-guards-in-muay-thai/ | P | Article entier | Lu |
| S39 | E.C. Stevens, Breaking Muscle (2012, mis à jour en 2021) | Swinging the Bat: How to Do the Muay Thai Roundhouse Kick | https://breakingmuscle.com/swinging-the-bat-how-to-do-the-muay-thai-roundhouse-kick/ | P | Article entier. L'auteur est entraîneur de boxe anglaise ; la page ne lui attribue aucune qualification en muay-thaï | Lu |
| S40 | Fairtex Store (2026) | How to throw a Thai roundhouse kick | https://fairtexstore.com/en-nl/blogs/news/how-to-throw-a-thai-roundhouse-kick-breaking-down-the-technique | P | Article entier | Lu |
| S41 | Fairtex Team (déc. 2025) | Muay Thai vs Kickboxing | https://www.fairtex.com/blogs/news/muay-thai-vs-kickboxing | V | Article entier | Lu |
| S42 | R. Pilares, Muay Thai Guy | Essential Guide to Basic Muay Thai Footwork | https://www.muay-thai-guy.com/blog/essential-guide-to-basic-muay-thai-footwork | P | Article entier | Lu |
| S43 | S. von Duuglas-Ittu, 8limbsus.com | Sylvie's Tips: Working On Your Teeps | https://8limbsus.com/muay-thai-thailand/sylvies-tips-working-on-your-teeps | P | Texte de l'article (la vidéo intégrée n'a pas été visionnée) | Lu |
| S44 | S. von Duuglas-Ittu (consignes du coach Taywin), 8limbsus.com, 2013 | Learning the Wide, High-Arced Knee on the Bag | https://8limbsus.com/?p=3698 | P | Texte de l'article (la vidéo intégrée n'a pas été visionnée) | Lu |
| — | (PMC) | Article PMC 10170541 | https://pmc.ncbi.nlm.nih.gov/articles/10170541 | — | Rien : la page a renvoyé un écran reCAPTCHA | **Inaccessible** |
| — | muaythai.sport | Page d'accueil IFMA | https://muaythai.sport/ | — | Liste des liens seulement (navigation) | Lu (navigation) |
| — | muaythai.sport | Muaythai Rules (page d'index) | https://muaythai.sport/about-muaythai/muaythai-rules/ | — | Liens vers les PDF seulement | Lu (navigation) |

---

## B. Références vidéo repérées (NON visionnées)

Aucune de ces vidéos n'a été regardée. Elles ne fondent aucune affirmation de ce rapport.

| Titre (tel qu'affiché) | URL | Où elle a été repérée |
|---|---|---|
| Vidéo « Sylvie's Tips… working on your teep » (légende, pas de titre formel) | https://www.youtube.com/embed/BMQ4xAVKICU | Intégrée dans S43. Référence vidéo repérée, NON visionnée |
| Vidéo sans titre sur le genou large (coach Taywin) | https://www.youtube.com/watch?v=0WC4AQbRd6k | Intégrée dans S44. Référence vidéo repérée, NON visionnée |
| Vidéo recommandée pour imiter les genoux (sans titre) | http://youtu.be/wIhpsoB-CFE | Lien dans S44. Référence vidéo repérée, NON visionnée |
| Muay Thai Tricks using the Teep in Sparring / Fighting Tutorial | https://yt.dorper.me/v/yt/eqH-ugZqyzw (miroir de YouTube) | Résultat de recherche. Référence vidéo repérée, NON visionnée |
| Naked Muay Thai 6: Straight Knees & The Push Kick! | https://vimeo.com/163043397 | Résultat de recherche. Référence vidéo repérée, NON visionnée |
| Video: 4 Push Kick Combinations For Muay Thai (Evolve University) | https://evolve-university.com/library/muay-thai/intermediate/video-4-push-kick-combinations-for-muay-thai/ | Résultat de recherche. Référence vidéo repérée, NON visionnée |
| The 6 Muay Thai Elbows You Need To Know (Videos) | https://evolve-mma.com/blog/the-6-muay-thai-elbows-you-need-to-know-videos/ | Lien dans S33. Page non ouverte. Référence vidéo repérée, NON visionnée |

---

## C. Fiches par technique

Rubriques : position initiale · appuis et pivot · transfert du poids · bassin et tronc · bras · trajectoire et surface · articulations · phases · contact · retour · erreurs · sécurité · différences KB/MT.

### C.0 Données transversales (valables pour plusieurs fiches)

- **Ce qui marque en muay-thaï** : une technique (poing, pied, genou, coude) « applied with force and intent to cause effect » qui touche une cible sans être bloquée. La cible est tout le corps sauf l'aine [S10 art. 20.1–20.1.1 ; S12 ; S13]. Une frappe sur les gants, les avant-bras, le pied ou le tibia ne marque pas [S10 art. 20.1.2]. Au WMC, une frappe « light, without power or body weight behind it » ne marque pas [S14 art. 14.3.3]. Une meilleure défense est un critère de décision [S14 art. 14.2.5].
- **Équipement IFMA** : casque, protège-tibias et protège-coudes obligatoires [S10 art. 10.3]. Protège-dents [S10 art. 10.5] et coquille [S10 art. 10.7] obligatoires.
- **Restrictions par âge (IFMA)** : en Youth 12-13 ans, « No elbow or knee strikes to the head » ; en Youth 10-11 ans, « No strikes to the head » [S10 art. 22.3, tableau en partie illisible].
- **Kick-boxing WAKO, Low kick** : les genoux et les coudes sont interdits [S15 §7]. Cuisses autorisées (intérieur, extérieur, arrière), mais « gegen Unterschenkel » (bas de jambe) interdit [S15 §5.3, §7]. Saisir la jambe est interdit [S15 §7].
- **Kick-boxing WAKO, K1** : genoux autorisés, mais « Clinch or holding is not permitted at any time » [S16 art. 4.3]. Coudes interdits [S16 art. 5]. Kicks et genoux autorisés sur toute la jambe, articulations comprises [S16 art. 1]. Front kick et side kick sur l'avant de la cuisse, du genou ou du tibia interdits [S16 art. 5]. Balayage seulement au niveau de la cheville [S16 art. 4.4].
- **Kick-boxing, full contact (règles amateur de l'Ontario)** : coups de pied sous la ceinture interdits, genoux, coudes et clinch interdits, coup de pied poussé vers les jambes interdit ; cibles : avant et côtés de la tête et du corps, pieds pour le balayage [S45 3.1, 4.1.1, 5.1.1, 7.1.1, 7.1.4]. Le même texte décrit le low kick (cuisse au moins 3 cm au-dessus du genou [S45 4.2]) et le K1 (genoux au corps et aux jambes, à la tête en senior [S45 3.3.3, 3.3.4] ; clinch permis [S45 7.1.7], ce qui contredit la WAKO [S16 art. 4.3]).
- **Séquence proximo-distale** : le front kick et le roundhouse kick sont des mouvements proximo-distaux [S2]. Le roundhouse est un kick « throw-style » (flexion de hanche, puis extension rapide du genou). Le front kick est « push-style », au mouvement plus synchrone [S3].
- **Peu d'études sur le muay-thaï et le kick-boxing** : dans la revue S3, on compte 69 études en taekwondo, 12 en karaté, 3 en muay-thaï et 2 en kick-boxing [S3]. S4 juge le muay-thaï sous-représenté [S4].

### C.1 `garde` — Position de garde

- **Position initiale** : en muay-thaï, pieds « just wider than your shoulder distance », pied avant « pointing forward with a slight angle away from the body » [S23]. Pieds à la largeur des épaules, « pointing slightly outwards » [S28]. Pieds à 45° « also seen in Western Boxing », buste plus droit qu'en boxe [S39].
- **Bassin** : hanches « square on » face à l'adversaire, et non de profil (« bladed ») comme en boxe anglaise [S23]. Même consigne dans S38 : « keep both your hips facing forwards ».
- **Poids** : les sources divergent. S23 : « evenly distributed » entre les deux pieds. S39 : davantage de poids sur la jambe arrière. S41 : « taller stance with weight slightly back to load the teep ». Aucune valeur chiffrée.
- **Talon arrière** : le pied arrière porte le poids sur la plante (« ball of the foot ») [S23]. Les deux pieds sur la plante [S39]. Que le talon soit décollé, S23 ne le dit pas explicitement (**déduction**).
- **Mains** : pouces des gants au niveau des sourcils, paumes face à face [S23]. Mains devant le visage à hauteur des yeux, menton derrière [S38]. S38 décrit aussi une garde longue (mains tendues, la main avant plus loin) [S38].
- **Coudes** : près du corps, pour absorber les kicks [S23].
- **Erreurs** : bras tendus, paumes vers l'avant, coudes écartés [S23]. Poids trop en avant, qui expose aux low kicks ; poids trop en arrière, qui expose au teep [S23]. Hanches de profil, mains qui tombent [S38].
- **Différences KB/MT** : le kick-boxing « Dutch-style » préfère une garde plus neutre, proche de la boxe [S41]. Certains combattants adoptent une garde plus de profil, garde basse, jambes plus larges, sous l'influence de la boxe et du kick-boxing [S23]. Le glossaire FFKMDA ne définit pas la garde [S19]. Le référentiel muaythai la nomme seulement (« Kat Muay ») [S21].
- **Sécurité** : ND.

### C.2 Déplacements : `pas-avant`, `pas-arriere`, `pas-gauche`, `pas-droite`

- **Règle du premier pied** : pour avancer, le pied avant part d'abord ; pour reculer, le pied arrière ; pour aller à gauche, le pied gauche ; pour aller à droite, le pied droit [S42]. Même principe dans S38 : on part avec la jambe du côté où l'on va, puis la jambe arrière suit en glissant (« shuffle »).
- **Pieds croisés** : « Don't cross your feet… vulnerable to attacks » [S38].
- **Distance** : le pied qui suit « match it », c'est-à-dire reprend l'écart [S42]. Longueur du pas : ND.
- **Équilibre** : l'équilibre est une composante principale du jeu de jambes [S42]. Le gant blanc FFKMDA demande de « rester équilibré lors de mes déplacements » [S20].
- **Spécifique au muay-thaï** : *Yaang Saam Koum*, déplacement sur trois pas alternés [S21]. Ne jamais rester immobile, lever les pieds en alternance et changer de garde un pas sur trois en avançant [S38]. *Sueb Tao* (pas chassé), *Ten* (« Transfert du poids de corps d'un appui sur l'autre ») [S21].
- **Retrait d'appui** (kick-boxing) : « déplacement d'un appui vers l'arrière pour éviter une attaque engagée » [S19].
- **Bras, tronc, sécurité** : ND (en dehors de garder les mains hautes [S38]).

### C.3 Pivots et angle : `pivot-droite`, `pivot-gauche`, `sortie-angle`

- **Définition** : le pivot est un « déplacement d'un appui autour d'un axe constitué par l'appui opposé » [S19].
- **Variantes en muay-thaï** : *Kao Chaak*, déplacement par pivot d'un appui en arrière ou latéralement [S21]. *Piyen Liém Kat*, déplacement avec changement de garde [S21].
- **Sortie d'angle** : le **décalage** (esquive partielle) déplace un appui hors de l'axe de l'attaque, en interne ou en externe selon la garde adverse [S19]. Le **débordement** (esquive totale) déplace les deux appuis sur le côté pour sortir de l'axe d'opposition directe [S19]. Le **changement de garde** déplace les deux appuis, par exemple contre une attaque circulaire [S19].
- **Partie du pied sur laquelle on pivote, angle, fin du pivot face à la cible** : ND.

### C.4 Esquives et roll : `esquive-droite`, `esquive-gauche`, `roll-droite`, `roll-gauche`, `retrait`

- **Définition de l'esquive** : « action défensive visant à soustraire de la trajectoire de l'attaque adverse la cible visée » [S19].
- **Esquive rotative** (roll) : passer la tête sous l'attaque par une action rotative du haut du corps, en fléchissant plus ou moins les genoux. **Interdit d'engager la tête vers l'avant** [S19].
- **Retrait** : « Esquives par retrait du buste, de la tête ou des membres inférieurs » [S19]. En muay-thaï, contre un high kick : reculer la jambe arrière d'un demi-pas si on en a le temps, pencher le buste en arrière en mettant le poids sur la jambe arrière, sans se perdre l'équilibre ni s'emmêler les pieds [S30].
- **Programme muaythai** : *Yok toa lop* et *Lom tchak* figurent dans les défenses (*Bang*) du 1er Khan [S21]. Leur définition n'a pas été extraite (ND).
- **Ce qui marque** : une frappe esquivée ne marque pas (**déduction** de S10 art. 20.1).
- **Amplitude, direction exacte du regard, rôle des genoux pour l'esquive latérale** : ND en kick-boxing et en muay-thaï. Ces gestes viennent surtout de la boxe, hors périmètre.

### C.5 Blocages des bras : `blocage-haut`, `blocage-corps-avant`, `parade`

- **Parade (définition)** : « action défensive visant à protéger les cibles visées » ; il y a trois types : bloquées, chassées et de protection [S19]. Parade bloquée : « projeter une partie de son corps sur le coup adverse », avec le gant, le poignet, l'avant-bras ou le tibia [S19].
- **Couverture haute (muay-thaï)** : paumes sur le visage, articulations des doigts contre le front [S38].
- **Parade chassée (muay-thaï)** : avec le bras du même côté que le coup reçu (main gauche contre un droit), la plus petite possible pour ne pas découvrir le visage [S30]. **Note** : l'application fait parer le jab par la « main arrière ». Pour un adversaire en garde orthodoxe, la consigne de S30 revient aussi à la main arrière contre le jab (**déduction** à vérifier selon la garde).
- **Règlement** : les coups « effectively blocked by the opponent's forearms/gloves » ne marquent pas [S10 art. 20.2.2]. Au WMC, la défense est un critère de décision [S14 art. 14.2.5].
- **Coude contre les côtes, rotation du buste pour le blocage au corps** : ND. S23 dit seulement de garder les coudes près du corps pour que les bras absorbent les kicks.

### C.6 `check-avant` — Check (blocage tibia)

- **Nom** : *Bang Tei*, « parade bloquée de la jambe avant ou arrière, oblique, niveaux médian et bas » [S21]. « Parade tibiale » [S19].
- **Jambe** : la jambe avant contre le low kick [S31].
- **Orientation du tibia** : les sources divergent. S31 : « Do not raise the leg straight upward; instead, angle the shin outward slightly ». Contre un low kick, le tibia s'incline vers le bas. S38 : tibia « vertical and perpendicular to the floor », pied fléchi. S21 : « oblique ».
- **Bassin** : tourner légèrement la hanche pour que le tibia rencontre le kick sous un angle solide, ce qui « distributes the impact and prevents your leg from folding backward » [S31].
- **Zone de contact** : le haut du tibia ou le genou [S31].
- **Poids** : basculer le poids sur la jambe arrière en levant la jambe [S30]. Partir d'un poids réparti et rester léger pour lever l'une ou l'autre jambe [S31].
- **Bras** : sortir le coude vers la jambe levée, pour se protéger si le kick monte [S30]. Garder la garde haute [S31].
- **Retour** : reposer la jambe vite, « Never leave it hanging ». On peut riposter avec un direct droit ou un low kick intérieur [S31].
- **Erreurs** : checker trop tard, pas assez tourner la hanche, se pencher en arrière, baisser les mains [S31]. Un mauvais angle permet à l'adversaire de traverser le check et de balayer [S30].
- **Règlement et sécurité** : un coup bloqué avec le tibia ne marque pas [S10 art. 20.2.2]. Un low kick bloqué peut causer un traumatisme du tibia ou des métatarses [S4].
- **Différences KB/MT** : le check figure dans le programme muaythai [S21]. Dans les contenus de grades low kick FFKMDA, aucun « blocage tibia » n'est nommé ; on y trouve des parades « avec les 4 segments » [S20]. Le glossaire FFKMDA inclut le tibia [S19].

### C.7 `check-arriere` — Check jambe arrière

- Parade bloquée possible avec la jambe arrière [S21].
- Contre un body kick, il faut lever la jambe plus haut, sans précision de jambe [S31].
- **Tout le reste** (appuis, poids, angle) : ND pour la jambe arrière.

### C.8 Front kick : `front-kick-avant`, `front-kick-arriere` (disciplines dans l'app : kickboxing, mma)

- **Définition** : « coup de pied direct de face vers l'avant (percuté ou poussé) ». Il est déclenché par la flexion de la cuisse, puis l'extension de la jambe [S19].
- **Surface de frappe** : « la pointe du pied (bol), le dessous du pied ou le dessous du talon » [S19].
- **Biomécanique** : mouvement proximo-distal [S2]. Il s'exécute surtout par la hanche dans le plan sagittal, et la vitesse du pied dépend largement de celle du genou [S2]. Kick « push-style », au mouvement plus synchrone [S3]. Vitesses publiées toutes disciplines confondues : 5,2 à 16,7 m/s [S3].
- **Kick dans le vide ou sur cible** : chez un pratiquant de muay-thaï, le kick dans le vide est le plus souvent plus rapide que le kick sur cible (n = 1) [S8]. Même tendance pour le front kick chez les sous-élites [S2].
- **Grades** : front kick jambe avant et arrière dès le gant blanc [S20].
- **Phases** : on distingue en général une pré-phase, une phase d'attaque et une phase de retour [S2].
- **Bras, tronc, pied d'appui, retour par le même chemin, orteils relevés** : ND pour le kick-boxing. Pour le muay-thaï, voir le teep ci-dessous.

### C.9 Teep : `teep-avant`, `teep-arriere`

- **Nom et rôle** : *Tip*, « les techniques de pieds pour pousser et repousser l'adversaire ». Variantes : *Tip Trong* (frontal), *Tip Kang* (latéral), *Tip Thop* (avec l'intérieur du pied), etc. [S21].
- **Armé** : lever la jambe en fléchissant le genou [S24]. « Lift your knee up high » [S36]. Genou à environ 90° [S29] : c'est la seule valeur donnée, et elle vient d'un blog.
- **Hanche** : « Drive forward with the hips » [S24]. Pousser les hanches vers l'avant pendant l'extension [S29]. Apprendre à teeper « with the hip instead of kicking the leg out » [S43].
- **Surface** : la plante avant du pied (« ball of the foot ») [S24 ; S36]. Pour un teep de pleine puissance, pied tourné à l'horizontale, avec une partie du talon [S43].
- **Pied d'appui** : poids sur le pied arrière pour le teep avant [S24]. Tendre la jambe d'appui [S36]. Pivoter légèrement le pied d'appui [S29]. Petit saut vers l'avant sur la jambe d'appui pour un teep puissant [S43]. Talon d'appui qui se lève : ND en tant que tel.
- **Tronc** : se pencher davantage en arrière pour un teep au visage [S24]. Garder la poitrine en arrière pour ne pas être emporté vers l'avant [S36]. Légère inclinaison du buste en arrière. Attention : se pencher en arrière sur chaque teep signale qu'on pousse trop avec la jambe et pas assez avec la hanche [S43].
- **Bras** : la main avant descend (équilibre et puissance), la main arrière reste haute [S24]. Le bras du côté du kick descend, le bras opposé protège le visage [S29 ; S36].
- **Extension** : « Fully extend the leg » au contact [S24].
- **Retour** : revenir vite en garde [S29 ; S36].
- **Avant ou arrière** : le teep avant est plus rapide, sert de « jab » à longue distance et à mesurer la distance [S24 ; S29 ; S36]. Le teep arrière est plus puissant mais plus lent, donc plus facile à contrer [S24 ; S29].
- **Erreurs** : trop s'engager, manque d'équilibre, retour lent (on se fait attraper la jambe), annoncer le coup [S29]. Faire un pas avec le pied arrière avant un teep jambe avant annonce le coup [S36].
- **Biomécanique** : aucune étude propre au teep n'a été lue. S8 porte sur un « front kick » en muay-thaï (n = 1, résumé seulement).
- **Sécurité** : ND (en dehors du risque de se faire saisir la jambe [S29]).

### C.10 Low kick : `low-kick-arriere`, `low-kick-avant`

- **Position et pas** : « stepping diagonally forward and out with your front leg » [S25].
- **Pivot** : genou fléchi, pivot sur le pied avant [S25 ; S37]. Direction du talon : ND propre au low kick (voir C.11).
- **Bassin et tronc** : tourner les hanches et les épaules vers la frappe [S25 ; S37]. Descendre légèrement et sortir la tête de l'axe pendant le kick [S25].
- **Bras** : le bras arrière balance vers l'arrière pendant que la jambe arrière part [S25 ; S37].
- **Trajectoire** : comme une hache, le tibia descend sur la cuisse, sans grand swing horizontal façon « batte de baseball » [S25 ; S37]. Ne pas traverser complètement, car c'est trop lent [S25, L. Harrison]. Viser avec le genou légèrement au-delà de la cible, jambe légèrement fléchie [S25 ; S37].
- **Surface** : le milieu du tibia, partie dure, le « sweet spot ». Toucher trop bas, près du pied ou du cou-de-pied, fait plus mal au frappeur [S37].
- **Cibles et règlement** : en WAKO Low kick, cuisses intérieur, extérieur et arrière, entre le genou et la hanche ; bas de jambe interdit [S15 §5.3, §7]. En WAKO K1, toute la jambe, articulations comprises [S16 art. 1]. En muay-thaï IFMA, tout le corps sauf l'aine [S10]. S37 cite aussi le mollet et l'intérieur de la cuisse.
- **Low kick jambe avant / intérieur de cuisse** : technique non décrite par les sources lues. Seuls la cible (cuisse intérieure, autorisée en WAKO LK [S15]) et l'usage en riposte après un check [S31] sont documentés.
- **Retour** : revenir en garde, défense serrée [S25 ; S37].
- **Erreurs** : annoncer le kick, faible rotation de hanche, mauvais équilibre (on s'expose aux balayages), mauvais placement du pied, trop s'engager [S25]. Frapper comme un coup de pied de football [S37].
- **Sécurité** : mal exécuté, le low kick « can lead to a broken leg » [S25]. Les disciplines qui frappent au tibia (muay-thaï, kick-boxing) présentent plus de blessures de stress tibial [S4].
- **Différences KB/MT** : en kick-boxing, des low kicks « quicker… with less tell as part of a combo » [S41].

### C.11 Middle kick : `middle-kick-arriere`, `middle-kick-avant`

- **Nom** : *Tei Chiyang*, circulaire niveau médian [S21].
- **Position** : pieds à la largeur des épaules, légèrement ouverts. Sortir le pied d'appui à 45° pour garder l'équilibre [S28]. Pas avant à 45°, ou pas sauté pour plus de puissance, mais chaque pas laisse à l'adversaire le temps de réagir [S39]. Petit pas hors de la ligne centrale [S40].
- **Pied d'appui et direction du talon** : monter sur la plante du pied d'appui et y rester [S28]. « As you pivot the lead foot, that heel rotates towards your opponent » [S39]. « pivot your heel outward » [S40]. Les deux formulations peuvent décrire le même geste (talon qui sort de la ligne et se dirige vers l'avant) : c'est une **déduction**, non confirmée. Aucun angle de pivot n'est publié pour le muay-thaï.
- **Bassin** : pousser la hanche vers l'avant en la tournant [S28 ; S40]. La hanche droite passe entièrement par-dessus la gauche [S39]. Mesures (pratiquants experts, kick à hauteur de tête) : rotation axiale du bassin de 92° (ET 23) en muay-thaï, contre 114° en karaté et 122° en taekwondo. Vitesse maximale de rotation du bassin de 493 (ET 206) °/s en muay-thaï [S1].
- **Tronc** : « Leaning backward takes power away from your hip drive and leaves you off-balance » [S40]. En taekwondo, le corps tend à se pencher en arrière quand la hauteur du kick augmente (Kim et al. 2010, cité par S5 et non lu directement). Inclinaison du tronc en muay-thaï : non mesurée par S1.
- **Bras** : le bras du côté du kick descend en fouettant [S28 ; S40]. S39 précise que c'est optionnel et risqué : la main opposée reste près du menton [S39 ; S40]. En taekwon-do ITF, la séquence « starts with the hands, then the hips and the knee » [S9].
- **Articulations** : genou fléchi à 43° (ET 7) à l'impact en muay-thaï, contre 15 à 16° en karaté et en taekwondo. Extension du genou plus lente (−706 °/s) [S1]. À l'impact, abduction de hanche de 53° et flexion de hanche de 25° [S1]. Côté pédagogie, S39 veut une jambe « straight, for the most part » et S40 « a slight bend ». S1 mesure, lui, une flexion nette.
- **Trajectoire et surface** : en muay-thaï, kick qui « angle the shin down during impact » [S1]. Zone de contact définie du dos du pied au milieu du tibia [S1]. Partie basse à moyenne du tibia, pas le pied ni la cheville [S40]. Tibia bas pour le switch kick [S26]. *Tei Krueng Kheng / Krueng Khao* frappe avec le genou et le tibia [S21].
- **Phases (S1)** : préparation 6 %, armé 14 %, extension 11 %, retour (recoil) 69 % du temps d'exécution. Durée totale de 1,02 s (ET 0,15) en muay-thaï. Le muay-thaï déplace davantage le centre de masse verticalement [S1].
- **Contact et suite** : le poids du corps « follow through the target rather than stopping at the surface » [S40]. À l'inverse, S28 et S39 demandent de ramener la jambe « the same way you came in… quickly ».
- **Erreurs** : oublier de revenir en garde, prendre un appui trop étroit [S28]. Laisser traîner la jambe, trop s'engager (on s'expose à la projection), annoncer le coup par un pas [S39]. Fouetter depuis le genou « like a karate kick », baisser la main opposée [S40].
- **Middle jambe avant (switch)** : petit saut pour passer la jambe arrière devant, appui étroit, pivot sur la plante du nouveau pied avant [S26]. Le changement est fait en glissant (« slide ») [S34]. Erreurs : changement trop long ou trop large, pied arrière qui reste orienté vers l'avant [S26]. Pas tourner dans le kick, mauvais équilibre [S34].
- **Sécurité** : une rotation du pied d'appui augmente les contraintes de rotation sur le genou et le tibia de la jambe d'appui [S4]. Un body kick qui touche marque pour le tireur ; attraper le kick ne marque pas en soi [S12]. Une jambe attrapée suivie d'une projection ne marque pas [S14 art. 14.3.4]. Tenir la jambe en poussant plus de deux pas est une faute [S10 art. 22.2 ; S14 art. 15.7].
- **Différences KB/MT** : le kick du muay-thaï met davantage l'accent sur le déplacement du centre de masse pour produire la force [S1]. « Muay Thai round kicks whip through the target with shin impact and full hip rotation » [S41]. Pas de différence significative de force d'impact entre les disciplines [S1].

### C.12 High kick : `high-kick-arriere`, `high-kick-avant`

- **Nom** : *Tei Kan Kro*, circulaire niveau haut [S21].
- **S1 porte justement sur un kick à hauteur de tête** (coussin à hauteur de la mastoïde) : toutes les valeurs de C.11 s'appliquent [S1].
- **Jambe d'appui (taekwondo)** : un kick haut augmente l'abduction et la flexion de hanche de la jambe d'appui [S5]. En phase de retour, valgus maximal du genou d'appui de 12,2° et flexion moyenne de 16,3° pour un kick haut, contre 10,5° et 20° pour un kick bas [S5]. « Maximum dynamic knee valgus angle close to 12 degrees may be considered dangerous in the return phase » [S5].
- **Tronc** : penché en arrière quand la hauteur augmente (taekwondo, Kim et al. cité par S5, non lu).
- **Défense contre le high kick** : retrait du buste [S30], parade bloquée [S19].
- **Règlement** : un high kick bloqué peut quand même marquer s'il déséquilibre l'adversaire [S10 art. 20.1.2].
- **Souplesse, « ne pas monter plus haut que sa souplesse »** : ND.

### C.13 Roundhouse (kick-boxing) : `roundhouse-arriere`, `roundhouse-avant`

- **Définition** : « Circulaire = Roundhouse kick (low/middle/high) ». Trajectoire circulaire, plus ou moins horizontale, de l'extérieur vers l'intérieur [S19].
- **Déclenchement** : « légère flexion/abduction de la cuisse sur le tronc ». Le mouvement continue soit par un balancement de la jambe, soit par un genou fléchi (armé) avant la frappe [S19]. Le glossaire admet donc les deux formes.
- **Surface** : « le dessus du pied et le tibia (en point fighting tibia interdit) » [S19]. En WAKO Low kick, le tibia est une surface autorisée vers la tête, le corps et les cuisses [S15 §6.2].
- **Grades** : roundhouse jambe avant et arrière dès le gant blanc [S20].
- **Biomécanique** : kick « throw-style », flexion de hanche puis extension rapide du genou, séquence proximo-distale [S3]. Les élites fléchissent et étendent la hanche et le genou plus vite que les non-élites [S2]. Vitesses publiées toutes disciplines confondues : 6,9 à 18,3 m/s [S3].
- **Réarmé avant de reposer, pied d'appui pivoté** : ND pour le kick-boxing. Pour le muay-thaï, S28 et S39 parlent d'un retour « the same way you came in ».

### C.14 Genou direct : `genou-direct-arriere`, `genou-direct-avant`

- **Nom** : *Khao Trong* [S21]. Coup de genou dans l'axe antéro-postérieur, surface rotule ou face interne du genou [S19].
- **Appuis** : petit pas en avant et légèrement en dehors avec le pied avant. Pousser sur la plante du pied avant pour monter le genou [S35].
- **Pied de la jambe qui frappe** : « Flex your back foot to create a straight line from your shin down through your instep » [S35]. Pointer les orteils plutôt que fléchir le pied [S44].
- **Articulation** : talon vers la fesse pour toucher avec la partie la plus dure du genou [S35].
- **Bassin et tronc** : « Drive your hips forward » ; se pencher en arrière pour éloigner la tête [S35].
- **Bras** : le bras arrière en garde longue, la main avant protège la tête. Certains gardent les deux mains hautes, d'autres balancent les bras [S35].
- **Trajectoire** : « Don't knee upward ». On pousse vers l'avant comme une lance, sauf à courte distance en tirant l'adversaire [S35].
- **Erreurs** : pas trop grand avec la jambe avant, genou vers le haut, se pencher en avant [S35].
- **Règlement** : les genoux sont autorisés en IFMA et WMC [S10 ; S14], mais pas à la tête chez les 12-13 ans [S10 art. 22.3]. Ils sont interdits en WAKO Low kick [S15 §7] et autorisés en WAKO K1 sans saisie [S16 art. 4.3].
- **Différences KB/MT** : l'application ne range pas `kickboxing` dans les disciplines des genoux. C'est conforme au règlement WAKO Low kick, mais pas au K1 [S15 ; S16].
- **Genou jambe avant, équilibre sur la jambe arrière** : ND.

### C.15 Genou circulaire : `genou-circulaire-arriere`, `genou-circulaire-avant`

- **Noms** : *Khao Chiyang* (petit circulaire, corps à corps), *Khao Kong* (grand circulaire, corps à corps), *Khao Thop* (face interne du genou, niveau médian), *Khao Tat* (niveau bas, sur la cuisse) [S21].
- **Exécution (consignes du coach Taywin)** : ramener le genou en « opening the hip wide », puis tourner sur la jambe d'appui. Jambe d'appui « straight and centered ». Rester droit, sans baisser la tête ni l'épaule. Genou un peu incliné vers le bas pour toucher avec « the hard part of your knee ». Orteils pointés. Genou très haut, « almost under the armpit » [S44].
- **Bras** : tirer la tête (ou le sac) en travers du corps, vers le genou [S44].
- **Usage** : les genoux en diagonale « sneak through gaps », les genoux courbes servent dans le clinch [S35].
- **Pivot du pied d'appui** : S44 parle de « rotate on the support leg » ; angle ND.
- **Sécurité** : ND.

### C.16 Coudes horizontaux : `coude-horizontal-avant`, `coude-horizontal-arriere`

- **Nom** : *Tii Sok*, « direct, circulaire horizontal » [S21]. Appelé *sok tad* dans S27.
- **Exécution** : tourner ensemble le coude, l'épaule et les hanches, et frapper avec la pointe du coude. Le coude « goes straight across from one shoulder to the other » [S27]. Tourner les hanches et les pieds comme pour un coup de poing [S33].
- **Main libre** : « right next to your face » [S33]. Main de frappe ouverte ou fermée : ND.
- **Surface** : pointe du coude [S27], « the boniest part of your elbow » [S33].
- **Distance** : à l'intérieur de la distance de poing, ou depuis le clinch [S33].
- **Avant-bras parallèle au sol** : ND.
- **Règlement et sécurité** : protège-coudes obligatoires en IFMA [S10 art. 10.3]. Coudes interdits à la tête chez les 12-13 ans [S10 art. 22.3]. Interdits en WAKO Low kick et K1 [S15 §7 ; S16 art. 5]. Interdits en kick-boxing K-1/Glory [S41].

### C.17 Coudes diagonaux descendants : `coude-diagonal-arriere`, `coude-diagonal-avant`

- **Nom** : *Sok Tat*, circulaire descendant [S21]. S27 nomme *sok chiang* un coude en diagonale à 45° montant vers les yeux et le nez, et *sok tong* le coude descendant. La terminologie varie selon les sources.
- **Exécution** : tourner les hanches et les pieds pour mettre plus de force [S33]. En contre, on peut baisser la tête sous un coup circulaire tout en lançant le coude [S33]. Pour le *sok chiang* : le pied avant tourne pour le coude avant, le pied arrière tourne vers l'intérieur pour le coude arrière [S27].
- **Flexion des jambes, poids qui descend avec le coude** : ND (sauf la variante en contre, avec esquive basse [S33]).

### C.18 Coudes remontants : `coude-montant-arriere`, `coude-montant-avant`

- **Nom** : *Sok Ngat*, remontant (uppercut) [S21] ; *sok ngad* dans S27.
- **Exécution** : fléchir un peu les genoux pour préparer, pousser sur les talons, tourner les hanches, même mouvement qu'un uppercut [S33]. Les hanches, les épaules et le coude tournent légèrement vers l'intérieur [S27].
- **Cible** : le nez et le menton [S27].
- **Trajectoire strictement verticale, main près de l'oreille** : ND.

### C.19 Clinch : `clinch-tirage`, `genou-clinch`, `genou-circulaire-clinch`

- **Noms** : *Tchap Kho* (saisie à la tête), *Lat Eo* (saisie au corps) [S21]. Saisie à la tête d'un bras ou des deux [S21].
- **Mains** : « lock your palms together around their neck so that your gloves press down on the top of their head » [S32]. Mains superposées ou doigts entrelacés : ND.
- **Coudes et avant-bras** : coudes serrés sur la clavicule de l'adversaire, avant-bras serrés contre les côtés de son cou [S32].
- **Hanches et base** : « your hips close to theirs », base stable, jambes un peu plus larges que les épaules [S32].
- **Tirage et genou** : tirer la tête vers le bas en poussant la jambe arrière vers l'avant [S32]. Utiliser les hanches et tirer l'adversaire vers ses frappes [S35]. Genoux droits au corps, genoux en diagonale dans les petites ouvertures [S32].
- **Rotation** : pivoter autour de l'adversaire jusqu'à environ 90° (« seatbelt ») [S32]. Le déséquilibre prépare les frappes suivantes [S32].
- **Erreurs** : lancer des coudes sans timing, cou faible [S32].
- **Règlement** : IFMA interdit d'accrocher les jambes, la projection de hanche et de soulever l'adversaire [S10 art. 22.2]. L'arbitre sépare au commandement « YAEK » [S10 art. 18.3]. WMC interdit de projeter, de casser le dos et d'utiliser le judo ou la lutte [S14 art. 15.2], ainsi que de tenir l'adversaire pour lui mettre un genou dans l'aine [S14 art. 15.6]. « Breaking the back » est une faute [S32]. Le clinch est interdit en WAKO K1 [S16 art. 4.3]. Dans le glossaire FFKMDA, la saisie pour le genou est limitée à 5 s et réservée au K1 style [S19]. Ce dernier point contredit S16 ; S16 semble plus récent (**déduction**). La brochure WAKO India autorise de tenir la nuque des deux mains pour un seul genou [S18], ce qui contredit aussi S16.
- **Sécurité** : ND (en dehors des fautes ci-dessus).

### C.20 Combinaisons poings-pieds (pas de technique dédiée dans l'application)

- **Progression FFKMDA en low kick et kick light** : liaisons de 2 coups poing/pied et pied/poing (gant blanc), puis 3 coups (jaune), 4 coups (vert), « poings/pieds/poings et pieds/poings/pieds » (bleu), et 5 à 6 coups enchaînés au niveau confirmé [S20].
- **Kick-boxing** : les juges récompensent souvent « combinations ending with kicks » [S41], selon un blog de fabricant et non un règlement.
- **Muay-thaï** : riposter par un direct ou un low kick intérieur après un check [S31]. Sentir le poids de l'adversaire au corps à corps, puis lancer le low kick quand il pousse [S25].

---

## D. Écarts entre l'application et les sources (classés par gravité)

Gravité : **Haute** = l'application contredit une source ou présente un risque de sécurité. **Moyenne** = information incomplète ou trompeuse sur un point clé. **Basse** = manque ou précision à ajouter.

### Haute

| # | Technique (id) | Texte actuel | Ce que disent les sources |
|---|---|---|---|
| H1 | `middle-kick-arriere` | keyPoint « Le buste s'incline légèrement en arrière » | « Leaning backward takes power away from your hip drive and leaves you off-balance » [S40]. Se pencher en arrière est une erreur de check [S31], et l'excès d'inclinaison au teep trahit un manque de hanche [S43]. Seule source dans l'autre sens : une étude de taekwondo citée de seconde main (Kim et al., via S5), pour les kicks hauts. À reformuler, par exemple en contrepoids limité qui ne remplace pas la hanche, ou à retirer. |
| H2 | `garde` | keyPoint « Pied avant légèrement tourné vers l'intérieur » (garde commune à la boxe, au KB, au MT et au MMA) | Pour le muay-thaï, pied avant « pointing forward with a slight angle away from the body » [S23], pieds « pointing slightly outwards » [S28]. Aucune source consultée ne parle d'un pied avant tourné vers l'intérieur. |
| H3 | `garde` (MT) | La description ne dit rien des hanches, et la même garde vaut pour toutes les disciplines | En muay-thaï, hanches « square on » et non de profil [S23 ; S38]. La garde du muay-thaï est plus haute et plus droite, avec le poids un peu en arrière [S39 ; S41], ou réparti [S23]. Une garde unique pour la boxe et le muay-thaï contredit ces sources. Il faudrait une variante muay-thaï. |
| H4 | `high-kick-arriere`, `middle-kick-arriere`, `low-kick-arriere` | Les cues « Pivote fort », « Pivot maximal » ne disent rien de la sécurité de la jambe d'appui | Le pivot augmente les contraintes de rotation sur le genou et le tibia d'appui [S4]. Un valgus du genou d'appui proche de 12° au retour d'un kick haut « may be considered dangerous » [S5, taekwondo]. Il manque un point de sécurité : genou d'appui non verrouillé, aligné avec le pied pendant la rotation. Formulation à valider par un entraîneur ; l'alignement est une **déduction**. |
| H5 | `low-kick-arriere` | Aucun avertissement sur la surface | Toucher près du pied ou du cou-de-pied fait plus mal au frappeur [S37]. Un low kick mal exécuté « can lead to a broken leg » [S25]. Un low kick bloqué peut causer un traumatisme du tibia ou des métatarses [S4]. Il faut préciser « milieu du tibia » et le risque. |

### Moyenne

| # | Technique (id) | Texte actuel | Ce que disent les sources |
|---|---|---|---|
| M1 | `middle-kick-arriere` | « jambe qui traverse la cible » | Les sources divergent : poids qui « follow through the target » [S40], ou retour rapide « the same way you came in » [S28 ; S39]. Pour le low kick, ne pas traverser complètement [S25]. À présenter comme un choix d'école, pas comme une règle. |
| M2 | `middle-kick-arriere`, `high-kick-arriere` | Aucune mention du bras | Le bras du côté du kick descend en fouettant, l'autre main reste au menton [S28 ; S39 ; S40]. Le fouetté du bras est optionnel et augmente le risque de projection [S39]. |
| M3 | `low-kick-arriere` | keyPoint « Main du côté qui frappe protège ou équilibre » | Les sources décrivent un balancement du bras arrière vers l'arrière, pour la puissance et l'équilibre [S25 ; S37]. « Protège » ne vient d'aucune source pour le bras du côté de la frappe. C'est la main opposée qui protège [S39 ; S40]. |
| M4 | `check-avant` | keyPoint « Le genou et le coude se rapprochent », cue « Lève le genou vers l'extérieur » | Coude vers la jambe levée : conforme [S30]. L'orientation varie selon les sources : tibia légèrement vers l'extérieur [S31], vertical [S38], oblique [S21]. Il manque la rotation de hanche, le poids sur la jambe arrière [S30 ; S31], la zone de contact (haut du tibia ou genou) [S31] et les erreurs (check tardif, se pencher en arrière) [S31]. |
| M5 | `teep-avant` | keyPoints « Le buste recule légèrement », « Le talon d'appui peut se lever » | L'inclinaison du buste est documentée, plus marquée pour un teep au visage [S24 ; S43], mais si on se penche à chaque teep, la hanche ne travaille pas assez [S43]. Talon d'appui qui se lève : ND. Les sources parlent de jambe d'appui tendue [S36], de léger pivot [S29] et de petit saut [S43]. Il manque la surface (plante avant) [S24 ; S36], le bras qui descend [S24 ; S29], le retour rapide [S29] et la distinction avant/arrière [S24 ; S29]. |
| M6 | `roundhouse-arriere`, `roundhouse-avant` | « extension avec le cou-de-pied » seulement | En kick-boxing FFKMDA, la surface est « le dessus du pied et le tibia » ; le tibia est interdit seulement en point fighting [S19]. En WAKO Low kick, le tibia est autorisé [S15]. Le déclenchement peut être un balancement ou un armé [S19]. L'application réduit le roundhouse de kick-boxing au seul cou-de-pied et au seul armé. |
| M7 | `genou-direct-*`, `genou-circulaire-*` | Disciplines : muaythai, mma, sans kickboxing | Les genoux sont autorisés en WAKO K1 [S16] et interdits en WAKO Low kick [S15]. Selon le style de kick-boxing visé, il faudrait ajouter `kickboxing` avec une mention « K1 seulement ». |
| M8 | `clinch-*` | Pas de mention de discipline ni de règlement | Le clinch est interdit en WAKO K1 [S16] et encadré en muay-thaï (fautes [S10 art. 22.2 ; S14 art. 15]). Les disciplines `muaythai` sont donc cohérentes. Il manque la position des coudes et des avant-bras sur le cou [S32] et le dos de l'adversaire qu'on ne casse pas [S14 art. 15.2 ; S32]. |
| M9 | `coude-*` | Aucune mention de sécurité ni d'âge | Protège-coudes obligatoires et coudes interdits à la tête chez les 12-13 ans en IFMA [S10 art. 10.3, 22.3]. Interdits dans tous les styles WAKO lus [S15 ; S16]. |
| M10 | `low-kick-avant` | « souvent à l'intérieur de la cuisse », cue « Petit pas d'appui » | Exécution du low kick jambe avant : ND. Le « petit pas d'appui » ne vient d'aucune source lue. Seule la cible (intérieur de la cuisse) est autorisée en WAKO LK [S15]. |
| M11 | `coude-diagonal-arriere` | keyPoint « Le poids descend avec le coude », « flexion des jambes » | Les sources décrivent une rotation des hanches et des pieds [S27 ; S33]. La flexion des jambes n'apparaît que dans la variante en contre (esquive basse) [S33]. Sinon : ND. |
| M12 | `coude-montant-arriere` | keyPoint « Main proche de l'oreille » | ND. Les sources décrivent une légère flexion des genoux, une poussée et une rotation des hanches, comme un uppercut [S33 ; S27]. Elles ne parlent pas de la position de la main. |

### Basse

| # | Technique (id) | Remarque |
|---|---|---|
| B1 | `garde` | « Main arrière contre la joue » : S23 donne les pouces au niveau des sourcils, paumes face à face. S38 met les mains devant le visage à hauteur des yeux. Pas de contradiction franche, mais la garde longue du muay-thaï manque [S38]. « Talon arrière décollé » est compatible avec « ball of the foot » [S23 ; S39]. |
| B2 | `pas-*` | Conforme à S38 et S42 (premier pied du côté du déplacement, pieds non croisés). Manque le *Yaang Saam Koum* (trois pas alternés) propre au muay-thaï [S21 ; S38]. |
| B3 | `pivot-*`, `sortie-angle` | Compatible avec la définition FFKMDA du pivot [S19]. « Sur l'avant du pied » et « fin face à la cible » : ND. Manquent le décalage, le débordement et le changement de garde [S19]. |
| B4 | `roll-*` | Conforme à l'esquive rotative FFKMDA. Il manque l'interdiction d'engager la tête vers l'avant [S19]. |
| B5 | `genou-direct-arriere` | Conforme : hanche en avant, pied tendu, appui sur la plante [S35 ; S44]. Il manque l'inclinaison du buste en arrière, le « don't knee upward » et le « don't lean forward » [S35]. |
| B6 | `genou-circulaire-arriere` | « Pivot du pied d'appui » est compatible avec « rotate on the support leg » [S44]. Il manque : rester droit, jambe d'appui tendue, tirer la tête en travers [S44]. |
| B7 | `coude-horizontal-avant` | « Coude à hauteur d'épaule » : S27 parle d'une trajectoire d'une épaule à l'autre, ce qui est compatible. « Avant-bras parallèle au sol » : ND. Il manque la surface (pointe du coude) [S27 ; S33]. |
| B8 | `front-kick-avant` | Conforme : armé de la cuisse puis extension, surface « bol » ou plante [S19]. « Retour par le même chemin » : ND. Le choix percuté ou poussé n'est pas indiqué [S19]. |
| B9 | `high-kick-*` | « Ne pas monter plus haut que sa souplesse » : ND, mais c'est une précaution raisonnable (**déduction**). Les valeurs de S1 portent sur un kick à hauteur de tête : genou fléchi d'environ 43° à l'impact, contact du bas du tibia au cou-de-pied. |
| B10 | `middle-kick-avant` | « souvent après un changement d'appui » : conforme au switch kick [S26 ; S34]. Il manque l'appui étroit, le pivot sur la plante du nouveau pied avant et les erreurs (changement trop large ou trop long) [S26]. |
| B11 | `blocage-corps-avant` | Coude contre les côtes et rotation du buste : ND. S23 dit seulement de garder les coudes près du corps. |
| B12 | Toutes les techniques de pied | L'application ne décrit aucune phase. S1 donne une décomposition mesurée : préparation 6 %, armé 14 %, extension 11 %, retour 69 % (muay-thaï, karaté et taekwondo confondus). |

---

## E. Limites de la recherche

1. **Lecture par WebFetch** : chaque page a été lue au travers d'un modèle qui résume ou extrait, avec une limite de longueur des citations. Les citations entre guillemets sont celles renvoyées par l'outil. Elles n'ont pas été vérifiées sur le document original. Certains résumés ont signalé leurs propres incohérences (S1 : 7 ou 9 caméras ; S2 : sens de l'écart de 65 % ; S7 : résumé thaï contre résumé anglais ; S19 : date de version).
2. **Règlement IFMA 2026 (S11)** : seule la table des matières a été extraite, le téléchargement direct étant bloqué par le proxy (403). Les règles citées viennent de la version 2.01 de 2020 (S10), qui a pu évoluer.
3. **Pas de manuel officiel d'entraîneur** : aucun manuel technique IFMA, WMC ou WAKO décrivant l'exécution n'a été trouvé en accès libre. La brochure « technical book » de WAKO India (S18) ne contient aucune technique. Les sources FFKMDA (S19 à S21) nomment et définissent les techniques sans détailler l'exécution. Le référentiel muaythai lu ne couvre que le 1er Khan.
4. **Exécution détaillée** : elle vient surtout de blogs (Evolve, muaythai.com, Fairtex, Breaking Muscle, Muay Thai Guy, 8limbs). Leur fiabilité est variable : auteurs souvent anonymes ou rédacteurs, contenu parfois commercial. S39 est écrit par un entraîneur de boxe anglaise. Les points qui reposent sur une seule source de ce type sont à faire valider par un entraîneur diplômé.
5. **Biomécanique** : une seule étude lue mesure le kick circulaire en muay-thaï (S1 : n = 8 par discipline, kick à hauteur de tête). Les données sur la jambe d'appui viennent du taekwondo (S5, S6 avec n = 4, S9). S7 et S8 n'ont été lus qu'en résumé. Aucune étude n'a été lue sur le low kick, le teep, les genoux, les coudes ou le clinch. Aucun angle de pivot du pied d'appui n'est publié dans les sources lues pour le muay-thaï ou le kick-boxing.
6. **Aucune source de type « exécution observée en compétition »** n'a été lue.
7. **Vidéos** : aucune n'a été visionnée (section B).
8. **Inaccessible** : l'article PMC 10170541 (reCAPTCHA). Non compté comme lu.
9. **Hors périmètre** : les coups de poing purs et les feintes.
