/**
 * 0.27 (Youssef, 2026-10-20 22:00 : « Les questions pré-programmées IA doivent être diverses et variées ») :
 * quelques entrées générales de plus pour la FAQ du coach (mental, régularité, objectifs), afin que les
 * questions suggérées sur ces thèmes aient une vraie réponse. Conseils généraux et prudents, tels
 * qu’on les donne en club : aucune technique, aucun chiffre médical.
 */
import type { Faq } from './knowledge';

export const MORE_FAQ: Faq[] = [
  {
    id: 'faq:motivation',
    title: 'Rester motivé',
    text: 'La motivation suit souvent les progrès qu’on voit : fixe-toi un petit objectif par séance (un geste plus propre, un round de plus), note ce que tu as réussi et garde des séances courtes mais régulières. Les jours sans envie, une séance de dix minutes vaut mieux que rien : l’envie revient souvent en cours de route.',
    simple: 'Vise petit et régulier : un objectif simple par séance, des séances courtes, et regarde le chemin parcouru dans Progrès. Les jours sans envie, fais juste dix minutes.',
    nuance: 'Varie le contenu (nouvelle combinaison, rounds plus courts et plus intenses, travail défensif) pour garder de la nouveauté sans tout changer à chaque fois.',
    tags: ['motivation', 'motive', 'motiver', 'envie', 'flemme', 'demotive', 'mental', 'moral', 'mindset', 'continuer', 'abandonner', 'courage'],
    related: [],
  },
  {
    id: 'faq:regularite',
    title: 'S’entraîner régulièrement',
    text: 'La régularité compte plus que l’intensité : plusieurs séances courtes dans la semaine font souvent plus progresser qu’une grosse séance de temps en temps. Alterne des séances plus intenses et plus légères, et écoute ta fatigue.',
    simple: 'Mieux vaut un peu, souvent : plusieurs petites séances dans la semaine plutôt qu’une très longue de temps en temps.',
    tags: ['regularite', 'régularité', 'regulier', 'frequence', 'fréquence', 'par semaine', 'souvent', 'routine', 'habitude', 'planning'],
    related: [],
  },
  {
    id: 'faq:plateau',
    title: 'Quand on stagne',
    text: 'Stagner fait partie de l’apprentissage : le progrès vient souvent par paliers. Reviens quelques séances aux bases au ralenti (garde, jab, direct, déplacements), change un seul paramètre à la fois (vitesse, durée des rounds, nouvelle combinaison) et compare avec tes séances précédentes dans Progrès.',
    simple: 'C’est normal de stagner un peu. Reviens aux bases au ralenti, change une seule chose à la fois, et regarde tes séances passées dans Progrès.',
    tags: ['stagner', 'stagne', 'plateau', 'palier', 'paliers', 'bloque', 'decourage', 'découragé', 'impression'],
    related: [],
  },
  {
    id: 'faq:objectif-seance',
    title: 'Un objectif par séance',
    text: 'Un bon objectif de séance est précis et vérifiable : « garder le menton rentré sur toutes mes séries », « revenir en garde après chaque coup », « tenir trois rounds sans baisser les mains ». Un seul objectif à la fois suffit : tu sais à la fin si tu l’as atteint.',
    simple: 'Choisis une seule chose précise à réussir pendant la séance, par exemple « mains hautes tout le temps ». À la fin, tu sais si c’est réussi.',
    tags: ['objectif de seance', 'objectif', 'but', 'se fixer', 'fixer', 'concentrer', 'concentration', 'focus', 'precis'],
    related: [],
  },
];
