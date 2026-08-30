<p align="center">
  <a href="https://vizhabooks.onrender.com">
    <img src="https://raw.githubusercontent.com/manojrajm/VizhaBook/main/frontend/public/logo.png" alt="VizhaBook Enterprise Logo" width="160" />
  </a>
</p>

<h1 align="center">🪔 VizhaBook — விழா புக்</h1>
<h3 align="center">Enterprise SaaS Event & Digital Moi Management Platform</h3>

<p align="center">
  <a href="https://vizhabooks.onrender.com"><b>🌐 Live App Demo</b></a> •
  <a href="https://vizhabooks-backend.onrender.com"><b>⚡ Live API Backend</b></a> •
  <a href="#-contributing--pull-request-pr-guide"><b>🤝 PR Guidelines</b></a> •
  <a href="#-frequently-asked-questions-faq"><b>💬 FAQ</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-0ms_Sync-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=black" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Bilingual-English_%7C_%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D-7C3AED?style=for-the-badge" />
</p>

---

## ✨ Overview

**VizhaBook** (விழா புக்) is an MNC-grade, full-stack digital event and **Moi** (மொய்) accounting platform designed for traditional South Indian celebrations — Weddings (திருமணம்), Engagements (நிச்சயதார்த்தம்), Receptions, and House Warmings (கிரஹப்பிரவேசம்).

It replaces handwritten notebook records with a **cloud-backed, real-time multi-device platform** featuring direct Google Pay / PhonePe / Paytm deep-linking, entrance QR code self check-in, automated Tamil WhatsApp digital receipts, and 0ms WebSockets multi-counter synchronization.

---

## 📖 User Manual & Complete App Workflow

Follow this step-by-step workflow to manage any celebration from start to finish:

```
[ Step 1: Create Function ] ➔ [ Step 2: Add UPI/Bank Handles ] ➔ [ Step 3: Multi-Counter Entry ] ➔ [ Step 4: QR Check-In & Approvals ] ➔ [ Step 5: WhatsApp Receipt & Analytics ]
```

### 1️⃣ Step 1: Create & Setup Your Event (`/functions`)
1. Go to **Celebration Events** (`/#/functions`) and click **+ Create Function**.
2. Enter Function Name (e.g., *Manoj & Preeti Wedding*), Event Date, Venue, and Description.
3. Save the function. It is now active and ready to receive gift entries.

### 2️⃣ Step 2: Configure Host Payment Methods & UPI (`/payment-methods`)
1. Open **Payment Methods** (`/#/payment-methods`).
2. Add your Bank Account and verified UPI ID (e.g. `gauthamtamizha007-1@oksbi`).
3. Set the default UPI ID. This automatically generates pre-filled Google Pay / PhonePe / Paytm deep-linking QR codes.

### 3️⃣ Step 3: Operate Multi-Counter Entry Desks (`/entry`)
1. Staff at the **Reception Desk** or **Stage** log in on their laptops/mobile phones.
2. Select entry location:
   - 🏛️ **`reception_counter`** (Reception Desk)
   - 👑 **`stage_present`** (Gifts presented on Stage)
3. Type Guest Name, Village/City, Amount, and Gift Type (Cash / Jewel / Gift Item).
4. Save entry. All connected devices update in **0ms real-time** via WebSockets!

### 4️⃣ Step 4: Entrance QR Display & Guest Self Check-In (`/qr-display` ➔ `/checkin` ➔ `/approvals`)
1. **Host Tablet**: Open `/qr-display` on a tablet at the entrance hall. A large QR code appears.
2. **Guest Phone**: Guests scan the entrance QR on their phone (`/checkin`) -> type their name, amount, and pay using Google Pay / PhonePe directly to the host's UPI handle.
3. **Pending Approvals Queue**: Submissions go to Host Approvals (`/approvals`). Host verifies UTR/amount and clicks **✅ Approve** to move it to the official ledger.

### 5️⃣ Step 5: Send Digital Receipts & View Analytics (`/ledger` & `/analytics`)
1. **Digital Receipts**: Upon saving or approving an entry, an automated Tamil/English digital receipt is formatted for WhatsApp dispatch to the guest's mobile number.
2. **Moi Ledger (`/ledger`)**: Search, filter, and export cash vs. digital collections.
3. **Analytics (`/analytics`)**: Track hourly peak throughput, donor leaderboards, and relationship distributions.

