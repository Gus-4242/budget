# 📋 Teknisk & Funktionel Review – Familiebudget Portal
**Reviewer-rolle:** Senior full-stack developer / UX-arkitekt / Product reviewer
**Dato:** Juni 2026 · Kodebase: v18 (5 sider, ~250 KB, 5.749 linjer)

---

## 1. Samlet vurdering

Portalen er funktionelt stærk: budgettet, cashflow-motoren (rullende saldo, betalingsdage,
disponibel buffer) og opsparingsmodulet løser reelle problemer korrekt. Arkitekturen
(statisk HTML + Firebase) er det RIGTIGE valg til Wannafind-hosting uden build-pipeline.

De største problemer er ikke funktionalitet, men **vedligeholdbarhed og datasikkerhed i UI'et**:

| Område | Karakter | Kommentar |
|---|---|---|
| Funktionalitet | ★★★★☆ | Cashflow-motoren er imponerende komplet |
| Kodekvalitet | ★★☆☆☆ | Massiv duplikering på tværs af sider |
| UX/UI | ★★★★☆ | Flot design, men alert()/prompt() trækker ned |
| Sikkerhed | ★★★☆☆ | Firestore-regler OK; XSS-huller i UI |
| Mobil (iPhone) | ★★★☆☆ | Budget-tabellen viser forkerte måneder på mobil |
| Skalerbarhed | ★★☆☆☆ | Hver ny side kræver copy/paste af ~250 linjer |

---

## 2. Fund – prioriteret

### 🔴 CRITICAL

**C1. Dashboard viser opdigtede tal ved fejl (renderDemo)**
`dashboard.html` falder tilbage til hardcodede demotal (fx "Efterskole – Eiko −6.500 kr",
"Nettoformue 3.640.000 kr") hvis Firestore-kaldet fejler ELLER hvis ingen opsparinger matcher
det forældede feltnavn `goal_amount`. En familieøkonomi-portal må ALDRIG vise fiktive tal
som om de var ægte. **Fix: demo-data fjernet; viser nu rigtige data fra `savings_goals` +
tydelig fejlbesked hvis data ikke kan hentes.**

**C2. XSS-sårbarhed via postnavne**
Postnavne fra Firestore injiceres direkte i `innerHTML` i budget, cashflow og opsparing.
Et navn som `<img src=x onerror=alert(1)>` ville eksekvere script. Risikoen er lav (kun
Gustaf/Jette kan skrive), men i en økonomiportal skal den være nul. **Fix: `esc()`-funktion
tilføjet og anvendt på alle navne-injektioner.**

**C3. Stille fejl ved gem (silent catches)**
6 steder i cashflow og 2 i opsparing fanges Firestore-fejl med kun `console.warn` – brugeren
tror data er gemt, men det er det ikke (fx ved netværksudfald på mobil). **Fix: toast-
notifikation vises nu ved alle gem-fejl.**

### 🟠 HIGH

**H1. ~250 linjer duplikeret pr. side (sidebar, auth, CSS, helpers)**
Sidebar-HTML, auth-guard, `fmtDKK`, logout og 32 CSS-regler er kopieret i alle 4 sider.
Det var den direkte årsag til nav-fejlene i v16-v17 (Cashflow optrådte 2 steder). **Fix:
ny fælles `app-core.js` injicerer sidebar fra ÉN kilde – nav-fejl kan ikke længere opstå.
Versionsnummer styres nu ét sted.**

**H2. Budget-tabel på iPhone viser Jan/Feb/Mar – ikke nuværende måned**
Mobil-CSS skjuler kolonne 7+ og viser altid årets 3 første måneder. I juni ser man altså
3-6 måneder gamle tal. **Fix: kolonner skjules ikke længere; tabellen scroller vandret
med alle 12 måneder tilgængelige.**

**H3. Søgemaskine-indeksering ikke blokeret**
Portalen indeholder navne, lønninger og lånedetaljer. **Fix: `<meta name="robots"
content="noindex, nofollow">` tilføjet på alle sider.**

### 🟡 MEDIUM

- **M1.** `prompt()`/`alert()`/`confirm()` bruges til dag-redigering og sletning – fungerer
  på iPhone men ser uprofessionelt ud. *Anbefaling: erstat med modaler i næste iteration.*
- **M2.** `PAYMENT_DAYS` matcher poster på NAVN (fuzzy) – omdøbes en post, mistes datoen.
  *Delvist fixet: datasættet er flyttet til app-core.js (én kilde); langsigtart bør dagen
  gemmes som felt på budgetposten i Firestore.*
- **M3.** Tilgængelighed: næsten ingen `aria`-attributter. *Påbegyndt: knapper har titles;
  fuld ARIA-gennemgang anbefales senere.*
