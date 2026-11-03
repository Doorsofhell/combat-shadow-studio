import { useRef, useState } from 'react';
import { PREMIUM_CATEGORIES, PREMIUM_COMING_SOON } from '../../monetization/entitlements';
import { PREMIUM_OFFER, formatPrice } from '../../monetization/offer';
import { purchaseAvailable, restorePurchases, type RestoreResult } from '../../monetization/purchases';
import { usePremiumStatus } from '../../monetization/rights';
import { PageHead } from '../components';
import { AppIcon } from '../icons';
import { NavIcon } from '../nav/NavIcon';
import type { NavIconId } from '../nav/icons';
import { popLayer, pushLayer } from '../nav/layers';
import { NavPanel } from '../nav/NavSheets';
import { useNavActions } from '../nav/store';
import './premium.css';

const CATEGORY_ICON: Record<string, NavIconId> = {
  enchainements: 'layers',
  coaching: 'user',
  disciplines: 'swords',
  programmes: 'calendar',
  statistiques: 'chart',
  historique: 'history',
};

/**
 * The questions of « Questions fréquentes » (§5). The answers only state what is true in the app today: the offer is
 * a one-time purchase (PREMIUM_OFFER), no purchase system is wired yet, everything stays open meanwhile.
 */
const FAQ: { q: string; a: string }[] = [
  { q: 'S’agit-il d’un abonnement ?', a: 'Non. L’offre prévue est un achat unique, sans renouvellement automatique.' },
  { q: 'Les nouveautés seront-elles incluses ?', a: 'Le périmètre exact des futures fonctionnalités sera défini dans les conditions commerciales, qui ne sont pas encore publiées.' },
  {
    q: 'Sur quels appareils l’offre est-elle disponible ?',
    a: 'Cela dépendra des plateformes et du système d’achat intégrés. Aujourd’hui, aucun système d’achat n’est encore branché : l’application reste entièrement accessible.',
  },
  { q: 'Comment restaurer mon achat ?', a: 'Avec « Restaurer », dans la barre du bas. La procédure dépendra de la boutique utilisée.' },
];

type Panel = 'benefits' | 'faq' | 'restore' | 'offer';

/** one panel at a time, as a history layer: Retour, Android Back and the cross close it and leave the page as it was */
function usePremiumPanel() {
  const [panel, setPanel] = useState<Panel | null>(null);
  const layer = useRef(0);
  const close = () => {
    const id = layer.current;
    layer.current = 0;
    setPanel(null);
    if (id) popLayer(id);
  };
  const open = (p: Panel) => {
    if (panel === p) return close();
    // switching panel keeps the same history entry: one Back still closes it
    if (!layer.current)
      layer.current = pushLayer(() => {
        layer.current = 0;
        setPanel(null);
      });
    setPanel(p);
  };
  return { panel, open, close };
}

/**
 * v0.45 (Youssef, 2026-10-23, « REFONTE PAGE PREMIUM À VIE » and its definitive 5-screen mockup,
 * maquettes/premium-2026-10-23/): one screen without scroll (head, gem, one line of terms, the 2 × 3 grid, the dark
 * offer card), and four panels opened on demand over the page: Avantages, FAQ and Restaurer from the bar, Offre from
 * the card's button. Nothing is paid, simulated or restored for show: the panels say what exists today.
 */
