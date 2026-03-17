import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // 중복 리포트 방지(권장)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // unused imports 설정:
      'unused-imports/no-unused-imports': 'error',

      // unused vars 설정:
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.

  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  eslintConfigPrettier,
]);

export default eslintConfig;
