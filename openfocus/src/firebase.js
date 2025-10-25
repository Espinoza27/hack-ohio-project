// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);