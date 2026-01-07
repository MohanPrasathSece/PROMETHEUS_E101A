import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDCKssfS1qaPGEbIA42omYDdJdaK-AT6e8",
    authDomain: "studio-5912991474-84dbf.firebaseapp.com",
    projectId: "studio-5912991474-84dbf",
    storageBucket: "studio-5912991474-84dbf.firebasestorage.app",
    messagingSenderId: "669020045232",
    appId: "1:669020045232:web:b37d57ee19e6c049646075"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export default app;
