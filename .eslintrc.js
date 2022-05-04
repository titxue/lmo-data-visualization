module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: 'babel-eslint'
  },
  rules: {
    rules: {
      'semi': 2,
      'no-var': 2,
      'no-alert': 0,
      'no-const-assign': 2,
      'no-eval': 2,
      'no-duplicate-case': 2,
      'func-names': 0,
      'no-unused-vars': 0,
      'no-prototype-builtins': 0,
      'use-isnan': 2,
      'vars-on-top': 2,
      'valid-typeof': 2,
      'no-delete-var': 2,
      'prefer-const': 2,
      'no-extra-parens': 2,
      'no-extra-semi': 2,
      'prefer-spread': 2,
      'guard-for-in': 2,
      'no-constant-condition': 2,
      'no-else-return': 2,
      'no-dupe-keys': 2,
      'no-empty': 2,
      'linebreak-style': [0, 'windows'],
      'no-multi-spaces': 2,
      'arrow-spacing': 2,
      'no-mixed-spaces-and-tabs': [2, false],
      'no-new-func': 2,
      'no-new-object': 2,
      'no-new-require': 2,
      'no-new-wrappers': 2,
      'no-plusplus': 2,
      'no-undef': 2,
      'no-undef-init': 2,
      'no-unreachable': 2,
      'comma-dangle': [2, 'never'],
      'init-declarations': 2,
      'newline-after-var': 2,
      'no-unneeded-ternary':2,
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    }
  }
}
