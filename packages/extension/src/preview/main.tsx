import { scanText } from '@safeprompt/core';
import { createRoot } from 'react-dom/client';
import { memoryArea } from '../storage/area';
import { WarningModal } from '../ui/modal/WarningModal';
import { UnwatchedNotice } from '../ui/notice/UnwatchedNotice';
import { Options } from '../ui/options/Options';
import { Popup, type TabStatus } from '../ui/popup/Popup';

/**
 * Development only, never bundled into the extension. Open with `?view=modal`,
 * `?view=notice`, `?view=popup` or `?view=options`. The popup also takes
 * `&page=no-composer` or `&page=unreachable`.
 */

const PASTE = [
  'DATABASE_URL=postgres://svc_orders:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders',
  'STRIPE_SECRET_KEY=sk_live_51H8xQ2KdLmNpQrStUvWx',
  'AWS_ACCESS_KEY_ID=AKIA2E0RZXQ7MLPKWV3B',
  'ONCALL=dana@acme.io',
].join('\n');

const now = Date.now();
const hour = 60 * 60 * 1000;

const area = memoryArea({
  history: [
    {
      at: now - hour,
      site: 'chatgpt',
      level: 'critical',
      score: 92,
      detectors: {},
      action: 'redacted',
    },
    {
      at: now - 5 * hour,
      site: 'claude',
      level: 'high',
      score: 64,
      detectors: {},
      action: 'redacted',
    },
    {
      at: now - 30 * hour,
      site: 'claude',
      level: 'medium',
      score: 31,
      detectors: {},
      action: 'cancelled',
    },
    {
      at: now - 60 * hour,
      site: 'gemini',
      level: 'low',
      score: 12,
      detectors: {},
      action: 'original',
    },
  ],
});

const params = new URLSearchParams(location.search);
const view = params.get('view') ?? 'modal';
const container = document.getElementById('root');

/** Injected UI lives in a shadow root on a real page, so render it the same way. */
function shadowOverFiller(target: HTMLElement, place: string): ShadowRoot {
  document.body.style.cssText = 'margin:0;font:16px system-ui;background:#fff';
  target.innerHTML = '<p style="padding:40px;max-width:640px">'.concat(
    'A page behind the extension. '.repeat(60),
    '</p>',
  );
  const host = document.createElement('div');
  host.style.cssText = place;
  document.body.appendChild(host);
  return host.attachShadow({ mode: 'open' });
}

async function mount(target: HTMLElement): Promise<void> {
  if (view === 'popup' || view === 'options') {
    await import('@fontsource-variable/atkinson-hyperlegible-next');
    await import('@fontsource-variable/atkinson-hyperlegible-mono');
    await import('../ui/pages.css');
    const page =
      view === 'popup' ? (
        <Popup
          settingsArea={area}
          historyArea={area}
          site={(params.get('site') as 'claude' | null) ?? 'claude'}
          page={(params.get('page') as TabStatus | null) ?? 'watching'}
          onOpenSettings={() => undefined}
        />
      ) : (
        <Options settingsArea={area} historyArea={area} />
      );
    createRoot(target).render(page);
    return;
  }

  if (view === 'notice') {
    const shadow = shadowOverFiller(target, 'position:fixed;right:16px;bottom:16px');
    createRoot(shadow).render(<UnwatchedNotice site="chatgpt" onDismiss={() => undefined} />);
    return;
  }

  const shadow = shadowOverFiller(target, 'position:fixed;inset:0');
  createRoot(shadow).render(
    <WarningModal
      result={scanText(params.get('text') ?? PASTE)}
      onPasteRedacted={() => undefined}
      onPasteOriginal={() => undefined}
      onCancel={() => undefined}
    />,
  );
}

if (container !== null) void mount(container);
