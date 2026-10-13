const SCOPES = require('./scripts/scopes.cjs');

const TYPES_REQUIRING_SCOPE = ['feat', 'fix', 'refactor', 'test'];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', SCOPES],
    'scope-required-for-type': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'scope-required-for-type': ({ type, scope }) => [
          !TYPES_REQUIRING_SCOPE.includes(type ?? '') || Boolean(scope),
          `type "${type}" must name the affected scope: ${SCOPES.join(', ')}`,
        ],
      },
    },
  ],
};
