import { eslint } from '@betterer/eslint';

export default {
  'no more type assertions': () =>
    eslint({
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],
    }).include('./public/**/*.ts'),
};
