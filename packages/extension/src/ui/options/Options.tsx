import { allowlistPatternProblem, type Severity } from '@safeprompt/core';
import { useEffect, useState } from 'react';
import { clearHistory } from '../../history/history';
import { SITES } from '../../settings/schema';
import type { StorageArea } from '../../storage/area';
import { useHistory, useSettings } from '../hooks';
import {
  ACTION_NAMES,
  CATEGORY_NAMES,
  DETECTORS_BY_CATEGORY,
  LEVEL_NAMES,
  SITE_NAMES,
  THRESHOLD_OPTIONS,
  siteName,
} from '../labels';
import { Mark } from '../Mark';
import { Meter } from '../Meter';

export interface OptionsProps {
  readonly settingsArea: StorageArea;
  readonly historyArea: StorageArea;
}

const lines = (text: string): string[] =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

const when = (at: number): string =>
  new Date(at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function Options({ settingsArea, historyArea }: OptionsProps) {
  const { settings, update } = useSettings(settingsArea);
  const history = useHistory(historyArea);
  const [allowDraft, setAllowDraft] = useState<string | null>(null);

  // Fill the text box once settings load, then leave it alone while the user
  // edits. Resetting it every time storage changes would lose their typing.
  useEffect(() => {
    if (settings !== null && allowDraft === null) setAllowDraft(settings.allowlist.join('\n'));
  }, [settings, allowDraft]);

  if (settings === null || allowDraft === null) {
    return <main className="options" aria-busy="true" />;
  }

  const problems = lines(allowDraft)
    .map((pattern) => ({ pattern, problem: allowlistPatternProblem(pattern) }))
    .filter((p) => p.problem !== null);

  return (
    <main className="options">
      <header>
        <h1>
          <Mark size={28} />
          SafePrompt settings
        </h1>
        <p className="muted">
          Everything runs in your browser. Nothing you paste is stored or sent anywhere.
        </p>
      </header>

      <section>
        <h2>Protection</h2>
        <label className="row">
          <span>Check pastes before they are sent</span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.enabled}
            onChange={(e) => {
              update({ enabled: e.target.checked });
            }}
          />
        </label>

        <label className="stack">
          <span>Hold a paste when it contains</span>
          <select
            value={settings.threshold}
            disabled={!settings.enabled}
            onChange={(e) => {
              update({ threshold: e.target.value as Severity });
            }}
          >
            {THRESHOLD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h2>What to look for</h2>
        {DETECTORS_BY_CATEGORY.map(([category, detectors]) => (
          <label className="row" key={category}>
            <span>
              {CATEGORY_NAMES[category]}
              <small className="muted">{detectors.map((d) => d.name).join(', ')}</small>
            </span>
            <input
              type="checkbox"
              checked={settings.categories[category]}
              onChange={(e) => {
                update({ categories: { ...settings.categories, [category]: e.target.checked } });
              }}
            />
          </label>
        ))}
      </section>

      <section>
        <h2>Sites</h2>
        {SITES.map((site) => (
          <label className="row" key={site}>
            <span>{SITE_NAMES[site]}</span>
            <input
              type="checkbox"
              role="switch"
              checked={settings.sites[site]}
              onChange={(e) => {
                update({ sites: { ...settings.sites, [site]: e.target.checked } });
              }}
            />
          </label>
        ))}
      </section>

      <section>
        <h2>Allowlist</h2>
        <p className="muted">
          Values you have decided are safe to share, one per line. <code>*</code> matches any run of
          characters, so <code>*.staging.internal</code> covers every staging host.
        </p>
        <textarea
          aria-label="Allowlist"
          rows={5}
          spellCheck={false}
          value={allowDraft}
          onChange={(e) => {
            setAllowDraft(e.target.value);
          }}
          onBlur={() => {
            update({ allowlist: lines(allowDraft) });
          }}
        />
        {problems.length > 0 && (
          <ul className="problems" role="alert">
            {problems.map(({ pattern, problem }) => (
              <li key={pattern}>
                <code>{pattern}</code> will be ignored: {problem}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>History</h2>
        <label className="row">
          <span>
            Keep a record of held pastes
            <small className="muted">
              What kind of thing was found and what you chose. Never the text itself.
            </small>
          </span>
          <input
            type="checkbox"
            checked={settings.history}
            onChange={(e) => {
              update({ history: e.target.checked });
            }}
          />
        </label>

        {history === null || history.length === 0 ? (
          <p className="muted">No held pastes yet.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Site</th>
                  <th>Risk</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 50).map((entry, index) => (
                  <tr key={`${entry.at}-${index}`}>
                    <td>{when(entry.at)}</td>
                    <td>{siteName(entry.site)}</td>
                    <td>
                      <span className="risk">
                        <Meter level={entry.level} />
                        {LEVEL_NAMES[entry.level]}
                      </span>
                    </td>
                    <td>{ACTION_NAMES[entry.action]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={() => {
                clearHistory(historyArea).catch(() => undefined);
              }}
            >
              Clear history
            </button>
          </>
        )}
      </section>
    </main>
  );
}
