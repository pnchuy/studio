
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Hardcoded configuration for the PRODUCTION project: list-read
const firebaseConfig = {
  apiKey: "AIzaSyCZsMhSDIcL2yV0GyY0uhPgCz4HypPmIbE",
  authDomain: "list-read.firebaseapp.com",
  projectId: "list-read",
  storageBucket: "list-read.firebasestorage.app",
  messagingSenderId: "508306002133",
  appId: "1:508306002133:web:69b85b5c1b3abb9cee125c",
  measurementId: "G-RGJY257P1Z"
};


// A flag to check if Firebase is configured
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Firebase initialization error", e);
  }
} else {
    if (typeof window !== 'undefined') {
        console.warn("Firebase is not configured. The app will run in offline mode. Please provide Firebase credentials in the .env file to enable online features.");
    }
}

export { app, db, auth, storage, firebaseConfig };
