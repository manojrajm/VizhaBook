import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import BrandingSidebar from './components/layout/BrandingSidebar';

import AuthPage from './pages/auth/AuthPage';
import Dashboard from './pages/Dashboard';
import Functions from './pages/Functions';
import MoiEntry from './pages/MoiEntry';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import QRDisplay from './pages/QRDisplay';
import GuestCheckin from './pages/GuestCheckin';
import PendingApprovals from './pages/PendingApprovals';
import Expenses from './pages/Expenses';

import PricingPage from './pages/subscription/PricingPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import SubscriptionSettingsPage from './pages/subscription/SubscriptionSettingsPage';
import TrialExpiredPage from './pages/subscription/TrialExpiredPage';
import SubscriptionSuccessPage from './pages/subscription/SubscriptionSuccessPage';

function Layout() {
  return (
    <div className="app-container">
      <BrandingSidebar />
      <div className="main-wrapper">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/functions" element={<Functions />} />
            <Route path="/entry" element={<MoiEntry />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/qr-display" element={<QRDisplay />} />
            <Route path="/approvals" element={<PendingApprovals />} />
            <Route path="/expenses" element={<Expenses />} />

            {/* Subscription Lifecycle Routes */}
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/settings/subscription" element={<SubscriptionSettingsPage />} />
            <Route path="/subscription/expired" element={<TrialExpiredPage />} />
            <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <Routes>
            {/* Auth page — public */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Public guest check-in */}
            <Route path="/checkin" element={<GuestCheckin />} />

            {/* Protected main app */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            } />
          </Routes>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;