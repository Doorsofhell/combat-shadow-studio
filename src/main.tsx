import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// bundled fonts (offline, no CDN): Rajdhani for titles and figures, Inter for text
import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/rajdhani/latin-700.css';
import '@fontsource-variable/inter';
import './ui/styles.css';

const isLab = location.hash.startsWith('#/lab');

async function boot() {
  const root = createRoot(document.getElementById('root')!);
  if (isLab) {
    // developer view used for visual checks
    const { Lab } = await import('./ui/Lab');
    root.render(<Lab />);
    return;
  }
  // 2.9.0: the preview build only (VITE_PREMIUM_SIMULATION=1) can simulate Gratuit / Premium / Expiré; the production
  // build drops this branch and the module entirely
  if (import.meta.env.VITE_PREMIUM_SIMULATION === '1') (await import('./monetization/simulation')).installSimulation();
  const { App } = await import('./ui/App');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
boot();
