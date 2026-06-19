import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = () =>
  !!(cfg.apiKey && cfg.projectId && cfg.appId);

const app = isFirebaseConfigured()
  ? (getApps().length ? getApps()[0] : initializeApp(cfg))
  : null;

export const db = app ? getFirestore(app) : null;

// Enable offline persistence (works even without internet)
if (db) {
  enableIndexedDbPersistence(db).catch(() => {/* multi-tab or private mode */});
}
