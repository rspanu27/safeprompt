import {
  DETECTORS,
  SEVERITY_RANK,
  scanText,
  type Finding,
  type ScanResult,
  type Severity,
} from '@safeprompt/core';
import { useDeferredValue, useMemo, useState } from 'react';
import { segment } from './highlight';
import { SAMPLES } from './samples';

const REPO = 'https://github.com/rspanu27/safeprompt';
const NAMES = new Map(DETECTORS.map((d) => [d.id, d.name]));

// The first scan also compiles every pattern, so it takes around 20 ms instead
// of the usual 0.3 ms. Running one scan when the page loads means the time
// shown to the user is the normal scanning time.
scanText(SAMPLES.map((s) => s.text).join('\n'));

interface Group {
  readonly id: string;
  readonly name: string;
  readonly severity: Severity;
  readonly count: number;
  readonly evidence: readonly string[];
}

function groupFindings(findings: readonly Finding[]): Group[] {
  const groups = new Map<string, Finding[]>();
  for (const f of findings) groups.set(f.detectorId, [...(groups.get(f.detectorId) ?? []), f]);

  return [...groups]
    .map(([id, members]) => {
      const worst = members.reduce((a, b) =>
        SEVERITY_RANK[b.severity] > SEVERITY_RANK[a.severity] ? b : a,
      );
      return {
        id,
        name: NAMES.get(id) ?? worst.label,
        severity: worst.severity,
        count: members.length,
        evidence: [...new Set(members.flatMap((m) => m.evidence))],
      };
    })
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

interface Timed {
  readonly result: ScanResult;
  readonly ms: number;
}

function scan(text: string): Timed {
  const start = performance.now();
  const result = scanText(text);
  return { result, ms: performance.now() - start };
}

export function App() {
  const [text, setText] = useState(SAMPLES[0]?.text ?? '');
  // Typing stays responsive on a large paste: React renders the keystroke
  // first and catches the results up behind it.
  const deferred = useDeferredValue(text);
  const { result, ms } = useMemo(() => scan(deferred), [deferred]);
  const groups = groupFindings(result.findings);
  const clean = result.findings.length === 0;

  return (
    <div className="page">
      <header>
        <h1>
          <img src="./favicon.svg" alt="" width="28" height="28" />
          SafePrompt
        </h1>
        <p>
          This is the scanner from SafePrompt, a browser extension that checks what you paste into
          AI assistants for secrets and personal data. Everything runs in this page, and nothing you
          type is sent anywhere.
        </p>
      </header>

      <div className="samples" role="group" aria-label="Samples">
        <span>Try:</span>
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            aria-pressed={text === sample.text}
            onClick={() => {
              setText(sample.text);
            }}
          >
            {sample.label}
          </button>
        ))}
      </div>

      <main className="panes">
        <section>
          <h2>
            <label htmlFor="input">Your text</label>
          </h2>
          <textarea
            id="input"
            spellCheck={false}
            value={text}
            placeholder="Paste a log, a config file, a stack trace…"
            onChange={(e) => {
              setText(e.target.value);
            }}
          />
        </section>

        <section aria-live="polite">
          <h2>What SafePrompt sees</h2>

          <p className="verdict">
            {clean ? (
              <>
                <span className="dot clean" /> Nothing sensitive found
              </>
            ) : (
              <>
                <span className={`dot ${result.risk.level}`} />
                <strong>{result.risk.level} risk</strong> · {result.risk.score}/100 · looks like{' '}
                {result.context}
              </>
            )}
          </p>
          <p className="timing">
            Scanned {deferred.length.toLocaleString()} characters in {ms.toFixed(2)} ms
          </p>

          {!clean && (
            <ul className="findings">
              {groups.map((group) => (
                <li key={group.id}>
                  <span className={`dot ${group.severity}`} />
                  <div>
                    <strong>{group.name}</strong>
                    {group.count > 1 && <span className="count">×{group.count}</span>}
                    <p>{group.evidence.join('. ')}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h2>Redacted</h2>
          <pre>
            {segment(result.redacted, result.placeholders.keys()).map((part, i) =>
              part.token ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
            )}
          </pre>
        </section>
      </main>

      <footer>
        <a href={REPO}>Source on GitHub</a> ·{' '}
        <a href={`${REPO}/blob/main/docs/EVALUATION.md`}>Precision and recall</a> ·{' '}
        <a href={`${REPO}/blob/main/docs/ARCHITECTURE.md`}>How it works</a>
      </footer>
    </div>
  );
}
