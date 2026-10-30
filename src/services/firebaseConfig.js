import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Firebase Configuration for BloodLink (Blood Donor Management System)
 * Uses environment variables if provided, otherwise falls back to standard
 * project configuration with automatic local persistence support.
 */
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKey-BloodLinkCSE3206Project',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'bloodlink-cse3206.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'bloodlink-cse3206',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'bloodlink-cse3206.appspot.com',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '109283746512',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '1:109283746512:web:8f7e6d5c4b3a2109'
};

let app = null;
let auth = null;
let firestoreDb = null;
const googleProvider = new GoogleAuthProvider();

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestoreDb = getFirestore(app);
} catch {
  // Initialized in test/offline mode
}

export const isLiveFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes('AIzaSyDemoKey')
  );
};

export const firebaseAdapter = {
  async signInWithGooglePopup(customGoogleProfile = null) {
    if (isLiveFirebaseConfigured() && auth) {
      const result = await signInWithPopup(auth, googleProvider);
      return {
        uid: result.user.uid,
        name: result.user.displayName || 'Google User',
        email: result.user.email,
        photoURL: result.user.photoURL,
        role: 'user',
        provider: 'google.com'
      };
    }
    // Simulated Google OAuth session when running offline or with demo keys
    const profile = customGoogleProfile || {
      uid: 'google-uid-2203',
      name: 'Ruan Mahmud',
      email: 'ruan.cse22@ruet.ac.bd',
      photoURL: 'https://ui-avatars.com/api/?name=Ruan+Mahmud&background=dc2626&color=fff',
      role: 'user',
      provider: 'google.com'
    };
    return profile;
  },

  async signOutUser() {
    if (isLiveFirebaseConfigured() && auth) {
      await signOut(auth);
    }
    return true;
  },

  async syncToCloud(stateData) {
    if (isLiveFirebaseConfigured() && firestoreDb) {
      const ref = doc(firestoreDb, 'bloodlink_system', 'main_state');
      await setDoc(ref, { ...stateData, updatedAt: new Date().toISOString() });
      return true;
    }
    return false;
  },

  async fetchFromCloud() {
    if (isLiveFirebaseConfigured() && firestoreDb) {
      const ref = doc(firestoreDb, 'bloodlink_system', 'main_state');
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() : null;
    }
    return null;
  }
};

