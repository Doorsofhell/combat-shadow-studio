import { EntryCard, PageHead } from '../components';
import { AppIcon } from '../icons';
import { FavoritesList } from './Library';

/**
 * 1.0.0 (refonte ergonomique, lot 2): Entraîner › Favoris. What used to be the Favoris tab of the library of
 * techniques (exercises, combinations and techniques kept with the star) and the way to the favourite legend
 * combinations, in the space where they are started.
 */
export function Favorites() {
  return (
    <div className="page">
      <PageHead title="Favoris" eyebrow="Entraîner" back={false} />
      <div className="stack" style={{ gap: 16 }} data-testid="favorites-page">
        <FavoritesList />
        <EntryCard to="/champions?vue=favoris" icon={<AppIcon id="favorite" />} title="Mes combinaisons favorites" text="Les combinaisons de légendes que tu as gardées." testId="legends-favorites" />
      </div>
    </div>
  );
}
