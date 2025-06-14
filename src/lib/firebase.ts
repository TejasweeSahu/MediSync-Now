// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration is now loaded from environment variables
// Ensure you have a .env.local file (or .env for general development)
// with these variables set.
// Example .env.local:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Basic validation to ensure environment variables are loaded
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase configuration environment variables are not set. Please check your .env file.");
  // You might want to throw an error here or handle it more gracefully
  // depending on your application's needs.
}


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
