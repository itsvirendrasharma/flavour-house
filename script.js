'use strict';
/* ==========================================================================
   FLAVOR HOUSE  –  Restaurant ordering, billing & management
   --------------------------------------------------------------------------
   index.html  → structure      style.css → design      script.js → ALL data + logic

   • Every dish, order, booking, customer, user and setting lives in the
     database object (DB) in this file. It is saved in the browser
     (localStorage) so nothing is lost on refresh.
   • Demo logins →  admin / admin123   and   staff / staff123
   ========================================================================== */

/* ---------- storage keys & constants ---------- */
const STORE_KEY = 'flavorhouse_db_v1';
const CART_KEY = 'flavorhouse_cart_v1';
const SESSION_KEY = 'flavorhouse_session_v1';

const ACTIVE = ['pending', 'preparing', 'ready'];
const STATUS_LABEL = { pending: 'Pending', preparing: 'Preparing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };
const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'completed' };
const NEXT_LABEL = { pending: 'Start cooking', preparing: 'Mark ready', ready: 'Complete' };
const TYPE_LABEL = { 'dine-in': 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };
const METHOD_LABEL = { cash: 'Cash', card: 'Card', upi: 'UPI' };
const CHART_COLORS = ['#D4A017', '#1C1C1C', '#28A745', '#DC3545', '#5B8DEF', '#9B59B6', '#E67E22', '#16A085'];

/* coupon codes (offer: "Get 15% OFF above ₹500" is configured in Settings) */
const COUPONS = {
    WELCOME10: { pct: 10, min: 200, text: '10% off on orders above ₹200' },
    FLAT50: { flat: 50, min: 400, text: '₹50 off on orders above ₹400' },
    FEAST20: { pct: 20, min: 1000, text: '20% off on orders above ₹1000' }
};

const DEFAULT_SETTINGS = {
    name: 'Flavor House',
    tagline: 'Delicious Food, Great Experience',
    address: '24 Treasure Lane, Vijay Nagar, Indore, Madhya Pradesh 452010',
    phone: '+91 98765 43210',
    email: 'hello@flavorhouse.in',
    gstin: '23ABCDE1234F1Z5',
    taxRate: 5,
    deliveryFee: 30,
    offerOn: true,
    offerMin: 500,
    offerPct: 15
};

/* name, price, category, veg?, emoji, description  (first 8 match the design mock-up) */
const SEED_DISHES = [
    ['Paneer Butter Masala', 220, 'Lunch', 1, '🍛', 'Soft paneer in a rich, creamy tomato gravy'],
    ['Veg Biryani', 180, 'Lunch', 1, '🍚', 'Fragrant basmati rice with vegetables and whole spices'],
    ['Chicken Tandoori', 280, 'Dinner', 0, '🍗', 'Clay-oven roasted chicken in yoghurt and spices'],
    ['Masala Dosa', 120, 'Breakfast', 1, '🌯', 'Crisp rice crepe with spiced potato filling'],
    ['Veg Burger', 150, 'Dinner', 1, '🍔', 'Crunchy veg patty, cheese, lettuce and house sauce'],
    ['Chocolate Brownie', 110, 'Desserts', 1, '🍫', 'Warm, fudgy brownie with chocolate sauce'],
    ['Fresh Lime Soda', 80, 'Drinks', 1, '🍋', 'Sweet, salted or mixed – chilled and fizzy'],
    ['Cold Coffee', 120, 'Drinks', 1, '🧋', 'Thick cold coffee blended with ice cream'],
    ['Idli Sambar', 80, 'Breakfast', 1, '🥣', 'Four steamed idlis with sambar and chutneys'],
    ['Indori Poha Jalebi', 70, 'Breakfast', 1, '🥘', 'Indore’s favourite morning plate with sev and jalebi'],
    ['Aloo Paratha', 90, 'Breakfast', 1, '🫓', 'Stuffed flatbread with butter, curd and pickle'],
    ['Veg Sandwich', 100, 'Breakfast', 1, '🥪', 'Grilled sandwich with veggies and mint chutney'],
    ['Masala Omelette', 90, 'Breakfast', 0, '🍳', 'Three-egg omelette with onion, chilli and coriander'],
    ['Dal Tadka', 150, 'Lunch', 1, '🍲', 'Yellow lentils tempered with garlic and ghee'],
    ['Chole Bhature', 140, 'Lunch', 1, '🥙', 'Spicy chickpeas with two fluffy bhature'],
    ['Veg Thali', 220, 'Lunch', 1, '🍽️', 'Dal, two sabzis, rice, roti, salad, papad and sweet'],
    ['Butter Naan', 45, 'Lunch', 1, '🫓', 'Soft tandoor-baked naan brushed with butter'],
    ['Chicken Biryani', 260, 'Lunch', 0, '🍛', 'Dum-cooked biryani with tender chicken and raita'],
    ['Paneer Tikka', 240, 'Dinner', 1, '🍢', 'Charred paneer cubes with capsicum and onion'],
    ['Butter Chicken', 320, 'Dinner', 0, '🥘', 'Tandoori chicken in a smooth buttery tomato sauce'],
    ['Veg Pizza', 260, 'Dinner', 1, '🍕', 'Thin crust with mozzarella, peppers, olives and corn'],
    ['Pasta Alfredo', 230, 'Dinner', 1, '🍝', 'Penne in white garlic cream sauce'],
    ['Hakka Noodles', 170, 'Dinner', 1, '🍜', 'Wok-tossed noodles with crunchy vegetables'],
    ['Veg Manchurian', 160, 'Dinner', 1, '🥡', 'Crispy veg balls in a tangy Indo-Chinese gravy'],
    ['Masala Chai', 40, 'Drinks', 1, '☕', 'Ginger-cardamom tea brewed with fresh milk'],
    ['Mango Lassi', 110, 'Drinks', 1, '🥭', 'Thick yoghurt blended with Alphonso mango'],
    ['Sweet Lassi', 90, 'Drinks', 1, '🥛', 'Chilled, creamy and topped with malai'],
    ['Fresh Orange Juice', 100, 'Drinks', 1, '🍹', 'Freshly pressed, no added sugar'],
    ['Gulab Jamun', 80, 'Desserts', 1, '🍡', 'Two warm jamuns in saffron syrup'],
    ['Rasmalai', 120, 'Desserts', 1, '🍮', 'Soft paneer discs in chilled cardamom milk'],
    ['Ice Cream Sundae', 130, 'Desserts', 1, '🍨', 'Vanilla, chocolate sauce, nuts and a cherry'],
    ['Cheesecake', 160, 'Desserts', 1, '🍰', 'Baked New York style with berry compote'],
    ['Kulfi Falooda', 100, 'Desserts', 1, '🍧', 'Pistachio kulfi with falooda and rose syrup']
];

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => ymd(new Date());
const round2 = n => Math.round(n * 100) / 100;
const digits = s => String(s || '').replace(/\D/g, '');
const uid = p => p + Math.random().toString(36).slice(2, 9);
const money = n => {
    n = round2(+n || 0);
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
};
const short = n => n >= 100000 ? (n / 100000).toFixed(1).replace('.0', '') + 'L' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(Math.round(n));
const fmtDT = iso => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
const fmtD = s => new Date(s + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
const fmtT = hhmm => { const [h, m] = hhmm.split(':').map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };
const minutesOf = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const orderDay = o => ymd(new Date(o.createdAt));
const timeAgo = iso => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.floor(m / 60) + ' h ago' : Math.floor(m / 1440) + ' d ago';
};
const SLOTS = (() => { const a = []; for (let h = 11; h <= 22; h++) { a.push(`${pad(h)}:00`); if (h < 22) a.push(`${pad(h)}:30`); } return a; })();

function mulberry32(a) {
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/* ---------- icons (inline SVG, stroke style) ---------- */
const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    menu: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    orders: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    reports: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    burger: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    rupee: '<path d="M6 3h12M6 8h12M6 13h4a4 4 0 0 0 0-8M6 13l8 8"/>',
    pot: '<path d="M4 11h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 11h20M8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/>',
    eyeEmpty: '<circle cx="12" cy="12" r="10"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-15.5-6.2L3 8"/><path d="M3 3v5h5M3 12a9 9 0 0 0 15.5 6.2L21 16"/><path d="M16 16h5v5"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'
};
const ic = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const LOGO = (size = 40, draw = false) => `
<svg class="logo-svg ${draw ? 'draw' : ''}" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" aria-hidden="true">
  <circle cx="24" cy="24" r="21.5" stroke="#D4A017" stroke-width="2.5" pathLength="1"/>
  <g transform="translate(11 11) scale(1.08)" stroke="#D4A017" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path pathLength="1" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path pathLength="1" d="M7 2v20"/><path pathLength="1" d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
  </g>
</svg>`;
const BRAND = (size = 40) => `${LOGO(size)}<span class="brand-text"><b>${esc(DB.settings.name.split(' ')[0])}</b><small>${esc(DB.settings.name.split(' ').slice(1).join(' ') || '')}</small></span>`;

/* ==========================================================================
   DATABASE  (seed data + persistence)
   ========================================================================== */
let DB;
let storageWarned = false;

function seedDB() {
    const rnd = mulberry32(2026);
    const settings = { ...DEFAULT_SETTINGS };
    const dishes = SEED_DISHES.map((d, i) => ({
        id: 'd' + (i + 1), name: d[0], price: d[1], cat: d[2], veg: !!d[3], emoji: d[4], desc: d[5], img: '', available: true
    }));
    const tables = [2, 2, 4, 4, 4, 4, 6, 6, 8, 10].map((s, i) => ({ id: 't' + (i + 1), name: 'T' + (i + 1), seats: s }));
    const people = [
        ['Aarav Sharma', '9876501234'], ['Priya Verma', '9822012345'], ['Rohan Mehta', '9926123456'],
        ['Sneha Patel', '9893234567'], ['Vikram Singh', '9425345678'], ['Ananya Gupta', '9755456789'],
        ['Karan Joshi', '9300567890'], ['Neha Agarwal', '9981678901'], ['Aditya Rao', '9770789012'],
        ['Meera Iyer', '9406890123'], ['Rahul Khanna', '9827901234'], ['Pooja Mishra', '9039012345']
    ];
    const customers = people.map((p, i) => ({
        id: 'c' + (i + 1), name: p[0], phone: p[1],
        email: p[0].split(' ')[0].toLowerCase() + '@example.com',
        createdAt: new Date(Date.now() - (40 - i * 3) * 864e5).toISOString()
    }));

    const db = {
        version: 2, seq: 1000, settings,
        users: [
            { id: 'u1', username: 'admin', name: 'Admin', password: 'admin123', role: 'admin' },
            { id: 'u2', username: 'staff', name: 'Rahul', password: 'staff123', role: 'staff' }
        ],
        categories: ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts'],
        dishes, tables, customers, bookings: [], orders: []
    };

    /* ---- sample orders for the last 14 days so reports are not empty ---- */
    const now = new Date();
    const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const times = [];
    for (let off = 13; off >= 0; off--) {
        const count = off === 0 ? 9 : 6 + Math.floor(rnd() * 9);
        for (let k = 0; k < count; k++) {
            if (off === 0) times.push(new Date(sod.getTime() + rnd() * (now.getTime() - sod.getTime())));
            else times.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - off, 11 + Math.floor(rnd() * 11), Math.floor(rnd() * 60)));
        }
    }
    times.sort((a, b) => a - b);
    times.forEach(when => {
        const picked = new Map();
        const n = 1 + Math.floor(rnd() * 4);
        for (let i = 0; i < n; i++) {
            const d = dishes[Math.floor(Math.pow(rnd(), 1.5) * dishes.length)];
            picked.set(d.id, (picked.get(d.id) || 0) + 1 + Math.floor(rnd() * 2));
        }
        const items = [...picked].map(([id, qty]) => { const d = dishes.find(x => x.id === id); return { id, name: d.name, price: d.price, qty, cat: d.cat, veg: d.veg }; });
        const r = rnd();
        const type = r < .55 ? 'dine-in' : r < .8 ? 'takeaway' : 'delivery';
        const cust = rnd() < .65 ? customers[Math.floor(rnd() * customers.length)] : null;
        const m = rnd();
        const method = m < .3 ? 'cash' : m < .55 ? 'card' : 'upi';
        const t = calcTotals(items, type, null, settings);
        const cancelled = ymd(when) !== ymd(now) && rnd() < .05;
        db.seq++;
        db.orders.push({
            id: 'FH-' + db.seq, no: db.seq, createdAt: when.toISOString(), items, type,
            tableId: type === 'dine-in' ? 't' + (1 + Math.floor(rnd() * 10)) : '',
            address: type === 'delivery' ? '12 Rajwada Road, Indore' : '',
            customerId: cust ? cust.id : '', customerName: cust ? cust.name : '', phone: cust ? cust.phone : '',
            note: '', ...t, method, tendered: 0, change: 0,
            ref: method === 'cash' ? '' : (method === 'upi' ? 'UPI' : 'CARD') + Math.floor(rnd() * 9e8 + 1e8),
            paymentStatus: cancelled ? 'refunded' : 'paid',
            status: cancelled ? 'cancelled' : 'completed',
            cashier: 'Admin'
        });
    });

    /* today's newest orders are still in the kitchen */
    const todays = db.orders.filter(o => ymd(new Date(o.createdAt)) === ymd(now));
    const live = ['ready', 'preparing', 'pending', 'pending'];
    const liveTables = ['t3', 't5', 't7', 't2'];
    todays.slice(-4).forEach((o, i) => {
        o.status = live[i];
        if (i < 3) {
            o.type = 'dine-in'; o.tableId = liveTables[i]; o.address = '';
            Object.assign(o, calcTotals(o.items, 'dine-in', null, settings));
        }
    });
    db.orders.reverse();     // newest first

    /* a few bookings */
    const day = k => ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + k));
    db.bookings = [
        { id: 'b1', name: 'Aarav Sharma', phone: '9876501234', date: day(0), time: '19:30', guests: 4, tableId: 't4', note: 'Birthday – needs a cake stand', status: 'confirmed' },
        { id: 'b2', name: 'Priya Verma', phone: '9822012345', date: day(0), time: '20:30', guests: 2, tableId: 't1', note: '', status: 'confirmed' },
        { id: 'b3', name: 'Rohan Mehta', phone: '9926123456', date: day(1), time: '13:00', guests: 6, tableId: 't7', note: 'Team lunch', status: 'confirmed' },
        { id: 'b4', name: 'Sneha Patel', phone: '9893234567', date: day(1), time: '20:00', guests: 4, tableId: 't5', note: '', status: 'confirmed' },
        { id: 'b5', name: 'Vikram Singh', phone: '9425345678', date: day(3), time: '19:00', guests: 8, tableId: 't9', note: 'Anniversary dinner', status: 'confirmed' },
        { id: 'b6', name: 'Meera Iyer', phone: '9406890123', date: day(-1), time: '20:00', guests: 2, tableId: 't2', note: '', status: 'completed' }
    ].map(b => ({ ...b, createdAt: new Date().toISOString() }));

    addDemoExtras(db);
    return db;
}

let lastRaw = '';
function loadDB() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.dishes) && Array.isArray(parsed.orders)) {
                DB = parsed;
                DB.settings = { ...DEFAULT_SETTINGS, ...DB.settings };
                const had = !!DB.demoV2;
                migrateDB(DB);
                DB.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                lastRaw = raw;
                if (!had) saveDB();
                return;
            }
        }
    } catch (e) { /* fall through to seed */ }
    DB = seedDB();
    saveDB();
}
function saveDB() {
    try { const raw = JSON.stringify(DB); localStorage.setItem(STORE_KEY, raw); lastRaw = raw; }
    catch (e) {
        if (!storageWarned) { storageWarned = true; toast('Could not save – browser storage is full or blocked', 'error'); }
    }
}
/* If another tab/window changed the saved data, load it. Returns true when DB was replaced. */
function syncDB() {
    let raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { return false; }
    if (!raw || raw === lastRaw) return false;
    try {
        const p = JSON.parse(raw);
        if (p && Array.isArray(p.dishes) && Array.isArray(p.orders)) {
            DB = p; DB.settings = { ...DEFAULT_SETTINGS, ...DB.settings };
            DB.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            lastRaw = raw; return true;
        }
    } catch (e) { /* ignore */ }
    return false;
}


/* ==========================================================================
   DISH PHOTOS  (real, high-resolution photo for every dish, matched by name)
   --------------------------------------------------------------------------
   Each dish name is mapped to the Wikipedia/Wikimedia Commons article of that
   exact dish. The lead photo is requested at ~1600px width (Ultra-HD for a
   card), then cached in the saved DB so it loads instantly next time.
   Needs internet once. If a photo can't load, the emoji tile stays as backup.
   ========================================================================== */
const DISH_PHOTO_TITLE = {
    'Paneer Butter Masala': 'Paneer butter masala',
    'Veg Biryani': 'Vegetable biryani',
    'Chicken Tandoori': 'Tandoori chicken',
    'Masala Dosa': 'Masala dosa',
    'Veg Burger': 'Veggie burger',
    'Chocolate Brownie': 'Chocolate brownie',
    'Fresh Lime Soda': 'Nimbu pani',
    'Cold Coffee': 'Iced coffee',
    'Idli Sambar': 'Idli',
    'Indori Poha Jalebi': 'Poha',
    'Aloo Paratha': 'Paratha',
    'Veg Sandwich': 'Vegetable sandwich',
    'Masala Omelette': 'Omelette',
    'Dal Tadka': 'Dal',
    'Chole Bhature': 'Chole bhature',
    'Veg Thali': 'Thali',
    'Butter Naan': 'Naan',
    'Chicken Biryani': 'Biryani',
    'Paneer Tikka': 'Paneer tikka',
    'Butter Chicken': 'Butter chicken',
    'Veg Pizza': 'Pizza',
    'Pasta Alfredo': 'Fettuccine Alfredo',
    'Hakka Noodles': 'Hakka noodles',
    'Veg Manchurian': 'Manchurian (food)',
    'Masala Chai': 'Masala chai',
    'Mango Lassi': 'Lassi',
    'Sweet Lassi': 'Lassi',
    'Fresh Orange Juice': 'Orange juice',
    'Gulab Jamun': 'Gulab jamun',
    'Rasmalai': 'Ras malai',
    'Ice Cream Sundae': 'Sundae',
    'Cheesecake': 'Cheesecake',
    'Kulfi Falooda': 'Falooda'
};
const PHOTO_W = 1600;
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

async function wikiPhoto(params) {
    const q = new URLSearchParams({
        action: 'query', format: 'json', origin: '*', redirects: '1',
        prop: 'pageimages', piprop: 'thumbnail', pithumbsize: String(PHOTO_W), ...params
    });
    const r = await fetch(WIKI_API + '?' + q);
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    const pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    const hit = pages.find(p => p.thumbnail && p.thumbnail.source);
    return hit ? hit.thumbnail.source : '';
}
async function findDishPhoto(name) {
    const title = DISH_PHOTO_TITLE[name] || name;
    try {
        let url = await wikiPhoto({ titles: title });                          // exact dish article
        if (!url) url = await wikiPhoto({ generator: 'search', gsrsearch: title + ' food', gsrlimit: '3' }); // fallback search
        return url;
    } catch (e) { return ''; }
}
let photosBusy = false;
async function loadDishPhotos() {
    if (photosBusy || !navigator.onLine) return;
    photosBusy = true;
    const todo = DB.dishes.filter(d => !d.img);
    const cache = {};
    let changed = 0;
    for (let i = 0; i < todo.length; i += 6) {                                 // 6 at a time
        await Promise.all(todo.slice(i, i + 6).map(async d => {
            const key = DISH_PHOTO_TITLE[d.name] || d.name;
            if (!(key in cache)) cache[key] = findDishPhoto(d.name);
            const url = await cache[key];
            if (url) { d.img = url; changed++; }
        }));
        if (changed) { saveDB(); if (state.route === 'menu' && $('#dishGrid')) renderDishGrid(); if (!$('#custApp').classList.contains('hidden')) K.draw(); }
    }
    photosBusy = false;
}

/* ---------- runtime state (not saved) ---------- */
const state = {
    user: null, route: 'menu', cat: 'All', q: '', couponDraft: '',
    cart: { items: [], type: 'dine-in', coupon: null },
    co: null,
    ord: { status: 'all', type: 'all', range: 'today', q: '', limit: 40 },
    pay: { method: 'all', status: 'all', range: 'today', q: '', limit: 40 },
    rep: { range: '7' },
    bk: { tab: 'upcoming' },
    cu: { q: '' }
};

/* ==========================================================================
   BUSINESS LOGIC  –  billing, cart, tables, orders
   ========================================================================== */
const isAdmin = () => state.user && state.user.role === 'admin';
const dishById = id => DB.dishes.find(d => d.id === id);
const tableById = id => DB.tables.find(t => t.id === id);
const customerById = id => DB.customers.find(c => c.id === id);
const orderById = id => DB.orders.find(o => o.id === id);
const isRevenue = o => o.status !== 'cancelled' && o.paymentStatus === 'paid';

/* The one place where every bill is calculated */
function calcTotals(lines, type, couponCode, S) {
    S = S || DB.settings;
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

    let offer = 0;
    if (S.offerOn && subtotal > 0 && subtotal >= S.offerMin) offer = Math.round(subtotal * S.offerPct / 100);

    let coupon = 0;
    const c = couponCode && COUPONS[couponCode];
    if (c && subtotal >= c.min) coupon = Math.min(subtotal, c.pct ? Math.round(subtotal * c.pct / 100) : c.flat);

    let discount = 0, discountLabel = '';
    if (coupon > offer) { discount = coupon; discountLabel = 'Coupon ' + couponCode; }
    else if (offer > 0) { discount = offer; discountLabel = S.offerPct + '% offer'; }

    const delivery = type === 'delivery' && subtotal > 0 ? S.deliveryFee : 0;
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * S.taxRate) / 100;
    const exact = taxable + delivery + tax;
    const total = Math.round(exact);
    return { subtotal, discount, discountLabel, delivery, tax, roundOff: round2(total - exact), total };
}

/* ---------- cart ---------- */
function loadCart() {
    try {
        const c = JSON.parse(localStorage.getItem(CART_KEY) || 'null');
        if (c && Array.isArray(c.items)) state.cart = { items: c.items, type: c.type || 'dine-in', coupon: c.coupon || null };
    } catch (e) { /* ignore */ }
}
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) { /* ignore */ } }
const cartQty = id => (state.cart.items.find(i => i.id === id) || {}).qty || 0;
const cartCount = () => cartLines().reduce((s, l) => s + l.qty, 0);
function cartLines() {
    return state.cart.items.map(i => {
        const d = dishById(i.id);
        return d ? { id: d.id, name: d.name, price: d.price, qty: i.qty, cat: d.cat, veg: d.veg, available: d.available } : null;
    }).filter(Boolean);
}
function cartAdd(id) {
    const d = dishById(id);
    if (!d) return;
    if (!d.available) { toast(d.name + ' is sold out', 'error'); return; }
    const it = state.cart.items.find(i => i.id === id);
    if (it) it.qty = Math.min(20, it.qty + 1); else state.cart.items.push({ id, qty: 1 });
    cartChanged(true);
}
function cartSet(id, qty) {
    const it = state.cart.items.find(i => i.id === id);
    if (!it) return;
    if (qty <= 0) state.cart.items = state.cart.items.filter(i => i.id !== id);
    else it.qty = Math.min(20, qty);
    cartChanged();
}
function cartClear() { state.cart.items = []; state.cart.coupon = null; state.couponDraft = ''; cartChanged(); }
function cartChanged(bump) { saveCart(); updateCartUI(bump); }

function applyCoupon(code) {
    code = (code || '').trim().toUpperCase();
    if (!code) return toast('Enter a coupon code', 'error');
    const c = COUPONS[code];
    if (!c) return toast('That coupon code is not valid', 'error');
    const sub = cartLines().reduce((s, l) => s + l.price * l.qty, 0);
    if (sub < c.min) return toast(`Add ${money(c.min - sub)} more to use ${code}`, 'error');
    state.cart.coupon = code; state.couponDraft = '';
    cartChanged();
    toast(`${code} applied – ${c.text}`);
}

/* ---------- tables ---------- */
function tableStatus(t) {
    const live = DB.orders.find(o => o.type === 'dine-in' && o.tableId === t.id && ACTIVE.includes(o.status));
    if (live) return { s: 'occupied', order: live };
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    const b = DB.bookings.find(b => b.tableId === t.id && b.status === 'confirmed' && b.date === todayStr() &&
        (minutesOf(b.time) - nowMin) <= 60 && (minutesOf(b.time) - nowMin) >= -90);
    if (b) return { s: 'reserved', booking: b };
    return { s: 'free' };
}
function bookingConflict(tableId, date, time, ignoreId) {
    return DB.bookings.find(b => b.id !== ignoreId && b.tableId === tableId && b.date === date && b.status === 'confirmed' &&
        Math.abs(minutesOf(b.time) - minutesOf(time)) < 90);
}

/* ---------- customers ---------- */
function findOrCreateCustomer(name, phone) {
    name = (name || '').trim(); phone = digits(phone);
    let c = null;
    if (phone) c = DB.customers.find(x => digits(x.phone) === phone);
    if (!c && name && !phone) c = DB.customers.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!c && (name || phone)) {
        c = { id: uid('c'), name: name || 'Guest ' + phone.slice(-4), phone, email: '', createdAt: new Date().toISOString() };
        DB.customers.push(c);
    } else if (c && name && c.name.startsWith('Guest ')) c.name = name;
    return c;
}
function customerStats(c) {
    const mine = DB.orders.filter(o => o.customerId === c.id);
    const paid = mine.filter(isRevenue);
    return {
        orders: mine.length,
        spent: paid.reduce((s, o) => s + o.total, 0),
        last: mine.length ? mine[0].createdAt : null,
        list: mine
    };
}
const tierOf = spent => spent >= 5000 ? ['Gold', 'tier-gold'] : spent >= 2000 ? ['Silver', 'tier-silver'] : ['Regular', 'tier-reg'];

/* ---------- orders ---------- */
function createOrder(info) {
    syncDB();
    const lines = cartLines();
    const t = calcTotals(lines, state.cart.type, state.cart.coupon);
    const cust = findOrCreateCustomer(info.name, info.phone);
    DB.seq++;
    const order = {
        id: 'FH-' + DB.seq, no: DB.seq, createdAt: new Date().toISOString(),
        items: lines.map(l => ({ id: l.id, name: l.name, price: l.price, qty: l.qty, cat: l.cat, veg: l.veg })),
        type: state.cart.type,
        tableId: state.cart.type === 'dine-in' ? info.table : '',
        address: state.cart.type === 'delivery' ? info.address.trim() : '',
        customerId: cust ? cust.id : '', customerName: cust ? cust.name : (info.name || '').trim(), phone: digits(info.phone),
        note: (info.note || '').trim(),
        ...t,
        method: info.method, tendered: info.tendered || 0, change: info.change || 0, ref: info.ref || '',
        paymentStatus: 'paid', status: 'pending', cashier: state.user.name
    };
    DB.orders.unshift(order);
    saveDB();
    return order;
}
function setOrderStatus(id, status) {
    const o = orderById(id);
    if (!o) return;
    o.status = status;
    if (status === 'cancelled' && o.paymentStatus === 'paid') { o.paymentStatus = 'refunded'; o.refundedAt = new Date().toISOString(); }
    else if (status === 'cancelled' && o.paymentStatus === 'pending') o.paymentStatus = 'void';
    saveDB();
    updateBadges();
}

