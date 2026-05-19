# EMI Bazaar - The Smart EMI E-Commerce & POS Platform

![Live Demo](https://img.shields.io/badge/Live_Demo-emi--bazaar.vercel.app-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

EMI Bazaar is a comprehensive, multi-role e-commerce and Point of Sale (POS) platform. Its core differentiating feature is the deep integration of **Equated Monthly Installments (EMI)** as a native payment, tracking, and repurchasing mechanism.

🌐 **Live Website:** [https://emi-bazaar.vercel.app/](https://emi-bazaar.vercel.app/)

---

## 👥 User Roles & Personas

The application serves three distinct user roles, each with a custom-tailored interface and permission set:

1. **Customers**
   * Browse products and view dedicated shop profiles.
   * Add items to a shopping cart and initiate an online checkout with dynamic EMI plans.
   * Track personal EMI repayment ledgers.
   * Chat in real-time with vendors.
2. **Vendors (Sellers)**
   * Access a dedicated **"Vendor Hub"**.
   * Onboard and set up a shop presence.
   * Manage inventory and track sales analytics.
   * **Crucial Feature:** Operate a **Point of Sale (POS)** system that allows walk-in customer lookups via phone/OTP, and generate formal EMI contracts on the spot.
   * Chat with potential or existing customers.
3. **Administrators**
   * Access the **"Admin Center"**.
   * Oversee the entire ecosystem.
   * Approve or reject vendor onboarding applications.
   * Access high-level, platform-wide metrics and analytics.

---

## ⚡ Core Features

* **Advanced POS for EMI:** A robust Point of Sale flow empowering vendors to select product terms, input down payments, calculate interest, and legally bind an EMI contract for walk-in customers.
* **Real-time Engine:** Instant chat messaging between users and live push notifications powered by Supabase Realtime channels.
* **Multi-Tier Authentication:** Secure, role-based routing and database-level Row Level Security (RLS) ensuring that users only access what they are permitted to.
* **Shopping Cart & Checkout:** A seamless sliding UI cart managed via Zustand state, connecting to Razorpay for secure initial down-payments and mandate setup.
* **Analytics Overviews:** Deep data visualizations for both vendors and admins using Recharts.
* **Dynamic, Responsive UI:** Fluid micro-animations with Framer Motion, utilizing accessible Radix UI primitives and a fully functional Dark/Light theme toggle.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 19 + TypeScript + Vite
* **Routing:** React Router DOM (v7)
* **Styling & Components:** Tailwind CSS (3.4), Radix UI, Framer Motion, Lucide React
* **State Management:** Zustand
* **Backend as a Service:** Supabase (PostgreSQL, Auth, Storage, Real-time Subscriptions, Edge Functions/RPCs)
* **Payments:** Razorpay
* **Data Visualization:** Recharts

---

## 📁 Architecture Overview

Following a structured, domain-driven design approach:

```text
src/
├── features/        # Modular domains isolating logic (admin, auth, customer, products, shop, vendor)
├── pages/           # Top-level routing components mapping to URLs
├── components/      # Reusable UI elements (CartDrawer, NotificationPopover, ui/)
├── store/           # Zustand global state (cartStore, themeStore)
├── hooks/           # Custom React hooks (e.g., useRazorpay)
├── utils/           # Helper functions (e.g., generateReceipt for client-side receipt building)
└── lib/             # Third-party client initializations (e.g., Supabase)
```

### Supabase Backend Engine
The backend architecture is heavily database-driven, relying on PostgreSQL constraints, Remote Procedure Calls (RPCs), and Row Level Security (RLS) policies.
The `supabase/queries/` directory acts as an evolutionary schema comprised of **30 detailed SQL migrations**, handling:
* Vendor lifecycle (Pending -> Approved -> Rejected).
* EMI Plan config and tracking formal legal state, principal, and terms.
* Backend RPCs allowing vendors to securely query customer information during a POS session.
* Ledger tracking for actual installment completions.
* Push-heavy operations like aggregated calculations and checkout transaction closures offloaded entirely to the database engine.

---

## 🚀 Setup & Installation

To run this project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/mr-vishwakarma/EMI-Bazaar.git
   cd EMI-Bazaar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory and add your Supabase and Razorpay credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_RAZORPAY_KEY_ID=your_razorpay_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📸 Screenshots

*(Add project screenshots here)*

* **Desktop Home:** `![Home](/path/to/home.png)`
* **Vendor POS:** `![POS](/path/to/pos.png)`
* **Admin Dashboard:** `![Admin](/path/to/admin.png)`

---

*Designed and Built for modern commerce.*
