
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

/**
 * নির্দেশ: Firebase Console (console.firebase.google.com) থেকে আপনার প্রজেক্টের 
 * কনফিগ এখানে বসান। নিচে আমি ডামি কনফিগ দিচ্ছি।
 */
const firebaseConfig = {
  apiKey: "AIzaSyDbz5TyqDyXE9Im96NFXbj9w8Z7kFdthdA",
  authDomain: "zenix-5fe12.firebaseapp.com",
  projectId: "zenix-5fe12",
  storageBucket: "zenix-5fe12.firebasestorage.app",
  messagingSenderId: "378434155620",
  appId: "1:378434155620:web:c69e9ca6f23c8882b45b71"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection
};
