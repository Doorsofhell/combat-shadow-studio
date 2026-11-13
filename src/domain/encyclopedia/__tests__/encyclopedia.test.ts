import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PARTNER_TECHNIQUES } from '../../partner';
import { TECHNIQUE_BY_ID } from '../../techniques';
import { DISCIPLINES } from '../../types';
import { azIndex, coverage, encyclopediaSource, FAMILIES, findTerms, IMAGES, imageOf, normalize, TERM_BY_ID, TERMS } from '..';
import { RENDERS, SCENES } from '../images';

/** v0.46, « Encyclopédie du combat » §17: editorial checks of the base, then search and A–Z */
describe('encyclopédie : contrôles éditoriaux', () => {
  it('huit familles distinctes, chaque terme dans une famille et une sous-famille qui existent', () => {
    expect(FAMILIES.map((f) => f.id)).toEqual(['techniques', 'positions', 'equipements', 'lieux', 'regles', 'preparation', 'securite', 'culture']);
    for (const t of TERMS) {
      const f = FAMILIES.find((x) => x.id === t.family);
      expect(f, t.id).toBeDefined();
      expect(f!.subfamilies.map((s) => s.id), `${t.id} → ${t.sub}`).toContain(t.sub);
    }
    for (const f of FAMILIES) expect(TERMS.filter((t) => t.family === f.id).length, f.id).toBeGreaterThanOrEqual(5);
  });

  it('aucun identifiant dupliqué, aucun nom en double', () => {
    const ids = TERMS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = TERMS.map((t) => normalize(t.name));
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it('un alias ne désigne qu’une notion : pas de synonyme partagé par deux fiches, ni identique au nom d’une autre', () => {
    const owner = new Map<string, string>();
    for (const t of TERMS) owner.set(normalize(t.name), t.id);
    const clash: string[] = [];
    for (const t of TERMS)
      for (const a of [t.intl ?? '', ...(t.aliases ?? [])].filter(Boolean)) {
        const k = normalize(a);
        const o = owner.get(k);
        if (o && o !== t.id) clash.push(`${a} : ${o} et ${t.id}`);
        else owner.set(k, t.id);
      }
    expect(clash).toEqual([]);
  });

  it('aucun lien interne invalide : termes associés, techniques et fiches à deux de l’application', () => {
    const partner = new Set(PARTNER_TECHNIQUES.map((p) => p.id));
    const bad: string[] = [];
    for (const t of TERMS) {
      for (const r of t.related ?? []) if (!TERM_BY_ID.has(r) || r === t.id) bad.push(`${t.id} → ${r}`);
      for (const x of t.techniques ?? []) if (!TECHNIQUE_BY_ID.has(x)) bad.push(`${t.id} → technique ${x}`);
      for (const x of t.partner ?? []) if (!partner.has(x)) bad.push(`${t.id} → partenaire ${x}`);
    }
    expect(bad).toEqual([]);
  });

  it('une technique de l’application n’est expliquée que par une seule fiche (pas de copie)', () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const t of TERMS)
      for (const x of t.techniques ?? []) {
        if (t.family === 'preparation') continue; // a training notion may list the drills it groups
        if (seen.has(x)) dup.push(`${x} : ${seen.get(x)} et ${t.id}`);
        seen.set(x, t.id);
      }
    expect(dup).toEqual([]);
  });

  it('aucune source inventée : chaque source citée existe, avec URL et date de consultation', () => {
    const bad: string[] = [];
    for (const t of TERMS) {
      expect(t.sources.length, t.id).toBeGreaterThan(0);
      for (const id of t.sources) {
        const s = encyclopediaSource(id);
        if (!s || !/^https:\/\//.test(s.url) || !/^\d{4}-\d{2}-\d{2}$/.test(s.consulted)) bad.push(`${t.id} → ${id}`);
      }
      // a reference written in a text, « (enc-IFMA) », must also be in the term's sources
      const txt = JSON.stringify(t);
      for (const m of txt.matchAll(/\((?:art\.[^)]*|section[^)]*)?((?:enc|boxe|kbmt|mma|jb|prog)-[\w-]+)\)/g)) if (!t.sources.includes(m[1])) bad.push(`${t.id} cite ${m[1]} sans le lister`);
    }
    expect(bad).toEqual([]);
  });

  it('aucun contenu marqué validé sans relecteur ; date de vérification présente', () => {
    for (const t of TERMS) {
      expect(t.checked, t.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (t.status === 'validee') expect(t.reviewedBy, t.id).toBeTruthy();
    }
  });

  it('aucune image sans provenance ou statut, et chaque rendu existe sur le disque (image et miniature)', () => {
    const missing: string[] = [];
    for (const t of TERMS) {
      const img = imageOf(t.image);
      expect(img, `${t.id} → ${t.image}`).toBeDefined();
    }
    for (const f of FAMILIES) expect(imageOf(f.image), f.id).toBeDefined();
    for (const img of IMAGES.values()) {
      expect(img.alt, img.id).toBeTruthy();
      if (img.origin.kind === 'rendu-3d') {
        expect(img.file, img.id).toBeTruthy();
        for (const suffix of ['.webp', '-mini.webp']) {
          const p = resolve(__dirname, '../../../../public/encyclopedie', `${img.file}${suffix}`);
          if (!existsSync(p)) missing.push(`${img.file}${suffix}`);
        }
      } else expect(img.origin.brief.length, img.id).toBeGreaterThan(20);
    }
    expect(missing).toEqual([]);
  });

  it('chaque rendu part d’une technique qui existe, chaque scène a un nom', () => {
    for (const r of RENDERS) expect(TECHNIQUE_BY_ID.has(r.tech), r.id).toBe(true);
    for (const s of SCENES) expect(s.scene, s.id).toBeTruthy();
  });

  it('les six disciplines sont couvertes', () => {
    const c = coverage();
    for (const d of DISCIPLINES) expect(c.byDiscipline.find((x) => x.d === d.id)!.count, d.id).toBeGreaterThanOrEqual(15);
    expect(c.total).toBe(TERMS.length);
    expect(c.reviewed).toBe(0);
  });

  it('les équipements ne sont pas des techniques, les lieux ont leur propre famille', () => {
    expect(TERM_BY_ID.get('gants-boxe')!.family).toBe('equipements');
    expect(TERM_BY_ID.get('cage')!.family).toBe('lieux');
    expect(findTerms({ family: 'techniques' }).some((t) => t.family !== 'techniques')).toBe(false);
  });

  it('« The Octagon » n’est pas présenté comme un terme générique', () => {
    const cage = TERM_BY_ID.get('cage')!;
    expect(JSON.stringify(cage)).toMatch(/marque déposée de l’UFC/);
    expect(TERMS.some((t) => normalize(t.name) === 'octagon' || normalize(t.name) === 'the octagon')).toBe(false);
  });
});

