import { useState } from 'react';
import { CONTACT_EMAIL, reportUrl } from './links';

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * "Report it on GitHub, or email …", where clicking the address copies it.
 *
 * The GitHub link opens in a new tab and isn't told which page the click came
 * from. If the clipboard is unavailable, the address turns into plain text
 * that can be selected by hand.
 */
export function ReportLinks({ site }: { readonly site: string }) {
  const [state, setState] = useState<CopyState>('idle');

  const copy = (): void => {
    const failed = (): void => {
      setState('failed');
    };

    try {
      navigator.clipboard.writeText(CONTACT_EMAIL).then(() => {
        setState('copied');
      }, failed);
    } catch {
      failed();
    }
  };

  return (
    <>
      Report it{' '}
      <a href={reportUrl(site)} target="_blank" rel="noreferrer noopener">
        on GitHub
      </a>
      , or email{' '}
      {state === 'failed' ? (
        <span className="address">{CONTACT_EMAIL}</span>
      ) : (
        <button type="button" className="link" title="Copy the address" onClick={copy}>
          {CONTACT_EMAIL}
        </button>
      )}
      .{' '}
      <span className="copied" role="status">
        {state === 'copied' && 'Address copied.'}
        {state === 'failed' && 'Select the address to copy it.'}
      </span>
    </>
  );
}
