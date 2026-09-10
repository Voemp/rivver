import { defineConfig } from 'oxlint'

export default defineConfig({
  ignorePatterns: ['apps/web/src/components/ui/**'],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  plugins: ['eslint', 'oxc', 'typescript', 'unicorn', 'import', 'react', 'react-perf'],
  rules: {
    // ESLint
    'no-debugger': 'error',
    'no-duplicate-case': 'error',
    'no-fallthrough': 'error',
    'no-unreachable': 'error',
    'no-unreachable-loop': 'error',

    // TypeScript
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',

    // Unicorn
    'unicorn/no-array-sort': 'error',
    'unicorn/no-array-reverse': 'error',
    'unicorn/prefer-array-find': 'error',
    'unicorn/prefer-array-flat-map': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-number-properties': 'error',
    'unicorn/prefer-object-from-entries': 'error',
    'unicorn/prefer-string-starts-ends-with': 'error',
    'unicorn/prefer-optional-catch-binding': 'error',
    'unicorn/prefer-regexp-test': 'error',
    'unicorn/no-useless-undefined': 'error',
    'unicorn/no-typeof-undefined': 'error',

    // Import
    'import/no-duplicates': 'error',
    'import/no-named-default': 'error',
    'import/no-self-import': 'error',
    'import/no-cycle': 'warn',

    // React
    'react/jsx-no-constructed-context-values': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-danger': 'warn',
    'react/no-unstable-nested-components': 'warn',
  },
})
