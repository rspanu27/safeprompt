import type { PageStatus } from '../../content/status';
import { summarise } from '../../history/history';
import type { Settings, SiteId } from '../../settings/schema';
import type { StorageArea } from '../../storage/area';
import { useHistory, useSettings } from '../hooks';
import { SITE_NAMES } from '../labels';
import { Mark } from '../Mark';
import { ReportLinks } from '../ReportLinks';

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** What the tab's content script reported, or that it didn't answer at all. */
export type TabStatus = PageStatus | 'unreachable';

export interface PopupProps {
  readonly settingsArea: StorageArea;
  readonly historyArea: StorageArea;
  /** The active tab's site, or null if it is not one SafePrompt runs on. */
  readonly site: SiteId | null;
  /** Defaults to watching, for tabs where there is nothing to ask. */
  readonly page?: TabStatus;
  readonly onOpenSettings: () => void;
  readonly now?: number;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

interface Status {
  readonly text: string;
  readonly tone: 'on' | 'warn' | 'off';
}

/** One honest line about whether pastes in this tab are being checked. */
function statusFor(settings: Settings, site: SiteId | null, page: TabStatus): Status {
  if (!settings.enabled) return { text: 'Protection is off everywhere.', tone: 'off' };
  if (site === null) {
    return { text: 'Open ChatGPT, Claude or Gemini to use SafePrompt.', tone: 'off' };
  }

  const name = SITE_NAMES[site];
  if (!settings.sites[site]) return { text: `Paused on ${name}.`, tone: 'off' };

  if (page === 'unreachable') {
    return { text: `Reload this tab to start checking pastes on ${name}.`, tone: 'warn' };
  }
  if (page === 'no-composer') {
    return {
      text: "Can't find a message box on this page. Pastes here are not checked.",
      tone: 'warn',
    };
  }

  return { text: `Watching pastes on ${name}.`, tone: 'on' };
}

export function Popup({
  settingsArea,
  historyArea,
  site,
  page = 'watching',
  onOpenSettings,
  now,
}: PopupProps) {
  const { settings, update } = useSettings(settingsArea);
  const history = useHistory(historyArea);

  if (settings === null) return <main className="popup" aria-busy="true" />;

  const week = summarise(history ?? [], (now ?? Date.now()) - WEEK);
  const status = statusFor(settings, site, page);
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
        <p className={`status ${status.tone}`}>{status.text}</p>
        {site !== null && status.tone === 'warn' && page === 'no-composer' && (
          <p className="hint">
            Is this a chat page? <ReportLinks site={site} />
          </p>
        )}
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
