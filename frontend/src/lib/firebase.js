import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBAxCO1sLwTiCkghsZCQNj9fe5UjbOW59M",
  authDomain: "datathon-339c8.firebaseapp.com",
  projectId: "datathon-339c8",
  storageBucket: "datathon-339c8.firebasestorage.app",
  messagingSenderId: "1041681534214",
  appId: "1:1041681534214:web:f736a4b50e88b8a019e287",
  measurementId: "G-0LYRQQC19V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
