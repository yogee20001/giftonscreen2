// Firebase Compat Setup (Loaded globally via CDN in HTML)

// TODO: Replace with actual Firebase Config provided by user later
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "PLACEHOLDER_AUTH_DOMAIN",
  projectId: "PLACEHOLDER_PROJECT_ID",
  storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: "PLACEHOLDER_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

// Initialize Firebase App
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global refs (Safe initialization)
const db = typeof firebase.firestore === 'function' ? firebase.firestore() : null;
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;

if (!db) console.warn("Firestore library not loaded");
if (!storage) console.warn("Storage library not loaded");
if (!auth) console.warn("Auth library not loaded");
