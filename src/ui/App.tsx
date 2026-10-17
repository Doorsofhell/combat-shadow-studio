import { Suspense, lazy, useEffect } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useSettings } from '../store/settings';
import { setEffectsVolume } from '../audio/sound';
import { setVoiceEnabled, setVoiceVolume } from '../audio/voice';
import { installNativeHandlers } from '../platform/native';
import { IconChart, IconFighter, IconGlove, IconHome, IconLayers } from './icons';
import { Toaster } from './components/Toast';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { CoachSelect } from './screens/CoachSelect';
import { initAccount } from '../account/session';
import { STUDIO_BG, THEME_BG, applyTheme } from './theme/theme';
import { useResolvedTheme } from './theme/useTheme';

/** kept for the screens that import it from here */
export { PageHead } from './components/PageHead';

const Training = lazy(() => import('./screens/Training').then((m) => ({ default: m.Training })));
const Train = lazy(() => import('./screens/Train').then((m) => ({ default: m.Train })));
const DisciplinePage = lazy(() => import('./screens/Discipline').then((m) => ({ default: m.DisciplinePage })));
const Library = lazy(() => import('./screens/Library').then((m) => ({ default: m.Library })));
const TechniquePage = lazy(() => import('./screens/Library').then((m) => ({ default: m.TechniquePage })));
const Programs = lazy(() => import('./screens/Programs').then((m) => ({ default: m.Programs })));
const ProgramPage = lazy(() => import('./screens/Programs').then((m) => ({ default: m.ProgramPage })));
const Builder = lazy(() => import('./screens/Builder').then((m) => ({ default: m.Builder })));
const Stats = lazy(() => import('./screens/Stats').then((m) => ({ default: m.Stats })));
const History = lazy(() => import('./screens/Stats').then((m) => ({ default: m.History })));
const SettingsPage = lazy(() => import('./screens/Settings').then((m) => ({ default: m.SettingsPage })));
const Privacy = lazy(() => import('./screens/Privacy').then((m) => ({ default: m.Privacy })));
const Champions = lazy(() => import('./screens/Champions').then((m) => ({ default: m.Champions })));
const ComboPage = lazy(() => import('./screens/Champions').then((m) => ({ default: m.ComboPage })));
const ChampionPage = lazy(() => import('./screens/Champions').then((m) => ({ default: m.ChampionPage })));
const CoachStudio = lazy(() => import('./screens/CoachStudio').then((m) => ({ default: m.CoachStudio })));
const SignIn = lazy(() => import('./screens/account/SignIn').then((m) => ({ default: m.SignIn })));
const ProfilePage = lazy(() => import('./screens/account/Profile').then((m) => ({ default: m.ProfilePage })));
const CoachHistory = lazy(() => import('./screens/CoachHistory').then((m) => ({ default: m.CoachHistory })));

installNativeHandlers();
void initAccount();

function AudioSync() {
  const s = useSettings((x) => x.settings);
  useEffect(() => {
    setVoiceVolume(s.voiceVolume);
    setVoiceEnabled(s.voice);
    setEffectsVolume(s.effectsVolume);
  }, [s.voiceVolume, s.voice, s.effectsVolume]);
  return null;
}

/** display preferences of the profile: larger text, reduced motion */
function DisplaySync() {
  const d = useProfile((s) => s.profile.display);
  useEffect(() => {
    document.documentElement.style.fontSize = d.textSize === 'grand' ? '112.5%' : '';
    let st = document.getElementById('css-reduce-motion');
    if (d.reduceMotion && !st) {
      st = document.createElement('style');
      st.id = 'css-reduce-motion';
      st.textContent = '*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}';
      document.head.appendChild(st);
    } else if (!d.reduceMotion && st) st.remove();
  }, [d.textSize, d.reduceMotion]);
  return null;
}

const isTraining = (p: string) => p.startsWith('/entrainement');

