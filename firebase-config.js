// Firebase Compat Setup (Loaded globally via CDN in HTML)

// TODO: Replace with actual Firebase Config provided by user later
const firebaseConfig = {
  apiKey: "AIzaSyDDnD8UUvRJnjwU9-Ee2-5uh0ybG7pkutE",
  authDomain: "giftonscreen.firebaseapp.com",
  projectId: "giftonscreen",
  storageBucket: "giftonscreen.firebasestorage.app",
  messagingSenderId: "984262120605",
  appId: "1:984262120605:web:df7aa8c601c2f7f10bf074",
  measurementId: "G-6QKJGDW5Z6"
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
