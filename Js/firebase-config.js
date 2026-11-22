import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "vxtrack-live.firebaseapp.com",
  databaseURL: "https://vxtrack-live-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vxtrack-live",
  storageBucket: "vxtrack-live.firebasestorage.app",
  messagingSenderId: "395406165889",
  appId: "1:395406165889:web:..."
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
