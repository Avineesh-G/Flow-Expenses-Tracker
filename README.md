# 🌱 Flow — Personal Expense & Savings Tracker

A calm, tactile, premium-feeling personal finance companion built with **React, TypeScript, Tailwind CSS, and Framer Motion**. Designed for public use — no server required, all data stays on your device.

## 📖 Philosophy
This is not a spreadsheet with a UI. It feels like a *personal financial companion* — quiet, soothing, low-anxiety, and satisfying to interact with. Every interaction reduces friction and guilt. Insights are phrased factually and non-judgmentally. The app rewards saving as much as it tracks spending.

---

## ✨ Features (V2)

### 🔐 Google Authentication
- Sign in securely with your Google account.
- **Session persists** across page refreshes — no need to log in every time.
- Your Google profile name is automatically synced into your settings.

### 📧 Gmail Smart Sync
- Syncs transaction emails from **14 trusted Indian banking and e-commerce domains** (HDFC, SBI, Axis, ICICI, Flipkart, and more).
- **Full history sync** — fetches ALL matching emails, not just the last month.
- **Smart parsing** automatically extracts amount, merchant, and category from email body.
- **Manual review modal** — approve, skip, or dismiss each transaction before it's saved.
- **Auto-sync on 1st of each month** — opens a review modal automatically with new transactions.
- One-tap **Sync Gmail** button on the home screen for on-demand sync.
- Sync button shows friendly "No new spending found. You're all caught up!" when nothing is new.

### 🏠 Home Screen
- Contextual greeting: **Good morning / afternoon / evening, [Name]**
- **Safe to Spend Today** card showing daily, weekly, and monthly budgets at a glance.
- **Daily limit** displayed on the card for instant reference.
- **Motivational quote system**:
  - 🌱 Saved today (₹0 spent) → Saving encouragement quote
  - ✅ Under daily limit → Positive reinforcement quote
  - ⚠️ Over daily limit → Gentle, non-judgmental recovery quote
- Unusual spending detection with multiplier and category driver.

### 📊 Spending Tracker & Insights
- Monthly spending breakdown by category with a donut chart.
- Navigate between months to view historical data.
- Manually add, edit, or delete any expense.
- **Student Mode** with pocket money limit and auto-calculated daily limit.

### 📅 Calendar View
- Visual day-by-day spending heatmap (low / medium / high spend days).
- Tap any date to see the category breakdown for that day.
- **Monthly Report** section (Coming Soon) — will auto-generate a full spending summary on the 1st of each month.

### ⚙️ Settings
- Edit your name and email at any time.
- **Haptics control** (Medium / High intensity) — vibration feedback scales with your chosen intensity.
- Toggle Dark Mode and Email Digest preferences.
- **Student section**: edit pocket money limit → daily limit auto-calculates (÷ 30).
- One-tap sign out and data clear.

### ⚡ Progressive Web App (PWA)
- **Installable** on Android, iOS, and Desktop for a native app feel.
- **Offline capable** — all data persists in local storage.
- Install banner on the home screen for easy one-tap installation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (custom sage/sand/mist palette) |
| Animation | Framer Motion (spring physics, scroll animations, AnimatePresence) |
| State | Zustand with persist middleware (local storage) |
| Charts | Recharts (donut chart) |
| Icons | Lucide React |
| Dates | date-fns |
| Auth | @react-oauth/google |
| PWA | vite-plugin-pwa |

---

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Avineesh-G/Flow-Expenses-Tracker.git
   cd Flow-Expenses-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
   ```
   > Get your Client ID from [Google Cloud Console](https://console.cloud.google.com/). Enable the **Gmail API** and **Google People API**. Add your deployment URL as an Authorised JavaScript Origin.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```text
src/
├── components/      # UI components (HomeScreen, Insights, CalendarView, Settings, Modals…)
├── context/         # React Context providers (GoogleAuthContext)
├── hooks/           # Custom hooks (useGoogleSync, useInstallPrompt)
├── lib/             # API integrations (googleApi.ts — Gmail sync & parsing)
├── store/           # Zustand global store (useStore.ts)
├── types/           # TypeScript type definitions
├── utils/           # Helpers (categories, haptics, formatting)
├── App.tsx          # Main router and layout shell
└── main.tsx         # App entry point
```

---

## 🔒 Privacy

- **No backend server** — Flow is entirely client-side.
- Your financial data is stored in your **browser's local storage** only.
- Gmail access is read-only (OAuth scope: `gmail.readonly`). No emails are stored or transmitted anywhere.
- Google Calendar integration has been **removed** in V2 to keep the app fully local-first and suitable for public use.

---

## 📝 License
MIT License