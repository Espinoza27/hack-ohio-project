// src/firebase.js
import { initializeApp } from "firebase/app";
// Import the database services you need
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; // If you need authentication

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP4urGnBlApowsuSdiMNY7O2u_xxHS09s",
  authDomain: "openfocus-e0d24.firebaseapp.com",
  databaseURL: "https://openfocus-e0d24-default-rtdb.firebaseio.com",
  projectId: "openfocus-e0d24",
  storageBucket: "openfocus-e0d24.firebasestorage.app",
  messagingSenderId: "329110628284",
  appId: "1:329110628284:web:a84c94952873598637adb9",
  measurementId: "G-QBV579CSF8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export the services
export const db = getFirestore(app); // Firestore for session list
export const rtDB = getDatabase(app); // Realtime Database for chat
export const auth = getAuth(app); // <-- 2. INITIALIZE AUTH SERVICE