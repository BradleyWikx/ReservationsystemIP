// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = { // Added export
  apiKey: "AIzaSyDP9OoDHfsZg5blPmVDxD0L6EDO51T8LNA",
  authDomain: "gen-lang-client-0908058452.firebaseapp.com",
  projectId: "gen-lang-client-0908058452",
  storageBucket: "gen-lang-client-0908058452.appspot.com", // <-- correctie
  messagingSenderId: "557974196959",
  appId: "1:557974196959:web:1489a13228c4731b244f6a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app as firebaseApp, auth, db }; // Export the initialized app, auth and db