# ChargeKaro — Pitch Deck & Walkthrough Screenshots

High-quality, pitch-deck-style walkthrough of ChargeKaro, a peer-to-peer EV charging
marketplace. The deck explains **both sides of the market**:

- **Demand side — drivers** looking for a reliable place to charge.
- **Supply side — hosts** renting out an existing home wallbox for income.

All phone imagery is captured from the **real running app** (`../index.html`), not mockups.

---

## What's in this folder

| File | Purpose |
| --- | --- |
| `deck.html` | The 7-slide landscape pitch deck (1600×900 per slide). |
| `01-cover.png` … `07-close.png` | Landscape exports at **3200×1800** (2×). |
| `contact-sheet.html` / `contact-sheet.png` | One-page overview of the landscape deck. |
| `deck-vertical.html` | The 9-slide **vertical deck** (1080×1920 per slide, 9:16). Play-Store-style: screens dominate, minimal text. Open this to present portrait/Play-Store assets. |
| `v-01-cover.png` … `v-09-close.png` | Vertical exports at **2160×3840** (2×), ready for Play Store listings. |
| `contact-sheet-vertical.html` / `contact-sheet-vertical.png` | One-page overview of all 9 vertical slides. |
| `assets/*.png` | Real app screenshots at **1536×2580** (3×), used inside both decks. |

### Landscape deck slides

1. **Cover** — “Every driveway becomes a charging station.”
2. **One network, two winners** — the two-sided opportunity, drivers vs. hosts.
3. **Driver walkthrough** — plan route → compare/reserve → charge with live metering.
4. **Host walkthrough** — see the upside → configure the charger → accept demand.
5. **How a charge happens** — the end-to-end 5-step flow with both outcomes.
6. **Unit economics** — tariff split, break-even, host earnings, driver savings.
7. **Closing** — “The grid is already in the driveway.”

### Vertical deck slides

The vertical deck tells the same two-sided story with less text — each slide has
a step eyebrow (e.g. “Drivers · Step 1 of 3”), a short title, a one-line caption,
a large phone screenshot, and three feature chips that carry the detail.

1. **Cover** — “Every driveway becomes a charging station.” (driver + host phones)
2. **Drivers · 1/3 — Plan your route** — live map, compatible chargers ranked along the drive.
3. **Drivers · 2/3 — Compare and reserve** — power, plug, tariff, amenities up front; instant estimate.
4. **Drivers · 3/3 — Charge with confidence** — OTP handoff, live fare metering, call/chat host.
5. **Hosts · 1/3 — Your wallbox earns** — earnings dashboard, ROI simulator, 8.5-month break-even.
6. **Hosts · 2/3 — Stay in control** — power, tariff, availability hours, driveway notes.
7. **Hosts · 3/3 — Accept demand** — live request with driver ETA and payout.
8. **How a charge happens** — 5-step end-to-end flow + driver/host outcome cards.
9. **Closing** — “The grid is already in the driveway.”

Driver slides use yellow accents; host slides use orange.

### App screenshots in `assets/`

| Screenshot | Shows |
| --- | --- |
| `onboarding-role.png` | First-run role choice (driver vs. host). |
| `onboarding-driver.png` | Driver EV profile + connector setup. |
| `onboarding-host.png` | Host listing setup (charger, rate, hours). |
| `driver-map.png` | Route planner, compatible stops, live map. |
| `driver-detail.png` | Station detail, specs, amenities, sticky booking CTA. |
| `driver-charging.png` | Active session: OTP, live energy/fare metering. |
| `host-dashboard.png` | Earnings, energy sold, ROI simulator, break-even. |
| `host-setup.png` | “Configure charger” modal (power, tariff, hours, notes). |
| `host-request.png` | Incoming booking request with accept/decline. |

---

## View the deck

Open either deck directly in a browser:

```bash
open pitch/deck.html            # landscape, 7 slides
open pitch/deck-vertical.html   # vertical, 9 slides (Play Store style)
# or serve the folder if your browser blocks local assets
python3 -m http.server 8000     # then visit http://localhost:8000/pitch/deck.html
```

