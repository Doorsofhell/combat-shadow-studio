import { describe, expect, test } from 'vitest';
import { RELEASES } from './releases';
import pkg from '../../package.json';

describe('versioning et nouveautés (v1.37.3+)', () => {
  test('la première entrée de Nouveautés porte la version publiée dans package.json', () => {
    expect(RELEASES[0]?.version).toBe(pkg.version);
  });
  test('pas de version de nouveautés en double', () => {
    const versions = RELEASES.map((r) => r.version);
    expect(new Set(versions).size).toBe(versions.length);
  });
});
