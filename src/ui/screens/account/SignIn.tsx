import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount, sendPasswordReset, signInEmail, signInGoogle, signUpEmail } from '../../../account/session';
import { emailLooksValid, passwordProblem } from '../../../account/auth/types';
import { useProfile } from '../../../store/profile';
import { useStats } from '../../../store/stats';
import { PageHead, Tabs, toast } from '../../components';
import { IconShield, IconUser } from '../../icons';
import './account.css';

type Mode = 'connexion' | 'inscription' | 'oubli';

export function PasswordField({ id, value, onChange, autoComplete, label = 'Mot de passe' }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; label?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="acc-pw">
        <input id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required />
        <button type="button" className="btn secondary sm" onClick={() => setShow(!show)} aria-pressed={show}>
          {show ? 'Masquer' : 'Afficher'}
        </button>
      </div>
    </div>
  );
}

/**
 * Sign-in, account creation, forgotten password and guest mode. Only the methods that really work
 * in this build and on this platform are shown; without a Firebase configuration only the guest
 * path exists.
 */
export function SignIn() {
  const caps = useAccount((s) => s.capabilities);
  const status = useAccount((s) => s.status);
  const user = useAccount((s) => s.user);
  const completed = useProfile((s) => s.profile.completed);
  const hasSessions = useStats((s) => s.sessions.length > 0);
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>('connexion');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepGuest, setKeepGuest] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const guestHasData = status === 'guest' && (completed || hasSessions);
  const online = caps.email;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!emailLooksValid(email)) return setError('Adresse e-mail invalide.');
    if (mode === 'oubli')
      return void run(async () => {
        await sendPasswordReset(email);
        setInfo('Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé. Pense à regarder dans les indésirables.');
      });
    if (mode === 'inscription') {
      const pb = passwordProblem(password);
      if (pb) return setError(pb);
      return void run(async () => {
        const u = await signUpEmail(email, password, guestHasData && keepGuest);
        toast(`Compte créé. Un e-mail de vérification a été envoyé à ${u.email}.`);
        nav('/profil', { replace: true });
      });
    }
    void run(async () => {
      await signInEmail(email, password, guestHasData && keepGuest);
      toast('Connexion réussie.');
      nav('/profil', { replace: true });
    });
  };

  const google = () =>
    run(async () => {
      await signInGoogle(guestHasData && keepGuest);
      toast('Connexion réussie.');
      nav('/profil', { replace: true });
    });

  const continueAsGuest = () => nav(completed ? '/' : '/bienvenue', { replace: true });

  if (status === 'signedIn' && user) {
    return (
      <div className="page">
        <PageHead title="Compte" fallback="/profil" />
        <div className="card stack">
          <p>
            Tu es connecté avec <b>{user.email}</b>.
          </p>
          <Link className="btn primary block" to="/profil">
            Voir mon profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead title={online ? 'Connexion' : 'Compte'} eyebrow="Ton espace" fallback="/profil" />

      {online && (
        <div className="stack">
          <Tabs
            label="Connexion ou création de compte"
            value={mode === 'oubli' ? 'connexion' : mode}
            onChange={(m) => (setMode(m as Mode), setError(null), setInfo(null))}
            items={[
              { id: 'connexion', label: 'Se connecter' },
              { id: 'inscription', label: 'Créer un compte' },
            ]}
          />
          <form className="card acc-form" onSubmit={submit} noValidate>
            {mode === 'oubli' && (
              <>
                <h2>Mot de passe oublié</h2>
                <p className="small muted">Entre ton adresse : tu recevras un lien pour choisir un nouveau mot de passe.</p>
              </>
            )}
            <div className="field">
              <label htmlFor="acc-email">Adresse e-mail</label>
              <input id="acc-email" className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== 'oubli' && (
              <PasswordField id="acc-pw" value={password} onChange={setPassword} autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'} />
            )}
            {mode === 'inscription' && <span className="small muted">Au moins 8 caractères, avec une lettre et un chiffre.</span>}
            {mode !== 'oubli' && guestHasData && (
              <label className="acc-check">
                <input type="checkbox" checked={keepGuest} onChange={(e) => setKeepGuest(e.target.checked)} />
                <span>
                  {mode === 'inscription' ? 'Garder dans mon compte' : 'Ajouter à ce compte'} le profil, les séances et les combattants créés sur cet appareil en mode invité
                </span>
              </label>
            )}
            {error && (
              <div className="note err" role="alert">
                {error}
              </div>
            )}
            {info && (
              <div className="note" role="status">
                {info}
              </div>
            )}
            <button type="submit" className="btn primary block" disabled={busy}>
              {mode === 'connexion' ? 'Se connecter' : mode === 'inscription' ? 'Créer mon compte' : 'Envoyer le lien'}
            </button>
            {mode === 'connexion' && (
              <button type="button" className="btn ghost sm" onClick={() => (setMode('oubli'), setError(null))}>
                Mot de passe oublié ?
              </button>
            )}
            {mode === 'oubli' && (
              <button type="button" className="btn ghost sm" onClick={() => setMode('connexion')}>
                Retour à la connexion
              </button>
            )}
            {mode === 'inscription' && (
              <p className="small muted">
                En créant un compte, tu acceptes la <Link to="/confidentialite">politique de confidentialité</Link>. Ton mot de passe n’est jamais enregistré par l’application.
              </p>
            )}
          </form>
          {caps.google && mode !== 'oubli' && (
            <>
              <div className="acc-or">ou</div>
              <button type="button" className="btn secondary block" onClick={google} disabled={busy}>
                Continuer avec Google
              </button>
            </>
          )}
          <div className="acc-or">ou</div>
        </div>
      )}

      <div className="card stack">
        <div className="row nowrap" style={{ gap: 12 }}>
          <span className="icon-tile" aria-hidden>
            <IconUser />
          </span>
          <div className="grow">
            <h3>Mode invité</h3>
            <p className="small muted">Sans compte : ton profil et tes séances restent sur cet appareil. Tu pourras créer un compte plus tard sans rien perdre.</p>
          </div>
        </div>
        <button type="button" className={`btn ${online ? 'secondary' : 'primary'} block`} onClick={continueAsGuest} data-testid="guest-continue">
          Continuer sans compte
        </button>
      </div>

      {!online && (
        <p className="small muted row nowrap" style={{ gap: 8 }} data-testid="accounts-off">
          <IconShield width={18} /> Les comptes en ligne ne sont pas activés dans cette version.
        </p>
      )}
    </div>
  );
}
