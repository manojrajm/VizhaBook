<p align="center">
  <a href="https://vizhabooks.onrender.com">
    <img src="public/logo.png" alt="VizhaBook Enterprise Logo" width="160" />
  </a>
</p>

<h1 align="center">🪔 VizhaBook — விழா புக்</h1>
<h3 align="center">Enterprise SaaS Event & Digital Moi Management Platform</h3>

<p align="center">
  <a href="https://vizhabooks.onrender.com"><b>🌐 Live App Demo</b></a> •
  <a href="https://vizhabooks-backend.onrender.com"><b>⚡ Live API Backend</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-0ms_Sync-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=black" />
  <img src="https://img.shields.io/badge/Bilingual-English_%7C_%E0%AE%A4%E0%AE%BF%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D-7C3AED?style=for-the-badge" />
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
