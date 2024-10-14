// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA48xm1MjqdslMQNJ8KC7t8cyQxb7_JVM4",
    authDomain: "onlineshop-48c01.firebaseapp.com",
    projectId: "onlineshop-48c01",
    storageBucket: "onlineshop-48c01.appspot.com",
    messagingSenderId: "556297026777",
    appId: "1:556297026777:web:d77af098bbdf00420192c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
