import {
  DETECTORS,
  SEVERITY_RANK,
  scanText,
  splitRedacted,
  type ContentContext,
  type Finding,
  type ScanResult,
  type Severity,
} from '@safeprompt/core';
import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { familyOf, markSpans } from './highlight';
import { SAMPLES } from './samples';

const REPO = 'https://github.com/rspanu27/safeprompt';
const NAMES = new Map(DETECTORS.map((d) => [d.id, d.name]));

const LEVEL_NAMES: Record<Severity, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical risk',
};

const CONTEXT_PHRASES: Record<ContentContext, string> = {
  'source-code': 'source code',
  'env-file': 'an env file',
  'stack-trace': 'a stack trace',
  json: 'JSON',
  sql: 'SQL',
  log: 'a log',
  'plain-text': 'plain text',
};

// The first scan also compiles every pattern, so it takes around 20 ms instead
// of the usual 0.3 ms. Running one scan when the page loads means the time
// shown to the user is the normal scanning time.
scanText(SAMPLES.map((s) => s.text).join('\n'));

interface Group {
  readonly id: string;
  readonly name: string;
  readonly severity: Severity;
  readonly count: number;
  readonly parts: readonly string[];
  readonly evidence: readonly string[];
  /** Placeholder types this detector produced, to find its bars in the sent view. */
  readonly families: ReadonlySet<string>;
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
        parts: [...new Set(members.map((m) => m.label))],
        evidence: [...new Set(members.flatMap((m) => m.evidence))],
        families: new Set(members.map((m) => m.redaction.placeholder)),
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

function Meter({ level }: { readonly level: Severity }) {
  const filled = SEVERITY_RANK[level] + 1;
  return (
    <span className="meter" data-level={level} aria-hidden="true">
      {[1, 2, 3, 4].map((step) => (
        <i key={step} className={step <= filled ? 'on' : undefined} />
      ))}
    </span>
  );
}

function detail(group: Group): string | null {
  if (group.parts.length > 1) return group.parts.join(', ');
  if (group.count > 1) return `${group.count} found`;
  return null;
}

type View = 'original' | 'sent';

export function App() {
  const [text, setText] = useState(SAMPLES[0]?.text ?? '');
  const [view, setView] = useState<View>('original');
  const [hot, setHot] = useState<string | null>(null);
  const backdrop = useRef<HTMLDivElement>(null);

  // Typing stays responsive on a large paste: React renders the keystroke
  // first and catches the results up behind it.
  const deferred = useDeferredValue(text);
  const { result, ms } = useMemo(() => scan(deferred), [deferred]);
  const groups = groupFindings(result.findings);
  const clean = result.findings.length === 0;
  const hotFamilies = groups.find((g) => g.id === hot)?.families;

  // Spans only line up with the text they were found in, so while a scan is
  // catching up the highlight layer shows the text unmarked.
  const marked =
    deferred === text ? markSpans(text, result.findings) : [{ text, detectorId: null }];

  let markIndex = 0;
  let barIndex = 0;

  return (
    <div className="page">
      <header className="masthead">
        <p className="wordmark">
          <img src="./favicon.svg" alt="" width="26" height="26" />
          SafePrompt
        </p>
        <nav aria-label="Project">
          <a href={REPO}>Source code</a>
          <a href={`${REPO}/blob/main/docs/ARCHITECTURE.md`}>How it works</a>
        </nav>
      </header>

      <section className="intro">
        <h1>See what an AI assistant would receive.</h1>
        <p>
          SafePrompt is a browser extension that checks what you paste into ChatGPT, Claude and
          Gemini for secrets and personal data. This page runs the same scanner. Nothing you type
          here leaves the page.
        </p>
      </section>

      <div className="samples" role="group" aria-label="Examples">
        <span>Try an example:</span>
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            aria-pressed={text === sample.text}
            onClick={() => {
              setText(sample.text);
              setHot(null);
            }}
          >
            {sample.label}
          </button>
        ))}
      </div>

      <main className="desk">
        <div className="sheet" data-hot={hot !== null || undefined}>
          <div className="toolbar">
            <div className="toggle" role="group" aria-label="View">
              <button
                type="button"
                aria-pressed={view === 'original'}
                onClick={() => {
                  setView('original');
                }}
              >
                Original
              </button>
              <button
                type="button"
                aria-pressed={view === 'sent'}
                onClick={() => {
                  setView('sent');
                }}
              >
                As it would be sent
              </button>
            </div>
            <p className="timing">
              Scanned {deferred.length.toLocaleString()} characters in {ms.toFixed(2)} ms
            </p>
          </div>

          {view === 'original' ? (
            <div className="editor">
              <div className="highlights" ref={backdrop} aria-hidden="true">
                {marked.map((part, i) =>
                  part.detectorId === null ? (
                    part.text
                  ) : (
                    <mark
                      key={i}
                      className={part.detectorId === hot ? 'hot' : undefined}
                      style={{ animationDelay: `${Math.min(markIndex++, 12) * 40}ms` }}
                    >
                      {part.text}
                    </mark>
                  ),
                )}
                {/* A trailing newline in a textarea still takes a line. */}{' '}
              </div>
              <textarea
                aria-label="Text to scan"
                spellCheck={false}
                value={text}
                placeholder="Paste a log, a config file or a stack trace"
                onChange={(e) => {
                  setText(e.target.value);
                }}
                onScroll={(e) => {
                  if (backdrop.current !== null) {
                    backdrop.current.scrollTop = e.currentTarget.scrollTop;
                  }
                }}
              />
            </div>
          ) : (
            <pre aria-label="Redacted text" key={deferred}>
              {splitRedacted(result.redacted, result.placeholders.keys()).map((part, i) =>
                part.token ? (
                  <span
                    key={i}
                    className={hotFamilies?.has(familyOf(part.text)) ? 'bar hot' : 'bar'}
                    style={{ animationDelay: `${Math.min(barIndex++, 12) * 40}ms` }}
                  >
                    {part.text}
                  </span>
                ) : (
                  part.text
                ),
              )}
            </pre>
          )}
        </div>

        <aside className="margin" aria-live="polite">
          {clean ? (
            <div className="verdict">
              <p className="level">
                <span className="clear" aria-hidden="true" />
                <strong>Nothing sensitive found</strong>
              </p>
              <p>SafePrompt would let this paste through without asking.</p>
            </div>
          ) : (
            <div className="verdict">
              <p className="level">
                <Meter level={result.risk.level} />
                <strong>{LEVEL_NAMES[result.risk.level]}</strong>
              </p>
              <p>
                Looks like {CONTEXT_PHRASES[result.context]}. SafePrompt would hold this paste and
                offer to replace {result.placeholders.size}{' '}
                {result.placeholders.size === 1 ? 'value' : 'values'} with placeholders.
              </p>
            </div>
          )}

          {!clean && (
            <ul className="notes">
              {groups.map((group) => (
                <li
                  key={group.id}
                  tabIndex={0}
                  className={group.id === hot ? 'hot' : undefined}
                  onMouseEnter={() => {
                    setHot(group.id);
                  }}
                  onMouseLeave={() => {
                    setHot(null);
                  }}
                  onFocus={() => {
                    setHot(group.id);
                  }}
                  onBlur={() => {
                    setHot(null);
                  }}
                >
                  <p className="note-title">
                    <span>{group.name}</span>
                    <span className={`severity ${group.severity}`}>{group.severity}</span>
                  </p>
                  {detail(group) !== null && <p className="note-parts">{detail(group)}</p>}
                  <p className="note-why">{group.evidence.join('. ')}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>

      <footer>
        <p>
          Measured on a labelled test set in CI:{' '}
          <a href={`${REPO}/blob/main/docs/EVALUATION.md`}>precision and recall report</a>.
        </p>
      </footer>
    </div>
  );
}
