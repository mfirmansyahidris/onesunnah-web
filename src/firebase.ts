import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import type { Entry } from './data';
const env = (import.meta as unknown as {env:Record<string,string>}).env;
export const configured = !!(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);
const app = configured ? initializeApp({apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,appId:env.VITE_FIREBASE_APP_ID}):null;
export const auth = app ? getAuth(app):null;
const db = app ? getFirestore(app):null;
export async function login(email:string,password:string){if(!auth)throw Error('Firebase is not configured.');await signInWithEmailAndPassword(auth,email,password);const token=await auth.currentUser?.getIdTokenResult();if(token?.claims.admin!==true){await signOut(auth);throw Error('This account does not have administrator access.');}}
export async function fetchEntries(){if(!db)throw Error('Firebase is not configured.');const snap=await getDocs(collection(db,'hadiths'));return snap.docs.map(d=>({...d.data(),id:d.id}) as Entry);}
export async function writeEntry(e:Entry){if(!db)throw Error('Firebase is not configured.');await setDoc(doc(db,'hadiths',e.id),e);}
export async function removeEntry(id:string){if(!db)throw Error('Firebase is not configured.');await deleteDoc(doc(db,'hadiths',id));}
