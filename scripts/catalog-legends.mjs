/**
 * v0.28 (Youssef, 2026-10-20 21:52 : « enrichis toutes les disciplines et les légendes ») : données
 * ajoutées au catalogue par scripts/build-catalog.mjs.
 *
 * - INFO : pour chaque champion, pays, époque (seulement quand elle est connue avec certitude), une
 *   anecdote « Le savais-tu ? » et la page de référence qui la contient. Chaque anecdote a été relue sur
 *   la page citée (Wikipedia en anglais, source secondaire) le 2026-10-20 ; rien n’est ajouté sans cette
 *   vérification. Aucune anecdote ne prétend décrire une séquence de combat.
 * - NEW_CHAMPIONS : nouveaux profils (jiu-jitsu brésilien, judo, et des championnes dans les quatre
 *   disciplines de frappe). Profils de style généraux : traits publics vérifiés, sinon description
 *   prudente de ce que les fiches travaillent.
 * - EXTRA_DISCIPLINES : disciplines ajoutées à des profils existants (fiches générées en phase 2, les
 *   fiches existantes ne changent pas).
 */
const W = (p) => `https://en.wikipedia.org/wiki/${p}`;

export const INFO = {
  // ---------------------------------------------------------------- boxe
  tyson: { country: 'États-Unis', era: 'Pro de 1985 à 2024', fact: 'En 1986, à 20 ans, « Iron Mike » devient le plus jeune champion du monde des lourds de l’histoire.', ref: W('Mike_Tyson') },
  ali: { country: 'États-Unis', era: 'Pro de 1960 à 1981', fact: 'Avant d’être « The Greatest », il gagne l’or olympique des mi-lourds à Rome, en 1960.', ref: W('Muhammad_Ali') },
  mayweather: { country: 'États-Unis', era: 'Pro de 1996 à 2017', fact: 'Surnommé « Money », il a pris sa retraite invaincu : 50 victoires, 0 défaite.', ref: W('Floyd_Mayweather_Jr.') },
  canelo: { country: 'Mexique', fact: '« Canelo » veut dire « cannelle » en espagnol. En 2021, il devient le premier champion incontesté des super-moyens.', ref: W('Canelo_Álvarez') },
  lomachenko: { country: 'Ukraine', fact: 'Double champion olympique (2008, 2012), il comptait 396 victoires pour une seule défaite chez les amateurs.', ref: W('Vasiliy_Lomachenko') },
  pacquiao: { country: 'Philippines', era: 'Pro depuis 1995', fact: '« PacMan » est le seul boxeur champion du monde dans huit catégories de poids.', ref: W('Manny_Pacquiao') },
  leonard: { country: 'États-Unis', era: 'Pro de 1976 à 1997', fact: 'Champion olympique en 1976, il forme les « Four Kings » avec Durán, Hearns et Hagler.', ref: W('Sugar_Ray_Leonard') },
  duran: { country: 'Panama', era: 'Pro de 1968 à 2001', fact: 'Son surnom, « Manos de Piedra », veut dire « mains de pierre ».', ref: W('Roberto_Durán') },
  hagler: { country: 'États-Unis', era: 'Pro de 1973 à 1987', fact: 'Il aimait tant son surnom qu’en 1982 il a officiellement changé de nom : « Marvelous Marvin Hagler ».', ref: W('Marvin_Hagler') },
  hearns: { country: 'États-Unis', era: 'Pro de 1977 à 2006', fact: '« The Hitman » a été le premier boxeur champion du monde dans cinq catégories.', ref: W('Thomas_Hearns') },
  rjj: { country: 'États-Unis', era: 'Pro de 1989 à 2018', fact: 'En 2003, cet ancien champion des moyens remporte un titre chez les lourds : une première depuis 106 ans.', ref: W('Roy_Jones_Jr.') },
  crawford: { country: 'États-Unis', era: 'Pro de 2008 à 2025', fact: '« Bud » est le premier boxeur incontesté dans deux catégories à l’ère des quatre ceintures.', ref: W('Terence_Crawford') },
  usyk: { country: 'Ukraine', fact: 'Champion olympique en 2012, il a été champion incontesté chez les lourds-légers puis chez les lourds.', ref: W('Oleksandr_Usyk') },
  inoue: { country: 'Japon', era: 'Pro depuis 2012', fact: 'On l’appelle « The Monster » (Kaibutsu) : il a été champion incontesté chez les coqs puis chez les super-coqs.', ref: W('Naoya_Inoue') },
  davis: { country: 'États-Unis', era: 'Pro depuis 2013', fact: 'Surnommé « Tank », il a eu Floyd Mayweather comme promoteur et mentor.', ref: W('Gervonta_Davis') },
  beterbiev: { country: 'Russie et Canada', era: 'Pro depuis 2013', fact: 'Il a gagné ses 20 premiers combats professionnels avant la limite.', ref: W('Artur_Beterbiev') },
  bivol: { country: 'Russie (né au Kirghizistan)', era: 'Pro depuis 2014', fact: 'Né à Tokmok, au Kirghizistan, il a battu Canelo Álvarez en 2022.', ref: W('Dmitry_Bivol') },
  frazier: { country: 'États-Unis', era: 'Pro de 1965 à 1981', fact: 'En 1971, « Smokin’ Joe » est le premier à battre Muhammad Ali, lors du « combat du siècle ».', ref: W('Joe_Frazier') },
  foreman: { country: 'États-Unis', era: 'Pro de 1969 à 1997', fact: 'En 1994, à 45 ans, il devient le plus vieux champion du monde de l’histoire. Il a même donné son nom à un grill !', ref: W('George_Foreman') },
  chavez: { country: 'Mexique', era: 'Pro de 1980 à 2005', fact: 'Il a enchaîné 87 victoires avant un match nul, en 1993, contre Pernell Whitaker.', ref: W('Julio_César_Chávez') },
  // ---------------------------------------------------------------- kick-boxing
  petrosyan: { country: 'Italie (né en Arménie)', fact: 'Surnommé « The Doctor », il est resté invaincu 42 combats d’affilée.', ref: W('Giorgio_Petrosyan') },
  hoost: { country: 'Pays-Bas', fact: 'Surnommé « Mr. Perfect », il a gagné le K-1 World Grand Prix en 1997, 1999, 2000 et 2002.', ref: W('Ernesto_Hoost') },
  verhoeven: { country: 'Pays-Bas', fact: 'Le « King of Kickboxing » a gardé la ceinture Glory des lourds 4 220 jours, avec 13 défenses victorieuses.', ref: W('Rico_Verhoeven') },
  aerts: { country: 'Pays-Bas', fact: 'Surnommé « le bûcheron hollandais », il a gagné le K-1 World Grand Prix en 1994, 1995 et 1998.', ref: W('Peter_Aerts') },
  bonjasky: { country: 'Pays-Bas (né au Suriname)', fact: '« The Flying Gentleman » était célèbre pour ses genoux et ses coups de pied sautés.', ref: W('Remy_Bonjasky') },
  hari: { country: 'Pays-Bas et Maroc', fact: 'Champion du monde K-1 des lourds en 2007, puis champion It’s Showtime en 2009.', ref: W('Badr_Hari') },
  souwer: { country: 'Pays-Bas', fact: 'Surnommé « The Destroyer », il a gagné le K-1 World MAX en 2005 et en 2007.', ref: W('Andy_Souwer') },
  tenshin: { country: 'Japon', fact: 'Invaincu en kick-boxing (42 victoires, 0 défaite), il est ensuite passé à la boxe anglaise.', ref: W('Tenshin_Nasukawa') },
  takeru: { country: 'Japon', fact: 'C’est le seul kick-boxeur titré en K-1 dans trois catégories de poids.', ref: W('Takeru_Segawa') },
  allazov: { country: 'Azerbaïdjan et Biélorussie', fact: 'Surnommé « Chinga », il a gagné le Grand Prix ONE des plume de kick-boxing en 2021.', ref: W('Chingiz_Allazov') },
  superbon: { country: 'Thaïlande', fact: 'En 2021, il met Giorgio Petrosyan KO d’un high kick du droit.', ref: W('Superbon_Singha_Mawynn') },
  buakaw: { country: 'Thaïlande', fact: 'Surnommé « White Lotus », il est le premier à gagner deux fois le K-1 World MAX (2004 et 2006).', ref: W('Buakaw_Banchamek') },
  holzken: { country: 'Pays-Bas', fact: '« The Natural » a aussi fait une carrière en boxe anglaise : 15 victoires, 2 défaites.', ref: W('Nieky_Holzken') },
  sitthichai: { country: 'Thaïlande', fact: 'Surnommé « Killer Kid », il a été élu combattant de l’année 2018 par Glory.', ref: W('Sitthichai_Sitsongpeenong') },
  grigorian: { country: 'Belgique (né en Arménie)', fact: 'À 18 ans, il est le plus jeune challenger d’un titre It’s Showtime.', ref: W('Marat_Grigorian') },
  vanroosmalen: { country: 'Pays-Bas', fact: 'Premier combattant titré Glory dans deux catégories de poids.', ref: W('Robin_van_Roosmalen') },
  pereira: { country: 'Brésil', fact: '« Poatan » a tenu deux ceintures Glory en même temps, puis a été champion UFC dans deux catégories.', ref: W('Alex_Pereira') },
  doumbe: { country: 'France et Cameroun', fact: 'Surnommé « Le Meilleur », il est le premier champion français de l’histoire de Glory.', ref: W('Cédric_Doumbé') },
  lebanner: { country: 'France', fact: 'Né au Havre, « le Bulldog normand » combat en garde gaucher.', ref: W('Jérôme_Le_Banner') },
  masato: { country: 'Japon', era: 'De 1997 à 2009', fact: 'Il a remporté le K-1 World MAX en 2003, puis à nouveau en 2008.', ref: W('Masato_(kickboxer)') },
  // ---------------------------------------------------------------- MMA
  silva: { country: 'Brésil', fact: '« The Spider » a gardé la ceinture UFC des moyens 2 457 jours, avec dix défenses victorieuses.', ref: W('Anderson_Silva') },
  adesanya: { country: 'Nouvelle-Zélande (né au Nigeria)', fact: 'Avant l’UFC, « The Last Stylebender » était kick-boxeur.', ref: W('Israel_Adesanya') },
  jones: { country: 'États-Unis', fact: 'En 2011, à 23 ans, « Bones » devient le plus jeune champion de l’histoire de l’UFC.', ref: W('Jon_Jones') },
  gsp: { country: 'Canada', fact: 'Il a commencé le karaté Kyokushin à 7 ans.', ref: W('Georges_St-Pierre') },
  khabib: { country: 'Russie (Daghestan)', fact: '« The Eagle » a fini sa carrière invaincu, 29-0. Enfant, il a même lutté avec un ours !', ref: W('Khabib_Nurmagomedov') },
  makhachev: { country: 'Russie', fact: 'Champion du monde de sambo de combat en 2016, puis champion UFC chez les légers et chez les welters.', ref: W('Islam_Makhachev') },
  mcgregor: { country: 'Irlande', fact: 'En 2016, « Notorious » devient le premier champion UFC dans deux catégories en même temps.', ref: W('Conor_McGregor') },
  holloway: { country: 'États-Unis (Hawaï)', fact: '« Blessed » détient le record UFC de frappes significatives en carrière : 3 681.', ref: W('Max_Holloway') },
  volkanovski: { country: 'Australie', fact: 'Avant le MMA, il jouait au rugby à XIII, au poste de pilier.', ref: W('Alexander_Volkanovski') },
  poirier: { country: 'États-Unis', fact: '« The Diamond » a cofondé une association caritative, The Good Fight Foundation, en 2018.', ref: W('Dustin_Poirier') },
  gaethje: { country: 'États-Unis', fact: '« The Highlight » a été All-American en lutte universitaire (NCAA Division I) en 2010.', ref: W('Justin_Gaethje') },
  oliveira: { country: 'Brésil', fact: 'Il détient les records UFC de victoires par soumission (17) et de combats finis avant la limite (21).', ref: W('Charles_Oliveira') },
  aldo: { country: 'Brésil', fact: 'Premier champion UFC des poids plume (2010), il est connu pour ses low kicks.', ref: W('José_Aldo') },
  dj: { country: 'États-Unis', fact: '« Mighty Mouse » a défendu sa ceinture UFC des mouches 11 fois de suite : un record.', ref: W('Demetrious_Johnson') },
  shevchenko: { country: 'Kirghizistan et Pérou', fact: '« Bullet » a gagné plusieurs titres mondiaux IFMA de muay-thaï avant de régner sur l’UFC.', ref: W('Valentina_Shevchenko') },
  jedrzejczyk: { country: 'Pologne', fact: 'Première championne UFC polonaise, elle a d’abord gagné cinq titres mondiaux IFMA de muay-thaï.', ref: W('Joanna_Jędrzejczyk') },
  nunes: { country: 'Brésil et États-Unis', fact: 'En 2018, « Lioness » devient la première femme championne de deux catégories UFC en même temps.', ref: W('Amanda_Nunes') },
  edwards: { country: 'Angleterre (né en Jamaïque)', fact: '« Rocky » a gagné la ceinture UFC des welters en 2022 sur un high kick.', ref: W('Leon_Edwards') },
  thompson: { country: 'États-Unis', fact: '« Wonderboy » est invaincu en kick-boxing (20 victoires). Son premier entraîneur ? Son père, Ray.', ref: W('Stephen_Thompson_(fighter)') },
  topuria: { country: 'Géorgie et Espagne', fact: '« El Matador » est le premier champion UFC géorgien et espagnol.', ref: W('Ilia_Topuria') },
  aspinall: { country: 'Angleterre', fact: 'Ceinture noire de jiu-jitsu brésilien, il a été champion UFC des lourds.', ref: W('Tom_Aspinall') },
  fedor: { country: 'Russie', fact: '« The Last Emperor » est resté invaincu lors de ses 28 premiers combats de MMA.', ref: W('Fedor_Emelianenko') },
  machida: { country: 'Brésil', fact: '« The Dragon » a appris le karaté Shotokan avec son père, Yoshizo Machida.', ref: W('Lyoto_Machida') },
  // ---------------------------------------------------------------- muay-thaï
  saenchai: { country: 'Thaïlande', fact: 'Il acceptait souvent des adversaires plus lourds que lui pour trouver des combats à sa mesure.', ref: W('Saenchai') },
  rodtang: { country: 'Thaïlande', fact: 'Surnommé « The Iron Man », il a été champion ONE des mouches de muay-thaï de 2019 à 2024.', ref: W('Rodtang_Jitmuangnon') },
  nongo: { country: 'Thaïlande', fact: 'Premier champion ONE des coqs de muay-thaï (2019), il a défendu sa ceinture sept fois.', ref: W('Nong-O_Gaiyanghadao') },
  samart: { country: 'Thaïlande', fact: 'Champion du monde WBC de boxe anglaise en 1986, il a aussi sorti trois albums de pop !', ref: W('Samart_Payakaroon') },
  dieselnoi: { country: 'Thaïlande', fact: 'Surnommé « le genou qui perce le ciel », il a gardé son titre du Lumpinee quatre ans, faute de challengers.', ref: W('Dieselnoi_Chor_Thanasukarn') },
  superlek: { country: 'Thaïlande', fact: 'Son surnom dit tout : « The Kicking Machine ».', ref: W('Superlek_Kiatmuu9') },
  tawanchai: { country: 'Thaïlande', fact: 'Né à Pattaya, il devient champion ONE des plume de muay-thaï en 2022.', ref: W('Tawanchai_P.K._Saenchaimuaythaigym') },
  yodsanklai: { country: 'Thaïlande', fact: 'Surnommé « The Boxing Computer », il a gagné The Contender Asia en 2008.', ref: W('Yodsanklai_Fairtex') },
  petchboonchu: { country: 'Thaïlande', fact: 'Son surnom : « le genou mortel du Mékong ».', ref: W('Petchboonchu_F.A._Group') },
  lerdsila: { country: 'Thaïlande', fact: 'Surnommé « l’Anguille », il est connu pour son style fuyant et spectaculaire.', ref: W('Lerdsila_Chumpairtour') },
  panpayak: { country: 'Thaïlande', fact: 'C’est le seul combattant de muay-thaï élu combattant de l’année en Thaïlande trois années de suite.', ref: W('Panpayak_Jitmuangnon') },
  seksan: { country: 'Thaïlande', fact: 'Son surnom veut dire « l’homme qui ne recule devant personne ».', ref: W('Saeksan_Or._Kwanmuang') },
  petchmorakot: { country: 'Thaïlande', fact: 'Gaucher, il a été le premier champion ONE des plume de muay-thaï, en 2020.', ref: W('Petchmorakot_Petchyindee_Academy') },
  anuwat: { country: 'Thaïlande', fact: 'On l’appelle « les mains de fer du Siam », pour la puissance de ses poings.', ref: W('Anuwat_Kaewsamrit') },
  karuhat: { country: 'Thaïlande', fact: 'Surnommé « Top Master », il est souvent cité parmi les plus grands talents de l’histoire du muay-thaï.', ref: W('Karuhat_Sor.Supawan') },
  somrak: { country: 'Thaïlande', fact: 'En 1996, à Atlanta, il devient le premier champion olympique de l’histoire de la Thaïlande (en boxe anglaise).', ref: W('Somluck_Kamsing') },
  namsaknoi: { country: 'Thaïlande', fact: 'À 17 ans, il est élu combattant de l’année 1996 en Thaïlande ; les médias l’appellent « l’Empereur ».', ref: W('Namsaknoi_Yudthagarngamtorn') },
  // ---------------------------------------------------------------- nouveaux profils (v0.28)
  shields: { country: 'États-Unis', era: 'Pro depuis 2016', fact: 'Double championne olympique (2012, 2016), « T-Rex » a été championne du monde dans cinq catégories.', ref: W('Claressa_Shields') },
  taylor: { country: 'Irlande', fact: 'Championne olympique en 2012, elle a aussi joué en équipe d’Irlande… de football !', ref: W('Katie_Taylor') },
  mossely: { country: 'France', fact: 'En 2016, elle est sacrée championne du monde puis championne olympique à Rio.', ref: W('Estelle_Mossely') },
  serrano: { country: 'Porto Rico et États-Unis', era: 'Pro depuis 2009', fact: '« The Real Deal » a été championne du monde dans sept catégories de poids.', ref: W('Amanda_Serrano') },
  meksen: { country: 'France', fact: 'Elle a gagné des titres mondiaux en kick-boxing, en muay-thaï et en savate.', ref: W('Anissa_Meksen') },
  vansoest: { country: 'États-Unis', fact: 'Surnommée « Time Bomb », elle pratique aussi le karaté Shōrin-ryū.', ref: W('Tiffany_van_Soest') },
  stamp: { country: 'Thaïlande', fact: 'Première championne de ONE dans trois sports : kick-boxing, muay-thaï et MMA.', ref: W('Stamp_Fairtex') },
  cyborg: { country: 'Brésil et États-Unis', fact: 'Elle a été championne dans cinq grandes organisations de MMA : Strikeforce, Invicta, UFC, Bellator et PFL.', ref: W('Cris_Cyborg') },
  namajunas: { country: 'États-Unis', fact: '« Thug Rose » a commencé le taekwondo à 5 ans et a été deux fois championne UFC des pailles.', ref: W('Rose_Namajunas') },
  zhang: { country: 'Chine', fact: 'Première championne UFC chinoise et asiatique (2019), elle dit vouloir être « comme l’eau » face à chaque adversaire.', ref: W('Zhang_Weili') },
  rousey: { country: 'États-Unis', fact: 'Médaillée de bronze olympique en judo (2008), elle a été la première combattante signée par l’UFC.', ref: W('Ronda_Rousey') },
  riner: { country: 'France', era: 'Senior depuis 2007', fact: '« Teddy Bear » a gagné l’or olympique en individuel en 2012, 2016 et 2024, et onze titres mondiaux individuels.', ref: W('Teddy_Riner') },
  agbegnenou: { country: 'France', fact: 'Six fois championne du monde, elle a gagné ses cinq combats des Mondiaux 2021 par ippon.', ref: W('Clarisse_Agbegnenou') },
  'kosei-inoue': { country: 'Japon', fact: 'Champion olympique en 2000 à Sydney ; ses projections favorites : uchi-mata et o-uchi-gari.', ref: W('Kosei_Inoue') },
  tani: { country: 'Japon', era: 'Jusqu’en 2010', fact: 'Surnommée « Yawara-chan », elle a gagné cinq médailles olympiques, dont l’or en 2000 et 2004, et sept titres mondiaux.', ref: W('Ryoko_Tani') },
  douillet: { country: 'France', era: 'Senior de 1991 à 2000', fact: 'Double champion olympique (1996, 2000), il est ensuite devenu ministre des Sports.', ref: W('David_Douillet') },
  yamashita: { country: 'Japon', era: 'De 1976 à 1985', fact: 'Il a enchaîné 203 victoires (et 7 nuls) sans défaite entre 1977 et 1985, et il a été champion olympique en 1984.', ref: W('Yasuhiro_Yamashita') },
  kelmendi: { country: 'Kosovo', era: 'De 1999 à 2021', fact: 'Son or à Rio, en 2016, est la toute première médaille olympique de l’histoire du Kosovo.', ref: W('Majlinda_Kelmendi') },
  'uta-abe': { country: 'Japon', fact: 'Le 25 juillet 2021, à Tokyo, elle et son frère Hifumi deviennent champions olympiques le même jour.', ref: W('Uta_Abe') },
  'roger-gracie': { country: 'Brésil', fact: 'Dix fois champion du monde IBJJF (2004 à 2010), souvent avec un étranglement croisé depuis la montée.', ref: W('Roger_Gracie') },
  'marcelo-garcia': { country: 'Brésil', fact: 'Quatre fois champion ADCC, « Marcelinho » a popularisé la garde X, l’arm drag et la guillotine haute.', ref: W('Marcelo_Garcia_(grappler)') },
  'rickson-gracie': { country: 'Brésil', fact: 'Fils d’Hélio Gracie, il est resté invaincu en MMA : 11 victoires, toutes par soumission.', ref: W('Rickson_Gracie') },
  buchecha: { country: 'Brésil', fact: 'Sept fois champion du monde IBJJF (2012 à 2019), il est ensuite passé au MMA.', ref: W('Marcus_Almeida') },
  'gabi-garcia': { country: 'Brésil', fact: 'En 2019, elle devient la première femme à gagner quatre titres ADCC.', ref: W('Gabrielle_Garcia') },
  dern: { country: 'États-Unis et Brésil', fact: 'Championne du monde IBJJF en 2015 et 2016, elle est devenue championne UFC des pailles en 2025.', ref: W('Mackenzie_Dern') },
  'bia-mesquita': { country: 'Brésil', fact: 'Avec 10 titres mondiaux IBJJF, elle détient le record chez les ceintures noires.', ref: W('Beatriz_Mesquita') },
  'ffion-davies': { country: 'Pays de Galles', fact: 'Première championne du monde galloise en ceinture noire, puis première championne ADCC britannique (2022).', ref: W('Ffion_Davies') },
};

