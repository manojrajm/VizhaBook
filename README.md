<p align="center">
  <img src="public/logo.png" alt="Vizha Book Logo" width="120" />
</p>

# 🪔 Vizha Book — விழா புக்

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" />
  <img src="https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=javascript&logoColor=white" />
  <img src="https://img.shields.io/badge/bilingual-EN%20%7C%20Tamil-blueviolet?style=for-the-badge" />
</p>

---

## ✨ What is Vizha Book?

**Vizha Book** is a premium, bilingual digital ledger for tracking **Moi** (மொய்) — the South Indian tradition of gifting cash and presents at family functions like Weddings, Engagements, and House Warmings.

It replaces the traditional handwritten notebook with a stunning, fully offline-capable digital platform.

> [!IMPORTANT]
> **100% Offline & Private** — All data is stored in your browser's `localStorage`. No server, no login, no cloud. Data is fully private and works without internet.

---

## 🚀 Feature Overview

### Core Features
- **⚡ Rapid Moi Entry** — Record name, relation, and amount in seconds. Guest auto-created in the background.
- **🎴 Greeting Card Generator** — Every entry instantly produces a premium Thank-You card with the function's **host name** dynamically printed at the bottom.
- **📲 Direct WhatsApp Greeting** — Captures the card as a PNG image and opens **WhatsApp directly to the guest's mobile number** (`wa.me/91XXXXXXXXXX?text=...`). Pre-fills the greeting text. Works on both mobile and desktop.
- **📋 Smart Ledger** — Full entry history with search, function filter, and a live **Total Amount** footer.
- **🎊 Function Management** — Manage multiple events (e.g., *Suresh & Preeti Wedding*, *Karthik's Reception*) simultaneously.
- **🌐 Bilingual (EN / தமிழ்)** — Fully togglable between English and Tamil.
- **🌙 Dark Mode** — Elegant light and dark themes.

### 🔥 New Pro Features

#### ● LIVE Real-time Sync (BroadcastChannel)
- A **● LIVE** badge pulses on the Navbar at all times.
- Any data change (entries, pending, functions) instantly syncs across **all open browser tabs** in real-time via the `BroadcastChannel` API.
- No setup required — works out of the box.

#### 📱 QR Code Guest Self-Check-In
- **Host** opens `/qr-display` on a tablet — a large animated QR code is displayed.
- **Guests** scan the QR on their phone → fill in their own name, relation, and amount → submit.
- Submissions go into a **Pending Queue** — not saved directly, preventing wrong-amount bugs.
- **Host** reviews each pending entry at `/approvals`:
  - ✏️ **Edit** the amount if the guest typed incorrectly.
  - ✅ **Approve** → moves to the final Ledger.
  - ❌ **Reject** → discards the entry.
- Red notification **badge** appears on the Navbar when approvals are waiting.

#### 📊 Analytics Dashboard (`/analytics`)
Five live data visualizations powered by Recharts:

| Chart | Type | What it shows |
|---|---|---|
| Collection Trend | AreaChart | Monthly gift totals |
| Guest Relations | PieChart | Relative / Friend / Colleague breakdown |
| Gift Type Distribution | BarChart | Cash / Jewel / Gift Item counts |
| Peak Hours | BarChart | Entry count per hour of day |
| Top 5 Donors | Animated Leaderboard | Ranked donors with progress bars & medal badges 🥇🥈🥉 |

---

## 🎨 Design System

> [!TIP]
> Every card in the app has true Framer Motion **3D tilt physics** — hover your mouse over any card and it physically leans toward your cursor in real-time.

- **Classic Midnight Sapphire Palette** — Deep navy & sapphire gradients on a clean Slate background with Premium Gold accents. Replaces the previous festive pink theme.
- **Interactive 3D Card Tilt** — `useMotionValue` + `useSpring` tracks mouse position → `rotateX / rotateY` at `perspective: 1000px`.
- **Glassmorphism** — `backdrop-filter: blur(20px)` layered throughout all modals, cards, and the mobile menu.
- **Physical 3D Shadows** — Layered `box-shadow` with inset bevels (`--shadow-3d`, `--shadow-inset`) for a floating glass object effect.
- **Animated Mobile Navigation** — Framer Motion spring hamburger menu with glassmorphic overlay.

---

## 🛠️ Tech Stack

| Component | Technology | Role |
|:---|:---|:---|
| Framework | React 19 (Vite 7) | App Shell & Reactivity |
| Routing | React Router DOM v7 | Page Navigation |
| UI Animations | Framer Motion 12 | 3D Tilt, Spring Menus, Transitions |
| Charts | Recharts | Analytics Dashboard |
| Icons | Lucide React | Icon system |
| Styling | Vanilla CSS | Custom Design System with CSS Variables |
| QR Code | qrcode.react | Guest Self Check-In QR Display |
| Confetti | canvas-confetti | Entry Success Celebration |
| Image Capture | html2canvas | Greeting Card → PNG export |
| Real-time Sync | BroadcastChannel API | Cross-tab live sync |

---

## 📂 App Pages

| Route | Page | Who Uses It |
|:---|:---|:---|
| `/` | Dashboard | Overview, metrics, recent entries |
| `/functions` | Functions | Create & manage family events |
| `/entry` | Moi Entry | Record gifts, generate greeting card |
| `/ledger` | Ledger | Full history with filters & totals |
| `/analytics` | Analytics | Charts, trends, leaderboard |
| `/qr-display` | QR Display | Host — shows big QR on tablet |
| `/checkin` | Guest Check-In | Guest's phone — self-entry form |
| `/approvals` | Pending Approvals | Host — verify, edit & approve entries |

---

## ⚡ Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:8080` in your browser.

---

## 👤 Credits

Developed with passion by **ManojRaj**.

<p align="center">
  <a href="https://github.com/manojrajm">
    <img src="https://img.shields.io/badge/GitHub-manojrajm-b084ff?style=flat-square&logo=github" />
  </a>
  <a href="mailto:gauthamtamizha007@gmail.com">
    <img src="https://img.shields.io/badge/Email-Contact_Me-b084ff?style=flat-square&logo=gmail" />
  </a>
</p>

---
<p align="center">
  <i>"Building the future, one pixel at a time."</i>
</p>
