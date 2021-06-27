// ESLint doesn't support ESM yet :(
module.exports = {
  extends: ['@open-wc/eslint-config', 'eslint-config-prettier'].map(require.resolve),
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '/marked/**/*.{html,js,mjs,ts}',
          '**/*.config.{html,js,mjs,ts}',
          '/test/**/*',
        ],
      },
    ],
  },
};