- **M4.** `console.log` efterladt 9 steder. *Acceptabelt i privat værktøj; ryd op løbende.*

### 🟢 NICE-TO-HAVE

- Noter pr. budgetpost · Budgetafvigelser (budget vs. faktisk) · Lånemodul med
  renteoverblik · Forsikringsoversigt med fornyelsesdatoer · Eksport til CSV ·
  Notifikationer ved kommende store betalinger · Mørk tilstand.

---

## 3. Sikkerhedsvurdering

| Emne | Status | Vurdering |
|---|---|---|
| Firebase API-nøgle i klient | ✅ OK | Normalt for Firebase – nøglen er ikke hemmelig; sikkerheden ligger i reglerne |
| Firestore-regler (email-allowlist) | ✅ God | Kun jeres 2 emails kan læse/skrive |
| Auth-persistens | ✅ OK | Standard LOCAL er fint på private enheder |
| XSS i UI | 🔴→✅ | Fixet med esc() (C2) |
| Søgemaskiner | 🔴→✅ | Fixet med noindex (H3) |
| Backup | ⚠️ Mangler | **Anbefaling:** Firebase Console → Firestore → eksportér månedligt, eller aktivér automatisk eksport til Cloud Storage |
| App Check | ⚠️ Valgfri | Kan aktiveres i Firebase Console for at blokere misbrug af API-nøglen |
| HTTPS | ✅ | Wannafind leverer SSL på subdomænet |

---

## 4. Implementerede ændringer (v19)

1. **`app-core.js` (NY)** – fælles modul med: sidebar-injektion (én nav-kilde),
   versionsnummer, `esc()` HTML-escaping, `fmtDKK`, `toast()`-notifikationer,
   `PAYMENT_DAYS`-datasæt og dag-opløsning (30/31/last → sidste hverdag).
2. **Alle sider** – sidebar erstattet med mount-punkt (`data-active` angiver aktiv side);
   `noindex`-meta; app-core inkluderet.
3. **dashboard.html** – demo-data FJERNET; opsparingsmål hentes fra `savings_goals`;
   kommende betalinger beregnes ud fra PAYMENT_DAYS og rigtige budgetposter; tydelige
   tomme-tilstande og fejlbeskeder i stedet for fiktive tal.
4. **cashflow.html** – alle stille catches → toast-fejlbeskeder; PAYMENT_DAYS læses fra
   app-core (én kilde).
5. **budget.html** – XSS-escaping på postnavne; mobil viser nu alle måneder via vandret
   scroll i stedet for at vise Jan-Mar.
6. **opsparing.html** – XSS-escaping på målnavne; gem-fejl viser toast.

---

## 5. Testliste efter upload

Upload ALLE filer (inkl. nye `app-core.js`) og gennemgå:

**Generelt**
- [ ] Alle 5 sider loader uden fejl i browser-konsollen (F12)
- [ ] Sidebar er identisk på alle sider; aktivt link er markeret korrekt
- [ ] Versionsnummer "v19" vises i sidebar på alle sider
- [ ] Login virker for både Gustaf og Jette

**Dashboard**
- [ ] Nøgletal viser RIGTIGE tal fra budgettet (sammenlign med Budget 2026-siden)
- [ ] Opsparingsmål matcher Opsparing-siden (ikke "Sommerferie 18.000/24.000" demo)
- [ ] Kommende betalinger viser jeres faktiske poster med korrekte datoer
- [ ] Sluk internettet → genindlæs → tydelig fejlbesked, IKKE opdigtede tal

**Budget (på iPhone)**
- [ ] Tabellen kan scrolles vandret; juni-kolonnen kan nås
- [ ] Klik på et beløb → redigér → "Gemt ✓" vises
- [ ] Omdøb en post til `<b>test</b>` → navnet vises som tekst, IKKE fed skrift (XSS-test)

**Cashflow**
- [ ] Disponibel buffer uændret ift. v18 (samme tal)
- [ ] Flyt en postering med pilene → genindlæs → rækkefølgen er husket
- [ ] Slå wifi fra → ret en betalingsdag → rød toast-fejl vises

**Opsparing**
- [ ] Betalingstabel-ikonet åbner fuld plan; ekstra indbetaling vises i amber
- [ ] Redigér et mål → gem → ændringer vises med det samme

---

## 6. Anbefalet roadmap (næste iterationer)

1. **v20:** Erstat prompt/confirm med modaler · betalingsdag som felt på budgetposten
2. **v21:** Lånemodul (restgæld, rente, afdragsgraf) – data findes allerede i budgettet
3. **v22:** Budgetafvigelser: faktisk forbrug pr. måned vs. budget + alerts
4. **v23:** Forsikringsoversigt med fornyelsesdatoer og påmindelser
