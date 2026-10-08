import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  child,
  update,
  remove,
} from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const RTDB_URL = 'https://aman-portfolio-f7222-default-rtdb.firebaseio.com';
export const app = getApps().length === 0 ? initializeApp({ ...firebaseConfig, databaseURL: RTDB_URL }) : getApp();

// Realtime Database instance pointed explicitly to the live RTDB URL
export const rtdb = getDatabase(app, RTDB_URL);

// Authentication instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom parameters for clean popups
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Analytics (optional, initialized safely if supported)
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch(() => {
      // Ignored in sandbox environments without analytics support
    });
}

// Database helper exports
export { ref, set, get, onValue, child, update, remove };
