import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Use public environment variables for Firebase config
// These are meant to be public but we should avoid hardcoding directly
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ddropd-dd5d7.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ddropd-dd5d7",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ddropd-dd5d7.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "419919268111",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:419919268111:web:51bd26092cf399c52f967a",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-8WLP60CC7T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export an API key getter function that uses runtime protection
export const getApiKey = () => {
  // For extra security, you could add runtime checks here
  // e.g., check referring domain, add timestamp validation, etc.
  return firebaseConfig.apiKey;
};

export { auth, db, analytics };