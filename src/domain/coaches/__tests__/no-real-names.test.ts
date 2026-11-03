import { describe, expect, test } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Decision of 2026-10-19: the champions who inspired the coaches are named in the design documents only,
 * never in the application. Every reference of tools/generator/coaches/design.py is searched in the
 * application's sources (surname, and the full name).
 */
const ROOT = resolve(__dirname, '../../../..');
const design = readFileSync(join(ROOT, 'tools/generator/coaches/design.py'), 'utf8');
const refs = [...design.matchAll(/^coach\('[^']+', '[^']+', '[^']+', '([^']+)'/gm)].map((m) => m[1]);

function files(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (f !== '__tests__') files(p, out);
    } else if (/\.(tsx?|json|css|html)$/.test(f)) out.push(p);
  }
  return out;
}

describe('noms des champions de référence', () => {
  test('les 36 références sont lues', () => expect(refs.length).toBe(36));

  test('aucun n’apparaît dans le code de l’application', () => {
    // the existing "Légendes" section (src/domain/champions*) presents real champions with sources on purpose
    const src = files(join(ROOT, 'src')).filter((f) => !/champions|legends|legendes/i.test(f));
    const text = src.map((f) => [f, readFileSync(f, 'utf8')] as const);
    const hits: string[] = [];
    for (const r of refs) {
      // Thai ring names end with the gym's name (Fairtex is also a cited equipment brand): full name only
      const surname = /fairtex$/i.test(r) ? r : r.split(' ').slice(-1)[0];
      const re = new RegExp(`\\b(${r}|${surname})\\b`, 'i');
      for (const [f, t] of text) if (re.test(t)) hits.push(`${r} → ${f.slice(ROOT.length + 1)}`);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
