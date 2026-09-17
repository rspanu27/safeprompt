const HOST_ID = 'safeprompt-host';

export interface ModalHost {
  /** Where React mounts. Inside a closed shadow root. */
  readonly container: HTMLElement;
  readonly remove: () => void;
}

/**
 * Create an isolated mount point for our UI inside a hostile page.
 *
 * The shadow root is **closed**, so `element.shadowRoot` returns null to page
 * scripts: they cannot read the pre-redaction preview or retarget the buttons.
 * It also stops the page's CSS reaching in — a stylesheet that happened to
 * restyle our "Paste original" button to look like "Cancel" would be a security
 * problem, not a cosmetic one.
 */
export function createModalHost(doc: Document = document): ModalHost {
  doc.getElementById(HOST_ID)?.remove();

  const host = doc.createElement('div');
  host.id = HOST_ID;

  // The page may set `* { display: none }` or reposition anything it can select.
  host.style.setProperty('all', 'initial', 'important');
  host.style.setProperty('position', 'fixed', 'important');
  host.style.setProperty('inset', '0', 'important');
  host.style.setProperty('z-index', '2147483647', 'important');

  const shadow = host.attachShadow({ mode: 'closed' });

  const container = doc.createElement('div');
  shadow.appendChild(container);

  doc.body.appendChild(host);

  return { container, remove: () => host.remove() };
}
