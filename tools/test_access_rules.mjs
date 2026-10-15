import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const environment = await initializeTestEnvironment({
  projectId: 'demo-one-sunnah',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});

try {
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'hadiths', 'draft'), { status: 'Draft', reviewed: false });
    await setDoc(doc(context.firestore(), 'hadiths', 'published'), { status: 'Published', reviewed: true });
  });

  const guest = environment.unauthenticatedContext().firestore();
  const alice = environment.authenticatedContext('alice', {
    email: 'alice@example.com',
    firebase: { sign_in_provider: 'google.com' },
  }).firestore();
  const bob = environment.authenticatedContext('bob', {
    email: 'bob@example.com',
    admin: true,
    firebase: { sign_in_provider: 'google.com' },
  }).firestore();
  const passwordUser = environment.authenticatedContext('password-user', {
    email: 'password@example.com',
    firebase: { sign_in_provider: 'password' },
  }).firestore();

  await assertFails(getDoc(doc(guest, 'hadiths', 'draft')));
  await assertSucceeds(getDoc(doc(guest, 'hadiths', 'published')));
  await assertFails(getDoc(doc(alice, 'hadiths', 'draft')));
  await assertFails(getDoc(doc(bob, 'hadiths', 'draft')));
  await assertFails(setDoc(doc(passwordUser, 'accessRequests', 'password-user'), {
    uid: 'password-user', email: 'password@example.com', displayName: '', status: 'pending', requestedAt: serverTimestamp(),
  }));

  await assertSucceeds(setDoc(doc(alice, 'accessRequests', 'alice'), {
    uid: 'alice', email: 'alice@example.com', displayName: 'Alice', status: 'pending', requestedAt: serverTimestamp(),
  }));
  await assertSucceeds(getDoc(doc(alice, 'accessRequests', 'alice')));
  await assertFails(getDoc(doc(bob, 'accessRequests', 'alice')));
  await assertFails(updateDoc(doc(alice, 'accessRequests', 'alice'), { status: 'approved' }));
  await assertFails(getDoc(doc(alice, 'hadiths', 'draft')));

  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'accessRequests', 'alice'), { status: 'approved' });
  });
  await assertSucceeds(getDoc(doc(alice, 'hadiths', 'draft')));
  await assertSucceeds(setDoc(doc(alice, 'hadiths', 'new-draft'), { status: 'Draft', reviewed: false }));

  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'accessRequests', 'alice'), { status: 'rejected' });
  });
  await assertFails(getDoc(doc(alice, 'hadiths', 'draft')));
  await assertFails(setDoc(doc(alice, 'hadiths', 'blocked'), { status: 'Draft', reviewed: false }));
  assert.equal((await getDoc(doc(guest, 'hadiths', 'published'))).exists(), true);
  console.log('Access rules passed: pending, approval, rejection, and public reads.');
} finally {
  await environment.cleanup();
}
