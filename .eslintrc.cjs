module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['react'],
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['dist', 'node_modules', 'src/App.test.js', 'src/setupTests.js'],
  rules: { 'react/prop-types': 'off', 'react/react-in-jsx-scope': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] }
};
