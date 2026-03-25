import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcDXXExTSjn-zdDHJIVEg57moEuB2P86k",
  authDomain: "resource-management-app-877c0.firebaseapp.com",
  projectId: "resource-management-app-877c0",
  storageBucket: "resource-management-app-877c0.firebasestorage.app",
  messagingSenderId: "335050583337",
  appId: "1:335050583337:web:5a35afc3a86a4cb1bfdb38"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
