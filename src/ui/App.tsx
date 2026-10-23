import { CoachBubble } from './coach-ai/CoachBubble';
import { Suspense, lazy, useEffect, useRef } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useSettings } from '../store/settings';
import { setEffectsVolume } from '../audio/sound';
import { setVoiceEnabled, setVoiceVolume } from '../audio/voice';
import { installNativeHandlers } from '../platform/native';
import { Toaster } from './components/Toast';
import { BottomBar } from './nav/BottomBar';
import { NavSheets } from './nav/NavSheets';
import { forgetLayers } from './nav/layers';
import { useNavStore } from './nav/store';
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
const PartnerPage = lazy(() => import('./screens/Library').then((m) => ({ default: m.PartnerPage })));
const PremiumPage = lazy(() => import('./premium/PremiumPage').then((m) => ({ default: m.PremiumPage })));
const Programs = lazy(() => import('./screens/Programs').then((m) => ({ default: m.Programs })));
const ProgramPage = lazy(() => import('./screens/Programs').then((m) => ({ default: m.ProgramPage })));
const CreatorList = lazy(() => import('./screens/creator/CreatorList').then((m) => ({ default: m.CreatorList })));
const CreatorSheet = lazy(() => import('./screens/creator/CreatorSheet').then((m) => ({ default: m.CreatorSheet })));
const CreatorEditor = lazy(() => import('./screens/creator/CreatorEditor').then((m) => ({ default: m.CreatorEditor })));
const Stats = lazy(() => import('./screens/Stats').then((m) => ({ default: m.Stats })));
const Goals = lazy(() => import('./screens/Stats').then((m) => ({ default: m.Goals })));
const ActivityDetail = lazy(() => import('./screens/Stats').then((m) => ({ default: m.ActivityDetail })));
const TechniquesDetail = lazy(() => import('./screens/Stats').then((m) => ({ default: m.TechniquesDetail })));
const DisciplinesDetail = lazy(() => import('./screens/Stats').then((m) => ({ default: m.DisciplinesDetail })));
const CombosDetail = lazy(() => import('./screens/Stats').then((m) => ({ default: m.CombosDetail })));
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

/** menu theme (light, dark, automatic) and status bar colour; the training studio follows the theme (0.27) */
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
    m.content = studio ? STUDIO_BG[t] : THEME_BG[t];
    document.documentElement.style.colorScheme = t;
  }, [loc.pathname, pref, resolved]);
  return null;
}

/**
 * v0.32 smart back (section 11): a page reached with Retour (or the system back) finds its scroll position again;
 * a new page starts at the top. Positions are kept per history entry for the session.
 */
const scrollByKey = new Map<string, number>();
function ScrollMemory() {
  const loc = useLocation();
  const type = useNavigationType();
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    const key = loc.key;
    const samePage = lastPath.current === loc.pathname;
    lastPath.current = loc.pathname;
    const save = () => scrollByKey.set(key, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    let raf = 0;
    // a filter or a search written in the URL keeps the page where it is, and its open panel
    if (!samePage) {
      const y = type === 'POP' ? scrollByKey.get(key) : undefined;
      // a page change closes what the bar had open (a link followed from a sheet)
      if (useNavStore.getState().sheet) useNavStore.getState().setSheet(null);
      forgetLayers();
      // the page may still be loading (lazy screens): restore once it is tall enough, else stay at the top
      let tries = 0;
      const restore = () => {
        if (y === undefined) return window.scrollTo(0, 0);
        if (document.documentElement.scrollHeight - window.innerHeight >= y || tries++ > 30) window.scrollTo(0, y);
        else raf = requestAnimationFrame(restore);
      };
      restore();
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', save);
    };
  }, [loc.key, loc.pathname, type]);
  return null;
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
            <Route path="/partenaire/:id" element={<PartnerPage />} />
            <Route path="/programmes" element={<Programs />} />
            <Route path="/programmes/:id" element={<ProgramPage />} />
            <Route path="/createur" element={<CreatorList />} />
            <Route path="/createur/nouveau" element={<CreatorEditor key="nouveau" />} />
            <Route path="/createur/:id/modifier" element={<CreatorEditor />} />
            <Route path="/createur/:id" element={<CreatorSheet />} />
            <Route path="/champions" element={<Champions />} />
            <Route path="/champions/c/:championId" element={<ChampionPage />} />
            <Route path="/champions/:id" element={<ComboPage />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/stats/activite" element={<ActivityDetail />} />
            <Route path="/stats/techniques" element={<TechniquesDetail />} />
            <Route path="/stats/disciplines" element={<DisciplinesDetail />} />
            <Route path="/stats/enchainements" element={<CombosDetail />} />
            <Route path="/historique" element={<History />} />
            <Route path="/objectifs" element={<Goals />} />
            <Route path="/reglages" element={<SettingsPage />} />
            <Route path="/reglages/:section" element={<SettingsPage />} />
            <Route path="/confidentialite" element={<Privacy />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/connexion" element={<SignIn />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/coach-ia" element={<CoachHistory />} />
            <Route path="/coach-ia/historique" element={<Navigate to="/coach-ia" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Gate>
      <ScrollMemory />
      {/* v0.32 navigation dynamique: one bottom bar, its sheets (Navigation générale, Nouveautés) and the Coach IA
          panel they open; no floating button any more */}
      <BottomBar />
      <NavSheets />
      <CoachBubble />
      <Toaster />
    </HashRouter>
  );
}
