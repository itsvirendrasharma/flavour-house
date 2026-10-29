# 🍴 Flavor House – Restaurant Ordering, Billing & Management

Three files, no installation, no server: put `index.html`, `style.css`, `script.js` in one folder and open `index.html` in a browser.

> **हिंदी सार:** यह ऐप अब फोन पर ठीक से चलता है, कस्टमर पेज स्क्रॉल होता है, Admin / Staff / Customer के लिए अलग लॉगिन हैं, टेबल बुकिंग + ऑर्डर + पेमेंट सब आपस में जुड़े हैं और सब `localStorage` में सेव होता है। Black & White थीम (◐ बटन) और **FlavorBot** (मदद करने वाला असिस्टेंट, हिंदी/English) जोड़ा गया है। सब कुछ सिर्फ JavaScript में है – कोई अलग AI फ़ाइल नहीं चाहिए।

---

## 1. Logins (three separate doors)

On the first screen choose a tab:

| Tab | Who | Demo account | Can do |
|---|---|---|---|
| **Admin** | owner / manager | `admin` / `admin123` | everything: menu editing, reports, refunds, settings, staff accounts |
| **Staff** | cashier / waiter / kitchen | `staff` / `staff123` | orders, billing, bookings, customers, payments (no reports / settings / refunds / menu editing) |
| **Customer** | guests | name + mobile, e.g. **Aarav 9876501234** (has a live demo order), or *Continue as guest* | browse menu, order (dine-in / takeaway / delivery), book a table, track orders & bookings, "order ready" alert |

* An admin account cannot sign in on the Staff tab and vice versa (keeps the two doors separate).
* Admin can add more staff/admin accounts in **Settings → Staff accounts**.
* "Keep me signed in" remembers you; otherwise you are signed out when the tab closes.

## 2. How everything is connected

```
Customer places order ─────────► Staff → Orders / Dashboard "Live orders" (toast + sound)
Staff: Start cooking / Mark ready ─► Customer sees status bar + "READY" banner, sound, vibration
Customer books a table ────────► Staff → Table Booking (table is blocked for that time)
Staff: "Take order" on a booking ─► Menu opens with that guest's table, name & phone filled in
Online order is UNPAID ────────► Staff presses Collect (cash/card/UPI) → becomes revenue
Every phone number ────────────► one Customer record (history, total spent, Silver/Gold tier)
Menu / price / sold-out / offer ─► instantly the same on staff and customer screens
```

* **Customer orders are "pay at the restaurant / on delivery".** They stay *Unpaid* and do **not** count as sales until staff collect the payment (Orders or Payments → **Collect**; completing an unpaid order asks for payment first).
* Cancelling an unpaid order = *Not charged*; cancelling a paid order = *Refunded*.
* Billing is calculated in one place (`calcTotals`): offer or coupon (the bigger one wins), delivery fee, GST, round-off.
* Coupons: `WELCOME10` (10 % above ₹200), `FLAT50` (₹50 above ₹400), `FEAST20` (20 % above ₹1000). The automatic "spend more, save more" offer is set in Settings.

## 3. Saving data (localStorage)

Everything is saved automatically in the browser:

| Key | What |
|---|---|
| `flavorhouse_db_v1` | dishes, categories, tables, orders, bookings, customers, users, settings |
| `flavorhouse_cart_v1` | staff basket |
| `fh_ucart`, `fh_utype`, `fh_customer`, `fh_cphone`, `fh_cnotes` | customer basket, signed-in customer, notification memory |
| `fh_theme`, `fh_lastrole`, `fh_collapsed` | theme, last login tab, sidebar state |
| `fh_bot_chat_v2` | assistant chat history |

* **Settings → Download backup / Restore backup / Reset to demo data.**
* Data saved by an older version still works – it is upgraded automatically and the new demo orders/bookings are added once.

