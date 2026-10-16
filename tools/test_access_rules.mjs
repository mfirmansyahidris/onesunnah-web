import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, query, where, limit, setDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction } from 'firebase/firestore';

const environment = await initializeTestEnvironment({
  projectId: 'demo-one-sunnah',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});
const signedIn = (uid, provider = 'google.com') => environment.authenticatedContext(uid, {
  email: `${uid}@example.com`, firebase: { sign_in_provider: provider },
}).firestore();
const application = uid => ({uid, email: `${uid}@example.com`, displayName: uid, status: 'pending', requestedAt: serverTimestamp()});
const decision = (status = 'approved', actor = 'owner') => ({status, role: 'editor', reviewedAt: serverTimestamp(), reviewedBy: actor});
try {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'hadiths', 'draft'), { status: 'Draft', reviewed: false });
    await setDoc(doc(db, 'hadiths', 'published'), { status: 'Published', reviewed: true });
    await setDoc(doc(db, 'accessRequests', 'owner'), {...application('owner'), status: 'approved', role: 'owner'});
    await setDoc(doc(db, 'accessRequests', 'other-owner'), {...application('other-owner'), status: 'approved', role: 'owner'});
    await setDoc(doc(db, 'accessRequests', 'legacy-editor'), {...application('legacy-editor'), status: 'approved'});
  });
  const guest = environment.unauthenticatedContext().firestore();
  const alice = signedIn('alice'), bob = signedIn('bob'), owner = signedIn('owner');
  const passwordUser = signedIn('password-user', 'password');
  await assertFails(getDoc(doc(guest, 'hadiths', 'draft')));
  await assertSucceeds(getDoc(doc(guest, 'hadiths', 'published')));
  await assertFails(getDocs(collection(guest, 'hadiths')));
  await assertFails(getDocs(query(collection(guest, 'hadiths'), where('status', '==', 'Published'))));
  const published = await assertSucceeds(getDocs(query(collection(guest, 'hadiths'), where('status', '==', 'Published'), where('reviewed', '==', true), limit(100))));
  assert.deepEqual(published.docs.map(record => record.id), ['published']);
  await assertFails(getDoc(doc(alice, 'hadiths', 'draft')));
  await assertFails(setDoc(doc(passwordUser, 'accessRequests', 'password-user'), application('password-user')));
  await assertFails(setDoc(doc(bob, 'accessRequests', 'bob'), {...application('bob'), role:'owner'}));
  await assertFails(setDoc(doc(bob, 'accessRequests', 'bob'), {...application('bob'), status:'approved'}));
  await assertFails(setDoc(doc(bob, 'accessRequests', 'bob'), {...application('bob'), email:'spoof@example.com'}));
  await assertSucceeds(setDoc(doc(alice, 'accessRequests', 'alice'), application('alice')));
  await assertSucceeds(setDoc(doc(bob, 'accessRequests', 'bob'), application('bob')));
  await assertSucceeds(getDoc(doc(alice, 'accessRequests', 'alice')));
  await assertFails(getDoc(doc(bob, 'accessRequests', 'alice')));
  await assertFails(getDocs(collection(alice, 'accessRequests')));
  await assertFails(getDocs(collection(guest, 'accessRequests')));
  await assertFails(updateDoc(doc(alice, 'accessRequests', 'alice'), decision()));
  await assertFails(updateDoc(doc(alice, 'accessRequests', 'alice'), {role:'owner'}));
  await assertSucceeds(getDocs(collection(owner, 'accessRequests')));
  await assertSucceeds(getDoc(doc(owner, 'accessRequests', 'alice')));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), {...decision(), email:'changed@example.com'}));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), {...decision(), requestedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), {...decision(), role:'owner'}));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), {...decision(), reviewedBy:'alice'}));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), {...decision(), reviewedAt:new Date(0)}));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), {status:'approved',role:'editor'}));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), decision('unknown')));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'owner'), decision()));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'other-owner'), decision()));
  await assertFails(deleteDoc(doc(owner, 'accessRequests', 'bob')));
  // Use the same transaction shape as the production approval API.
  await assertSucceeds(runTransaction(owner, async transaction => {
    const ref = doc(owner, 'accessRequests', 'alice');
    const current = await transaction.get(ref);
    assert.equal(current.data().status, 'pending');
    transaction.update(ref, decision());
  }));
  const approved = (await getDoc(doc(alice, 'accessRequests', 'alice'))).data();
  assert.equal(approved.role, 'editor');
  assert.equal(approved.reviewedBy, 'owner');
  assert.ok(approved.reviewedAt.toMillis() > 0);
  await assertSucceeds(getDoc(doc(alice, 'hadiths', 'draft')));
  await assertSucceeds(setDoc(doc(alice, 'hadiths', 'new-draft'), {status:'Draft',reviewed:false}));
  await assertFails(getDocs(collection(alice, 'accessRequests')));
  await assertFails(updateDoc(doc(alice, 'accessRequests', 'bob'), decision('approved','alice')));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), decision('rejected')));
  await assertSucceeds(updateDoc(doc(owner, 'accessRequests', 'bob'), decision('rejected')));
  await assertFails(getDoc(doc(bob, 'hadiths', 'draft')));
  await assertFails(setDoc(doc(bob, 'hadiths', 'blocked'), {status:'Draft',reviewed:false}));
  await assertSucceeds(getDoc(doc(signedIn('legacy-editor'), 'hadiths', 'draft')));
  await assertFails(getDocs(collection(signedIn('legacy-editor'), 'accessRequests')));
  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'accessRequests', 'owner'), {status:'rejected'});
    await updateDoc(doc(context.firestore(), 'accessRequests', 'alice'), {status:'rejected'});
  });
  await assertFails(getDocs(collection(owner, 'accessRequests')));
  await assertFails(getDoc(doc(alice, 'hadiths', 'draft')));
  assert.equal((await getDoc(doc(guest, 'hadiths', 'published'))).exists(), true);
  console.log('Access rules passed: public reads, Google sign-up, owner approvals/declines, audit fields, editor isolation, role escalation prevention, revocation, and legacy access.');
} finally {
  await environment.cleanup();
}
