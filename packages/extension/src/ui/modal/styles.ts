/**
 * Everything the modal needs, inlined into the shadow root.
 *
 * No external stylesheet and no page styles reach in, so the rules can be plain
 * and unqualified. `all: initial` on the host means nothing is inherited. It
 * uses system fonts, because a bundled font would have to be exposed to every
 * page as a web-accessible resource.
 */
export const MODAL_CSS = `
  :host { all: initial; }

  .backdrop {
    --page: #f4f6f8;
    --sheet: #ffffff;
    --ink: #18212b;
    --graphite: #5c6773;
    --rule: #d5dbe2;
    --bar: #000000;
    --bar-text: #f4f6f8;
    --focus: #1d5fd6;
    --low: #5c6773;
    --medium: #a86a00;
    --high: #c2410c;
    --critical: #b42318;
    --shade: rgb(24 33 43 / 42%);

    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--shade);
    color: var(--ink);
    font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  @media (prefers-color-scheme: dark) {
    .backdrop {
      --page: #151b22;
      --sheet: #1c232c;
      --ink: #e6eaef;
      --graphite: #9aa4af;
      --rule: #2e3844;
      --bar: #e6eaef;
      --bar-text: #151b22;
      --focus: #7fb0ff;
      --low: #9aa4af;
      --medium: #e0a53a;
      --high: #f08a4b;
      --critical: #f0645a;
      --shade: rgb(0 0 0 / 55%);
    }
  }

  .panel {
    width: min(580px, calc(100vw - 32px));
    max-height: min(680px, calc(100vh - 48px));
    display: flex;
    flex-direction: column;
    background: var(--sheet);
    border-radius: 14px;
    box-shadow: 0 1px 0 var(--rule), 0 28px 60px rgb(0 0 0 / 28%);
    overflow: hidden;
  }

  header { padding: 20px 24px 4px; }

  p { margin: 0; }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--graphite);
  }

  h1 {
    margin: 12px 0 8px;
    font-size: 21px;
    line-height: 1.25;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  .level {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    color: var(--graphite);
  }

  .level strong { color: var(--ink); font-weight: 600; }

  .meter { display: inline-flex; gap: 3px; }
  .meter i { width: 14px; height: 6px; border-radius: 1px; background: var(--rule); }
  .meter[data-level="low"] .on { background: var(--low); }
  .meter[data-level="medium"] .on { background: var(--medium); }
  .meter[data-level="high"] .on { background: var(--high); }
  .meter[data-level="critical"] .on { background: var(--critical); }

  .body { padding: 8px 24px 20px; overflow-y: auto; }

  h2 {
    margin: 18px 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--graphite);
  }

  pre {
    margin: 0;
    padding: 14px 16px;
    max-height: 200px;
    overflow: auto;
    background: var(--page);
    border-radius: 8px;
    font: 12.5px/1.7 ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .bar {
    margin: 0 1px;
    padding: 1px 3px;
    border-radius: 2px;
    background: linear-gradient(var(--bar), var(--bar)) no-repeat left / 100% 100%;
    color: var(--bar-text);
    font-size: 11.5px;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
    animation: sweep 360ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }

  @keyframes sweep {
    from { background-size: 0% 100%; color: var(--ink); }
    60% { color: var(--ink); }
    to { background-size: 100% 100%; color: var(--bar-text); }
  }

  @media (prefers-reduced-motion: reduce) {
    .bar { animation: none; }
  }

  ul { margin: 0; padding: 0; list-style: none; }

  li { padding: 10px 0; border-top: 1px solid var(--rule); }
  li:first-child { border-top: none; padding-top: 2px; }

  .finding-label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    font-weight: 600;
  }

  .severity { font-size: 12.5px; font-weight: 500; }
  .severity.low { color: var(--low); }
  .severity.medium { color: var(--medium); }
  .severity.high { color: var(--high); }
  .severity.critical { color: var(--critical); }

  .finding-parts { margin-top: 2px; font-size: 13px; }
  .finding-why { margin-top: 2px; font-size: 13px; color: var(--graphite); }

  .notice {
    padding: 10px 24px;
    font-size: 13px;
    color: var(--critical);
    border-top: 1px solid var(--rule);
  }

  footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 14px 24px 18px;
    border-top: 1px solid var(--rule);
  }

  button {
    font: inherit;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--rule);
    background: transparent;
    color: var(--ink);
    cursor: pointer;
  }

  button:hover { border-color: var(--graphite); }
  button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

  button.primary { background: var(--ink); border-color: var(--ink); color: var(--sheet); }
  button.primary:hover { opacity: 0.88; }

  button.subtle { margin-right: auto; border-color: transparent; color: var(--graphite); }
  button.subtle:hover { color: var(--ink); border-color: transparent; }

  @media (max-width: 480px) {
    header { padding: 18px 18px 4px; }
    .body { padding: 8px 18px 16px; }
    footer { flex-wrap: wrap; padding: 12px 18px 16px; }
    footer button { flex: 1 1 auto; }
    button.subtle { margin-right: 0; }
  }
`;
