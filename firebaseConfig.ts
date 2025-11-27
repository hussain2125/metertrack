import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration for project: aimodaltesting
const firebaseConfig = {
  apiKey: "AIzaSyBqNSYyQpjKXDjT0fsxMsNX6a8rXQrdROM",
  authDomain: "aimodaltesting.firebaseapp.com",
  projectId: "aimodaltesting",
  storageBucket: "aimodaltesting.firebasestorage.app",
  messagingSenderId: "607653042062",
  appId: "1:607653042062:web:24c92476ce69c94483f6df"
};

// Flag to indicate configuration is present
export const isConfigured = true;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);