import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCdeCFpY2AUrV4OGZyGuHU9jr5PoEmy8QY",
  authDomain: "bloume-spaces-e32e3.firebaseapp.com",
  projectId: "bloume-spaces-e32e3",
  storageBucket: "bloume-spaces-e32e3.firebasestorage.app",
  messagingSenderId: "765727643985",
  appId: "1:765727643985:web:50e3f2048b98bb74375b70",
  measurementId: "G-9ECVS357MR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
