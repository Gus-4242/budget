// ============================================================
//  FIREBASE KONFIGURATION – Bakkekrogen Budget
//  Projekt: bakkekrogenbudget
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyDJHYhIyM7_pUVjIykHPZUcQ8RYb4eam0k",
  authDomain:        "bakkekrogenbudget.firebaseapp.com",
  projectId:         "bakkekrogenbudget",
  storageBucket:     "bakkekrogenbudget.firebasestorage.app",
  messagingSenderId: "774853624655",
  appId:             "1:774853624655:web:9ad018bc608fd16b503b3a",
  measurementId:     "G-M97KMRMX94"
};

// Begge brugere er administratorer – kan se og redigere alt
const ALLOWED_USERS = {
  "gus42@gjnoergaard.dk": { name: "Gustaf", role: "admin" },
  "jette@gjnoergaard.dk":  { name: "Jette",  role: "admin" }
};

export { firebaseConfig, ALLOWED_USERS };
