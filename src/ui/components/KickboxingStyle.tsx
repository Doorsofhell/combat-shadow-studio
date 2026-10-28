import { KB_STYLES, kbOnlyIn, kbRuling, kbStyleName, type KbStatus, type KbStyleChoice } from '../../domain/kickboxingStyles';
import { SOURCE_BY_ID } from '../../domain/biomech/sources';
import { useSettings } from '../../store/settings';
import { AppIcon } from '../icons';
import { FilterChips } from './Chips';
import { MenuChip } from './MenuChip';

/** the kick-boxing style chosen by the user, saved with the settings */
export function useKbStyle(): [KbStyleChoice, (s: KbStyleChoice) => void] {
  const style = useSettings((s) => s.settings.kickboxingStyle);
  const set = useSettings((s) => s.set);
  return [style, (kickboxingStyle) => set({ kickboxingStyle })];
}

const sourceNames = (ids: string[]) => [...new Set(ids)].map((id) => SOURCE_BY_ID.get(id)?.by ?? id).join(' ; ');

/** Style chooser of the kick-boxing lists, with what the chosen rules allow and their source. */
export function KickboxingStylePicker() {
  const [style, setStyle] = useKbStyle();
  const info = KB_STYLES.find((s) => s.id === style);
  return (
    <section className="stack" style={{ gap: 6 }} aria-label="Style de kick-boxing" data-testid="kb-style">
      <FilterChips
        scroll
        label="Style de kick-boxing"
        value={style}
        onChange={setStyle}
        testPrefix="kb-style-"
        options={[{ id: 'tous' as KbStyleChoice, label: 'Tous les styles' }, ...KB_STYLES.map((s) => ({ id: s.id as KbStyleChoice, label: s.name }))]}
      />
      <p className="small muted" data-testid="kb-style-summary">
        {info ? (
          <>
            <b>{info.name}</b> : {info.summary} <span>Source : {sourceNames(info.sources)}.</span>
          </>
        ) : (
          'Toutes les techniques du kick-boxing. Celles qui ne sont pas permises dans les trois styles portent le nom des styles qui les autorisent.'
        )}
      </p>
    </section>
  );
}

/** 1.1.0 (« trois menus »): the same choice as a chip of the filter line; the rules and their source are in its menu */
export function KickboxingStyleChip() {
  const [style, setStyle] = useKbStyle();
  return (
    <MenuChip
      label="Style de kick-boxing"
      value={style}
      onChange={setStyle}
      active={style !== 'tous'}
      chipLabel={style === 'tous' ? 'Style' : undefined}
      testId="kb-style-chip"
      testPrefix="kb-style-"
      options={[
        { id: 'tous' as KbStyleChoice, label: 'Tous les styles', description: 'Toutes les techniques du kick-boxing.' },
        ...KB_STYLES.map((s) => ({ id: s.id as KbStyleChoice, label: s.name, description: `${s.summary} Source : ${sourceNames(s.sources)}.` })),
      ]}
    />
  );
}

/** "K1 seulement" style badge, shown when "Tous les styles" is chosen and the rules differ */
export function KbOnlyBadge({ id }: { id: string }) {
  const [style] = useKbStyle();
  const only = kbOnlyIn(id);
  if (style !== 'tous' || !only) return null;
  return (
    <span className="badge" data-testid={`kb-only-${id}`}>
      {only.map(kbStyleName).join(', ')} seulement
    </span>
  );
}

const STATUS: Record<KbStatus, { label: string; icon: 'check' | 'close' | 'minus' }> = {
  autorise: { label: 'Autorisé', icon: 'check' },
  interdit: { label: 'Interdit', icon: 'close' },
  'sans-objet': { label: 'Non proposé', icon: 'minus' },
};

/** What each kick-boxing rule set says about one technique (technique sheet). */
export function KickboxingRulesCard({ id }: { id: string }) {
  const rows = KB_STYLES.map((s) => ({ s, r: kbRuling(id, s.id) }));
  if (rows.every(({ r }) => r.status === 'autorise' && !r.note)) return null;
  return (
    <div className="card stack" data-testid="kb-rules">
      <h3>Selon le style de kick-boxing</h3>
      <ul className="plain-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
        {rows.map(({ s, r }) => (
          <li key={s.id} data-testid={`kb-rule-${s.id}`}>
            <span className="row nowrap" style={{ gap: 6 }}>
              <AppIcon id={STATUS[r.status].icon} size={18} />
              <b>{s.name}</b> : {STATUS[r.status].label}
            </span>
            {r.note && <span className="small"> {r.note}</span>}
            {r.sources.length > 0 && <span className="small muted"> Source : {sourceNames(r.sources)}.</span>}
          </li>
        ))}
      </ul>
      <p className="small muted">Règlements de compétition résumés : vérifie toujours le règlement de ta fédération et de ta catégorie d’âge.</p>
    </div>
  );
}
