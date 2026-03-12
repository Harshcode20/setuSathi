import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG, USE_BACKEND } from './config';

// Firebase is only initialized when USE_BACKEND is true
// and valid config is provided. Otherwise the app uses demo mode.
const app = USE_BACKEND && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY'
  ? initializeApp(FIREBASE_CONFIG)
  : initializeApp({ apiKey: 'demo', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' });

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
