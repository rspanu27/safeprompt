import { siteName } from '../labels';
import { Mark } from '../Mark';
import { ReportLinks } from '../ReportLinks';
import { NOTICE_CSS } from './styles';

export interface UnwatchedNoticeProps {
  /** Adapter id of the site the paste happened on. */
  readonly site: string;
  readonly onDismiss: () => void;
}

/**
 * Shown when a paste went through unchecked because the page has no message
 * box SafePrompt recognises. It never takes focus: the user is in the middle
 * of typing somewhere else.
 */
export function UnwatchedNotice({ site, onDismiss }: UnwatchedNoticeProps) {
  return (
    <>
      <style>{NOTICE_CSS}</style>

      <div className="notice" role="status">
        <p className="title">
          <Mark />
          SafePrompt did not check that paste
        </p>
        <p className="why">
          It only checks the message box, and it can&apos;t find one on this page. If you pasted
          into the chat, {siteName(site)} has probably changed and SafePrompt needs an update.
        </p>
        <p className="report">
          <ReportLinks site={site} />
        </p>
        <div className="actions">
          <button type="button" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
}