---

## 📑 Detailed Page-by-Page Purpose Guide

| Page Route | Page Name | Primary User | Purpose & Key Features |
|:---|:---|:---|:---|
| `/#/` | **Dashboard** | Host / Manager | **Central Command Hub**: Displays live collection totals, total guest counts, recent stream entries, and quick shortcuts. |
| `/#/functions` | **Functions** | Host / Manager | **Event Management**: Create, edit, search, filter, and archive celebrations. Includes subscription limit enforcement. |
| `/#/entry` | **Moi Entry** | Desk / Stage Staff | **Rapid Gift Entry**: Voice input support, Stage Present vs Reception Counter toggle, payment mode selection, and greeting card creation. |
| `/#/ledger` | **Moi Ledger** | Host / Auditor | **Master Accounting Book**: Search by name/village, filter by source (Stage / Reception / QR), view payment breakdown, and print total footers. |
| `/#/analytics` | **Analytics** | Host / Auditor | **Data Insights**: 5 live charts — Collection Trend, Relation Pie Chart, Gift Type Split, Hourly Peak Hours, and Ranked Donor Leaderboard 🥇. |
| `/#/qr-display` | **QR Display** | Entrance Display | **Venue Banner**: Large animated QR display for venue entrance hall to enable guest self check-in. |
| `/#/checkin` | **Guest Check-In** | Venue Guests | **Mobile Self Check-In**: Guest self-entry form with 1-tap Google Pay / PhonePe deep-linking to host's UPI handle. |
| `/#/approvals` | **Pending Approvals** | Host | **Verification Queue**: Host queue to review, edit guest amounts, approve into ledger, or reject invalid submissions with 5s polling + WebSockets. |
| `/#/payment-methods` | **Payment Methods** | Host | **Bank & UPI Manager**: Add host bank accounts, GPay handles (`@oksbi`), QR code generators, and default status toggles. |
| `/#/expenses` | **Expense Tracker** | Host | **Event Budgeting**: Record catering, hall rental, decoration, and vendor costs categorized by function. |
| `/#/settings` | **Settings** | Host | **Account Preferences**: Manage account profile, business details, language preferences (EN / தமிழ்), and theme settings. |
| `/#/pricing` | **Pricing & Plans** | Host | **Subscription Plans**: Upgrade event limits, view active plan benefits, and manage subscription renewals. |

---

## 🔒 Security & Data Privacy

VizhaBook is built with enterprise security controls to protect financial records and personal data:

- 🛡️ **Multi-Tenant Account Isolation**: Every user account is strictly isolated using PostgreSQL `account_id` foreign keys and Row-Level Security patterns.
- 🔑 **Stateless JWT Authorization**: API routes are protected by JSON Web Tokens signed with `JWT_SECRET`. Unauthenticated requests are rejected with `401 Unauthorized`.
- ⚡ **Atomic Concurrency Row Locks**: Host approval queries use `SELECT ... FOR UPDATE` row locks to prevent race conditions during high-volume simultaneous entries.
- 🌐 **Strict CORS Production Security**: Backend API and Socket.io servers strictly whitelist allowed frontend origins (`https://vizhabooks.onrender.com`).

---

## 💬 Frequently Asked Questions (FAQ)

<details>
<summary><b>Q1: Can multiple users log in on different devices at the same time?</b></summary>
<br />
<b>YES! 100%.</b> VizhaBook uses stateless JWT tokens. Multiple staff members (e.g. 3 at Reception Desk, 2 on Stage) can log in concurrently on their mobile phones and laptops using the same account. All devices stay in <b>0ms real-time sync</b> via Socket.io WebSockets!
</details>

<details>
<summary><b>Q2: Does VizhaBook work on Mobile Phones & Tablets?</b></summary>
<br />
<b>YES!</b> VizhaBook is a fully responsive Progressive Web App (PWA). It works seamlessly on iOS iPhones, Android smartphones, tablets, and desktop computers.
</details>

