import { scanText } from '@safeprompt/core';
import { createRoot } from 'react-dom/client';
import { memoryArea } from '../storage/area';
import { WarningModal } from '../ui/modal/WarningModal';
import { Options } from '../ui/options/Options';
import { Popup } from '../ui/popup/Popup';

/**
 * Development only, never bundled into the extension. Open with `?view=modal`,
 * `?view=popup` or `?view=options`.
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

const view = new URLSearchParams(location.search).get('view') ?? 'modal';
const container = document.getElementById('root');

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
          site={(new URLSearchParams(location.search).get('site') as 'claude' | null) ?? 'claude'}
          onOpenSettings={() => undefined}
        />
      ) : (
        <Options settingsArea={area} historyArea={area} />
      );
    createRoot(target).render(page);
    return;
  }

  // The modal lives in a shadow root on a real page, so render it the same way
  // over some filler content.
  document.body.style.cssText = 'margin:0;font:16px system-ui;background:#fff';
  target.innerHTML = '<p style="padding:40px;max-width:640px">'.concat(
    'A page behind the modal. '.repeat(60),
    '</p>',
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const text = new URLSearchParams(location.search).get('text') ?? PASTE;
  createRoot(shadow).render(
    <WarningModal
      result={scanText(text)}
      onPasteRedacted={() => undefined}
      onPasteOriginal={() => undefined}
      onCancel={() => undefined}
    />,
  );
}

if (container !== null) void mount(container);
