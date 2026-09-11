import { defineConfig } from 'oxlint'

export default defineConfig({
  ignorePatterns: ['apps/web/src/components/ui/**'],
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: 'warn',
  },
  plugins: [
    'eslint',
    'oxc',
    'typescript',
    'unicorn',
    'import',
    'node',
    'promise',
    'react',
    'react-perf',
  ],
  rules: {
    // ESLint
    'no-debugger': 'error',
    'no-duplicate-case': 'error',
    'no-fallthrough': 'error',
    'no-unreachable': 'error',
    'no-unreachable-loop': 'error',

    // TypeScript
    'typescript/consistent-type-imports': 'error',
    'typescript/no-deprecated': 'warn',
    'typescript/no-explicit-any': 'warn',
    'typescript/no-floating-promises': 'error',
    'typescript/no-non-null-assertion': 'warn',
    'typescript/no-unsafe-assignment': 'warn',
    'typescript/no-unnecessary-condition': 'warn',
    'typescript/no-unnecessary-type-assertion': 'warn',
    'typescript/prefer-optional-chain': 'error',

    // Unicorn
    'unicorn/no-array-reverse': 'error',
    'unicorn/no-array-sort': 'error',
    'unicorn/no-typeof-undefined': 'error',
    'unicorn/no-useless-undefined': 'error',
    'unicorn/prefer-array-find': 'error',
    'unicorn/prefer-array-flat-map': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-number-properties': 'error',
    'unicorn/prefer-object-from-entries': 'error',
    'unicorn/prefer-optional-catch-binding': 'error',
    'unicorn/prefer-regexp-test': 'error',
    'unicorn/prefer-string-starts-ends-with': 'error',

    // Import
    'import/no-cycle': 'warn',
    'import/no-duplicates': 'error',
    'import/no-named-default': 'error',
    'import/no-self-import': 'error',

    // React
    'react/jsx-no-constructed-context-values': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-danger': 'warn',
    'react/no-unstable-nested-components': 'warn',
  },
})
