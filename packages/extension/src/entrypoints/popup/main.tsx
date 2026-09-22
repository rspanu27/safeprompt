import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { resolveAdapter } from '../../content/adapters';
import { SITES, type SiteId } from '../../settings/schema';
import { localArea } from '../../storage/browser';
import { Popup } from '../../ui/popup/Popup';
import '@fontsource-variable/atkinson-hyperlegible-next';
import '@fontsource-variable/atkinson-hyperlegible-mono';
import '../../ui/pages.css';

/**
 * Which supported site the active tab is on.
 *
 * `tab.url` is only visible for origins in host_permissions, so this doesn't
 * need the `tabs` permission. On any other site it is undefined, which is fine
 * because SafePrompt doesn't run there anyway.
 */
async function activeSite(): Promise<SiteId | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.url === undefined) return null;

  const id = resolveAdapter(new URL(tab.url)).id;
  return (SITES as readonly string[]).includes(id) ? (id as SiteId) : null;
}

function mount(container: HTMLElement, site: SiteId | null): void {
  createRoot(container).render(
    <Popup
      settingsArea={localArea}
      historyArea={localArea}
      site={site}
      onOpenSettings={() => {
        browser.runtime.openOptionsPage().catch(() => undefined);
      }}
    />,
  );
}

const container = document.getElementById('root');

if (container !== null) {
  activeSite().then(
    (site) => {
      mount(container, site);
    },
    () => {
      mount(container, null);
    },
  );
}
