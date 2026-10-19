import { createRoot } from 'react-dom/client';
import { DISCIPLINES } from '../../src/domain/types';
import { AppIcon, DisciplineIcon, ICON_REGISTRY, type GlyphId, type IconTone } from '../../src/ui/icons';
import '../../src/ui/styles.css';

/** Reference page of the icon charter: every icon, every size, both themes. Dev only (not shipped). */
const SIZES = [24, 32, 48, 64, 96, 128];
const ids = Object.keys(ICON_REGISTRY) as GlyphId[];
const tones: IconTone[] = ['neutral', 'muted', 'accent', 'gold'];

function Board({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <div data-board={theme} style={{ background: 'var(--bg)', color: 'var(--ink)', padding: 16 }}>
      <h2 style={{ margin: '0 0 8px', font: '600 15px Inter, sans-serif' }}>Disciplines ({theme})</h2>
      {DISCIPLINES.map((d) => (
        <div key={d.id} style={{ display: 'flex', alignItems: 'end', gap: 14, marginBottom: 8 }}>
          {SIZES.map((s) => (
            <DisciplineIcon key={s} id={d.id} size={s} />
          ))}
          <span style={{ font: '13px Inter, sans-serif' }}>{d.name}</span>
        </div>
      ))}
      <h2 style={{ margin: '16px 0 8px', font: '600 15px Inter, sans-serif' }}>Interface</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {ids.map((id) => (
          <div key={id} style={{ display: 'flex', gap: 6, alignItems: 'center', font: '11px Inter, sans-serif' }}>
            <AppIcon id={id} size={20} tone="neutral" />
            <AppIcon id={id} size={32} tone={tones[ids.indexOf(id) % 4]} />
            <span className="muted">{id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Themed({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <div className={theme === 'dark' ? 'dark-scope' : 'light-board'}>
      <Board theme={theme} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
    <Themed theme="dark" />
    <Themed theme="light" />
  </div>,
);