/* ---------- reporting helpers ---------- */
function ordersInRange(range) {
    if (range === 'all') return DB.orders;
    const days = range === 'today' ? 0 : (+range) - 1;
    const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - days);
    return DB.orders.filter(o => new Date(o.createdAt) >= from);
}
function sumOrders(list) {
    const v = list.filter(isRevenue);
    return {
        revenue: v.reduce((s, o) => s + o.total, 0),
        count: v.length,
        items: v.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0),
        tax: v.reduce((s, o) => s + o.tax, 0),
        discount: v.reduce((s, o) => s + o.discount, 0),
        list: v
    };
}
function topDishes(list, n) {
    const m = new Map();
    list.filter(o => o.status !== 'cancelled').forEach(o => o.items.forEach(i => {
        const e = m.get(i.id) || { id: i.id, name: i.name, qty: 0, revenue: 0, cat: i.cat };
        e.qty += i.qty; e.revenue += i.qty * i.price; m.set(i.id, e);
    }));
    return [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, n);
}
function revenueByDay(days) {
    const out = [];
    for (let k = days - 1; k >= 0; k--) {
        const d = new Date(); d.setDate(d.getDate() - k);
        const key = ymd(d);
        const v = DB.orders.filter(o => orderDay(o) === key && isRevenue(o)).reduce((s, o) => s + o.total, 0);
        out.push({ key, label: days <= 7 ? d.toLocaleDateString('en-IN', { weekday: 'short' }) : d.getDate() + ' ' + d.toLocaleDateString('en-IN', { month: 'short' }), value: v });
    }
    return out;
}
function revenueByHour() {
    const key = todayStr(), out = [];
    for (let h = 10; h <= 23; h++) {
        const v = DB.orders.filter(o => orderDay(o) === key && isRevenue(o) && new Date(o.createdAt).getHours() === h).reduce((s, o) => s + o.total, 0);
        out.push({ label: (h % 12 || 12) + (h < 12 ? 'a' : 'p'), value: v });
    }
    return out;
}

/* ---------- download helper ---------- */
function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ==========================================================================
   APP SHELL  –  toasts, modals, navigation, routing, login
   ========================================================================== */
function toast(msg, type = 'ok') {
    const root = $('#toasts');
    if (!root) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = `<span class="t-ic">${ic(type === 'error' ? 'x' : 'check', 15)}</span><p>${esc(msg)}</p>`;
    root.appendChild(t);
    while (root.children.length > 4) root.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3000);
}

function openModal({ title, body, size = '', cls = '' }) {
    const root = $('#modalRoot');
    root.innerHTML = `
    <div class="backdrop" data-action="backdrop">
      <div class="modal ${size} ${cls}" role="dialog" aria-modal="true">
        <div class="m-head"><h3>${title}</h3><button class="icon-btn dark" data-action="modal-close" aria-label="Close">${ic('x', 20)}</button></div>
        <div class="m-body">${body}</div>
      </div>
    </div>`;
    document.body.classList.add('modal-open');
    const f = $('#modalRoot [data-focus]');
    if (f) setTimeout(() => f.focus(), 60);
}
function closeModal() {
    $('#modalRoot').innerHTML = '';
    document.body.classList.remove('modal-open');
    confirmCb = null;
}
let confirmCb = null;
function askConfirm({ title = 'Are you sure?', msg, ok = 'Confirm', danger = false }, cb) {
    openModal({
        title: esc(title), size: 'sm',
        body: `<p class="confirm-msg">${msg}</p>
           <div class="m-foot"><button class="btn ghost" data-action="modal-close">Cancel</button>
           <button class="btn ${danger ? 'danger' : 'gold'}" data-action="confirm-yes">${esc(ok)}</button></div>`
    });
    confirmCb = cb;
}

/* ---------- navigation ---------- */
const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'menu', label: 'Menu', icon: 'menu' },
    { id: 'orders', label: 'Orders', icon: 'orders' },
    { id: 'bookings', label: 'Table Booking', icon: 'calendar' },
    { id: 'customers', label: 'Customers', icon: 'users' },
    { id: 'reports', label: 'Reports', icon: 'reports', admin: true },
    { id: 'payments', label: 'Payments', icon: 'payments' },
    { id: 'settings', label: 'Settings', icon: 'settings', admin: true }
];
const ROUTES = {
    dashboard: { render: viewDashboard },
    menu: { render: viewMenu },
    orders: { render: viewOrders },
    bookings: { render: viewBookings },
    customers: { render: viewCustomers },
    reports: { render: viewReports, admin: true },
    payments: { render: viewPayments },
    settings: { render: viewSettings, admin: true }
};

function renderNav() {
    const items = NAV.filter(n => !n.admin || isAdmin());
    $('#nav').innerHTML = items.map(n => `
    <a class="nav-item ${state.route === n.id ? 'active' : ''}" href="#/${n.id}" title="${n.label}">
      <span class="ni">${ic(n.icon, 20)}</span><span class="nl">${n.label}</span>
      ${n.id === 'orders' ? '<span class="nbadge" id="ordBadge"></span>' : ''}
    </a>`).join('') +
        `<button class="nav-item nav-mobile-only" data-action="toggle-theme" title="Theme"><span class="ni"><span data-theme-icon>${getTheme() === 'bw' ? '◑' : '◐'}</span></span><span class="nl">Theme</span></button>
    <button class="nav-item nav-mobile-only" data-action="change-pass" title="Change password"><span class="ni">${ic('lock', 20)}</span><span class="nl">Password</span></button>` +
        `<button class="nav-item" data-action="logout" title="Logout"><span class="ni">${ic('logout', 20)}</span><span class="nl">Logout</span></button>`;
    updateBadges();
}
function updateBadges() {
    const b = $('#ordBadge');
    if (!b) return;
    const n = DB.orders.filter(o => o.status === 'pending').length;
    b.textContent = n; b.style.display = n ? '' : 'none';
}
function renderOfferCard() {
    const S = DB.settings, el = $('#offerCard');
    el.style.display = S.offerOn ? '' : 'none';
    el.innerHTML = `<small>Today's Offer</small><b>Get ${S.offerPct}% OFF</b><span>on orders above ${money(S.offerMin)}</span><i class="offer-emoji">🍛</i>`;
}
function renderTopbar() {
    $('#topBrand').innerHTML = BRAND(40);
    const first = (state.user.name || state.user.username).split(' ')[0];
    $('#userHi').textContent = 'Hi, ' + first;
    $('#userAvatar').textContent = first.charAt(0).toUpperCase();
    $('#userDrop').innerHTML = `
    <div class="ud-head"><b>${esc(state.user.name)}</b><span class="role-badge ${state.user.role}">${state.user.role === 'admin' ? 'Admin' : 'Staff'}</span></div>
    <button data-action="change-pass">${ic('lock', 16)} Change password</button>
    <button data-action="logout">${ic('logout', 16)} Logout</button>`;
}

