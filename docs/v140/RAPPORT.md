# Version 1.4.0 : un seul écran coach, partout, et la pulsation

Demandes de Youssef (28/10/2026) :

- « L'écran du coach devrait être exactement le même module appelé partout et alimenté différemment en fonction du contexte, il ne faut pas le réécrire systématiquement » ;
- maquette https://claude.ai/artifact/Snot3vbYtk3Qc1kXWLfMt2, option A : « un toucher montre les commandes sans pause, le toucher suivant les cache » ;
- haut-parleur sous la vitesse et le plein écran, à droite du coach ;
- 13:20 : « J'ai l'impression d'avoir perdu les consignes vocales » ;
- 13:52 : « je valide tout, déploie » ;
- 15:03 : « Je ne retrouve pas les clignotement demandé. Ils sont où ? » ; 15:06 : « Pas besoin de dire voix coupée » ; 15:21 : choix « Contour lumineux ».

Point de restauration : `restauration/avant-v140` (= 1.3.0 fusionnée, d345e2a). Branche : `feature/ecran-coach-v140`.

## Ce qui change

- **Un seul module**, `src/ui/coach-screen/CoachScreen.tsx`, pour l'Accueil, la fiche technique, la séance et l'aperçu du combattant. Chaque écran lui donne son coach et ses commandes. Le module apporte le reste, à l'identique partout :
  - un toucher sur le coach montre les commandes dans sa zone, un deuxième toucher les cache ;
  - deux touchers rapides mettent le coach en plein écran ;
  - la reprise après une coupure 3D (`StageGuard`) et l'attente du chargement ;
  - l'astuce du double toucher, affichée une seule fois ;
  - le haut-parleur barré quand la voix est coupée.

  Une correction faite dans le module vaut pour les quatre écrans. Le composant `FullscreenStage`, qu'il remplace, est retiré.
- **Ce que chaque écran donne au module**

  | Écran | Commandes à droite | Angles (en haut à gauche) |
  |---|---|---|
  | Accueil | plein écran, haut-parleur | non |
  | Fiche technique | vitesse (×0,2 à ×1,2), plein écran, haut-parleur | 3/4, Face, Profil, 3/4 opposé |
  | Séance | pause, vitesse (×0,25 à ×1,5), zoom (selon la technique), plein écran, haut-parleur | Auto, Face, 3/4, Profil (les autres restent dans « Caméra ») |
  | Aperçu du combattant | plein écran | ses propres boutons de vue, autour de la scène comme avant |

- **Séance** : un toucher sur le coach ne met plus en pause, comme le prévoit l'option A. En 1.0.0, il mettait en pause. Il montre maintenant les commandes, la pause comprise, et la séance continue. Le gros bouton Pause reste en bas. Le plein écran garde son fonctionnement : le coach seul, et les commandes du bas qui s'effacent puis reviennent au toucher.
- **Fiche technique** : la vitesse et les angles passent dans la zone du coach. Sous le coach restent lecture et pause, et les deux marques de maîtrise. La scène gagne 60 px en hauteur.
- **Voix coupée** :
  - Constat après vérification : la 1.3.0 parle bien. Une séance enregistrée a donné « Prépare-toi », « 3, 2, 1 », « En garde », « Jab » et le point clé, au volume 100 %. La cause la plus probable est un toucher sur le haut-parleur : le son étant au maximum par défaut, le cran suivant est « coupé », et ce choix est gardé.
  - Correction :
    - quand la voix est coupée, un petit haut-parleur barré reste dans le coin du coach sur tous les écrans qui ont le son ;
    - le haut-parleur n'est plus visible au repos, ce qui limite les touchers par erreur ;
    - un message « Voix coupée » au départ de la séance a été essayé puis retiré à la demande de Youssef (« Pas besoin de dire voix coupée »).
