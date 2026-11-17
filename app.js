/* =========================================================================
   ChargeKaro — demo application controller
   Two sign-up paths, host verification wizard, ROI, marketplace,
   travel/quick-charge driver flows and a shared live session timer.
   ========================================================================= */

const $ = (id) => document.getElementById(id);
const money = (n) => `₨${Math.round(n).toLocaleString()}`;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const round1 = (n) => Math.round(n * 10) / 10;

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

/* ------------------------------ constants ------------------------------ */

const HOST_RATES = { 7: 38, 11: 42, 22: 48 };

const ROI_CHARGERS = [
  { kw: 7,  title: '7 kW AC wallbox', sub: 'Single phase', min: 85000,  max: 259000 },
  { kw: 11, title: '11 kW 3-phase',   sub: 'Fast AC',      min: 165000, max: 350000 },
  { kw: 22, title: '22 kW fast AC',   sub: 'Commercial',   min: 260000, max: 450000 },
];

const MARKET = [
  { brand: 'ABB',       model: 'Terra AC Wallbox', type: 'AC', kw: 22,  cars: 'Type 2 · most EVs',             price: 410000, seller: 'ABB Pakistan' },
  { brand: 'Schneider', model: 'EVlink Home',      type: 'AC', kw: 11,  cars: 'Type 2 · compact & SUV EVs',    price: 295000, seller: 'Schneider Electric' },
  { brand: 'Wallbox',   model: 'Pulsar Plus',      type: 'AC', kw: 7.4, cars: 'Type 2 · compact EVs',          price: 185000, seller: 'Wallbox Partners' },
  { brand: 'Delta',     model: 'AC Max',           type: 'AC', kw: 22,  cars: 'Type 2 · SUV EVs',              price: 385000, seller: 'Delta Electronics' },
  { brand: 'Siemens',   model: 'VersiCharge',      type: 'AC', kw: 7.4, cars: 'Type 2 · all EVs',              price: 210000, seller: 'Siemens Pakistan' },
  { brand: 'Tesla',     model: 'Wall Connector',   type: 'AC', kw: 11,  cars: 'Type 2 / NACS · Tesla & others', price: 320000, seller: 'Tesla' },
];

const VEHICLES = {
  ebike: {
    label: 'E-bikes',
    battery: 4,
    maxKw: 1.8,
    brands: {
      'Super Soco': ['TS Max', 'TC Max'],
      'NIU': ['NQi GT', 'MQi+'],
      'Ora': ['Ora E-bike'],
      'Other': ['Custom e-bike'],
    },
  },
  compact: {
    label: 'Compact / Crossover EV',
    battery: 50,
    maxKw: 6.6,
    brands: {
      'BYD': ['Atto 3', 'Dolphin', 'Seal'],
      'MG': ['ZS EV', 'MG4', 'Comet'],
      'Nissan': ['Leaf', 'Ariya'],
      'Hyundai': ['Ioniq 5', 'Kona Electric'],
      'Kia': ['Niro EV', 'EV6'],
      'Tesla': ['Model 3', 'Model Y'],
      'Other': ['Custom EV'],
    },
  },
  suv: {
    label: 'SUV EV',
    battery: 90,
    maxKw: 11,
    brands: {
      'Audi': ['e-tron 55', 'Q4 e-tron'],
      'BMW': ['iX', 'iX3'],
      'Mercedes': ['EQC', 'EQE SUV'],
      'Lucid': ['Air'],
      'Tesla': ['Model X', 'Model Y'],
      'Other': ['Custom SUV EV'],
    },
  },
};

const STATIONS = [
  {
    id: 'st-1', host: 'Tariq Mahmood', initials: 'TM', kw: 11, phase: '3-Phase AC',
    connector: 'Type 2', connectors: ['Type 2'], rate: 42, lat: 31.4700, lng: 74.4100,
    address: 'House 42-B, Street 7, Phase 5', area: 'Phase 5, DHA', parking: 'Driveway spot',
    rating: 4.9, charges: 38, until: '11:30 PM', available: true,
    notes: 'Gate is unlocked. Park in front of the wallbox.',
    amenities: ['Covered parking', 'Restroom', 'Wi-Fi'],
  },
  {
    id: 'st-2', host: 'Ayesha Khan', initials: 'AK', kw: 7.4, phase: 'Single phase',
    connector: 'Type 2', connectors: ['Type 2'], rate: 38, lat: 31.4750, lng: 74.4050,
    address: '12-C, Main Boulevard, Gulberg III', area: 'Gulberg III', parking: 'Street parking',
    rating: 4.8, charges: 24, until: '10:00 PM', available: true,
    notes: 'Ring the bell at the gate. Cable is already mounted.',
    amenities: ['Café next door', 'Restroom'],
  },
  {
    id: 'st-3', host: 'Bilal Hussain', initials: 'BH', kw: 22, phase: 'Fast AC',
    connector: 'Type 2 / CCS2', connectors: ['Type 2', 'CCS2', 'GB/T'], rate: 48, lat: 31.4650, lng: 74.4180,
    address: 'Plot 8, Sector Z, Phase 3', area: 'Phase 3, DHA', parking: 'Covered garage',
    rating: 5.0, charges: 61, until: 'Open 24 hours', available: true,
    notes: 'Commercial-grade wallbox. Attendant on site until midnight.',
    amenities: ['Attendant', 'Waiting lounge', 'Restroom', 'Wi-Fi'],
  },
  {
    id: 'st-4', host: 'Sana Malik', initials: 'SM', kw: 7.4, phase: 'Single phase',
    connector: 'Type 1', connectors: ['Type 1'], rate: 36, lat: 31.4820, lng: 74.3990,
    address: 'House 21, Street 3, Model Town', area: 'Model Town', parking: 'Driveway spot',
    rating: 4.7, charges: 17, until: '9:30 PM', available: true,
    notes: 'Type 1 connector only. Please bring your own adapter if needed.',
    amenities: ['Covered parking', 'Restroom'],
  },
  {
    id: 'st-5', host: 'Hamza Raza', initials: 'HR', kw: 11, phase: '3-Phase AC',
    connector: 'Type 2', connectors: ['Type 2', 'CHAdeMO'], rate: 44, lat: 31.4590, lng: 74.4230,
    address: 'House 5, Street 9, Phase 6', area: 'Phase 6, DHA', parking: 'Driveway spot',
    rating: 4.9, charges: 45, until: '11:00 PM', available: true,
    notes: 'Quiet street. Please keep the gate closed after entering.',
    amenities: ['Covered parking', 'Restroom', 'Wi-Fi'],
  },
  {
    id: 'st-6', host: 'Zainab Fatima', initials: 'ZF', kw: 22, phase: 'Fast AC',
    connector: 'Type 2 / CCS2', connectors: ['Type 2', 'CCS2', 'GB/T'], rate: 50, lat: 31.4880, lng: 74.4300,
    address: 'Plaza 3, Cavalry Ground', area: 'Cavalry Ground', parking: 'Basement bay',
    rating: 4.8, charges: 29, until: 'Open 24 hours', available: false,
    notes: 'Basement level B1, bay 14. Security desk will guide you.',
    amenities: ['Security', 'Waiting lounge', 'Restroom'],
  },
  {
    id: 'st-7', host: 'Nadia Sheikh', initials: 'NS', kw: 11, phase: '3-Phase AC',
    connector: 'Type 2', connectors: ['Type 2'], rate: 43, lat: 31.5167, lng: 74.3500,
    address: 'House 9, Street 14, Gulberg II', area: 'Gulberg II', parking: 'Driveway spot',
    rating: 4.9, charges: 31, until: '10:30 PM', available: true,
    notes: 'Driveway fits two cars. Please don’t block the neighbour’s gate.',
    amenities: ['Covered parking', 'Restroom', 'Wi-Fi'],
  },
  {
    id: 'st-8', host: 'Omar Farooq', initials: 'OF', kw: 22, phase: 'Fast AC',
    connector: 'Type 2 / CCS2', connectors: ['Type 2', 'CCS2'], rate: 47, lat: 31.5350, lng: 74.3400,
    address: 'Plot 4, Shadman Market', area: 'Shadman', parking: 'Commercial bay',
    rating: 4.8, charges: 54, until: 'Open 24 hours', available: true,
    notes: 'Well-lit commercial bay with a chai shop next door.',
    amenities: ['Attendant', 'Café next door', 'Restroom'],
  },
  {
    id: 'st-9', host: 'Hira Aslam', initials: 'HA', kw: 7.4, phase: 'Single phase',
    connector: 'Type 2', connectors: ['Type 2'], rate: 39, lat: 31.5600, lng: 74.3600,
    address: 'House 77, Mughalpura Road', area: 'Mughalpura', parking: 'Street parking',
    rating: 4.7, charges: 12, until: '9:00 PM', available: true,
    notes: 'Quiet residential street. Cable reaches the kerb.',
    amenities: ['Street parking', 'Restroom'],
  },
  {
    id: 'st-10', host: 'Imran Qureshi', initials: 'IQ', kw: 11, phase: '3-Phase AC',
    connector: 'Type 2', connectors: ['Type 2'], rate: 41, lat: 31.5000, lng: 74.4000,
    address: 'House 18, Sarwar Road, Cantonment', area: 'Lahore Cantonment', parking: 'Driveway spot',
    rating: 4.9, charges: 36, until: '11:00 PM', available: true,
    notes: 'Five minutes from the airport road. Gate code shared after booking.',
    amenities: ['Covered parking', 'Restroom', 'Wi-Fi'],
  },
];

const DESTINATIONS = {
  'Lahore Fort': { lat: 31.5881, lng: 74.3154 },
  'Allama Iqbal International Airport': { lat: 31.5216, lng: 74.4036 },
  'Gulberg': { lat: 31.5167, lng: 74.3500 },
  'DHA Lahore': { lat: 31.4700, lng: 74.4000 },
};

const USER_LOCATION = { lat: 31.4697, lng: 74.4126, label: 'LUMS, Lahore' };

/* -------------------------------- state -------------------------------- */

const APP = {
  screen: 'screen-auth',
  role: null,
  hostPath: null,
  marketContext: 'onboarding',

  user: { name: '', mobile: '', email: '', password: '' },

  vehicle: {
    category: 'compact',
    brand: 'BYD',
    model: 'Atto 3',
    connector: 'Type 2',
    battery: 50,
    maxKw: 6.6,
  },

  host: {
    charger: {
      kw: 11,
      from: '08:00',
      to: '23:30',
      connectors: ['Type 2'],
      photos: { charger: null, receipt: null },
    },
    location: { lat: 31.4700, lng: 74.4100, street: '', landmark: '', city: 'Lahore' },
    payout: { method: 'bank', title: '', number: '' },
    verification: 'none', // none | submitted | verified
    online: true,
    tab: 'dashboard',
    incoming: null,
    earnedToday: 2840,
    earnedMonth: 38450,
    energyMonth: 854.4,
    sessionsMonth: 62,
    purchased: null,
    recent: [
      { driver: 'Salman Zaidi', car: 'Audi e-tron 55', energy: 16.5, amount: 742, when: 'Today · 2:10 PM' },
      { driver: 'Mariam Iqbal', car: 'BYD Atto 3', energy: 9.2, amount: 386, when: 'Today · 11:45 AM' },
      { driver: 'Usman Tariq', car: 'MG ZS EV', energy: 21.4, amount: 899, when: 'Yesterday · 7:20 PM' },
    ],
  },

  view: 'driver',
  driverMode: 'travel',
  filter: 'all',
  search: '',

  selectedStation: null,
  route: null,
  routePickStop: null,
  journey: null,

  session: null,
  sessionTimer: null,

  ratingTarget: 'host',
  ratingValue: 0,
  buyItem: null,

  roi: { solar: 7, kw: 7, sessions: 2, context: 'onboarding' },

  map: { driver: null, host: null, markers: null, routeLayer: null, userMarker: null, pickMarker: null, pickHandler: null },
  customDestination: null,
  hostPin: null,
  hostMapReady: false,
};

/* ------------------------------ utilities ------------------------------ */

function toast(msg, ms = 2600) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('is-visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('is-visible'), ms);
}

function showError(id, msg) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(id) {
  const el = $(id);
  if (el) el.classList.add('hidden');
}

