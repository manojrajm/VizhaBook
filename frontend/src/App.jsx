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
import FunctionDetail from './pages/FunctionDetail';
import PaymentMethodsPage from './pages/PaymentMethodsPage';

import PricingPage from './pages/subscription/PricingPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import TrialExpiredPage from './pages/subscription/TrialExpiredPage';
import SubscriptionSuccessPage from './pages/subscription/SubscriptionSuccessPage';

function Layout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="saas-app-container">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onCollapseChange={(collapsed) => setIsSidebarCollapsed(collapsed)}
      />
      <div className={`saas-main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
            <Route path="/functions/:functionId" element={<FunctionDetail />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/subscription" element={<SettingsPage />} />
            <Route path="/settings/payment-methods" element={<SettingsPage />} />
            <Route path="/payment-methods" element={<PaymentMethodsPage />} />

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

            {/* Full-screen Pricing page — authenticated but without sidebar */}
            <Route path="/pricing" element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            } />

            {/* Protected main app with sidebar */}
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