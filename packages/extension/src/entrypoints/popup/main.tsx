import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { resolveAdapter } from '../../content/adapters';
import { STATUS_REQUEST, isPageStatus } from '../../content/status';
import { SITES, type SiteId } from '../../settings/schema';
import { localArea } from '../../storage/browser';
import { Popup, type TabStatus } from '../../ui/popup/Popup';
import '@fontsource-variable/atkinson-hyperlegible-next';
import '@fontsource-variable/atkinson-hyperlegible-mono';
import '../../ui/pages.css';

interface ActiveTab {
  readonly site: SiteId | null;
  readonly page: TabStatus;
}

/**
 * Which supported site the active tab is on, and what SafePrompt can see there.
 *
 * `tab.url` is only visible for origins in host_permissions, so this doesn't
 * need the `tabs` permission. On any other site it is undefined, which is fine
 * because SafePrompt doesn't run there anyway.
 */
async function activeTab(): Promise<ActiveTab> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.url === undefined || tab.id === undefined) return { site: null, page: 'watching' };

  const id = resolveAdapter(new URL(tab.url)).id;
  if (!(SITES as readonly string[]).includes(id)) return { site: null, page: 'watching' };

  return { site: id as SiteId, page: await pageStatus(tab.id) };
}

/**
 * No answer means no content script: the tab was open before SafePrompt was
 * installed or updated, and needs a reload before anything is checked.
 */
async function pageStatus(tabId: number): Promise<TabStatus> {
  try {
    const answer: unknown = await browser.tabs.sendMessage(tabId, { type: STATUS_REQUEST });
    return isPageStatus(answer) ? answer : 'unreachable';
  } catch {
    return 'unreachable';
  }
}

function mount(container: HTMLElement, tab: ActiveTab): void {
  createRoot(container).render(
    <Popup
      settingsArea={localArea}
      historyArea={localArea}
      site={tab.site}
      page={tab.page}
      onOpenSettings={() => {
        browser.runtime.openOptionsPage().catch(() => undefined);
      }}
    />,
  );
}

const container = document.getElementById('root');

if (container !== null) {
  activeTab().then(
    (tab) => {
      mount(container, tab);
    },
    () => {
      mount(container, { site: null, page: 'watching' });
    },
  );
}