/** menu theme (light, dark, automatic) and status bar colour; the training studio stays white */
function ThemeColor() {
  const loc = useLocation();
  const pref = useSettings((x) => x.settings.theme);
  const resolved = useResolvedTheme();
  useEffect(() => {
    const t = applyTheme(pref);
    const studio = isTraining(loc.pathname);
    let m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'theme-color';
      document.head.appendChild(m);
    }
    m.content = studio ? STUDIO_BG : THEME_BG[t];
    document.documentElement.style.colorScheme = studio ? 'light' : t;
  }, [loc.pathname, pref, resolved]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return null;
}

const NAV = [
  { to: '/', label: 'Accueil', icon: <IconHome />, end: true, match: ['/'] },
  { to: '/entrainer', label: 'Entraîner', icon: <IconGlove />, match: ['/entrainer', '/discipline', '/programmes'] },
  { to: '/techniques', label: 'Techniques', icon: <IconLayers />, match: ['/techniques', '/createur', '/champions'] },
  { to: '/combattant', label: 'Coach', icon: <IconFighter />, match: ['/combattant', '/coach', '/coach-ia'] },
  { to: '/stats', label: 'Progrès', icon: <IconChart />, match: ['/stats', '/historique'] },
];

function Nav() {
  const loc = useLocation();
  if (isTraining(loc.pathname) || loc.pathname.startsWith('/bienvenue')) return null;
  const p = loc.pathname;
  const activeIdx = NAV.findIndex((i) => (i.end ? p === '/' : i.match.some((m) => p === m || p.startsWith(`${m}/`))));
  return (
    <nav className="nav" aria-label="Navigation principale">
      <div className="nav-inner">
        {NAV.map((i, k) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={k === activeIdx ? 'active' : ''} aria-current={k === activeIdx ? 'page' : undefined} data-testid={`nav-${i.to.slice(1) || 'accueil'}`}>
            <span className="pill">{i.icon}</span>
            {i.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Loading() {
  return (
    <div className="loading" role="status">
      <div>
        <div className="spinner" />
        Chargement…
      </div>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const hydrated = useProfile((s) => s.hydrated);
  const profile = useProfile((s) => s.profile);
  const loc = useLocation();
  if (!hydrated) return <Loading />;
  const free = loc.pathname.startsWith('/bienvenue') || loc.pathname.startsWith('/coach') || loc.pathname.startsWith('/confidentialite') || loc.pathname.startsWith('/connexion');
  if (!free && !profile.completed) return <Navigate to="/bienvenue" replace />;
  if (!free && !profile.coach) return <Navigate to="/coach?first=1" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <HashRouter>
      <AudioSync />
      <DisplaySync />
      <ThemeColor />
      <Gate>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bienvenue" element={<Onboarding />} />
            <Route path="/coach" element={<CoachSelect />} />
            <Route path="/combattant" element={<CoachStudio />} />
            <Route path="/entrainer" element={<Train />} />
            <Route path="/discipline/:id" element={<DisciplinePage />} />
            <Route path="/entrainement" element={<Training />} />
            <Route path="/techniques" element={<Library />} />
            <Route path="/techniques/:id" element={<TechniquePage />} />
            <Route path="/programmes" element={<Programs />} />
            <Route path="/programmes/:id" element={<ProgramPage />} />
            <Route path="/createur" element={<Builder />} />
            <Route path="/champions" element={<Champions />} />
            <Route path="/champions/c/:championId" element={<ChampionPage />} />
            <Route path="/champions/:id" element={<ComboPage />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/historique" element={<History />} />
            <Route path="/reglages" element={<SettingsPage />} />
            <Route path="/confidentialite" element={<Privacy />} />
            <Route path="/connexion" element={<SignIn />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/coach-ia" element={<CoachHistory />} />
            <Route path="/coach-ia/historique" element={<Navigate to="/coach-ia" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Gate>
      <Nav />
      <Toaster />
    </HashRouter>
  );
}
