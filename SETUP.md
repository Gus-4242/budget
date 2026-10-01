# Familiebudget – Opsætningsvejledning
## budget.gjnoergaard.dk

---

## Trin 1 – Firebase opsætning

1. Gå til https://console.firebase.google.com
2. Opret et nyt projekt, f.eks. **familiebudget-noergaard**
3. Gå til **Authentication** → **Sign-in method** → aktivér:
   - **Email/Password**
   - **Google**
4. Under Authentication → **Users** → opret to brugere manuelt:
   - gustaf@gjnoergaard.dk  (din adgangskode)
   - jette@gjnoergaard.dk   (Jettes adgangskode)
5. Gå til **Firestore Database** → Opret database → Vælg **production mode**
6. Under **Rules** – indsæt disse sikkerhedsregler:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email in [
             'gustaf@gjnoergaard.dk',
             'jette@gjnoergaard.dk'
           ];
    }
  }
}
```

7. Gå til **Projektindstillinger** (tandhjul) → **Dine apps** → tilføj en **Web app**
8. Kopiér firebaseConfig-objektet

---

## Trin 2 – Opdatér firebase-config.js

Åbn `firebase-config.js` og indsæt dine værdier:

```js
const firebaseConfig = {
  apiKey:            "din-nøgle-her",
  authDomain:        "familiebudget-noergaard.firebaseapp.com",
  projectId:         "familiebudget-noergaard",
  storageBucket:     "familiebudget-noergaard.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};

const ALLOWED_USERS = {
  "gustaf@gjnoergaard.dk": { name: "Gustaf", role: "admin" },
  "jette@gjnoergaard.dk":  { name: "Jette",  role: "viewer" }
};
```

Ret emailadresserne til jeres rigtige adresser.

---

## Trin 3 – Upload til Wannafind

Upload alle 4 filer til din webmappe på Wannafind:
- `index.html`
- `dashboard.html`
- `budget.html`
- `firebase-config.js`

Brug Wannafinds **File Manager** eller FTP (f.eks. FileZilla).

Mappen skal ligge under: `budget.gjnoergaard.dk/`  
(Opret et subdomæne i Wannafinds kontrolpanel → peg det på mappen)

---

## Trin 4 – Første login

1. Gå til https://budget.gjnoergaard.dk
2. Log ind med din email og adgangskode
3. Første gang hentes standarddata fra regnearket automatisk ind i Firestore
4. Herefter gemmes alle ændringer live i databasen

---

## Brugerroller

| Bruger  | Rolle         | Kan redigere | Kan se alt |
|---------|---------------|:---:|:---:|
| Gustaf  | Administrator |  ✅  |  ✅  |
| Jette   | Familiebruger |  ❌  |  ✅  |

---

## Filer

| Fil                | Formål |
|--------------------|--------|
| `index.html`       | Login-side (email + Google) |
| `dashboard.html`   | Oversigt, nøgletal, kommende betalinger |
| `budget.html`      | Fuldt budgetskema med alle kategorier |
| `cashflow.html`    | Dag-for-dag saldo, betalingsplan, disponibel buffer |
| `opsparing.html`   | Opsparingsmål med fremskrivning og betalingsplaner |
| `app-core.js`      | **Fælles modul** – sidebar, version, helpers (SKAL uploades) |
| `firebase-config.js` | Din Firebase-konfiguration |

---

## Næste versioner (klar til at bygge)

- [ ] Lånemodul med afdragsgraf
- [ ] Opsparingsmodul med fremdrags-bjælker  
- [ ] Formueoverblik (aktiver vs. passiver)
- [ ] Analysesider med grafer (månedlige/årlige)
- [ ] Dokumentarkiv (Firebase Storage)
- [ ] Mobilnotifikationer om kommende betalinger


---

## Nye datasamlinger (v20)

Firestore-reglerne fra Trin 5 dækker automatisk ALLE samlinger (`/{document=**}`),
så der kræves ingen ændringer. De nye samlinger oprettes automatisk første gang:

| Samling | Indhold |
|---------|---------|
| `payments_status` | Markér-som-betalt + faktiske beløb (afstemning) |
| `loans` | Lån: restgæld, ydelse, udløbsdato |

Første gang du åbner **Lån**-siden oprettes jeres 3 lån automatisk (Boliglån,
Forbrugslån, Billån). Ret dem via blyant-ikonet hvis tallene ændrer sig.
