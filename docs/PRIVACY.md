# Privacy

SafePrompt doesn't send anything anywhere. The extension makes no network
requests of any kind: no analytics, no telemetry and no error reporting. All
scanning happens in your browser.

## What it reads

When you paste into the message box on ChatGPT, Claude or Gemini, SafePrompt
reads the pasted text from the paste event and scans it in memory. If the
warning appears, the original and redacted text stay in memory until you choose
an option, and are then discarded. SafePrompt doesn't run on any other site, so
pastes elsewhere are never read.

## What it stores

| What                   | Where                  | Contents                                                                             |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| Settings               | `chrome.storage.local` | Your switches, the threshold, per-site settings and allowlist patterns               |
| History of held pastes | `chrome.storage.local` | Time, site, risk level, how many of each kind of finding, and which option you chose |

Pasted text is never stored. The history might record, for example, that a
database connection string was found on Claude and you chose the redacted
version. It doesn't store the connection string or the page address. It keeps
the most recent 200 entries, and you can clear it or turn it off on the
settings page.

Everything is stored in Chrome's local storage, on this device only. It isn't
synced to your other devices, including when you use Chrome sync, because
allowlist entries can be sensitive. This means you need to set up SafePrompt
separately on each computer.

## Permissions

| Permission                                                         | Why it's needed                            |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `storage`                                                          | To save your settings and history          |
| `chatgpt.com`, `chat.openai.com`, `claude.ai`, `gemini.google.com` | To see pastes on these sites and no others |

SafePrompt doesn't ask for `<all_urls>`, `tabs`, `clipboardRead` or `scripting`.

## The demo page

The online demo is a static web page. The text you type into it is scanned by
code running in the page and isn't sent anywhere. The page is hosted on GitHub
Pages, which keeps the usual server logs of page requests (see GitHub's privacy
statement for details). The page has no analytics of its own.

## Checking this yourself

The full source code is at
[github.com/rspanu27/safeprompt](https://github.com/rspanu27/safeprompt).
