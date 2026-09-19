# SafePrompt

[![CI](https://github.com/rspanu27/safeprompt/actions/workflows/ci.yml/badge.svg)](https://github.com/rspanu27/safeprompt/actions/workflows/ci.yml)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)

SafePrompt is a Chrome extension that checks what you paste into ChatGPT, Claude
or Gemini for API keys, passwords, private keys and personal data, before it gets
sent.

If a paste contains something sensitive, SafePrompt holds it and shows you what
it found and why, along with a redacted version of the text. For example, this
line:

```
DATABASE_URL=postgres://svc_orders:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders
```

is offered as:

```
DATABASE_URL=postgres://[DB_USER_1]:[DB_PASSWORD_1]@[DB_HOST_1]:5432/[DB_NAME_1]
```

You can paste the redacted version, paste the original, or cancel. All of the
scanning happens in your browser. There is no server, and nothing you paste is
stored or sent anywhere.

**[Try the scanner online](https://rspanu27.github.io/safeprompt/)** without
installing anything. The page runs the same scanning code as the extension.

## What it detects

| Detector                    | Examples                                                        |
| --------------------------- | --------------------------------------------------------------- |
| Private keys                | RSA, EC, OpenSSH and PGP key blocks, including truncated ones   |
| Database connection strings | Postgres, MySQL, MongoDB, Redis and AMQP, redacted part by part |
| API keys and tokens         | AWS, GitHub, Stripe, Slack and OpenAI                           |
| JSON Web Tokens             | Checked by decoding the header                                  |
| Assigned secrets            | `password = …`, `DB_PASSWORD=…`, `"client_secret": …`           |
| Private IP addresses        | 10/8, 172.16/12, 192.168/16, link-local and carrier-grade NAT   |
| Internal hostnames          | `.internal`, `.corp`, `.lan` and Kubernetes service addresses   |
| Email addresses             | Ignoring documentation domains and credentials inside URLs      |

SafePrompt also tries to work out what kind of text it is looking at (a log, a
stack trace, an env file, source code) and raises the severity of findings when
the context makes them more sensitive. An email address in a paragraph of text
is usually just a contact address, but in a production log it probably belongs
to a real customer.

## Accuracy and speed

Each detector is tested against a labelled set of 49 samples. 23 of them contain
secrets. The other 26 contain things that look like secrets but aren't, taken
from the places they usually turn up: README setup instructions, git logs, UUIDs,
lockfile hashes and minified JavaScript.

|         | Precision | Recall |    F1 |
| ------- | --------: | -----: | ----: |
| Overall |    100.0% |  98.3% | 0.991 |

The numbers for each detector, and the one sample it currently misses, are in
[docs/EVALUATION.md](docs/EVALUATION.md). CI recalculates them on every push and
fails if any of them go down.

A typical 10 KB paste takes about 2 ms to scan, and 1 MB takes about 140 ms. CI
also times some inputs designed to make regular expressions slow, and fails if a
scan goes over its time limit.

I wrote the test samples myself, so expect recall on real-world text to be
lower. The [threat model](docs/THREAT_MODEL.md) lists what SafePrompt does not
catch.

## Install

1. Download `safeprompt-0.1.0-chrome.zip` from the
   [latest release](https://github.com/rspanu27/safeprompt/releases/latest) and
   unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder.

To try it, paste something sensitive into ChatGPT, Claude or Gemini. Clicking
the toolbar icon opens a popup where you can pause it for the current site or
open the settings.

## How it works

```mermaid
flowchart LR
  P[paste] --> S[scan]
  S -->|nothing found| E[editor]
  S -->|something found| M[warning]
  M -->|redacted or original| E
```

The scanner is its own package. It has no dependencies and no access to browser
APIs; it is compiled without the DOM type definitions, so using one is a compile
error. The extension catches the paste, passes the text to the scanner, and
shows the result in a dialog that the page's own scripts cannot read.

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) goes into more detail: the scanning
steps, the detectors, how overlapping findings and risk scores are handled, how
the extension inserts text into the sites' editors, and why things are built the
way they are.

## Repository layout

```
packages/
  core/        the scanner (TypeScript, no dependencies)
  extension/   the Chrome extension (WXT, React)
  eval/        test samples, accuracy measurement and benchmark
  demo/        the online demo page
docs/          architecture, threat model, privacy, accuracy results
```

## Development

You need Node (version in `.nvmrc`) and pnpm, which you can get through Corepack.

```bash
pnpm install
```

```bash
pnpm typecheck && pnpm lint && pnpm test
```

```bash
pnpm eval
```

```bash
pnpm bench
```

`pnpm --filter @safeprompt/extension dev` opens Chrome with the extension loaded
and rebuilds it when you save. `pnpm --filter @safeprompt/demo dev` runs the
demo page locally.

TypeScript is pinned to 6.x. `typescript-eslint` doesn't support TypeScript 7
yet, and the lint rules that keep the packages separate need it.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): how it works and why
- [Threat model](docs/THREAT_MODEL.md): what it protects against and what it doesn't
- [Privacy](docs/PRIVACY.md): what it reads, what it stores and where
- [Evaluation](docs/EVALUATION.md): precision and recall for each detector

## Licence

[MIT](LICENSE)
