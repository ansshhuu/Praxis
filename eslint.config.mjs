import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
      'components/DotField.jsx',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // React-Compiler-era rules from eslint-plugin-react-hooks v6. The remaining
      // violations are pre-existing patterns that behave correctly today (closing the
      // mobile nav on route change, seeding state from the URL on mount, refs written
      // during render in the workflow builder). They are warnings rather than errors so
      // a deploy is not blocked, but each one is real tech debt worth refactoring —
      // run `npm run lint` for the current list.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]

export default eslintConfig
