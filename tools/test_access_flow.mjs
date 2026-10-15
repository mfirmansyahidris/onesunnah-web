import assert from 'node:assert/strict';
import { resolveWorkspaceAccess } from '../.cache/access-flow-tests/access-flow.js';

function scenario(status, signedIn = false) {
  const calls = [];
  const identity = { status, email: 'reader@example.com' };
  return { calls, actions: {
    signedIn,
    login: async () => { calls.push('login'); return identity; },
    check: async () => { calls.push('check'); return identity; },
    request: async () => { calls.push('request'); return { ...identity, status: 'pending' }; },
  } };
}

for (const signedIn of [false, true]) {
  const fresh = scenario('not_requested', signedIn);
  assert.equal((await resolveWorkspaceAccess(fresh.actions)).status, 'pending');
  assert.deepEqual(fresh.calls, [signedIn ? 'check' : 'login', 'request']);
  for (const status of ['pending', 'rejected', 'approved']) {
    const existing = scenario(status, signedIn);
    assert.equal((await resolveWorkspaceAccess(existing.actions)).status, status);
    assert.deepEqual(existing.calls, [signedIn ? 'check' : 'login']);
  }
}

const failedLogin = scenario('not_requested');
failedLogin.actions.login = async () => { throw Error('Popup cancelled'); };
await assert.rejects(resolveWorkspaceAccess(failedLogin.actions), /Popup cancelled/);
assert.deepEqual(failedLogin.calls, []);

const failedRequest = scenario('not_requested');
failedRequest.actions.request = async () => { throw Error('Request failed'); };
await assert.rejects(resolveWorkspaceAccess(failedRequest.actions), /Request failed/);

console.log('Access flow passed: new request, existing request, approval, rejection, cancelled login, and failed request.');
