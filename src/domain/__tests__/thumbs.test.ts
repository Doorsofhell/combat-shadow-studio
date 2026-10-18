import { describe, expect, it } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { TECHNIQUES } from '../techniques';

// every technique card shows a picture of the coach chosen by the user (homme or femme)
describe('images des techniques', () => {
  for (const coach of ['homme', 'femme'])
    it(`une image par technique pour le coach ${coach}`, () => {
      const missing = TECHNIQUES.filter((t) => {
        const f = resolve(__dirname, `../../../public/thumbs/${coach}/${t.id}.webp`);
        return !existsSync(f) || statSync(f).size < 2000;
      }).map((t) => t.id);
      expect(missing).toEqual([]);
    });
});
