import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
export default tseslint.config(
  {
    ignores: ['.agents/**', '.promethee/**', 'dist/**', 'out/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
      },
    },
  },
  { ...reactHooks.configs.flat.recommended, files: ['src/**/*.{ts,tsx}'] },
  { ...reactRefresh.configs.vite, files: ['src/**/*.{ts,tsx}'] },
  prettier,
);