function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function distanceLabel(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function timeLabel(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

function hostRate() {
  return HOST_RATES[APP.host.charger.kw] || 42;
}

/* --------------------------- screen management -------------------------- */

function showScreen(name) {
  document.querySelectorAll('.app-screen').forEach((el) => el.classList.remove('is-active'));
  const target = $(name);
  if (target) target.classList.add('is-active');
  APP.screen = name;

  if (name === 'screen-vehicle') populateVehiclePickers();
  if (name === 'screen-host-location') setTimeout(initHostLocationMap, 90);
  if (name === 'screen-pending') renderPending();
  if (name === 'screen-roi') renderRoi('onboarding');
  if (name === 'screen-market') renderMarket('onboarding');
  if (name === 'screen-main') {
    if (APP.view === 'driver') setTimeout(initDriverMap, 90);
    if (APP.view === 'host') renderHost();
  }

  const body = target && target.querySelector('.screen-body');
  if (body) body.scrollTop = 0;
  refreshIcons();
}

/* --------------------------------- auth -------------------------------- */

function handleLogin() {
  const email = ($('login-email').value || '').trim();
  const pass = ($('login-password').value || '').trim();
  hideError('login-error');

  if (!email || !pass) {
    showError('login-error', 'Enter your email and password to continue.');
    return;
  }

  if (!APP.user.email) {
    APP.user.email = email;
    APP.user.name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (APP.role === 'host') {
    if (APP.host.verification === 'verified') {
      openMain('host');
    } else {
      showScreen('screen-pending');
    }
  } else {
    if (APP.role === null) APP.role = 'driver';
    openMain('driver');
  }
}

function startSignup() {
  showScreen('screen-role');
}

function chooseSignupRole(role) {
  APP.role = role;
  const eyebrow = $('details-eyebrow');
  const title = $('details-title');
  const sub = $('details-sub');

  if (role === 'host') {
    eyebrow.textContent = 'Host account · step 2';
    eyebrow.className = 'text-[11px] font-bold uppercase tracking-[.14em] text-brand-orange';
    title.textContent = 'Your details.';
    sub.textContent = 'We use these to verify you and send your payouts.';
  } else {
    eyebrow.textContent = 'Create account · step 2';
    eyebrow.className = 'text-[11px] font-bold uppercase tracking-[.14em] text-brand-yellow';
    title.textContent = 'Your details.';
    sub.textContent = 'We use these to secure your account and personalize charging.';
  }

  showScreen('screen-details');
}

function submitDetails() {
  const name = ($('su-name').value || '').trim();
  const mobile = ($('su-mobile').value || '').trim();
  const email = ($('su-email').value || '').trim();
  const password = ($('su-password').value || '').trim();
  hideError('details-error');

  if (!name) return showError('details-error', 'Please enter your full name.');
  if (!mobile) return showError('details-error', 'Please enter your mobile number.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return showError('details-error', 'Enter a valid email address.');
  if (password.length < 6) return showError('details-error', 'Password must be at least 6 characters.');

  APP.user = { name, mobile, email, password };

  if (APP.role === 'host') {
    showScreen('screen-host-path');
  } else {
    showScreen('screen-vehicle');
  }
}

/* ------------------------------ host path ------------------------------- */

function chooseHostPath(path) {
  APP.hostPath = path;
  if (path === 'a') {
    APP.roi.context = 'onboarding';
    APP.roi.kw = 7;
    showScreen('screen-roi');
  } else {
    showScreen('screen-host-verify');
  }
}

/* ---------------------------- ROI calculator ---------------------------- */

function setRoiSolar(v) {
  APP.roi.solar = Number(v);
  updateRoiLive();
}

function setRoiCharger(kw) {
  APP.roi.kw = Number(kw);
  updateRoi();
}

function setRoiSessions(v) {
  APP.roi.sessions = Number(v);
  updateRoiLive();
}

function roiNumbers() {
  const { solar, kw, sessions } = APP.roi;
  const charger = ROI_CHARGERS.find((c) => c.kw === kw) || ROI_CHARGERS[0];
  const chargerCost = Math.round((charger.min + charger.max) / 2);
  const solarSurplus = solar * 126;                 // ~4.2 kWh per kW per day
  const sessionEnergy = kw * 1.6 * 0.88;            // 1.6 h average session
  const demand = sessions * sessionEnergy * 30;
  const energySold = Math.min(demand, solarSurplus);
  const monthlyProfit = energySold * 17;            // ₨17 host margin per kWh
  const payback = monthlyProfit > 0 ? chargerCost / monthlyProfit : 99;
  return { charger, chargerCost, solarSurplus, demand, energySold, monthlyProfit, payback };
}

function renderRoi(context = 'onboarding') {
  APP.roi.context = context;
  const { solar, kw, sessions } = APP.roi;
  const n = roiNumbers();

  const chargerCards = ROI_CHARGERS.map((c) => `
    <button type="button" onclick="setRoiCharger(${c.kw})"
      class="selectable-card ${c.kw === kw ? 'is-selected' : ''} !p-3">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[12px] font-extrabold text-white">${c.title}</span>
        <span class="text-[9px] font-bold ${c.kw === kw ? 'text-brand-yellow' : 'text-slate-500'}">${c.sub}</span>
      </div>
      <div class="mt-1 text-[10px] font-semibold text-slate-400">${money(c.min)} – ${money(c.max)}</div>
    </button>`).join('');

  const profitPct = clamp((n.monthlyProfit / 80000) * 100, 2, 100);
  const paybackPct = clamp(100 - (n.payback / 36) * 100, 3, 100);

  const html = `
    <div class="rounded-2xl border border-white/5 bg-[#10131A] p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[10px] font-bold uppercase tracking-[.14em] text-brand-yellow">Solar host calculator</div>
          <h2 class="mt-1 font-display text-xl font-bold text-white">Estimate your return.</h2>
        </div>
        <span class="rounded-full bg-brand-green/10 px-2 py-1 text-[9px] font-bold text-brand-green">Live</span>
      </div>
      <p class="mt-2 text-[11px] leading-relaxed text-slate-400">Assumes you sell surplus solar at ₨45/kWh and keep ₨17/kWh after grid costs.</p>

      <div class="mt-4 space-y-4">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-200">Installed solar capacity</span>
            <span class="font-mono text-[12px] font-bold text-brand-yellow" data-roi="solar-value">${solar} kW</span>
          </div>
          <input type="range" min="3" max="15" step="1" value="${solar}" oninput="setRoiSolar(this.value)" class="mt-2 w-full" aria-label="Solar capacity">
          <div class="mt-1 flex justify-between text-[9px] font-semibold text-slate-600"><span>3 kW</span><span>15 kW</span></div>
        </div>

        <div>
          <span class="field-label">Target charger</span>
          <div class="space-y-1.5">${chargerCards}</div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-200">Expected daily sessions</span>
            <span class="font-mono text-[12px] font-bold text-brand-orange" data-roi="sessions-value">${sessions} ${sessions === 1 ? 'car' : 'cars'}/day</span>
          </div>
          <input type="range" min="1" max="5" step="1" value="${sessions}" oninput="setRoiSessions(this.value)" class="mt-2 w-full" aria-label="Daily sessions">
          <div class="mt-1 flex justify-between text-[9px] font-semibold text-slate-600"><span>1 car</span><span>5 cars</span></div>
        </div>
      </div>

      <div class="mt-5 space-y-3 rounded-2xl border border-white/5 bg-black/25 p-3.5">
        <div>
          <div class="flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Projected monthly net profit</span>
            <span class="font-mono text-[13px] text-brand-yellow" data-roi="profit">${money(n.monthlyProfit)}</span>
          </div>
          <div class="metric-track mt-1.5"><div class="metric-fill bg-brand-yellow" data-roi="profit-bar" style="width:${profitPct}%"></div></div>
        </div>
        <div>
          <div class="flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Estimated payback period</span>
            <span class="font-mono text-[13px] text-brand-orange" data-roi="payback">${n.payback >= 60 ? '60+' : n.payback.toFixed(1)} months</span>
          </div>
          <div class="metric-track mt-1.5"><div class="metric-fill bg-brand-orange" data-roi="payback-bar" style="width:${paybackPct}%"></div></div>
        </div>
        <div class="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
          <div><div class="text-[9px] uppercase tracking-wide text-slate-500">Charger cost</div><div class="mt-0.5 font-display text-[11px] font-bold text-white" data-roi="charger-cost">${money(n.chargerCost)}</div></div>
          <div><div class="text-[9px] uppercase tracking-wide text-slate-500">Solar surplus</div><div class="mt-0.5 font-display text-[11px] font-bold text-white" data-roi="solar-surplus">${Math.round(n.solarSurplus)} kWh</div></div>
          <div><div class="text-[9px] uppercase tracking-wide text-slate-500">Energy sold</div><div class="mt-0.5 font-display text-[11px] font-bold text-white" data-roi="energy-sold">${Math.round(n.energySold)} kWh</div></div>
        </div>
      </div>
    </div>`;

  const body = $(context === 'onboarding' ? 'roi-onboarding-body' : 'host-roi-body');
  if (body) body.innerHTML = html;

  const foot = $('roi-onboarding-foot');
  if (foot && context === 'onboarding') {
    foot.innerHTML = `<button onclick="showScreen('screen-market')" class="btn-primary w-full py-3.5 text-sm">Continue to marketplace</button>`;
  }

  refreshIcons();
}

function updateRoi() {
  renderRoi(APP.roi.context);
}

function updateRoiLive() {
  const root = $(APP.roi.context === 'onboarding' ? 'roi-onboarding-body' : 'host-roi-body');
  if (!root) return;
  const n = roiNumbers();
  const q = (key) => root.querySelector(`[data-roi="${key}"]`);
  const setText = (key, value) => {
    const el = q(key);
    if (el) el.textContent = value;
  };

  setText('solar-value', `${APP.roi.solar} kW`);
  setText('sessions-value', `${APP.roi.sessions} ${APP.roi.sessions === 1 ? 'car' : 'cars'}/day`);
  setText('profit', money(n.monthlyProfit));
  setText('payback', n.payback >= 60 ? '60+ months' : `${n.payback.toFixed(1)} months`);
  setText('charger-cost', money(n.chargerCost));
  setText('solar-surplus', `${Math.round(n.solarSurplus)} kWh`);
  setText('energy-sold', `${Math.round(n.energySold)} kWh`);

  const profitBar = q('profit-bar');
  if (profitBar) profitBar.style.width = `${clamp((n.monthlyProfit / 80000) * 100, 2, 100)}%`;
  const paybackBar = q('payback-bar');
  if (paybackBar) paybackBar.style.width = `${clamp(100 - (n.payback / 36) * 100, 3, 100)}%`;
}

function roiBack() {
  if (APP.roi.context === 'onboarding') {
    showScreen('screen-host-path');
  } else {
    setHostTab('dashboard');
  }
}

/* --------------------------- charger marketplace ------------------------ */

function renderMarket(context = 'onboarding') {
  APP.marketContext = context;
  const body = $(context === 'onboarding' ? 'market-onboarding-body' : 'host-market-body');
  if (!body) return;

  const cards = MARKET.map((item, i) => {
    const owned = APP.host.purchased && APP.host.purchased.brand === item.brand && APP.host.purchased.model === item.model;
    return `
      <div class="rounded-2xl border ${owned ? 'border-brand-green/40' : 'border-white/8'} bg-[#10131A] p-3.5">
        <div class="flex items-start gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-orange/15 font-display text-sm font-black text-brand-yellow">${item.brand.slice(0, 2).toUpperCase()}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="text-[12px] font-extrabold text-white">${item.brand} ${item.model}</div>
                <div class="mt-0.5 text-[10px] text-slate-500">${item.seller}</div>
              </div>
              <span class="rounded-full bg-brand-green/10 px-2 py-0.5 text-[8.5px] font-bold text-brand-green">Verified</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5 text-[9px] font-semibold">
              <span class="rounded-md bg-white/5 px-2 py-1 text-slate-300">${item.type}</span>
              <span class="rounded-md bg-brand-yellow/10 px-2 py-1 text-brand-yellow">${item.kw} kW</span>
              <span class="rounded-md bg-white/5 px-2 py-1 text-slate-400">${item.cars}</span>
            </div>
            <div class="mt-2.5 flex items-center justify-between gap-2">
              <div class="font-display text-[15px] font-bold text-white">${money(item.price)}</div>
              <button onclick="openBuy(${i})" class="rounded-xl ${owned ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-yellow text-black'} px-3 py-2 text-[10px] font-extrabold transition btn-press">${owned ? 'Order placed' : 'Buy'}</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  body.innerHTML = `
    <div class="rounded-2xl border border-white/5 bg-[#10131A] p-3.5">
      <div class="flex items-center gap-2 text-[10px] font-bold text-brand-green">
        <i data-lucide="shield-check" class="h-3.5 w-3.5"></i>
        Partnered brands · warranties handled by the seller
      </div>
      <p class="mt-1.5 text-[10.5px] leading-relaxed text-slate-500">Every charger is Type 2 AC, compatible with the vehicles on ChargeKaro, and installed by a certified technician.</p>
    </div>
    <div class="mt-3 space-y-2.5">${cards}</div>`;

  refreshIcons();
}

function marketBack() {
  showScreen('screen-pending');
}

function exitMarketplace() {
  showScreen('screen-pending');
  toast('Marketplace closed — finish verification to start hosting.');
}

function openBuy(index) {
  const item = MARKET[index];
  APP.buyItem = item;
  $('buy-title').textContent = `${item.brand} ${item.model}`;
  $('buy-body').innerHTML = `
    <div class="flex items-center justify-between"><span class="text-slate-500">Charger</span><span class="font-bold text-white">${item.kw} kW ${item.type}</span></div>
    <div class="flex items-center justify-between"><span class="text-slate-500">Compatibility</span><span class="font-bold text-white">${item.cars}</span></div>
    <div class="flex items-center justify-between"><span class="text-slate-500">Seller</span><span class="font-bold text-white">${item.seller}</span></div>
    <div class="flex items-center justify-between"><span class="text-slate-500">Charger price</span><span class="font-bold text-white">${money(item.price)}</span></div>
    <div class="flex items-center justify-between border-t border-white/5 pt-2"><span class="text-slate-500">Booking deposit</span><span class="font-bold text-brand-yellow">${money(10000)}</span></div>
    <p class="mt-1 text-[10px] leading-relaxed text-slate-500">A certified installer will contact you within 24 hours. The deposit is adjusted against the final installation cost.</p>`;
  $('buy-modal').classList.remove('hidden');
  $('buy-modal').classList.add('flex');
  refreshIcons();
}

function closeBuyModal() {
  $('buy-modal').classList.add('hidden');
  $('buy-modal').classList.remove('flex');
}

function confirmBuy() {
  if (!APP.buyItem) return;
  APP.host.purchased = APP.buyItem;
  closeBuyModal();
  toast(`${APP.buyItem.brand} ${APP.buyItem.model} reserved · installer will call you.`, 3400);
  renderMarket(APP.marketContext);
}

/* ----------------------------- pending screen --------------------------- */

function renderPending() {
  const v = APP.host.verification;
  const copy = $('pending-copy');
  const status = $('pending-status');
  const actions = $('pending-actions');

  if (v === 'verified') {
    setTimeout(() => openMain('host'), 30);
    return;
  }

  if (v === 'none') {
    copy.textContent = 'You’ll be eligible to become a charger host once you register and your charger is verified.';
    status.innerHTML = `
      <div class="rounded-2xl border border-white/5 bg-[#10131A] p-3.5">
        <div class="flex items-start gap-2.5">
          <i data-lucide="info" class="mt-0.5 h-4 w-4 shrink-0 text-brand-orange"></i>
          <p class="text-[10.5px] leading-relaxed text-slate-400">No charger on file yet. Add your charger details, location and payout method to start verification.</p>
        </div>
      </div>`;
  } else {
    copy.textContent = 'Your charger is being verified. This usually takes less than 24 hours.';
    status.innerHTML = `
      <div class="rounded-2xl border border-brand-orange/25 bg-brand-orange/5 p-4">
        <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-brand-orange">
          <span class="h-1.5 w-1.5 rounded-full bg-brand-orange live-dot"></span> Verification in progress
        </div>
        <div class="mt-2 text-[11px] leading-relaxed text-slate-400">
          <div class="flex items-center justify-between"><span>Charger</span><span class="font-bold text-white">${APP.host.charger.kw} kW · ${APP.host.charger.connectors.join(', ')}</span></div>
          <div class="mt-1 flex items-center justify-between"><span>Location</span><span class="font-bold text-white">${APP.host.location.city || '—'}</span></div>
          <div class="mt-1 flex items-center justify-between"><span>Payout</span><span class="font-bold text-white">${APP.host.payout.method === 'bank' ? 'Bank transfer' : APP.host.payout.method === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}</span></div>
        </div>
        <button onclick="approveHostVerification()" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-orange/30 bg-brand-orange/10 py-2.5 text-[10px] font-bold text-brand-orange transition hover:bg-brand-orange/20">
          <i data-lucide="badge-check" class="h-3.5 w-3.5"></i> Demo: approve verification now
        </button>
      </div>`;
  }

  actions.innerHTML = `
    <button onclick="goHostVerify()" class="flex w-full items-center justify-between gap-3 rounded-2xl bg-brand-orange px-4 py-4 text-left text-white shadow-glow-orange transition btn-press hover:bg-brand-orangeHover">
      <span class="flex items-center gap-3">
        <i data-lucide="plug-zap" class="h-5 w-5"></i>
        <span class="text-[13px] font-extrabold">${v === 'none' ? 'I want to rent my charger' : 'Update charger details'}</span>
      </span>
      <i data-lucide="arrow-right" class="h-4 w-4"></i>
    </button>
    <button onclick="goDriverMode()" class="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#14171F] px-4 py-4 text-left transition hover:bg-[#181C26] btn-press">
      <span class="flex items-center gap-3">
        <i data-lucide="navigation" class="h-5 w-5 text-brand-yellow"></i>
        <span class="text-[13px] font-extrabold text-white">Switch to driver mode</span>
      </span>
      <i data-lucide="arrow-right" class="h-4 w-4 text-slate-500"></i>
    </button>`;

  refreshIcons();
}

function goHostVerify() {
  showScreen('screen-host-verify');
  syncHostVerifyForm();
}

function goDriverMode() {
  APP.role = APP.role || 'driver';
  if (!APP.vehicle.brand) {
    showScreen('screen-vehicle');
    return;
  }
  openMain('driver');
}

function approveHostVerification() {
  APP.host.verification = 'verified';
  toast('Charger approved — welcome to hosting.');
  openMain('host');
}

/* ---------------------------- host verification ------------------------- */

function syncHostVerifyForm() {
  document.querySelectorAll('input[name="v-kw"]').forEach((r) => {
    const on = Number(r.value) === APP.host.charger.kw;
    r.checked = on;
    r.closest('label')?.classList.toggle('is-selected', on);
  });
  if ($('v-from')) $('v-from').value = APP.host.charger.from;
  if ($('v-to')) $('v-to').value = APP.host.charger.to;
  document.querySelectorAll('#v-conn-group input').forEach((cb) => {
    const on = APP.host.charger.connectors.includes(cb.value);
    cb.checked = on;
    cb.closest('label')?.classList.toggle('is-selected', on);
  });
  ['charger', 'receipt'].forEach((kind) => {
    if (APP.host.charger.photos[kind]) paintPhotoTile(kind, APP.host.charger.photos[kind]);
  });
  validateHostVerify();
}

function paintPhotoTile(kind, dataUrl) {
  const tile = $(`v-photo-${kind}-tile`);
  if (!tile) return;
  tile.classList.add('has-photo');
  tile.innerHTML = `<img src="${dataUrl}" alt="${kind} photo"><span class="photo-overlay">Change photo</span>`;
}

function handlePhotoUpload(input, kind) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    APP.host.charger.photos[kind] = reader.result;
    paintPhotoTile(kind, reader.result);
    validateHostVerify();
    refreshIcons();
  };
  reader.readAsDataURL(file);
}

function useSamplePhoto(kind) {
  const svg = kind === 'charger'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#14171F"/><rect x="140" y="70" width="120" height="170" rx="18" fill="#1F2633" stroke="#FF7A45" stroke-width="3"/><rect x="165" y="95" width="70" height="46" rx="8" fill="#0B0D11"/><text x="200" y="126" font-family="monospace" font-size="20" fill="#FFD54A" text-anchor="middle">11 kW</text><circle cx="200" cy="185" r="20" fill="#0B0D11" stroke="#34D399" stroke-width="4"/><text x="200" y="191" font-family="sans-serif" font-size="11" fill="#34D399" text-anchor="middle">EV</text><path d="M200 240 q0 40 -30 55" stroke="#FF7A45" stroke-width="6" fill="none"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#14171F"/><rect x="70" y="45" width="260" height="210" rx="8" fill="#F3F4F6"/><rect x="92" y="70" width="120" height="14" rx="3" fill="#94A3B8"/><rect x="92" y="98" width="216" height="8" rx="2" fill="#CBD5E1"/><rect x="92" y="114" width="190" height="8" rx="2" fill="#CBD5E1"/><rect x="92" y="130" width="210" height="8" rx="2" fill="#CBD5E1"/><rect x="92" y="146" width="150" height="8" rx="2" fill="#CBD5E1"/><text x="200" y="205" font-family="sans-serif" font-size="22" font-weight="bold" fill="#0B0D11" text-anchor="middle">WARRANTY</text><text x="200" y="232" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">24 months · serial CK-2026-118</text></svg>`;

  APP.host.charger.photos[kind] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  paintPhotoTile(kind, APP.host.charger.photos[kind]);
  validateHostVerify();
  toast('Sample photo attached.');
}

function validateHostVerify() {
  const kw = document.querySelector('input[name="v-kw"]:checked');
  const connectors = [...document.querySelectorAll('#v-conn-group input:checked')];
  const ready = !!kw && connectors.length > 0 && !!APP.host.charger.photos.charger && !!APP.host.charger.photos.receipt;
  const btn = $('v-continue');
  if (btn) btn.disabled = !ready;
  return ready;
}

function submitHostVerification() {
  if (!validateHostVerify()) {
    toast('Add both photos and at least one connector.');
    return;
  }
  const kw = Number(document.querySelector('input[name="v-kw"]:checked').value);
  const connectors = [...document.querySelectorAll('#v-conn-group input:checked')].map((c) => c.value);
  APP.host.charger.kw = kw;
  APP.host.charger.from = $('v-from').value || '08:00';
  APP.host.charger.to = $('v-to').value || '23:30';
  APP.host.charger.connectors = connectors;
  showScreen('screen-host-location');
}

/* ---------------------------- host location map ------------------------- */

function mapTiles(map) {
  if (!window.L) return false;
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16, maxZoom: 19,
  }).addTo(map);
  map.createPane('labels');
  map.getPane('labels').style.zIndex = 460;
  map.getPane('labels').style.pointerEvents = 'none';
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    pane: 'labels', maxNativeZoom: 16, maxZoom: 19,
  }).addTo(map);
  return true;
}

function initHostLocationMap() {
  const el = $('host-location-map');
  if (!el) return;
  if (!window.L) {
    el.innerHTML = `<div class="flex h-full items-center justify-center p-6 text-center text-[11px] text-slate-500">Map needs an internet connection. You can still enter the address below.</div>`;
    return;
  }
  if (APP.map.host) {
    APP.map.host.invalidateSize();
    return;
  }

  const loc = APP.host.location;
  const map = L.map(el, { center: [loc.lat, loc.lng], zoom: 15, zoomControl: false, attributionControl: false });
  mapTiles(map);

  const pinIcon = L.divIcon({
    className: '',
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
      <div style="background:#FF7A45;color:#fff;border-radius:14px;padding:6px 10px;font:700 11px 'Space Grotesk',sans-serif;box-shadow:0 10px 24px rgba(0,0,0,.5);white-space:nowrap">Your charger</div>
      <div style="width:10px;height:10px;background:#FF7A45;transform:rotate(45deg);margin-top:-5px"></div>
    </div>`,
    iconSize: [110, 42],
    iconAnchor: [55, 38],
  });

  const marker = L.marker([loc.lat, loc.lng], { icon: pinIcon, draggable: true }).addTo(map);
  marker.on('dragend', () => {
    const p = marker.getLatLng();
    loc.lat = p.lat;
    loc.lng = p.lng;
    if ($('loc-coords')) $('loc-coords').textContent = `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`;
  });
  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    loc.lat = e.latlng.lat;
    loc.lng = e.latlng.lng;
    if ($('loc-coords')) $('loc-coords').textContent = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
  });

  APP.map.host = map;
  APP.hostPin = marker;
  if ($('loc-coords')) $('loc-coords').textContent = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  setTimeout(() => map.invalidateSize(), 120);
}

function useCurrentLocation() {
  const fallback = () => {
    const loc = APP.host.location;
    loc.lat = 31.4700; loc.lng = 74.4100;
    if (APP.map.host && APP.hostPin) {
      APP.map.host.setView([loc.lat, loc.lng], 16);
      APP.hostPin.setLatLng([loc.lat, loc.lng]);
    }
    if ($('loc-coords')) $('loc-coords').textContent = '31.4700, 74.4100';
    toast('Using demo location — drag the pin to adjust.');
  };

  if (!navigator.geolocation) return fallback();
  toast('Fetching your location…');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const loc = APP.host.location;
      loc.lat = pos.coords.latitude;
      loc.lng = pos.coords.longitude;
      if (APP.map.host && APP.hostPin) {
        APP.map.host.setView([loc.lat, loc.lng], 16);
        APP.hostPin.setLatLng([loc.lat, loc.lng]);
      }
      if ($('loc-coords')) $('loc-coords').textContent = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
      toast('Location fetched. Drag the pin to the exact spot.');
    },
    fallback,
    { enableHighAccuracy: true, timeout: 7000 }
  );
}

function submitHostLocation() {
  const street = ($('loc-street').value || '').trim();
  const landmark = ($('loc-landmark').value || '').trim();
  const city = ($('loc-city').value || '').trim();

  if (!street) { toast('Enter the street address.'); return; }
  if (!city) { toast('Enter the city.'); return; }

  APP.host.location.street = street;
  APP.host.location.landmark = landmark;
  APP.host.location.city = city;
  if (APP.hostPin) {
    const p = APP.hostPin.getLatLng();
    APP.host.location.lat = p.lat;
    APP.host.location.lng = p.lng;
  }
  showScreen('screen-host-payment');
}

/* --------------------------- host payment setup ------------------------- */

function wirePaymentMethods() {
  document.querySelectorAll('input[name="pay-method"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const method = document.querySelector('input[name="pay-method"]:checked').value;
      APP.host.payout.method = method;
      document.querySelectorAll('input[name="pay-method"]').forEach((r) => {
        r.closest('label')?.classList.toggle('is-selected', r.checked);
      });
      const label = $('pay-number-label');
      const input = $('pay-number');
      if (method === 'bank') {
        label.textContent = 'IBAN';
        input.placeholder = 'PK00 XXXX 0000 0000 0000 0000';
      } else {
        label.textContent = 'Mobile wallet number';
        input.placeholder = '03XX XXXXXXX';
      }
    });
  });
}

function finishHostSetup() {
  const method = document.querySelector('input[name="pay-method"]:checked')?.value || 'bank';
  const title = ($('pay-title').value || '').trim();
  const number = ($('pay-number').value || '').trim();

  if (!title) { toast('Enter the account title.'); return; }
  if (!number) { toast('Enter the payout account number.'); return; }

  APP.host.payout = { method, title, number };
  APP.host.verification = 'submitted';
  APP.host.online = true;
  showScreen('screen-pending');
  toast('Verification submitted — we’ll review within 24 hours.');
}

/* ------------------------------ driver vehicle -------------------------- */

function populateVehiclePickers() {
  const cat = APP.vehicle.category;
  const data = VEHICLES[cat];

  document.querySelectorAll('#veh-cat-group button').forEach((btn) => {
    btn.classList.toggle('is-selected', btn.dataset.cat === cat);
  });

  const brandList = $('veh-brand-list');
  const brandInput = $('veh-brand');
  if (brandList && brandInput) {
    brandList.innerHTML = Object.keys(data.brands).map((b) => `<option value="${b}"></option>`).join('');
    if (!data.brands[APP.vehicle.brand]) APP.vehicle.brand = Object.keys(data.brands)[0];
    brandInput.value = APP.vehicle.brand;
  }

  setVehicleBatteryOptions(cat);
  syncVehicleModels();
}

function syncVehicleModels() {
  const cat = APP.vehicle.category;
  const data = VEHICLES[cat];
  const brand = ($('veh-brand').value || '').trim();
  const models = data.brands[brand] || Object.values(data.brands)[0] || [];

  const list = $('veh-model-list');
  if (list) list.innerHTML = models.map((m) => `<option value="${m}"></option>`).join('');

  const modelInput = $('veh-model');
  if (modelInput) {
    if (!models.includes(modelInput.value)) modelInput.value = models[0] || '';
  }
  APP.vehicle.brand = brand || Object.keys(data.brands)[0];
  APP.vehicle.model = modelInput ? modelInput.value : models[0];
}

function setVehicleBatteryOptions(cat) {
  const battery = $('veh-battery');
  const maxkw = $('veh-maxkw');
  const config = {
    ebike: { battery: ['2 kWh', '3 kWh', '4 kWh', '5 kWh'], kw: ['0.5 kW', '1 kW', '1.8 kW', '3.3 kW'], b: '4 kWh', k: '1.8 kW' },
    compact: { battery: ['30 kWh', '40 kWh', '50 kWh', '60 kWh', '75 kWh'], kw: ['3.3 kW', '6.6 kW', '7.4 kW', '11 kW'], b: '50 kWh', k: '6.6 kW' },
    suv: { battery: ['75 kWh', '90 kWh', '100 kWh', '110 kWh'], kw: ['7.4 kW', '11 kW', '22 kW'], b: '90 kWh', k: '11 kW' },
  }[cat];

  if (battery) {
    battery.innerHTML = config.battery.map((v) => `<option>${v}</option>`).join('');
    battery.value = config.b;
  }
  if (maxkw) {
    maxkw.innerHTML = config.kw.map((v) => `<option>${v}</option>`).join('');
    maxkw.value = config.k;
  }
}

function selectVehicleCategory(cat) {
  APP.vehicle.category = cat;
  APP.vehicle.brand = Object.keys(VEHICLES[cat].brands)[0];
  APP.vehicle.model = VEHICLES[cat].brands[APP.vehicle.brand][0];
  populateVehiclePickers();
  refreshIcons();
}

function saveVehicle() {
  syncVehicleModels();
  const brand = ($('veh-brand').value || '').trim();
  const model = ($('veh-model').value || '').trim();
  if (!brand || !model) { toast('Choose your vehicle brand and model.'); return; }

  APP.vehicle.brand = brand;
  APP.vehicle.model = model;
  APP.vehicle.connector = $('veh-connector').value;
  APP.vehicle.battery = parseInt($('veh-battery').value, 10) || VEHICLES[APP.vehicle.category].battery;
  APP.vehicle.maxKw = parseFloat($('veh-maxkw').value) || VEHICLES[APP.vehicle.category].maxKw;

  APP.role = 'driver';
  toast(`${brand} ${model} saved.`);
  openMain('driver');
}

/* ------------------------------ main app shell -------------------------- */

function openMain(view = 'driver') {
  APP.view = view;
  if (view === 'host' && APP.host.verification !== 'verified') {
    showScreen('screen-pending');
    return;
  }
  showScreen('screen-main');
  switchView(view);
}

function switchView(view) {
  if (view === 'host' && APP.host.verification !== 'verified') {
    toast('Verify your charger to unlock host mode.');
    showScreen('screen-pending');
    return;
  }
  APP.view = view;

  const driverBtn = $('tab-driver-btn');
  const hostBtn = $('tab-host-btn');
  driverBtn?.classList.toggle('is-active', view === 'driver');
  hostBtn?.classList.toggle('is-active', view === 'host');

  $('driver-screen')?.classList.toggle('hidden', view !== 'driver');
  $('host-screen')?.classList.toggle('hidden', view !== 'host');
  $('host-nav')?.classList.toggle('hidden', view !== 'host');

  const onlinePill = $('header-online-pill');
  if (onlinePill) {
    onlinePill.classList.toggle('hidden', view !== 'host');
    onlinePill.classList.toggle('is-online', APP.host.online);
    onlinePill.classList.toggle('is-offline', !APP.host.online);
    const label = $('header-online-text');
    if (label) label.textContent = APP.host.online ? 'ONLINE' : 'OFFLINE';
  }

  if (view === 'driver') {
    setTimeout(() => {
      initDriverMap();
      APP.map.driver?.invalidateSize();
      updateNearestCta();
      updateTopPill();
    }, 80);
  } else {
    renderHost();
    if (APP.host.incoming && !APP.host.incoming.accepted) {
      setTimeout(showIncomingModal, 320);
    }
  }

  updateTopPill();
  refreshIcons();
}

function demoJump(role) {
  if (role === 'host') {
    if (!APP.user.name) APP.user = { name: 'Ayesha Khan', mobile: '+92 300 1234567', email: 'ayesha@example.com', password: 'demo123' };
    if (!APP.host.location.street) {
      APP.host.location.street = 'House 42-B, Street 7, Phase 5';
      APP.host.location.city = 'Lahore';
    }
    if (!APP.host.payout.title) APP.host.payout = { method: 'bank', title: 'Ayesha Khan', number: 'PK00 XXXX 0000 0000 0000 0000' };
    APP.role = 'host';
    APP.host.verification = 'verified';
    APP.host.tab = 'dashboard';
    openMain('host');
  } else {
    if (!APP.user.name) APP.user = { name: 'Ayesha Khan', mobile: '+92 300 1234567', email: 'ayesha@example.com', password: 'demo123' };
    APP.role = 'driver';
    openMain('driver');
  }
}

function resetDemo() {
  window.location.reload();
}

/* ------------------------------- driver map ----------------------------- */

function initDriverMap() {
  const el = $('driver-map');
  if (!el) return;
  if (APP.map.driver) {
    APP.map.driver.invalidateSize();
    return;
  }
  if (!window.L) {
    el.innerHTML = `<div class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
      <p class="text-sm font-bold text-white">Map couldn't load</p>
      <p class="text-[11px] leading-relaxed text-slate-400">Leaflet needs an internet connection. Check your network and refresh.</p>
    </div>`;
    return;
  }

  const map = L.map(el, {
    center: [USER_LOCATION.lat, USER_LOCATION.lng],
    zoom: 14,
    zoomControl: false,
    attributionControl: false,
  });
  mapTiles(map);

  const userIcon = L.divIcon({
    className: '',
    html: `<div class="user-pin"><div class="user-pin-core"></div></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
  APP.map.userMarker = L.marker([USER_LOCATION.lat, USER_LOCATION.lng], { icon: userIcon, zIndexOffset: 800 }).addTo(map);
  APP.map.markers = L.layerGroup().addTo(map);
  APP.map.routeLayer = L.layerGroup().addTo(map);
  APP.map.markerIndex = {};

  APP.map.driver = map;
  renderStationMarkers();
  setTimeout(() => map.invalidateSize(), 140);
}

function compatibleStations() {
  const connector = APP.vehicle.connector || 'Type 2';
  return STATIONS.filter((s) => s.connectors.includes(connector));
}

function filteredStations() {
  let list = compatibleStations();
  if (APP.filter === 'fast') list = list.filter((s) => s.kw >= 22);
  if (APP.filter === 'standard') list = list.filter((s) => s.kw === 7.4);
  if (APP.filter === 'now') list = list.filter((s) => s.available);
  if (APP.search) {
    const q = APP.search.toLowerCase();
    list = list.filter((s) =>
      `${s.host} ${s.area} ${s.address} ${s.connector} ${s.connectors.join(' ')} ${s.kw} kW`.toLowerCase().includes(q)
    );
  }
  return list;
}

function stationPinIcon(station) {
  return L.divIcon({
    className: '',
    html: `<div class="station-pin ${station.kw >= 22 ? 'is-fast' : ''}">
      <div class="station-pin-bubble">
        <span class="pin-dot" style="background:${station.available ? '#34D399' : '#F87171'}"></span>
        <span class="pin-kw">${station.kw} kW</span>
        <span class="pin-price">₨${station.rate}</span>
      </div>
      <div class="station-pin-tail"></div>
    </div>`,
    iconSize: [112, 50],
    iconAnchor: [56, 48],
  });
}

function renderStationMarkers() {
  if (!APP.map.driver || !APP.map.markers) return;
  APP.map.markers.clearLayers();
  APP.map.markerIndex = {};

  filteredStations().forEach((station) => {
    const marker = L.marker([station.lat, station.lng], {
      icon: stationPinIcon(station),
      riseOnHover: true,
      zIndexOffset: station.available ? 400 : 0,
    });
    marker.on('click', () => onStationPinClick(station.id));
    marker.addTo(APP.map.markers);
    APP.map.markerIndex[station.id] = marker;
  });

  const allChip = $('filter-all');
  if (allChip) allChip.textContent = `All (${compatibleStations().length})`;

  updateNearestCta();
  updateTopPill();
}

function onStationPinClick(id) {
  if (APP.route && APP.routePickStop !== null) {
    swapRouteStop(APP.routePickStop, id);
    APP.routePickStop = null;
    return;
  }
  openStation(id);
}

function updateNearestCta() {
  const available = compatibleStations().filter((s) => s.available);
  if (!available.length) return;
  const nearest = available
    .map((s) => ({ s, km: haversine(USER_LOCATION, s) }))
    .sort((a, b) => a.km - b.km)[0];

  const label = $('cta-nearest-label');
  const price = $('cta-nearest-price');
  if (label) label.textContent = `${nearest.s.host.split(' ')[0]}'s ${nearest.s.kw} kW · ${distanceLabel(nearest.km)} away`;
  if (price) price.textContent = `₨${nearest.s.rate}`;
}

function findNearestStation() {
  const available = compatibleStations().filter((s) => s.available)
    .map((s) => ({ s, km: haversine(USER_LOCATION, s) }))
    .sort((a, b) => a.km - b.km);
  if (!available.length) return toast('No compatible chargers available right now.');
  const nearest = available[0].s;
  if (APP.map.driver) APP.map.driver.setView([nearest.lat, nearest.lng], 15);
  openStation(nearest.id);
}

function centerOnUser() {
  if (APP.map.driver) APP.map.driver.setView([USER_LOCATION.lat, USER_LOCATION.lng], 15);
  toast('Centred on your location.');
}

function setDriverMode(mode) {
  APP.driverMode = mode;
  const travelBtn = $('mode-travel');
  const quickBtn = $('mode-quick');
  const travelPanel = $('travel-panel');
  const quickPanel = $('quick-panel');

  const active = 'flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-yellow py-2.5 text-[11px] font-extrabold text-black';
  const idle = 'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-bold text-slate-400';

  if (mode === 'travel') {
    travelBtn.className = active;
    quickBtn.className = idle;
    travelPanel.classList.remove('hidden');
    quickPanel.classList.add('hidden');
  } else {
    quickBtn.className = active;
    travelBtn.className = idle;
    quickPanel.classList.remove('hidden');
    travelPanel.classList.add('hidden');
    renderQuickList();
  }
  refreshIcons();
}

function renderQuickList() {
  const wrap = $('quick-list');
  if (!wrap) return;
  const list = compatibleStations().filter((s) => s.available)
    .map((s) => ({ s, km: haversine(USER_LOCATION, s) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 4);

  wrap.innerHTML = list.map(({ s, km }) => `
    <button onclick="openStation('${s.id}')" class="flex w-full items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/25 px-2.5 py-2 text-left transition hover:border-white/15">
      <span class="min-w-0">
        <span class="block truncate text-[11px] font-bold text-white">${s.host} · ${s.kw} kW</span>
        <span class="block text-[9px] text-slate-500">${distanceLabel(km)} · ${s.connector}</span>
      </span>
      <span class="shrink-0 font-mono text-[11px] font-bold text-brand-yellow">₨${s.rate}</span>
    </button>`).join('');
  refreshIcons();
}

function applyFilter(filter) {
  APP.filter = filter;
  document.querySelectorAll('[id^="filter-"]').forEach((btn) => btn.classList.remove('is-active'));
  $(`filter-${filter}`)?.classList.add('is-active');
  renderStationMarkers();
}

function filterStations() {
  const input = $('station-search-input');
  APP.search = (input?.value || '').trim();
  $('clear-search-btn')?.classList.toggle('hidden', !APP.search);
  renderStationMarkers();
}

function clearSearch() {
  if ($('station-search-input')) $('station-search-input').value = '';
  APP.search = '';
  $('clear-search-btn')?.classList.add('hidden');
  renderStationMarkers();
}

/* ---------------------------- station detail sheet ---------------------- */

function openStation(id) {
  const s = stationById(id);
  if (!s) return;
  APP.selectedStation = s;

  const km = haversine(USER_LOCATION, s);
  $('sheet-host-avatar').textContent = s.initials;
  $('sheet-host-name').textContent = s.host;
  $('sheet-rating').textContent = s.rating.toFixed(1);
  $('sheet-distance').textContent = `${distanceLabel(km)} away`;
  $('sheet-charges-count').textContent = `${s.charges} charges`;
  $('sheet-address').textContent = s.address;
  $('sheet-parking-type').textContent = s.parking;
  $('sheet-kw').textContent = `${s.kw} kW`;
  $('sheet-phase').textContent = s.phase;
  $('sheet-connector').textContent = s.connector;
  $('sheet-rate').textContent = `₨${s.rate}`;
  $('sheet-availability-time').textContent = s.available ? `Until ${s.until}` : 'Currently unavailable';
  $('sheet-availability-time').className = `text-right font-bold ${s.available ? 'text-brand-green' : 'text-red-400'}`;
  $('sheet-host-notes').textContent = `"${s.notes}"`;
  $('sheet-amenities').innerHTML = s.amenities
    .map((a) => `<span class="rounded-lg bg-white/5 px-2 py-1 text-[9.5px] font-semibold text-slate-300">${a}</span>`)
    .join('');

  const badge = $('sheet-certification-badge');
  badge.textContent = s.available ? 'Verified' : 'Unavailable';
  badge.className = s.available
    ? 'rounded-full bg-brand-yellow/10 px-2 py-0.5 text-[10px] font-bold text-brand-yellow'
    : 'rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400';

  selectDuration(1.0);
  $('station-bottom-sheet').classList.remove('translate-y-full');
  $('route-sheet').classList.add('translate-y-full');
  refreshIcons();
}

function closeStationSheet() {
  $('station-bottom-sheet').classList.add('translate-y-full');
}

function selectDuration(hours) {
  APP.selectedDuration = hours;
  document.querySelectorAll('.dur-btn').forEach((btn) => btn.classList.remove('is-active'));
  $(`dur-${hours}`)?.classList.add('is-active');
  computeBooking();
}

function computeBooking() {
  const s = APP.selectedStation;
  if (!s) return;
  const hours = APP.selectedDuration || 1.0;
  const effKw = Math.min(s.kw, APP.vehicle.maxKw || 6.6);
  const energy = effKw * hours * 0.9;
  const total = energy * s.rate;

  if ($('calc-kwh')) $('calc-kwh').textContent = energy.toFixed(1);
  if ($('calc-range')) $('calc-range').textContent = `+${Math.round(energy * 6.5)} km`;
  if ($('calc-total-cost')) $('calc-total-cost').textContent = money(total);
  if ($('book-action-text')) $('book-action-text').textContent = `Book slot · ${s.host.split(' ')[0]}'s ${s.kw} kW`;

  APP.pendingBooking = { hours, energy, total, effKw };
}

function initiateBooking() {
  const s = APP.selectedStation;
  const booking = APP.pendingBooking;
  if (!s || !booking) return;
  if (!s.available) return toast('This charger is currently offline.');

  createSession({
    station: s,
    duration: booking.hours,
    energy: booking.energy,
    total: booking.total,
    effKw: booking.effKw,
    fromJourney: false,
  });

  closeStationSheet();
  openActiveSession();
  requestHostReservation(s);
  toast('Reservation requested — the host has 60 seconds to accept.');
}

function requestHostReservation(station) {
  if (!APP.host.online) {
    APP.host.incoming = null;
    return;
  }
  const session = APP.session;
  APP.host.incoming = {
    driver: APP.user.name || 'Salman Zaidi',
    car: `${APP.vehicle.brand || 'BYD'} ${APP.vehicle.model || 'Atto 3'}`,
    duration: session ? session.duration : 1.5,
    total: session ? session.total : 742,
    energy: session ? session.energy : 16.5,
    sessionId: session ? session.id : null,
    accepted: false,
  };
  if (APP.view === 'host') setTimeout(showIncomingModal, 220);
}

/* ----------------------------- active session --------------------------- */

function createSession({ station, duration, energy, total, effKw, fromJourney }) {
  const id = 'ses-' + Math.random().toString(36).slice(2, 8);
  APP.session = {
    id,
    stationId: station.id,
    host: station.host,
    address: station.address,
    rate: station.rate,
    kw: effKw || station.kw,
    duration,
    energy,
    total,
    otp: String(Math.floor(1000 + Math.random() * 9000)),
    status: 'reserved',
    startedAt: null,
    endsAt: null,
    energyUsed: 0,
    fare: 0,
    remaining: duration * 3600,
    paid: false,
    driverRated: false,
    hostRated: false,
    fromJourney,
    journeyIndex: APP.journey ? APP.journey.index : null,
  };
  updateTopPill();
  renderHost();
  return APP.session;
}

function openActiveSession() {
  const s = APP.session;
  if (!s) return;
  renderSession();
  $('active-session-sheet').classList.remove('translate-y-full');
  refreshIcons();
}

function dismissSessionSheet() {
  $('active-session-sheet').classList.add('translate-y-full');
}

function reopenActiveSession() {
  if (APP.session) {
    openActiveSession();
  } else if (APP.route) {
    renderRouteSheet();
    $('route-sheet').classList.remove('translate-y-full');
  }
}

function renderSession() {
  const s = APP.session;
  if (!s) return;

  if ($('active-host-name')) $('active-host-name').textContent = s.host;
  if ($('active-host-address')) $('active-host-address').textContent = s.address;
  if ($('active-kw-badge')) $('active-kw-badge').textContent = `${Math.round(s.kw)}kW`;
  if ($('active-otp')) $('active-otp').textContent = s.otp;

  const labels = { reserved: 'Slot confirmed', charging: 'Charging live', completed: 'Session complete' };
  if ($('session-top-label')) $('session-top-label').textContent = labels[s.status] || 'Session';

  const badge = $('session-status-badge');
  if (badge) {
    badge.textContent = s.status === 'reserved' ? 'Reserved' : s.status === 'charging' ? 'Charging' : 'Complete';
    badge.className = s.status === 'charging' ? 'badge is-live' : 'badge';
  }

  const energy = s.status === 'charging' ? s.energyUsed : s.status === 'completed' ? s.energy : 0;
  const fare = s.status === 'charging' ? s.fare : s.status === 'completed' ? s.total : 0;

  if ($('live-meter-kw')) $('live-meter-kw').textContent = `${s.kw.toFixed(1)} kW`;
  if ($('live-meter-kwh')) $('live-meter-kwh').textContent = `${energy.toFixed(1)} kWh`;
  if ($('live-meter-fare')) $('live-meter-fare').textContent = money(fare);
  if ($('session-timer')) {
    $('session-timer').textContent = s.status === 'charging'
      ? formatClock(s.remaining)
      : s.status === 'completed' ? '00:00' : formatClock(s.duration * 3600);
  }

  const btn = $('btn-toggle-charge');
  const txt = $('btn-toggle-charge-text');
  if (btn && txt) {
    btn.classList.toggle('is-charging', s.status === 'charging');
    if (s.status === 'reserved') {
      txt.textContent = 'Start charging';
      btn.className = 'mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-xs font-extrabold text-black transition btn-press hover:brightness-110';
    } else if (s.status === 'charging') {
      txt.textContent = 'End charging';
      btn.className = 'mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3 text-xs font-extrabold text-white transition btn-press hover:brightness-110 is-charging';
    } else {
      txt.textContent = s.paid ? 'Paid' : 'Pay now';
      btn.className = 'mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-yellow py-3 text-xs font-extrabold text-black transition btn-press hover:bg-brand-yellowHover';
    }
  }

  updateTopPill();
  refreshIcons();
}

function toggleChargingState() {
  const s = APP.session;
  if (!s) return;
  if (s.status === 'reserved') startSession();
  else if (s.status === 'charging') completeSession();
  else if (s.status === 'completed' && !s.paid) openPaymentModal();
}

function startSession() {
  const s = APP.session;
  if (!s) return;
  s.status = 'charging';
  s.startedAt = Date.now();
  s.endsAt = s.startedAt + s.duration * 3600 * 1000;
  s.remaining = s.duration * 3600;
  if (APP.host.incoming) {
    APP.host.incoming.accepted = true;
    hideIncomingModal();
  }
  clearInterval(APP.sessionTimer);
  APP.sessionTimer = setInterval(tickSession, 1000);
  renderSession();
  renderHost();
  toast('Charging started — timer running on both apps.');
}

function tickSession() {
  const s = APP.session;
  if (!s || s.status !== 'charging') return;

  const elapsed = (Date.now() - s.startedAt) / 1000;
  const planned = s.duration * 3600;
  s.remaining = Math.max(0, planned - elapsed);
  s.energyUsed = Math.min(s.energy, (s.kw * elapsed) / 3600);
  s.fare = s.energyUsed * s.rate;

  if ($('live-meter-kwh')) $('live-meter-kwh').textContent = `${s.energyUsed.toFixed(1)} kWh`;
  if ($('live-meter-fare')) $('live-meter-fare').textContent = money(s.fare);
  if ($('session-timer')) $('session-timer').textContent = formatClock(s.remaining);

  if ($('host-session-timer')) $('host-session-timer').textContent = formatClock(s.remaining);
  if ($('host-live-kwh')) $('host-live-kwh').textContent = `${s.energyUsed.toFixed(1)} kWh`;
  if ($('host-live-fare')) $('host-live-fare').textContent = money(s.fare);

  if (s.remaining <= 0) completeSession();
}

function completeSession() {
  const s = APP.session;
  if (!s) return;
  clearInterval(APP.sessionTimer);
  APP.sessionTimer = null;
  s.status = 'completed';
  s.remaining = 0;
  s.energyUsed = s.energy;
  s.fare = s.total;
  if (APP.host.incoming) {
    APP.host.incoming.accepted = true;
    hideIncomingModal();
  }
  renderSession();
  renderHost();
  updateTopPill();
  if (APP.view === 'driver') {
    setTimeout(openPaymentModal, 260);
  } else {
    toast('Charging complete. Waiting for the driver to pay.');
  }
}

function cancelActiveSession() {
  const s = APP.session;
  if (!s) return;
  if (s.status === 'charging') clearInterval(APP.sessionTimer);
  APP.sessionTimer = null;
  APP.session = null;
  if (APP.host.incoming) APP.host.incoming = null;
  hideIncomingModal();
  dismissSessionSheet();
  updateTopPill();
  renderHost();
  toast('Reservation cancelled.');
}

function updateTopPill() {
  const pill = $('top-reservation-pill');
  if (!pill) return;
  const label = pill.querySelector('span');

  if (APP.session && !APP.session.paid) {
    pill.classList.remove('hidden');
    pill.classList.add('inline-flex');
    if (label) label.textContent = APP.session.status === 'charging' ? 'Live session' : 'Active session';
  } else if (APP.route) {
    pill.classList.remove('hidden');
    pill.classList.add('inline-flex');
    if (label) label.textContent = 'Charging route';
  } else {
    pill.classList.add('hidden');
    pill.classList.remove('inline-flex');
  }
}

/* ---------------------------- charging route ---------------------------- */

function resolveDestination(raw) {
  const custom = APP.customDestination;
  const lower = raw.toLowerCase();
  if (custom && custom.name.toLowerCase() === lower) {
    return { name: custom.name, lat: custom.lat, lng: custom.lng };
  }

  const names = Object.keys(DESTINATIONS);
  const exact = names.find((n) => n.toLowerCase() === lower);
  const partial = names.find((n) => n.toLowerCase().includes(lower) || lower.includes(n.toLowerCase()));
  const name = exact || partial || 'Lahore Fort';
  return { name, ...DESTINATIONS[name] };
}

function removePickMarker() {
  if (APP.map.pickMarker) {
    APP.map.driver?.removeLayer(APP.map.pickMarker);
    APP.map.pickMarker = null;
  }
  if (APP.map.pickHandler) {
    APP.map.driver?.off('click', APP.map.pickHandler);
    APP.map.pickHandler = null;
  }
  if (APP.map.driver) APP.map.driver.getContainer().style.cursor = '';
}

function clearPickMarker() {
  removePickMarker();
  APP.customDestination = null;
}

function setRouteMode(on) {
  const travel = $('travel-panel');
  const quick = $('quick-panel');
  const search = $('station-search-input')?.closest('div.flex');
  const chips = $('filter-all')?.parentElement;

  if (on) {
    travel?.classList.add('hidden');
    quick?.classList.add('hidden');
    search?.classList.add('hidden');
    chips?.classList.add('hidden');
  } else {
    search?.classList.remove('hidden');
    chips?.classList.remove('hidden');
    setDriverMode(APP.driverMode);
  }
}

function editRoute() {
  if (APP.journey) return toast('End the journey before editing the route.');
  APP.route = null;
  APP.routePickStop = null;
  APP.map.routeLayer?.clearLayers();
  removePickMarker();
  closeRouteSheet();
  setRouteMode(false);
  if ($('route-helper-text')) $('route-helper-text').classList.add('hidden');
  updateTopPill();
  toast('Route cleared. Adjust your trip and plan again.');
}

function enableMapRoutePick() {
  const map = APP.map.driver;
  const input = $('route-destination-input');
  if (!map) {
    toast('Open the driver map first.');
    return;
  }

  if (APP.map.pickHandler) map.off('click', APP.map.pickHandler);

  toast('Tap anywhere on the map to set your destination.');
  map.getContainer().style.cursor = 'crosshair';

  APP.map.pickHandler = (e) => {
    const { lat, lng } = e.latlng;
    map.getContainer().style.cursor = '';
    map.off('click', APP.map.pickHandler);
    APP.map.pickHandler = null;

    let name = 'Dropped pin';
    let best = Infinity;
    Object.entries(DESTINATIONS).forEach(([label, coords]) => {
      const km = haversine({ lat, lng }, coords);
      if (km < best) {
        best = km;
        name = label;
      }
    });

    const customName = `Dropped pin near ${name}`;
    APP.customDestination = { name: customName, lat, lng };
    if (input) input.value = customName;

    if (APP.map.pickMarker) map.removeLayer(APP.map.pickMarker);
    APP.map.pickMarker = L.marker([lat, lng]).addTo(map);
    toast('Destination set. Tap “Make charging route”.');
  };

  map.on('click', APP.map.pickHandler);
}

function planChargingRoute() {
  const raw = ($('route-destination-input').value || '').trim();
  if (!raw) return toast('Enter a destination to plan your route.');

  const dest = resolveDestination(raw);
  if (APP.customDestination && dest.name !== APP.customDestination.name) clearPickMarker();
  const start = USER_LOCATION;
  const distance = haversine(start, dest);
  const current = Number($('trip-current-charge').value);
  const target = Number($('trip-target-charge').value);

  if (target <= current) {
    toast('Target charge must be higher than current charge.');
    return;
  }

  const battery = APP.vehicle.battery || 50;
  const totalEnergy = Math.max(6, battery * (target - current) / 100);
  const stopCount = distance < 8 ? 1 : 2;
  const energyEach = totalEnergy / stopCount;

  const used = new Set();
  const stops = [];
  let previous = { lat: start.lat, lng: start.lng };

  for (let i = 0; i < stopCount; i++) {
    const f = (i + 1) / (stopCount + 1);
    const ideal = {
      lat: start.lat + (dest.lat - start.lat) * f,
      lng: start.lng + (dest.lng - start.lng) * f,
    };

    let candidates = compatibleStations().filter((s) => s.available && !used.has(s.id))
      .map((s) => ({ s, km: haversine(ideal, s) }))
      .sort((a, b) => a.km - b.km);

    if (!candidates.length) {
      candidates = compatibleStations().filter((s) => !used.has(s.id))
        .map((s) => ({ s, km: haversine(ideal, s) }))
        .sort((a, b) => a.km - b.km);
    }
    if (!candidates.length) break;

    const station = candidates[0].s;
    used.add(station.id);
    const legKm = haversine(previous, station);
    const energy = Math.max(3, energyEach);
    stops.push({
      stationId: station.id,
      energy,
      cost: energy * station.rate,
      legKm,
      ideal,
    });
    previous = { lat: station.lat, lng: station.lng };
  }

  if (!stops.length) return toast('No chargers available along this route.');

  APP.route = {
    destName: dest.name,
    dest: { lat: dest.lat, lng: dest.lng },
    start: { lat: start.lat, lng: start.lng },
    distance,
    current,
    target,
    stops,
    totalCost: 0,
  };
  recomputeRouteStops();
  APP.routePickStop = null;
  removePickMarker();

  if ($('route-destination-input')) $('route-destination-input').value = dest.name;
  if ($('route-helper-text')) {
    $('route-helper-text').classList.remove('hidden');
    $('route-helper-text').textContent = `${stops.length} charging stop${stops.length > 1 ? 's' : ''} · ${Math.round(totalEnergy)} kWh needed · ${Math.round(distance)} km trip`;
  }

  setRouteMode(true);
  drawRoute();
  renderRouteSheet();
  $('route-sheet').classList.remove('translate-y-full');
  $('station-bottom-sheet').classList.add('translate-y-full');
  toast('Optimal charging route ready.');
}

function drawRoute() {
  const route = APP.route;
  const map = APP.map.driver;
  if (!route || !map || !APP.map.routeLayer) return;

  const layer = APP.map.routeLayer;
  layer.clearLayers();

  const points = [
    [route.start.lat, route.start.lng],
    ...route.stops.map((s) => {
      const st = stationById(s.stationId);
      return [st.lat, st.lng];
    }),
    [route.dest.lat, route.dest.lng],
  ];

  L.polyline(points, { color: '#0B0D11', weight: 9, opacity: 0.55 }).addTo(layer);
  L.polyline(points, { color: '#FFD54A', weight: 4, opacity: 0.95, dashArray: '10 8' }).addTo(layer);

  route.stops.forEach((stop, i) => {
    const st = stationById(stop.stationId);
    L.circleMarker([st.lat, st.lng], {
      radius: 10, color: '#FF7A45', weight: 3, fillColor: '#FF7A45', fillOpacity: 0.25,
    }).addTo(layer).bindTooltip(`Stop ${i + 1}`, { permanent: false });
  });

  const destIcon = L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:#FF7A45;color:#fff;border-radius:12px;padding:5px 9px;font:700 10px 'Space Grotesk',sans-serif;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.5)">${route.destName}</div>
      <div style="width:8px;height:8px;background:#FF7A45;transform:rotate(45deg);margin-top:-4px"></div>
    </div>`,
    iconSize: [140, 38],
    iconAnchor: [70, 34],
  });
  L.marker([route.dest.lat, route.dest.lng], { icon: destIcon }).addTo(layer);

  const bounds = L.latLngBounds(points);
  const size = map.getSize();
  map.fitBounds(bounds, {
    paddingTopLeft: [34, 96],
    paddingBottomRight: [34, Math.round(size.y * 0.56)],
  });
}

function renderRouteSheet() {
  const route = APP.route;
  if (!route) return;

  if ($('route-sheet-title')) {
    $('route-sheet-title').textContent = `${route.stops.length} stop${route.stops.length > 1 ? 's' : ''} · ${route.destName}`;
  }
  if ($('route-total')) $('route-total').textContent = money(route.totalCost);

  const wrap = $('route-stops');
  if (!wrap) return;

  const cards = route.stops.map((stop, i) => {
    const st = stationById(stop.stationId);
    const isPicking = APP.routePickStop === i;
    let alternatives = '';

    if (isPicking) {
      const alts = compatibleStations().filter((s) => s.available && s.id !== stop.stationId)
        .map((s) => ({ s, km: haversine(stop.ideal, s) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 4);

      alternatives = `
        <div class="mt-2.5 rounded-xl border border-brand-yellow/25 bg-brand-yellow/5 p-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-black uppercase tracking-wider text-brand-yellow">Swap stop ${i + 1}</span>
            <button onclick="cancelRoutePick()" class="text-[9px] font-bold text-slate-400 hover:text-white">Cancel</button>
          </div>
          <p class="mt-1 text-[9px] text-slate-500">Tap a charger pin on the map, or pick one below.</p>
          <div class="mt-2 space-y-1.5">
            ${alts.map(({ s, km }) => `
              <button onclick="useRouteAlternative(${i}, '${s.id}')" class="flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/25 px-2.5 py-2 text-left transition hover:border-brand-yellow/40">
                <span class="min-w-0">
                  <span class="block truncate text-[10.5px] font-bold text-white">${s.host} · ${s.kw} kW</span>
                  <span class="block text-[9px] text-slate-500">${distanceLabel(km)} off route · ${s.connector}</span>
                </span>
                <span class="shrink-0 font-mono text-[10px] font-bold text-brand-yellow">₨${s.rate}</span>
              </button>`).join('')}
          </div>
        </div>`;
    }

    return `
      <div class="rounded-xl border ${isPicking ? 'border-brand-yellow/50 bg-brand-yellow/5' : 'border-white/5 bg-[#14171F]'} p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[9px] font-black uppercase tracking-wider text-brand-yellow">Stop ${i + 1}</span>
          <span class="font-mono text-[12px] font-bold text-brand-orange">${money(stop.cost)}</span>
        </div>
        <div class="mt-1 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate text-[11.5px] font-bold text-white">${st.host} · ${st.kw} kW</div>
            <div class="text-[9.5px] text-slate-500">${distanceLabel(stop.legKm)} leg · ${stop.energy.toFixed(1)} kWh · ₨${st.rate}/kWh</div>
          </div>
          <button onclick="pickRouteStop(${i})" class="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-bold text-slate-300 transition hover:border-brand-yellow/40 hover:text-white">Change</button>
        </div>
        ${alternatives}
      </div>`;
  }).join('');

  wrap.innerHTML = cards;
  refreshIcons();
}

function closeRouteSheet() {
  $('route-sheet').classList.add('translate-y-full');
  updateTopPill();
}

function pickRouteStop(index) {
  APP.routePickStop = index;
  renderRouteSheet();
  $('route-sheet').classList.remove('translate-y-full');
  toast(`Choose a replacement for stop ${index + 1}.`);
}

function cancelRoutePick() {
  APP.routePickStop = null;
  renderRouteSheet();
}

function useRouteAlternative(index, stationId) {
  swapRouteStop(index, stationId);
  APP.routePickStop = null;
}

function recomputeRouteStops() {
  const route = APP.route;
  if (!route) return;
  let previous = { lat: route.start.lat, lng: route.start.lng };
  route.stops.forEach((stop) => {
    const st = stationById(stop.stationId);
    if (!st) return;
    stop.legKm = haversine(previous, st);
    stop.cost = stop.energy * st.rate;
    previous = { lat: st.lat, lng: st.lng };
  });
  route.totalCost = route.stops.reduce((sum, s) => sum + s.cost, 0);
}

function swapRouteStop(index, stationId) {
  const route = APP.route;
  if (!route || !route.stops[index]) return;
  const station = stationById(stationId);
  if (!station) return;

  route.stops[index].stationId = stationId;
  recomputeRouteStops();

  drawRoute();
  renderRouteSheet();
  $('route-sheet').classList.remove('translate-y-full');
  toast(`Stop ${index + 1} changed to ${station.host.split(' ')[0]}'s ${station.kw} kW charger.`);
}

/* -------------------------------- journey ------------------------------- */

function startJourney() {
  const route = APP.route;
  if (!route) return;

  APP.journey = {
    stops: route.stops.map((s) => ({ ...s, reserved: true })),
    index: 0,
    active: true,
    arrived: false,
    destName: route.destName,
  };

  closeRouteSheet();
  renderJourney();
  const first = stationById(APP.journey.stops[0].stationId);
  if (first) requestHostReservation(first);
  toast('Journey started — charging slots reserved ahead of arrival.');
  updateTopPill();
}

function renderJourney() {
  const j = APP.journey;
  if (!j) return;
  const hud = $('journey-hud');
  if (!hud) return;
  hud.classList.remove('hidden');

  const stop = j.stops[j.index];
  if (!stop) return;
  const station = stationById(stop.stationId);
  const eta = Math.max(2, Math.round(stop.legKm / 35 * 60));
  const sessionHere = APP.session && APP.session.fromJourney && APP.session.journeyIndex === j.index;

  if ($('journey-status')) $('journey-status').textContent = sessionHere ? 'Arrived' : 'En route';
  if ($('journey-step-label')) $('journey-step-label').textContent = `Next stop ${j.index + 1} of ${j.stops.length}`;
  if ($('journey-next-name')) $('journey-next-name').textContent = `${station.host} · ${station.kw} kW`;
  if ($('journey-next-meta')) {
    $('journey-next-meta').textContent = `${distanceLabel(stop.legKm)} · ${sessionHere ? 'slot reserved' : 'reserved'} · ₨${station.rate}/kWh`;
  }
  if ($('journey-eta')) $('journey-eta').textContent = sessionHere ? 'Here' : `${eta} min`;
  if ($('journey-progress')) $('journey-progress').style.width = `${Math.round((j.index / j.stops.length) * 100)}%`;
  if ($('journey-action-text')) {
    $('journey-action-text').textContent = sessionHere ? 'Open charging session' : 'Simulate arrival';
  }
}

function journeyAction() {
  const j = APP.journey;
  if (!j) return;
  if (APP.session && APP.session.fromJourney && APP.session.journeyIndex === j.index) {
    openActiveSession();
    return;
  }
  arriveAtStop();
}

function arriveAtStop() {
  const j = APP.journey;
  if (!j) return;
  const stop = j.stops[j.index];
  const station = stationById(stop.stationId);
  if (!station) return;

  const effKw = Math.min(station.kw, APP.vehicle.maxKw || 6.6);
  const duration = Math.max(0.5, round1(stop.energy / effKw));

  createSession({
    station,
    duration,
    energy: stop.energy,
    total: stop.cost,
    effKw,
    fromJourney: true,
  });

  j.arrived = true;
  renderJourney();
  openActiveSession();
  requestHostReservation(station);
  toast('You’ve arrived. Show your OTP, then start charging.');
}

function advanceJourney() {
  const j = APP.journey;
  APP.session = null;
  dismissSessionSheet();

  if (!j) {
    updateTopPill();
    return;
  }

  j.arrived = false;
  j.index += 1;

  if (j.index >= j.stops.length) {
    APP.journey = null;
    APP.route = null;
    APP.routePickStop = null;
    APP.map.routeLayer?.clearLayers();
    $('journey-hud')?.classList.add('hidden');
    if ($('route-helper-text')) $('route-helper-text').classList.add('hidden');
    setRouteMode(false);
    clearPickMarker();
    updateTopPill();
    toast('Journey complete. All charging stops paid.', 3400);
    return;
  }

  renderJourney();
  updateTopPill();
  toast(`Next stop: ${stationById(j.stops[j.index].stationId).host}.`);
}

function cancelJourney() {
  if (APP.session && APP.session.fromJourney) {
    clearInterval(APP.sessionTimer);
    APP.sessionTimer = null;
    APP.session = null;
    dismissSessionSheet();
  }
  APP.journey = null;
  APP.route = null;
  APP.routePickStop = null;
  APP.map.routeLayer?.clearLayers();
  $('journey-hud')?.classList.add('hidden');
  if ($('route-helper-text')) $('route-helper-text').classList.add('hidden');
  setRouteMode(false);
  clearPickMarker();
  updateTopPill();
  renderHost();
  toast('Route ended.');
}

/* --------------------------- payment and ratings ------------------------ */

function openPaymentModal() {
  const s = APP.session;
  if (!s) return;
  const lines = $('payment-lines');
  if (lines) {
    lines.innerHTML = `
      <div class="flex items-center justify-between"><span class="text-slate-400">Energy delivered</span><span class="font-bold text-white">${s.energy.toFixed(1)} kWh</span></div>
      <div class="flex items-center justify-between"><span class="text-slate-400">Host rate</span><span class="font-bold text-white">₨${s.rate} / kWh</span></div>
      <div class="flex items-center justify-between border-t border-white/5 pt-2"><span class="text-slate-400">Subtotal</span><span class="font-bold text-white">${money(s.total)}</span></div>
      <div class="flex items-center justify-between"><span class="text-slate-400">Platform commission (10%)</span><span class="font-bold text-brand-green">₨0 <span class="text-[9px] font-semibold text-slate-500">waived</span></span></div>
      <div class="flex items-center justify-between border-t border-white/5 pt-2"><span class="font-bold text-white">Total</span><span class="font-mono text-base font-black text-brand-yellow">${money(s.total)}</span></div>
      <p class="text-[9.5px] leading-relaxed text-slate-500">A 10% commission will apply to completed charges after the pilot. Hosts currently keep 100%.</p>`;
  }
  $('payment-modal').classList.remove('hidden');
  $('payment-modal').classList.add('flex');
  refreshIcons();
}

function paySession() {
  const s = APP.session;
  if (!s) return;

  s.paid = true;
  s.driverName = APP.user.name || 'Salman Zaidi';
  s.car = `${APP.vehicle.brand || 'BYD'} ${APP.vehicle.model || 'Atto 3'}`;

  APP.host.earnedToday += s.total;
  APP.host.earnedMonth += s.total;
  APP.host.energyMonth += s.energy;
  APP.host.sessionsMonth += 1;
  if (!APP.host.pendingRatings) APP.host.pendingRatings = [];
  APP.host.pendingRatings.unshift({
    driverName: s.driverName,
    car: s.car,
    total: s.total,
    energy: s.energy,
    host: s.host,
    paidAt: Date.now(),
  });
  APP.host.recent.unshift({
    driver: s.driverName,
    car: s.car,
    energy: s.energy,
    amount: s.total,
    when: 'Just now',
  });

  $('payment-modal').classList.add('hidden');
  $('payment-modal').classList.remove('flex');
  APP.host.incoming = null;
  hideIncomingModal();
  updateTopPill();
  renderHost();
  openRating('host');
  toast('Payment sent to the host.');
}

function openRating(target, queueIndex = null) {
  APP.ratingTarget = target;
  APP.ratingQueueIndex = queueIndex;
  APP.ratingValue = 0;

  const title = $('rating-title');
  const sub = $('rating-sub');
  if (target === 'host') {
    if (title) title.textContent = 'Rate your host';
    if (sub) sub.textContent = 'How was the handoff, the charger and the host?';
  } else {
    if (title) title.textContent = 'Rate your driver';
    if (sub) sub.textContent = 'How was the arrival and the charging session?';
  }

  const stars = $('rating-stars');
  if (stars) {
    stars.innerHTML = [1, 2, 3, 4, 5].map((n) =>
      `<button onclick="setRating(${n})" aria-label="${n} stars" class="star-btn"><i data-lucide="star" class="h-8 w-8 fill-current"></i></button>`
    ).join('');
  }

  $('rating-modal').classList.remove('hidden');
  $('rating-modal').classList.add('flex');
  refreshIcons();
}

function setRating(n) {
  APP.ratingValue = n;
  document.querySelectorAll('#rating-stars .star-btn').forEach((btn, i) => {
    btn.classList.toggle('is-on', i < n);
  });
}

function hideRating() {
  $('rating-modal').classList.add('hidden');
  $('rating-modal').classList.remove('flex');
}

function submitRating() {
  if (!APP.ratingValue) return toast('Tap a star to submit your rating.');

  if (APP.ratingTarget === 'host') {
    const s = APP.session;
    if (s) s.driverRated = true;
    const fromJourney = !!(s && s.fromJourney);
    hideRating();
    dismissSessionSheet();
    if (fromJourney) {
      advanceJourney();
    } else {
      APP.session = null;
      updateTopPill();
      renderHost();
      toast('Thanks for charging with ChargeKaro.');
    }
  } else {
    if (APP.ratingQueueIndex !== null && APP.host.pendingRatings) {
      APP.host.pendingRatings.splice(APP.ratingQueueIndex, 1);
    }
    hideRating();
    renderHost();
    toast('Driver rated. Session closed.');
  }
}

/* ------------------------------- host view ------------------------------ */

function renderHost() {
  if (APP.host.verification !== 'verified') return;
  const wrap = $('host-view');
  if (!wrap) return;

  if (!APP.host.pendingRatings) APP.host.pendingRatings = [];

  const tab = APP.host.tab;
  document.querySelectorAll('#host-nav .nav-item').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.hostView === tab);
  });

  if (tab === 'dashboard') {
    wrap.innerHTML = hostDashboardHTML();
  } else if (tab === 'roi') {
    wrap.innerHTML = `
      <div class="pb-2 pt-2">
        <p class="text-[10px] font-bold uppercase tracking-[.14em] text-brand-orange">Host tools</p>
        <h2 class="mt-0.5 font-display text-xl font-bold text-white">Return on investment.</h2>
      </div>
      <div id="host-roi-body" class="mt-3"></div>`;
    renderRoi('host');
  } else if (tab === 'market') {
    wrap.innerHTML = `
      <div class="pb-2 pt-2">
        <p class="text-[10px] font-bold uppercase tracking-[.14em] text-brand-orange">Partner marketplace</p>
        <h2 class="mt-0.5 font-display text-xl font-bold text-white">Add another charger.</h2>
      </div>
      <div id="host-market-body" class="mt-3"></div>`;
    renderMarket('host');
  } else {
    wrap.innerHTML = hostSettingsHTML();
  }

  refreshIcons();
  updateTopPill();
}

function hostDashboardHTML() {
  const h = APP.host;
  const rate = hostRate();
  const firstName = (APP.user.name || 'Host').split(' ')[0];
  const online = h.online;

  const statusCard = `
    <div class="mt-3 rounded-2xl border border-white/5 bg-[#10131A] p-4">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-[11px] font-extrabold ${online ? 'text-brand-green' : 'text-slate-400'}">
            <span class="h-1.5 w-1.5 rounded-full ${online ? 'bg-brand-green live-dot' : 'bg-slate-500'}"></span>
            ${online ? 'Accepting bookings' : 'Offline'}
          </div>
          <div class="mt-1 text-[10px] leading-relaxed text-slate-500">${online ? 'Your charger is visible on the driver map.' : 'Your listing is hidden from the map.'}</div>
        </div>
        <button onclick="toggleHostLiveStatus()" aria-label="Toggle online status" class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${online ? 'bg-brand-green' : 'bg-white/15'}">
          <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${online ? 'translate-x-5' : 'translate-x-1'}"></span>
        </button>
      </div>
    </div>`;

  const metrics = `
    <div class="mt-2.5 grid grid-cols-2 gap-2">
      <div class="rounded-2xl border border-white/5 bg-[#10131A] p-3">
        <div class="text-[9px] font-bold uppercase tracking-wide text-slate-500">Today</div>
        <div class="mt-1 font-display text-[17px] font-bold text-brand-yellow">${money(h.earnedToday)}</div>
      </div>
      <div class="rounded-2xl border border-white/5 bg-[#10131A] p-3">
        <div class="text-[9px] font-bold uppercase tracking-wide text-slate-500">This month</div>
        <div class="mt-1 font-display text-[17px] font-bold text-brand-yellow">${money(h.earnedMonth)}</div>
      </div>
      <div class="rounded-2xl border border-white/5 bg-[#10131A] p-3">
        <div class="text-[9px] font-bold uppercase tracking-wide text-slate-500">Energy sold</div>
        <div class="mt-1 font-display text-[17px] font-bold text-brand-orange">${h.energyMonth.toFixed(1)} <span class="text-[9px] font-normal text-slate-500">kWh</span></div>
      </div>
      <div class="rounded-2xl border border-white/5 bg-[#10131A] p-3">
        <div class="text-[9px] font-bold uppercase tracking-wide text-slate-500">Sessions</div>
        <div class="mt-1 font-display text-[17px] font-bold text-white">${h.sessionsMonth}</div>
      </div>
    </div>`;

  const rateCard = `
    <div class="mt-2.5 rounded-2xl border border-white/5 bg-[#10131A] p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[9px] font-bold uppercase tracking-[.14em] text-slate-500">Fixed rate</div>
          <div class="mt-1 font-display text-2xl font-bold text-brand-yellow">₨${rate}<span class="text-[10px] font-normal text-slate-500"> / kWh</span></div>
        </div>
        <span class="rounded-lg bg-brand-orange/10 px-2 py-1 text-[9px] font-bold text-brand-orange">${h.charger.kw} kW</span>
      </div>
      <div class="mt-2 text-[10px] leading-relaxed text-slate-500">Set by charger class · ${h.charger.connectors.join(' · ')}</div>
      <div class="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2.5 text-[10px]">
        <span class="text-slate-500">Available window</span>
        <span class="font-bold text-white">${timeLabel(h.charger.from)} – ${timeLabel(h.charger.to)}</span>
      </div>
      <div class="mt-1.5 flex items-center justify-between text-[10px]">
        <span class="text-slate-500">Location</span>
        <span class="max-w-[58%] truncate text-right font-bold text-white">${h.location.street || h.location.city || 'Not set'}</span>
      </div>
    </div>`;

  const recent = h.recent.slice(0, 3).map((r) => `
    <div class="flex items-center justify-between gap-2 border-t border-white/5 py-2 first:border-0 first:pt-0">
      <div class="flex min-w-0 items-center gap-2">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-yellow to-brand-orange text-[9px] font-black text-black">${r.driver.split(' ').map((w) => w[0]).join('')}</span>
        <span class="min-w-0">
          <span class="block truncate text-[10.5px] font-bold text-white">${r.driver}</span>
          <span class="block text-[9px] text-slate-500">${r.car} · ${r.energy.toFixed(1)} kWh</span>
        </span>
      </div>
      <div class="shrink-0 text-right">
        <div class="font-mono text-[11px] font-bold text-brand-yellow">${money(r.amount)}</div>
        <div class="text-[8.5px] text-slate-600">${r.when}</div>
      </div>
    </div>`).join('');

  const payoutLabel = h.payout.method === 'bank' ? 'Bank transfer' : h.payout.method === 'easypaisa' ? 'Easypaisa' : 'JazzCash';

  return `
    <div class="flex items-start justify-between gap-2 pb-1 pt-2">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-[.14em] text-brand-orange">Host dashboard</p>
        <h2 class="mt-0.5 font-display text-xl font-bold text-white">Hi ${firstName}.</h2>
      </div>
      <span class="rounded-full bg-brand-green/10 px-2 py-1 text-[9px] font-bold text-brand-green">Verified host</span>
    </div>
    ${statusCard}
    ${metrics}
    ${hostSessionCard()}
    ${hostIncomingCard()}
    ${hostRatingQueueHTML()}
    ${rateCard}
    <div class="mt-2.5 rounded-2xl border border-white/5 bg-[#10131A] p-4">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recent bookings</span>
        <span class="text-[9px] font-semibold text-brand-green">Paid</span>
      </div>
      ${recent || '<p class="text-[10px] text-slate-500">No bookings yet.</p>'}
    </div>
    <div class="mt-2.5 rounded-2xl border border-white/5 bg-[#10131A] p-4">
      <div class="flex items-center justify-between text-[10px]">
        <span class="text-slate-500">Payout method</span>
        <span class="font-bold text-white">${payoutLabel}</span>
      </div>
      <div class="mt-1.5 flex items-center justify-between text-[10px]">
        <span class="text-slate-500">Account</span>
        <span class="font-mono text-[9.5px] font-bold text-white">${h.payout.number || 'Not set'}</span>
      </div>
    </div>
    <div class="h-2"></div>`;
}

function hostSessionCard() {
  const s = APP.session;
  if (!s) return '';
  const energy = s.status === 'charging' ? s.energyUsed : s.status === 'completed' ? s.energy : 0;
  const fare = s.status === 'charging' ? s.fare : s.status === 'completed' ? s.total : 0;

  let action = '';
  if (s.status === 'reserved') {
    action = `<button onclick="startSession()" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-2.5 text-[11px] font-extrabold text-black transition btn-press">Start charging</button>`;
  } else if (s.status === 'charging') {
    action = `<button onclick="completeSession()" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-2.5 text-[11px] font-extrabold text-white transition btn-press">End session</button>`;
  } else if (!s.paid) {
    action = `<div class="mt-3 rounded-xl bg-white/5 py-2.5 text-center text-[10px] font-bold text-slate-400">Waiting for driver payment</div>`;
  } else {
    action = `<button onclick="openRating('driver')" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-yellow py-2.5 text-[11px] font-extrabold text-black transition btn-press">Rate driver</button>`;
  }

  return `
    <div class="mt-2.5 rounded-2xl border border-brand-orange/25 bg-brand-orange/5 p-4">
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-brand-orange">
          <span class="h-1.5 w-1.5 rounded-full bg-brand-orange live-dot"></span> ${s.status === 'charging' ? 'Charging now' : s.status === 'completed' ? 'Session complete' : 'Reserved'}
        </span>
        <span class="rounded-lg bg-black/30 px-2 py-1 font-mono text-[10px] font-bold text-brand-yellow" id="host-session-timer">${s.status === 'charging' ? formatClock(s.remaining) : s.status === 'completed' ? '00:00' : formatClock(s.duration * 3600)}</span>
      </div>
      <div class="mt-2 text-[12px] font-bold text-white">${s.driverName || APP.user.name || 'Driver'} · ${s.kw.toFixed(1)} kW</div>
      <div class="mt-0.5 text-[9.5px] text-slate-500">${s.address} · ₨${s.rate}/kWh</div>
      <div class="mt-2.5 grid grid-cols-2 gap-2 text-center">
        <div class="rounded-lg bg-black/30 py-2"><div class="text-[8.5px] uppercase tracking-wide text-slate-500">Energy</div><div class="mt-0.5 font-display text-[12px] font-bold text-brand-yellow" id="host-live-kwh">${energy.toFixed(1)} kWh</div></div>
        <div class="rounded-lg bg-black/30 py-2"><div class="text-[8.5px] uppercase tracking-wide text-slate-500">Fare</div><div class="mt-0.5 font-display text-[12px] font-bold text-brand-orange" id="host-live-fare">${money(fare)}</div></div>
      </div>
      ${action}
    </div>`;
}

function hostIncomingCard() {
  const inc = APP.host.incoming;
  if (!inc || inc.accepted) return '';
  return `
    <div class="mt-2.5 rounded-2xl border border-brand-yellow/40 bg-brand-yellow/5 p-4">
      <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-brand-yellow">
        <span class="h-1.5 w-1.5 rounded-full bg-brand-yellow live-dot"></span> Incoming request
      </div>
      <div class="mt-2 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="truncate text-[11.5px] font-bold text-white">${inc.driver}</div>
          <div class="text-[9.5px] text-slate-500">${inc.car} · ${inc.duration} hr</div>
        </div>
        <div class="text-right">
          <div class="font-mono text-[12px] font-bold text-brand-yellow">${money(inc.total)}</div>
          <div class="text-[9px] text-slate-500">~${inc.energy.toFixed(1)} kWh</div>
        </div>
      </div>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <button onclick="declineIncomingRequest()" class="rounded-xl bg-white/5 py-2 text-[10px] font-bold text-slate-300">Decline</button>
        <button onclick="acceptIncomingRequest()" class="rounded-xl bg-brand-yellow py-2 text-[10px] font-black text-black">Accept</button>
      </div>
    </div>`;
}

function hostRatingQueueHTML() {
  const queue = APP.host.pendingRatings || [];
  if (!queue.length) return '';
  return `
    <div class="mt-2.5 rounded-2xl border border-brand-yellow/20 bg-brand-yellow/5 p-4">
      <div class="text-[10px] font-black uppercase tracking-wider text-brand-yellow">Payment received</div>
      ${queue.map((r, i) => `
        <div class="mt-2 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate text-[11px] font-bold text-white">${r.driverName}</div>
            <div class="text-[9.5px] text-slate-500">${money(r.total)} · ${r.energy.toFixed(1)} kWh</div>
          </div>
          <button onclick="openRating('driver', ${i})" class="shrink-0 rounded-lg bg-brand-yellow px-2.5 py-1.5 text-[9px] font-extrabold text-black">Rate driver</button>
        </div>`).join('')}
    </div>`;
}

function hostSettingsHTML() {
  const h = APP.host;
  const payoutOptions = [
    ['bank', 'Bank transfer'],
    ['easypaisa', 'Easypaisa'],
    ['jazzcash', 'JazzCash'],
  ].map(([v, l]) => `<option value="${v}" ${h.payout.method === v ? 'selected' : ''}>${l}</option>`).join('');

  return `
    <div class="pb-2 pt-2">
      <p class="text-[10px] font-bold uppercase tracking-[.14em] text-brand-orange">Settings</p>
      <h2 class="mt-0.5 font-display text-xl font-bold text-white">Account &amp; charger.</h2>
    </div>
    <div class="mt-3 space-y-3">
      <div class="rounded-2xl border border-white/5 bg-[#10131A] p-4">
        <div class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Profile</div>
        <div class="mt-3 space-y-2.5">
          <label class="block"><span class="field-label">Full name</span><input id="set-name" class="input-dark orange-focus" value="${APP.user.name || ''}"></label>
          <label class="block"><span class="field-label">Mobile number</span><input id="set-mobile" class="input-dark orange-focus" value="${APP.user.mobile || ''}"></label>
          <label class="block"><span class="field-label">Email address</span><input id="set-email" class="input-dark orange-focus" value="${APP.user.email || ''}"></label>
        </div>
      </div>

      <div class="rounded-2xl border border-white/5 bg-[#10131A] p-4">
        <div class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Payout</div>
        <div class="mt-3 space-y-2.5">
          <label class="block"><span class="field-label">Method</span>
            <select id="set-payout-method" class="input-dark orange-focus">${payoutOptions}</select>
          </label>
          <label class="block"><span class="field-label">Account title</span><input id="set-payout-title" class="input-dark orange-focus" value="${h.payout.title || ''}"></label>
          <label class="block"><span class="field-label">Account number</span><input id="set-payout-number" class="input-dark orange-focus" value="${h.payout.number || ''}"></label>
        </div>
      </div>

      <div class="rounded-2xl border border-white/5 bg-[#10131A] p-4">
        <div class="flex items-center justify-between">
          <div class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Charger</div>
          <span class="rounded-lg bg-brand-orange/10 px-2 py-1 text-[9px] font-bold text-brand-orange">${h.charger.kw} kW</span>
        </div>
        <div class="mt-2 flex items-center justify-between text-[10px]">
          <span class="text-slate-500">Fixed rate</span>
          <span class="font-bold text-brand-yellow">₨${hostRate()} / kWh</span>
        </div>
        <div class="mt-1 flex items-center justify-between text-[10px]">
          <span class="text-slate-500">Connectors</span>
          <span class="font-bold text-white">${h.charger.connectors.join(', ')}</span>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <label class="block"><span class="field-label">Available from</span><input id="set-from" type="time" value="${h.charger.from}" class="input-dark orange-focus"></label>
          <label class="block"><span class="field-label">Closing time</span><input id="set-to" type="time" value="${h.charger.to}" class="input-dark orange-focus"></label>
        </div>
        <p class="mt-2 text-[9px] leading-relaxed text-slate-500">Rates are fixed by charger class and reviewed monthly. Contact support to change your charger class.</p>
      </div>

      <button onclick="saveSettings()" class="btn-primary w-full py-3.5 text-sm">Save changes</button>
      <button onclick="resetDemo()" class="w-full rounded-2xl border border-white/10 bg-[#14171F] py-3 text-[11px] font-bold text-slate-400 transition hover:text-white">Sign out &amp; restart demo</button>
      <div class="h-2"></div>
    </div>`;
}

function saveSettings() {
  APP.user.name = ($('set-name')?.value || '').trim();
  APP.user.mobile = ($('set-mobile')?.value || '').trim();
  APP.user.email = ($('set-email')?.value || '').trim();
  APP.host.payout = {
    method: $('set-payout-method')?.value || 'bank',
    title: ($('set-payout-title')?.value || '').trim(),
    number: ($('set-payout-number')?.value || '').trim(),
  };
  APP.host.charger.from = $('set-from')?.value || APP.host.charger.from;
  APP.host.charger.to = $('set-to')?.value || APP.host.charger.to;
  toast('Settings saved.');
  renderHost();
}

function setHostTab(tab) {
  APP.host.tab = tab;
  renderHost();
  const wrap = $('host-screen');
  if (wrap) wrap.scrollTop = 0;
}

function toggleHostLiveStatus() {
  APP.host.online = !APP.host.online;
  const pill = $('header-online-pill');
  if (pill) {
    pill.classList.toggle('is-online', APP.host.online);
    pill.classList.toggle('is-offline', !APP.host.online);
    if ($('header-online-text')) $('header-online-text').textContent = APP.host.online ? 'ONLINE' : 'OFFLINE';
  }
  renderHost();
  toast(APP.host.online ? 'You are online — accepting bookings.' : 'You are offline — listing hidden.');
}

function toggleSetupEditModal() {
  setHostTab('settings');
}

/* ---------------------------- incoming requests ------------------------- */

function triggerIncomingBookingSimulator() {
  if (APP.host.verification !== 'verified') {
    toast('Approve your charger to receive booking requests.');
    showScreen('screen-pending');
    return;
  }
  if (!APP.host.online) {
    toast('You are offline. Switch online to receive requests.');
    return;
  }

  const s = APP.session;
  APP.host.incoming = s
    ? {
        driver: s.driverName || APP.user.name || 'Salman Zaidi',
        car: s.car || `${APP.vehicle.brand} ${APP.vehicle.model}`,
        duration: s.duration,
        total: s.total,
        energy: s.energy,
        sessionId: s.id,
        accepted: false,
      }
    : {
        driver: 'Salman Zaidi',
        car: 'Audi e-tron 55',
        duration: 1.5,
        total: 742,
        energy: 16.5,
        sessionId: null,
        accepted: false,
      };

  if (APP.view !== 'host') switchView('host');
  setTimeout(showIncomingModal, 120);
}

function showIncomingModal() {
  const inc = APP.host.incoming;
  if (!inc) return;

  if ($('incoming-driver')) $('incoming-driver').textContent = inc.driver;
  if ($('incoming-car')) $('incoming-car').textContent = `${inc.car} · ${inc.duration} hr`;
  if ($('incoming-amount')) $('incoming-amount').textContent = money(inc.total);
  if ($('incoming-energy')) $('incoming-energy').textContent = `~${inc.energy.toFixed(1)} kWh`;
  if ($('incoming-note')) $('incoming-note').textContent = 'Driver is nearby and has reserved this slot. Accept to confirm the handoff.';

  const modal = $('incoming-request-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  clearInterval(APP.incomingTimer);
  let left = 30;
  if ($('incoming-timer')) $('incoming-timer').textContent = `${left}s`;
  APP.incomingTimer = setInterval(() => {
    left -= 1;
    if ($('incoming-timer')) $('incoming-timer').textContent = `${Math.max(0, left)}s`;
    if (left <= 0) {
      clearInterval(APP.incomingTimer);
      hideIncomingModal();
      toast('Request expired.');
    }
  }, 1000);
}

function hideIncomingModal() {
  clearInterval(APP.incomingTimer);
  APP.incomingTimer = null;
  $('incoming-request-modal')?.classList.add('hidden');
}

function acceptIncomingRequest() {
  if (APP.host.incoming) APP.host.incoming.accepted = true;
  hideIncomingModal();
  renderHost();
  toast('Request accepted — driver notified.');
}

function declineIncomingRequest() {
  APP.host.incoming = null;
  hideIncomingModal();
  if (APP.session && APP.session.status === 'reserved') {
    APP.session = null;
    dismissSessionSheet();
  }
  updateTopPill();
  renderHost();
  toast('Request declined.');
}

/* --------------------------------- init --------------------------------- */

function updateClock() {
  const el = $('phone-clock');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function initApp() {
  if (!APP.host.pendingRatings) APP.host.pendingRatings = [];
  wirePaymentMethods();
  updateClock();
  setInterval(updateClock, 30000);
  updateTopPill();
  refreshIcons();
  window.APP = APP;
}

initApp();
