/**
 * 2.10.6: the list of « Nouveautés » (every version and what it brought). Its own chunk, loaded when the panel
 * opens: the bar only needs the latest version number (src/domain/releaseNotice.ts).
 */
import { RELEASES, RELEASE_CATEGORY_LABEL, releaseDateLabel } from '../../domain/releases';

export default function NewsList({ onGo }: { onGo: (to: string) => void }) {
  return (
    <div className="news-list" data-testid="news-list">
      {RELEASES.map((r, i) => (
        <article key={r.version} className="nav-version" data-version={r.version} aria-labelledby={`v-${r.version}`}>
          <b id={`v-${r.version}`}>
            Version {r.version}
            {i === 0 ? ' · la plus récente' : ''}
          </b>
          <div className="nav-version-meta">
            {releaseDateLabel(r.releaseDate)} · {r.title}
          </div>
          {r.categories.map((c) => (
            <div key={c} className="nav-version-cat">
              <span>{RELEASE_CATEGORY_LABEL[c]}</span>
              <ul>
                {r.changes
                  .filter((x) => x.category === c)
                  .map((x, k) => (
                    <li key={k}>{x.text}</li>
                  ))}
              </ul>
            </div>
          ))}
          {r.links.length > 0 && (
            <div className="nav-version-links">
              {r.links.map((l) => (
                <button key={l.to} type="button" className="nav-action" onClick={() => onGo(l.to)}>
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
