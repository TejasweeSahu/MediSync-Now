
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase project configuration
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual API key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your actual auth domain
  projectId: "YOUR_PROJECT_ID", // Replace with your actual project ID
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace with your actual storage bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual messaging sender ID
  appId: "YOUR_APP_ID", // Replace with your actual app ID
  // measurementId: "YOUR_MEASUREMENT_ID" // Optional: if you use Google Analytics
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
