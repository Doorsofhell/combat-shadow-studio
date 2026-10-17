import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DISCIPLINES, DisciplineId, LEVELS, LevelId } from '../../../domain/types';
import { Difficulty, Profile, SPORT_GOALS, ageFrom, displayName, initials, useProfile } from '../../../store/profile';
import { formatDuration, sessionCount, sum, useStats, weekKey } from '../../../store/stats';
import { useGoals } from '../../../store/goals';
import { useCatalogUser } from '../../../store/catalog';
import { useActiveFighter } from '../../../store/fighters';
import { saveTextFile } from '../../../platform/native';
import {
  deleteAccount,
  deleteMyData,
  linkEmail,
  linkGoogle,
  reauthenticate,
  refreshUser,
  sendVerification,
  signOut,
  syncNow,
  unlinkMethod,
  useAccount,
} from '../../../account/session';
import { useSyncPrefs } from '../../../account/syncPrefs';
import { buildFullExport } from '../../../account/export';
import { passwordProblem, emailLooksValid } from '../../../account/auth/types';
import type { SignInMethod } from '../../../account/auth/types';
import { Chip, ConfirmDialog, LinkRow, PageHead, Panel, PanelRow, Segmented, Sheet, StatTile, Toggle, toast } from '../../components';
import { IconDownload, IconFighter, IconShield, IconTrash, IconUser } from '../../icons';
import { PasswordField } from './SignIn';
import './account.css';

const METHOD_LABEL: Record<SignInMethod, string> = { password: 'E-mail et mot de passe', 'google.com': 'Google' };

const num = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return v.trim() === '' || !Number.isFinite(n) ? undefined : n;
};
const today = () => new Date().toISOString().slice(0, 10);

function TextField({ id, label, value, onChange, placeholder, hint, maxLength = 40, testId, autoComplete = 'off' }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; maxLength?: number; testId?: string; autoComplete?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} data-testid={testId} />
      {hint && <span className="small muted">{hint}</span>}
    </div>
  );
}

function NumField({ id, label, value, onChange, unit, min, max }: { id: string; label: string; value: number | undefined; onChange: (v: number | undefined) => void; unit: string; min: number; max: number }) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        inputMode="decimal"
        value={text}
        placeholder={unit}
        onChange={(e) => {
          setText(e.target.value);
          const n = num(e.target.value);
          onChange(n === undefined || n < min || n > max ? undefined : n);
        }}
      />
    </div>
  );
}

export function Avatar({ profile, size = 72 }: { profile: Profile; size?: number }) {
  const fighter = useActiveFighter();
  const useFighter = profile.avatar === 'fighter' && fighter;
  return (
    <span className="acc-avatar" style={{ width: size, height: size }} aria-hidden>
      {useFighter ? (
        <>
          <IconFighter />
          <span className="skin" style={{ background: fighter.look.skin }} />
        </>
      ) : (
        initials(profile)
      )}
    </span>
  );
}

function Section({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <Panel title={title} id={id}>
      {children}
    </Panel>
  );
}

