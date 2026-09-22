import { summarise } from '../../history/history';
import type { SiteId } from '../../settings/schema';
import type { StorageArea } from '../../storage/area';
import { useHistory, useSettings } from '../hooks';
import { SITE_NAMES } from '../labels';
import { Mark } from '../Mark';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export interface PopupProps {
  readonly settingsArea: StorageArea;
  readonly historyArea: StorageArea;
  /** The active tab's site, or null if it is not one SafePrompt runs on. */
  readonly site: SiteId | null;
  readonly onOpenSettings: () => void;
  readonly now?: number;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export function Popup({ settingsArea, historyArea, site, onOpenSettings, now }: PopupProps) {
  const { settings, update } = useSettings(settingsArea);
  const history = useHistory(historyArea);

  if (settings === null) return <main className="popup" aria-busy="true" />;

  const week = summarise(history ?? [], (now ?? Date.now()) - WEEK);
  const siteOn = site !== null && settings.sites[site];
  const outcomes = [
    week.sentRedacted > 0 && `${week.sentRedacted} sent redacted`,
    week.sentOriginal > 0 && `${week.sentOriginal} sent original`,
    week.cancelled > 0 && `${week.cancelled} cancelled`,
  ].filter((part) => part !== false);

  return (
    <main className="popup">
      <header>
        <h1>
          <Mark size={22} />
          SafePrompt
        </h1>
        <p className={settings.enabled && siteOn ? 'status on' : 'status'}>
          {!settings.enabled
            ? 'Protection is off everywhere.'
            : site === null
              ? 'Open ChatGPT, Claude or Gemini to use SafePrompt.'
              : siteOn
                ? `Watching pastes on ${SITE_NAMES[site]}.`
                : `Paused on ${SITE_NAMES[site]}.`}
        </p>
      </header>

      <div className="group">
        <label className="row">
          <span>Protection</span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.enabled}
            onChange={(e) => {
              update({ enabled: e.target.checked });
            }}
          />
        </label>

        {site !== null && (
          <label className="row">
            <span>On {SITE_NAMES[site]}</span>
            <input
              type="checkbox"
              role="switch"
              checked={settings.sites[site]}
              disabled={!settings.enabled}
              onChange={(e) => {
                update({ sites: { ...settings.sites, [site]: e.target.checked } });
              }}
            />
          </label>
        )}
      </div>

      <section className="stats" aria-label="This week">
        {week.held === 0 ? (
          <p className="muted">Nothing held this week.</p>
        ) : (
          <>
            <p>
              <strong>{plural(week.held, 'paste', 'pastes')} held this week</strong>
            </p>
            <p className="muted">{outcomes.join(', ')}.</p>
            <div className="split" aria-hidden="true">
              <i className="redacted" style={{ flexGrow: week.sentRedacted }} />
              <i className="original" style={{ flexGrow: week.sentOriginal }} />
              <i className="cancelled" style={{ flexGrow: week.cancelled }} />
            </div>
          </>
        )}
      </section>

      <button type="button" className="link" onClick={onOpenSettings}>
        Settings and history
      </button>
    </main>
  );
}
