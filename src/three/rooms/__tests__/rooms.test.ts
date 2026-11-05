import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { Color } from 'three';
import { ROOMS, ROOM_RADIUS, roomFor, swingAngle, type RoomData } from '../rooms';

/** 1.23 Salles immersives: every room the app can show has its pictures, stays light enough for a phone, never
 * hides the coach and lights him more than its background */
const PUBLIC = resolve(__dirname, '../../../../public');
const specs = Object.values(ROOMS);

describe('salles immersives', () => {
  it('au moins la boxe et le MMA ont leur salle', () => {
    expect(roomFor('boxe')?.id).toBe('boxe');
    expect(roomFor('mma')?.id).toBe('mma');
  });

  for (const spec of specs) {
    describe(spec!.name, () => {
      const dir = resolve(PUBLIC, 'salles', spec!.id);
      const data = existsSync(resolve(dir, 'salle.json')) ? (JSON.parse(readFileSync(resolve(dir, 'salle.json'), 'utf8')) as RoomData) : null;

      it('toutes ses images sont là, au poids prévu pour un téléphone', () => {
        expect(data).not.toBeNull();
        const size = (f: string) => statSync(resolve(dir, f)).size;
        expect(size('fond.webp')).toBeLessThan(2.5 * 1024 * 1024);
        expect(size('fond-2k.webp')).toBeLessThan(900 * 1024);
        expect(size('lumieres.webp')).toBeLessThan(200 * 1024);
        for (const s of data!.sprites) expect(size(`sprite-${s}.webp`)).toBeLessThan(300 * 1024);
        // the picture is a 2:1 panorama (WebP header: width and height after 'VP8 ' / 'VP8L' / 'VP8X')
        expect(data!.eye).toBe(1.4);
      });

      it('les sacs suspendus ne passent jamais entre la caméra et le coach', () => {
        for (const p of data!.props) {
          expect(data!.sprites).toContain(p.sprite);
          // the teaching camera stays within 5 m of the coach: the segment camera → coach never reaches 5.5 m
          expect(Math.hypot(p.at[0], p.at[2]) - p.w / 2).toBeGreaterThan(5.5);
          // hanging above the floor, under the ceiling, inside the dome
          expect(p.at[1] - p.h / 2).toBeGreaterThan(0.2);
          expect(Math.hypot(p.at[0], p.at[2])).toBeLessThan(ROOM_RADIUS - 5);
        }
      });

      it('le coach est mieux éclairé que le fond (lumière principale et contour)', () => {
        const lum = (c: string) => {
          const k = new Color(c);
          return 0.2126 * k.r + 0.7152 * k.g + 0.0722 * k.b;
        };
        expect(lum(spec!.background)).toBeLessThan(0.06);
        expect(spec!.key.intensity).toBeGreaterThanOrEqual(2.5);
        expect(spec!.rim.intensity).toBeGreaterThanOrEqual(1.5);
        // the rim light comes from behind the coach (negative z: the camera looks from +z)
        expect(spec!.rim.pos[2]).toBeLessThan(0);
        expect(spec!.key.pos[1]).toBeGreaterThan(3);
      });
    });
  }

  it('les sacs se balancent doucement, sans à-coup', () => {
    let prev = swingAngle(0, 1.5, 1);
    let max = 0;
    for (let t = 0; t < 120; t += 1 / 60) {
      const a = swingAngle(t, 1.5, 1);
      max = Math.max(max, Math.abs(a));
      // at 60 images per second the angle never jumps by more than 0.2°
      expect(Math.abs(a - prev)).toBeLessThan((0.2 * Math.PI) / 180);
      prev = a;
    }
    expect(max).toBeGreaterThan((0.4 * Math.PI) / 180);
    expect(max).toBeLessThan((3.2 * Math.PI) / 180);
  });
});
