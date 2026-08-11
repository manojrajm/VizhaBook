import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';

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
import SettingsPage from './pages/SettingsPage';

import PricingPage from './pages/subscription/PricingPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import TrialExpiredPage from './pages/subscription/TrialExpiredPage';
import SubscriptionSuccessPage from './pages/subscription/SubscriptionSuccessPage';

function Layout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="saas-app-container">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="saas-main-wrapper">
        <AppHeader
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="saas-main-content">
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
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/subscription" element={<SettingsPage />} />

            {/* Subscription Lifecycle Routes */}
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
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