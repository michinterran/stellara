import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function readEnv(...keys) {
  for (const key of keys) {
    const raw = import.meta.env[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (value) return value;
  }
  return '';
}

export const firebaseConfig = {
  apiKey: readEnv('VITE_FB_API_KEY', 'VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FB_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FB_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FB_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FB_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FB_APP_ID', 'VITE_FIREBASE_APP_ID'),
  measurementId: readEnv('VITE_FB_MEASUREMENT_ID', 'VITE_FIREBASE_MEASUREMENT_ID'),
};

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

export const missingFirebaseConfig = requiredConfigKeys.filter((key) => !firebaseConfig[key]);
export const isFirebaseConfigured = missingFirebaseConfig.length === 0;

if (!isFirebaseConfigured) {
  console.error('[firebase] Missing config:', missingFirebaseConfig.join(', '));
}

const app = isFirebaseConfigured
  ? (getApps().length === 0
      ? initializeApp(
          firebaseConfig.measurementId
            ? firebaseConfig
            : Object.fromEntries(Object.entries(firebaseConfig).filter(([, value]) => value))
        )
      : getApps()[0])
  : null;

export const auth = app ? getAuth(app) : null;
if (auth) {
  auth.languageCode = 'ko';
}

export const db = app ? getFirestore(app) : null;
export default app;
