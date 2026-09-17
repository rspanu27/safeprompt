# SafePrompt

[![CI](https://github.com/rspanu27/safeprompt/actions/workflows/ci.yml/badge.svg)](https://github.com/rspanu27/safeprompt/actions/workflows/ci.yml)

Local-first Chrome extension that detects secrets and PII in text pasted into AI
assistants, explains what it found, and offers a redacted version before the
content is sent.

Nothing pasted ever leaves the browser. There is no backend.

**Status:** early development.

## Packages

| Package                 | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@safeprompt/core`      | Scanner engine. Zero dependencies, no DOM, no network.        |
| `@safeprompt/eval`      | Fixture corpus and precision/recall harness.                  |
| `@safeprompt/extension` | Chrome MV3 extension. Intercepts pastes, renders the warning. |

The scanner is deliberately independent of the browser. `core` has no runtime
dependencies and is compiled without the DOM type library, so a browser API call
inside it is a compile error rather than a code review comment. The extension
holds as little logic as possible — it calls `scanText(input)` and renders the
result.

## Detection quality

Detectors are measured against a labelled corpus of 49 samples — 23 carrying real
secrets, 26 hard negatives drawn from the places lookalikes actually appear:
README setup instructions, git logs, UUIDs, lockfile hashes, minified bundles and
base64 images.

|         | Precision | Recall |    F1 |
| ------- | --------: | -----: | ----: |
| Overall |    100.0% |  98.3% | 0.991 |

Content is also classified — source code, `.env`, stack trace, JSON, SQL, log or
prose — because severity depends on surroundings. An address in prose is a
contact detail; the same address in a production log is a real customer. Context
only ever raises a finding's severity, never lowers it, and records why.

Per-detector figures are in [docs/EVALUATION.md](docs/EVALUATION.md), regenerated
by `pnpm eval`. CI runs the same command against a committed baseline and fails
the build if precision, recall or classification accuracy regresses, so a
detector cannot be loosened without the numbers moving in the open.

## Extension

Manifest V3, built with WXT. Host permissions are enumerated for the four
supported origins rather than requesting `<all_urls>`, and the only permission is
`storage`, for settings — scanned content never reaches it.

The warning modal mounts inside a **closed** shadow root. Page scripts cannot
read through it to the redaction preview, and page CSS cannot reach in to
restyle the buttons, which would be a security problem rather than a cosmetic
one if `Paste original` could be made to look like `Cancel`.

```bash
pnpm --filter @safeprompt/extension dev
```

Then load `packages/extension/.output/chrome-mv3` as an unpacked extension at
`chrome://extensions`. Paste interception arrives with the site adapters; for
now `Ctrl+Shift+Y` on a supported site opens the modal against a fixed sample.

## Development

Requires Node (see `.nvmrc`) and pnpm via Corepack.

```bash
pnpm install
```

```bash
pnpm typecheck && pnpm lint && pnpm test
```

TypeScript is pinned to 6.x: `typescript-eslint` does not yet support the TS 7
compiler API, and dropping type-aware linting would disable the rules that
enforce the package boundaries described above.
