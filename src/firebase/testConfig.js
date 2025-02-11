import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const testFirebaseConfig = {
  apiKey: "AIzaSyBLAlnwwRasaBO88OsM8GsJ0os-8bwAT08",
  authDomain: "ddropd-dd5d7.firebaseapp.com",
  projectId: "ddropd-dd5d7",
  storageBucket: "ddropd-dd5d7.appspot.com",
  messagingSenderId: "419919268111",
  appId: "1:419919268111:web:51bd26092cf399c52f967a",
  measurementId: "G-8WLP60CC7T"
};

const testApp = initializeApp(testFirebaseConfig, 'testApp');
export const testAuth = getAuth(testApp);
export const testDb = getFirestore(testApp);
