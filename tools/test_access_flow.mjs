import assert from 'node:assert/strict';
import { resolveWorkspaceAccess } from '../.cache/access-flow-tests/access-flow.js';

function scenario(status, signedIn, intent) {
  const calls = [];
  const identity = { status, email: 'reader@example.com' };
  return { calls, actions: {
    intent, signedIn,
    login: async () => { calls.push('login'); return identity; },
    check: async () => { calls.push('check'); return identity; },
    request: async () => { calls.push('request'); return { ...identity, status: 'pending' }; },
  } };
}
for (const signedIn of [false, true]) {
  for (const intent of ['login', 'signup']) {
    for (const status of ['not_requested', 'pending', 'rejected', 'approved']) {
      const test = scenario(status, signedIn, intent);
      const shouldRequest = intent === 'signup' && status === 'not_requested';
      assert.equal((await resolveWorkspaceAccess(test.actions)).status, shouldRequest ? 'pending' : status);
      assert.deepEqual(test.calls, [signedIn ? 'check' : 'login', ...(shouldRequest ? ['request'] : [])]);
    }
  }
}
const failedLogin = scenario('not_requested', false, 'signup');
failedLogin.actions.login = async () => { throw Error('Popup cancelled'); };
await assert.rejects(resolveWorkspaceAccess(failedLogin.actions), /Popup cancelled/);
assert.deepEqual(failedLogin.calls, []);
const failedRequest = scenario('not_requested', true, 'signup');
failedRequest.actions.request = async () => { throw Error('Request failed'); };
await assert.rejects(resolveWorkspaceAccess(failedRequest.actions), /Request failed/);
const failedCheck = scenario('approved', true, 'login');
failedCheck.actions.check = async () => { throw Error('Connection failed'); };
await assert.rejects(resolveWorkspaceAccess(failedCheck.actions), /Connection failed/);
console.log('Access flow passed: login never creates requests; sign-up creates only a new request; existing states and failures handled.');
