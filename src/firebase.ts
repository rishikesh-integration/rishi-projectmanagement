// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcDXXExTSjn-zdDHJIVEg57moEuB2P86k",
  authDomain: "resource-management-app-877c0.firebaseapp.com",
  projectId: "resource-management-app-877c0",
  storageBucket: "resource-management-app-877c0.firebasestorage.app",
  messagingSenderId: "335050583337",
  appId: "1:335050583337:web:5a35afc3a86a4cb1bfdb38",
  measurementId: "G-WPQLCX41BN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);