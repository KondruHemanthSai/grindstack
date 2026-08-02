import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key-to-prevent-crash",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "grindstack-3b4fe.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://grindstack-3b4fe-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "grindstack-3b4fe",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "grindstack-3b4fe.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const isPlaceholder = !import.meta.env.VITE_FIREBASE_API_KEY || 
                      import.meta.env.VITE_FIREBASE_API_KEY === "your_firebase_api_key";

if (isPlaceholder) {
  console.warn("[Grindstack] Firebase API key missing or placeholder. Running in fallback mode.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Analytics init skipped:", err.message);
});
