import type { ContentContext } from '@safeprompt/core';

/**
 * What each sample actually is, judged by hand.
 *
 * Kept as one table rather than a field on each sample so it can be read in one
 * go and audited for honesty — the temptation when labelling your own corpus is
 * to write down whatever the classifier already says.
 *
 * `pnpm eval` fails if any sample is missing from this map.
 */
export const EXPECTED_CONTEXTS: Readonly<Record<string, ContentContext>> = {
  'pos-env-file': 'env-file',
  'pos-aws-credentials-file': 'env-file',
  'pos-rsa-private-key': 'plain-text',
  'pos-openssh-private-key': 'plain-text',
  'pos-truncated-private-key': 'plain-text',
  'pos-jwt-authorization-header': 'plain-text',
  'pos-jwt-in-json': 'json',
  'pos-github-token': 'plain-text',
  'pos-slack-token': 'env-file',
  'pos-openai-key': 'source-code',
  'pos-mongodb-srv': 'plain-text',
  'pos-mysql-with-private-host': 'plain-text',
  'pos-python-config': 'source-code',
  'pos-yaml-secrets': 'plain-text',
  'pos-production-log': 'log',
  'pos-kubernetes-service': 'plain-text',
  'pos-stack-trace-with-credentials': 'stack-trace',
  'pos-multiple-emails': 'plain-text',
  'pos-private-ip-ranges': 'plain-text',
  'pos-dotenv-mixed-case': 'env-file',
  'pos-terraform-variable': 'source-code',
  'pos-connection-string-in-prose': 'plain-text',
  'pos-stripe-test-key': 'env-file',

  'neg-readme-configuration': 'plain-text',
  'neg-env-references': 'source-code',
  'neg-template-placeholders': 'plain-text',
  'neg-git-log': 'plain-text',
  'neg-uuids': 'plain-text',
  'neg-semver-and-versions': 'plain-text',
  'neg-public-ips': 'plain-text',
  'neg-invalid-ips': 'plain-text',
  'neg-public-domains': 'plain-text',
  'neg-base64-image': 'plain-text',
  'neg-minified-js': 'source-code',
  'neg-lorem-ipsum': 'plain-text',
  'neg-sql-schema': 'sql',
  'neg-stack-trace-clean': 'stack-trace',
  'neg-prose-about-secrets': 'plain-text',
  'neg-public-key': 'plain-text',
  'neg-certificate': 'plain-text',
  'neg-stripe-publishable-key': 'source-code',
  'neg-localhost-connection-strings': 'plain-text',
  'neg-http-urls': 'plain-text',
  'neg-repeated-character-dummies': 'env-file',
  'neg-short-identifiers': 'env-file',
  'neg-hex-colors-and-ids': 'plain-text',
  'neg-jwt-lookalike': 'plain-text',
  'neg-package-lock-integrity': 'plain-text',
  'neg-documentation-example-values': 'plain-text',
};
