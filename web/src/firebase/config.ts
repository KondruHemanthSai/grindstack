import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBuuCC2Bt5k9b1lXATRVKTEzhWE6fEM6vY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "grindstack-3b4fe.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://grindstack-3b4fe-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "grindstack-3b4fe",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "grindstack-3b4fe.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "473992663485",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:473992663485:web:03b6a7ecf9df75269182d4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0Z43GXKKX6"
};

const isPlaceholder = !import.meta.env.VITE_FIREBASE_API_KEY || 
                      import.meta.env.VITE_FIREBASE_API_KEY === "your_firebase_api_key";

if (isPlaceholder) {
  console.warn("[Grindstack] Firebase API key missing or placeholder. Running in fallback mode.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Analytics init skipped:", err.message);
});
