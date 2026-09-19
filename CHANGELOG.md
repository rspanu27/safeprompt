# Changelog

## 0.1.0 (2026-09-19)

First release.

### Scanner

- Detects private keys, database connection strings, AWS, GitHub, Stripe, Slack
  and OpenAI keys, JSON Web Tokens, assigned secrets, private IP addresses,
  internal hostnames and email addresses.
- Checks the structure of a match where the format allows it: JWT headers are
  decoded, connection strings are parsed, PEM blocks must have a matching end
  line, and IP octets are range-checked.
- Ignores documentation placeholders, template syntax, environment variable
  references and example keys from vendor documentation.
- Resolves overlapping findings, classifies the type of content to raise
  severity in logs and stack traces, and gives a risk score with a breakdown.
- Redacts text while keeping its structure, uses the same placeholder for
  repeated values, and can put the original values back.

### Extension

- Holds pastes into the ChatGPT, Claude and Gemini message boxes when it finds
  something at or above the chosen risk level.
- Shows a warning dialog, inside a closed shadow root, with options to paste the
  redacted text, paste the original or cancel.
- Settings for the risk threshold, which categories to detect, each site, and an
  allowlist.
- Keeps a local history of held pastes that records what was found but never
  the text.

### Testing

- Accuracy measurement: 100% precision and 98.3% recall on 49 test samples,
  checked in CI against a stored baseline.
- A performance benchmark in CI, including inputs designed to make regular
  expressions slow.
- A demo page that runs the scanner in the browser.
