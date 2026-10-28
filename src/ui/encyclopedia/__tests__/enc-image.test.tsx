import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { EncImage } from '../Encyclopedia';

// 1.4.1 Every term has its illustration now (the e2e test checks a picture that cannot load). The case of a term
// whose illustration is still to make stays covered here: it is announced in words, never a silent pictogram.
let root: Root | null = null;
let host: HTMLDivElement | null = null;
function mount(node: React.ReactNode) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(node));
  return host;
}
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
});

describe('illustration de l’encyclopédie', () => {
  it('une illustration pas encore produite est annoncée, jamais remplacée par un pictogramme muet', () => {
    const el = mount(<EncImage id="terme-sans-illustration" />);
    const missing = el.querySelector('[data-testid="enc-img-missing"]')!;
    expect(missing).not.toBeNull();
    expect(missing.textContent).toContain('Illustration à produire');
    expect(missing.getAttribute('aria-label')).toMatch(/illustration à produire/i);
    expect(missing.getAttribute('role')).toBe('img');
  });

  it('une illustration produite est une vraie image décrite', () => {
    const el = mount(<EncImage id="tech-kesa-gatame" />);
    const img = el.querySelector('img[data-testid="enc-img"]') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toContain('encyclopedie/tech-kesa-gatame.webp');
    expect(img.alt).toContain('Kesa-gatame');
  });
});