export function PremiumPage() {
  const status = usePremiumStatus();
  const { panel, open, close } = usePremiumPanel();
  useNavActions({
    benefits: { run: () => open('benefits'), pressed: panel === 'benefits', ariaLabel: 'Avantages : détails des avantages' },
    faq: { run: () => open('faq'), pressed: panel === 'faq', ariaLabel: 'FAQ : questions fréquentes' },
    restore: { run: () => open('restore'), pressed: panel === 'restore', ariaLabel: 'Restaurer un achat' },
  });
  const premium = status === 'premium_lifetime';
  return (
    <div className="page dash premium-page" data-testid="premium-page">
      <PageHead title="Premium à vie" eyebrow="Menu / Premium" fallback="/" />
      <div className="premium-head">
        <span className="premium-gem" aria-hidden>
          <AppIcon id="diamond" size={36} tone="gold" />
        </span>
        <h2>{PREMIUM_OFFER.name}</h2>
        <p className="premium-tagline">{PREMIUM_OFFER.tagline}</p>
      </div>

      <p className="premium-terms" data-testid="premium-terms">
        <span className="premium-ok" aria-hidden>
          <NavIcon id="check" />
        </span>
        Un paiement. À vie. Sans abonnement.
      </p>

      <section className="premium-card premium-included" aria-labelledby="premium-included" data-testid="premium-benefits">
        <div className="premium-card-head">
          <h3 id="premium-included">Inclus dans Premium</h3>
          <AppIcon id="diamond" size={20} tone="gold" />
        </div>
        <ul className="premium-grid">
          {PREMIUM_CATEGORIES.map((c) => (
            <li key={c.id} data-category={c.id}>
              <NavIcon id={CATEGORY_ICON[c.id]} />
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
        <p className="premium-soon" data-testid="premium-soon">
          <NavIcon id="clock" />
          {PREMIUM_COMING_SOON} : à venir
        </p>
      </section>

      {premium ? (
        <section className="premium-offer" data-testid="premium-active">
          <b>Premium à vie activé</b>
          <span>Merci ! Tout Premium est à toi, sans renouvellement.</span>
        </section>
      ) : (
        <section className="premium-offer" data-testid="premium-buy">
          <b>Accès Premium à vie</b>
          <span>Paiement unique · Sans renouvellement</span>
          <button type="button" className="premium-cta" onClick={() => open('offer')} aria-haspopup="dialog" aria-expanded={panel === 'offer'} data-testid="premium-discover">
            Découvrir l’offre <span aria-hidden>→</span>
          </button>
        </section>
      )}

      {panel === 'benefits' && <BenefitsPanel onClose={close} />}
      {panel === 'faq' && <FaqPanel onClose={close} />}
      {panel === 'restore' && <RestorePanel onClose={close} />}
      {panel === 'offer' && <OfferPanel onClose={close} />}
    </div>
  );
}

/** a line that opens on tap (accordion): icon, title, chevron, then its text */
function Fold({ icon, title, children, initiallyOpen, testId }: { icon?: NavIconId; title: string; children: string; initiallyOpen?: boolean; testId?: string }) {
  const [on, setOn] = useState(!!initiallyOpen);
  const id = useRef(`fold-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <li className={`premium-fold ${on ? 'open' : ''}`} data-testid={testId}>
      <button type="button" aria-expanded={on} aria-controls={id} onClick={() => setOn(!on)}>
        {icon && <NavIcon id={icon} className="premium-fold-icon" />}
        <span className="premium-fold-title">{title}</span>
        <NavIcon id="chevron" className="premium-chevron" />
      </button>
      <p id={id} hidden={!on}>
        {children}
      </p>
    </li>
  );
}

function BenefitsPanel({ onClose }: { onClose: () => void }) {
  return (
    <NavPanel title="Détails des avantages" onClose={onClose} testId="premium-panel-benefits" closable aboveBar>
      <ul className="premium-folds">
        {PREMIUM_CATEGORIES.map((c) => (
          // open as in the mockup; a tap folds the line away
          <Fold key={c.id} icon={CATEGORY_ICON[c.id]} title={c.label} initiallyOpen testId={`benefit-${c.id}`}>
            {c.detail}
          </Fold>
        ))}
      </ul>
    </NavPanel>
  );
}

function FaqPanel({ onClose }: { onClose: () => void }) {
  return (
    <NavPanel title="Questions fréquentes" onClose={onClose} testId="premium-panel-faq" closable aboveBar>
      <ul className="premium-folds faq">
        {FAQ.map((f, i) => (
          <Fold key={f.q} title={f.q} initiallyOpen testId={`faq-${i}`}>
            {f.a}
          </Fold>
        ))}
      </ul>
    </NavPanel>
  );
}

const RESTORE_TEXT: Record<RestoreResult['kind'], string> = {
  indisponible: 'La restauration n’est pas encore disponible : aucun système d’achat n’est encore intégré à l’application. Rien n’a été payé ni modifié.',
  restaure: 'Ton accès Premium à vie est restauré.',
  'aucun-achat': 'Aucun achat Premium n’a été trouvé pour ce compte de la boutique.',
  erreur: 'La restauration n’a pas abouti. Réessaie plus tard.',
};

function RestorePanel({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RestoreResult | null>(null);
  const run = async () => {
    setBusy(true);
    setResult(await restorePurchases());
    setBusy(false);
  };
  return (
    <NavPanel title="Restaurer un achat" onClose={onClose} testId="premium-panel-restore" closable aboveBar>
      <div className="premium-panel-center">
        <span className="premium-round red" aria-hidden>
          <NavIcon id="restore" />
        </span>
        <h3>Restaurer ton accès Premium</h3>
        <p className="muted">Cette action permet de retrouver un achat existant sur cet appareil. Aucun nouveau paiement n’est effectué.</p>
      </div>
      <p className="premium-note">
        <NavIcon id="info" />
        La procédure dépend de la boutique utilisée (Google Play par exemple).
      </p>
      {result && (
        <p className={`premium-result ${result.kind}`} role="status" data-testid="restore-result" data-kind={result.kind}>
          {RESTORE_TEXT[result.kind]}
        </p>
      )}
      <button type="button" className="premium-cta block" onClick={run} disabled={busy} data-testid="restore-now">
        {busy ? 'Recherche en cours…' : 'Restaurer maintenant'}
      </button>
    </NavPanel>
  );
}

function OfferPanel({ onClose }: { onClose: () => void }) {
  const [asked, setAsked] = useState(false);
  const live = purchaseAvailable();
  return (
    <NavPanel title="Offre Premium" onClose={onClose} testId="premium-panel-offer" closable aboveBar>
      <div className="premium-panel-center">
        <span className="premium-round gold" aria-hidden>
          <AppIcon id="diamond" size={34} tone="gold" />
        </span>
        <h3>Accès Premium à vie</h3>
        <p className="muted">Paiement unique · Sans renouvellement</p>
      </div>
      <p className="premium-note">
        <NavIcon id="tag" />
        <span>
          Le tarif et les conditions de l’offre seront fournis par le système d’achat intégré à l’application.
          {PREMIUM_OFFER.indicative && (
            <>
              {' '}
              Prix de lancement indicatif : <b data-testid="premium-price">{formatPrice()}</b>.
            </>
          )}
        </span>
      </p>
      <ul className="premium-checks">
        {['Tous tes entraînements', 'Sans limite', 'Toutes les fonctionnalités actuelles'].map((t) => (
          <li key={t}>
            <NavIcon id="check" />
            {t}
          </li>
        ))}
      </ul>
      {asked && !live && (
        <p className="premium-result indisponible" role="status" data-testid="offer-result">
          Aucune option d’achat n’est disponible pour le moment : le paiement n’est pas encore ouvert. Tout reste accessible pendant la phase de préparation.
        </p>
      )}
      <button type="button" className="premium-cta block" onClick={() => setAsked(true)} data-testid="premium-pay">
        Voir les options disponibles
      </button>
    </NavPanel>
  );
}
