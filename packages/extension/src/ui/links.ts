import { version } from '../../package.json';
import { siteName } from './labels';

export const REPO = 'https://github.com/rspanu27/safeprompt';

/**
 * Shown for people to copy, not linked with `mailto:`. Whether a mail link
 * opens anything depends on the person's setup, and on a machine with no
 * default mail app it opens an empty window.
 */
export const CONTACT_EMAIL = 'raul.safeprompt@gmail.com';

/**
 * A new GitHub issue for a site whose message box can't be found, with the
 * title and the questions a fix needs answered already filled in.
 *
 * It carries the site's name and the extension version and nothing else. The
 * page address is left out on purpose, because on these sites it identifies a
 * conversation.
 */
export function reportUrl(site: string): string {
  const title = `Message box not found on ${siteName(site)}`;
  const body = [
    `SafePrompt version: ${version}`,
    `Site: ${siteName(site)}`,
    '',
    'Were you signed in?',
    '',
    '',
    'What kind of page was it? (a new chat, an existing chat, something else)',
    '',
    '',
    "Please don't paste anything private here, such as your conversation or the text you pasted. GitHub issues are public.",
  ].join('\n');

  return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
