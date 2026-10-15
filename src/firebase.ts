import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeFirestore, collection, getDocs, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
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
export const firestoreDatabaseId = 'onesunnah';
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = initializeFirestore(app, {}, firestoreDatabaseId);

void isSupported().then(supported => {
  if (supported) getAnalytics(app);
}).catch(() => {});

export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
  const token = await auth.currentUser?.getIdTokenResult();
  if (token?.claims.admin !== true) {
    await signOut(auth);
    throw Error('This account does not have administrator access.');
  }
}

export async function fetchEntries() {
  const snap = await getDocs(collection(db, 'hadiths'));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Entry);
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
