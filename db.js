/* ============================================================
   DB.JS – Én fælles, korrekt konfigureret Firebase-forbindelse
   ============================================================

   HVORFOR DENNE FIL FINDES
   ------------------------
   Tidligere kaldte hver side selv getFirestore(app). Det bruger
   Firestores "WebChannel"-protokol, som mange mobilnetværk (og
   særligt 5G med carrier-proxy) blokerer. Når det sker, opdager
   Firebase det først efter FLERE MINUTTER, hvorefter den falder
   tilbage til almindelig long-polling. Resultatet var en side der
   stod og skrev "Indlæser..." i 4 minutter.

   Rettelsen er to indstillinger:

   1. experimentalAutoDetectLongPolling
      Firebase tester forbindelsen med det samme og skifter til
      long-polling efter få sekunder i stedet for minutter.

   2. persistentLocalCache
      Data gemmes lokalt i browseren. Andet besøg loader
      ØJEBLIKKELIGT fra cachen, mens friske data hentes i
      baggrunden. Appen virker også helt uden netværk.

   Alle sider importerer app/auth/db herfra – der må ikke stå
   initializeApp eller getFirestore i de enkelte HTML-filer mere.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, ALLOWED_USERS } from "./firebase-config.js";

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* Firestore med mobilvenlige indstillinger.
   Falder tilbage til en simplere opsætning hvis browseren ikke
   tillader persistent cache (fx privat browsing på iOS). */
let _db;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalAutoDetectLongPolling: true,
  });
} catch (e) {
  console.warn("Persistent cache utilgængelig – kører uden lokal cache:", e);
  try {
    _db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch (e2) {
    _db = getFirestore(app);
  }
}
export const db = _db;

export { ALLOWED_USERS, onAuthStateChanged, signOut };

/* ── FÆLLES AUTH-GUARD ──
   Erstatter den kopierede onAuthStateChanged-blok på hver side.
   Sender ikke-godkendte brugere til login og udfylder
   brugerfeltet i sidebaren.

   Kaldes sådan:
     requireAuth(user => { isAdmin = user.isAdmin; loadData(); });
*/
export function requireAuth(onReady) {
  onAuthStateChanged(auth, user => {
    if (!user || !ALLOWED_USERS[user.email]) {
      window.location.href = "index.html";
      return;
    }
    const u = ALLOWED_USERS[user.email];

    const nameEl   = document.getElementById("userName");
    const roleEl   = document.getElementById("userRole");
    const avatarEl = document.getElementById("userAvatar");
    if (nameEl)   nameEl.textContent   = u.name;
    if (roleEl)   roleEl.textContent   = u.role === "admin" ? "Administrator" : "Familiebruger";
    if (avatarEl) avatarEl.textContent = u.name[0];

    if (window.AppCore) window.AppCore._currentUserName = u.name;

    onReady({ ...u, email: user.email, isAdmin: u.role === "admin" });
  });
}

/* ── FÆLLES LOGUD ── */
export function logout() {
  return signOut(auth).then(() => { window.location.href = "index.html"; });
}
window.logout = logout;
