import { describe, expect, test } from 'vitest';
import { TOMBSTONE_TTL, emptyDoc, materialize, mergeDocs, sameDoc, stableStringify, track } from '../sync/model';
import type { SyncDoc } from '../sync/model';

const T0 = 1_800_000_000_000;
const snap = (fields: Record<string, unknown> = {}, items: Record<string, unknown> = {}) => ({ fields, items });

describe('suivi des changements locaux', () => {
  test('horodate les champs et éléments modifiés, crée des pierres tombales', () => {
    const a = track(null, snap({ pseudo: 'Yan' }, { s1: { t: 1 }, s2: { t: 2 } }), 'c', T0).doc;
    expect(a.fields.pseudo).toEqual({ value: 'Yan', updatedAt: T0 });
    expect(a.items.s1.updatedAt).toBe(T0);
    const b = track(a, snap({ pseudo: 'Yan' }, { s1: { t: 1 }, s2: { t: 3 } }), 'c', T0 + 10);
    expect(b.changed).toBe(true);
    expect(b.doc.fields.pseudo.updatedAt).toBe(T0); // unchanged field keeps its stamp
    expect(b.doc.items.s1.updatedAt).toBe(T0);
    expect(b.doc.items.s2.updatedAt).toBe(T0 + 10);
    const c = track(b.doc, snap({ pseudo: 'Yan' }, { s2: { t: 3 } }), 'c', T0 + 20).doc;
    expect(c.items.s1).toEqual({ updatedAt: T0 + 20, deleted: true });
    expect(materialize(c).items).toEqual({ s2: { t: 3 } });
    expect(track(c, snap({ pseudo: 'Yan' }, { s2: { t: 3 } }), 'c', T0 + 30).changed).toBe(false);
  });

  test('l’horloge ne recule jamais, même si l’appareil a une heure en retard', () => {
    const a = track(null, snap({ x: 1 }), 'c', T0).doc;
    const b = track(a, snap({ x: 2 }), 'c', T0 - 60_000).doc; // clock went back one minute
    expect(b.fields.x.updatedAt).toBe(T0 + 1);
  });

  test('l’ordre des clés ne compte pas comme un changement', () => {
    const a = track(null, snap({ o: { a: 1, b: 2 } }), 'c', T0).doc;
    expect(track(a, snap({ o: { b: 2, a: 1 } }), 'c', T0 + 5).changed).toBe(false);
    expect(stableStringify({ b: 1, a: [1, { d: 1, c: 2 }] })).toBe('{"a":[1,{"c":2,"d":1}],"b":1}');
  });
});

describe('fusion et résolution des conflits', () => {
  const doc = (fields: SyncDoc['fields'], items: SyncDoc['items']): SyncDoc => ({ ...emptyDoc('c'), updatedAt: T0, fields, items });

  test('dernier écrit gagne, champ par champ (profil)', () => {
    const phone = doc({ pseudo: { value: 'Yan', updatedAt: T0 + 5 }, weightKg: { value: 70, updatedAt: T0 } }, {});
    const web = doc({ pseudo: { value: 'Yanis', updatedAt: T0 + 1 }, weightKg: { value: 72, updatedAt: T0 + 9 } }, {});
    const m = mergeDocs(phone, web, T0 + 10);
    expect(materialize(m).fields).toEqual({ pseudo: 'Yan', weightKg: 72 });
  });

  test('dernier écrit gagne, élément par élément ; les ajouts des deux côtés sont gardés', () => {
    const a = doc({}, { s1: { updatedAt: T0, data: 'a1' }, s2: { updatedAt: T0 + 5, data: 'a2' } });
    const b = doc({}, { s2: { updatedAt: T0 + 3, data: 'b2' }, s3: { updatedAt: T0, data: 'b3' } });
    expect(materialize(mergeDocs(a, b, T0)).items).toEqual({ s1: 'a1', s2: 'a2', s3: 'b3' });
  });

  test('une suppression plus récente gagne sur une modification plus ancienne, et inversement', () => {
    const del = doc({}, { f1: { updatedAt: T0 + 5, deleted: true } });
    const edit = doc({}, { f1: { updatedAt: T0 + 2, data: 'v2' } });
    expect(materialize(mergeDocs(del, edit, T0)).items).toEqual({});
    const lateEdit = doc({}, { f1: { updatedAt: T0 + 8, data: 'v3' } });
    expect(materialize(mergeDocs(del, lateEdit, T0)).items).toEqual({ f1: 'v3' });
  });

  test('égalité parfaite : la suppression gagne, sinon choix déterministe', () => {
    const del = doc({}, { f1: { updatedAt: T0, deleted: true } });
    const edit = doc({}, { f1: { updatedAt: T0, data: 'x' } });
    expect(mergeDocs(del, edit, T0).items.f1.deleted).toBe(true);
    expect(mergeDocs(edit, del, T0).items.f1.deleted).toBe(true);
    const x = doc({ p: { value: 'a', updatedAt: T0 } }, {});
    const y = doc({ p: { value: 'b', updatedAt: T0 } }, {});
    expect(mergeDocs(x, y, T0).fields.p.value).toBe(mergeDocs(y, x, T0).fields.p.value);
  });

  test('fusion commutative, associative et idempotente (convergence)', () => {
    const rand = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const r = rand(42);
    const gen = () => {
      const items: SyncDoc['items'] = {};
      const fields: SyncDoc['fields'] = {};
      for (let i = 0; i < 8; i++) if (r() < 0.6) items[`i${i}`] = r() < 0.3 ? { updatedAt: T0 + Math.floor(r() * 5), deleted: true } : { updatedAt: T0 + Math.floor(r() * 5), data: Math.floor(r() * 3) };
      for (let i = 0; i < 4; i++) if (r() < 0.7) fields[`f${i}`] = { value: Math.floor(r() * 3), updatedAt: T0 + Math.floor(r() * 5) };
      return doc(fields, items);
    };
    for (let n = 0; n < 200; n++) {
      const [a, b, c] = [gen(), gen(), gen()];
      expect(sameDoc(mergeDocs(a, b, T0), mergeDocs(b, a, T0))).toBe(true);
      expect(sameDoc(mergeDocs(mergeDocs(a, b, T0), c, T0), mergeDocs(a, mergeDocs(b, c, T0), T0))).toBe(true);
      expect(sameDoc(mergeDocs(a, a, T0), a)).toBe(true);
    }
  });

  test('les pierres tombales trop anciennes sont purgées', () => {
    const a = doc({}, { old: { updatedAt: T0, deleted: true }, recent: { updatedAt: T0 + TOMBSTONE_TTL, deleted: true } });
    const m = mergeDocs(a, emptyDoc('c'), T0 + TOMBSTONE_TTL + 1);
    expect(Object.keys(m.items)).toEqual(['recent']);
  });

  test('scénario deux appareils hors ligne : chacun modifie, la fusion garde le plus récent de chaque élément', () => {
    const base = track(null, snap({ goal: 60 }, { c1: 'combo 1', c2: 'combo 2' }), 'c', T0).doc;
    const phone = track(base, snap({ goal: 90 }, { c1: 'combo 1 modifié', c2: 'combo 2' }), 'c', T0 + 100).doc; // edit c1, goal 90
    const tablet = track(base, snap({ goal: 60 }, { c1: 'combo 1', c3: 'combo 3' }), 'c', T0 + 200).doc; // delete c2, add c3
    const m = mergeDocs(phone, tablet, T0 + 300);
    expect(materialize(m)).toEqual({ fields: { goal: 90 }, items: { c1: 'combo 1 modifié', c3: 'combo 3' } });
  });
});
