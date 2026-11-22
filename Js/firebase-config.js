// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCINdfjsWL3EH1i3EB6zvFaRKtzuK40Mws",
  authDomain: "vxtrack-live.firebaseapp.com",
  databaseURL: "https://vxtrack-live-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vxtrack-live",
  storageBucket: "vxtrack-live.firebasestorage.app",
  messagingSenderId: "395406165889",
  appId: "1:395406165889:web:014b7d63c41771f7d50a80",
  measurementId: "G-C40CZGB7LL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