<details>
<summary><b>Q3: How does direct UPI Payment Deep-Linking work?</b></summary>
<br />
When guests tap <b>Pay with Google Pay / PhonePe</b> on their mobile phones (`/checkin`), VizhaBook generates a native <code>upi://pay</code> URI containing the host's VPA handle (`@oksbi`) and gift amount. The guest's phone opens Google Pay directly with the transaction pre-filled.
</details>

<details>
<summary><b>Q4: What happens if two guests submit entries at the exact same millisecond?</b></summary>
<br />
The Node.js event loop queues requests asynchronously, and PostgreSQL handles concurrent writes via Multi-Version Concurrency Control (MVCC). Every entry gets a collision-proof unique ID (`m_TIMESTAMP_RANDOM`). Neither entry will be lost or cause a server crash!
</details>

---

## 🧪 Testing & Quality Assurance

To ensure code quality and build compliance before pushing to production:

```bash
# Frontend Vite Build Compliance Check
cd frontend
npm run build

# Backend Database Health Verification
curl https://vizhabooks-backend.onrender.com/api/test-db
```

---

## 🤝 Contributing & Pull Request (PR) Guide

We welcome contributions from developers to make VizhaBook even better! Follow these professional steps to fork, develop, and submit a Pull Request (PR):

### 🍴 Step 1: Fork the Repository
Click the **Fork** button at the top right of the repository page ([`manojrajm/VizhaBook`](https://github.com/manojrajm/VizhaBook)) to create your personal copy of the repository.

### 📥 Step 2: Clone Your Fork Locally
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/VizhaBook.git
cd VizhaBook
```

### 🌿 Step 3: Create a Feature Branch
Create a descriptive branch for your new feature or bug fix:
```bash
git checkout -b feature/add-new-feature
```

### 🛠️ Step 4: Install Dependencies & Run Locally
```bash
# Terminal 1: Backend Setup
cd backend
npm install
npm run dev

# Terminal 2: Frontend Setup
cd frontend
npm install
npm run dev
```

### 📝 Step 5: Commit & Push Your Changes
Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `style:`):
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/add-new-feature
```

### 🔀 Step 6: Create a Pull Request (PR)
1. Navigate to the original repository [`manojrajm/VizhaBook`](https://github.com/manojrajm/VizhaBook).
2. Click **New Pull Request** and select your branch `feature/add-new-feature`.
3. Fill out the PR template description with:
   - **Summary of Changes**: What feature/fix was added.
   - **Screenshots / Recordings**: Visual proof of testing.
   - **Verification**: Run `npm run build` in `frontend/` to confirm 0 build errors.
4. Click **Create Pull Request** for review!

---

## ⚡ Key Technical Innovations

- **⚡ 0ms Socket.io WebSockets Sync**: Multi-counter real-time event broadcasting over WSS.
- **🛡️ PostgreSQL Atomic Row-Locking**: `FOR UPDATE` queries prevent duplicate approvals during concurrent writes.
- **📱 `upi://pay` Deep-Linking**: Opens native GPay / PhonePe apps with host VPA and payee name pre-filled.
- **📲 Tamil WhatsApp Receipts**: Auto-dispatched digital receipts via WhatsApp Webhooks/API.
- **☁️ Supabase Cloud DB**: PostgreSQL 15 relational backend with multi-tenant account isolation.

---

## 🌐 Production Deployment

- **Frontend App**: [https://vizhabooks.onrender.com](https://vizhabooks.onrender.com)
- **Backend API**: [https://vizhabooks-backend.onrender.com](https://vizhabooks-backend.onrender.com)

---

## 📜 License & Copyright

Distributed under the **[MIT License](LICENSE)**. Copyright (c) 2026 **ManojRaj & VizhaBook Team**. See [`LICENSE`](LICENSE) for more information.

---

## 👤 Author & Support

Developed with excellence by **ManojRaj**.

<p align="center">
  <a href="https://github.com/manojrajm">
    <img src="https://img.shields.io/badge/GitHub-manojrajm-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="mailto:gauthamtamizha007@gmail.com">
    <img src="https://img.shields.io/badge/Gmail-Contact_Developer-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
</p>

---

<p align="center">
  <i>"VizhaBook — Digitizing Tradition with Enterprise Engineering."</i>
</p>
