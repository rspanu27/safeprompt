/**
 * Everything the modal needs, inlined into the shadow root.
 *
 * No external stylesheet and no page styles reach in, so the rules can be plain
 * and unqualified. `all: initial` on the host means nothing is inherited.
 */
export const MODAL_CSS = `
  :host { all: initial; }

  .backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgb(15 23 42 / 45%);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }

  .panel {
    width: min(560px, calc(100vw - 32px));
    max-height: min(640px, calc(100vh - 48px));
    display: flex;
    flex-direction: column;
    background: #fff;
    color: #0f172a;
    border-radius: 12px;
    box-shadow: 0 24px 48px rgb(15 23 42 / 24%);
    overflow: hidden;
  }

  header { padding: 20px 24px 12px; }

  .level {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot.low { background: #64748b; }
  .dot.medium { background: #ca8a04; }
  .dot.high { background: #ea580c; }
  .dot.critical { background: #dc2626; }

  h1 { margin: 8px 0 4px; font-size: 18px; font-weight: 600; }
  .summary { margin: 0; font-size: 14px; color: #475569; line-height: 1.5; }

  .body { padding: 4px 24px 16px; overflow-y: auto; }

  h2 {
    margin: 16px 0 8px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
  }

  ul { margin: 0; padding: 0; list-style: none; }

  li {
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .finding-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
  }
  .finding-parts { margin: 4px 0 0 16px; font-size: 12.5px; color: #334155; }
  .finding-why { margin: 4px 0 0 16px; font-size: 12.5px; color: #64748b; line-height: 1.45; }

  .notice {
    margin: 0;
    padding: 10px 24px;
    font-size: 13px;
    color: #9a3412;
    background: #fff7ed;
    border-top: 1px solid #fed7aa;
  }

  pre {
    margin: 0;
    padding: 12px;
    max-height: 180px;
    overflow: auto;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 12.5px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 14px 24px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  button {
    font: inherit;
    font-size: 14px;
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #0f172a;
    cursor: pointer;
  }

  button:hover { background: #f1f5f9; }
  button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

  button.primary {
    background: #0f172a;
    border-color: #0f172a;
    color: #fff;
    font-weight: 500;
  }

  button.primary:hover { background: #1e293b; }
  button.subtle { border-color: transparent; color: #475569; }
  button.subtle:hover { background: #e2e8f0; }
`;