describe('encyclopédie : recherche, filtres et index A–Z', () => {
  const first = (q: string, f = {}) => findTerms({ query: q, ...f })[0]?.id;

  it('par nom français, nom international, synonymes, traductions', () => {
    expect(first('jab')).toBe('jab');
    expect(first('Direct arrière')).toBe('direct');
    expect(first('cross')).toBe('direct');
    expect(first('southpaw')).toBe('gaucher');
    expect(first('mata leão')).toBe('etranglement-arriere');
    expect(first('hadaka-jime')).toBe('etranglement-arriere');
    expect(first('roundhouse')).toBe('circulaire');
    expect(first('armbar')).toBe('cle-de-bras');
  });

  it('accents, tirets et espaces normalisés', () => {
    expect(first('echauffement')).toBe('echauffement');
    expect(first('ÉCHAUFFEMENT')).toBe('echauffement');
    expect(first('kouchi gari')).toBe('ko-uchi-gari');
    expect(first('ko uchi')).toBe('ko-uchi-gari');
    expect(first('highkick')).toBe('high-kick');
    expect(first('pattes d ours')).toBe('pattes-ours');
  });

  it('par description et par discipline', () => {
    expect(findTerms({ query: 'carotides' }).map((t) => t.id)).toContain('etranglement-arriere');
    expect(findTerms({ query: 'boxe thai' }).length).toBeGreaterThan(5);
  });

  it('les filtres se combinent : famille, sous-famille, discipline et recherche', () => {
    const r = findTerms({ family: 'techniques', sub: 'pieds', discipline: 'muaythai' });
    expect(r.length).toBeGreaterThan(3);
    expect(r.every((t) => t.family === 'techniques' && t.sub === 'pieds' && t.disciplines.includes('muaythai'))).toBe(true);
    expect(findTerms({ family: 'equipements', query: 'jab' })).toEqual([]);
    expect(findTerms({ family: 'regles', discipline: 'judo' }).map((t) => t.id)).toContain('ippon');
    expect(findTerms({ family: 'regles', discipline: 'boxe' }).map((t) => t.id)).not.toContain('ippon');
  });

  it('l’index A–Z ne liste que des lettres présentes et inclut les alias', () => {
    const az = azIndex();
    for (const [l, list] of az) {
      expect(l).toMatch(/^[A-Z]$/);
      expect(list.length).toBeGreaterThan(0);
      for (const e of list) expect(normalize(e.label).charAt(0).toUpperCase()).toBe(l);
    }
    expect(az.get('E')!.some((e) => e.term.id === 'echauffement' && !e.alias)).toBe(true);
    expect(az.get('C')!.some((e) => normalize(e.label) === 'cross' && e.term.id === 'direct' && e.alias)).toBe(true);
    const all = [...az.values()].flat();
    for (const t of TERMS) expect(all.some((e) => e.term.id === t.id && !e.alias), t.id).toBe(true);
  });
});