/** disciplines ajoutées à des profils existants : leurs fiches sont générées en phase 2 */
export const EXTRA_DISCIPLINES = {
  // titres mondiaux IFMA de muay-thaï, voir INFO
  shevchenko: ['muaythai'],
  jedrzejczyk: ['muaythai'],
};

/**
 * Nouveaux profils. a / f : comme dans build-catalog.mjs (poids des archétypes et techniques
 * favorites). Pour le judo et le jiu-jitsu, a pondère les archétypes de GRAPPLING_ARCH.
 */
export const NEW_CHAMPIONS = [
  // ---------------------------------------------------------------- boxe
  { id: 'shields', name: 'Claressa Shields', d: ['boxe'], stance: 'orthodoxe', style: 'Double championne olympique, garde orthodoxe. Profil général de boxe complète : jab, combinaisons des deux mains, défense et déplacements.', traits: ['garde orthodoxe', 'boxe olympique', 'combinaisons'], a: { offensif: 1.6, defense: 1.3, corps: 1.2 }, f: { jab: 2, direct: 2, 'crochet-avant': 1.5, 'uppercut-arriere': 1.3 } },
  { id: 'taylor', name: 'Katie Taylor', d: ['boxe'], stance: 'orthodoxe', style: 'Style rapide, offensif et spectaculaire : rythme élevé, combinaisons et volume.', traits: ['rythme élevé', 'offensif', 'combinaisons'], a: { offensif: 2, cardio: 1.8, deplacement: 1.2 }, f: { jab: 2, direct: 2, 'crochet-avant': 2, 'pas-avant': 1.5 } },
  { id: 'mossely', name: 'Estelle Mossely', d: ['boxe'], stance: 'orthodoxe', style: 'Championne olympique et du monde en 2016, garde orthodoxe. Profil général de boxe olympique : jab, déplacements et combinaisons courtes.', traits: ['garde orthodoxe', 'boxe olympique', 'jab et déplacements'], a: { deplacement: 1.8, offensif: 1.4, angle: 1.3 }, f: { jab: 2.5, direct: 1.5, 'pas-arriere': 1.5, 'pas-gauche': 1.3, 'pas-droite': 1.3 } },
  { id: 'serrano', name: 'Amanda Serrano', d: ['boxe'], stance: 'gaucher', style: 'Garde gaucher, vitesse et puissance, combinaisons des deux mains.', traits: ['garde gaucher', 'vitesse', 'puissance'], power: true, a: { offensif: 2, corps: 1.5, echange: 1.3 }, f: { direct: 2.5, 'crochet-avant': 2, 'uppercut-arriere': 1.5, 'crochet-avant-corps': 1.5 } },
  // ---------------------------------------------------------------- kick-boxing / muay-thaï
  { id: 'meksen', name: 'Anissa Meksen', d: ['kickboxing', 'muaythai'], style: 'Style polyvalent : frappes précises, jeu de jambes et intelligence de ring. Titrée en kick-boxing, en muay-thaï et en savate.', traits: ['frappes précises', 'jeu de jambes', 'polyvalence'], a: { deplacement: 1.8, poingsPieds: 1.6, angle: 1.4, defense: 1.2 }, f: { jab: 2, direct: 1.5, 'pas-gauche': 1.5, 'sortie-angle': 1.5, 'middle-kick-arriere': 1.5, 'low-kick-arriere': 1.3 } },
  { id: 'vansoest', name: 'Tiffany van Soest', d: ['kickboxing', 'muaythai'], stance: 'orthodoxe', style: 'Base de muay-thaï et de karaté Shōrin-ryū, garde orthodoxe : coups de pied et combinaisons poings-pieds.', traits: ['muay-thaï', 'karaté', 'coups de pied'], a: { pieds: 1.8, poingsPieds: 1.8, piedsPoings: 1.3 }, f: { 'middle-kick-arriere': 2, 'high-kick-arriere': 1.5, 'teep-avant': 1.5, jab: 1.5 } },
  { id: 'stamp', name: 'Stamp Fairtex', d: ['muaythai', 'kickboxing'], style: 'Striking de base muay-thaï et grande polyvalence : championne ONE en kick-boxing, en muay-thaï et en MMA.', traits: ['striking muay-thaï', 'polyvalence'], a: { pieds: 1.6, genoux: 1.5, poingsPieds: 1.4, clinch: 1.2 }, f: { 'middle-kick-arriere': 2, 'teep-avant': 1.5, 'genou-direct-arriere': 1.5, jab: 1.3 } },
  // ---------------------------------------------------------------- MMA
  { id: 'cyborg', name: 'Cris Cyborg', d: ['mma'], stance: 'orthodoxe', style: 'Ceinture noire de muay-thaï et de jiu-jitsu brésilien, garde orthodoxe : striking puissant, genoux et lutte.', traits: ['muay-thaï', 'puissance', 'polyvalence'], power: true, a: { offensif: 1.8, genoux: 1.6, poingsPieds: 1.3 }, f: { direct: 2, 'crochet-avant': 2, 'genou-direct-arriere': 2, 'low-kick-arriere': 1.3 } },
  { id: 'namajunas', name: 'Rose Namajunas', d: ['mma'], style: 'Striking technique et jeu de jambes : pression au jab et au high kick, et tentatives de soumission une fois la distance fermée.', traits: ['striking technique', 'jeu de jambes', 'jab et high kick'], a: { deplacement: 1.8, piedsPoings: 1.5, sol: 1.2, angle: 1.3 }, f: { jab: 3, 'high-kick-arriere': 2, 'high-kick-avant': 1.5, 'pas-gauche': 1.5, 'pas-droite': 1.5 } },
  { id: 'zhang', name: 'Zhang Weili', d: ['mma'], style: 'Base de sanda et de jiu-jitsu brésilien (ceinture noire) : elle adapte sa tactique à chaque adversaire, debout comme en lutte.', traits: ['sanda', 'adaptation', 'striking-lutte'], power: true, a: { niveau: 1.6, offensif: 1.5, poingsPieds: 1.4, defLutte: 1.2 }, f: { direct: 2, 'crochet-avant': 1.5, 'entree-lutte': 1.5, 'middle-kick-arriere': 1.5 } },
  { id: 'rousey', name: 'Ronda Rousey', d: ['mma', 'judo'], style: 'Judokate médaillée olympique : entrées en lutte, projections et clé de bras. Seul, on travaille les entrées et les transitions, la clé se fait avec un partenaire.', traits: ['judo', 'clé de bras', 'entrées en lutte'], a: { niveau: 2.4, sol: 1.8, offensif: 1.1, entree: 2, kuzushi: 1.5 }, f: { 'entree-lutte': 2.5, 'changement-niveau': 2, 'descente-sol': 2, direct: 1.5, 'uchikomi-seoi': 2, kuzushi: 1.5 } },
  // ---------------------------------------------------------------- judo (travail solo)
  { id: 'riner', name: 'Teddy Riner', d: ['judo'], style: 'Poids lourd (+100 kg) au palmarès record. Les fiches travaillent à vide les bases de ses grandes entrées : déplacements, kuzushi et uchikomi.', traits: ['poids lourd', 'palmarès record', 'entrées de projection'], a: { entree: 2, uchikomi: 1.5, kuzushi: 1.3 }, f: { 'uchikomi-seoi': 2, kuzushi: 1.5, 'tsugi-ashi-avant': 1.5 } },
  { id: 'agbegnenou', name: 'Clarisse Agbegnenou', d: ['judo'], style: 'Six fois championne du monde des -63 kg, souvent victorieuse par ippon. Les fiches travaillent le rythme : déplacements, déséquilibre et entrées répétées.', traits: ['-63 kg', 'victoires par ippon', 'rythme'], a: { uchikomi: 2, entree: 1.5, deplacement: 1.3 }, f: { 'uchikomi-seoi': 2, 'tsugi-ashi-lateral': 1.5, kuzushi: 1.5 } },
  { id: 'kosei-inoue', name: 'Kosei Inoue', d: ['judo'], style: 'Champion olympique des -100 kg. Ses projections favorites (uchi-mata, o-uchi-gari) demandent un partenaire : ici, on travaille à vide le déséquilibre et les entrées qui les préparent.', traits: ['uchi-mata', 'o-uchi-gari', '-100 kg'], a: { kuzushi: 2, entree: 1.6, sabaki: 1.2 }, f: { kuzushi: 2.5, 'tsugi-ashi-avant': 1.5, 'tai-sabaki': 1.3 } },
  { id: 'tani', name: 'Ryoko Tani', d: ['judo'], style: 'Légende des -48 kg, médaillée à cinq Jeux olympiques. Les fiches travaillent les déplacements légers et les entrées rapides.', traits: ['-48 kg', 'longévité', 'déplacements'], a: { deplacement: 2, entree: 1.5, sabaki: 1.3 }, f: { 'tsugi-ashi-lateral': 2, 'tsugi-ashi-avant': 1.5, 'tai-sabaki': 1.5 } },
  { id: 'douillet', name: 'David Douillet', d: ['judo'], style: 'Poids lourd double champion olympique, titré en uchi-mata en finale olympique. Seul, on prépare ses entrées : kuzushi, rotation et uchikomi.', traits: ['poids lourd', 'uchi-mata', 'double champion olympique'], a: { sabaki: 1.8, kuzushi: 1.6, entree: 1.4 }, f: { 'tai-sabaki': 2, kuzushi: 2, 'uchikomi-seoi': 1.3 } },
  { id: 'yamashita', name: 'Yasuhiro Yamashita', d: ['judo'], stance: 'gaucher', style: 'Garde à gauche, o-soto-gari et o-uchi-gari, et très fort au sol. Les fiches solo travaillent les déplacements et le déséquilibre en garde à gauche.', traits: ['garde à gauche', 'o-soto-gari', 'travail au sol'], a: { kuzushi: 2, deplacement: 1.4, entree: 1.3 }, f: { kuzushi: 2.5, 'tsugi-ashi-arriere': 1.5, 'tsugi-ashi-avant': 1.5 } },
  { id: 'kelmendi', name: 'Majlinda Kelmendi', d: ['judo'], style: 'Championne olympique et double championne du monde des -52 kg. Les fiches travaillent la mobilité et les entrées enchaînées.', traits: ['-52 kg', 'pionnière du Kosovo', 'mobilité'], a: { deplacement: 1.8, uchikomi: 1.5, sabaki: 1.2 }, f: { 'tsugi-ashi-lateral': 2, 'uchikomi-seoi': 1.5, 'tai-sabaki': 1.3 } },
  { id: 'uta-abe', name: 'Uta Abe', d: ['judo'], style: 'Championne olympique des -52 kg et cinq fois championne du monde. Les fiches travaillent les entrées rapides après un déséquilibre.', traits: ['-52 kg', 'ippons', 'vitesse d’entrée'], a: { entree: 2, uchikomi: 1.6, kuzushi: 1.2 }, f: { 'uchikomi-seoi': 2, kuzushi: 1.8, 'tsugi-ashi-avant': 1.3 } },
  // ---------------------------------------------------------------- jiu-jitsu brésilien (travail solo)
  { id: 'roger-gracie', name: 'Roger Gracie', d: ['bjj'], style: 'Dix fois champion du monde, réputé pour la montée et l’étranglement croisé. Seul, on travaille les mouvements de base au sol qui y mènent : sorties de hanche, ponts et changements de base.', traits: ['montée', 'étranglement croisé', 'jeu au sol'], a: { base: 2, sortie: 1.5, cycle: 1.2 }, f: { 'changement-base': 2.5, pont: 1.5, 'sortie-hanche': 1.3 } },
  { id: 'marcelo-garcia', name: 'Marcelo Garcia', d: ['bjj'], style: 'A popularisé la garde X, l’arm drag et la guillotine haute. Seul, on travaille la mobilité de garde : rétention, sorties de hanche et relevé.', traits: ['garde X', 'arm drag', 'guillotine'], a: { garde: 2.4, mobilite: 1.4 }, f: { 'retention-garde': 3, 'sortie-hanche': 2 } },
  { id: 'rickson-gracie', name: 'Rickson Gracie', d: ['bjj'], style: 'Fils d’Hélio Gracie, invaincu en MMA, réputé pour son jeu au sol. Les fiches enchaînent les mouvements fondamentaux du sol.', traits: ['jeu au sol', 'invaincu en MMA', 'héritage Gracie'], a: { sortie: 1.6, mobilite: 1.6, base: 1.2 }, f: { pont: 2, 'sortie-hanche': 2, 'changement-base': 1.3 } },
  { id: 'buchecha', name: 'Marcus « Buchecha » Almeida', d: ['bjj'], style: 'Poids lourd sept fois champion du monde. Les fiches mettent l’accent sur le rythme : descentes, mouvements au sol et relevés enchaînés.', traits: ['poids lourd', 'soumissions', 'rythme'], a: { cycle: 2, mobilite: 1.6, base: 1.2 }, f: { 'changement-base': 1.5, 'releve-technique': 1.3, pont: 1.3 } },
  { id: 'gabi-garcia', name: 'Gabi Garcia', d: ['bjj'], style: 'Première femme quadruple championne ADCC. Les fiches travaillent la base et les sorties de dessous.', traits: ['grappling', 'ADCC', 'base solide'], a: { base: 1.8, sortie: 1.6 }, f: { 'changement-base': 2, pont: 2 } },
  { id: 'dern', name: 'Mackenzie Dern', d: ['bjj'], style: 'Double championne du monde de jiu-jitsu devenue championne UFC. Les fiches travaillent la garde et le retour debout.', traits: ['jiu-jitsu', 'garde', 'MMA'], a: { garde: 1.8, cycle: 1.5 }, f: { 'retention-garde': 2, 'releve-technique': 1.5, 'sortie-hanche': 1.5 } },
  { id: 'bia-mesquita', name: 'Beatriz « Bia » Mesquita', d: ['bjj'], style: 'Record de titres mondiaux chez les ceintures noires. Les fiches travaillent les fondamentaux du sol en continu.', traits: ['record de titres', 'fondamentaux', 'régularité'], a: { mobilite: 2, garde: 1.3, sortie: 1.3 }, f: { 'sortie-hanche': 2, 'retention-garde': 1.5, pont: 1.5 } },
  { id: 'ffion-davies', name: 'Ffion Davies', d: ['bjj'], style: 'Grappleuse galloise, championne du monde et championne ADCC. Les fiches travaillent la mobilité des hanches et les changements de position.', traits: ['grappling', 'pionnière galloise', 'mobilité'], a: { garde: 1.6, base: 1.6, mobilite: 1.3 }, f: { 'retention-garde': 1.8, 'changement-base': 1.8, 'sortie-hanche': 1.3 } },
];
