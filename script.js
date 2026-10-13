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
        version: 1, seq: 1000, settings,
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

    return db;
}

function loadDB() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.dishes) && Array.isArray(parsed.orders)) {
                DB = parsed;
                DB.settings = { ...DEFAULT_SETTINGS, ...DB.settings };
                DB.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                return;
            }
        }
    } catch (e) { /* fall through to seed */ }
    DB = seedDB();
    saveDB();
}
function saveDB() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }
    catch (e) {
        if (!storageWarned) { storageWarned = true; toast('Could not save – browser storage is full or blocked', 'error'); }
    }
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
        const user = DB.users.find(x => x.username.toLowerCase() === u && x.password === p);
        if (!user) return loginError('Incorrect username or password');
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
}
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
    return `<div class="tile" style="--h:${catHue(d.cat)}"><span class="plate"><span class="emo">${esc(d.emoji || '🍽️')}</span></span>${d.img ? `<img src="${esc(d.img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`;
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
      <div><span>Payment</span><b>${METHOD_LABEL[o.method]} · ${refunded ? 'Refunded' : 'Paid'}</b></div>
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
            const max = 480, k = Math.min(1, max / Math.max(img.width, img.height));
            const cv = document.createElement('canvas');
            cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            cb(cv.toDataURL('image/jpeg', 0.8));
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
        return `${CHART_COLORS[i % CHART_COLORS.length]} ${a}% ${b}%`;
    }).join(',');
    return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops})"><span><b>${money(total)}</b><small>total</small></span></div>
    <ul class="legend-list">${items.map((it, i) => `<li><i style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></i><span>${esc(it.label)}</span><b>${Math.round(it.value / total * 100)}%</b></li>`).join('')}</ul></div>`;
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
            <p>${TYPE_LABEL[o.type]}${o.tableId ? ' · ' + esc(tableById(o.tableId)?.name || '') : ''} · ${o.items.reduce((s, i) => s + i.qty, 0)} items · ${timeAgo(o.createdAt)}</p></div>
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
      <td>${METHOD_LABEL[o.method]}<small class="${o.paymentStatus === 'paid' ? 'ok' : 'bad'}">${o.paymentStatus === 'paid' ? 'Paid' : 'Refunded'}</small></td>
      <td>${statusBadge(o.status)}</td>
      <td class="r acts">
        ${NEXT_STATUS[o.status] ? `<button class="btn gold xs" data-action="advance" data-id="${o.id}">${NEXT_LABEL[o.status]}</button>` : ''}
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
      <td><b>${esc(b.name)}</b><small>${esc(b.phone)}</small></td><td>${b.guests}</td><td>${esc(tableById(b.tableId)?.name || '-')}</td>
      <td class="items-cell">${esc(b.note) || '<span class="muted">–</span>'}</td>
      <td><span class="badge bk-${b.status}">${b.status[0].toUpperCase() + b.status.slice(1)}</span></td>
      <td class="r acts">${b.status === 'confirmed' ? `<button class="btn gold xs" data-action="bk-complete" data-id="${b.id}">Seated / done</button>
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
    <select data-input="pay" data-k="status" aria-label="Status"><option value="all">Paid &amp; refunded</option><option value="paid" ${f.status === 'paid' ? 'selected' : ''}>Paid</option><option value="refunded" ${f.status === 'refunded' ? 'selected' : ''}>Refunded</option></select>
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
    <div class="stat"><span class="s-ic gold">${ic('rupee', 20)}</span><div><small>Collected</small><b>${money(paid.reduce((s, o) => s + o.total, 0))}</b><em>${paid.length} payments</em></div></div>
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
      <td><span class="badge m-${o.method}">${METHOD_LABEL[o.method]}</span></td>
      <td>${esc(o.ref) || '<span class="muted">–</span>'}</td>
      <td class="r"><b>${money(o.total)}</b></td>
      <td><span class="badge ${o.paymentStatus === 'paid' ? 'st-completed' : 'st-cancelled'}">${o.paymentStatus === 'paid' ? 'Paid' : 'Refunded'}</span></td>
      <td class="r acts">
        <button class="icon-btn dark" data-action="view-order" data-id="${o.id}" title="View bill" aria-label="View bill">${ic('eye', 17)}</button>
        <button class="icon-btn dark" data-action="print" data-id="${o.id}" title="Print bill" aria-label="Print bill">${ic('printer', 17)}</button>
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
            () => { b.status = 'cancelled'; saveDB(); toast('Booking cancelled'); refreshView(); });
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
    if (fn) fn(t, e);
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
$$('.demo-chip').forEach(b => b.addEventListener('click', () => {
    const [u, p] = b.dataset.demo.split('|');
    $('#lfUser').value = u; $('#lfPass').value = p; $('#lfError').textContent = '';
    $('#lfSubmit').focus();
}));
$('#lfForgot').addEventListener('click', e => { e.preventDefault(); toast('Ask an admin to reset it in Settings → Staff accounts'); });

/* ---------- start ---------- */
function boot() {
    loadDB();
    loadCart();
    $$('[data-ic]').forEach(e => { if (!e.innerHTML.trim()) e.innerHTML = ic(e.dataset.ic, +e.dataset.size || 18); });
    document.title = DB.settings.name + ' – Restaurant Management';
    initLogin();
    const u = savedSessionUser();
    if (u) { $('#login').classList.add('hidden'); enterApp(u, true); }
}
boot();
