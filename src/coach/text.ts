/**
 * Outils de texte du coach IA : normalisation (minuscules, sans accents, sans ponctuation),
 * découpage en mots, mots vides français et racinisation légère pour la recherche.
 */

/** minuscules, accents retirés, apostrophes et ponctuation remplacées par des espaces */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[’'`´‘]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set(
  (
    'a ai as au aux avec ce ces cet cette c ca d dans de des du elle elles en es est et etre eu il ils je j l la le les leur leurs lui ma mais me meme mes moi mon n ne nos notre nous on ou par pas pour qu que qui s sa se ses si son sur t ta te tes toi ton tu un une vos votre vous y ' +
    'dois doit dois faut faire fais fait peux peut quel quelle quels quelles quoi comment pourquoi est-ce bien tres plus moins tout tous toute toutes alors donc quand comme sans sous entre vers chez ' +
    'cela ceci celui celle ici la-bas oui non stp svp merci bon bonne coach'
  ).split(/\s+/),
);

/** racine grossière : pluriel et terminaisons courantes retirés, puis 6 lettres au plus
 *  (pivot / pivoter, hanche / hanches, respiration / respirer ; round ≠ roundhouse) */
export function stem(w: string): string {
  let x = w;
  if (x.length > 3 && /[sx]$/.test(x)) x = x.slice(0, -1);
  for (const suf of ['ement', 'ment', 'er', 'ez', 'e']) {
    if (x.length - suf.length >= 4 && x.endsWith(suf)) {
      x = x.slice(0, -suf.length);
      break;
    }
  }
  return x.length > 6 ? x.slice(0, 6) : x;
}

/** mots utiles d’une phrase, racinisés */
export function terms(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map(stem);
}

/** hachage FNV-1a : choix déterministes (formulations, rotation des suggestions) */
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** vrai si l’expression (déjà normalisée) apparaît comme suite de mots entiers */
export function hasPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

export function hasAny(text: string, phrases: string[]): boolean {
  return phrases.some((p) => hasPhrase(text, p));
}

/** vrai si un mot du texte commence par l’un des préfixes */
export function hasPrefix(text: string, prefixes: string[]): boolean {
  const words = text.split(' ');
  return prefixes.some((p) => words.some((w) => w.startsWith(p)));
}
