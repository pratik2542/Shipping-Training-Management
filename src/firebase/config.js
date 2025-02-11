import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyBLAlnwwRasaBO88OsM8GsJ0os-8bwAT08",
  authDomain: "ddropd-dd5d7.firebaseapp.com",
  projectId: "ddropd-dd5d7",
  storageBucket: "ddropd-dd5d7.appspot.com",
  messagingSenderId: "419919268111",
  appId: "1:419919268111:web:51bd26092cf399c52f967a",
  measurementId: "G-8WLP60CC7T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services in order
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Enable Firestore logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Firestore debugging enabled');
}

export { auth, db, analytics };