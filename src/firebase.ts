import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, getDoc, getDocs, setDoc, doc, deleteDoc, writeBatch, serverTimestamp, query, where, limit, orderBy, documentId, startAfter, onSnapshot, runTransaction, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { Entry } from './data';

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyD8byfxJUGn5YbjjHa_pzxNJDBbxztGkhA',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'onesunnah-e3a1e.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'onesunnah-e3a1e',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'onesunnah-e3a1e.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '404760832753',
  appId: env.VITE_FIREBASE_APP_ID || '1:404760832753:web:005f17bc3fe81008a71750',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-5XFW4DKX7R',
};

export const configured = true;
export const firestoreDatabaseId = '(default)';
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);

void isSupported().then(supported => {
  if (supported) getAnalytics(app);
}).catch(() => {});

export type AccessState = {
  status: 'signed_out' | 'not_requested' | 'pending' | 'rejected' | 'approved';
  uid?: string;
  email?: string;
  displayName?: string;
  role?: 'owner' | 'editor';
};

export async function loginWithGoogle(): Promise<AccessState> {
  await signInWithPopup(auth, new GoogleAuthProvider());
  return checkAccess();
}

export async function checkAccess(): Promise<AccessState> {
  const user = auth.currentUser;
  if (!user) return { status: 'signed_out' };
  const identity = { uid: user.uid, email: user.email ?? '', displayName: user.displayName ?? '' };
  const token = await user.getIdTokenResult(true);
  if (token.signInProvider !== 'google.com') throw Error('Please sign in with a Google account to request access.');
  const request = await getDoc(doc(db, 'accessRequests', user.uid));
  if (!request.exists()) return { ...identity, status: 'not_requested' };
  const data = request.data();
  const status = data.status === 'approved' ? 'approved' : data.status === 'rejected' ? 'rejected' : 'pending';
  return { ...identity, status, ...(status === 'approved' ? { role: data.role === 'owner' ? 'owner' : 'editor' } as const : {}) };
}

export type AccessRequest = {
  uid: string;
  email: string;
  displayName: string;
  status: 'pending' | 'approved' | 'rejected';
  role?: 'owner' | 'editor';
  requestedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy?: string;
};

export function watchAccessRequests(onChange: (rows: AccessRequest[]) => void, onError: (error: Error) => void) {
  return onSnapshot(collection(db, 'accessRequests'), snapshot => {
    const rows = snapshot.docs.map(record => {
      const data = record.data();
      return {
        uid: record.id, email: data.email || '', displayName: data.displayName || '',
        status: data.status, role: data.role,
        requestedAt: data.requestedAt?.toDate() ?? null,
        reviewedAt: data.reviewedAt?.toDate() ?? null,
        reviewedBy: data.reviewedBy,
      } as AccessRequest;
    });
    onChange(rows.sort((a, b) => (b.requestedAt?.getTime() ?? 0) - (a.requestedAt?.getTime() ?? 0)));
  }, onError);
}

export async function reviewAccessRequest(uid: string, decision: 'approved' | 'rejected') {
  const user = auth.currentUser;
  if (!user) throw Error('Please sign in again.');
  const reference = doc(db, 'accessRequests', uid);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists() || snapshot.data().status !== 'pending') throw Error('This request has already been reviewed.');
    transaction.update(reference, {
      status: decision, role: 'editor', reviewedAt: serverTimestamp(), reviewedBy: user.uid,
    });
  });
}

export async function requestAccess(): Promise<AccessState> {
  const user = auth.currentUser;
  if (!user) throw Error('Sign in with Google before requesting access.');
  const token = await user.getIdTokenResult(true);
  if (token.signInProvider !== 'google.com') throw Error('Google sign-in is required.');
  await setDoc(doc(db, 'accessRequests', user.uid), {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
  return checkAccess();
}

export async function fetchEntries() {
  const snap = await getDocs(collection(db, 'hadiths'));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Entry);
}

export async function fetchPublishedEntries(): Promise<Entry[]> {
  const entries:Entry[]=[];
  const base=query(collection(db,'hadiths'),where('status','==','Published'),where('reviewed','==',true),orderBy(documentId()));
  let cursor:QueryDocumentSnapshot|undefined;
  while(entries.length<1000){
    const pageSize=Math.min(250,1000-entries.length);
    const page=await getDocs(query(base,...(cursor?[startAfter(cursor)]:[]),limit(pageSize)));
    entries.push(...page.docs.map(d=>({...d.data(),id:d.id}) as Entry));
    if(page.size<pageSize)break;
    cursor=page.docs.at(-1);
  }
  return entries;
}

export async function writeEntry(entry: Entry) {
  await setDoc(doc(db, 'hadiths', entry.id), entry);
}

export async function removeEntry(id: string) {
  await deleteDoc(doc(db, 'hadiths', id));
}

export async function importEntries(entries: Entry[]) {
  for (let start = 0; start < entries.length; start += 400) {
    const batch = writeBatch(db);
    for (const entry of entries.slice(start, start + 400)) {
      batch.set(doc(db, 'hadiths', entry.id), entry);
    }
    await batch.commit();
  }
}
