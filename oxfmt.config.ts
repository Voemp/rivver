import { defineConfig } from 'oxfmt'

export default defineConfig({
  ignorePatterns: ['**/*.gen.ts', 'apps/web/src/components/ui/**'],
  sortImports: {
    groups: [
      'type-import',
      ['value-builtin', 'value-external'],
      'type-internal',
      'value-internal',
      ['type-parent', 'type-sibling', 'type-index'],
      ['value-parent', 'value-sibling', 'value-index'],
      'unknown',
    ],
  },
  sortTailwindcss: {
    stylesheet: './apps/web/src/style.css',
    functions: ['cn'],
    preserveWhitespace: true,
  },
  semi: false,
  singleQuote: true,
})
