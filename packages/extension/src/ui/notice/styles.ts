import { THEME_CSS } from '../theme';

/** Inlined into the notice's shadow root, like the dialog's styles. */
export const NOTICE_CSS = `
  ${THEME_CSS}

  .notice {
    width: min(340px, calc(100vw - 32px));
    padding: 14px 16px 12px;
    background: var(--sheet);
    color: var(--ink);
    border-radius: 12px;
    border-left: 4px solid var(--high);
    box-shadow: 0 0 0 1px var(--rule), 0 14px 32px rgb(0 0 0 / 22%);
    font: 13.5px/1.5 var(--sans);
    color-scheme: light dark;
  }

  p { margin: 0; }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 650;
  }

  .why { margin-top: 6px; color: var(--graphite); }

  /* The address is one long word, so let it break instead of overflowing. */
  .report { margin-top: 8px; color: var(--graphite); overflow-wrap: anywhere; }

  .actions { display: flex; justify-content: flex-end; margin-top: 10px; }

  a { color: var(--ink); font-weight: 500; text-underline-offset: 3px; }

  button {
    font: inherit;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 7px;
    border: 1px solid var(--rule);
    background: transparent;
    color: var(--ink);
    cursor: pointer;
  }

  button:hover { border-color: var(--graphite); }

  /* The address: a button, because clicking copies it, but it reads as a link. */
  button.link {
    padding: 0;
    border: none;
    border-radius: 2px;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .address { color: var(--ink); font-weight: 500; user-select: all; }
  .copied { color: var(--ink); }

  a:focus-visible,
  button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
`;
