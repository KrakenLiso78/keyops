const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'src/components/**',
      'src/constants/**',
      'src/hooks/**',
      'src/global.css',
      'src/app/explore.tsx',
    ],
  },
]);
