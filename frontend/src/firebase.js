import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Replace with actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBM4xcfSxRX570IowZ7RVXdFThf4yiLy2o", // Placeholder from task-bridge example
  authDomain: "vizha-book-sync.firebaseapp.com",
  projectId: "vizha-book-sync",
  storageBucket: "vizha-book-sync.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