### ⚠️ How the data is shared (important)
localStorage belongs to **one browser on one device**. Customer and staff screens share live data when they are open in **two tabs/windows of the same browser** (e.g. a tablet at the counter with a customer tab and a staff tab). A customer's own phone and the restaurant's computer do **not** see each other. To make that work you need a small server/database (Firebase, Supabase, …); the code is structured so only `loadDB / saveDB / syncDB` would need to change.

## 4. Demo data

* 33 dishes in 5 categories, 10 tables, 12 customers, ~150 orders over 14 days (reports and charts are not empty).
* Live kitchen orders, plus **online orders** in different stages (cooking, pending, ready-for-delivery, paid, cancelled).
* 13 bookings: today, tomorrow, upcoming, completed and cancelled.
* Try it: sign in as **Customer → Aarav** to see a live order with a progress bar; open the **Admin** tab in another tab and press *Mark ready*.

## 5. Phones

* Customer page scrolls properly (it was locked before), with a sticky **basket bar**, bottom-sheet pop-ups, 2-column menu, scrollable chips.
* Staff app: side menu drawer (also has Theme & Password), tables become **readable cards**, bigger touch targets, 16 px fields (no iOS zoom), safe-area support for notches.
* Assistant opens full-screen on phones.

## 6. Animations

Login card & logo, floating food, page-load sequence on the customer page (header drop, hero text rise, drifting emoji), staggered dish cards, press feedback on buttons, basket bump, drawer/sheet slide, order progress bar fill, pulsing **READY** badge. All of them respect the device's *reduce motion* setting.

## 7. Black & White theme

Press **◐** (login card, staff header, customer header, or *Theme* in the phone menu). Everything becomes monochrome; the meaning that used colour is kept by shape: veg = ● circle, non-veg = ▲ triangle, tables free / reserved / occupied = outline / dashed / solid black, order statuses use dashed / grey / black chips. The choice is remembered.

## 8. FlavorBot – the built-in assistant (JavaScript only)

Tap the 💬 **Help** button. No server, API key or extra file – it is part of `script.js` (search for `const BOT`).

**What it is:** a retrieval/intent engine, *not* a large language model. It cleans the sentence, forgives spelling mistakes, scores keyword intents (English, Hinglish and हिंदी) and builds the answer from the **live database**.

**Customers can ask:** "price of paneer tikka", "veg dishes under ₹150", "popular dishes", "any offers?", "is a table free for 4 tomorrow at 8 pm?", "track my order" / "FH-1005" / a phone number, opening hours, address, payment, delivery, allergy tips, "ऑफर क्या हैं", "टेबल बुक करें".
**Staff / Admin can also ask:** today's sales (admin), pending orders, tables now, today's bookings, and how-to steps (collect payment, add a dish, refunds, GST, staff accounts, backup, print bill). Customers asking for sales or admin info are politely refused.

**Teach it something new:** add an object to the `INTENTS` array in `script.js`:
```js
{ id: 'parking', k: [['parking', 5], ['पार्किंग', 5]], fn: () => ({ h: 'Free parking behind the building.' }) }
```
`k` = keywords with weights, `fn` returns `{h: htmlAnswer, a: [{id, label}] buttons}`.

**Limits (honest):** it only knows this restaurant's data and the topics above; it has no ingredient/allergen lists and cannot chat about general topics. Connecting a real LLM needs a backend (never put an API key in a browser file).

## 9. File map

* `index.html` – structure: login (3 tabs), staff app shell, customer page, assistant widget.
* `style.css` – original design + a clearly marked **VERSION 2** block (mobile, customer fixes, animations, assistant, Black & White).
* `script.js` – database & seed, billing, staff views, events, **extras** (theme, login roles, sync, collect payment), **customer module `K`**, **assistant `BOT`**, `boot()`.

## 10. Known limits / next steps

* Passwords are stored in plain text in localStorage – fine for a demo/offline counter, **not** for the internet. Use a real backend before going public.
* Card/UPI payments are simulated (no payment gateway).
* Dish photos are fetched from Wikipedia once when online and then cached; emoji tiles are the fallback.
