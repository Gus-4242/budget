/* ============================================================
   APP-CORE – Fælles modul for Familiebudget-portalen
   Én kilde til: sidebar, version, formatering, escaping,
   toasts og betalingsdage.
   Inkluderes som klassisk script FØR sidens module-script:
   <script src="app-core.js" defer></script>
   ============================================================ */
(function () {
  "use strict";

  /* ── VERSION – ret KUN her ──
     HUSK: samme nummer skal sættes i service-worker.js (CACHE_VERSION)
     og i ?v=NN på <script>/<link>-tags i HTML-filerne. */
  const VERSION = "v27";

  /* ── BUDGETÅR – styres ét sted ──
     Sættes til indeværende år, men kan overskrives hvis man vil se et bestemt år.
     Dette fjerner hardcodet "2026" fra beregningslogikken. ── */
  const BUDGET_YEAR = new Date().getFullYear() >= 2026 ? new Date().getFullYear() : 2026;

  /* ── HTML-ESCAPING (XSS-beskyttelse) ── */
  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ── VALUTA-FORMATERING ── */
  function fmtDKK(n) {
    if (n === null || n === undefined || isNaN(n)) return "–";
    return new Intl.NumberFormat("da-DK", {
      style: "currency", currency: "DKK", maximumFractionDigits: 0
    }).format(n);
  }

  /* ── TOAST-NOTIFIKATIONER ── */
  let toastTimer;
  function toast(msg, type) {
    let el = document.getElementById("app-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "app-toast";
      el.style.cssText =
        "position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(8px);" +
        "padding:11px 20px;border-radius:10px;font-size:13.5px;font-family:'DM Sans',sans-serif;" +
        "color:#fff;z-index:9999;opacity:0;transition:opacity .2s,transform .2s;max-width:90vw;" +
        "box-shadow:0 6px 24px rgba(0,0,0,.18);pointer-events:none;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = type === "error" ? "#e84040"
                        : type === "success" ? "#1a9e6e" : "#0f1923";
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(-50%) translateY(0)";
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(8px)";
    }, 3200);
  }

  /* ── BETALINGSDAGE (én kilde – bruges af cashflow OG dashboard) ── */
  const PAYMENT_DAYS = {
    "Viaplay Student": 1,
    "EL - EWII": 1,
    "El – EWii": 1,
    "Landbrugslotteri": 2,
    "Jette FTF-A": 2,
    "ADHD foreningen": 2,
    "ADHD-foreningen": 2,
    "Grenaa Vandcenter Djurs": 2,
    "GSN - LEDERNE": 2,
    "GBL – LÆRENE": 2,
    "Aqua Djurs forbrugsafgifter, Vand": 2,
    "Kirkegårds Vedligehold": 2,
    "Danica Pension - Jette Sundhedsforsikring Terma": 2,
    "Danica Pension – Jette Sundhedsforsikring Tema": 2,
    "Grenaa varmeværk": 5,
    "Grenaa varmevæerk": 5,
    "Sygeforsikring Gustaf + Mads Gruppe 1": 5,
    "Sygeforsikring Jette + Linnea - Gruppe 2": 5,
    "Sygeforsikring Jette + Linnea – Gruppe 2": 5,
    "DANSK SOCIALRÅDGIVERFORENING": 5,
    "Indbofors. 2 biler, Gas Ulykke": 5,
    "Husforsikring Alm Brand": 5,
    "Ulykke Forsikring Jette": 5,
    "Rejseforsikring": 5,
    "Børneulykkesforsikring Linnea og Mads": 5,
    "2 x Letsikring af Lån og kredit": 5,
    "Tilbetaling af lån og kredit": 5,
    "Aqua Djurs - Rotte bekæmpelse": 5,
    "Ulykke Mads": 5,
    "Vægtafgift Skoda": 8,
    "Vægtafgift Obel Karl": 8,
    "Dag Renovation opkrævning": 18,
    "Gustaf – løn": "last",
    "Jette – løn": "last",
    "Lån 1 (tidl. driftsforbrugslån Sparbank)": "last",
    "Lån 2 (tidl. SUPER8 bllån)": "last",
    "Overførsel Afbetaling Jette Forsikring lån": "last",
    "VetCare": "last",
    "El-Cykel afbetaling (fl Linnea konf. konto)": "last",
    "Til Gavekonto": "last",
    "Til Linnea konfirmation": "last",
    "Linnea/Mobil": "last",
    "Til Sommerferie Opsparing": "last",
    "Til Hus & Have Opsparing": "last",
    "Jette Mobil+Dis+NetFlx+Telmore musik": "last",
    "Jette mobil - Disney+Netflix Premium+Max-": "last",
    "Til Linnea Efterskole 2030": "last",
    "Ovf til Sport og Fitness Konto": "last",
    "GVI, Sport og Fitness Konto (200 kr/mdr)": "last",
    "Linnea Håndbold": "last",
    "Grenaa Pingvinernes Sauna": "last",
    "Hundefoder – Eiko": "last",
    "Telmore 5G internet": "last",
    "Telmore SG Internet": "last",
    "Totalkredit Lån – Bakkekrogen 9": "last",
    "Totalkredit Lån – Bøskovkrogen 9": "last",
    "Fast overførsel til madkonto": "last",
    "Dyrekassen / Forsikring Eiko": "last",
  };

  function getLastWeekday(year, month) {
    const d = new Date(year, month + 1, 0);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.getDate();
  }

  function resolveDay(val, year, month) {
    if (val === "last" || val === 30 || val === 31) return getLastWeekday(year, month);
    const dim = new Date(year, month + 1, 0).getDate();
    if (val > dim) return getLastWeekday(year, month);
    return val;
  }

  /* Slår betalingsdagen op ud fra postens navn.

     BEMÆRK: Navne er ikke ID'er. Det rigtige sted at gemme en
     betalingsdag er på selve budgetposten i Firestore – det gør
     cashflow-siden allerede via userPaymentDays[entryId], og den
     har altid forrang. Tabellen her er kun et fornuftigt
     udgangspunkt for poster, der aldrig har fået sat en dag.

     Tidligere returnerede funktionen FØRSTE delvise træf, hvilket
     betød at fx en post ved navn "El" kunne ramme "El-Cykel
     afbetaling" og flytte betalingen flere uger. Nu vælges det
     MEST specifikke (længste) træf, og eksakt match vinder altid. */
  function lookupPaymentDay(name, year, month) {
    if (!name) return 15;
    const n = String(name).trim().toLowerCase();
    if (!n) return 15;

    let best = null, bestLen = -1;

    for (const [key, val] of Object.entries(PAYMENT_DAYS)) {
      const k = key.trim().toLowerCase();

      // 1. Eksakt match – kan ikke slås
      if (k === n) return resolveDay(val, year, month);

      // 2. Nøglen findes i postnavnet (fx "VetCare" i "VetCare abonnement")
      if (n.includes(k) && k.length > bestLen) { best = val; bestLen = k.length; }
    }
    if (best !== null) return resolveDay(best, year, month);

    // 3. Sidste udvej: postnavnet findes i nøglen. Kun for navne på
    //    mindst 5 tegn – ellers rammer korte navne alt for bredt.
    if (n.length >= 5) {
      for (const [key, val] of Object.entries(PAYMENT_DAYS)) {
        const k = key.trim().toLowerCase();
        if (k.includes(n) && n.length > bestLen) { best = val; bestLen = n.length; }
      }
      if (best !== null) return resolveDay(best, year, month);
    }

    return 15; // midt i måneden
  }

  /* ── AUDIT-LOG / HISTORIK ──
     Logger ændringer så man kan se hvem der ændrede hvad og hvornår.
     Kaldes med en allerede-initialiseret Firestore db-instans. ── */
  async function logAudit(db, fns, action, details) {
    try {
      const user = (window.AppCore && window.AppCore._currentUserName) || "ukendt";
      await fns.addDoc(fns.collection(db, "audit_log"), {
        ts: Date.now(),
        date: new Date().toISOString(),
        user,
        action,        // fx "Ændrede budgetpost", "Slettede lån"
        details: details || "",
      });
    } catch (e) {
      // Audit-fejl må aldrig blokere brugerens handling – log kun til konsol
      console.warn("Audit-log fejlede:", e);
    }
  }

  /* ── CSV-EKSPORT / BACKUP ──
     Konverterer et array af objekter til CSV og downloader filen. ── */
  function exportCSV(filename, rows) {
    if (!rows || !rows.length) { toast("Ingen data at eksportere", "error"); return; }
    const cols = Object.keys(rows[0]);
    const escCell = v => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",;\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [
      cols.join(";"),
      ...rows.map(r => cols.map(c => escCell(r[c])).join(";"))
    ].join("\r\n");
    // BOM for korrekt æøå i Excel
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const date = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `${filename}_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Eksport hentet ✓", "success");
  }

  /* ── SIDEBAR (én kilde – nav-fejl kan ikke længere opstå) ── */
  const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    budget:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3"/><rect x="9" y="3" width="6" height="6" rx="1"/></svg>',
    cashflow:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    loan:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
    savings:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
    wealth:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    travel:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
    docs:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    logout:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  };

  const NAV_ITEMS = [
    { id: "dashboard", href: "dashboard.html", icon: "dashboard", label: "Dashboard" },
    { id: "budget",    href: "budget.html",    icon: "budget",    label: "Budget 2026" },
    { section: "Økonomi" },
    { id: "cashflow",  href: "cashflow.html",  icon: "cashflow",  label: "Cashflow" },
    { id: "loan",      href: "laan.html",      icon: "loan",      label: "Lån" },
    { id: "opsparing", href: "opsparing.html", icon: "savings",   label: "Opsparing" },
    { id: "wealth",    href: "#",              icon: "wealth",    label: "Formue" },
    { id: "travel",    href: "rejse.html",     icon: "travel",    label: "Rejse" },
    { section: "Andet" },
    { id: "analytics", href: "#",              icon: "analytics", label: "Analyser" },
    { id: "docs",      href: "#",              icon: "docs",      label: "Dokumenter" },
  ];

  function buildSidebar(active) {
    let nav = "";
    for (const item of NAV_ITEMS) {
      if (item.section) {
        nav += `<div class="nav-section">${item.section}</div>`;
      } else {
        const cls = item.id === active ? "nav-item active" : "nav-item";
        nav += `<a class="${cls}" href="${item.href}">${ICONS[item.icon]}${item.label}</a>`;
      }
    }
    return `
      <div class="sidebar-logo">
        <div class="logo-icon">N</div>
        <div>
          <div class="logo-name">Familiebudget</div>
          <div class="logo-year">Nørgaard · 2026 · <span style="color:var(--green)">${VERSION}</span></div>
        </div>
      </div>
      <nav class="nav">${nav}</nav>
      <div class="sidebar-user">
        <div class="user-avatar" id="userAvatar">·</div>
        <div style="min-width:0;flex:1;">
          <div class="user-name" id="userName">…</div>
          <div class="user-role" id="userRole"></div>
        </div>
        <button class="btn-logout" id="themeToggle" title="Skift tema" aria-label="Skift mellem lyst og mørkt tema" onclick="cycleTheme()"></button>
        <button class="btn-logout" title="Log ud" aria-label="Log ud" onclick="logout()">${ICONS.logout}</button>
      </div>`;
  }

  function initSidebar() {
    const el = document.getElementById("sidebar");
    if (!el) return;
    const active = el.dataset.active || "";
    el.innerHTML = buildSidebar(active);
  }

  /* ── SIDEBAR TOGGLE (fallbacks – sider kan override) ── */
  function toggleSidebar() {
    const sb = document.getElementById("sidebar");
    const ov = document.getElementById("overlay");
    if (sb) sb.classList.toggle("open");
    if (ov) ov.classList.toggle("show");
  }
  function closeSidebar() {
    const sb = document.getElementById("sidebar");
    const ov = document.getElementById("overlay");
    if (sb) sb.classList.remove("open");
    if (ov) ov.classList.remove("show");
  }

  /* ── TEMA: auto / lyst / mørkt ──
     "auto" følger telefonens indstilling. Valget huskes lokalt. */
  const THEMES = ["auto", "light", "dark"];
  const THEME_LABEL = { auto: "Følger systemet", light: "Lyst tema", dark: "Mørkt tema" };
  const THEME_ICON = {
    auto:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" fill="currentColor"/><path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    dark:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>',
  };

  function getTheme() {
    try { return localStorage.getItem("fb_theme") || "auto"; } catch (e) { return "auto"; }
  }
  function applyTheme(theme) {
    const t = THEMES.includes(theme) ? theme : "auto";
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("fb_theme", t); } catch (e) { /* privat browsing */ }
    const btn = document.getElementById("themeToggle");
    if (btn) { btn.innerHTML = THEME_ICON[t]; btn.title = THEME_LABEL[t] + " – klik for at skifte"; }
    // Diagrammerne skal have nye farver når temaet skifter
    initCharts(true);
  }
  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(getTheme()) + 1) % THEMES.length];
    applyTheme(next);
    toast(THEME_LABEL[next], "success");
  }

  /* ── FÆLLES DIAGRAM-OPSÆTNING ──
     Før havde hver side sine egne skrifttyper, gitterfarver og
     tick-farver hardkodet. Nu sættes det ét sted – og det følger
     automatisk med over i mørkt tema. ── */
  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  // Fælles farvepalet til kategorier/serier – samme rækkefølge på alle sider
  const CHART_PALETTE = [
    "#1a9e6e", "#2563eb", "#d97706", "#e84040",
    "#7c3aed", "#0d9488", "#db2777", "#64748b",
  ];

  function initCharts(rerender) {
    if (typeof Chart === "undefined") return;
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.font.size   = 11;
    Chart.defaults.color       = cssVar("--chart-tick", "#64748b");
    Chart.defaults.borderColor = cssVar("--chart-grid", "rgba(0,0,0,0.05)");
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 18;
    Chart.defaults.plugins.legend.labels.boxHeight = 2;
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15,25,35,0.92)";
    Chart.defaults.plugins.tooltip.titleFont = { family: "'DM Sans', sans-serif", size: 12, weight: "500" };
    Chart.defaults.plugins.tooltip.bodyFont  = { family: "'DM Sans', sans-serif", size: 12 };
    Chart.defaults.plugins.tooltip.padding   = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = false;

    if (rerender) {
      // Tegn eksisterende diagrammer igen med de nye farver
      try { Object.values(Chart.instances || {}).forEach(c => c && c.update && c.update()); }
      catch (e) { /* ligegyldigt */ }
    }
  }

  /* ── VAGT VED LANGSOM FORBINDELSE ──
     Firestore kan på nogle mobilnetværk være uhyggeligt længe om at
     svare. Før stod der bare "Indlæser..." i det uendelige. Nu får
     brugeren besked efter 6 sekunder om at det tager længere end normalt.

     Brug:
       const done = AppCore.watchSlowLoad();
       ... hent data ...
       done();                       // fjerner banneret igen
  */
  function watchSlowLoad(opts) {
    const o = opts || {};
    const delay = o.delay || 6000;
    const msg = o.message ||
      "Langsom forbindelse – henter stadig data. Har du været her før, viser vi gemte tal imens.";
    let bar = null;

    const timer = setTimeout(() => {
      if (document.getElementById("slow-load-banner")) return;
      bar = document.createElement("div");
      bar.id = "slow-load-banner";
      bar.className = "slow-banner";
      bar.setAttribute("role", "status");
      bar.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' +
        "<span>" + esc(msg) + "</span>";
      const host = document.querySelector(".content") || document.body;
      host.insertBefore(bar, host.firstChild);
    }, delay);

    return function done() {
      clearTimeout(timer);
      const el = document.getElementById("slow-load-banner");
      if (el) el.remove();
      bar = null;
    };
  }

  /* ── EKSPORTÉR ── */
  window.AppCore = {
    VERSION, BUDGET_YEAR, esc, fmtDKK, toast,
    PAYMENT_DAYS, getLastWeekday, resolveDay, lookupPaymentDay, exportCSV, logAudit,
    CHART_PALETTE, initCharts, cssVar, watchSlowLoad,
    getTheme, applyTheme, cycleTheme,
    _currentUserName: null,
  };
  window.cycleTheme = cycleTheme;
  // Globale genveje (sider må gerne override med identisk adfærd)
  window.esc = window.esc || esc;
  window.toast = window.toast || toast;
  if (!window.toggleSidebar) window.toggleSidebar = toggleSidebar;
  if (!window.closeSidebar) window.closeSidebar = closeSidebar;

  /* ── INIT ── */
  // Temaet sættes med det samme (app-core.js er "defer", så <html>
  // findes allerede) – ellers ville siden blinke hvidt før mørkt tema.
  const savedTheme = getTheme();
  if (savedTheme !== "auto") document.documentElement.setAttribute("data-theme", savedTheme);

  function bootstrap() {
    initSidebar();
    applyTheme(getTheme());
    initCharts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

  // Skifter systemet tema mens vi står i "auto", skal diagrammerne følge med
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (getTheme() === "auto") initCharts(true);
    });
  } catch (e) { /* ældre browsere */ }
})();

/* ── SERVICE WORKER: auto-opdatering af PWA ──
   Registrerer service-worker.js og viser en "Opdatering klar"-besked,
   når en ny version er hentet i baggrunden. Brugeren trykker for at
   genindlæse med det nye. Fjerner behovet for at slette/geninstallere PWA'en. */
(function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  function showUpdateBanner(worker) {
    if (document.getElementById("sw-update-banner")) return;
    const bar = document.createElement("div");
    bar.id = "sw-update-banner";
    bar.style.cssText =
      "position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);" +
      "z-index:9999;background:#0d9488;color:#fff;padding:12px 18px;border-radius:14px;" +
      "box-shadow:0 8px 28px rgba(0,0,0,0.28);font-family:'DM Sans',sans-serif;font-size:14px;" +
      "display:flex;align-items:center;gap:14px;max-width:calc(100vw - 32px);animation:swSlideUp .3s ease;";
    bar.innerHTML =
      "<span>Ny version klar ✨</span>" +
      "<button id='sw-update-btn' style=\"background:#fff;color:#0d9488;border:none;border-radius:9px;" +
      "padding:7px 14px;font-weight:600;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;\">Opdatér</button>";
    document.body.appendChild(bar);

    if (!document.getElementById("sw-anim-style")) {
      const st = document.createElement("style");
      st.id = "sw-anim-style";
      st.textContent = "@keyframes swSlideUp{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}";
      document.head.appendChild(st);
    }

    document.getElementById("sw-update-btn").onclick = function() {
      if (worker) worker.postMessage("SKIP_WAITING");
      bar.innerHTML = "<span>Opdaterer…</span>";
    };
  }

  navigator.serviceWorker.register("service-worker.js").then(reg => {
    // Hvis en opdatering allerede venter ved load
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        // Ny worker er installeret OG der var allerede en aktiv (= det er en opdatering, ikke førstegang)
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateBanner(newWorker);
        }
      });
    });
  }).catch(() => { /* SW ikke tilgængelig – appen virker stadig, bare uden auto-opdatering */ });

  // Når den nye worker overtager, genindlæs siden så det nye indhold vises
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
})();

