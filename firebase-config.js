// ============================================
// FIREBASE CONFIG
// Ganti dengan config dari Firebase Console
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDTZOPgF8HG0taczl9kkL2ml949ZPkiO84",
    authDomain: "gasweb-id.firebaseapp.com",
    databaseURL: "https://gasweb-id-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gasweb-id",
    storageBucket: "gasweb-id.firebasestorage.app",
    messagingSenderId: "153166892624",
    appId: "1:153166892624:web:656a4c227fd1e216d8cb55"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
