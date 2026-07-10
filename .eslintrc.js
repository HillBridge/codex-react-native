module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['node_modules/', '.expo/', 'dist/'],
  rules: {
    'react/jsx-no-bind': 'off',
    'react/no-unstable-nested-components': 'warn',
  },
};
