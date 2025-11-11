// src/Firebase/firebase.js  (keep this path the same as before)

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Tiny debug log so we can see if envs are actually loaded
console.log("firebaseConfig at init:", firebaseConfig);

const firebaseInstance = initializeApp(firebaseConfig);

const auth = getAuth(firebaseInstance);

const firebaseDB = getFirestore(firebaseInstance);

export { firebaseInstance, auth, firebaseDB };