The deck loads Google Fonts and Lucide icons from CDNs, so it needs an internet
connection for the exact typography/icons. The screenshots themselves are local.

---

## How the map works

The app map is **Leaflet 1.9.4** (loaded from `unpkg.com`) with **Esri ArcGIS
World Dark Gray** raster tiles. No API key is required.

Two tile layers are stacked in `initMap()` (`index.html`):

```js
// Base map (roads, land, water)
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  { maxNativeZoom: 16, maxZoom: 19 }
).addTo(map);

// Labels on a separate pane so they stay crisp above the dark filter
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  { maxNativeZoom: 16, maxZoom: 19, pane: 'labels' }
).addTo(map);
```

The dark look is finished with CSS:

```css
.leaflet-tile-pane   { filter: brightness(.6) contrast(1.05) saturate(.75); }
.leaflet-labels-pane { filter: none; }
```

### Why Esri instead of CartoDB?

CartoDB’s dark tiles now render an **“API KEY REQUIRED”** watermark. Esri’s
World Dark Gray tiles are free for this demo, keyless, and visually close, so the
map stays clean. Attribution is shown bottom-left via `L.control.attribution`.

### Getting the map to display

1. **Use a normal browser with internet access.** The map needs:
   - `unpkg.com` for Leaflet CSS/JS.
   - `server.arcgisonline.com` for tiles.
2. **Open the app** (`index.html`) and complete onboarding (or click through) to
   reach the Driver view.
3. If the map area is blank/grey:
   - Check the browser console/network tab for blocked requests to
     `server.arcgisonline.com`.
   - Some corporate networks/firewalls block ArcGIS; try another network.
   - Confirm the driver screen is visible before the map initialises —
     `switchView('driver')` calls `map.invalidateSize()` so Leaflet recalculates
     its size after the container is shown.
4. If you want a different provider, replace the two `L.tileLayer(...)` calls.
   Any XYZ tile URL works (e.g. OpenStreetMap, Stadia, MapTiler) — but most
   styled dark providers now require a key.

> Verified with Playwright: 24/24 visible tiles load, with no page or console
> errors. The `ERR_ABORTED` entries that can appear during init are Leaflet
> cancelling in-flight tiles as it pans/zooms — not real failures.

---

## Regenerating the assets

These scripts were used with Playwright + Chromium. If your Playwright version
expects a different Chromium build, point `executablePath` at the installed one:

```js
chromium.launch({
  executablePath:
    '/Users/<you>/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell'
});
```

### 1. App screenshots → `assets/`

`capture-app.js` walks the real app through each state (onboarding, driver map,
station detail, charging session, host dashboard, setup modal, incoming request)
and screenshots `#app-phone` at `deviceScaleFactor: 3`.

### 2. Landscape deck slides → `01-cover.png` … `07-close.png`

`capture-deck.js` loads `deck.html`, waits for fonts and Lucide icons, verifies
no slide overflows its 1600×900 box, then screenshots each `#slide-N` at
`deviceScaleFactor: 2`.

### 3. Vertical deck slides → `v-01-cover.png` … `v-09-close.png`

`capture-vertical.js` loads `deck-vertical.html`, waits for fonts and Lucide
icons, verifies no slide overflows its 1080×1920 box, then screenshots each
`#v-N` at `deviceScaleFactor: 2` (exports 2160×3840).

### 4. Contact sheets → `contact-sheet.png` / `contact-sheet-vertical.png`

`capture-contact.js` renders `contact-sheet.html` full-page at 2×;
`capture-vertical-contact.js` renders `contact-sheet-vertical.html` the same way.

---

## Notes

- The app is a **front-end demo** with simulated data (stations, sessions,
  payouts). No backend or real payments are involved.
- Economics are illustrative: ₨350k install, 1,400 kWh/month solar surplus,
  ₨45/kWh driver price. Final lending eligibility requires a lender assessment.
- The phone shell is 520×820 CSS px, so screenshots have a tablet-like aspect
  ratio; the deck scales them to fit slide layouts.
