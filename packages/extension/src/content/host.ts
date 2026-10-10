const HOST_ID = 'safeprompt-host';
const NOTICE_ID = 'safeprompt-notice';

export interface ModalHost {
  /** Where React mounts. Inside a closed shadow root. */
  readonly container: HTMLElement;
  readonly remove: () => void;
}

/**
 * Create a place to mount the dialog that the page can't interfere with.
 *
 * The shadow root is closed, so `element.shadowRoot` returns null to page
 * scripts and they can't read the preview or change the buttons. The page's
 * CSS doesn't apply inside it either. If a stylesheet could make the "Paste
 * original" button look like "Cancel", that would be a security problem.
 */
export function createModalHost(doc: Document = document): ModalHost {
  return createHost(doc, HOST_ID, { inset: '0' });
}

/**
 * The same protection for the small notice in the corner. It is only as big as
 * its content, so the rest of the page stays clickable.
 */
export function createNoticeHost(doc: Document = document): ModalHost {
  return createHost(doc, NOTICE_ID, { right: '16px', bottom: '16px' });
}

function createHost(doc: Document, id: string, place: Record<string, string>): ModalHost {
  doc.getElementById(id)?.remove();

  const host = doc.createElement('div');
  host.id = id;

  // The page may set `* { display: none }` or reposition anything it can select.
  host.style.setProperty('all', 'initial', 'important');
  host.style.setProperty('position', 'fixed', 'important');
  host.style.setProperty('z-index', '2147483647', 'important');
  for (const [property, value] of Object.entries(place)) {
    host.style.setProperty(property, value, 'important');
  }

  const shadow = host.attachShadow({ mode: 'closed' });

  const container = doc.createElement('div');
  shadow.appendChild(container);

  containEvents(host);
  doc.body.appendChild(host);

  return { container, remove: () => host.remove() };
}

/**
 * Most UI events are composed, so they cross the shadow boundary and reach the
 * page's own listeners retargeted to the host. Every supported site has
 * document-level click analytics, which would mean choosing "Cancel" on our
 * modal quietly fires a beacon from a page we do not control.
 *
 * Listening on the host during the bubble phase stops that: our own handlers,
 * which React attaches inside the shadow root, have already run by this point.
 */
function containEvents(host: HTMLElement): void {
  const contained = [
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'pointerdown',
    'pointerup',
    'keydown',
    'keyup',
    'keypress',
    'input',
    'paste',
    'focusin',
    'focusout',
  ];

  for (const type of contained) {
    host.addEventListener(type, (event) => {
      event.stopPropagation();
    });
  }
}
