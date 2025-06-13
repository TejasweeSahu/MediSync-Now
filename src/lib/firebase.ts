
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase project configuration
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyClSwmAN98FBNcbynCB_VAAGzsQk23moAM",
  authDomain: "medisync-now.firebaseapp.com",
  projectId: "medisync-now",
  storageBucket: "medisync-now.firebasestorage.app",
  messagingSenderId: "1001251139142",
  appId: "1:1001251139142:web:ed21c0f7f28b32e0212447"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

// It's good practice to also set up Firestore security rules.
// A basic set of rules in your Firebase console (Firestore -> Rules) might be:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access only to authenticated users
    // For more granular control, you'd specify rules per collection
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    // Example for patients collection (more specific)
    // match /patients/{patientId} {
    //   allow read, write: if request.auth != null; // Or more specific doctor ID checks
    // }
    // match /appointments/{appointmentId} {
    //  allow read, write: if request.auth != null;
    // }
  }
}
*/

export { db, app };
