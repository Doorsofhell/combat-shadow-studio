import { describe, expect, test } from 'vitest';
import { get, set } from 'idb-keyval';

describe('migration interrompue', () => {
  test('une valeur déjà copiée n’est jamais écrasée et l’ancienne clé finit supprimée', async () => {
    await set('css-stats', 'ancienne');
    await set('u:local:css-stats', 'déjà copiée');
    await set('css-goals', 'objectifs');
    const { migrateLegacyKeys } = await import('../../store/storage');
    const r = await migrateLegacyKeys();
    expect(r.moved.sort()).toEqual(['css-goals', 'css-stats']);
    expect(await get('u:local:css-stats')).toBe('déjà copiée');
    expect(await get('u:local:css-goals')).toBe('objectifs');
    expect(await get('css-stats')).toBeUndefined();
  });
});
