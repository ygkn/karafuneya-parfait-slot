import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import ts from 'typescript-eslint'

export default defineConfig(
  { ignores: ['dist/', 'node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname, extraFileExtensions: ['.svelte'] },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  {
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/strict-boolean-expressions': ['error', { allowNullableObject: true, allowNullableBoolean: true }],
      'svelte/no-at-html-tags': 'error',
      'svelte/require-each-key': 'error',
      'svelte/no-unused-class-name': 'off',
      'svelte/button-has-type': 'error',
      'svelte/no-target-blank': 'error',
      'svelte/block-lang': ['error', { script: 'ts' }],
    },
  },
  // the data build script reports what it wrote
  { files: ['scripts/**/*.ts', 'e2e/axe-report.ts'], rules: { 'no-console': 'off' } },
  // JS config files are not part of a TS project
  { files: ['**/*.js'], ...ts.configs.disableTypeChecked },
)
