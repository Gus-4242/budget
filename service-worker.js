/* ── Familiebudget Service Worker ──
   Styrer caching og auto-opdatering af PWA'en.

   SÅDAN OPDATERER DU APPEN FREMOVER:
   1. Ret dine filer og upload dem via FTP
   2. Hæv tallet i CACHE_VERSION herunder (fx v25 → v26)
      – og det tilsvarende tal i app-core.js (VERSION)
      – og ?v=NN på <script>/<link>-tags i HTML-filerne
   3. Upload også denne service-worker.js
   → Næste gang PWA'en åbnes, opdager den den nye version, henter alt
     friskt i baggrunden, og viser en "Opdatering klar"-besked.

   ─────────────────────────────────────────────────────────────
   NYT I v27 – HVORFOR MOBILEN VAR SÅ LANGSOM
   ─────────────────────────────────────────────────────────────
   Før var strategien for HTML-sider "network-first" UDEN tidsgrænse.
   På et mobilnetværk hvor forbindelsen hænger, betød det at siden
   ventede i det uendelige – selv om der lå en fuldt brugbar kopi i
   cachen. Nu venter vi højst 3 sekunder; derefter vises den gemte
   side med det samme, mens den friske hentes færdig i baggrunden.

   Desuden gemmes selve HTML-siderne nu ved installation, så appen
   virker fra første gang uden net – og offline-fallback peger på
   login-siden i stedet for (ved en fejl) rejseregnskabet.
*/

const CACHE_VERSION = "v28";
const CACHE_NAME    = "familiebudget-" + CACHE_VERSION;

// Hvor længe vi højst venter på netværket for en HTML-side,
// før vi viser den gemte udgave i stedet.
const HTML_TIMEOUT_MS = 3000;

// Filer der hentes ned ved installation.
const STATIC_ASSETS = [
  "./app-core.js",
  "./app-core.css",
  "./db.js",
  "./manifest.json",
  "./manifest-rejse.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./rejse-icon-192.png",
  "./rejse-icon-512.png",
  "./rejse-apple-touch-icon.png",
  // Siderne gemmes også, så appen kan starte uden netværk
  "./index.html",
  "./dashboard.html",
  "./budget.html",
  "./cashflow.html",
  "./laan.html",
  "./opsparing.html",
  "./rejse.html",
];

// ── INSTALL: forudindlæs filerne ──
// Hver fil hentes for sig, så én manglende fil ikke vælter hele installationen.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        STATIC_ASSETS.map(url =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => null)
        )
      )
    )
  );
  // Vent med at aktivere til siden beder om det (via "Opdatér"-knap),
  // så en igangværende session ikke afbrydes uventet.
});

// ── ACTIVATE: ryd gamle cache-versioner ──
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith("familiebudget-") && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── STRATEGI FOR HTML-SIDER ──
// Netværket først, men med tidsgrænse. Har vi en gemt kopi, vises den
// efter HTML_TIMEOUT_MS hvis nettet ikke er nået at svare.
async function htmlStrategy(req) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  const net = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  });
  // Undgå "unhandled rejection" hvis vi allerede har svaret fra cachen
  net.catch(() => {});

  if (!cached) {
    // Ingen gemt udgave – vi er nødt til at vente på nettet
    try {
      return await net;
    } catch (e) {
      return (await cache.match("./index.html")) ||
             new Response("Offline – ingen gemt udgave af siden.", {
               status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
             });
    }
  }

  // Vi HAR en gemt udgave: vent kun kort på nettet
  try {
    return await Promise.race([
      net,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), HTML_TIMEOUT_MS)),
    ]);
  } catch (e) {
    return cached; // langsomt eller nede – vis den gemte side nu
  }
}

// ── STRATEGI FOR STATISKE FILER ──
// Cache først (lynhurtigt), opdatér i baggrunden.
async function assetStrategy(req) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  const net = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  });
  net.catch(() => {});

  if (cached) return cached;
  try { return await net; }
  catch (e) {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

// ── FETCH ──
self.addEventListener("fetch", event => {
  const req = event.request;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Kun GET på samme domæne. Firebase/Google-kald går urørt igennem –
  // de må ALDRIG caches, da det er levende økonomidata.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  const isHTML = req.mode === "navigate" ||
                 (req.headers.get("accept") || "").includes("text/html");

  event.respondWith(isHTML ? htmlStrategy(req) : assetStrategy(req));
});

// ── Beskeder fra siden ──
self.addEventListener("message", event => {
  // Siden beder den nye worker om at overtage med det samme
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  // Siden spørger om den aktuelle version
  if (event.data === "GET_VERSION" && event.source) {
    event.source.postMessage({ type: "VERSION", version: CACHE_VERSION });
  }
});
