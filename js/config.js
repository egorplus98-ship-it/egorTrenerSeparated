import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDCsFzRcG3qpS7kL42QZwsLho8eh8EirNY",
    authDomain: "egortrener-5485d.firebaseapp.com",
    projectId: "egortrener-5485d",
    storageBucket: "egortrener-5485d.firebasestorage.app",
    messagingSenderId: "876864869628",
    appId: "1:876864869628:web:c49c65ac028490f5cdf379"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);