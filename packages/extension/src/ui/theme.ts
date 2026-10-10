/**
 * Colours for UI that is injected into a page, shared by the dialog and the
 * notice. Set on the shadow host, so everything inside can use them. `all`
 * does not reset custom properties, so the two can live in the same rule.
 */
export const THEME_CSS = `
  :host {
    all: initial;

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
    --sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  @media (prefers-color-scheme: dark) {
    :host {
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
`;
