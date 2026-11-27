# Product

<!-- impeccable:product-schema 1 -->

> Rédigé par Claude selon la méthode « impeccable init », 27 novembre 2026 (version 2.11.1).
> Les points marqués **[À CONFIRMER]** sont des déductions à valider par Youssef.

## Platform

web

(PWA React installable, aussi emballée en application Android avec Capacitor. L'interface reste
une interface web et ne suit pas le langage natif Android.)

## Users

Une personne qui s'entraîne seule, chez elle ou en salle, sans partenaire, en suivant un coach 3D
à l'écran. Du débutant complet à l'expert, sur six disciplines. **[À CONFIRMER]** Profil principal
visé : pratiquant débutant ou intermédiaire qui veut progresser en autonomie, téléphone posé devant lui.

## Product Purpose

Guider un entraînement de shadow boxing solo : un coach 3D réaliste montre chaque technique et
chaque enchaînement, au bon rythme, avec chrono, rounds et consignes, puis l'app mesure le temps
réel d'entraînement et la progression. Réussite : la personne sait ce qu'elle doit faire à chaque
instant de la séance, sans lire, et voit honnêtement ses progrès.

## Positioning

Six disciplines (boxe anglaise, kick-boxing, muay-thaï, MMA, jiu-jitsu brésilien, judo) jouées par
un coach 3D animé par un moteur biomécanique propre (cinématique inverse, équilibre, chaîne
cinétique), dont les techniques sont sourcées (fédérations, ouvrages), et 1 496 combinaisons
inspirées de 107 légendes. Tout fonctionne hors ligne, sans compte, données sur l'appareil.

## Operating Context

- Séance debout, à 1,5–3 m de l'écran, souvent téléphone ou tablette posé : gros éléments lisibles
  de loin, peu de gestes pendant l'effort, coach grand au centre.
- Hors séance : choix discipline, niveau, exercice ou programme ; bibliothèque de techniques
  (fiche, lecture 3D, décomposition) ; Légendes ; Progrès ; Coach IA local.
- Voix française (synthèse vocale) pendant la séance.

## Capabilities and Constraints

- 91 techniques, 254 exercices, 49 programmes, 4 niveaux, 6 coachs 3D (Kadir, Naël, Victor, Amara,
  Inaya, Kanya), modes libre, technique, cardio, rounds, programme, personnalisé.
- Une technique commune à plusieurs disciplines reste une seule définition.
- Kick-boxing : trois styles (K1, low kick, full contact).
- Ressources libres seulement (CC0 ou MIT), rien d'acheté, pas de CC-BY.
- Performance mobile Android obligatoire ; reprise après perte du contexte WebGL.
- Interface et textes 100 % en français, ton pédagogique et simple pour débutants.
- Version affichée dans le titre, note de version à chaque livraison.

## Brand Commitments

- Nom : Combat Shadow Studio, logo « CS ».
- Coachs : identités, visages, coiffures, morphologies et tenues validés, à ne pas changer sans raison.
- Ton : coach bienveillant, clair, jamais de jargon non expliqué.

## Evidence on Hand

- Catalogues réels dans `src/domain/` ; sources biomécaniques dans `docs/audit-biomecanique/`.
- Pas de témoignages, d'avis, de chiffres d'utilisateurs ni de statistiques inventées : ne jamais
  en fabriquer. Pas de faux boutons de connexion.

## Product Principles

1. Le coach d'abord : pendant la séance, l'écran sert le coach et le mouvement en cours, rien d'autre.
2. Vrai et vérifiable : techniques sourcées, statistiques calculées sur l'activité réelle, jamais inventées.
3. Simple pour un débutant : écrans dégagés, sans défilement quand c'est possible, textes courts.
4. Améliorer sans casser : chaque changement est testé et réversible.
5. Hors ligne et privé : tout marche sans réseau ni compte.

## Accessibility & Inclusion

Contraste WCAG AA, sélection jamais indiquée par la couleur seule, grandes cibles tactiles
(utilisation en mouvement, de loin). **[À CONFIRMER]** Autres besoins particuliers.
