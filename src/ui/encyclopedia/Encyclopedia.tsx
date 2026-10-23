import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  azIndex,
  coverage,
  encyclopediaSource,
  FAMILIES,
  FAMILY_BY_ID,
  findTerms,
  imageOf,
  subfamilyLabel,
  TERM_BY_ID,
  type FamilyId,
  type Term,
} from '../../domain/encyclopedia';
import { PARTNER_BY_ID } from '../../domain/partner';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { DISCIPLINES, type DisciplineId } from '../../domain/types';
import { useGoals } from '../../store/goals';
import { EmptyState, PageHead } from '../components';
import { Tabs } from '../components/Tabs';
import { AppIcon } from '../icons';
import { NavIcon } from '../nav/NavIcon';
import { useNavActions } from '../nav/store';
import './encyclopedia.css';

/**
 * v0.46 (Youssef, 2026-10-23, « Création de l'Encyclopédie du combat — Version 1.0 » and its 11-view mockup,
 * maquettes/encyclopedie-2026-10-23/): home with the eight families, lists filtered by subfamily and discipline,
 * illustrated sheets, A–Z index and favourites. The data is src/domain/encyclopedia/; filters live in the address, so
 * Retour from a sheet comes back to the same list.
 */

const base = import.meta.env.BASE_URL;
const DISC_NAME = new Map(DISCIPLINES.map((d) => [d.id, d.name]));
const discName = (d: DisciplineId) => DISC_NAME.get(d) ?? d;

type Place = 'classement' | 'az' | 'favoris' | null;

/** the bar of every screen: Classement, A–Z, Favoris; the one in use shows pressed */
function useEncyclopediaBar(place: Place) {
  const nav = useNavigate();
  useNavActions({
    'ency-classement': { run: () => nav('/encyclopedie'), pressed: place === 'classement', ariaLabel: 'Classement : les huit familles' },
    'ency-az': { run: () => nav('/encyclopedie/az'), pressed: place === 'az', ariaLabel: 'Index alphabétique' },
    'ency-favoris': { run: () => nav('/encyclopedie/favoris'), pressed: place === 'favoris', ariaLabel: 'Mes favoris' },
  });
}

/** an illustration, or the honest « to make » box (§11: never a stand-in picture) */
export function EncImage({ id, mini, className = '' }: { id?: string; mini?: boolean; className?: string }) {
  const img = imageOf(id);
  const [broken, setBroken] = useState(false);
  if (!img || !img.file || broken)
    return (
      <span className={`enc-img missing ${mini ? 'mini' : ''} ${className}`} role="img" aria-label={img ? `${img.alt} : illustration à produire` : 'Illustration à produire'} data-testid="enc-img-missing">
        <NavIcon id="book" />
        {!mini && <small>{broken ? 'Illustration indisponible' : 'Illustration à produire'}</small>}
      </span>
    );
  const w = mini ? 160 : img.width;
  const h = mini ? 160 : img.height;
  return (
    <img
      className={`enc-img ${mini ? 'mini' : ''} ${className}`}
      src={`${base}encyclopedie/${img.file}${mini ? '-mini' : ''}.webp`}
      width={w}
      height={h}
      alt={img.alt}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      data-testid="enc-img"
    />
  );
}

function SearchField({ value, onChange, placeholder, testId = 'enc-search' }: { value: string; onChange: (v: string) => void; placeholder: string; testId?: string }) {
  return (
    <label className="enc-search">
      <NavIcon id="search" />
      <input type="search" className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} data-testid={testId} enterKeyHint="search" />
    </label>
  );
}

function TermRow({ t, showFamily }: { t: Term; showFamily?: boolean }) {
  const fav = useGoals((s) => s.favTerms.includes(t.id));
  return (
    <li>
      <Link to={`/encyclopedie/terme/${t.id}`} className="enc-row" data-testid="enc-row" data-term={t.id}>
        <EncImage id={t.image} mini />
        <span className="enc-row-body">
          <span className="enc-row-name">
            {t.name}
            {fav && <AppIcon id="favorite" size={13} className="fav" label="Favori" style={{ marginLeft: 6, verticalAlign: -1 }} />}
          </span>
          <span className="enc-row-sub">{t.subtitle}</span>
          <span className="enc-tag">{showFamily ? FAMILY_BY_ID.get(t.family)!.label : subfamilyLabel(t.family, t.sub)}</span>
        </span>
        <AppIcon id="chevron" className="muted" />
      </Link>
    </li>
  );
}

