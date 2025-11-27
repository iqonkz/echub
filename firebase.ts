
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkztvkDQ_b0UGJfoXqQTcg_05M6gfeqNg",
  authDomain: "studio-8708314501-fc089.firebaseapp.com",
  projectId: "studio-8708314501-fc089",
  storageBucket: "studio-8708314501-fc089.firebasestorage.app",
  messagingSenderId: "589987685442",
  appId: "1:589987685442:web:6a2923144549b666aeb9db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