- **Pulsation** :
  - Constat après vérification : la demande du 28/10 à 00:07 (« Toute l'interface doit pulser ou clignoter discrètement au rythme du bip du round ou de l'annonce vocale des combinaisons ») n'avait pas été codée. La maquette https://claude.ai/artifact/1KtQjVP1N5eDDgCDR3oDLR attendait un choix qui n'était jamais arrivé.
  - Correction : Youssef a choisi le contour lumineux. Pendant la séance, le bord de l'écran s'éclaire brièvement à chaque signal : gong de début et de fin, décompte, temps restant, coup annoncé (avec ou sans la voix). L'éclair prend la couleur du moment (ambre en préparation, rouge au travail, vert-bleu au repos) et ne prend jamais un toucher.
  - Sécurité : jamais plus de 3 éclairs par seconde (règle WCAG 2.3.1 contre les crises photosensibles). Un signal trop proche du précédent est ignoré (`src/ui/training/pulse.ts`). Si le système demande moins d'animations, l'éclair est plus doux.
  - Réglages › Pulsation pendant la séance : Contour lumineux (par défaut), Fond qui respire, Chrono seul ou Coupée, et l'intensité de 30 à 100 % (70 % par défaut). Les anciennes sauvegardes reçoivent ces valeurs sans perdre leurs autres choix.
- **Guide du Coach IA et Nouveautés** : le studio d'entraînement et la fiche d'une technique sont décrits avec les nouveaux gestes. Les Nouveautés ont leur entrée 1.4.0, et le numéro de version passe à 1.4.0.
- **Accessibilité** : un bouton « Afficher / Masquer les commandes du coach » fait la même chose qu'un toucher, au clavier et pour les lecteurs d'écran.

Fichiers :

- `src/ui/coach-screen/CoachScreen.tsx` et `coach-screen.css` (nouveaux) ;
- `src/ui/screens/Home.tsx`, `Library.tsx`, `Training.tsx` et `coach/Preview.tsx` ;
- `src/ui/components/Playback.tsx` (vitesse facultative) ;
- `src/ui/fullscreen/FullscreenStage.tsx` (`FullscreenStage` retiré) ;
- `src/ui/training/training.css` (styles déplacés dans le module) ;
- `src/ui/styles.css` (hauteur de la scène de la fiche) ;
- `src/ui/training/pulse.ts` (nouveau), `src/ui/training/useSession.ts` (signaux), `src/store/settings.ts` (`pulse`, `pulseIntensity`), `src/ui/screens/Settings.tsx`, `src/domain/search.ts` ;
- `src/coach/appGuide.ts`, `src/domain/releases.ts` et `package.json`.

## Défauts trouvés en vérifiant, et corrigés

- Sur l'Accueil, les commandes couvraient « Changer de coach ». Elles commencent maintenant sous ce bouton.
- La rangée des angles était placée au-dessus des consignes. En paysage, elle tombait au milieu de l'écran et bloquait le double toucher. Le test plein écran 740×360 l'a détecté. Elle est maintenant en haut à gauche.
- L'astuce du double toucher couvrait la rangée des angles. Elle est cachée tant que les commandes sont montrées.

## Captures

`docs/v140/captures/` : Accueil, fiche et séance, au repos et commandes montrées, plus un éclair du contour en séance (`seance-*-pulsation.png`), en mode nuit (`*-sombre-*`) et jour (`*-clair-*`, où la voix est coupée pour montrer le haut-parleur barré).

## Tests

Voir le journal `docs/JOURNAL_CORRECTIONS.md`, entrée 1.4.0.

Les tests suivants ont été adaptés au nouveau geste, sans retirer de vérification :

- `seance-mains-libres` : le toucher montre puis cache les commandes, et la pause passe par la commande ; tout le reste est inchangé ;
- `consignes-v130` et `corrections-v110` : ouvrent les commandes avant de toucher la vitesse, le plein écran, le haut-parleur ou les angles ;
- `navigation` : la version la plus récente est maintenant 1.4.0.

Nouveau test : `tests/e2e/ecran-coach-v140.spec.ts`. Il vérifie :

- le même module sur les 4 écrans, avec le toucher qui montre puis cache les commandes, dans la zone du coach ;
- la pause en séance ;
- les angles et la vitesse sur la fiche ;
- la voix coupée ;
- la lisibilité en mode jour et en mode nuit.

Nouveau test : `tests/e2e/pulsation-v140.spec.ts` (éclairs au décompte et aux coups, jamais moins de 1/3 s d'écart, réglages, coupure, jour et nuit) ; tests unitaires `src/ui/training/__tests__/pulse.test.ts` et `src/store/__tests__/settings.test.ts` (valeurs par défaut et anciennes sauvegardes).
