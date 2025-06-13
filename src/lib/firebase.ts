
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your actual Firebase project configuration
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyClSwmAN98FBNcbynCB_VAAGzsQk23moAM", // Replace with your actual apiKey
  authDomain: "medisync-now.firebaseapp.com", // Replace with your actual authDomain
  projectId: "medisync-now", // Replace with your actual projectId
  storageBucket: "medisync-now.firebasestorage.app", // Replace with your actual storageBucket
  messagingSenderId: "1001251139142", // Replace with your actual messagingSenderId
  appId: "1:1001251139142:web:ed21c0f7f28b32e0212447" // Replace with your actual appId
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);

// It's good practice to also set up Firestore security rules.
// A basic set of rules in your Firebase console (Firestore -> Rules) might be:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access only to authenticated users
    // For more granular control, you'd specify rules per collection
    // IMPORTANT: For Firebase Auth to work with these rules, request.auth.uid must be valid.
    match /{document=**} {
      // allow read, write: if request.auth != null;
      // For development, you might temporarily use `if true;`
      allow read, write: if true; // Example: open rules for dev, secure for prod.
    }
  }
}
*/

export { db, app, auth };
