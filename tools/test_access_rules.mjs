import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, documentId, getDoc, getDocs, collection, query, where, orderBy, limit, setDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction } from 'firebase/firestore';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const androidRules = new URL('../../one-sunnah-android/firebase/firestore.rules', import.meta.url);
if (existsSync(androidRules)) assert.equal(readFileSync(androidRules, 'utf8'), rules,
  'Web and Android deployments must enforce the same access rules');
const environment = await initializeTestEnvironment({
  projectId: 'demo-one-sunnah',
  firestore: { rules },
});
const signedIn = (uid, provider = 'google.com') => environment.authenticatedContext(uid, {
  email: `${uid}@example.com`, firebase: { sign_in_provider: provider },
}).firestore();
const application = uid => ({uid, email: `${uid}@example.com`, displayName: uid, status: 'pending', requestedAt: serverTimestamp()});
const decision = (status = 'approved', actor = 'owner') => ({status, role: 'editor', reviewedAt: serverTimestamp(), reviewedBy: actor});
const publishedQuery = db => query(collection(db, 'hadiths'), where('status', '==', 'Published'), where('reviewed', '==', true), limit(100));
const publicReaderOnly = async db => {
  await assertFails(getDoc(doc(db, 'hadiths', 'draft')));
  await assertFails(getDoc(doc(db, 'hadiths', 'published-unreviewed')));
  await assertFails(getDoc(doc(db, 'hadiths', 'reviewed-draft')));
  await assertSucceeds(getDoc(doc(db, 'hadiths', 'published')));
  await assertFails(getDocs(collection(db, 'hadiths')));
  await assertFails(getDocs(query(collection(db, 'hadiths'), where('status', '==', 'Published'))));
  await assertFails(getDocs(query(collection(db, 'hadiths'), where('reviewed', '==', true))));
  const released = await assertSucceeds(getDocs(publishedQuery(db)));
  assert.deepEqual(released.docs.map(record => record.id), ['published']);
  await assertFails(setDoc(doc(db, 'hadiths', 'blocked'), {status:'Draft',reviewed:false}));
  await assertFails(updateDoc(doc(db, 'hadiths', 'published'), {reviewed:false}));
  await assertFails(deleteDoc(doc(db, 'hadiths', 'published')));
};
try {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'hadiths', 'draft'), { status: 'Draft', reviewed: false });
    await setDoc(doc(db, 'hadiths', 'published'), { status: 'Published', reviewed: true });
    await setDoc(doc(db, 'hadiths', 'published-unreviewed'), { status: 'Published', reviewed: false });
    await setDoc(doc(db, 'hadiths', 'reviewed-draft'), { status: 'Draft', reviewed: true });
    await setDoc(doc(db, 'accessRequests', 'owner'), {...application('owner'), status: 'approved', role: 'owner'});
    await setDoc(doc(db, 'accessRequests', 'other-owner'), {...application('other-owner'), status: 'approved', role: 'owner'});
    await setDoc(doc(db, 'accessRequests', 'legacy-editor'), {...application('legacy-editor'), status: 'approved'});
    await setDoc(doc(db, 'accessRequests', 'password-user'), {...application('password-user'), status:'approved'});
  });
  const guest = environment.unauthenticatedContext().firestore();
  const alice = signedIn('alice'), bob = signedIn('bob'), owner = signedIn('owner');
  const passwordUser = signedIn('password-user', 'password');
  await publicReaderOnly(guest);
  // Match Android's paged query, including document ID ordering and page size.
  const mobileRead = await assertSucceeds(getDocs(query(collection(guest, 'hadiths'),
    where('status', '==', 'Published'), where('reviewed', '==', true), orderBy(documentId()), limit(250))));
  assert.deepEqual(mobileRead.docs.map(record => record.id), ['published']);
  await publicReaderOnly(alice); // Google sign-in alone cannot grant workspace access.
  await publicReaderOnly(passwordUser); // Only approved Google accounts may manage content.
  await assertFails(getDoc(doc(passwordUser, 'accessRequests', 'password-user')));
  await assertFails(getDoc(doc(guest, 'accessRequests', 'owner')));
  await assertSucceeds(getDoc(doc(alice, 'accessRequests', 'alice'))); // Missing own request can be checked.
  await assertFails(getDocs(query(collection(guest, 'hadiths'), where('status', '==', 'Published'))));
  await assertFails(setDoc(doc(passwordUser, 'accessRequests', 'password-user'), application('password-user')));
  await assertFails(setDoc(doc(bob, 'accessRequests', 'bob'), {...application('bob'), role:'owner'}));
  await assertFails(setDoc(doc(bob, 'accessRequests', 'bob'), {...application('bob'), status:'approved'}));
  await assertFails(setDoc(doc(bob, 'accessRequests', 'bob'), {...application('bob'), email:'spoof@example.com'}));
  await assertSucceeds(setDoc(doc(alice, 'accessRequests', 'alice'), application('alice')));
  await assertSucceeds(setDoc(doc(bob, 'accessRequests', 'bob'), application('bob')));
  await publicReaderOnly(alice); // Pending applicants retain only the public reading access.
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
  await assertSucceeds(getDocs(collection(alice, 'hadiths')));
  const published = await assertSucceeds(getDocs(publishedQuery(alice)));
  assert.deepEqual(published.docs.map(record => record.id), ['published']);
  await assertSucceeds(setDoc(doc(alice, 'hadiths', 'new-draft'), {status:'Draft',reviewed:false}));
  await assertSucceeds(updateDoc(doc(alice, 'hadiths', 'new-draft'), {title:'Edited'}));
  await assertSucceeds(deleteDoc(doc(alice, 'hadiths', 'new-draft')));
  await assertFails(getDoc(doc(alice, 'hadiths', 'published', 'private', 'nested')));
  await assertFails(setDoc(doc(alice, 'unconfigured', 'document'), {value:true}));
  await assertFails(getDocs(collection(alice, 'accessRequests')));
  await assertFails(updateDoc(doc(alice, 'accessRequests', 'bob'), decision('approved','alice')));
  await assertFails(updateDoc(doc(owner, 'accessRequests', 'alice'), decision('rejected')));
  await assertSucceeds(updateDoc(doc(owner, 'accessRequests', 'bob'), decision('rejected')));
  await publicReaderOnly(bob);
  await assertSucceeds(getDoc(doc(signedIn('legacy-editor'), 'hadiths', 'draft')));
  await assertFails(getDocs(collection(signedIn('legacy-editor'), 'accessRequests')));
  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'accessRequests', 'owner'), {status:'rejected'});
    await updateDoc(doc(context.firestore(), 'accessRequests', 'alice'), {status:'rejected'});
  });
  await assertFails(getDocs(collection(owner, 'accessRequests')));
  await publicReaderOnly(alice);
  await publicReaderOnly(owner);
  await assertSucceeds(getDoc(doc(guest, 'hadiths', 'published')));
  console.log('Access rules passed: login-free Android/public reading, draft and unreviewed isolation, approved Google management, isolated sign-up, owner approvals/declines, audit fields, role escalation prevention, revocation, default denial, and matching Android rules.');
} finally {
  await environment.cleanup();
}