/** 2. home: search over everything and the eight families as illustrated cards */
export function EncyclopediaHome() {
  useEncyclopediaBar('classement');
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const c = useMemo(coverage, []);
  const results = q.trim() ? findTerms({ query: q }) : [];
  return (
    <div className="page enc-page" data-testid="encyclopedia-home">
      <PageHead title="Encyclopédie du combat" eyebrow="Encyclopédie" />
      <p className="enc-lead">Techniques, équipements, règles et culture des 6 disciplines</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) nav(`/encyclopedie/liste?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <SearchField value={q} onChange={setQ} placeholder="Rechercher un terme, une traduction…" />
      </form>
      {q.trim() ? (
        results.length ? (
          <ul className="enc-list" data-testid="enc-results">
            {results.slice(0, 30).map((t) => (
              <TermRow key={t.id} t={t} showFamily />
            ))}
          </ul>
        ) : (
          <p className="muted" data-testid="enc-no-result">
            Aucun terme ne correspond à « {q.trim()} ».
          </p>
        )
      ) : (
        <>
          <ul className="enc-families" data-testid="enc-families">
            {FAMILIES.map((f) => (
              <li key={f.id}>
                <Link to={`/encyclopedie/liste?f=${f.id}`} className="enc-family" data-testid={`enc-family-${f.id}`}>
                  <EncImage id={f.image} />
                  <span className="enc-family-name">{f.label}</span>
                  <span className="enc-family-short">{f.short}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="enc-status small muted" data-testid="enc-coverage">
            Version 1.0 : {c.total} fiches, toutes vérifiées sur leurs sources. Relecture par un expert de chaque discipline : à venir. Le contenu continue de s’enrichir.
          </p>
        </>
      )}
    </div>
  );
}

/** 3. a list: family → subfamily → discipline, with a search inside the list; everything kept in the address */
export function EncyclopediaList() {
  useEncyclopediaBar('classement');
  const [params, setParams] = useSearchParams();
  const family = (FAMILY_BY_ID.has(params.get('f') as FamilyId) ? params.get('f') : undefined) as FamilyId | undefined;
  const fam = family ? FAMILY_BY_ID.get(family) : undefined;
  const sub = fam?.subfamilies.some((s) => s.id === params.get('s')) ? params.get('s')! : undefined;
  const d = (DISC_NAME.has(params.get('d') as DisciplineId) ? params.get('d') : undefined) as DisciplineId | undefined;
  const q = params.get('q') ?? '';
  const set = (k: string, v: string | undefined) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };
  const terms = findTerms({ family, sub, discipline: d, query: q });
  const title = fam?.label ?? 'Recherche';
  return (
    <div className="page enc-page" data-testid="encyclopedia-list" data-family={family ?? ''}>
      <PageHead title={title} eyebrow={fam ? `Encyclopédie / ${fam.label}` : 'Encyclopédie'} />
      {fam && <p className="enc-lead">{fam.short}</p>}
      <SearchField value={q} onChange={(v) => set('q', v || undefined)} placeholder={fam ? `Rechercher dans ${fam.label.toLowerCase()}…` : 'Rechercher un terme…'} testId="enc-list-search" />
      <div className="chip-scroll" role="radiogroup" aria-label="Discipline" data-testid="enc-disciplines">
        <button type="button" role="radio" aria-checked={!d} className={`chip ${!d ? 'on' : ''}`} onClick={() => set('d', undefined)} data-testid="enc-d-toutes">
          Toutes
        </button>
        {DISCIPLINES.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={d === x.id} className={`chip ${d === x.id ? 'on' : ''}`} onClick={() => set('d', x.id)} data-testid={`enc-d-${x.id}`}>
            {x.name}
          </button>
        ))}
      </div>
      {fam && (
        <select className="input enc-select" value={sub ?? ''} onChange={(e) => set('s', e.target.value || undefined)} aria-label="Sous-catégorie" data-testid="enc-sub">
          <option value="">Toutes les sous-catégories</option>
          {fam.subfamilies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}
      <p className="small muted" aria-live="polite" data-testid="enc-count">
        {terms.length} {terms.length > 1 ? 'termes' : 'terme'}
      </p>
      {terms.length ? (
        <ul className="enc-list" data-testid="enc-results">
          {terms.map((t) => (
            <TermRow key={t.id} t={t} showFamily={!fam} />
          ))}
        </ul>
      ) : (
        <p className="muted" data-testid="enc-no-result">
          Aucun terme ne correspond à ces filtres.
        </p>
      )}
    </div>
  );
}

const formatDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const LANG: Record<string, string> = { fr: 'français', en: 'anglais', ja: 'japonais', th: 'thaï', pt: 'portugais du Brésil' };

/** 4–6, 9, 10. a sheet: picture, names, disciplines, then tabs adapted to what the term has */
export function EncyclopediaTerm() {
  useEncyclopediaBar(null);
  const { id } = useParams();
  const t = id ? TERM_BY_ID.get(id) : undefined;
  const fav = useGoals((s) => (t ? s.favTerms.includes(t.id) : false));
  const toggle = useGoals((s) => s.toggleTerm);
  const [tab, setTab] = useState('def');
  if (!t) return <EmptyState title="Terme introuvable" action={<Link to="/encyclopedie" className="btn">Retour à l’encyclopédie</Link>} />;
  const fam = FAMILY_BY_ID.get(t.family)!;
  const img = imageOf(t.image);
  const tabs = [
    { id: 'def', label: 'Définition' },
    ...(t.sections ?? []).map((s, i) => ({ id: `s${i}`, label: s.title })),
    ...(t.byDiscipline ? [{ id: 'disc', label: 'Par discipline' }] : []),
    { id: 'src', label: 'Sources' },
  ].map((x) => ({ ...x, testId: `enc-tab-${x.id}` }));
  const current = tabs.some((x) => x.id === tab) ? tab : 'def';
  const section = current.startsWith('s') && current !== 'src' ? t.sections![Number(current.slice(1))] : undefined;
  const apps = (t.techniques ?? []).map((x) => TECHNIQUE_BY_ID.get(x)).filter(Boolean);
  const partners = (t.partner ?? []).map((x) => PARTNER_BY_ID.get(x)).filter(Boolean);
  return (
    <article className="page enc-page enc-term" data-testid="encyclopedia-term" data-term={t.id}>
      <PageHead
        title={t.name}
        eyebrow={`Encyclopédie / ${fam.label}`}
        right={
          <button type="button" className="btn icon ghost enc-fav" aria-pressed={fav} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={() => toggle(t.id)} data-testid="enc-fav">
            <AppIcon id="favorite" size={22} className={fav ? 'on' : ''} />
          </button>
        }
      />
      <figure className="enc-figure" data-testid="enc-figure">
        <EncImage id={t.image} />
        {img?.frames ? (
          <figcaption className="enc-frames" aria-hidden>
            <span>Début</span>
            <span>Mi-chemin</span>
            <span>Moment clé</span>
          </figcaption>
        ) : null}
      </figure>
      <p className="enc-subtitle">{t.subtitle}</p>
      <ul className="enc-discs" aria-label="Disciplines concernées" data-testid="enc-term-disciplines">
        {t.disciplines.map((x) => (
          <li key={x} className="enc-tag">
            {discName(x)}
          </li>
        ))}
      </ul>
      <Tabs items={tabs} value={current} onChange={setTab} label="Sections de la fiche" variant="underline" />
      <div className="enc-tabpanel" role="tabpanel" data-testid="enc-tabpanel">
        {current === 'def' && (
          <>
            <p data-testid="enc-definition">{t.definition}</p>
            {(t.intl || t.aliases?.length || t.origin) && (
              <dl className="enc-names" data-testid="enc-names">
                {t.intl && (
                  <>
                    <dt>Nom international</dt>
                    <dd>{t.intl}</dd>
                  </>
                )}
                {t.aliases?.length ? (
                  <>
                    <dt>Aussi appelé</dt>
                    <dd>{t.aliases.join(', ')}</dd>
                  </>
                ) : null}
                {t.origin && t.origin.lang !== 'fr' && (
                  <>
                    <dt>Origine du mot</dt>
                    <dd>
                      {LANG[t.origin.lang]}
                      {t.origin.note ? ` : ${t.origin.note}` : ''}
                    </dd>
                  </>
                )}
              </dl>
            )}
            {t.rule && (
              <p className="note small" data-testid="enc-rule">
                Règle de référence : {t.rule.org}, {t.rule.text}.
              </p>
            )}
            {apps.length > 0 && (
              <div className="enc-links" data-testid="enc-app-links">
                <h3>Dans l’application</h3>
                {apps.map((x) => (
                  <Link key={x!.id} to={`/techniques/${x!.id}`} className="btn ghost enc-link" data-testid="enc-app-link">
                    Voir la technique : {x!.name}
                    <AppIcon id="chevron" size={16} />
                  </Link>
                ))}
              </div>
            )}
            {partners.length > 0 && (
              <div className="enc-links" data-testid="enc-partner-links">
                {apps.length === 0 && <h3>Dans l’application</h3>}
                {partners.map((x) => (
                  <Link key={x!.id} to={`/partenaire/${x!.id}`} className="btn ghost enc-link">
                    Fiche avec partenaire : {x!.name}
                    <AppIcon id="chevron" size={16} />
                  </Link>
                ))}
              </div>
            )}
            {t.related?.length ? (
              <div className="enc-related" data-testid="enc-related">
                <h3>Termes associés</h3>
                <ul>
                  {t.related.map((r) => {
                    const o = TERM_BY_ID.get(r);
                    return o ? (
                      <li key={r}>
                        <Link to={`/encyclopedie/terme/${r}`} className="chip">
                          {o.name}
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
        {section && (
          <ul className="enc-points" data-kind={section.kind}>
            {section.kind === 'regle' && <li className="enc-kind">Règle officielle : elle dépend de l’organisation citée.</li>}
            {section.kind === 'variante' && <li className="enc-kind">Variante : les écoles ou les règlements diffèrent.</li>}
            {section.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        )}
        {current === 'disc' && t.byDiscipline && (
          <dl className="enc-names" data-testid="enc-by-discipline">
            {(Object.entries(t.byDiscipline) as [DisciplineId, string][]).map(([k, v]) => (
              <div key={k}>
                <dt>{discName(k)}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {current === 'src' && (
          <div data-testid="enc-sources">
            <ul className="enc-sources">
              {t.sources.map((sid) => {
                const s = encyclopediaSource(sid);
                return s ? (
                  <li key={sid}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.by}, « {s.title} »
                    </a>
                    <span className="small muted"> Consultée le {formatDate(s.consulted)}.</span>
                  </li>
                ) : null;
              })}
            </ul>
            <p className="small muted" data-testid="enc-validation">
              {t.status === 'validee' ? `Relue par ${t.reviewedBy}.` : `Vérifiée sur ces sources le ${formatDate(t.checked)}. Relecture par un expert : à venir.`}
            </p>
            {img && (
              <p className="small muted" data-testid="enc-image-origin">
                Illustration : {img.origin.kind === 'rendu-3d' ? `${img.origin.what}. ${img.origin.tool}, ${formatDate(img.origin.date)}.` : `à produire. ${img.origin.brief}`}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/** 7. A–Z: the letters that exist, then the names (and the aliases, « alias → nom ») of the chosen letter */
export function EncyclopediaAz() {
  useEncyclopediaBar('az');
  const [params, setParams] = useSearchParams();
  const az = useMemo(azIndex, []);
  const letters = [...az.keys()].sort();
  const l = params.get('l')?.toUpperCase();
  const list = l ? az.get(l) : undefined;
  return (
    <div className="page enc-page" data-testid="encyclopedia-az">
      <PageHead title="Index alphabétique" eyebrow="Encyclopédie" />
      <p className="enc-lead">Accède rapidement à un terme.</p>
      <div className="enc-letters" role="group" aria-label="Lettres" data-testid="enc-letters">
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((x) => {
          const on = letters.includes(x);
          return (
            <button key={x} type="button" className={`enc-letter ${l === x ? 'on' : ''}`} disabled={!on} aria-pressed={l === x} onClick={() => setParams({ l: x }, { replace: true })} data-testid={`enc-letter-${x}`} aria-label={on ? `Lettre ${x}` : `Lettre ${x} : aucun terme`}>
              {x}
            </button>
          );
        })}
      </div>
      {list && (
        <ul className="enc-az-list" data-testid="enc-az-list" aria-label={`Termes en ${l}`}>
          {list.map((e) => (
            <li key={`${e.label}-${e.term.id}`}>
              <Link to={`/encyclopedie/terme/${e.term.id}`} className="enc-az-item" data-testid="enc-az-item" data-term={e.term.id}>
                <span>{e.label}</span>
                {e.alias && <span className="muted small"> → {e.term.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 8. favourites, kept on this device with the other favourites (store/goals.ts) */
export function EncyclopediaFavorites() {
  useEncyclopediaBar('favoris');
  const ids = useGoals((s) => s.favTerms);
  const terms = ids.map((id) => TERM_BY_ID.get(id)).filter((t): t is Term => !!t);
  return (
    <div className="page enc-page" data-testid="encyclopedia-favorites">
      <PageHead title="Termes favoris" eyebrow="Mes favoris" />
      <p className="enc-lead">Retrouve les termes que tu as enregistrés.</p>
      {terms.length ? (
        <ul className="enc-list" data-testid="enc-results">
          {terms.map((t) => (
            <TermRow key={t.id} t={t} showFamily />
          ))}
        </ul>
      ) : (
        <p className="muted" data-testid="enc-no-favorite">
          Aucun favori pour l’instant. Sur une fiche, touche le cœur pour l’enregistrer ici.
        </p>
      )}
    </div>
  );
}
