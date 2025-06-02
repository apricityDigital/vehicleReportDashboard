// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
   apiKey: "AIzaSyAA8WeKYlk_pZB_T-A0g2kosP8ixqf0GYU",
  authDomain: "vehicles-f1f63.firebaseapp.com",
  projectId: "vehicles-f1f63",
  storageBucket: "vehicles-f1f63.firebasestorage.app",
  messagingSenderId: "887499842648",
  appId: "1:887499842648:web:fe7df601e4041f1544d62d",
  measurementId: "G-HLXCDWXRY3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
