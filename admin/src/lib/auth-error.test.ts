import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorText, parseAuthError } from './auth-error.ts';

test('reads an error from the URL fragment (magic link, implicit flow)', () => {
  const e = parseAuthError(
    '',
    '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
  );
  assert.deepEqual(e, {
    code: 'otp_expired',
    description: 'Email link is invalid or has expired',
  });
});

test('reads an error from the query string (code flow, failed exchange)', () => {
  const e = parseAuthError(
    '?error=server_error&error_description=Unable+to+exchange+external+code%3A+a5f6',
    '',
  );
  assert.deepEqual(e, {
    code: 'server_error',
    description: 'Unable to exchange external code: a5f6',
  });
});

test('no error in the URL, including the panel hash routes, gives null', () => {
  assert.equal(parseAuthError('', ''), null);
  assert.equal(parseAuthError('', '#/content/pricing/P-01'), null);
  assert.equal(parseAuthError('?x=1', '#/'), null);
});

test('common codes get a plain sentence, anything else shows the provider text', () => {
  assert.match(
    authErrorText({ code: 'signup_disabled', description: 'Signups not allowed' }),
    /cerrados/,
  );
  assert.match(authErrorText({ code: 'otp_expired', description: 'x' }), /caducó/);
  assert.equal(
    authErrorText({ code: 'server_error', description: 'Unable to exchange external code' }),
    'Unable to exchange external code',
  );
});
