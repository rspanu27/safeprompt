import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/.output/**', '**/.wxt/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Build and tooling scripts sit outside every package's tsconfig, so
  // type-aware rules have no program to run against.
  {
    files: ['**/*.config.{ts,js}', 'eslint.config.js', 'packages/*/scripts/**/*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },

  {
    rules: {
      // Match TypeScript's own `noUnusedParameters` convention, where a leading
      // underscore marks a parameter that exists to satisfy a signature.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@safeprompt/*'],
              message: 'core must not depend on other workspace packages.',
            },
          ],
        },
      ],
    },
  },

  {
    files: [
      'packages/extension/**/*.{ts,tsx}',
      'packages/demo/**/*.{ts,tsx}',
      'packages/eval/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@safeprompt/core/*'],
              message: 'Import from the @safeprompt/core public API, not its internals.',
            },
          ],
        },
      ],
    },
  },

  // Shipped code only: build scripts are expected to print.
  {
    files: ['packages/extension/src/**/*.{ts,tsx}'],
    rules: { 'no-console': 'error' },
  },

  prettier,
);