/** Profile: identity, sport profile, statistics, privacy and account management, all for the current user. */
export function ProfilePage() {
  const profile = useProfile((s) => s.profile);
  const update = useProfile((s) => s.update);
  const canStoreLimitations = useProfile((s) => s.canStoreLimitations);
  const fighter = useActiveFighter();
  const sessions = useStats((s) => s.sessions);
  const favT = useGoals((s) => s.favTechniques.length);
  const favE = useGoals((s) => s.favExercises.length);
  const favC = useCatalogUser((s) => s.favorites.length);
  const { status, user, capabilities: caps, providerId, sync } = useAccount();
  const syncOn = useSyncPrefs((s) => s.enabled);
  const setSync = useSyncPrefs((s) => s.setEnabled);
  const nav = useNavigate();

  const [showLim, setShowLim] = useState(false);
  const [dialog, setDialog] = useState<null | 'erase' | 'signout' | 'delete' | 'link-email'>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const name = displayName(profile) || (status === 'signedIn' ? (user?.displayName ?? '') : '') || 'Combattant';
  const thisWeek = weekKey(new Date().toISOString());
  const weekSec = sum(sessions.filter((s) => weekKey(s.start) === thisWeek));
  const practised = profile.disciplines.length ? profile.disciplines : [profile.mainDiscipline];
  const birthAge = ageFrom(profile.birthDate);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleDiscipline = (d: DisciplineId) => {
    const on = practised.includes(d);
    const next = on ? practised.filter((x) => x !== d) : [...practised, d];
    if (!next.length) return;
    update({ disciplines: next, mainDiscipline: next.includes(profile.mainDiscipline) ? profile.mainDiscipline : next[0] });
  };

  const doExport = () =>
    run(async () => {
      const json = await buildFullExport(user);
      const m = await saveTextFile(`combat-shadow-studio-mes-donnees-${today()}.json`, json);
      toast(m);
    });

  return (
    <div className="page">
      <PageHead title="Profil" eyebrow={status === 'signedIn' ? 'Compte' : 'Mode invité'} fallback="/reglages" />

      <div className="card acc-hero">
        <Avatar profile={profile} />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="acc-name" data-testid="profile-name">
            {name}
          </div>
          <div className="small muted">
            {status === 'signedIn' && user ? user.email : 'Sans compte, données sur cet appareil'}
            {status === 'signedIn' && user && !user.emailVerified && <span className="badge red" style={{ marginLeft: 8 }}>E-mail à vérifier</span>}
          </div>
          {fighter && <div className="small muted">Combattant : {fighter.name}</div>}
        </div>
      </div>

      {err && (
        <div className="note err" role="alert">
          {err}
        </div>
      )}

      {/* ---------------------------------------------------------------- account */}
      <Section title="Compte" id="pr-compte">
        {status !== 'signedIn' && caps.email && (
          <LinkRow to="/connexion" icon={<IconUser className="muted" />} label="Créer un compte ou se connecter" hint="Tes données d’invité peuvent être gardées dans le compte" />
        )}
        {status !== 'signedIn' && !caps.email && <PanelRow label="Mode invité" hint="Les comptes en ligne ne sont pas activés dans cette version. Tout reste sur cet appareil." />}
        {status === 'signedIn' && user && (
          <>
            {!user.emailVerified && (
              <div className="panel-row col">
                <span className="small">Un e-mail de vérification a été envoyé à {user.email}. Ouvre le lien puis reviens ici.</span>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn secondary sm" disabled={busy} onClick={() => run(async () => (await sendVerification(), toast('E-mail renvoyé.')))}>
                    Renvoyer l’e-mail
                  </button>
                  <button type="button" className="btn secondary sm" disabled={busy} onClick={() => run(async () => void toast((await refreshUser())?.emailVerified ? 'Adresse vérifiée.' : 'Adresse pas encore vérifiée.'))}>
                    J’ai vérifié
                  </button>
                </div>
              </div>
            )}
            <div className="panel-row col">
              <span>Méthodes de connexion</span>
              <ul className="acc-methods">
                {user.methods.map((m) => (
                  <li key={m}>
                    <span className="small">{METHOD_LABEL[m]}</span>
                    {user.methods.length > 1 && (
                      <button type="button" className="btn ghost sm" disabled={busy} onClick={() => run(async () => (await unlinkMethod(m), toast('Méthode retirée.')))}>
                        Retirer
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {caps.link && (
                <div className="row" style={{ gap: 8 }}>
                  {!user.methods.includes('password') && (
                    <button type="button" className="btn secondary sm" onClick={() => setDialog('link-email')}>
                      Ajouter e-mail et mot de passe
                    </button>
                  )}
                  {caps.google && !user.methods.includes('google.com') && (
                    <button type="button" className="btn secondary sm" disabled={busy} onClick={() => run(async () => (await linkGoogle(), toast('Google relié à ton compte.')))}>
                      Relier Google
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="panel-row">
              <button type="button" className="btn secondary block" onClick={() => setDialog('signout')} data-testid="sign-out">
                Se déconnecter
              </button>
            </div>
          </>
        )}
      </Section>

      {/* ---------------------------------------------------------------- personal info */}
      <Section title="Informations personnelles" id="pr-perso">
        <div className="acc-fields">
          <TextField id="pf-pseudo" label="Pseudo" value={profile.pseudo} onChange={(v) => update({ pseudo: v })} placeholder="Comment le coach t’appelle" hint="Utilisé par le coach pour s’adresser à toi." maxLength={24} testId="pseudo-input" autoComplete="nickname" />
          <div className="grid2">
            <TextField id="pf-prenom" label="Prénom (facultatif)" value={profile.firstName ?? ''} onChange={(v) => update({ firstName: v || undefined })} autoComplete="given-name" />
            <TextField id="pf-nom" label="Nom (facultatif)" value={profile.lastName ?? ''} onChange={(v) => update({ lastName: v || undefined })} autoComplete="family-name" />
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="pf-naissance">Date de naissance</label>
              <input id="pf-naissance" className="input" type="date" max={today()} value={profile.birthDate ?? ''} onChange={(e) => update({ birthDate: e.target.value || undefined })} />
            </div>
            {birthAge !== undefined ? (
              <div className="field">
                <span className="label">Âge</span>
                <span className="input" aria-live="polite">
                  {birthAge} ans
                </span>
              </div>
            ) : (
              <NumField id="pf-age" label="Ou ton âge" unit="ans" value={profile.age} min={5} max={120} onChange={(v) => update({ age: v })} />
            )}
          </div>
          <div className="grid2">
            <NumField id="pf-taille" label="Taille" unit="cm" value={profile.heightCm} min={80} max={250} onChange={(v) => update({ heightCm: v })} />
            <NumField id="pf-poids" label="Poids" unit="kg" value={profile.weightKg} min={20} max={300} onChange={(v) => update({ weightKg: v })} />
          </div>
          <p className="small muted">Facultatif. Ces mesures servent seulement à ton suivi : l’application n’en tire aucune conclusion sur ta santé ni ton aptitude.</p>
        </div>
        <PanelRow label="Avatar" column>
          <Segmented
            label="Avatar"
            value={profile.avatar}
            onChange={(a) => update({ avatar: a })}
            options={[
              { id: 'fighter', label: 'Mon combattant' },
              { id: 'initiales', label: 'Initiales' },
            ]}
          />
        </PanelRow>
        <LinkRow to="/combattant" icon={<IconFighter className="muted" />} label="Personnaliser mon combattant" hint="Apparence, tenue, tatouages, équipement" />
        <PanelRow label="Langue" hint="Français (seule langue disponible pour l’instant)" />
      </Section>

      {/* ---------------------------------------------------------------- sport profile */}
      <Section title="Profil sportif" id="pr-sport">
        <PanelRow label="Disciplines pratiquées" column>
          <div className="row" style={{ gap: 8 }} role="group" aria-label="Disciplines pratiquées">
            {DISCIPLINES.map((d) => (
              <Chip key={d.id} on={practised.includes(d.id)} onClick={() => toggleDiscipline(d.id)} testId={`pf-disc-${d.id}`}>
                {d.name}
              </Chip>
            ))}
          </div>
        </PanelRow>
        {practised.map((d) => (
          <PanelRow key={d} label={`Niveau en ${DISCIPLINES.find((x) => x.id === d)!.name.toLowerCase()}`}>
            <select aria-label={`Niveau en ${DISCIPLINES.find((x) => x.id === d)!.name}`} className="input" style={{ width: 'auto' }} value={profile.levels[d]} onChange={(e) => update({ levels: { ...profile.levels, [d]: e.target.value as LevelId } })}>
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </PanelRow>
        ))}
        {practised.length > 1 && (
          <PanelRow label="Discipline principale">
            <select aria-label="Discipline principale" className="input" style={{ width: 'auto' }} value={profile.mainDiscipline} onChange={(e) => update({ mainDiscipline: e.target.value as DisciplineId })}>
              {practised.map((d) => (
                <option key={d} value={d}>
                  {DISCIPLINES.find((x) => x.id === d)!.name}
                </option>
              ))}
            </select>
          </PanelRow>
        )}
        <div className="acc-fields">
          <NumField id="pf-annees" label="Années de pratique" unit="ans" value={profile.yearsExperience} min={0} max={80} onChange={(v) => update({ yearsExperience: v })} />
        </div>
        <PanelRow label="Garde" column>
          <Segmented
            label="Garde"
            value={profile.guard}
            onChange={(g) => update({ guard: g })}
            options={[
              { id: 'orthodoxe', label: 'Orthodoxe' },
              { id: 'gaucher', label: 'Gaucher' },
            ]}
          />
        </PanelRow>
        <PanelRow label="Séances par semaine" column>
          <Segmented label="Séances par semaine" value={profile.daysPerWeek} onChange={(v) => update({ daysPerWeek: v })} options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: n, label: String(n) }))} />
        </PanelRow>
        <PanelRow label="Durée habituelle d’une séance" column>
          <Segmented label="Durée habituelle d’une séance" value={profile.sessionMinutes} onChange={(v) => update({ sessionMinutes: v })} options={[10, 15, 20, 30, 45, 60].map((m) => ({ id: m, label: `${m}` }))} />
          <span className="hint">En minutes.</span>
        </PanelRow>
        <PanelRow label="Difficulté préférée" column>
          <Segmented<Difficulty>
            label="Difficulté préférée"
            value={profile.difficulty}
            onChange={(v) => update({ difficulty: v })}
            options={[
              { id: 'douce', label: 'Douce' },
              { id: 'progressive', label: 'Progressive' },
              { id: 'exigeante', label: 'Exigeante' },
            ]}
          />
        </PanelRow>
        <PanelRow label="Objectifs" column>
          <div className="row" style={{ gap: 8 }} role="group" aria-label="Objectifs">
            {SPORT_GOALS.map((g) => {
              const on = profile.goals.includes(g.id);
              return (
                <Chip key={g.id} on={on} onClick={() => update({ goals: on ? profile.goals.filter((x) => x !== g.id) : [...profile.goals, g.id] })} testId={`pf-goal-${g.id}`}>
                  {g.label}
                </Chip>
              );
            })}
          </div>
        </PanelRow>
        <LinkRow to="/techniques" label="Techniques favorites" hint={`${favT} technique(s), ${favE} exercice(s)`} />
        <LinkRow to="/champions" label="Combinaisons favorites" hint={`${favC} combinaison(s)`} />
      </Section>

      {/* ---------------------------------------------------------------- stats */}
      <section className="stack" style={{ gap: 8 }} aria-labelledby="pr-stats">
        <h2 className="panel-title" id="pr-stats">
          Statistiques
        </h2>
        <div className="stat-tiles">
          <StatTile value={formatDuration(sum(sessions))} label="Temps actif total" testId="pf-total" />
          <StatTile value={sessionCount(sessions)} label="Séances" />
          <StatTile value={formatDuration(weekSec)} label="Cette semaine" />
        </div>
        <Link to="/stats" className="small">
          Voir toute ma progression
        </Link>
      </section>

      {/* ---------------------------------------------------------------- limitations */}
      <Section title="Limitations physiques" id="pr-lim">
        <div className="panel-row col">
          <span className="small muted">
            Facultatif. Chiffré sur cet appareil, jamais synchronisé ni envoyé. Sert uniquement à te rappeler de ménager une zone ; ce n’est ni un avis ni un diagnostic médical.
          </span>
          {!canStoreLimitations && <div className="note warn">Le chiffrement n’est pas disponible dans ce navigateur : ce que tu écris ici ne sera pas enregistré.</div>}
          {showLim ? (
            <>
              <label htmlFor="pf-lim" className="label">
                Limitations ou blessures
              </label>
              <textarea id="pf-lim" className="input" value={profile.limitations} maxLength={500} onChange={(e) => update({ limitations: e.target.value })} placeholder="Par exemple : genou droit fragile" />
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className="btn secondary sm" onClick={() => setShowLim(false)}>
                  Masquer
                </button>
                {profile.limitations && (
                  <button type="button" className="btn ghost sm" onClick={() => update({ limitations: '' })}>
                    Effacer
                  </button>
                )}
              </div>
            </>
          ) : (
            <button type="button" className="btn secondary sm" onClick={() => setShowLim(true)} data-testid="show-limitations">
              {profile.limitations ? 'Afficher (renseigné)' : 'Renseigner'}
            </button>
          )}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- display */}
      <Section title="Affichage" id="pr-affichage">
        <PanelRow label="Taille du texte" column>
          <Segmented
            label="Taille du texte"
            value={profile.display.textSize}
            onChange={(v) => update({ display: { ...profile.display, textSize: v } })}
            options={[
              { id: 'normal', label: 'Normale' },
              { id: 'grand', label: 'Grande' },
            ]}
          />
        </PanelRow>
        <Toggle label="Réduire les animations" hint="Écrans et transitions sans mouvement" on={profile.display.reduceMotion} onChange={(v) => update({ display: { ...profile.display, reduceMotion: v } })} />
      </Section>

      {/* ---------------------------------------------------------------- AI coach */}
      <Section title="Coach IA" id="pr-ia">
        <Toggle label="M’appeler par mon pseudo" hint={profile.pseudo ? `Le coach t’appelle « ${profile.pseudo} »` : 'Renseigne un pseudo plus haut'} on={profile.coachAi.usePseudo} onChange={(v) => update({ coachAi: { ...profile.coachAi, usePseudo: v } })} />
        <PanelRow label="Tes questions restent sur cet appareil" hint="Le coach IA répond sur l’appareil : aucune question n’est envoyée sur internet." />
        <LinkRow to="/coach-ia" label="Réglages et historique du coach IA" hint="Historique local désactivé par défaut, effaçable à tout moment" />
      </Section>

      {/* ---------------------------------------------------------------- privacy & data */}
      <Section title="Confidentialité et données" id="pr-data">
        {providerId === 'firebase' && status === 'signedIn' && user ? (
          <>
            <Toggle label="Synchronisation en ligne" hint="Sauvegarde ton profil, tes combattants, séances, enchaînements et favoris dans ton compte (sauf les limitations physiques)" on={syncOn} onChange={setSync} />
            {syncOn && sync && (
              <div className="panel-row col">
                <span className="small muted" role="status" data-testid="sync-status">
                  {sync.phase === 'syncing' && 'Synchronisation…'}
                  {sync.phase === 'idle' && `À jour${sync.lastSyncAt ? ` (${new Date(sync.lastSyncAt).toLocaleString('fr-FR')})` : ''}.`}
                  {sync.phase === 'offline' && 'Hors ligne : tes modifications sont gardées et seront envoyées au retour de la connexion.'}
                  {sync.phase === 'error' && (sync.message ?? 'La synchronisation a échoué.')}
                </span>
                {sync.phase !== 'syncing' && user.emailVerified && (
                  <button type="button" className="btn secondary sm" onClick={() => void syncNow()}>
                    Synchroniser maintenant
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <PanelRow label="Synchronisation en ligne" hint={caps.email ? 'Disponible avec un compte. Désactivée par défaut.' : 'Non disponible dans cette version : tout reste sur cet appareil.'} />
        )}
        <LinkRow to="/confidentialite" icon={<IconShield className="muted" />} label="Politique de confidentialité" />
        <div className="panel-row col">
          <span className="small muted">Un fichier JSON avec tout ton profil, tes combattants, séances, enchaînements, favoris et réglages. Les limitations y figurent en clair : garde-le en lieu sûr.</span>
          <button type="button" className="btn secondary block" onClick={doExport} disabled={busy} data-testid="export-my-data">
            <IconDownload width={18} /> Exporter mes données
          </button>
        </div>
        <div className="panel-row col">
          <button type="button" className="btn danger block" onClick={() => setDialog('erase')} data-testid="delete-my-data">
            <IconTrash width={18} /> Supprimer mes données
          </button>
          {status === 'signedIn' && (
            <button type="button" className="btn danger block" onClick={() => setDialog('delete')} data-testid="delete-account">
              Supprimer mon compte
            </button>
          )}
        </div>
      </Section>

      {dialog === 'erase' && (
        <ConfirmDialog
          title="Supprimer mes données ?"
          message={`Ton profil, tes combattants, séances, enchaînements, favoris, collections et objectifs seront supprimés de cet appareil${status === 'signedIn' && syncOn ? ' et de ton compte en ligne' : ''}. Les réglages de l’appareil sont gardés. Cette action est définitive.`}
          confirmLabel="Supprimer"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            run(async () => {
              setDialog(null);
              const r = await deleteMyData();
              toast(r.remote ? 'Données supprimées ici et en ligne.' : 'Données supprimées de cet appareil.');
              nav('/bienvenue', { replace: true });
            })
          }
        />
      )}
      {dialog === 'signout' && <SignOutSheet onClose={() => setDialog(null)} />}
      {dialog === 'delete' && user && <DeleteAccountSheet methods={user.methods} onClose={() => setDialog(null)} />}
      {dialog === 'link-email' && <LinkEmailSheet defaultEmail={user?.email ?? ''} onClose={() => setDialog(null)} />}
    </div>
  );
}

function SignOutSheet({ onClose }: { onClose: () => void }) {
  const [wipe, setWipe] = useState(false);
  const [busy, setBusy] = useState(false);
  const syncOn = useSyncPrefs((s) => s.enabled);
  return (
    <Sheet title="Se déconnecter ?" onClose={onClose} center>
      <p className="muted small">L’application repasse en mode invité. Tes données restent sur cet appareil pour ta prochaine connexion, sauf si tu choisis de les effacer.</p>
      <label className="acc-check">
        <input type="checkbox" checked={wipe} onChange={(e) => setWipe(e.target.checked)} />
        <span className="small">Effacer les données de ce compte sur cet appareil{syncOn ? ' (la copie en ligne est gardée)' : ' — sans synchronisation, elles seront perdues'}</span>
      </label>
      <div className="row nowrap">
        <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className="btn primary"
          style={{ flex: 1 }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await signOut(wipe).catch(() => undefined);
            toast('Tu es déconnecté.');
            onClose();
          }}
        >
          Se déconnecter
        </button>
      </div>
    </Sheet>
  );
}

function DeleteAccountSheet({ methods, onClose }: { methods: SignInMethod[]; onClose: () => void }) {
  const caps = useAccount((s) => s.capabilities);
  const usePw = methods.includes('password') || !caps.google;
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      await reauthenticate(usePw ? 'password' : 'google.com', pw);
      await deleteAccount();
      toast('Compte supprimé.');
      onClose();
      nav('/', { replace: true });
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Sheet title="Supprimer mon compte ?" onClose={onClose} center>
      <p className="muted small">Ton compte, ta copie en ligne et les données de ce compte sur cet appareil seront supprimés définitivement. Exporte tes données avant si tu veux les garder.</p>
      {usePw ? <PasswordField id="del-pw" label="Confirme avec ton mot de passe" value={pw} onChange={setPw} autoComplete="current-password" /> : <p className="small">Tu vas confirmer ton identité avec Google.</p>}
      {err && (
        <div className="note err" role="alert">
          {err}
        </div>
      )}
      <div className="row nowrap">
        <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={onClose}>
          Annuler
        </button>
        <button type="button" className="btn danger" style={{ flex: 1 }} disabled={busy || (usePw && !pw)} onClick={go}>
          Supprimer
        </button>
      </div>
    </Sheet>
  );
}

function LinkEmailSheet({ defaultEmail, onClose }: { defaultEmail: string; onClose: () => void }) {
  const [email, setEmail] = useState(defaultEmail);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!emailLooksValid(email)) return setErr('Adresse e-mail invalide.');
    const pb = passwordProblem(pw);
    if (pb) return setErr(pb);
    setBusy(true);
    try {
      await linkEmail(email, pw);
      toast('E-mail et mot de passe ajoutés.');
      onClose();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Sheet title="Ajouter e-mail et mot de passe" onClose={onClose} center>
      <div className="field">
        <label htmlFor="link-email">Adresse e-mail</label>
        <input id="link-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <PasswordField id="link-pw" value={pw} onChange={setPw} autoComplete="new-password" />
      {err && (
        <div className="note err" role="alert">
          {err}
        </div>
      )}
      <button type="button" className="btn primary block" disabled={busy} onClick={go}>
        Ajouter
      </button>
    </Sheet>
  );
}