function currentRoute() {
    const r = (location.hash.replace(/^#\/?/, '') || 'menu').split('?')[0];
    return ROUTES[r] ? r : 'menu';
}
function renderRoute() {
    if (!state.user) return;
    let r = currentRoute();
    if (ROUTES[r].admin && !isAdmin()) {
        toast('That page is for admins only', 'error');
        location.hash = '#/menu';
        return;
    }
    state.route = r;
    document.body.dataset.route = r;
    closeSidebar();
    renderNav();
    ROUTES[r].render();
    updateCheckoutBar();
    $('#main').scrollTop = 0;
}
const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
function toggleSidebar() {
    if (isMobile()) document.body.classList.toggle('sb-open');
    else { $('#app').classList.toggle('collapsed'); try { localStorage.setItem('fh_collapsed', $('#app').classList.contains('collapsed') ? '1' : ''); } catch (e) { /* ignore */ } }
}
function closeSidebar() { document.body.classList.remove('sb-open'); }

/* ---------- cart UI refresh ---------- */
function updateCartUI(bump) {
    const n = cartCount();
    const b = $('#cartBadge');
    if (b) {
        b.textContent = n; b.classList.toggle('show', n > 0);
        if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    }
    if (state.route === 'menu' && $('#basket')) { renderBasket(); renderDishGrid(); }
    updateCheckoutBar();
}
function updateCheckoutBar() {
    const lines = cartLines();
    const t = calcTotals(lines, state.cart.type, state.cart.coupon);
    const bar = $('#checkoutBar');
    if (!bar) return;
    bar.classList.toggle('show', state.route === 'menu' && lines.length > 0);
    document.body.classList.toggle('has-cbar', isMobile() && state.route === 'menu' && lines.length > 0);
    $('#cbTotal').textContent = money(t.total);
}

/* ---------- login / logout ---------- */
function initLogin() {
    $('#loginLogo').innerHTML = LOGO(70, true);
    $('#lfEye').innerHTML = ic('eye', 18);
    const fl = $('#floaters');
    const foods = ['🍕', '🍔', '🍜', '🍰', '🥘', '🍹', '🍛', '🍗', '🍨', '🥪', '🍩', '🥭'];
    fl.innerHTML = Array.from({ length: 16 }, (_, i) => {
        const left = Math.round(Math.random() * 100), size = 22 + Math.round(Math.random() * 30);
        const dur = 14 + Math.round(Math.random() * 14), delay = -Math.round(Math.random() * dur);
        return `<span style="left:${left}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s">${foods[i % foods.length]}</span>`;
    }).join('');
}
function loginError(msg) {
    const e = $('#lfError');
    e.textContent = msg;
    const card = $('#loginCard');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
}
function doLogin() {
    const u = $('#lfUser').value.trim().toLowerCase(), p = $('#lfPass').value;
    $('#lfError').textContent = '';
    if (!u || !p) return loginError('Enter your username and password');
    const btn = $('#lfSubmit');
    btn.classList.add('loading'); btn.disabled = true;
    setTimeout(() => {
        btn.classList.remove('loading'); btn.disabled = false;
        syncDB();
        const user = DB.users.find(x => x.username.toLowerCase() === u && x.password === p);
        if (!user) return loginError('Incorrect username or password');
        if (user.role !== loginRole) return loginError(user.role === 'admin' ? 'This is an admin account – use the Admin tab' : 'This is a staff account – use the Staff tab');
        const remember = $('#lfRemember').checked;
        try {
            (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
            (remember ? sessionStorage : localStorage).removeItem(SESSION_KEY);
        } catch (e) { /* ignore */ }
        $('#login').classList.add('leaving');
        setTimeout(() => enterApp(user), 650);
    }, 800);
}
function enterApp(user, silent) {
    state.user = user;
    setScreen('staff');
    $('#login').classList.add('hidden');
    $('#login').classList.remove('leaving');
    const app = $('#app');
    app.classList.remove('hidden');
    app.classList.add('entering');
    setTimeout(() => app.classList.remove('entering'), 900);
    try { app.classList.toggle('collapsed', !!localStorage.getItem('fh_collapsed')); } catch (e) { /* ignore */ }
    renderTopbar();
    renderOfferCard();
    if (!location.hash) history.replaceState(null, '', '#/menu');
    renderRoute();
    updateCartUI();
    if (!silent) toast("Welcome back, " + user.name.split(" ")[0] + "!");
}
function logout() {
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    state.user = null;
    closeModal();
    $('#userMenu').classList.remove('open');
    $('#app').classList.add('hidden');
    const lg = $('#login');
    lg.classList.remove('hidden');
    lg.classList.add('entering');
    setTimeout(() => lg.classList.remove('entering'), 900);
    $('#lfPass').value = ''; $('#lfError').textContent = '';
    history.replaceState(null, '', location.pathname);
    setScreen('login'); BOT.close();
    setLoginRole(user_last_role());
}
const user_last_role = () => { try { return localStorage.getItem('fh_lastrole') || 'admin'; } catch (e) { return 'admin'; } };
function savedSessionUser() {
    try {
        const s = JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null');
        return s ? DB.users.find(u => u.id === s.id) : null;
    } catch (e) { return null; }
}

/* ==========================================================================
   MENU  +  BASKET  +  CHECKOUT  +  INVOICE
   ========================================================================== */
function viewMenu() {
    const admin = isAdmin();
    const tag = esc(DB.settings.tagline).replace(', ', ',<br>');
    $('#view').innerHTML = `
  <div class="menu-layout">
    <section class="menu-main">
      <div class="hero only-mobile">
        <h2>${tag}</h2>
        <button class="btn gold" data-action="book-table">Book a Table</button>
      </div>
      <label class="m-search only-mobile">
        <span data-ic="search" data-size="17">${ic('search', 17)}</span>
        <input data-input="search" type="search" placeholder="Search dishes..." value="${esc(state.q)}" autocomplete="off">
      </label>

      <div class="page-head">
        <h1>Menu</h1>
        ${admin ? `<div class="head-actions">
          <button class="btn gold sm" data-action="add-dish">${ic('plus', 15)} Add Item</button>
          <button class="btn outline sm" data-action="manage-cats">${ic('tag', 15)} Category</button></div>` : ''}
      </div>

      <div class="chips" id="chips"></div>
      <div class="popular only-mobile" id="popular"></div>
      <div class="dish-grid" id="dishGrid"></div>
      <div class="legend"><span><i class="dot veg"></i> Veg</span><span><i class="dot nonveg"></i> Non-Veg</span><span>Prices exclude GST – tax is added at billing</span></div>
    </section>
    <aside class="basket-panel" id="basket"></aside>
  </div>`;
    $('#globalSearch').value = state.q;
    renderChips(); renderDishGrid(); renderBasket();
}

function renderChips() {
    const el = $('#chips');
    if (!el) return;
    el.innerHTML = ['All', ...DB.categories].map(c =>
        `<button class="chip ${state.cat === c ? 'active' : ''}" data-action="cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
}

const catHue = cat => { const i = DB.categories.indexOf(cat); return [38, 20, 8, 168, 330, 262, 95][(i < 0 ? 0 : i) % 7]; };
function dishVisual(d) {
    return `<div class="tile" style="--h:${catHue(d.cat)}"><span class="plate"><span class="emo">${esc(d.emoji || '🍽️')}</span></span>${d.img ? `<img src="${esc(d.img)}" alt="${esc(d.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>`;
}
function dishCard(d) {
    const q = cartQty(d.id), admin = isAdmin();
    const control = q
        ? `<div class="mini-step"><button data-action="dec" data-id="${d.id}" aria-label="Remove one">${ic('minus', 14)}</button><b>${q}</b><button data-action="inc" data-id="${d.id}" aria-label="Add one">${ic('plus', 14)}</button></div>`
        : `<button class="add-btn" data-action="add" data-id="${d.id}" aria-label="Add ${esc(d.name)}" ${d.available ? '' : 'disabled'}>${ic('plus', 17)}</button>`;
    return `
  <article class="dish ${d.available ? '' : 'soldout'}">
    <div class="dish-img">
      ${dishVisual(d)}
      ${!d.available ? '<span class="so-tag">Sold out</span>' : ''}
      ${admin ? `<div class="dish-tools">
        <button data-action="toggle-dish" data-id="${d.id}" title="${d.available ? 'Mark sold out' : 'Mark available'}">${ic(d.available ? 'ban' : 'check', 14)}</button>
        <button data-action="edit-dish" data-id="${d.id}" title="Edit">${ic('edit', 14)}</button>
        <button data-action="del-dish" data-id="${d.id}" title="Delete">${ic('trash', 14)}</button></div>` : ''}
    </div>
    <div class="dish-body">
      <h3 title="${esc(d.desc || '')}">${esc(d.name)}</h3>
      <div class="dish-foot"><span class="price">${money(d.price)} <i class="dot ${d.veg ? 'veg' : 'nonveg'}" title="${d.veg ? 'Veg' : 'Non-veg'}"></i></span>${control}</div>
    </div>
  </article>`;
}
function renderDishGrid() {
    const grid = $('#dishGrid');
    if (!grid) return;
    const q = state.q.trim().toLowerCase();
    const list = DB.dishes.filter(d => (state.cat === 'All' || d.cat === state.cat) &&
        (!q || (d.name + ' ' + d.cat + ' ' + (d.desc || '')).toLowerCase().includes(q)));
    grid.innerHTML = list.length ? list.map(dishCard).join('') :
        `<div class="empty wide"><div class="e-ic">🍽️</div><h4>No dishes found</h4><p>Try another word or pick a different category.</p></div>`;

    const pop = $('#popular');
    if (pop) {
        const top = topDishes(DB.orders, 8).map(t => dishById(t.id)).filter(d => d && d.available).slice(0, 6);
        pop.innerHTML = q ? '' : `<div class="pop-head"><h3>Popular Dishes</h3><button class="link" data-action="cat" data-cat="All">View All</button></div>
      <div class="pop-row">${top.map(d => `
        <div class="pop-card"><div class="pop-img">${dishVisual(d)}</div><h4>${esc(d.name)}</h4>
        <div class="pop-foot"><b>${money(d.price)}</b><i class="dot ${d.veg ? 'veg' : 'nonveg'}"></i>
        <button class="add-btn sm" data-action="add" data-id="${d.id}" aria-label="Add">${ic('plus', 14)}</button></div></div>`).join('')}</div>`;
    }
}

/* ---------- basket ---------- */
function totalsHTML(t, opts = {}) {
    const S = DB.settings;
    return `<div class="totals">
    <div><span>Subtotal</span><b>${money(t.subtotal)}</b></div>
    ${t.discount ? `<div class="disc"><span>Discount (${esc(t.discountLabel)})</span><b>− ${money(t.discount)}</b></div>` : ''}
    ${state.cart.type === 'delivery' || t.delivery ? `<div><span>Delivery</span><b>${money(t.delivery)}</b></div>` : ''}
    <div><span>Tax (GST ${S.taxRate}%)</span><b>${money(t.tax)}</b></div>
    ${t.roundOff && opts.roundOff ? `<div><span>Round off</span><b>${t.roundOff > 0 ? '+' : '−'} ${money(Math.abs(t.roundOff))}</b></div>` : ''}
    <div class="grand"><span>Total</span><b>${money(t.total)}</b></div>
  </div>`;
}
function typeSeg(active) {
    return `<div class="seg" role="tablist">${Object.keys(TYPE_LABEL).map(k =>
        `<button type="button" class="${active === k ? 'active' : ''}" data-action="set-type" data-type="${k}">${TYPE_LABEL[k]}</button>`).join('')}</div>`;
}
function renderBasket() {
    const el = $('#basket');
    if (!el) return;
    const lines = cartLines(), c = state.cart, S = DB.settings;
    const t = calcTotals(lines, c.type, c.coupon);
    const sub = t.subtotal;
    const needMore = S.offerOn && sub > 0 && sub < S.offerMin ? S.offerMin - sub : 0;
    const couponBad = c.coupon && sub < COUPONS[c.coupon].min;

    el.innerHTML = `
  <div class="card basket">
    <div class="b-head"><h3>Basket <span class="count">${cartCount() || ''}</span></h3>${lines.length ? '<button class="link danger" data-action="clear-cart">Clear</button>' : ''}</div>
    ${typeSeg(c.type)}
    <div class="b-items">
      ${lines.length ? lines.map(l => `
        <div class="b-item">
          <div class="bi-name"><i class="dot ${l.veg ? 'veg' : 'nonveg'}"></i>${esc(l.name)}</div>
          <div class="bi-row">
            <span class="bi-price">${money(l.price)}</span>
            <div class="stepper"><button data-action="dec" data-id="${l.id}" aria-label="Decrease">${ic('minus', 14)}</button><b>${l.qty}</b><button data-action="inc" data-id="${l.id}" aria-label="Increase">${ic('plus', 14)}</button></div>
            <button class="del" data-action="rm" data-id="${l.id}" aria-label="Remove">${ic('trash', 16)}</button>
          </div>
        </div>`).join('') :
            `<div class="b-empty"><div>🛒</div><p>Your basket is empty</p><small>Tap + on a dish to add it</small></div>`}
    </div>
    ${needMore ? `<p class="nudge">Add ${money(needMore)} more to get ${S.offerPct}% off</p>` : ''}
    ${lines.length ? (c.coupon
            ? `<div class="coupon-on">${ic('tag', 15)}<span><b>${esc(c.coupon)}</b> ${couponBad ? '– add more items to use it' : 'applied'}</span><button data-action="remove-coupon" aria-label="Remove coupon">${ic('x', 14)}</button></div>`
            : `<div class="coupon"><input data-input="coupon" placeholder="Coupon code" value="${esc(state.couponDraft)}" autocomplete="off"><button class="btn dark sm" data-action="apply-coupon">Apply</button></div>`) : ''}
    ${lines.length ? totalsHTML(t) : ''}
    <button class="btn gold block lg pay-btn" data-action="checkout" ${lines.length ? '' : 'disabled'}>PAY ${money(t.total)}</button>
  </div>

  <div class="card quick">
    <h4>Quick Actions</h4>
    <div class="q-grid">
      <a href="#/orders">${ic('orders', 16)} Orders</a>
      <a href="#/bookings">${ic('calendar', 16)} Table Booking</a>
      ${isAdmin() ? `<a href="#/reports">${ic('reports', 16)} Reports</a>` : `<a href="#/customers">${ic('users', 16)} Customers</a>`}
      <a href="#/payments">${ic('payments', 16)} Payments</a>
    </div>
  </div>`;
}

/* ---------- checkout ---------- */
function freshCheckoutState() {
    return { name: '', phone: '', table: '', address: '', note: '', method: 'cash', tendered: '', upi: '', cardNo: '', cardName: '', exp: '', cvv: '' };
}
function openCheckout() {
    const lines = cartLines();
    if (!lines.length) return toast('Add some dishes to the basket first', 'error');
    const gone = lines.filter(l => !l.available);
    if (gone.length) return toast(gone[0].name + ' is sold out – please remove it', 'error');
    if (!state.co) state.co = freshCheckoutState();
    openModal({ title: 'Checkout', size: 'lg', body: checkoutHTML() });
}
function renderCheckout() {
    const body = $('#modalRoot .m-body');
    if (body && $('#coForm')) body.innerHTML = checkoutHTML();
}
function checkoutHTML() {
    const co = state.co, c = state.cart, lines = cartLines(), t = calcTotals(lines, c.type, c.coupon);
    const tables = DB.tables.map(tb => ({ tb, st: tableStatus(tb) }));
    return `
  <form id="coForm" data-form="checkout" novalidate>
    <div class="co-grid">
      <div class="co-col">
        <h4 class="sec">Order details</h4>
        ${typeSeg(c.type)}
        ${c.type === 'dine-in' ? `
          <div class="field"><label>Table</label>
            <select data-input="co" data-k="table">
              <option value="">Select a table</option>
              ${tables.map(({ tb, st }) => `<option value="${tb.id}" ${co.table === tb.id ? 'selected' : ''} ${st.s === 'occupied' ? 'disabled' : ''}>${tb.name} · ${tb.seats} seats${st.s === 'occupied' ? ' (occupied)' : st.s === 'reserved' ? ' (reserved soon)' : ''}</option>`).join('')}
            </select></div>` : ''}
        ${c.type === 'delivery' ? `
          <div class="field"><label>Delivery address</label>
            <textarea rows="2" data-input="co" data-k="address" placeholder="House no., street, area">${esc(co.address)}</textarea></div>` : ''}
        <div class="row">
          <div class="field"><label>Customer name${c.type === 'delivery' ? '' : ' <small>(optional)</small>'}</label>
            <input data-input="co" data-k="name" value="${esc(co.name)}" placeholder="Full name" autocomplete="off"></div>
          <div class="field"><label>Phone${c.type === 'delivery' ? '' : ' <small>(optional)</small>'}</label>
            <input data-input="co" data-k="phone" value="${esc(co.phone)}" inputmode="numeric" maxlength="10" placeholder="10-digit number" autocomplete="off"></div>
        </div>
        <div class="field"><label>Kitchen note <small>(optional)</small></label>
          <input data-input="co" data-k="note" value="${esc(co.note)}" placeholder="Less spicy, no onion…" autocomplete="off"></div>
      </div>

      <div class="co-col">
        <h4 class="sec">Bill summary</h4>
        <div class="co-lines">${lines.map(l => `<div><span>${esc(l.name)} <em>× ${l.qty}</em></span><b>${money(l.price * l.qty)}</b></div>`).join('')}</div>
        ${totalsHTML(t, { roundOff: true })}
        <h4 class="sec">Payment</h4>
        <div class="pay-tabs">${Object.keys(METHOD_LABEL).map(m =>
        `<button type="button" class="${co.method === m ? 'active' : ''}" data-action="pay-method" data-method="${m}">${METHOD_LABEL[m]}</button>`).join('')}</div>
        <div id="payPanel">${payPanelHTML(t)}</div>
      </div>
    </div>
    <div class="m-foot">
      <button type="button" class="btn ghost" data-action="modal-close">Cancel</button>
      <button type="submit" class="btn gold lg" id="payBtn"><span>Pay ${money(t.total)}</span><i class="spin"></i></button>
    </div>
  </form>`;
}
function payPanelHTML(t) {
    const co = state.co;
    if (co.method === 'cash') {
        const opts = [...new Set([t.total, Math.ceil(t.total / 100) * 100, Math.ceil(t.total / 500) * 500, Math.ceil(t.total / 1000) * 1000])].filter(v => v >= t.total).slice(0, 4);
        return `<div class="field"><label>Amount received</label>
        <input data-input="co" data-k="tendered" inputmode="decimal" value="${esc(co.tendered)}" placeholder="${t.total}" autocomplete="off"></div>
      <div class="quick-cash">${opts.map(v => `<button type="button" data-action="quick-cash" data-v="${v}">${v === t.total ? 'Exact' : money(v)}</button>`).join('')}</div>
      <div class="change-row"><span>Change to return</span><b id="changeOut">${changeText(t)}</b></div>`;
    }
    if (co.method === 'card') {
        return `<div class="field"><label>Card number</label><input data-input="co" data-k="cardNo" value="${esc(co.cardNo)}" inputmode="numeric" maxlength="19" placeholder="1234 5678 9012 3456" autocomplete="off"></div>
      <div class="field"><label>Name on card</label><input data-input="co" data-k="cardName" value="${esc(co.cardName)}" placeholder="As printed on the card" autocomplete="off"></div>
      <div class="row"><div class="field"><label>Expiry</label><input data-input="co" data-k="exp" value="${esc(co.exp)}" inputmode="numeric" maxlength="5" placeholder="MM/YY" autocomplete="off"></div>
      <div class="field"><label>CVV</label><input data-input="co" data-k="cvv" value="${esc(co.cvv)}" inputmode="numeric" maxlength="4" placeholder="•••" autocomplete="off"></div></div>
      <p class="hint">Demo payment – no real card is charged and card details are never stored.</p>`;
    }
    return `<div class="upi-box">${fakeQR('FH' + t.total + state.cart.items.length)}
      <div><p><b>Scan &amp; pay ${money(t.total)}</b></p><p class="hint">Scan with any UPI app, then confirm below. (Demo QR)</p></div></div>
    <div class="field"><label>Customer UPI ID</label><input data-input="co" data-k="upi" value="${esc(co.upi)}" placeholder="name@bank" autocomplete="off"></div>`;
}
function changeText(t) {
    const v = parseFloat(state.co.tendered);
    if (!state.co.tendered) return money(0);
    if (isNaN(v) || v < t.total) return 'Short by ' + money(t.total - (isNaN(v) ? 0 : v));
    return money(v - t.total);
}
function fakeQR(seed) {
    const n = 25, r = mulberry32([...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#111"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#111"/>`;
    let cells = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
        if (r() > .52) cells += `<rect x="${x}" y="${y}" width="1" height="1" fill="#111"/>`;
    }
    return `<svg class="qr" viewBox="-1 -1 ${n + 2} ${n + 2}" aria-hidden="true"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/>${cells}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
}

function submitCheckout() {
    const co = state.co, c = state.cart, lines = cartLines();
    if (!lines.length) return;
    const t = calcTotals(lines, c.type, c.coupon);
    const fail = m => { toast(m, 'error'); return false; };
    const ph = digits(co.phone);

    if (c.type === 'dine-in' && !co.table) return fail('Please choose a table for this dine-in order');
    if (c.type === 'dine-in' && tableStatus(tableById(co.table)).s === 'occupied') return fail('That table is occupied – pick another one');
    if (c.type === 'delivery') {
        if (!co.name.trim()) return fail('Enter the customer name for delivery');
        if (ph.length !== 10) return fail('Enter a 10-digit phone number for delivery');
        if (co.address.trim().length < 8) return fail('Enter the full delivery address');
    }
    if (co.phone && ph.length !== 10) return fail('Phone number must have 10 digits');

    const info = { name: co.name, phone: ph, table: co.table, address: co.address, note: co.note, method: co.method, tendered: 0, change: 0, ref: '' };
    if (co.method === 'cash') {
        const v = co.tendered === '' ? t.total : parseFloat(co.tendered);
        if (isNaN(v) || v < t.total) return fail('Amount received is less than the bill total');
        info.tendered = v; info.change = round2(v - t.total);
    } else if (co.method === 'card') {
        if (digits(co.cardNo).length !== 16) return fail('Enter a valid 16-digit card number');
        if (!co.cardName.trim()) return fail('Enter the name on the card');
        const m = co.exp.match(/^(\d{2})\/(\d{2})$/);
        const now = new Date();
        if (!m || +m[1] < 1 || +m[1] > 12 || (2000 + +m[2]) * 12 + +m[1] < now.getFullYear() * 12 + now.getMonth() + 1) return fail('Card expiry is invalid or has passed');
        if (!/^\d{3,4}$/.test(co.cvv)) return fail('Enter the 3-digit CVV');
        info.ref = 'CARD' + digits(co.cardNo).slice(-4) + Math.floor(Math.random() * 9e5 + 1e5);
    } else {
        if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(co.upi.trim())) return fail('Enter a valid UPI ID, like name@bank');
        info.ref = 'UPI' + Math.floor(Math.random() * 9e9 + 1e9);
    }

    const btn = $('#payBtn');
    btn.classList.add('loading'); btn.disabled = true;
    setTimeout(() => {
        const order = createOrder(info);
        cartClear(); state.co = null; updateBadges();
        showInvoice(order.id, true);
        if (['orders', 'dashboard', 'payments', 'bookings', 'customers'].includes(state.route)) ROUTES[state.route].render();
    }, co.method === 'cash' ? 450 : 1300);
}

/* ---------- invoice ---------- */
function invoiceHTML(o) {
    const S = DB.settings, half = round2(o.tax / 2), rate = S.taxRate / 2;
    const tb = o.tableId && tableById(o.tableId);
    const refunded = o.paymentStatus === 'refunded';
    return `
  <div class="invoice">
    ${refunded ? '<div class="stamp">REFUNDED</div>' : ''}
    <div class="inv-head">
      <div class="inv-logo">${LOGO(44)}</div>
      <h2>${esc(S.name)}</h2>
      <p>${esc(S.address)}</p>
      <p>Ph: ${esc(S.phone)} · GSTIN: ${esc(S.gstin)}</p>
    </div>
    <div class="inv-title">TAX INVOICE</div>
    <div class="inv-meta">
      <div><span>Bill no.</span><b>${esc(o.id)}</b></div>
      <div><span>Date</span><b>${fmtDT(o.createdAt)}</b></div>
      <div><span>Order type</span><b>${TYPE_LABEL[o.type]}${tb ? ' · ' + esc(tb.name) : ''}</b></div>
      <div><span>Customer</span><b>${esc(o.customerName || 'Walk-in guest')}${o.phone ? ' · ' + esc(o.phone) : ''}</b></div>
      ${o.address ? `<div><span>Deliver to</span><b>${esc(o.address)}</b></div>` : ''}
      <div><span>Billed by</span><b>${esc(o.cashier || '-')}</b></div>
    </div>
    <table class="inv-table">
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>${o.items.map(i => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.price * i.qty)}</td></tr>`).join('')}</tbody>
    </table>
    <div class="inv-totals">
      <div><span>Subtotal</span><b>${money(o.subtotal)}</b></div>
      ${o.discount ? `<div><span>Discount (${esc(o.discountLabel)})</span><b>− ${money(o.discount)}</b></div>` : ''}
      ${o.delivery ? `<div><span>Delivery charge</span><b>${money(o.delivery)}</b></div>` : ''}
      <div><span>CGST (${rate}%)</span><b>${money(half)}</b></div>
      <div><span>SGST (${rate}%)</span><b>${money(round2(o.tax - half))}</b></div>
      ${o.roundOff ? `<div><span>Round off</span><b>${o.roundOff > 0 ? '+' : '−'} ${money(Math.abs(o.roundOff))}</b></div>` : ''}
      <div class="grand"><span>Grand total</span><b>${money(o.total)}</b></div>
    </div>
    <div class="inv-pay">
      <div><span>Payment</span><b>${o.paymentStatus === 'pending' ? 'Unpaid – pay at the restaurant / on delivery' : o.paymentStatus === 'void' ? 'Order cancelled – not charged' : METHOD_LABEL[o.method] + ' · ' + (refunded ? 'Refunded' : 'Paid')}</b></div>
      ${o.ref ? `<div><span>Reference</span><b>${esc(o.ref)}</b></div>` : ''}
      ${o.method === 'cash' && o.tendered ? `<div><span>Cash received / change</span><b>${money(o.tendered)} / ${money(o.change)}</b></div>` : ''}
      ${o.note ? `<div><span>Note</span><b>${esc(o.note)}</b></div>` : ''}
    </div>
    <p class="inv-thanks">Thank you for dining with us – visit again!</p>
  </div>`;
}
function showInvoice(id, fresh) {
    const o = orderById(id);
    if (!o) return;
    openModal({
        title: fresh ? 'Payment complete' : 'Invoice ' + esc(o.id), size: 'md',
        body: `${fresh ? `<div class="success"><svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" fill="none" stroke="#28A745" stroke-width="3" pathLength="1" class="sc-circle"/><path d="M15 27l8 8 15-17" fill="none" stroke="#28A745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="sc-check"/></svg>
      <h3>Payment received</h3><p>Order <b>${esc(o.id)}</b> has been sent to the kitchen.</p></div>` : ''}
      <div class="inv-wrap">${invoiceHTML(o)}</div>
      <div class="m-foot">
        <button class="btn ghost" data-action="modal-close">${fresh ? 'New order' : 'Close'}</button>
        ${fresh ? `<a class="btn outline" href="#/orders" data-action="modal-close">View orders</a>` : ''}
        <button class="btn gold" data-action="print" data-id="${o.id}">${ic('printer', 16)} Print bill</button>
      </div>`
    });
}
function printInvoice(id) {
    const o = orderById(id);
    if (!o) return;
    $('#printArea').innerHTML = invoiceHTML(o);
    setTimeout(() => window.print(), 80);
}
window.addEventListener('afterprint', () => { const p = $('#printArea'); if (p) p.innerHTML = ''; });

/* ---------- dish editor (admin) ---------- */
const EMOJI_PICK = ['🍛', '🍚', '🍗', '🥘', '🍕', '🍔', '🌯', '🥪', '🍜', '🍝', '🍲', '🥗', '🍳', '🥞', '🍢', '🍤', '🍰', '🍫', '🍨', '🍮', '☕', '🥤', '🍹', '🥭'];
function openDishModal(id) {
    const d = id ? dishById(id) : { name: '', price: '', cat: state.cat !== 'All' ? state.cat : DB.categories[0], veg: true, emoji: '🍽️', desc: '', img: '', available: true };
    if (!d) return;
    openModal({
        title: id ? 'Edit dish' : 'Add new dish', size: 'md',
        body: `<form data-form="dish" data-id="${id || ''}" novalidate>
      <div class="field"><label>Dish name</label><input name="name" value="${esc(d.name)}" maxlength="40" placeholder="e.g. Paneer Tikka" data-focus></div>
      <div class="row">
        <div class="field"><label>Price (₹)</label><input name="price" type="number" min="1" step="1" value="${esc(d.price)}" placeholder="0"></div>
        <div class="field"><label>Category</label><select name="cat">${DB.categories.map(c => `<option ${c === d.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
      </div>
      <div class="row">
        <div class="field"><label>Food type</label>
          <div class="radio-seg"><label><input type="radio" name="veg" value="1" ${d.veg ? 'checked' : ''}><span><i class="dot veg"></i> Veg</span></label>
          <label><input type="radio" name="veg" value="0" ${d.veg ? '' : 'checked'}><span><i class="dot nonveg"></i> Non-veg</span></label></div></div>
        <div class="field"><label>Emoji icon</label><input name="emoji" id="dishEmoji" value="${esc(d.emoji)}" maxlength="4"></div>
      </div>
      <div class="emoji-pick">${EMOJI_PICK.map(e => `<button type="button" data-action="pick-emoji" data-e="${e}">${e}</button>`).join('')}</div>
      <div class="field"><label>Short description</label><input name="desc" value="${esc(d.desc)}" maxlength="90" placeholder="What makes this dish special?"></div>
      <div class="field"><label>Photo <small>(optional – paste an image link or upload)</small></label>
        <div class="img-row"><input name="img" id="dishImg" value="${d.img && d.img.startsWith('data:') ? '' : esc(d.img)}" placeholder="https://… or images/dish.jpg">
        <label class="btn outline sm file-btn">${ic('upload', 15)} Upload<input type="file" accept="image/*" data-change="dish-file" hidden></label></div>
        <input type="hidden" name="imgdata" id="dishImgData" value="${d.img && d.img.startsWith('data:') ? esc(d.img) : ''}">
        <div class="img-prev" id="dishPrev">${d.img ? `<img src="${esc(d.img)}" alt="">` : ''}</div></div>
      <label class="check"><input type="checkbox" name="available" ${d.available ? 'checked' : ''}><span></span>Available today</label>
      <div class="m-foot"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button class="btn gold" type="submit">${id ? 'Save changes' : 'Add dish'}</button></div>
    </form>`
    });
}
function saveDishForm(form) {
    const f = new FormData(form), id = form.dataset.id;
    const name = (f.get('name') || '').trim(), price = parseFloat(f.get('price'));
    if (!name) return toast('Enter the dish name', 'error');
    if (!(price > 0)) return toast('Enter a valid price', 'error');
    if (DB.dishes.some(d => d.id !== id && d.name.toLowerCase() === name.toLowerCase())) return toast('A dish with this name already exists', 'error');
    const data = {
        name, price: Math.round(price * 100) / 100, cat: f.get('cat'), veg: f.get('veg') === '1',
        emoji: (f.get('emoji') || '🍽️').trim() || '🍽️', desc: (f.get('desc') || '').trim(),
        img: (f.get('imgdata') || '') || (f.get('img') || '').trim(), available: !!f.get('available')
    };
    if (id) Object.assign(dishById(id), data);
    else DB.dishes.push({ id: uid('d'), ...data });
    saveDB(); closeModal(); renderDishGrid(); updateCartUI();
    toast(id ? 'Dish updated' : name + ' added to the menu');
}
function readImageFile(file, cb) {
    const fr = new FileReader();
    fr.onload = () => {
        const img = new Image();
        img.onload = () => {
            const max = 1280, k = Math.min(1, max / Math.max(img.width, img.height));
            const cv = document.createElement('canvas');
            cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            cb(cv.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => toast('That file is not a valid image', 'error');
        img.src = fr.result;
    };
    fr.readAsDataURL(file);
}

/* ---------- category manager (admin) ---------- */
function openCatModal() {
    openModal({ title: 'Manage categories', size: 'sm', body: catModalHTML() });
}
function catModalHTML() {
    return `<p class="hint">Rename a category by editing it. Categories that still have dishes can’t be deleted.</p>
    <div class="cat-list">${DB.categories.map(c => {
        const n = DB.dishes.filter(d => d.cat === c).length;
        return `<div class="cat-row"><input value="${esc(c)}" data-change="cat-rename" data-old="${esc(c)}" maxlength="24" aria-label="Category name">
        <span class="muted">${n} dish${n === 1 ? '' : 'es'}</span>
        <button class="icon-btn dark" data-action="del-cat" data-cat="${esc(c)}" ${n ? 'disabled title="Move or delete its dishes first"' : ''} aria-label="Delete category">${ic('trash', 16)}</button></div>`;
    }).join('')}</div>
    <form data-form="cat-add" class="cat-add"><input name="name" placeholder="New category name" maxlength="24" autocomplete="off"><button class="btn gold sm" type="submit">${ic('plus', 15)} Add</button></form>
    <div class="m-foot"><button class="btn gold" data-action="modal-close">Done</button></div>`;
}
function refreshCatModal() { const b = $('#modalRoot .m-body'); if (b) b.innerHTML = catModalHTML(); renderChips(); renderDishGrid(); }

/* ==========================================================================
   SMALL CHART HELPERS (pure SVG / CSS – no libraries)
   ========================================================================== */
function niceStep(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(m => m * p >= v) * p;
}
function barChartSVG(data, h = 230) {
    const W = 640, pl = 46, pr = 8, pt = 14, pb = 30, iw = W - pl - pr, ih = h - pt - pb;
    const max = Math.max(0, ...data.map(d => d.value));
    const step = niceStep(max / 4 || 1), top = step * 4;
    const bw = iw / data.length, every = Math.ceil(data.length / 10);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img" aria-label="Revenue chart">`;
    for (let i = 0; i <= 4; i++) {
        const y = pt + ih - ih * i / 4;
        s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" class="grid"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end" class="axis">${short(step * i)}</text>`;
    }
    data.forEach((d, i) => {
        const bh = ih * d.value / top, x = pl + i * bw + bw * .18, w = bw * .64;
        s += `<rect x="${x}" y="${pt + ih - bh}" width="${w}" height="${d.value ? Math.max(bh, 2) : 0}" rx="${Math.min(5, w / 3)}" class="bar"><title>${esc(d.label)}: ${money(d.value)}</title></rect>`;
        if (i % every === 0) s += `<text x="${x + w / 2}" y="${h - 9}" text-anchor="middle" class="axis">${esc(d.label)}</text>`;
    });
    return s + '</svg>';
}
function donutHTML(items) {
    const total = items.reduce((s, i) => s + i.value, 0);
    if (!total) return '<div class="empty small"><p>No sales in this period</p></div>';
    let acc = 0;
    const stops = items.map((it, i) => {
        const a = acc / total * 100; acc += it.value; const b = acc / total * 100;
        return `${chartCol(i)} ${a}% ${b}%`;
    }).join(',');
    return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops})"><span><b>${money(total)}</b><small>total</small></span></div>
    <ul class="legend-list">${items.map((it, i) => `<li><i style="background:${chartCol(i)}"></i><span>${esc(it.label)}</span><b>${Math.round(it.value / total * 100)}%</b></li>`).join('')}</ul></div>`;
}
const statusBadge = s => `<span class="badge st-${s}">${STATUS_LABEL[s] || s}</span>`;
const refreshView = () => { if (state.user) { ROUTES[state.route].render(); updateCheckoutBar(); updateBadges(); } };

/* ==========================================================================
   DASHBOARD
   ========================================================================== */
function viewDashboard() {
    const key = todayStr();
    const todays = DB.orders.filter(o => orderDay(o) === key);
    const t = sumOrders(todays);
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    const yRev = sumOrders(DB.orders.filter(o => orderDay(o) === ymd(yd))).revenue;
    const delta = yRev ? Math.round((t.revenue - yRev) / yRev * 100) : null;
    const active = DB.orders.filter(o => ACTIVE.includes(o.status));
    const bookingsToday = DB.bookings.filter(b => b.date === key && b.status === 'confirmed');
    const top = topDishes(ordersInRange('30'), 5);
    const topMax = Math.max(1, ...top.map(x => x.qty));

    $('#view').innerHTML = `
  <div class="page-head"><div><h1>Dashboard</h1><p class="sub">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
    <div class="head-actions"><button class="btn gold sm" data-action="goto-menu">${ic('plus', 15)} New order</button></div></div>

  <div class="stats">
    <div class="stat"><span class="s-ic gold">${ic('rupee', 20)}</span><div><small>Today's sales</small><b>${money(t.revenue)}</b>
      <em class="${delta === null ? '' : delta >= 0 ? 'up' : 'down'}">${delta === null ? 'No sales yesterday' : (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta) + '% vs yesterday'}</em></div></div>
    <div class="stat"><span class="s-ic dark">${ic('orders', 20)}</span><div><small>Orders today</small><b>${t.count}</b><em>${t.items} items served</em></div></div>
    <div class="stat"><span class="s-ic amber">${ic('pot', 20)}</span><div><small>In the kitchen</small><b>${active.length}</b><em>${DB.orders.filter(o => o.status === 'pending').length} waiting to start</em></div></div>
    <div class="stat"><span class="s-ic green">${ic('calendar', 20)}</span><div><small>Bookings today</small><b>${bookingsToday.length}</b><em>${bookingsToday.reduce((s, b) => s + b.guests, 0)} guests expected</em></div></div>
  </div>

  <div class="dash-grid">
    <section class="card pad">
      <div class="card-head"><h3>Sales – last 7 days</h3><a class="link" href="#/${isAdmin() ? 'reports' : 'orders'}">${isAdmin() ? 'Full report' : 'All orders'}</a></div>
      ${barChartSVG(revenueByDay(7))}
    </section>

    <section class="card pad">
      <div class="card-head"><h3>Live orders</h3><a class="link" href="#/orders">See all</a></div>
      <div class="live-list">${active.length ? active.slice(0, 6).map(o => `
        <div class="live-item">
          <div><b>${esc(o.id)}</b> ${statusBadge(o.status)}
            <p>${TYPE_LABEL[o.type]}${o.tableId ? ' · ' + esc(tableById(o.tableId)?.name || '') : ''} · ${o.items.reduce((s, i) => s + i.qty, 0)} items · ${timeAgo(o.createdAt)}${o.paymentStatus === 'pending' ? ' · <b>Unpaid</b>' : ''}${o.cashier === 'Online' ? ' · Online' : ''}</p></div>
          <button class="btn gold xs" data-action="advance" data-id="${o.id}">${NEXT_LABEL[o.status]}</button>
        </div>`).join('') : '<div class="empty small"><p>No live orders – the kitchen is clear</p></div>'}</div>
    </section>

    <section class="card pad">
      <div class="card-head"><h3>Best sellers <small>last 30 days</small></h3></div>
      <div class="rank-list">${top.map((d, i) => `
        <div class="rank"><span class="rk">${i + 1}</span><div><p><b>${esc(d.name)}</b><em>${d.qty} sold</em></p><i style="--w:${Math.round(d.qty / topMax * 100)}%"></i></div></div>`).join('') || '<div class="empty small"><p>No sales yet</p></div>'}</div>
    </section>

    <section class="card pad">
      <div class="card-head"><h3>Tables right now</h3><a class="link" href="#/bookings">Manage</a></div>
      <div class="mini-tables">${DB.tables.map(tb => { const st = tableStatus(tb); return `<a href="#/bookings" class="mt s-${st.s}" title="${tb.name} · ${tb.seats} seats · ${st.s}"><b>${tb.name}</b><small>${tb.seats}</small></a>`; }).join('')}</div>
      <div class="legend"><span><i class="sw free"></i> Free</span><span><i class="sw reserved"></i> Reserved</span><span><i class="sw occupied"></i> Occupied</span></div>
    </section>
  </div>`;
}

/* ==========================================================================
   ORDERS
   ========================================================================== */
function viewOrders() {
    const f = state.ord;
    $('#view').innerHTML = `
  <div class="page-head"><h1>Orders</h1><div class="head-actions"><button class="btn gold sm" data-action="goto-menu">${ic('plus', 15)} New order</button></div></div>
  <div class="toolbar">
    <label class="search-light">${ic('search', 16)}<input data-input="ord" data-k="q" value="${esc(f.q)}" placeholder="Search bill no., customer, phone or dish" autocomplete="off"></label>
    <select data-input="ord" data-k="range" aria-label="Date range">
      ${[['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']].map(([v, l]) => `<option value="${v}" ${f.range === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <select data-input="ord" data-k="type" aria-label="Order type">
      <option value="all">All types</option>${Object.keys(TYPE_LABEL).map(k => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${TYPE_LABEL[k]}</option>`).join('')}</select>
  </div>
  <div class="chips" id="ordChips"></div>
  <div class="card tbl-wrap" id="ordList"></div>`;
    renderOrdersList();
}
function renderOrdersList() {
    const f = state.ord, q = f.q.trim().toLowerCase();
    let base = ordersInRange(f.range).filter(o => f.type === 'all' || o.type === f.type);
    if (q) base = base.filter(o => (o.id + ' ' + o.customerName + ' ' + o.phone + ' ' + o.items.map(i => i.name).join(' ')).toLowerCase().includes(q));
    const counts = { all: base.length };
    Object.keys(STATUS_LABEL).forEach(s => counts[s] = base.filter(o => o.status === s).length);
    $('#ordChips').innerHTML = ['all', ...Object.keys(STATUS_LABEL)].map(s =>
        `<button class="chip ${f.status === s ? 'active' : ''}" data-action="ord-status" data-s="${s}">${s === 'all' ? 'All' : STATUS_LABEL[s]} <em>${counts[s]}</em></button>`).join('');
    const list = f.status === 'all' ? base : base.filter(o => o.status === f.status);
    const shown = list.slice(0, f.limit);
    $('#ordList').innerHTML = list.length ? `
    <table class="tbl"><thead><tr><th>Bill</th><th>Time</th><th>Customer</th><th>Type</th><th>Items</th><th class="r">Total</th><th>Payment</th><th>Status</th><th class="r">Actions</th></tr></thead>
    <tbody>${shown.map(o => `<tr>
      <td><b>${esc(o.id)}</b></td>
      <td class="nowrap">${fmtDT(o.createdAt)}</td>
      <td>${o.customerName ? `<b>${esc(o.customerName)}</b>${o.phone ? `<small>${esc(o.phone)}</small>` : ''}` : '<span class="muted">Walk-in</span>'}</td>
      <td>${TYPE_LABEL[o.type]}${o.tableId ? `<small>${esc(tableById(o.tableId)?.name || '')}</small>` : ''}</td>
      <td class="items-cell" title="${esc(o.items.map(i => i.name + ' ×' + i.qty).join(', '))}">${o.items.map(i => esc(i.name) + ' ×' + i.qty).join(', ')}</td>
      <td class="r"><b>${money(o.total)}</b></td>
      <td>${o.paymentStatus === 'pending' ? '<span class="muted">–</span>' : METHOD_LABEL[o.method]}<small class="${o.paymentStatus === 'paid' ? 'ok' : 'bad'}">${PAY_LABEL[o.paymentStatus] || o.paymentStatus}</small></td>
      <td>${statusBadge(o.status)}</td>
      <td class="r acts">
        ${NEXT_STATUS[o.status] ? `<button class="btn gold xs" data-action="advance" data-id="${o.id}">${NEXT_LABEL[o.status]}</button>` : ''}
        ${o.paymentStatus === 'pending' && o.status !== 'cancelled' ? `<button class="btn outline xs" data-action="collect-pay" data-id="${o.id}">Collect ${money(o.total)}</button>` : ''}
        <button class="icon-btn dark" data-action="view-order" data-id="${o.id}" title="View bill" aria-label="View bill">${ic('eye', 17)}</button>
        <button class="icon-btn dark" data-action="print" data-id="${o.id}" title="Print bill" aria-label="Print bill">${ic('printer', 17)}</button>
        ${ACTIVE.includes(o.status) ? `<button class="icon-btn dark red" data-action="cancel-order" data-id="${o.id}" title="Cancel &amp; refund" aria-label="Cancel order">${ic('x', 17)}</button>` : ''}
      </td></tr>`).join('')}</tbody></table>
    ${list.length > shown.length ? `<div class="more"><button class="btn outline sm" data-action="ord-more">Show more (${list.length - shown.length} left)</button></div>` : ''}`
        : `<div class="empty"><div class="e-ic">🧾</div><h4>No orders found</h4><p>Change the filters, or take a new order from the Menu page.</p></div>`;
}

/* ==========================================================================
   TABLE BOOKING
   ========================================================================== */
function viewBookings() {
    $('#view').innerHTML = `
  <div class="page-head"><h1>Table Booking</h1><div class="head-actions"><button class="btn gold sm" data-action="book-table">${ic('plus', 15)} New booking</button></div></div>
  <div class="legend table-legend"><span><i class="sw free"></i> Free</span><span><i class="sw reserved"></i> Reserved (booking within the hour)</span><span><i class="sw occupied"></i> Occupied (live order)</span></div>
  <div class="tables-grid">${DB.tables.map(tb => {
        const st = tableStatus(tb);
        const sub = st.s === 'occupied' ? 'Order ' + st.order.id : st.s === 'reserved' ? fmtT(st.booking.time) + ' · ' + esc(st.booking.name.split(' ')[0]) : 'Tap to book';
        return `<button class="tbl-card s-${st.s}" data-action="${st.s === 'occupied' ? 'view-order' : 'pick-table'}" data-id="${st.s === 'occupied' ? st.order.id : tb.id}">
      <span class="t-ring"><b>${tb.name}</b></span><span class="t-seats">${tb.seats} seats</span>
      <span class="t-state">${st.s === 'free' ? 'Free' : st.s === 'reserved' ? 'Reserved' : 'Occupied'}</span><small>${sub}</small></button>`;
    }).join('')}</div>

  <h2 class="sub-h">Reservations</h2>
  <div class="chips">${[['upcoming', 'Upcoming'], ['today', 'Today'], ['past', 'Past'], ['cancelled', 'Cancelled']].map(([k, l]) =>
        `<button class="chip ${state.bk.tab === k ? 'active' : ''}" data-action="bk-tab" data-tab="${k}">${l}</button>`).join('')}</div>
  <div class="card tbl-wrap" id="bkList"></div>`;
    renderBookingList();
}
function renderBookingList() {
    const today = todayStr(), tab = state.bk.tab;
    let list = DB.bookings.slice();
    if (tab === 'upcoming') list = list.filter(b => b.status === 'confirmed' && b.date >= today);
    else if (tab === 'today') list = list.filter(b => b.date === today && b.status !== 'cancelled');
    else if (tab === 'past') list = list.filter(b => b.status === 'completed' || (b.status === 'confirmed' && b.date < today));
    else list = list.filter(b => b.status === 'cancelled');
    list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (tab === 'past') list.reverse();
    $('#bkList').innerHTML = list.length ? `
    <table class="tbl"><thead><tr><th>Date</th><th>Time</th><th>Guest</th><th>Guests</th><th>Table</th><th>Note</th><th>Status</th><th class="r">Actions</th></tr></thead>
    <tbody>${list.map(b => `<tr>
      <td class="nowrap"><b>${b.date === today ? 'Today' : fmtD(b.date)}</b></td><td>${fmtT(b.time)}</td>
      <td><b>${esc(b.name)}</b><small>${esc(b.phone)}${b.source === 'online' ? ' · online' : ''}</small></td><td>${b.guests}</td><td>${esc(tableById(b.tableId)?.name || '-')}</td>
      <td class="items-cell">${esc(b.note) || '<span class="muted">–</span>'}</td>
      <td><span class="badge bk-${b.status}">${b.status[0].toUpperCase() + b.status.slice(1)}</span></td>
      <td class="r acts">${b.status === 'confirmed' && b.date === today ? `<button class="btn outline xs" data-action="bk-order" data-id="${b.id}">Take order</button>` : ''}${b.status === 'confirmed' ? `<button class="btn gold xs" data-action="bk-complete" data-id="${b.id}">Seated / done</button>
        <button class="icon-btn dark red" data-action="bk-cancel" data-id="${b.id}" title="Cancel booking" aria-label="Cancel booking">${ic('x', 17)}</button>` : ''}</td></tr>`).join('')}</tbody></table>`
        : `<div class="empty"><div class="e-ic">📅</div><h4>No ${tab} bookings</h4><p>Use “New booking” to reserve a table for a guest.</p></div>`;
}
function openBookingModal(tableId = '') {
    const d = todayStr();
    openModal({
        title: 'Book a table', size: 'md',
        body: `<form data-form="booking" data-preset="${esc(tableId)}" novalidate>
      <div class="row">
        <div class="field"><label>Guest name</label><input name="name" placeholder="Full name" data-focus autocomplete="off"></div>
        <div class="field"><label>Phone</label><input name="phone" inputmode="numeric" maxlength="10" placeholder="10-digit number" autocomplete="off"></div>
      </div>
      <div class="row3">
        <div class="field"><label>Date</label><input type="date" name="date" min="${d}" value="${d}" data-input="bk-refresh"></div>
        <div class="field"><label>Time</label><select name="time" data-input="bk-refresh">${SLOTS.map(s => `<option value="${s}" ${s === '20:00' ? 'selected' : ''}>${fmtT(s)}</option>`).join('')}</select></div>
        <div class="field"><label>Guests</label><input type="number" name="guests" min="1" max="10" value="2" data-input="bk-refresh"></div>
      </div>
      <div class="field"><label>Table</label><select name="table"></select></div>
      <div class="field"><label>Special request <small>(optional)</small></label><input name="note" placeholder="Birthday, window seat, high chair…" autocomplete="off"></div>
      <div class="m-foot"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button class="btn gold" type="submit">Confirm booking</button></div>
    </form>`
    });
    refreshBookingTables($('#modalRoot form'));
}
function refreshBookingTables(form) {
    if (!form) return;
    const el = form.elements, date = el.date.value, guests = parseInt(el.guests.value, 10) || 1;
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    Array.from(el.time.options).forEach(o => { o.disabled = date === todayStr() && minutesOf(o.value) <= nowMin; });
    if (el.time.selectedOptions[0] && el.time.selectedOptions[0].disabled) {
        const f = Array.from(el.time.options).find(o => !o.disabled);
        if (f) el.time.value = f.value;
    }
    const time = el.time.value, prev = el.table.value || form.dataset.preset;
    el.table.innerHTML = DB.tables.map(tb => {
        const c = bookingConflict(tb.id, date, time), small = tb.seats < guests;
        return `<option value="${tb.id}" ${c || small ? 'disabled' : ''}>${tb.name} · ${tb.seats} seats${c ? ' – booked at ' + fmtT(c.time) : small ? ' – too small' : ''}</option>`;
    }).join('');
    const ok = Array.from(el.table.options).find(o => o.value === prev && !o.disabled) || Array.from(el.table.options).find(o => !o.disabled);
    if (ok) el.table.value = ok.value;
}
function saveBookingForm(form) {
    const f = new FormData(form);
    const name = (f.get('name') || '').trim(), phone = digits(f.get('phone')), date = f.get('date'), time = f.get('time');
    const guests = parseInt(f.get('guests'), 10), tableId = f.get('table'), tb = tableById(tableId);
    const fail = m => toast(m, 'error');
    if (!name) return fail('Enter the guest name');
    if (phone.length !== 10) return fail('Phone number must have 10 digits');
    if (!date || date < todayStr()) return fail('Choose today or a future date');
    if (!time || (form.elements.time.selectedOptions[0] && form.elements.time.selectedOptions[0].disabled)) return fail('No time slots are left today – choose another date');
    if (!(guests >= 1)) return fail('Enter the number of guests');
    if (!tb) return fail('No table is free for that time – try another slot');
    if (tb.seats < guests) return fail(tb.name + ' only seats ' + tb.seats);
    if (bookingConflict(tableId, date, time)) return fail(tb.name + ' is already booked around that time');
    DB.bookings.push({ id: uid('b'), name, phone, date, time, guests, tableId, note: (f.get('note') || '').trim(), status: 'confirmed', createdAt: new Date().toISOString() });
    findOrCreateCustomer(name, phone);
    saveDB(); closeModal();
    toast(`${tb.name} booked for ${name} – ${date === todayStr() ? 'today' : fmtD(date)}, ${fmtT(time)}`);
    if (['bookings', 'dashboard', 'customers'].includes(state.route)) refreshView();
}

/* ==========================================================================
   CUSTOMERS
   ========================================================================== */
function viewCustomers() {
    const all = DB.customers.map(c => ({ c, s: customerStats(c) }));
    const repeat = all.filter(x => x.s.orders > 1).length;
    const best = all.slice().sort((a, b) => b.s.spent - a.s.spent)[0];
    $('#view').innerHTML = `
  <div class="page-head"><h1>Customers</h1><div class="head-actions"><button class="btn gold sm" data-action="add-customer">${ic('plus', 15)} Add customer</button></div></div>
  <div class="stats three">
    <div class="stat"><span class="s-ic gold">${ic('users', 20)}</span><div><small>Total customers</small><b>${all.length}</b></div></div>
    <div class="stat"><span class="s-ic green">${ic('refresh', 20)}</span><div><small>Repeat customers</small><b>${repeat}</b><em>${all.length ? Math.round(repeat / all.length * 100) : 0}% ordered more than once</em></div></div>
    <div class="stat"><span class="s-ic dark">${ic('rupee', 20)}</span><div><small>Top spender</small><b class="sm">${best && best.s.spent ? esc(best.c.name) : '–'}</b><em>${best && best.s.spent ? money(best.s.spent) : 'No sales yet'}</em></div></div>
  </div>
  <div class="toolbar"><label class="search-light">${ic('search', 16)}<input data-input="cust" value="${esc(state.cu.q)}" placeholder="Search by name, phone or email" autocomplete="off"></label></div>
  <div class="card tbl-wrap" id="custList"></div>`;
    renderCustomerList();
}
function renderCustomerList() {
    const q = state.cu.q.trim().toLowerCase();
    const rows = DB.customers.map(c => ({ c, s: customerStats(c) }))
        .filter(x => !q || (x.c.name + ' ' + x.c.phone + ' ' + x.c.email).toLowerCase().includes(q))
        .sort((a, b) => b.s.spent - a.s.spent || a.c.name.localeCompare(b.c.name));
    $('#custList').innerHTML = rows.length ? `
    <table class="tbl"><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th class="r">Orders</th><th class="r">Total spent</th><th>Last order</th><th>Tier</th><th class="r">Actions</th></tr></thead>
    <tbody>${rows.map(({ c, s }) => {
        const [tn, tc] = tierOf(s.spent); return `<tr>
      <td><span class="mini-av">${esc(c.name.charAt(0).toUpperCase())}</span><b>${esc(c.name)}</b></td>
      <td>${esc(c.phone) || '<span class="muted">–</span>'}</td><td>${esc(c.email) || '<span class="muted">–</span>'}</td>
      <td class="r">${s.orders}</td><td class="r"><b>${money(s.spent)}</b></td>
      <td class="nowrap">${s.last ? timeAgo(s.last) : '<span class="muted">Never</span>'}</td>
      <td><span class="badge ${tc}">${tn}</span></td>
      <td class="r acts">
        <button class="icon-btn dark" data-action="cust-history" data-id="${c.id}" title="Order history" aria-label="Order history">${ic('orders', 17)}</button>
        <button class="icon-btn dark" data-action="edit-customer" data-id="${c.id}" title="Edit" aria-label="Edit customer">${ic('edit', 17)}</button>
        ${isAdmin() ? `<button class="icon-btn dark red" data-action="del-customer" data-id="${c.id}" title="Delete" aria-label="Delete customer">${ic('trash', 17)}</button>` : ''}
      </td></tr>`;
    }).join('')}</tbody></table>`
        : `<div class="empty"><div class="e-ic">👥</div><h4>No customers found</h4><p>Customers are added automatically when you enter a name or phone at checkout.</p></div>`;
}
function openCustomerModal(id) {
    const c = id ? customerById(id) : { name: '', phone: '', email: '' };
    if (!c) return;
    openModal({
        title: id ? 'Edit customer' : 'Add customer', size: 'sm',
        body: `<form data-form="customer" data-id="${id || ''}" novalidate>
      <div class="field"><label>Full name</label><input name="name" value="${esc(c.name)}" maxlength="40" data-focus autocomplete="off"></div>
      <div class="field"><label>Phone</label><input name="phone" value="${esc(c.phone)}" inputmode="numeric" maxlength="10" placeholder="10-digit number" autocomplete="off"></div>
      <div class="field"><label>Email <small>(optional)</small></label><input name="email" type="email" value="${esc(c.email)}" autocomplete="off"></div>
      <div class="m-foot"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button class="btn gold" type="submit">${id ? 'Save changes' : 'Add customer'}</button></div>
    </form>`
    });
}
function saveCustomerForm(form) {
    const f = new FormData(form), id = form.dataset.id;
    const name = (f.get('name') || '').trim(), phone = digits(f.get('phone')), email = (f.get('email') || '').trim();
    if (!name) return toast('Enter the customer name', 'error');
    if (phone && phone.length !== 10) return toast('Phone number must have 10 digits', 'error');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return toast('Enter a valid email address', 'error');
    if (phone && DB.customers.some(c => c.id !== id && digits(c.phone) === phone)) return toast('Another customer already uses this phone number', 'error');
    if (id) Object.assign(customerById(id), { name, phone, email });
    else DB.customers.push({ id: uid('c'), name, phone, email, createdAt: new Date().toISOString() });
    saveDB(); closeModal(); refreshView();
    toast(id ? 'Customer updated' : name + ' added');
}
function openCustomerHistory(id) {
    const c = customerById(id);
    if (!c) return;
    const s = customerStats(c), [tn] = tierOf(s.spent);
    openModal({
        title: esc(c.name), size: 'md',
        body: `<div class="hist-head"><div><small>Orders</small><b>${s.orders}</b></div><div><small>Total spent</small><b>${money(s.spent)}</b></div><div><small>Tier</small><b>${tn}</b></div></div>
      ${s.list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bill</th><th>Date</th><th>Items</th><th class="r">Total</th><th>Status</th><th></th></tr></thead><tbody>
      ${s.list.slice(0, 30).map(o => `<tr><td><b>${esc(o.id)}</b></td><td class="nowrap">${fmtDT(o.createdAt)}</td><td class="items-cell">${o.items.map(i => esc(i.name) + ' ×' + i.qty).join(', ')}</td><td class="r">${money(o.total)}</td><td>${statusBadge(o.status)}</td>
      <td class="r"><button class="icon-btn dark" data-action="view-order" data-id="${o.id}" aria-label="View bill">${ic('eye', 17)}</button></td></tr>`).join('')}</tbody></table></div>`
                : '<div class="empty small"><p>No orders yet</p></div>'}`
    });
}

/* ==========================================================================
   REPORTS (admin)
   ========================================================================== */
function viewReports() {
    const r = state.rep.range, list = ordersInRange(r), s = sumOrders(list), valid = s.list;
    const chart = r === 'today' ? revenueByHour() : revenueByDay(+r);
    const catMap = new Map();
    valid.forEach(o => o.items.forEach(i => catMap.set(i.cat, (catMap.get(i.cat) || 0) + i.price * i.qty)));
    const cats = [...catMap].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const meth = Object.keys(METHOD_LABEL).map(m => ({ label: METHOD_LABEL[m], value: valid.filter(o => o.method === m).reduce((a, o) => a + o.total, 0) })).filter(x => x.value);
    const types = Object.keys(TYPE_LABEL).map(t => ({ label: TYPE_LABEL[t], value: valid.filter(o => o.type === t).reduce((a, o) => a + o.total, 0) })).filter(x => x.value);
    const top = topDishes(list, 8), topMax = Math.max(1, ...top.map(x => x.qty));
    const cancelled = list.filter(o => o.status === 'cancelled').length;
    const label = { today: 'today', 7: 'the last 7 days', 30: 'the last 30 days' }[r];

    $('#view').innerHTML = `
  <div class="page-head"><div><h1>Reports</h1><p class="sub">Sales for ${label}</p></div>
    <div class="head-actions"><div class="seg compact">${[['today', 'Today'], ['7', '7 days'], ['30', '30 days']].map(([k, l]) =>
        `<button class="${r === k ? 'active' : ''}" data-action="rep-range" data-r="${k}">${l}</button>`).join('')}</div>
      <button class="btn outline sm" data-action="export-csv">${ic('download', 15)} Export CSV</button></div></div>

  <div class="stats">
    <div class="stat"><span class="s-ic gold">${ic('rupee', 20)}</span><div><small>Revenue</small><b>${money(s.revenue)}</b><em>incl. ${money(s.tax)} GST</em></div></div>
    <div class="stat"><span class="s-ic dark">${ic('orders', 20)}</span><div><small>Orders</small><b>${s.count}</b><em>${cancelled} cancelled / refunded</em></div></div>
    <div class="stat"><span class="s-ic green">${ic('payments', 20)}</span><div><small>Average bill</small><b>${money(s.count ? s.revenue / s.count : 0)}</b><em>${s.items} items sold</em></div></div>
    <div class="stat"><span class="s-ic amber">${ic('tag', 20)}</span><div><small>Discounts given</small><b>${money(s.discount)}</b><em>offers and coupons</em></div></div>
  </div>

  <div class="dash-grid">
    <section class="card pad wide-card"><div class="card-head"><h3>Revenue ${r === 'today' ? 'by hour' : 'by day'}</h3></div>${barChartSVG(chart, 250)}</section>
    <section class="card pad"><div class="card-head"><h3>Sales by category</h3><small>before tax &amp; discounts</small></div>${donutHTML(cats)}</section>
    <section class="card pad"><div class="card-head"><h3>Payment methods</h3></div>${donutHTML(meth)}</section>
    <section class="card pad"><div class="card-head"><h3>Top dishes</h3></div>
      <div class="rank-list">${top.map((d, i) => `<div class="rank"><span class="rk">${i + 1}</span><div><p><b>${esc(d.name)}</b><em>${d.qty} sold · ${money(d.revenue)}</em></p><i style="--w:${Math.round(d.qty / topMax * 100)}%"></i></div></div>`).join('') || '<div class="empty small"><p>No sales in this period</p></div>'}</div></section>
    <section class="card pad"><div class="card-head"><h3>Order types</h3></div>${donutHTML(types)}</section>
  </div>`;
}
function exportCSV() {
    const list = ordersInRange(state.rep.range);
    const head = ['Bill', 'Date', 'Time', 'Customer', 'Phone', 'Type', 'Table', 'Items', 'Subtotal', 'Discount', 'Delivery', 'GST', 'Total', 'Payment', 'Payment status', 'Order status'];
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = list.map(o => {
        const d = new Date(o.createdAt);
        return [o.id, ymd(d), pad(d.getHours()) + ':' + pad(d.getMinutes()), o.customerName || 'Walk-in', o.phone, TYPE_LABEL[o.type], tableById(o.tableId)?.name || '',
        o.items.map(i => i.name + ' x' + i.qty).join('; '), o.subtotal, o.discount, o.delivery, o.tax, o.total, METHOD_LABEL[o.method], o.paymentStatus, o.status].map(q).join(',');
    });
    downloadFile(`flavor-house-orders-${todayStr()}.csv`, '\ufeff' + [head.map(q).join(','), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
    toast(`Exported ${list.length} orders`);
}

/* ==========================================================================
   PAYMENTS
   ========================================================================== */
function viewPayments() {
    const f = state.pay;
    $('#view').innerHTML = `
  <div class="page-head"><h1>Payments</h1></div>
  <div class="stats five" id="payStats"></div>
  <div class="toolbar">
    <label class="search-light">${ic('search', 16)}<input data-input="pay" data-k="q" value="${esc(f.q)}" placeholder="Search bill no., customer or reference" autocomplete="off"></label>
    <select data-input="pay" data-k="range" aria-label="Date range">${[['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']].map(([v, l]) => `<option value="${v}" ${f.range === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <select data-input="pay" data-k="method" aria-label="Method"><option value="all">All methods</option>${Object.keys(METHOD_LABEL).map(m => `<option value="${m}" ${f.method === m ? 'selected' : ''}>${METHOD_LABEL[m]}</option>`).join('')}</select>
    <select data-input="pay" data-k="status" aria-label="Status"><option value="all">All statuses</option><option value="paid" ${f.status === 'paid' ? 'selected' : ''}>Paid</option><option value="pending" ${f.status === 'pending' ? 'selected' : ''}>Unpaid</option><option value="refunded" ${f.status === 'refunded' ? 'selected' : ''}>Refunded</option></select>
  </div>
  <div class="card tbl-wrap" id="payList"></div>`;
    renderPaymentsList();
}
function renderPaymentsList() {
    const f = state.pay, q = f.q.trim().toLowerCase();
    const inRange = ordersInRange(f.range);
    const paid = inRange.filter(isRevenue), by = m => paid.filter(o => o.method === m).reduce((s, o) => s + o.total, 0);
    const refunded = inRange.filter(o => o.paymentStatus === 'refunded');
    $('#payStats').innerHTML = `
    <div class="stat"><span class="s-ic gold">${ic('rupee', 20)}</span><div><small>Collected</small><b>${money(paid.reduce((s, o) => s + o.total, 0))}</b><em>${paid.length} payments${inRange.filter(o => o.paymentStatus === 'pending' && o.status !== 'cancelled').length ? ' · ' + inRange.filter(o => o.paymentStatus === 'pending' && o.status !== 'cancelled').length + ' unpaid' : ''}</em></div></div>
    <div class="stat"><span class="s-ic dark">${ic('rupee', 20)}</span><div><small>Cash</small><b>${money(by('cash'))}</b></div></div>
    <div class="stat"><span class="s-ic dark">${ic('payments', 20)}</span><div><small>Card</small><b>${money(by('card'))}</b></div></div>
    <div class="stat"><span class="s-ic dark">${ic('phone', 20)}</span><div><small>UPI</small><b>${money(by('upi'))}</b></div></div>
    <div class="stat"><span class="s-ic red">${ic('refresh', 20)}</span><div><small>Refunded</small><b>${money(refunded.reduce((s, o) => s + o.total, 0))}</b><em>${refunded.length} orders</em></div></div>`;
    let list = inRange.filter(o => (f.method === 'all' || o.method === f.method) && (f.status === 'all' || o.paymentStatus === f.status));
    if (q) list = list.filter(o => (o.id + ' ' + o.customerName + ' ' + o.ref).toLowerCase().includes(q));
    const shown = list.slice(0, f.limit);
    $('#payList').innerHTML = list.length ? `
    <table class="tbl"><thead><tr><th>Bill</th><th>Date</th><th>Customer</th><th>Method</th><th>Reference</th><th class="r">Amount</th><th>Status</th><th class="r">Actions</th></tr></thead>
    <tbody>${shown.map(o => `<tr>
      <td><b>${esc(o.id)}</b></td><td class="nowrap">${fmtDT(o.createdAt)}</td>
      <td>${esc(o.customerName) || '<span class="muted">Walk-in</span>'}</td>
      <td>${o.paymentStatus === 'pending' || o.paymentStatus === 'void' ? '<span class="muted">–</span>' : `<span class="badge m-${o.method}">${METHOD_LABEL[o.method]}</span>`}</td>
      <td>${esc(o.ref) || '<span class="muted">–</span>'}</td>
      <td class="r"><b>${money(o.total)}</b></td>
      <td><span class="badge ${payBadgeClass(o.paymentStatus)}">${PAY_LABEL[o.paymentStatus] || o.paymentStatus}</span></td>
      <td class="r acts">
        <button class="icon-btn dark" data-action="view-order" data-id="${o.id}" title="View bill" aria-label="View bill">${ic('eye', 17)}</button>
        <button class="icon-btn dark" data-action="print" data-id="${o.id}" title="Print bill" aria-label="Print bill">${ic('printer', 17)}</button>
        ${o.paymentStatus === 'pending' && o.status !== 'cancelled' ? `<button class="btn gold xs" data-action="collect-pay" data-id="${o.id}">Collect</button>` : ''}
        ${isAdmin() && o.paymentStatus === 'paid' ? `<button class="btn outline xs red" data-action="refund" data-id="${o.id}">Refund</button>` : ''}
      </td></tr>`).join('')}</tbody></table>
    ${list.length > shown.length ? `<div class="more"><button class="btn outline sm" data-action="pay-more">Show more (${list.length - shown.length} left)</button></div>` : ''}`
        : `<div class="empty"><div class="e-ic">💳</div><h4>No payments found</h4><p>Payments appear here as soon as a bill is paid.</p></div>`;
}

/* ==========================================================================
   SETTINGS (admin)
   ========================================================================== */
function viewSettings() {
    const S = DB.settings;
    $('#view').innerHTML = `
  <div class="page-head"><h1>Settings</h1></div>
  <div class="settings-grid">
    <form class="card pad" data-form="profile" novalidate>
      <div class="card-head"><h3>Restaurant profile</h3></div>
      <div class="field"><label>Restaurant name</label><input name="name" value="${esc(S.name)}" maxlength="30"></div>
      <div class="field"><label>Tagline</label><input name="tagline" value="${esc(S.tagline)}" maxlength="50"></div>
      <div class="field"><label>Address <small>(printed on bills)</small></label><textarea name="address" rows="2">${esc(S.address)}</textarea></div>
      <div class="row"><div class="field"><label>Phone</label><input name="phone" value="${esc(S.phone)}"></div><div class="field"><label>Email</label><input name="email" value="${esc(S.email)}"></div></div>
      <div class="field"><label>GSTIN</label><input name="gstin" value="${esc(S.gstin)}" maxlength="15"></div>
      <button class="btn gold" type="submit">Save profile</button>
    </form>

    <form class="card pad" data-form="billing" novalidate>
      <div class="card-head"><h3>Billing &amp; offers</h3></div>
      <div class="row"><div class="field"><label>GST rate (%)</label><input name="taxRate" type="number" min="0" max="28" step="0.5" value="${S.taxRate}"></div>
      <div class="field"><label>Delivery charge (₹)</label><input name="deliveryFee" type="number" min="0" step="1" value="${S.deliveryFee}"></div></div>
      <label class="check"><input type="checkbox" name="offerOn" ${S.offerOn ? 'checked' : ''}><span></span>Show &amp; apply the “spend more, save more” offer</label>
      <div class="row"><div class="field"><label>Offer minimum bill (₹)</label><input name="offerMin" type="number" min="0" step="50" value="${S.offerMin}"></div>
      <div class="field"><label>Discount (%)</label><input name="offerPct" type="number" min="1" max="90" step="1" value="${S.offerPct}"></div></div>
      <p class="hint">Coupons you can give customers: ${Object.entries(COUPONS).map(([k, v]) => `<b>${k}</b> (${v.text})`).join(', ')}.</p>
      <button class="btn gold" type="submit">Save billing settings</button>
    </form>

    <section class="card pad">
      <div class="card-head"><h3>Staff accounts</h3></div>
      <div class="user-list">${DB.users.map(u => `
        <div class="user-row"><span class="mini-av">${esc(u.name.charAt(0).toUpperCase())}</span>
          <div><b>${esc(u.name)}</b><small>@${esc(u.username)}</small></div>
          <span class="role-badge ${u.role}">${u.role === 'admin' ? 'Admin' : 'Staff'}</span>
          ${u.id === state.user.id ? '<span class="muted">You</span>' : `<button class="icon-btn dark red" data-action="del-user" data-id="${u.id}" aria-label="Remove user">${ic('trash', 16)}</button>`}</div>`).join('')}</div>
      <form data-form="user-add" class="add-user" novalidate>
        <h4>Add a team member</h4>
        <div class="row"><div class="field"><label>Name</label><input name="name" maxlength="30" autocomplete="off"></div><div class="field"><label>Username</label><input name="username" maxlength="20" autocomplete="off"></div></div>
        <div class="row"><div class="field"><label>Password</label><input name="password" type="text" autocomplete="off" placeholder="min. 4 characters"></div>
        <div class="field"><label>Role</label><select name="role"><option value="staff">Staff – orders, bookings, payments</option><option value="admin">Admin – full access</option></select></div></div>
        <button class="btn dark" type="submit">${ic('plus', 15)} Add user</button>
      </form>
    </section>

    <section class="card pad">
      <div class="card-head"><h3>Your data</h3></div>
      <p class="hint">Everything is saved in this browser. Download a backup before clearing browser data or moving to another computer.</p>
      <div class="data-actions">
        <button class="btn outline" data-action="export-json">${ic('download', 16)} Download backup</button>
        <label class="btn outline file-btn">${ic('upload', 16)} Restore backup<input type="file" accept="application/json,.json" data-change="import-json" hidden></label>
        <button class="btn outline" data-action="clear-orders">${ic('trash', 16)} Delete all orders</button>
        <button class="btn outline red" data-action="reset-demo">${ic('refresh', 16)} Reset to demo data</button>
      </div>
    </section>
  </div>`;
}
function saveProfileForm(form) {
    const f = new FormData(form), name = (f.get('name') || '').trim();
    if (!name) return toast('Restaurant name cannot be empty', 'error');
    Object.assign(DB.settings, { name, tagline: (f.get('tagline') || '').trim(), address: (f.get('address') || '').trim(), phone: (f.get('phone') || '').trim(), email: (f.get('email') || '').trim(), gstin: (f.get('gstin') || '').trim() });
    saveDB(); renderTopbar(); document.title = name + ' – Restaurant Management'; toast('Profile saved');
}
function saveBillingForm(form) {
    const f = new FormData(form);
    const tax = parseFloat(f.get('taxRate')), del = parseFloat(f.get('deliveryFee')), min = parseFloat(f.get('offerMin')), pct = parseFloat(f.get('offerPct'));
    if (isNaN(tax) || tax < 0 || tax > 28) return toast('GST rate must be between 0 and 28', 'error');
    if (isNaN(del) || del < 0) return toast('Enter a valid delivery charge', 'error');
    if (isNaN(min) || min < 0) return toast('Enter a valid minimum bill amount', 'error');
    if (isNaN(pct) || pct < 1 || pct > 90) return toast('Discount must be between 1 and 90 percent', 'error');
    Object.assign(DB.settings, { taxRate: tax, deliveryFee: del, offerMin: min, offerPct: pct, offerOn: !!f.get('offerOn') });
    saveDB(); renderOfferCard(); updateCartUI(); toast('Billing settings saved');
}
function addUserForm(form) {
    const f = new FormData(form);
    const name = (f.get('name') || '').trim(), username = (f.get('username') || '').trim().toLowerCase(), password = f.get('password') || '';
    if (!name || !username) return toast('Enter a name and username', 'error');
    if (!/^[a-z0-9._-]{3,20}$/.test(username)) return toast('Username: 3–20 letters, numbers, dot, dash or underscore', 'error');
    if (password.length < 4) return toast('Password needs at least 4 characters', 'error');
    if (DB.users.some(u => u.username.toLowerCase() === username)) return toast('That username is already taken', 'error');
    DB.users.push({ id: uid('u'), username, name, password, role: f.get('role') === 'admin' ? 'admin' : 'staff' });
    saveDB(); refreshView(); toast(name + ' can now sign in');
}
function openPasswordModal() {
    openModal({
        title: 'Change password', size: 'sm',
        body: `<form data-form="password" novalidate>
      <div class="field"><label>Current password</label><input name="cur" type="password" autocomplete="current-password" data-focus></div>
      <div class="field"><label>New password</label><input name="new" type="password" autocomplete="new-password" placeholder="min. 4 characters"></div>
      <div class="field"><label>Confirm new password</label><input name="again" type="password" autocomplete="new-password"></div>
      <div class="m-foot"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button class="btn gold" type="submit">Update password</button></div></form>`
    });
}
function savePasswordForm(form) {
    const f = new FormData(form), u = DB.users.find(x => x.id === state.user.id);
    if (f.get('cur') !== u.password) return toast('Current password is incorrect', 'error');
    if ((f.get('new') || '').length < 4) return toast('New password needs at least 4 characters', 'error');
    if (f.get('new') !== f.get('again')) return toast('The new passwords do not match', 'error');
    u.password = f.get('new'); saveDB(); closeModal(); toast('Password updated');
}
function importBackup(file) {
    const fr = new FileReader();
    fr.onload = () => {
        try {
            const data = JSON.parse(fr.result);
            if (!data || !Array.isArray(data.dishes) || !Array.isArray(data.orders) || !Array.isArray(data.users) || !data.users.length) throw new Error('bad');
            askConfirm({ title: 'Restore this backup?', msg: 'This replaces all current dishes, orders, bookings and customers with the backup.', ok: 'Restore', danger: true }, () => {
                DB = data; saveDB(); location.reload();
            });
        } catch (e) { toast('That file is not a valid Flavor House backup', 'error'); }
    };
    fr.readAsText(file);
}

/* ==========================================================================
   EVENTS  –  one click handler for the whole app (data-action="…")
   ========================================================================== */
function updateChange() {
    const out = $('#changeOut');
    if (out) out.textContent = changeText(calcTotals(cartLines(), state.cart.type, state.cart.coupon));
}
function gotoCart() {
    const go = () => {
        const b = $('#basket');
        if (!b) return;
        b.scrollIntoView({ behavior: 'smooth', block: 'start' });
        b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
    };
    if (state.route !== 'menu') { location.hash = '#/menu'; setTimeout(go, 150); } else go();
}
function setOrderStatusAndRefresh(id, status, msg) {
    setOrderStatus(id, status);
    toast(msg);
    refreshView();
}

const ACTIONS = {
    backdrop(t, e) { if (e.target === t) closeModal(); },
    'modal-close'() { closeModal(); },
    'confirm-yes'() { const cb = confirmCb; closeModal(); if (cb) cb(); },
    'toggle-sidebar'() { toggleSidebar(); },
    'toggle-user'() { $('#userMenu').classList.toggle('open'); },
    logout() { logout(); },
    'change-pass'() { $('#userMenu').classList.remove('open'); openPasswordModal(); },
    'book-table'() { openBookingModal(); },
    'goto-cart'() { gotoCart(); },
    'goto-menu'() { location.hash = '#/menu'; },
    'toggle-theme'() { applyTheme(getTheme() === 'bw' ? 'gold' : 'bw'); },
    'collect-pay'(t) { openCollectModal(t.dataset.id, false); },
    'bk-order'(t) {
        const b = DB.bookings.find(x => x.id === t.dataset.id);
        if (!b) return;
        state.cart.type = 'dine-in'; saveCart();
        state.co = freshCheckoutState(); Object.assign(state.co, { table: b.tableId, name: b.name, phone: b.phone, note: b.note || '' });
        location.hash = '#/menu'; updateCartUI();
        toast(`Add dishes for ${b.name} – table ${(tableById(b.tableId) || {}).name || ''} is already selected`);
    },

    /* menu & cart */
    cat(t) { state.cat = t.dataset.cat; if (state.route === 'menu') { renderChips(); renderDishGrid(); } },
    add(t) { cartAdd(t.dataset.id); },
    inc(t) { cartAdd(t.dataset.id); },
    dec(t) { cartSet(t.dataset.id, cartQty(t.dataset.id) - 1); },
    rm(t) { cartSet(t.dataset.id, 0); },
    'clear-cart'() { askConfirm({ title: 'Clear the basket?', msg: 'All dishes will be removed from the current basket.', ok: 'Clear basket', danger: true }, () => { cartClear(); toast('Basket cleared'); }); },
    'set-type'(t) { state.cart.type = t.dataset.type; saveCart(); updateCartUI(); if ($('#coForm')) renderCheckout(); },
    'apply-coupon'() { const i = $('#basket [data-input="coupon"]'); applyCoupon(i ? i.value : state.couponDraft); },
    'remove-coupon'() { state.cart.coupon = null; cartChanged(); },
    checkout() { openCheckout(); },
    'pay-method'(t) { state.co.method = t.dataset.method; renderCheckout(); },
    'quick-cash'(t) { state.co.tendered = t.dataset.v; const i = $('#coForm [data-k="tendered"]'); if (i) i.value = t.dataset.v; updateChange(); },

    /* orders */
    print(t) { printInvoice(t.dataset.id); },
    'view-order'(t) { showInvoice(t.dataset.id, false); },
    advance(t) {
        const o = orderById(t.dataset.id);
        if (!o || !NEXT_STATUS[o.status]) return;
        const next = NEXT_STATUS[o.status];
        if (next === 'completed' && o.paymentStatus === 'pending') return openCollectModal(o.id, true);
        setOrderStatusAndRefresh(o.id, next, `${o.id} is now ${STATUS_LABEL[next].toLowerCase()}`);
    },
    'cancel-order'(t) {
        const id = t.dataset.id;
        askConfirm({ title: 'Cancel this order?', msg: `Order <b>${esc(id)}</b> will be cancelled and its payment marked as refunded.`, ok: 'Cancel order', danger: true },
            () => setOrderStatusAndRefresh(id, 'cancelled', id + ' cancelled and refunded'));
    },
    'ord-status'(t) { state.ord.status = t.dataset.s; state.ord.limit = 40; renderOrdersList(); },
    'ord-more'() { state.ord.limit += 40; renderOrdersList(); },

    /* bookings */
    'bk-tab'(t) { state.bk.tab = t.dataset.tab; viewBookings(); },
    'pick-table'(t) { openBookingModal(t.dataset.id); },
    'bk-complete'(t) { const b = DB.bookings.find(x => x.id === t.dataset.id); if (b) { b.status = 'completed'; saveDB(); toast('Booking marked as done'); refreshView(); } },
    'bk-cancel'(t) {
        const b = DB.bookings.find(x => x.id === t.dataset.id);
        if (!b) return;
        askConfirm({ title: 'Cancel this booking?', msg: `${esc(b.name)}’s booking for ${fmtD(b.date)} at ${fmtT(b.time)} will be cancelled.`, ok: 'Cancel booking', danger: true },
            () => { const bb = DB.bookings.find(x => x.id === b.id); if (bb) { bb.status = 'cancelled'; saveDB(); toast('Booking cancelled'); refreshView(); } });
    },

    /* dishes & categories (admin) */
    'add-dish'() { if (isAdmin()) openDishModal(); },
    'edit-dish'(t) { if (isAdmin()) openDishModal(t.dataset.id); },
    'del-dish'(t) {
        const d = dishById(t.dataset.id);
        if (!d || !isAdmin()) return;
        askConfirm({ title: 'Delete this dish?', msg: `<b>${esc(d.name)}</b> will be removed from the menu. Past bills keep their record.`, ok: 'Delete dish', danger: true }, () => {
            DB.dishes = DB.dishes.filter(x => x.id !== d.id);
            state.cart.items = state.cart.items.filter(i => i.id !== d.id);
            saveDB(); saveCart(); updateCartUI(); toast(d.name + ' deleted');
        });
    },
    'toggle-dish'(t) {
        const d = dishById(t.dataset.id);
        if (!d || !isAdmin()) return;
        d.available = !d.available; saveDB(); updateCartUI();
        toast(d.name + (d.available ? ' is available again' : ' marked as sold out'));
    },
    'manage-cats'() { if (isAdmin()) openCatModal(); },
    'del-cat'(t) {
        const c = t.dataset.cat;
        if (DB.dishes.some(d => d.cat === c)) return toast('Move or delete this category’s dishes first', 'error');
        DB.categories = DB.categories.filter(x => x !== c);
        if (state.cat === c) state.cat = 'All';
        saveDB(); refreshCatModal(); toast('Category deleted');
    },
    'pick-emoji'(t) { const i = $('#dishEmoji'); if (i) i.value = t.dataset.e; },

    /* customers */
    'add-customer'() { openCustomerModal(); },
    'edit-customer'(t) { openCustomerModal(t.dataset.id); },
    'cust-history'(t) { openCustomerHistory(t.dataset.id); },
    'del-customer'(t) {
        const c = customerById(t.dataset.id);
        if (!c || !isAdmin()) return;
        askConfirm({ title: 'Delete this customer?', msg: `<b>${esc(c.name)}</b> will be removed. Their past bills stay in Orders.`, ok: 'Delete customer', danger: true }, () => {
            DB.orders.forEach(o => { if (o.customerId === c.id) o.customerId = ''; });
            DB.customers = DB.customers.filter(x => x.id !== c.id);
            saveDB(); refreshView(); toast('Customer deleted');
        });
    },

    /* reports & payments */
    'rep-range'(t) { state.rep.range = t.dataset.r; viewReports(); },
    'export-csv'() { exportCSV(); },
    'pay-more'() { state.pay.limit += 40; renderPaymentsList(); },
    refund(t) {
        const o = orderById(t.dataset.id);
        if (!o || !isAdmin()) return;
        askConfirm({ title: 'Refund this payment?', msg: `<b>${money(o.total)}</b> will be refunded for <b>${esc(o.id)}</b> and the order cancelled.`, ok: 'Refund ' + money(o.total), danger: true },
            () => setOrderStatusAndRefresh(o.id, 'cancelled', money(o.total) + ' refunded for ' + o.id));
    },

    /* settings */
    'del-user'(t) {
        const u = DB.users.find(x => x.id === t.dataset.id);
        if (!u || u.id === state.user.id) return;
        if (u.role === 'admin' && DB.users.filter(x => x.role === 'admin').length < 2) return toast('At least one admin account is required', 'error');
        askConfirm({ title: 'Remove this user?', msg: `<b>${esc(u.name)}</b> (@${esc(u.username)}) will no longer be able to sign in.`, ok: 'Remove user', danger: true },
            () => { DB.users = DB.users.filter(x => x.id !== u.id); saveDB(); refreshView(); toast('User removed'); });
    },
    'export-json'() { downloadFile(`flavor-house-backup-${todayStr()}.json`, JSON.stringify(DB, null, 2), 'application/json'); toast('Backup downloaded'); },
    'clear-orders'() {
        askConfirm({ title: 'Delete all orders?', msg: 'Every order, bill and payment record will be permanently deleted. Dishes, customers and bookings stay.', ok: 'Delete all orders', danger: true },
            () => { DB.orders = []; saveDB(); updateBadges(); toast('All orders deleted'); });
    },
    'reset-demo'() {
        askConfirm({ title: 'Reset to demo data?', msg: 'This replaces everything – dishes, orders, customers, bookings and users – with the original demo data.', ok: 'Reset everything', danger: true },
            () => { try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(CART_KEY); } catch (e) { /* ignore */ } location.reload(); });
    }
};

document.addEventListener('click', e => {
    if (!e.target.closest('#userMenu')) $('#userMenu').classList.remove('open');
    if (e.target.closest('a.nav-item')) closeSidebar();
    const t = e.target.closest('[data-action]');
    if (!t || t.disabled) return;
    const fn = ACTIONS[t.dataset.action];
    if (fn) { if (state.user && !['backdrop', 'modal-close', 'confirm-yes'].includes(t.dataset.action) && !modalOpen()) syncDB(); fn(t, e); }
});

/* ---------- live inputs ---------- */
const INPUTS = {
    search(el) {
        state.q = el.value;
        $$('[data-input="search"]').forEach(i => { if (i !== el) i.value = state.q; });
        if (state.route !== 'menu') { location.hash = '#/menu'; return; }
        renderDishGrid();
    },
    coupon(el) { state.couponDraft = el.value; },
    co(el) {
        const k = el.dataset.k; let v = el.value;
        if (k === 'phone') { v = digits(v).slice(0, 10); el.value = v; }
        else if (k === 'cardNo') { v = digits(v).slice(0, 16).replace(/(.{4})(?=.)/g, '$1 '); el.value = v; }
        else if (k === 'exp') { let d = digits(v).slice(0, 4); if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2); v = d; el.value = v; }
        else if (k === 'cvv') { v = digits(v).slice(0, 4); el.value = v; }
        else if (k === 'tendered') { v = v.replace(/[^\d.]/g, ''); el.value = v; }
        state.co[k] = v;
        if (k === 'tendered') updateChange();
    },
    ord(el) { state.ord[el.dataset.k] = el.value; state.ord.limit = 40; renderOrdersList(); },
    pay(el) { state.pay[el.dataset.k] = el.value; state.pay.limit = 40; renderPaymentsList(); },
    cust(el) { state.cu.q = el.value; renderCustomerList(); },
    'bk-refresh'(el) { refreshBookingTables(el.form); }
};
document.addEventListener('input', e => {
    const el = e.target;
    if (el.matches && el.matches('input[name="phone"]')) el.value = digits(el.value).slice(0, 10);
    if (el.id === 'dishImg') {
        const d = $('#dishImgData'); if (d) d.value = '';
        const p = $('#dishPrev'); if (p) p.innerHTML = el.value.trim() ? `<img src="${esc(el.value.trim())}" alt="" onerror="this.remove()">` : '';
    }
    const h = el.closest && el.closest('[data-input]');
    if (h && INPUTS[h.dataset.input]) INPUTS[h.dataset.input](h, e);
});

const CHANGES = {
    'dish-file'(el) {
        const file = el.files && el.files[0];
        if (!file) return;
        readImageFile(file, url => {
            $('#dishImgData').value = url; $('#dishImg').value = '';
            $('#dishPrev').innerHTML = `<img src="${url}" alt="">`;
        });
    },
    'cat-rename'(el) {
        const old = el.dataset.old, name = el.value.trim();
        if (!name || name === old) { el.value = old; return; }
        if (DB.categories.some(c => c.toLowerCase() === name.toLowerCase() && c !== old)) { el.value = old; return toast('That category already exists', 'error'); }
        DB.categories = DB.categories.map(c => c === old ? name : c);
        DB.dishes.forEach(d => { if (d.cat === old) d.cat = name; });
        if (state.cat === old) state.cat = name;
        saveDB(); refreshCatModal(); toast('Category renamed');
    },
    'import-json'(el) { if (el.files && el.files[0]) importBackup(el.files[0]); el.value = ''; }
};
document.addEventListener('change', e => {
    const h = e.target.closest && e.target.closest('[data-change]');
    if (h && CHANGES[h.dataset.change]) CHANGES[h.dataset.change](h, e);
});

/* ---------- forms ---------- */
const FORMS = {
    checkout: submitCheckout,
    collect: collectPaymentForm,
    dish: saveDishForm,
    booking: saveBookingForm,
    customer: saveCustomerForm,
    profile: saveProfileForm,
    billing: saveBillingForm,
    'user-add': addUserForm,
    password: savePasswordForm,
    'cat-add'(form) {
        const name = (new FormData(form).get('name') || '').trim();
        if (!name) return toast('Enter a category name', 'error');
        if (DB.categories.some(c => c.toLowerCase() === name.toLowerCase())) return toast('That category already exists', 'error');
        DB.categories.push(name); saveDB(); refreshCatModal(); toast(name + ' added');
    }
};
document.addEventListener('submit', e => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    if (FORMS[form.dataset.form]) FORMS[form.dataset.form](form);
});

/* ---------- keyboard & window ---------- */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#modalRoot').innerHTML) closeModal();
    else { closeSidebar(); $('#userMenu').classList.remove('open'); }
});
window.addEventListener('hashchange', () => { if (state.user) renderRoute(); });
window.addEventListener('resize', () => { if (!isMobile()) closeSidebar(); });
$('#scrim').addEventListener('click', closeSidebar);

/* ---------- login screen wiring ---------- */
$('#loginForm').addEventListener('submit', e => { e.preventDefault(); doLogin(); });
$('#lfEye').addEventListener('click', () => {
    const p = $('#lfPass'), show = p.type === 'password';
    p.type = show ? 'text' : 'password';
    $('#lfEye').innerHTML = ic(show ? 'eyeoff' : 'eye', 18);
    $('#lfEye').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});
$$('.demo-chip[data-demo]').forEach(b => b.addEventListener('click', () => {
    const [u, p] = b.dataset.demo.split('|');
    $('#lfUser').value = u; $('#lfPass').value = p; $('#lfError').textContent = '';
    $('#lfSubmit').focus();
}));
$$('#roleTabs button').forEach(b => b.addEventListener('click', () => setLoginRole(b.dataset.role)));
$('#custLoginForm').addEventListener('submit', e => { e.preventDefault(); customerLogin(); });
$('#clPhone').addEventListener('input', e => { e.target.value = digits(e.target.value).slice(0, 10); });
$('#demoCust').addEventListener('click', () => { $('#clName').value = 'Aarav Sharma'; $('#clPhone').value = '9876501234'; $('#clError').textContent = ''; });
$('#lfForgot').addEventListener('click', e => { e.preventDefault(); toast('Ask an admin to reset it in Settings → Staff accounts'); });

/* ==========================================================================
   VERSION 2 EXTRAS
   theme switch · separate Admin / Staff / Customer sign-in · live sync between
   screens · "collect payment" for online orders · mobile table labels
   ========================================================================== */

/* ---------- theme: Gold (default) or Black & White ---------- */
const THEME_KEY = 'fh_theme';
const BW_COLORS = ['#111111', '#555555', '#999999', '#CCCCCC', '#333333', '#777777', '#AAAAAA', '#DDDDDD'];
const getTheme = () => document.documentElement.getAttribute('data-theme') === 'bw' ? 'bw' : 'gold';
const chartCol = i => (getTheme() === 'bw' ? BW_COLORS : CHART_COLORS)[i % CHART_COLORS.length];
function applyTheme(t, quiet) {
    const bw = t === 'bw';
    if (bw) document.documentElement.setAttribute('data-theme', 'bw'); else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem(THEME_KEY, bw ? 'bw' : 'gold'); } catch (e) { /* ignore */ }
    const meta = $('#metaTheme'); if (meta) meta.setAttribute('content', bw ? '#000000' : '#111111');
    $$('[data-theme-icon]').forEach(e => { e.textContent = bw ? '◑' : '◐'; });
    $$('[data-theme-label]').forEach(e => { e.textContent = bw ? 'Gold theme' : 'Black & White theme'; });
    if (!quiet) {
        toast(bw ? 'Black & White theme on' : 'Gold theme on');
        if (state.user) refreshView();           // charts pick up the new colours
    }
}

/* ---------- screens (used by CSS to place the assistant button etc.) ---------- */
function setScreen(s) { document.body.dataset.screen = s; if (s !== 'cust') document.body.classList.remove('k-has-bar', 'k-lock'); }

/* ---------- login: Admin / Staff / Customer ---------- */
let loginRole = 'admin';
function setLoginRole(r) {
    if (!['admin', 'staff', 'customer'].includes(r)) r = 'admin';
    loginRole = r;
    try { localStorage.setItem('fh_lastrole', r); } catch (e) { /* ignore */ }
    const card = $('#loginCard');
    card.dataset.role = r;
    $$('#roleTabs button').forEach(b => { const on = b.dataset.role === r; b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    $$('.demo-chip[data-for]').forEach(c => { c.style.display = c.dataset.for === r ? '' : 'none'; });
    $('#lgTitle').textContent = r === 'customer' ? 'Hungry? Let’s order' : r === 'admin' ? 'Admin sign in' : 'Staff sign in';
    $('#lgSub').innerHTML = r === 'customer' ? `Order food or book a table at <b>${esc(DB.settings.name)}</b>` : r === 'admin' ? `Full control of <b>${esc(DB.settings.name)}</b>` : `Orders, bookings and payments at <b>${esc(DB.settings.name)}</b>`;
    $('#lfError').textContent = ''; $('#clError').textContent = '';
    $('#lfUser').value = ''; $('#lfPass').value = '';
}
function customerLogin() {
    const name = $('#clName').value.trim(), ph = digits($('#clPhone').value);
    const err = m => { $('#clError').textContent = m; const c = $('#loginCard'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); };
    $('#clError').textContent = '';
    if (name.length < 2) return err('Enter your name');
    if (ph.length !== 10) return err('Enter a valid 10-digit mobile number');
    syncDB();
    findOrCreateCustomer(name, ph); saveDB();
    const prof = { name, phone: ph };
    try {
        const keep = $('#clRemember').checked;
        (keep ? localStorage : sessionStorage).setItem('fh_customer', JSON.stringify(prof));
        (keep ? sessionStorage : localStorage).removeItem('fh_customer');
        localStorage.setItem('fh_cphone', ph);
    } catch (e) { /* ignore */ }
    K.enter(prof);
}

/* ---------- live sync: another tab / window changed the data ---------- */
let pendingBeep = false;
function modalOpen() { return !!$('#modalRoot').innerHTML.trim(); }
function onExternalChange() {
    if (state.user && modalOpen()) return;                       // never swap data under an open form – the next poll picks it up
    const before = new Set(DB.orders.map(o => o.id));
    if (!syncDB()) return;
    if (!state.user) return;                                     // customer side refreshes itself (K.check)
    const fresh = DB.orders.filter(o => !before.has(o.id) && o.cashier === 'Online');
    renderOfferCard(); renderTopbar(); updateBadges(); updateCartUI();
    const typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && $('#view').contains(document.activeElement);
    if (!typing && ['dashboard', 'orders', 'bookings', 'payments', 'customers'].includes(state.route)) ROUTES[state.route].render();
    if (state.route === 'menu') { renderChips(); renderDishGrid(); }
    if (fresh.length) {
        const o = fresh[0];
        toast(`🔔 New online order ${o.id} – ${o.items.reduce((s, i) => s + i.qty, 0)} items, ${money(o.total)}`);
        beepStaff();
    }
}
window.addEventListener('storage', e => { if (e.key === STORE_KEY) onExternalChange(); });
setInterval(() => { if (!document.hidden) onExternalChange(); }, 4000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) onExternalChange(); });

/* ---------- payment status helpers + "Collect payment" ---------- */
const PAY_LABEL = { paid: 'Paid', pending: 'Unpaid', refunded: 'Refunded', void: 'Not charged' };
const payBadgeClass = s => s === 'paid' ? 'st-completed' : s === 'pending' ? 'st-unpaid st-pending' : s === 'refunded' ? 'st-cancelled' : 'st-cancelled';

function openCollectModal(id, thenComplete) {
    const o = orderById(id);
    if (!o) return;
    openModal({
        title: 'Collect payment', size: 'sm',
        body: `<form data-form="collect" data-id="${esc(o.id)}" data-complete="${thenComplete ? '1' : ''}" novalidate>
      <p class="confirm-msg">Bill <b>${esc(o.id)}</b> · ${esc(o.customerName || 'Walk-in')}<br><span class="muted">Amount to collect</span> <b style="font-size:22px">${money(o.total)}</b></p>
      <div class="field"><label>Payment method</label>
        <div class="pay-tabs">${Object.keys(METHOD_LABEL).map((m, i) => `<label class="pt"><input type="radio" name="method" value="${m}" ${i === 0 ? 'checked' : ''} hidden><span>${METHOD_LABEL[m]}</span></label>`).join('')}</div></div>
      <div class="field"><label>Amount received <small>(cash only, optional)</small></label><input name="tendered" inputmode="decimal" placeholder="${o.total}" autocomplete="off"></div>
      <div class="field"><label>Reference <small>(card / UPI, optional)</small></label><input name="ref" placeholder="Transaction id" autocomplete="off"></div>
      <div class="m-foot"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button class="btn gold" type="submit">Mark as paid ${money(o.total)}</button></div>
    </form>`
    });
    const f = $('#modalRoot form');
    const sync = () => { $$('.pt', f).forEach(l => l.classList.toggle('active', l.querySelector('input').checked)); };
    f.addEventListener('change', sync); sync();
}
function collectPaymentForm(form) {
    syncDB();
    const f = new FormData(form), o = orderById(form.dataset.id);
    if (!o) return closeModal();
    const method = f.get('method') || 'cash';
    let tendered = 0, change = 0;
    if (method === 'cash' && String(f.get('tendered') || '').trim()) {
        tendered = parseFloat(f.get('tendered'));
        if (isNaN(tendered) || tendered < o.total) return toast('Amount received is less than the bill total', 'error');
        change = round2(tendered - o.total);
    }
    o.method = method; o.paymentStatus = 'paid'; o.tendered = tendered; o.change = change;
    o.ref = (f.get('ref') || '').trim() || (method === 'cash' ? '' : (method === 'upi' ? 'UPI' : 'CARD') + Math.floor(Math.random() * 9e8 + 1e8));
    o.cashier = (o.cashier === 'Online' ? 'Online · ' : '') + state.user.name; o.paidAt = new Date().toISOString();
    if (form.dataset.complete === '1') o.status = 'completed';
    saveDB(); closeModal(); updateBadges();
    toast(`${money(o.total)} received for ${o.id}${form.dataset.complete === '1' ? ' – order completed' : ''}`);
    refreshView();
}

/* ---------- phones: label every table cell so rows can become cards ---------- */
function labelTables(root) {
    $$('table.tbl', root).forEach(t => {
        const heads = Array.from(t.querySelectorAll('thead th')).map(th => th.textContent.trim());
        t.querySelectorAll('tbody tr').forEach(tr => Array.from(tr.children).forEach((td, i) => { if (!td.hasAttribute('data-label')) td.setAttribute('data-label', heads[i] || ''); }));
    });
}
(function watchTables() {
    let raf = 0;
    const run = () => { raf = 0; labelTables(document); };
    const mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(run); });
    ['#view', '#modalRoot'].forEach(s => { const el = $(s); if (el) mo.observe(el, { childList: true, subtree: true }); });
})();

/* ---------- DEMO DATA TOP-UP (online orders, more bookings) ---------- */
function addDemoExtras(db) {
    if (db.demoV2) return;
    db.demoV2 = true; db.version = 2;
    const S = Object.assign({}, DEFAULT_SETTINGS, db.settings);
    const now = new Date(), sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dish = n => db.dishes.find(d => d.name === n);
    const who = ph => db.customers.find(c => c.phone === ph) || { id: '', name: '', phone: ph };
    const when = mins => new Date(Math.max(sod.getTime() + 60000, now.getTime() - mins * 60000));
    const mk = (ph, picks, type, tableId, status, pay, minsAgo, extra) => {
        const items = picks.map(([n, q]) => { const d = dish(n); return d ? { id: d.id, name: d.name, price: d.price, qty: q, cat: d.cat, veg: d.veg } : null; }).filter(Boolean);
        if (!items.length) return;
        const c = who(ph), t = calcTotals(items, type, null, S);
        db.seq = (db.seq || 1000) + 1;
        db.orders.push(Object.assign({
            id: 'FH-' + db.seq, no: db.seq, createdAt: when(minsAgo).toISOString(), items, type, tableId: type === 'dine-in' ? tableId : '',
            address: type === 'delivery' ? '48 Vijay Nagar Main Rd, Indore' : '', customerId: c.id, customerName: c.name, phone: c.phone, note: '',
            ...t, method: 'cash', tendered: 0, change: 0, ref: '', paymentStatus: pay, status, cashier: 'Online'
        }, extra || {}));
    };
    /* customer "Aarav" (9876501234) has a live order – log in as him to see tracking */
    mk('9876501234', [['Paneer Butter Masala', 1], ['Butter Naan', 3], ['Sweet Lassi', 2]], 'dine-in', 't8', 'preparing', 'pending', 12);
    mk('9822012345', [['Masala Dosa', 2], ['Masala Chai', 2]], 'takeaway', '', 'pending', 'pending', 3);
    mk('9926123456', [['Chicken Biryani', 2], ['Gulab Jamun', 2]], 'delivery', '', 'ready', 'pending', 30);
    mk('9981678901', [['Veg Pizza', 1], ['Cold Coffee', 1]], 'takeaway', '', 'completed', 'paid', 26 * 60, { method: 'upi', ref: 'UPI482915306', paidAt: when(26 * 60).toISOString() });
    mk('9770789012', [['Veg Thali', 2], ['Fresh Lime Soda', 2]], 'dine-in', 't6', 'completed', 'paid', 200, { method: 'cash', tendered: 600, change: 0, paidAt: when(180).toISOString() });
    mk('9300567890', [['Hakka Noodles', 1], ['Veg Manchurian', 1]], 'delivery', '', 'cancelled', 'void', 40 * 60);
    db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    /* more bookings */
    const day = k => ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + k));
    db.bookings = db.bookings || [];
    [
        ['Neha Agarwal', '9981678901', 0, '21:00', 3, 't6', 'Window seat please', 'confirmed'],
        ['Aditya Rao', '9770789012', 1, '12:30', 2, 't3', '', 'confirmed'],
        ['Pooja Mishra', '9039012345', 1, '19:30', 10, 't10', 'Family dinner – 2 high chairs', 'confirmed'],
        ['Karan Joshi', '9300567890', 2, '20:00', 4, 't8', 'Birthday – small cake', 'confirmed'],
        ['Rahul Khanna', '9827901234', 5, '13:00', 6, 't7', 'Corporate lunch', 'confirmed'],
        ['Ananya Gupta', '9755456789', -1, '20:30', 4, 't4', '', 'completed'],
        ['Vikram Singh', '9425345678', -2, '19:00', 2, 't5', 'Cancelled by guest', 'cancelled']
    ].forEach(([name, phone, off, time, guests, tableId, note, status], i) => {
        db.bookings.push({ id: 'bd' + (i + 1), name, phone, date: day(off), time, guests, tableId, note, status, createdAt: new Date().toISOString() });
    });
}

/* make sure data saved by an older version of the app still works */
function migrateDB(db) {
    db.bookings = Array.isArray(db.bookings) ? db.bookings : [];
    db.customers = Array.isArray(db.customers) ? db.customers : [];
    db.tables = Array.isArray(db.tables) && db.tables.length ? db.tables : [2, 2, 4, 4, 4, 4, 6, 6, 8, 10].map((s, i) => ({ id: 't' + (i + 1), name: 'T' + (i + 1), seats: s }));
    db.categories = Array.isArray(db.categories) ? db.categories : ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts'];
    db.orders.forEach(o => { if (!o.paymentStatus) o.paymentStatus = 'paid'; if (!o.items) o.items = []; });
    addDemoExtras(db);
    return db;
}

function beepStaff() {
    try {
        const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
        o.connect(g); g.connect(a.destination); g.gain.value = .12; o.frequency.value = 660; o.start();
        setTimeout(() => o.frequency.value = 880, 160); setTimeout(() => { o.stop(); a.close(); }, 380);
    } catch (e) { /* ignore */ }
}

/* ==========================================================================
   CUSTOMER SIDE  (sign in / guest, browse, order, book a table, track + "order ready" alert)
   Uses the SAME saved database as the staff app:
     • a customer order appears in staff → Orders (and Dashboard "Live orders") at once
     • when staff press "Start cooking / Mark ready", the customer is notified
     • a customer booking appears in staff → Table Booking and blocks that table
     • customers are created / matched by phone number, so order history is shared
   (Both sides must run in the same browser – see README "How the data is shared".)
   ========================================================================== */
const K = (() => {
    const A = () => $('#custApp'), q = s => $(s, A());
    const NK = 'fh_cnotes', PK = 'fh_customer';
    let cat = 'All', type = 'dine-in', cart = {}, profile = null;
    try { cart = JSON.parse(localStorage.getItem('fh_ucart') || '{}') || {}; } catch (e) { cart = {}; }
    try { type = localStorage.getItem('fh_utype') || 'dine-in'; } catch (e) { /* ignore */ }
    const persist = () => { try { localStorage.setItem('fh_ucart', JSON.stringify(cart)); localStorage.setItem('fh_utype', type); } catch (e) { /* ignore */ } };
    const loadProfile = () => { try { return JSON.parse(localStorage.getItem(PK) || sessionStorage.getItem(PK) || 'null'); } catch (e) { return null; } };
    const phone = () => (profile && profile.phone) || localStorage.getItem('fh_cphone') || '';
    const notes = () => { try { return JSON.parse(localStorage.getItem(NK) || '{}'); } catch (e) { return {}; } };
    const setNotes = n => { try { localStorage.setItem(NK, JSON.stringify(n)); } catch (e) { /* ignore */ } };
    const isOpen = () => !A().classList.contains('hidden');
    const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
    const narrow = () => window.matchMedia('(max-width: 820px)').matches;

    const lines = () => Object.entries(cart).map(([id, n]) => { const d = dishById(id); return d && d.available ? { id, name: d.name, price: d.price, qty: n, cat: d.cat, veg: d.veg } : null; }).filter(Boolean);
    const couponCode = () => { const el = q('#kcCp'); return el ? el.value.trim().toUpperCase() : ''; };
    const totals = () => { const c = couponCode(); return calcTotals(lines(), type, COUPONS[c] ? c : null); };

    /* ---------- menu ---------- */
    function draw(anim) {
        const s = q('#kq').value.toLowerCase().trim(), v = q('#kvf').value;
        q('#kchips').innerHTML = ['All', ...DB.categories].map(c => `<button class="k-chip ${c === cat ? 'k-on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
        const list = DB.dishes.filter(d => (cat === 'All' || d.cat === cat) && (d.name + ' ' + (d.desc || '')).toLowerCase().includes(s) && (!v || (v === 'v') === d.veg));
        q('#kgrid').classList.toggle('k-anim', !!anim);
        q('#kgrid').innerHTML = list.map((d, i) => {
            const n = cart[d.id] || 0;
            return `<article class="k-dish ${d.available ? '' : 'k-sold'}" style="--i:${Math.min(i, 16)}"><div class="k-im">${esc(d.emoji || '🍽️')}${d.img ? `<img src="${esc(d.img)}" alt="${esc(d.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>
            <div class="k-db"><h3>${esc(d.name)}<i class="k-dot ${d.veg ? 'k-v' : ''}" title="${d.veg ? 'Veg' : 'Non-veg'}"></i></h3><p>${esc(d.desc)}</p><div class="k-row"><b>${money(d.price)}</b>
            ${!d.available ? '<small>Sold out</small>' : n ? `<div class="k-qty"><button data-chg="${d.id}|-1" aria-label="Remove one">−</button><b>${n}</b><button data-chg="${d.id}|1" aria-label="Add one">+</button></div>` : `<button class="k-add" data-chg="${d.id}|1">Add</button>`}</div></div></article>`;
        }).join('');
        q('#kmsg').textContent = list.length ? '' : 'No dishes found. Try another word or category.';
    }

    /* ---------- basket drawer + sticky bar ---------- */
    function drawCart() {
        const L = lines(), t = calcTotals(L, type, null), S = DB.settings;
        const n = L.reduce((s, l) => s + l.qty, 0);
        q('#kcn').textContent = n;
        const need = S.offerOn && t.subtotal > 0 && t.subtotal < S.offerMin ? S.offerMin - t.subtotal : 0;
        q('#kcl').innerHTML = L.length ? L.map(l => `<div class="k-row"><span>${esc(l.name)}<br><small>${money(l.price)}</small></span><div class="k-qty"><button data-chg="${l.id}|-1" aria-label="Remove one">−</button><b>${l.qty}</b><button data-chg="${l.id}|1" aria-label="Add one">+</button></div><b>${money(l.price * l.qty)}</b></div>`).join('') : '<p style="text-align:center;color:#999;margin-top:40px">🛒<br>Your basket is empty</p>';
        q('#kcf').innerHTML = L.length ? `${need ? `<small class="k-hint">Add ${money(need)} more to get ${S.offerPct}% off</small>` : ''}<div class="k-tot"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>${t.discount ? `<div class="k-tot"><span>${esc(t.discountLabel)}</span><span>−${money(t.discount)}</span></div>` : ''}<div class="k-tot"><span>GST</span><span>${money(t.tax)}</span></div><div class="k-tot k-b"><span>Total</span><span>${money(t.total)}</span></div><button class="k-btn" data-checkout>Checkout</button>` : '';
        q('#kBarN').textContent = n + (n === 1 ? ' item' : ' items');
        q('#kBarT').textContent = money(t.total);
        q('#kBar').classList.toggle('k-show', n > 0);
        document.body.classList.toggle('k-has-bar', n > 0 && isOpen() && narrow());
    }
    function chg(id, k) {
        const d = dishById(id);
        if (k > 0 && d && !d.available) return toast(d.name + ' is sold out', 'error');
        cart[id] = Math.max(0, Math.min(20, (cart[id] || 0) + k));
        if (!cart[id]) delete cart[id];
        persist(); draw(); drawCart();
        if (k > 0) { const b = q('.k-cartb'); b.classList.remove('k-bump'); void b.offsetWidth; b.classList.add('k-bump'); }
    }

    /* ---------- panels (drawer + modals) ---------- */
    function lock() {
        const any = !!(A().querySelector('.k-modal.k-on') || q('#kdrawer').classList.contains('k-open'));
        A().classList.toggle('k-lock', any); document.body.classList.toggle('k-lock', any);
    }
    const cartOpen = o => { q('#kdrawer').classList.toggle('k-open', !!o); q('#kscrim').classList.toggle('k-on', !!o); lock(); };
    const close = () => { A().querySelectorAll('.k-modal').forEach(m => m.classList.remove('k-on')); q('#kscrim').classList.remove('k-on'); lock(); };
    function open(id) {
        cartOpen(0); close();
        q('#k' + id).classList.add('k-on'); q('#kscrim').classList.add('k-on'); lock();
        if (id === 'mBook') slots();
        if (id === 'mTrack') { const p = q('#ktP'); if (!p.value && phone()) p.value = phone(); track(); }
    }

    /* ---------- checkout ---------- */
    function checkout() {
        const L = lines();
        if (!L.length) return toast('Your basket is empty', 'error');
        syncDB();
        open('mCo');
        const ph = phone();
        const mine = ph ? DB.bookings.find(b => b.phone === ph && b.status === 'confirmed' && b.date === todayStr() && Math.abs(minutesOf(b.time) - nowMin()) <= 90) : null;
        q('#kcTb').innerHTML = DB.tables.map(t => {
            const st = tableStatus(t), mineHere = mine && mine.tableId === t.id;
            const busy = st.s === 'occupied' || (st.s === 'reserved' && !mineHere);
            return `<option value="${t.id}" ${busy ? 'disabled' : ''}>${esc(t.name)} (${t.seats} seats)${st.s === 'occupied' ? ' – occupied now' : busy ? ' – reserved' : mineHere ? ' – your booking' : ''}</option>`;
        }).join('');
        const pick = mine ? q('#kcTb option[value="' + mine.tableId + '"]') : Array.from(q('#kcTb').options).find(o => !o.disabled);
        if (pick) q('#kcTb').value = pick.value;
        if (!q('#kcName').value) q('#kcName').value = (profile && profile.name) || (mine && mine.name) || '';
        if (!q('#kcPh').value) q('#kcPh').value = ph;
        q('#ktyp').querySelectorAll('button').forEach(x => x.classList.toggle('k-on', x.dataset.t === type));
        upd();
    }
    function upd() {
        if (!q('#kfT')) return;
        q('#kfT').style.display = type === 'dine-in' ? '' : 'none';
        q('#kfA').style.display = type === 'delivery' ? '' : 'none';
        const t = totals();
        q('#kcS').textContent = money(t.subtotal);
        q('#kcDr').style.display = t.discount ? '' : 'none';
        q('#kcDl').textContent = t.discountLabel || 'Discount';
        q('#kcDv').textContent = '− ' + money(t.discount);
        q('#kcT').textContent = money(t.total);
    }

    function place() {
        syncDB();
        const name = q('#kcName').value.trim(), ph = digits(q('#kcPh').value), L = lines();
        if (!L.length) return toast('Your basket is empty', 'error');
        if (!name) return toast('Enter your name', 'error');
        if (ph.length !== 10) return toast('Enter a valid 10-digit phone number', 'error');
        if (type === 'delivery' && q('#kcAd').value.trim().length < 8) return toast('Enter the full delivery address', 'error');
        let tableId = '';
        if (type === 'dine-in') {
            tableId = q('#kcTb').value;
            if (!tableId) return toast('No table is free right now – choose Takeaway or book a table', 'error');
            if (tableStatus(tableById(tableId)).s === 'occupied') return toast('That table was just taken – pick another one', 'error');
        }
        const code = couponCode();
        if (code) {
            const c = COUPONS[code], sub = L.reduce((s, l) => s + l.price * l.qty, 0);
            if (!c) return toast('That coupon code is not valid', 'error');
            if (sub < c.min) return toast(`Add ${money(c.min - sub)} more to use ${code}`, 'error');
        }
        const c = findOrCreateCustomer(name, ph), t = calcTotals(L, type, code || null);
        DB.seq++;
        const o = {
            id: 'FH-' + DB.seq, no: DB.seq, createdAt: new Date().toISOString(),
            items: L.map(l => ({ id: l.id, name: l.name, price: l.price, qty: l.qty, cat: l.cat, veg: l.veg })), type,
            tableId, address: type === 'delivery' ? q('#kcAd').value.trim() : '',
            customerId: c.id, customerName: c.name, phone: ph, note: q('#kcNo').value.trim(), ...t,
            method: 'cash', tendered: 0, change: 0, ref: '', paymentStatus: 'pending', status: 'pending', cashier: 'Online'
        };
        DB.orders.unshift(o); saveDB();
        try { localStorage.setItem('fh_cphone', ph); } catch (e) { /* ignore */ }
        if (profile && !profile.phone) profile.phone = ph;
        const n = notes(); n[o.id] = 'pending'; setNotes(n);
        try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { /* ignore */ }
        cart = {}; persist(); q('#kcCp').value = ''; q('#kcNo').value = '';
        draw(); drawCart(); close();
        q('#ktP').value = ph;
        toast('Order ' + o.id + ' placed! We will notify you when it is ready 🔔');
        open('mTrack');
    }

    /* ---------- my orders + my bookings ---------- */
    const STATUS_TXT = { pending: 'Order received', preparing: 'Being prepared 👨‍🍳', ready: 'READY ✅', completed: 'Completed', cancelled: 'Cancelled' };
    const STEP = { pending: 1, preparing: 2, ready: 3, completed: 4 };
    function stepper(o) {
        const n = STEP[o.status] || 0;
        if (!n) return '';
        return `<div class="k-steps ${o.status === 'ready' ? 'k-r' : ''}">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'k-d' : ''}" style="--n:${i - 1}"></i>`).join('')}</div>
        <div class="k-stl"><span>Received</span><span>Cooking</span><span>Ready</span><span>Done</span></div>`;
    }
    function track() {
        syncDB();
        const ph = digits(q('#ktP').value), ok = ph.length === 10;
        const L = ok ? DB.orders.filter(o => o.phone === ph).slice(0, 10) : null;
        q('#ktR').innerHTML = !L ? '<small>Enter the phone number used while ordering.</small>' : L.length ? L.map(o => `<div class="k-ocard"><div class="k-row"><b>${esc(o.id)}</b><span class="k-st k-${o.status}">${STATUS_TXT[o.status] || o.status}</span></div>${stepper(o)}<span>${o.items.map(i => i.qty + '× ' + esc(i.name)).join(', ')}</span><div class="k-row"><small>${fmtDT(o.createdAt)} · ${TYPE_LABEL[o.type] || o.type}${o.tableId ? ' · ' + esc((tableById(o.tableId) || {}).name || '') : ''}</small><b>${money(o.total)}</b></div><small>${o.paymentStatus === 'paid' ? 'Paid ✔' : o.paymentStatus === 'refunded' ? 'Refunded' : o.status === 'cancelled' ? 'Not charged' : 'Pay at the restaurant / on delivery'}</small></div>`).join('') : '<small>No orders found for this number.</small>';
        const today = todayStr();
        const B = ok ? DB.bookings.filter(b => b.phone === ph && b.status !== 'completed' && (b.status === 'confirmed' ? b.date >= today : b.date >= today)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 8) : [];
        q('#ktB').innerHTML = !ok ? '' : B.length ? B.map(b => `<div class="k-bk"><div class="k-row"><b>${b.date === today ? 'Today' : fmtD(b.date)} · ${fmtT(b.time)}</b><span class="k-st ${b.status === 'confirmed' ? 'k-ready' : 'k-cancelled'}">${b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}</span></div><span>${b.guests} guest${b.guests > 1 ? 's' : ''} · Table ${esc((tableById(b.tableId) || {}).name || '-')}${b.note ? ' · ' + esc(b.note) : ''}</span>${b.status === 'confirmed' ? `<button class="k-mini" onclick="K.cancelBooking('${b.id}')">Cancel booking</button>` : ''}</div>`).join('') : '<small>No upcoming bookings.</small>';
    }
    function cancelBooking(id) {
        syncDB();
        const b = DB.bookings.find(x => x.id === id);
        if (!b || !confirm('Cancel your booking for ' + fmtD(b.date) + ' at ' + fmtT(b.time) + '?')) return;
        b.status = 'cancelled'; saveDB(); toast('Booking cancelled'); track();
    }

    /* ---------- table booking ---------- */
    function slots() {
        const dEl = q('#kbD'), sel = q('#kbTm');
        if (!dEl.value || dEl.value < todayStr()) dEl.value = todayStr();
        const d = dEl.value, now = nowMin();
        Array.from(sel.options).forEach(o => { o.disabled = d === todayStr() && minutesOf(o.value) <= now; });
        if (sel.selectedOptions[0] && sel.selectedOptions[0].disabled) { const f = Array.from(sel.options).find(o => !o.disabled); if (f) sel.value = f.value; }
        const hint = q('#kbHint'), g = +q('#kbG').value || 1;
        if (sel.selectedOptions[0] && sel.selectedOptions[0].disabled) { hint.textContent = 'No time slots are left today – pick another date'; hint.className = 'k-hint k-bad'; return; }
        const free = DB.tables.filter(t => t.seats >= g && !bookingConflict(t.id, d, sel.value));
        hint.className = 'k-hint' + (free.length ? '' : ' k-bad');
        hint.textContent = free.length ? `✅ ${free.length} table${free.length > 1 ? 's' : ''} free for ${g} guest${g > 1 ? 's' : ''} at ${fmtT(sel.value)}` : `❌ Fully booked at ${fmtT(sel.value)} for ${g} guests – try another time`;
    }
    function book() {
        syncDB();
        const n = q('#kbN').value.trim(), p = digits(q('#kbP').value), d = q('#kbD').value, tm = q('#kbTm').value, g = parseInt(q('#kbG').value, 10) || 0;
        const maxSeats = Math.max(...DB.tables.map(t => t.seats));
        if (!n) return toast('Enter your name', 'error');
        if (p.length !== 10) return toast('Enter a valid 10-digit phone number', 'error');
        if (!d || d < todayStr()) return toast('Choose today or a future date', 'error');
        if (!tm || (d === todayStr() && minutesOf(tm) <= nowMin())) return toast('Pick a time that has not passed', 'error');
        if (g < 1) return toast('Enter the number of guests', 'error');
        if (g > maxSeats) return toast(`We seat up to ${maxSeats} guests online – please call us for bigger groups`, 'error');
        if (DB.bookings.some(b => b.phone === p && b.status === 'confirmed' && b.date === d && Math.abs(minutesOf(b.time) - minutesOf(tm)) < 90)) return toast('You already have a booking around that time', 'error');
        const tb = DB.tables.filter(t => t.seats >= g).sort((a, b) => a.seats - b.seats).find(t => !bookingConflict(t.id, d, tm));
        if (!tb) return toast('No table is free at that time – try another slot', 'error');
        DB.bookings.push({ id: uid('b'), name: n, phone: p, date: d, time: tm, guests: g, tableId: tb.id, note: q('#kbNo').value.trim(), status: 'confirmed', source: 'online', createdAt: new Date().toISOString() });
        findOrCreateCustomer(n, p);
        saveDB();
        try { localStorage.setItem('fh_cphone', p); } catch (e) { /* ignore */ }
        q('#ktP').value = p; q('#kbNo').value = '';
        toast(`Table ${tb.name} booked for ${fmtD(d)} at ${fmtT(tm)} ✅`);
        open('mTrack');
    }

    /* ---------- "order ready" notification ---------- */
    function beep() {
        try {
            const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
            o.connect(g); g.connect(a.destination); g.gain.value = .15; o.frequency.value = 880; o.start();
            setTimeout(() => o.frequency.value = 1175, 200); setTimeout(() => { o.stop(); a.close(); }, 450);
        } catch (e) { /* ignore */ }
    }
    function readyAlert(o) {
        const where = o.type === 'dine-in' ? 'It will be served at your table.' : o.type === 'delivery' ? 'It is on its way to you.' : 'Please collect it at the counter.';
        const msg = `🔔 Your order ${o.id} is READY! ${where}`;
        $('#kBannerTxt').textContent = msg; $('#kBanner').classList.add('k-on');
        beep(); try { navigator.vibrate && navigator.vibrate([250, 120, 250]); } catch (e) { /* ignore */ }
        try { if ('Notification' in window && Notification.permission === 'granted') new Notification(DB.settings.name, { body: msg }); } catch (e) { /* ignore */ }
    }
    function check() {
        if (!isOpen()) return;
        const changed = syncDB();
        if (changed) { draw(); drawCart(); }
        const ph = phone();
        if (!ph) return;
        const seen = notes(); let ch = false;
        DB.orders.filter(o => o.phone === ph).forEach(o => {
            if (seen[o.id] === o.status) return;
            const known = seen[o.id] !== undefined, fresh = Date.now() - new Date(o.createdAt) < 6 * 36e5;
            if (o.status === 'ready' && (known || fresh)) readyAlert(o);
            else if (o.status === 'preparing' && known) toast(`👨‍🍳 Order ${o.id} is being prepared`);
            else if (o.status === 'cancelled' && known) toast(`Order ${o.id} was cancelled`, 'error');
            seen[o.id] = o.status; ch = true;
        });
        if (ch) setNotes(seen);
        if ((ch || changed) && q('#kmTrack').classList.contains('k-on')) track();
    }

    /* ---------- enter / leave ---------- */
    function enter(p) {
        profile = p && p.phone ? { name: p.name || '', phone: digits(p.phone) } : null;
        syncDB();
        $('#login').classList.add('hidden'); $('#app').classList.add('hidden');
        A().classList.remove('hidden');
        document.body.dataset.screen = 'cust';
        const first = profile && profile.name ? profile.name.split(' ')[0] : '';
        q('#kHi').textContent = first ? `Welcome back, ${first} 👋` : `Welcome to ${DB.settings.name} 👋`;
        q('.k-head h1').textContent = '🍴 ' + DB.settings.name;
        q('#kOut').style.display = profile ? '' : 'none';
        try { history.replaceState(null, '', '#customer'); } catch (e) { /* ignore */ }
        A().scrollTop = 0;
        draw(1); drawCart(); check();
    }
    function exit(role) {
        A().classList.add('hidden'); close(); cartOpen(0);
        document.body.classList.remove('k-has-bar');
        $('#login').classList.remove('hidden');
        document.body.dataset.screen = 'login';
        try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
        setLoginRole(typeof role === 'string' ? role : 'admin');
    }
    function signout() {
        try { localStorage.removeItem(PK); sessionStorage.removeItem(PK); localStorage.removeItem('fh_cphone'); } catch (e) { /* ignore */ }
        profile = null;
        exit('customer');
    }
    function init() {
        q('#kbTm').innerHTML = SLOTS.map(x => `<option value="${x}" ${x === '20:00' ? 'selected' : ''}>${fmtT(x)}</option>`).join('');
        q('#kbD').min = q('#kbD').value = todayStr();
        A().addEventListener('click', e => {
            const t = e.target;
            let b = t.closest('[data-chg]'); if (b) { const [id, k] = b.dataset.chg.split('|'); return chg(id, +k); }
            b = t.closest('[data-cat]'); if (b) { cat = b.dataset.cat; return draw(1); }
            if (t.closest('[data-checkout]')) return checkout();
            b = t.closest('#ktyp button'); if (b) { type = b.dataset.t; persist(); A().querySelectorAll('#ktyp button').forEach(x => x.classList.toggle('k-on', x === b)); upd(); drawCart(); }
        });
        $('#goCust').addEventListener('click', () => enter(null));
        window.addEventListener('storage', e => { if (e.key === STORE_KEY) check(); });
        document.addEventListener('visibilitychange', check);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { cartOpen(0); close(); } });
        setInterval(check, 4000);
    }
    return {
        init, enter, exit, signout, draw, cart: cartOpen, open, close, place, track, book, slots, upd, cancelBooking, loadProfile,
        add: id => chg(id, 1), isOpen, dismiss: () => $('#kBanner').classList.remove('k-on'),
        profile: () => profile, refresh: () => { draw(); drawCart(); }
    };
})();

/* ==========================================================================
   FLAVORBOT  –  the built-in help assistant
   --------------------------------------------------------------------------
   Runs 100% inside this file (no server, no API key, works offline).
   How it "thinks":
     1. the question is cleaned and split into words (English, Hinglish, हिंदी)
     2. every intent below has keywords with weights; spelling mistakes are
        forgiven (fuzzy match) and the best scoring intent wins
     3. dish names, prices, order numbers, phone numbers, times and guest
        counts are pulled out of the sentence, and the answer is built from the
        LIVE data in the database (menu, offers, tables, bookings, orders)
   It knows who is asking: customers get menu / order / booking help, staff get
   how-to help, and only staff & admin can ask for sales numbers.
   To teach it something new, add an entry to INTENTS (see README).
   ========================================================================== */
const BOT = (() => {
    const CHAT_KEY = 'fh_bot_chat_v2', ROLE_KEY = 'fh_bot_role', SEEN_KEY = 'fh_bot_seen';
    let msgs = [], isOpen = false, lang = 'en', pending = null;

    /* ---------- who is asking ---------- */
    const role = () => state.user ? state.user.role : (K.isOpen() ? 'customer' : 'guest');
    const staffy = () => role() === 'admin' || role() === 'staff';
    const myPhone = () => { const p = K.profile && K.profile(); return (p && p.phone) || localStorage.getItem('fh_cphone') || ''; };

    /* ---------- text helpers ---------- */
    const hasHindi = t => /[\u0900-\u097F]/.test(t);
    const norm = t => String(t || '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{M}\p{N}\s:₹]/gu, ' ').replace(/\s+/g, ' ').trim();
    const L = (en, hi) => (lang === 'hi' && hi) ? hi : en;
    const ul = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
    const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
    function lev(a, b) {
        if (Math.abs(a.length - b.length) > 2) return 9;
        const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
        for (let j = 1; j <= b.length; j++) d[0][j] = j;
        for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        return d[a.length][b.length];
    }
    const near = (w, k) => w === k || (k.length >= 5 && w.length >= 4 && lev(w, k) <= (k.length >= 8 ? 2 : 1));

    /* ---------- parse "table for 4 tomorrow at 8 pm" ---------- */
    function parseWhen(raw) {
        const t = norm(raw), out = {};
        let m = t.match(/(?:for|के लिए|ke liye)\s*(\d{1,2})\b/) || t.match(/\b(\d{1,2})\s*(?:people|persons|person|guests|guest|pax|members|log|लोग|जन|लोगों)/) || t.match(/\b(\d{1,2})\s*(?:के लिए|ke liye)/);
        if (m) out.guests = Math.min(+m[1], 40);
        let h = null, mi = 0;
        m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a m|p m)\b/);
        if (m) { h = +m[1]; mi = +(m[2] || 0); if (/p/.test(m[3]) && h < 12) h += 12; if (/a/.test(m[3]) && h === 12) h = 0; }
        else if ((m = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/))) { h = +m[1]; mi = +m[2]; }
        else if ((m = t.match(/\b(\d{1,2})\s*(?:बजे|baje|bje|o clock|oclock)/)) || (m = t.match(/\bat\s*(\d{1,2})\b/)) || (m = t.match(/\bबजे\s*(\d{1,2})\b/))) {
            h = +m[1]; if (h >= 1 && h <= 10) h += 12;
        }
        if (h !== null && h < 24) out.time = pad(h) + ':' + (mi >= 30 ? '30' : '00');
        const d0 = new Date();
        const add = n => { const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + n); return ymd(d); };
        if (/day after|parso|परसों|परसो/.test(t)) out.date = add(2);
        else if (/tomorrow|tmrw|tomorow|\bkal\b|कल/.test(t)) out.date = add(1);
        else if (/today|tonight|\baaj\b|आज/.test(t)) out.date = add(0);
        else if ((m = t.match(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/))) out.date = `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
        return out;
    }

    /* ---------- dish matching ---------- */
    const STOP = new Set('a an the of is are to for me my i you your do does can what which how much many tell about show give price cost rate rs rupees rupee kitna kitne kya hai hain ka ki ke ko me mein ye woh this that please pls any some and or with in on at best good veg non menu item items dish dishes food order add want need available have has there it under below above less more than cheap cheapest price prices ₹ क्या है का की के में को कितना कीमत दाम मेन्यू'.split(' '));
    const GENERIC = ['veg', 'fresh', 'sweet', 'masala', 'butter', 'chicken', 'paneer'];
    function findDishes(text) {
        const q = norm(text).split(' ').filter(w => w.length > 1 && !STOP.has(w));
        if (!q.length) return [];
        const onlyGeneric = q.every(w => GENERIC.some(g => near(w, g)));
        const scored = DB.dishes.map(d => {
            const toks = norm(d.name).split(' ');
            let hit = 0, strong = 0;
            toks.forEach(tk => { if (q.some(w => near(w, tk))) { hit++; if (!GENERIC.includes(tk) || toks.length === 1 || onlyGeneric) strong++; } });
            if (!hit) return null;
            const full = hit === toks.length;
            return { d, score: hit / toks.length + (full ? 1 : 0) + (strong ? .2 : 0), full, strong };
        }).filter(Boolean).sort((a, b) => b.score - a.score);
        if (!scored.length) return [];
        const best = scored[0];
        if (best.full) return scored.filter(s => s.full && s.score >= best.score - .01).slice(0, 4).map(s => s.d);
        return scored.filter(s => s.score >= Math.max(.5, best.score - .3) && s.strong).slice(0, 4).map(s => s.d);
    }
    function dishCardHTML(d) {
        const where = DB.categories.includes(d.cat) ? d.cat : '';
        return L(`<b>${esc(d.name)}</b> ${esc(d.emoji || '')} – ${money(d.price)} (${d.veg ? 'Veg' : 'Non-veg'})<br>${esc(d.desc)}<br><small>${esc(where)} · ${d.available ? 'Available today' : 'Sold out right now'}</small>`,
            `<b>${esc(d.name)}</b> ${esc(d.emoji || '')} – ${money(d.price)} (${d.veg ? 'शाकाहारी' : 'मांसाहारी'})<br>${esc(d.desc)}<br><small>${esc(where)} · ${d.available ? 'आज उपलब्ध' : 'अभी खत्म है'}</small>`);
    }
    const addAct = d => d.available ? [{ id: 'add:' + d.id, label: '+ ' + L('Add', 'जोड़ें') + ' ' + d.name }] : [];
    const dishLine = d => `${esc(d.name)} – ${money(d.price)} ${d.veg ? '🟢' : '🔴'}`;
    function popular(n) {
        const top = topDishes(DB.orders, 30).map(t => dishById(t.id)).filter(d => d && d.available);
        return (top.length ? top : DB.dishes.filter(d => d.available)).slice(0, n);
    }

    /* ---------- order + booking lookups ---------- */
    const statusWord = s => ({ pending: L('received', 'मिल गया'), preparing: L('being prepared', 'बन रहा है'), ready: L('READY', 'तैयार है'), completed: L('completed', 'पूरा हुआ'), cancelled: L('cancelled', 'रद्द हुआ') }[s] || s);
    function orderLine(o) {
        const pay = o.paymentStatus === 'paid' ? L('paid', 'भुगतान हो गया') : o.paymentStatus === 'pending' ? L('pay at the restaurant', 'रेस्टोरेंट पर भुगतान') : o.paymentStatus;
        return `<b>${esc(o.id)}</b> – ${statusWord(o.status)}<br><small>${o.items.map(i => i.qty + '× ' + esc(i.name)).join(', ')} · ${money(o.total)} · ${pay} · ${timeAgo(o.createdAt)}</small>`;
    }
    function trackAnswer(text) {
        const idm = text.match(/fh\s*-?\s*(\d{3,6})/i), ph = digits(text).length >= 10 ? digits(text).slice(-10) : (idm ? '' : '');
        if (idm) {
            const o = DB.orders.find(x => x.id === 'FH-' + idm[1]);
            return o ? { h: orderLine(o), a: [] } : { h: L(`I can't find order FH-${idm[1]}. Check the number on your bill.`, `ऑर्डर FH-${idm[1]} नहीं मिला। बिल पर नंबर जाँच लें।`) };
        }
        const p = ph || (staffy() ? '' : myPhone());
        if (p) {
            const list = DB.orders.filter(o => o.phone === p).slice(0, 3);
            return list.length ? { h: L(`Latest orders for ${p}:`, `${p} के ताज़ा ऑर्डर:`) + ul(list.map(orderLine)), a: [{ id: 'cust:track', label: L('Open My Orders', 'मेरे ऑर्डर खोलें') }] } : { h: L(`No orders found for ${p}.`, `${p} के लिए कोई ऑर्डर नहीं मिला।`) };
        }
        if (staffy()) { const live = DB.orders.filter(o => ACTIVE.includes(o.status)); return { h: L(`There ${live.length === 1 ? 'is' : 'are'} ${plural(live.length, 'live order')} right now.`, `अभी ${live.length} लाइव ऑर्डर हैं।`), a: [{ id: 'go:orders', label: 'Open Orders' }] }; }
        pending = 'track';
        return { h: L('Sure! Send me your order number (like FH-1005) or the 10-digit phone number you ordered with.', 'ज़रूर! अपना ऑर्डर नंबर (जैसे FH-1005) या 10 अंकों का फ़ोन नंबर भेजें।') };
    }
    function availability(text) {
        const w = parseWhen(text), g = w.guests || 2, d = w.date || todayStr();
        let tm = w.time || '20:00';
        if (!SLOTS.includes(tm)) tm = minutesOf(tm) < 660 ? '11:00' : '22:00';
        if (d < todayStr()) return { h: L('That date has already passed – pick today or a later date.', 'वह तारीख निकल चुकी है – आज या आगे की तारीख चुनें।') };
        const nowM = new Date().getHours() * 60 + new Date().getMinutes();
        if (d === todayStr() && minutesOf(tm) <= nowM && !w.time) tm = SLOTS.find(s => minutesOf(s) > nowM) || '22:00';
        if (d === todayStr() && minutesOf(tm) <= nowM) return { h: L(`${fmtT(tm)} has already passed today. Try a later time or another day.`, `आज ${fmtT(tm)} का समय निकल चुका है। बाद का समय या दूसरा दिन चुनें।`) };
        const free = t => t.seats >= g && !bookingConflict(t.id, d, tm);
        const ok = DB.tables.filter(free);
        const when = `${d === todayStr() ? L('today', 'आज') : fmtD(d)} ${L('at', '')} ${fmtT(tm)}`;
        const acts = [{ id: 'book', label: L('Book a table', 'टेबल बुक करें') }];
        if (ok.length) return { h: L(`✅ Yes! ${plural(ok.length, 'table')} ${ok.length === 1 ? 'is' : 'are'} free for ${plural(g, 'guest')} ${when}: ${ok.slice(0, 4).map(t => t.name + ' (' + t.seats + ' seats)').join(', ')}.`, `✅ हाँ! ${when} ${g} लोगों के लिए ${ok.length} टेबल खाली हैं: ${ok.slice(0, 4).map(t => t.name + ' (' + t.seats + ' सीट)').join(', ')}।`), a: acts };
        const alt = SLOTS.filter(s => (d !== todayStr() || minutesOf(s) > nowM) && DB.tables.some(t => t.seats >= g && !bookingConflict(t.id, d, s))).sort((a, b) => Math.abs(minutesOf(a) - minutesOf(tm)) - Math.abs(minutesOf(b) - minutesOf(tm))).slice(0, 3);
        return { h: L(`❌ No table for ${plural(g, 'guest')} is free ${when}.` + (alt.length ? ` Closest free times: <b>${alt.map(fmtT).join(', ')}</b>.` : ' Try another day.'), `❌ ${when} ${g} लोगों के लिए कोई टेबल खाली नहीं है।` + (alt.length ? ` नज़दीकी खाली समय: <b>${alt.map(fmtT).join(', ')}</b>।` : ' कोई और दिन चुनें।')), a: acts };
    }
    function priceFilter(text) {
        const t = norm(text);
        let m = t.match(/(?:under|below|less than|within|upto|up to|max|budget|से कम|tak|तक)\s*₹?\s*(\d{2,5})/) || t.match(/₹?\s*(\d{2,5})\s*(?:से कम|tak|तक|ke andar|के अंदर|or less)/) || t.match(/₹\s*(\d{2,5})/);
        const cap = m ? +m[1] : (/cheap|sasta|सस्ता|budget/.test(t) ? 120 : 0);
        const veg = /\bveg\b|vegetarian|शाकाहारी|शाकाहार|pure veg/.test(t) && !/non[\s-]?veg|मांसाहारी/.test(t);
        const nonveg = /non[\s-]?veg|chicken|egg|मांसाहारी|नॉन/.test(t);
        const cats = DB.categories.filter(c => t.includes(c.toLowerCase()));
        let list = DB.dishes.filter(d => d.available && (!cap || d.price <= cap) && (!veg || d.veg) && (!nonveg || !d.veg) && (!cats.length || cats.includes(d.cat)));
        list.sort((a, b) => cap || /cheap|sasta|सस्ता/.test(t) ? a.price - b.price : 0);
        return { list, cap, veg, nonveg, cats };
    }

    /* ---------- staff data ---------- */
    function salesToday() {
        const s = sumOrders(DB.orders.filter(o => orderDay(o) === todayStr()));
        const unpaid = DB.orders.filter(o => orderDay(o) === todayStr() && o.paymentStatus === 'pending' && o.status !== 'cancelled');
        return L(`Today: <b>${money(s.revenue)}</b> from ${plural(s.count, 'paid order')} (${s.items} items, GST ${money(s.tax)}).` + (unpaid.length ? `<br>${plural(unpaid.length, 'order')} (${money(unpaid.reduce((a, o) => a + o.total, 0))}) still unpaid.` : ''));
    }

    /* ---------- the knowledge base ---------- */
    /* k: [keyword, weight]  – hindi (Devanagari) keywords match as substrings, english ones as whole/fuzzy words */
    const INTENTS = [
        {
            id: 'greet', k: [['hi', 3], ['hello', 3], ['hey', 3], ['namaste', 4], ['namaskar', 4], ['good morning', 4], ['good evening', 4], ['नमस्ते', 4], ['हेलो', 3], ['नमस्कार', 4], ['hii', 3]],
            fn: () => ({ h: L(`Hello${(K.profile && K.profile() && K.profile().name) ? ', ' + esc(K.profile().name.split(' ')[0]) : ''}! 👋 I'm FlavorBot, the ${esc(DB.settings.name)} assistant. Ask me about the menu, prices, offers, table booking or your order.`, 'नमस्ते! 👋 मैं FlavorBot हूँ। मुझसे मेन्यू, कीमत, ऑफर, टेबल बुकिंग या अपने ऑर्डर के बारे में पूछें।') })
        },
        { id: 'thanks', k: [['thanks', 4], ['thank you', 4], ['thx', 3], ['shukriya', 4], ['dhanyavad', 4], ['धन्यवाद', 4], ['शुक्रिया', 4], ['great', 1], ['awesome', 1]], fn: () => ({ h: L("You're welcome! 😊 Anything else I can help with?", 'आपका स्वागत है! 😊 और कुछ पूछना है?') }) },
        { id: 'bye', k: [['bye', 4], ['goodbye', 4], ['see you', 3], ['alvida', 4], ['अलविदा', 4]], fn: () => ({ h: L('Goodbye! Come back hungry 🍽️', 'फिर मिलेंगे! भूखे आइएगा 🍽️') }) },
        {
            id: 'help', k: [['help', 3], ['what can you do', 6], ['how can you help', 6], ['commands', 3], ['options', 2], ['मदद', 4], ['सहायता', 4], ['क्या कर सकते', 5], ['madad', 4]],
            fn: () => ({ h: staffy() ? L('I can help with: today\'s numbers (orders, tables, bookings), how-to steps (add a dish, collect payment, refunds, GST, staff accounts, backup), and menu questions. Try one of the buttons below.') : L('I can help with: 🍛 dish details & prices, 🥗 veg / budget suggestions, 🏷️ offers & coupons, 📅 table booking & availability, 📦 order tracking, 🕒 timings, 💳 payments, 🚚 delivery.', 'मैं बता सकता हूँ: 🍛 डिश और कीमत, 🥗 शाकाहारी/बजट सुझाव, 🏷️ ऑफर, 📅 टेबल बुकिंग, 📦 ऑर्डर ट्रैकिंग, 🕒 समय, 💳 भुगतान, 🚚 डिलीवरी।') })
        },
        {
            id: 'about', k: [['who are you', 6], ['your name', 5], ['are you ai', 6], ['are you a bot', 6], ['are you human', 6], ['chatgpt', 3], ['तुम कौन', 5], ['आप कौन', 5], ['kaun ho', 5]],
            fn: () => ({ h: L("I'm FlavorBot 🤖 – a built-in assistant that lives inside this app. I'm not connected to the internet or a large AI model: I answer from this restaurant's own live data (menu, offers, tables, bookings, orders) using smart keyword matching, so my answers are always about <b>this</b> restaurant.", 'मैं FlavorBot 🤖 हूँ – इसी ऐप में बना असिस्टेंट। मैं इंटरनेट या किसी बड़े AI मॉडल से नहीं जुड़ा हूँ; मैं इस रेस्टोरेंट के लाइव डेटा (मेन्यू, ऑफर, टेबल, बुकिंग, ऑर्डर) से जवाब देता हूँ।') })
        },
        {
            id: 'hours', k: [['timing', 5], ['timings', 5], ['opening hours', 6], ['open', 2], ['close', 2], ['closing', 4], ['hours', 3], ['what time', 3], ['kab', 3], ['khula', 4], ['khulta', 4], ['samay', 3], ['समय', 4], ['टाइमिंग', 5], ['कब खुल', 5], ['कब तक', 4], ['खुला', 4], ['बंद', 3]],
            fn: () => ({ h: L(`We are open <b>daily, 11:00 AM – 10:30 PM</b>. Table bookings can be made for 11:00 AM – 10:00 PM.`, `हम <b>रोज़ सुबह 11:00 से रात 10:30 बजे तक</b> खुले हैं। टेबल बुकिंग 11:00 AM – 10:00 PM के बीच हो सकती है।`) })
        },
        {
            id: 'contact', k: [['address', 5], ['location', 4], ['where are you', 6], ['where is', 3], ['phone', 4], ['contact', 5], ['call', 3], ['email', 4], ['directions', 4], ['number', 2], ['पता', 5], ['कहाँ', 3], ['कहां', 3], ['फोन', 4], ['नंबर', 3], ['sampark', 4], ['kahan', 3], ['pata', 4]],
            fn: () => { const S = DB.settings; return { h: L(`📍 ${esc(S.address)}<br>📞 ${esc(S.phone)}<br>✉️ ${esc(S.email)}`, `📍 ${esc(S.address)}<br>📞 ${esc(S.phone)}<br>✉️ ${esc(S.email)}`) }; }
        },
        {
            id: 'menu', k: [['menu', 5], ['categories', 4], ['category', 4], ['what do you have', 6], ['what food', 5], ['dishes', 3], ['मेन्यू', 5], ['क्या मिलता', 5], ['क्या क्या', 4], ['khana', 3], ['kya milta', 5]],
            fn: () => { const c = DB.categories.map(cn => `<b>${esc(cn)}</b> (${DB.dishes.filter(d => d.cat === cn && d.available).length})`).join(' · '); return { h: L(`Our menu has ${DB.dishes.length} dishes: ${c}.<br>Ask me for e.g. "veg dishes under ₹150", "desserts" or the price of any dish.`, `हमारे मेन्यू में ${DB.dishes.length} डिश हैं: ${c}।<br>आप पूछ सकते हैं जैसे "₹150 से कम शाकाहारी", "डेज़र्ट" या किसी डिश की कीमत।`), a: staffy() ? [{ id: 'go:menu', label: 'Open Menu' }] : [{ id: 'cust:menu', label: L('See the menu', 'मेन्यू देखें') }] }; }
        },
        {
            id: 'popular', k: [['popular', 5], ['best seller', 6], ['bestseller', 6], ['best sellers', 6], ['recommend', 5], ['suggest', 5], ['special', 3], ['famous', 4], ['must try', 6], ['most ordered', 6], ['top dishes', 6], ['what should i order', 7], ['पॉपुलर', 5], ['सुझाव', 5], ['स्पेशल', 3], ['मशहूर', 4], ['kya khayein', 5]],
            fn: () => { const p = popular(5); return { h: L('Most-loved dishes right now:', 'अभी सबसे पसंदीदा डिश:') + ul(p.map(dishLine)), a: p.slice(0, 3).flatMap(addAct) }; }
        },
        {
            id: 'offers', k: [['offer', 5], ['offers', 5], ['discount', 5], ['coupon', 5], ['coupons', 5], ['promo', 4], ['promo code', 6], ['deal', 3], ['deals', 3], ['save', 2], ['cheaper', 2], ['ऑफर', 5], ['छूट', 5], ['डिस्काउंट', 5], ['कूपन', 5], ['chhoot', 4], ['discount code', 6]],
            fn: () => { const S = DB.settings; const cp = Object.entries(COUPONS).map(([k, v]) => `<b>${k}</b> – ${v.text}`); return { h: L((S.offerOn ? `🏷️ <b>${S.offerPct}% OFF</b> automatically on orders above ${money(S.offerMin)}.<br>` : 'No automatic offer is running right now.<br>') + 'Coupon codes (type one in the basket / checkout):' + ul(cp) + '<small>The bigger saving of the offer and the coupon is applied – they do not stack.</small>', (S.offerOn ? `🏷️ ${money(S.offerMin)} से ऊपर के ऑर्डर पर अपने-आप <b>${S.offerPct}% छूट</b>।<br>` : '') + 'कूपन कोड:' + ul(cp) + '<small>ऑफर और कूपन में से जो ज़्यादा बचत दे वही लगता है।</small>') }; }
        },
        {
            id: 'delivery', k: [['delivery', 5], ['deliver', 4], ['home delivery', 6], ['takeaway', 4], ['take away', 4], ['pickup', 4], ['dine in', 3], ['dine-in', 3], ['delivery charge', 6], ['डिलीवरी', 5], ['होम डिलीवरी', 6], ['टेकअवे', 4], ['ghar', 2]],
            fn: () => { const S = DB.settings; return { h: L(`We offer 3 ways to order:${ul([`<b>Dine-in</b> – pick a table, we serve you there`, `<b>Takeaway</b> – collect at the counter when it is ready`, `<b>Home delivery</b> – ${S.deliveryFee ? money(S.deliveryFee) + ' delivery charge' : 'free'}; a delivery address and phone number are needed`])}`, `ऑर्डर के 3 तरीके:${ul(['<b>डाइन-इन</b> – टेबल चुनें', '<b>टेकअवे</b> – तैयार होने पर काउंटर से लें', `<b>होम डिलीवरी</b> – ${money(S.deliveryFee)} डिलीवरी चार्ज; पता और फ़ोन ज़रूरी`])}`) }; }
        },
        {
            id: 'payment', k: [['payment', 5], ['payments', 5], ['pay', 3], ['upi', 4], ['card', 3], ['cash', 3], ['paytm', 3], ['gpay', 3], ['phonepe', 3], ['how to pay', 6], ['भुगतान', 5], ['पेमेंट', 5], ['पैसे', 3], ['paise', 3], ['kaise pay', 5]],
            fn: () => ({ h: staffy() ? L('Payments: staff can take <b>Cash</b> (with change calculator), <b>Card</b> or <b>UPI</b> at checkout. Online orders arrive <b>unpaid</b> – press <b>Collect</b> in Orders/Payments (or complete the order) to record the payment.') : L('You can pay at the restaurant (cash, card or UPI) when you finish eating or when your takeaway/delivery arrives. Online orders do not need advance payment.', 'आप खाना खत्म होने पर या टेकअवे/डिलीवरी मिलने पर रेस्टोरेंट में कैश, कार्ड या UPI से भुगतान कर सकते हैं। ऑनलाइन ऑर्डर में एडवांस की ज़रूरत नहीं।') })
        },
        {
            id: 'gst', k: [['gst', 5], ['tax', 4], ['taxes', 4], ['gstin', 5], ['invoice', 3], ['receipt', 3], ['जीएसटी', 5], ['टैक्स', 4]],
            fn: () => { const S = DB.settings; return { h: L(`GST is <b>${S.taxRate}%</b> (${S.taxRate / 2}% CGST + ${S.taxRate / 2}% SGST), added on the bill after discounts. Menu prices are shown <b>without</b> GST. GSTIN: ${esc(S.gstin)}.`, `GST <b>${S.taxRate}%</b> है, जो छूट के बाद बिल में जुड़ता है। मेन्यू की कीमतें GST के <b>बिना</b> हैं।`) }; }
        },
        {
            id: 'howorder', k: [['how to order', 7], ['place order', 6], ['place an order', 6], ['order online', 6], ['how do i order', 7], ['order food', 5], ['ऑर्डर कैसे', 6], ['ऑर्डर करना', 5], ['order kaise', 6]],
            fn: () => ({ h: staffy() ? L('To take an order: <b>Menu</b> → tap + on dishes → choose Dine-in / Takeaway / Delivery in the basket → <b>PAY</b> → pick table, enter customer details and payment → the bill prints.') : L('Ordering is easy:' + ul(['Open the menu and tap <b>Add</b> on the dishes you like', 'Tap the basket → <b>Checkout</b>', 'Choose Dine-in, Takeaway or Delivery, enter name & phone', 'Tap <b>Place Order</b> – we will alert you when it is ready 🔔']), 'ऑर्डर करना आसान है:' + ul(['मेन्यू में पसंदीदा डिश पर <b>Add</b> दबाएँ', 'बास्केट → <b>Checkout</b>', 'डाइन-इन / टेकअवे / डिलीवरी चुनें, नाम और फ़ोन भरें', '<b>Place Order</b> दबाएँ – तैयार होते ही आपको सूचना मिलेगी 🔔'])), a: staffy() ? [{ id: 'go:menu', label: 'Open Menu' }] : [{ id: 'cust:menu', label: L('Start ordering', 'ऑर्डर शुरू करें') }] })
        },
        {
            id: 'book', k: [['book', 4], ['booking', 4], ['reserve', 5], ['reservation', 5], ['book a table', 8], ['table booking', 8], ['table', 3], ['tables', 3], ['seat', 3], ['seats', 3], ['टेबल', 5], ['बुकिंग', 5], ['बुक', 4], ['reserve table', 8], ['free table', 6], ['table free', 6], ['available table', 6]],
            fn: t => {
                const w = parseWhen(t);
                if (w.guests || w.time || w.date || /free|available|khali|खाली|उपलब्ध/.test(norm(t))) return availability(t);
                return { h: L('To book a table:' + ul(['Tap <b>Book a Table</b>', 'Enter name, phone, date, time and number of guests', 'We pick the smallest free table that fits – you get it confirmed instantly']) + 'Tip: ask me "is a table free for 4 tomorrow at 8 pm?" and I\'ll check live availability.', 'टेबल बुक करने के लिए:' + ul(['<b>Book a Table</b> दबाएँ', 'नाम, फ़ोन, तारीख, समय और लोगों की संख्या भरें', 'हम सबसे छोटी फिट होने वाली खाली टेबल देकर तुरंत कन्फर्म कर देते हैं']) + 'पूछकर देखें: "कल रात 8 बजे 4 लोगों के लिए टेबल खाली है?"'), a: [{ id: 'book', label: L('Book a table', 'टेबल बुक करें') }] };
            }
        },
        {
            id: 'track', k: [['track', 5], ['status', 4], ['where is my order', 8], ['my order', 5], ['order status', 7], ['order ready', 6], ['how long', 3], ['eta', 3], ['kab aayega', 5], ['ऑर्डर कहाँ', 6], ['मेरा ऑर्डर', 6], ['स्टेटस', 4], ['order kahan', 6], ['fh-', 5]],
            fn: t => trackAnswer(t)
        },
        {
            id: 'cancel', k: [['cancel', 5], ['cancellation', 5], ['refund', 4], ['रद्द', 5], ['कैंसल', 5], ['वापस', 2]],
            fn: t => {
                if (/refund/.test(norm(t)) && staffy()) return { h: 'Refunds: <b>Payments</b> → find the bill → <b>Refund</b> (admin only). The order is cancelled and the payment is marked refunded. Unpaid online orders are simply cancelled from <b>Orders</b> (✕ button) – nothing is charged.' };
                return { h: staffy() ? 'To cancel an order press the ✕ button in <b>Orders</b>. Paid orders are marked refunded; unpaid ones are voided. To cancel a booking use <b>Table Booking</b> → ✕.' : L('To cancel a <b>booking</b>: open <b>My Orders → My table bookings → Cancel booking</b>. To cancel an <b>order</b>, please call us quickly on ' + esc(DB.settings.phone) + ' before it is cooked.', '<b>बुकिंग</b> रद्द करने के लिए: <b>My Orders → My table bookings → Cancel booking</b>। <b>ऑर्डर</b> रद्द करने के लिए बनने से पहले ' + esc(DB.settings.phone) + ' पर कॉल करें।'), a: staffy() ? [] : [{ id: 'cust:track', label: L('Open My Orders', 'मेरे ऑर्डर खोलें') }] };
            }
        },
        {
            id: 'allergy', k: [['allergy', 6], ['allergic', 6], ['jain', 6], ['spicy', 4], ['spice', 3], ['less spicy', 6], ['no onion', 5], ['gluten', 5], ['nuts', 4], ['halal', 4], ['एलर्जी', 6], ['जैन', 6], ['तीखा', 4], ['मसालेदार', 4]],
            fn: () => ({ h: L('Please add it in the <b>cooking note</b> at checkout (e.g. "Jain, no onion-garlic", "less spicy"). For serious allergies please also tell our staff on ' + esc(DB.settings.phone) + ' – I don\'t have ingredient lists, so I can\'t guarantee a dish is allergen-free.', 'कृपया चेकआउट में <b>cooking note</b> में लिखें (जैसे "जैन, बिना प्याज़-लहसुन", "कम तीखा")। गंभीर एलर्जी हो तो ' + esc(DB.settings.phone) + ' पर स्टाफ को भी बताएँ – मेरे पास सामग्री की पूरी सूची नहीं है।') })
        },
        {
            id: 'theme', k: [['dark mode', 6], ['theme', 5], ['black and white', 8], ['black white', 8], ['monochrome', 6], ['colour', 2], ['color', 2], ['थीम', 5], ['ब्लैक', 4]],
            fn: () => ({ h: L('The app has two looks: the default <b>Gold</b> theme and a <b>Black &amp; White</b> theme. Tap the ◐ button in the header (or in the menu on a phone). Your choice is remembered.', 'ऐप में दो थीम हैं: <b>Gold</b> और <b>Black &amp; White</b>। हेडर में ◐ बटन दबाएँ। आपकी पसंद याद रखी जाती है।'), a: [{ id: 'theme', label: L('Switch theme now', 'थीम बदलें') }] })
        },
        {
            id: 'data', k: [['data saved', 6], ['where is data', 6], ['stored', 4], ['localstorage', 6], ['local storage', 6], ['lost', 3], ['backup', 4], ['डेटा', 4], ['सेव', 3]],
            fn: () => ({ h: staffy() ? 'Everything is saved in this browser (localStorage) automatically. Use <b>Settings → Download backup</b> before clearing browser data or moving to another device. Customer and staff screens share the same data only when opened in the <b>same browser on the same device</b>.' : L('Your basket, bookings and orders are remembered on this device, so you will not lose them if you refresh the page.', 'आपकी बास्केट, बुकिंग और ऑर्डर इसी डिवाइस पर याद रहते हैं, पेज रीफ्रेश करने पर भी।') })
        },
        {
            id: 'problem', k: [['not working', 6], ['problem', 4], ['issue', 4], ['error', 4], ['bug', 4], ['stuck', 4], ['blank', 4], ['cant', 2], ['doesnt work', 6], ['काम नहीं', 6], ['दिक्कत', 5], ['समस्या', 5]],
            fn: () => ({ h: L('Try these quick fixes:' + ul(['Refresh the page (pull down on a phone)', 'Make sure the browser is <b>not</b> in private/incognito mode – saving needs local storage', 'Allow cookies/site data for this site', 'Still stuck? An admin can use <b>Settings → Reset to demo data</b> (after downloading a backup)']), 'ये आज़माएँ:' + ul(['पेज रीफ्रेश करें', 'ब्राउज़र प्राइवेट/इन्कॉग्निटो मोड में न हो', 'साइट डेटा/कुकीज़ की अनुमति दें', 'फिर भी न चले तो एडमिन Settings → Reset to demo data करे (पहले बैकअप लें)'])) })
        },
        {
            id: 'lang', k: [['hindi', 4], ['in hindi', 6], ['हिंदी', 5], ['हिन्दी', 5], ['hindi me', 6]],
            fn: () => { lang = 'hi'; return { h: 'ज़रूर! अब से मैं हिंदी में जवाब दूँगा (आप English में भी पूछ सकते हैं)। 🙏' }; }
        },

        /* ----- staff & admin ----- */
        {
            id: 's_sales', staff: true, k: [['sales', 5], ['revenue', 5], ['earning', 4], ['earnings', 4], ['income', 4], ['collection', 4], ['how much did we', 6], ['कमाई', 5], ['बिक्री', 5], ['सेल', 4]],
            fn: () => role() === 'admin' ? { h: salesToday(), a: [{ id: 'go:reports', label: 'Open Reports' }] } : { h: 'Sales figures are for admins. I can tell you how many orders are live: ' + plural(DB.orders.filter(o => ACTIVE.includes(o.status)).length, 'order') + '.' }
        },
        {
            id: 's_orders', staff: true, k: [['pending orders', 7], ['live orders', 7], ['kitchen', 5], ['pending', 4], ['orders now', 5], ['how many orders', 7], ['orders today', 6], ['active orders', 7], ['ऑर्डर कितने', 6]],
            fn: () => { const live = DB.orders.filter(o => ACTIVE.includes(o.status)), by = s => live.filter(o => o.status === s).length, unpaid = live.filter(o => o.paymentStatus === 'pending').length; const today = DB.orders.filter(o => orderDay(o) === todayStr() && o.status !== 'cancelled').length; return { h: `Kitchen now: <b>${by('pending')}</b> waiting, <b>${by('preparing')}</b> cooking, <b>${by('ready')}</b> ready. ${unpaid ? unpaid + ' unpaid. ' : ''}Orders today: ${today}.`, a: [{ id: 'go:orders', label: 'Open Orders' }] }; }
        },
        {
            id: 's_tables', staff: true, k: [['tables now', 7], ['table status', 7], ['free tables', 7], ['occupied', 4], ['tables free', 7], ['kaun si table', 6], ['टेबल खाली', 6]],
            fn: () => { const st = DB.tables.map(t => ({ t, s: tableStatus(t).s })), n = k => st.filter(x => x.s === k); return { h: `Tables right now: <b>${n('free').length}</b> free (${n('free').map(x => x.t.name).join(', ') || '–'}), <b>${n('reserved').length}</b> reserved, <b>${n('occupied').length}</b> occupied.`, a: [{ id: 'go:bookings', label: 'Open Table Booking' }] }; }
        },
        {
            id: 's_bookings', staff: true, k: [['bookings today', 8], ['reservations today', 8], ['todays bookings', 8], ['upcoming bookings', 8], ['who booked', 6], ['आज की बुकिंग', 8]],
            fn: () => { const b = DB.bookings.filter(x => x.date === todayStr() && x.status === 'confirmed').sort((a, c) => a.time.localeCompare(c.time)); return { h: b.length ? `Today's bookings (${b.length}):` + ul(b.map(x => `${fmtT(x.time)} – ${esc(x.name)}, ${x.guests} guests, ${esc((tableById(x.tableId) || {}).name || '-')}`)) : 'No confirmed bookings for today.', a: [{ id: 'go:bookings', label: 'Open Table Booking' }] }; }
        },
        {
            id: 's_collect', staff: true, k: [['collect payment', 8], ['collect', 4], ['unpaid', 6], ['mark paid', 7], ['online order payment', 8], ['pay at counter', 6], ['payment pending', 7]],
            fn: () => ({ h: 'Online orders arrive <b>unpaid</b>. Open <b>Orders</b> (or Payments) and press <b>Collect</b> → choose Cash / Card / UPI → <b>Mark as paid</b>. Completing an unpaid order also asks you to collect payment first. Only paid orders count in sales reports.', a: [{ id: 'go:orders', label: 'Open Orders' }] })
        },
        {
            id: 'h_dish', staff: true, adminOnly: true, k: [['add dish', 8], ['add item', 8], ['add new dish', 8], ['edit dish', 7], ['delete dish', 7], ['sold out', 5], ['change price', 7], ['update price', 7], ['new item', 6], ['dish photo', 6], ['upload photo', 6]],
            fn: () => ({ h: 'Menu changes (admin): <b>Menu</b> → <b>Add Item</b> to create a dish (name, price, category, veg/non-veg, emoji, photo link or upload). On any card use the small buttons: 🚫 mark sold out, ✎ edit price/details, 🗑 delete. <b>Category</b> manages the category list.', a: [{ id: 'go:menu', label: 'Open Menu' }] })
        },
        {
            id: 'h_settings', staff: true, adminOnly: true, k: [['change gst', 8], ['gst rate', 7], ['delivery charge', 6], ['change offer', 7], ['settings', 5], ['restaurant name', 6], ['change address', 7], ['gstin', 5]],
            fn: () => ({ h: '<b>Settings</b> (admin): edit the restaurant profile (name, address, GSTIN – printed on bills) and <b>Billing &amp; offers</b> (GST %, delivery charge, the "spend more, save more" offer).', a: [{ id: 'go:settings', label: 'Open Settings' }] })
        },
        {
            id: 'h_users', staff: true, adminOnly: true, k: [['add staff', 8], ['new staff', 8], ['add user', 8], ['staff account', 8], ['change password', 7], ['reset password', 7], ['forgot password', 7], ['create admin', 7], ['remove user', 7]],
            fn: () => ({ h: '<b>Settings → Staff accounts</b>: add a team member (name, username, password, role Staff or Admin) or remove one. Everyone can change their own password from the profile menu (or the side menu on a phone). Staff can use orders, bookings, customers and payments; only admins get Reports, Settings, refunds and menu editing.', a: [{ id: 'go:settings', label: 'Open Settings' }] })
        },
        {
            id: 'h_backup', staff: true, adminOnly: true, k: [['backup', 6], ['restore', 6], ['export', 5], ['csv', 6], ['download report', 7], ['reset demo', 7], ['reset', 4], ['delete all orders', 8], ['clear data', 6]],
            fn: () => ({ h: 'Data tools: <b>Reports → Export CSV</b> downloads orders for the chosen period. <b>Settings → Your data</b> has Download backup, Restore backup, Delete all orders and Reset to demo data.', a: [{ id: 'go:settings', label: 'Open Settings' }] })
        },
        {
            id: 'h_print', staff: true, k: [['print bill', 8], ['print', 5], ['bill', 3], ['reprint', 6], ['invoice', 3]],
            fn: () => ({ h: 'Print or re-print any bill from <b>Orders</b> or <b>Payments</b> with the 🖨 button (or <b>Print bill</b> after payment). It prints a 80 mm receipt layout.', a: [{ id: 'go:orders', label: 'Open Orders' }] })
        },
        {
            id: 'h_status', staff: true, k: [['mark ready', 8], ['start cooking', 8], ['change status', 7], ['update order', 6], ['complete order', 7], ['notify customer', 7]],
            fn: () => ({ h: 'Order flow: <b>Pending → Start cooking → Mark ready → Complete</b>. Use the gold button on the order row or in Dashboard → Live orders. When you press <b>Mark ready</b>, an online customer gets an instant "order ready" alert (sound + banner) on their screen.', a: [{ id: 'go:orders', label: 'Open Orders' }] })
        },
        {
            id: 'h_takeorder', staff: true, k: [['take order', 7], ['new order', 6], ['walk in', 5], ['walk-in', 5], ['start order', 6], ['seat guest', 6]],
            fn: () => ({ h: 'New order: <b>Menu</b> → add dishes → <b>PAY</b>. For a booked guest, open <b>Table Booking</b> and press <b>Take order</b> on their reservation – the table, name and phone are filled in for you.', a: [{ id: 'go:menu', label: 'Open Menu' }] })
        }
    ];

    /* ---------- score ---------- */
    function score(intent, t, words) {
        let s = 0;
        for (const [kw, wt] of intent.k) {
            if (hasHindi(kw)) { if (t.includes(kw)) s += wt; continue; }
            if (kw.includes(' ') || kw.endsWith('-')) {
                if ((' ' + t + ' ').includes(' ' + kw)) s += wt + 1;
                else { const parts = kw.split(' ').filter(x => x.length > 1); if (parts.length > 1 && parts.every(p => words.some(w => near(w, p)))) s += wt * .85; }
                continue;
            }
            if (words.some(w => near(w, kw))) s += words.includes(kw) ? wt : wt * .6;
        }
        return s;
    }

    function answer(text) {
        const raw = String(text || '').trim();
        if (hasHindi(raw)) lang = 'hi'; else if (/[a-z]{3,}/i.test(raw) && lang === 'hi' && !/hindi/.test(norm(raw))) lang = 'en';
        const t = norm(raw), words = t.split(' ');
        if (!t) return { h: L('Type a question and I will do my best 🙂', 'कोई सवाल लिखें, मैं कोशिश करूँगा 🙂') };

        /* follow-up to a question I asked */
        if (pending === 'track') { pending = null; if (/fh\s*-?\d+/i.test(raw) || digits(raw).length >= 10) return trackAnswer(raw); }
        pending = null;

        /* order id / phone typed on its own */
        if (/^fh\s*-?\s*\d{3,6}$/i.test(raw.trim()) || /^\d{10}$/.test(raw.replace(/\D/g, '')) && raw.replace(/[\d\s+\-]/g, '') === '') return trackAnswer(raw);

        /* intents */
        let best = null, bs = 0, second = 0;
        INTENTS.forEach(it => {
            if (it.staff && !staffy()) return;
            if (it.adminOnly && role() !== 'admin') return;
            const s = score(it, t, words);
            if (s > bs) { second = bs; bs = s; best = it; } else if (s > second) second = s;
        });
        const price = priceFilter(raw), hasPriceWords = price.cap || /\bveg\b|non[\s-]?veg|शाकाहारी|मांसाहारी|vegetarian|cheap|sasta|सस्ता/.test(t) || price.cats.length;
        const dishes = findDishes(raw);

        /* staff-only questions asked by a customer */
        if (!staffy() && /(sales|revenue|todays? (sales|earning)|कमाई|बिक्री|add dish|add staff|admin password|settings)/.test(t)) return { h: L('That one is for restaurant staff 🙂 – I can help you with the menu, offers, bookings and your orders.', 'यह जानकारी रेस्टोरेंट स्टाफ के लिए है 🙂 – मैं मेन्यू, ऑफर, बुकिंग और आपके ऑर्डर में मदद कर सकता हूँ।') };

        /* a dish name beats generic intents unless the intent is very strong */
        if (dishes.length && (!best || bs < 9) && !(price.cap && dishes.length > 1)) {
            if (dishes.length === 1) { const d = dishes[0]; return { h: dishCardHTML(d), a: addAct(d) }; }
            return { h: L('I found these:', 'ये मिले:') + ul(dishes.map(dishLine)), a: dishes.filter(d => d.available).slice(0, 3).map(d => ({ id: 'add:' + d.id, label: '+ ' + d.name })) };
        }
        /* price / veg / category lists */
        if (hasPriceWords && (!best || bs < 8 || ['menu', 'popular'].includes(best.id))) {
            const list = price.list.slice(0, 8);
            if (!list.length) return { h: L('No dishes match that. Try a higher budget or another category.', 'ऐसी कोई डिश नहीं मिली। बजट बढ़ाकर या दूसरी कैटेगरी में देखें।') };
            const title = L(`${price.veg ? 'Veg ' : price.nonveg ? 'Non-veg ' : ''}dishes${price.cats.length ? ' in ' + price.cats.join(', ') : ''}${price.cap ? ' up to ' + money(price.cap) : ''}:`, `${price.veg ? 'शाकाहारी ' : price.nonveg ? 'मांसाहारी ' : ''}डिश${price.cap ? ' ' + money(price.cap) + ' तक' : ''}:`);
            return { h: title + ul(list.map(dishLine)) + (price.list.length > list.length ? `<small>…and ${price.list.length - list.length} more</small>` : ''), a: list.slice(0, 3).flatMap(addAct) };
        }
        if (best && bs >= 3) {
            const r = best.fn(raw);
            return r;
        }
        /* nothing matched: offer the closest topics */
        const hint = INTENTS.filter(i => !i.staff || staffy()).map(i => ({ i, s: score(i, t, words) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
        return { h: L("Hmm, I'm not sure about that one 🤔. I can help with the menu & prices, offers, table booking, order tracking, timings and payments. Try asking in a few words, like \"paneer dishes under 250\" or \"table for 4 at 8 pm\".", 'हम्म, इस बारे में पक्का नहीं हूँ 🤔। मैं मेन्यू, कीमत, ऑफर, टेबल बुकिंग, ऑर्डर ट्रैकिंग, समय और भुगतान में मदद कर सकता हूँ। जैसे पूछें: "₹250 से कम पनीर डिश" या "8 बजे 4 लोगों की टेबल"।') + (hint.length ? '' : '') + `<small><br>${L('Need a human? Call', 'इंसान से बात करें:')} ${esc(DB.settings.phone)}</small>` };
    }

    /* ---------- actions that buttons inside answers can run ---------- */
    function doAct(id) {
        const [k, v] = id.split(':');
        if (k === 'add') { if (state.user) { cartAdd(v); } else { K.add(v); } return; }
        if (k === 'go') { close(); location.hash = '#/' + v; return; }
        if (k === 'book') { close(); if (state.user) openBookingModal(); else K.open('mBook'); return; }
        if (k === 'cust') { close(); if (v === 'menu') { const m = $('#kmenu'); if (m) m.scrollIntoView({ behavior: 'smooth' }); } else if (v === 'track') K.open('mTrack'); return; }
        if (k === 'theme') { applyTheme(getTheme() === 'bw' ? 'gold' : 'bw'); return; }
    }

    /* ---------- UI ---------- */
    const chipsFor = r => r === 'admin' ? ['Today\'s sales', 'Pending orders', 'Tables now', 'How to add a dish?', 'How to collect payment?', 'Bookings today']
        : r === 'staff' ? ['Pending orders', 'Tables now', 'Bookings today', 'How to collect payment?', 'How to print a bill?']
            : ['Today\'s offers', 'Popular dishes', 'Veg dishes under ₹150', 'Table for 4 tomorrow 8 pm', 'Track my order', 'Opening hours'];
    const chipsHi = ['आज के ऑफर', 'मशहूर डिश', '₹150 से कम शाकाहारी', 'खुलने का समय', 'टेबल बुक करें'];

    function save() { try { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-40))); localStorage.setItem(ROLE_KEY, role()); } catch (e) { /* ignore */ } }
    function render() {
        const box = $('#botMsgs');
        if (!box) return;
        box.innerHTML = msgs.map((m, i) => `<div class="bm ${m.r}">${m.h}${m.a && m.a.length ? `<div class="bm-acts">${m.a.map(a => `<button type="button" data-bact="${esc(a.id)}">${esc(a.label)}</button>`).join('')}</div>` : ''}</div>`).join('');
        box.scrollTop = box.scrollHeight;
        $('#botChips').innerHTML = (lang === 'hi' && !staffy() ? chipsHi : chipsFor(role())).map(c => `<button type="button" data-bchip="${esc(c)}">${esc(c)}</button>`).join('');
        $('#botSub').textContent = staffy() ? 'Staff helper – live data & how-to' : 'Ask me about the menu, orders, tables…';
    }
    function push(r, h, a) { msgs.push({ r, h, a }); save(); render(); }
    function say(text, instant) {
        const box = $('#botMsgs');
        const reply = () => { const t = box.querySelector('.typing'); if (t) t.remove(); const r = answer(text); push('bot', r.h, r.a); };
        if (instant) return reply();
        const ty = document.createElement('div'); ty.className = 'bm bot typing'; ty.innerHTML = '<i></i><i></i><i></i>'; box.appendChild(ty); box.scrollTop = box.scrollHeight;
        setTimeout(reply, 320 + Math.random() * 380);
    }
    function ask(text) {
        text = String(text || '').trim();
        if (!text) return;
        push('me', esc(text));
        say(text);
    }
    function greeting() {
        const r = role();
        return L(`Hi! I'm <b>FlavorBot</b> 🤖. ${r === 'admin' || r === 'staff' ? 'Ask me for live numbers (orders, tables, bookings) or how to do something in the app.' : 'Ask me about dishes, prices, offers, table availability or your order.'}`, 'नमस्ते! मैं <b>FlavorBot</b> हूँ 🤖। मेन्यू, कीमत, ऑफर, टेबल या अपने ऑर्डर के बारे में पूछें।');
    }
    function reset() { msgs = []; pending = null; push('bot', greeting()); }
    function setOpen(o) {
        isOpen = o;
        $('#botPanel').classList.toggle('open', o);
        $('#botPanel').setAttribute('aria-hidden', o ? 'false' : 'true');
        $('#botFab').setAttribute('aria-expanded', o ? 'true' : 'false');
        $('#botFab').classList.remove('has-new');
        try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* ignore */ }
        if (o) { if (role() !== localStorage.getItem(ROLE_KEY) || !msgs.length) reset(); else render(); if (!window.matchMedia('(max-width: 640px)').matches) setTimeout(() => $('#botInput').focus(), 150); }
    }
    function init() {
        try { msgs = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]') || []; } catch (e) { msgs = []; }
        if (!localStorage.getItem(SEEN_KEY)) $('#botFab').classList.add('has-new');
        $('#botFab').addEventListener('click', () => setOpen(!isOpen));
        $('#botClose').addEventListener('click', () => setOpen(false));
        $('#botClear').addEventListener('click', reset);
        $('#botForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#botInput'); const v = i.value; i.value = ''; ask(v); });
        $('#botPanel').addEventListener('click', e => {
            const c = e.target.closest('[data-bchip]'); if (c) return ask(c.dataset.bchip);
            const a = e.target.closest('[data-bact]'); if (a) doAct(a.dataset.bact);
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) setOpen(false); });
    }
    function close() { if (isOpen) setOpen(false); }
    return { init, answer, ask, open: () => setOpen(true), close, reset };
})();

/* ---------- start ---------- */
function boot() {
    loadDB();
    loadCart();
    $$('[data-ic]').forEach(e => { if (!e.innerHTML.trim()) e.innerHTML = ic(e.dataset.ic, +e.dataset.size || 18); });
    document.title = DB.settings.name + ' – Restaurant Management';
    let th = 'gold'; try { th = localStorage.getItem(THEME_KEY) || 'gold'; } catch (e) { /* ignore */ }
    applyTheme(th, true);
    initLogin();
    setLoginRole(user_last_role());
    setScreen('login');
    K.init();
    BOT.init();
    const u = savedSessionUser();
    if (u) { $('#login').classList.add('hidden'); enterApp(u, true); }
    else if (location.hash === '#customer') K.enter(K.loadProfile());
    else { const cp = K.loadProfile(); if (cp && cp.phone) K.enter(cp); }
    loadDishPhotos();
}
boot();