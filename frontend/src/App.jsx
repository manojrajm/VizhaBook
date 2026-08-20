import React, { useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';

import AuthPage from './pages/auth/AuthPage';
import Dashboard from './pages/Dashboard';

// Lazy Loaded Heavy Pages for Lightning Fast Initial Bundle Load
const Functions = lazy(() => import('./pages/Functions'));
const MoiEntry = lazy(() => import('./pages/MoiEntry'));
const Ledger = lazy(() => import('./pages/Ledger'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const QRDisplay = lazy(() => import('./pages/QRDisplay'));
const GuestCheckin = lazy(() => import('./pages/GuestCheckin'));
const PendingApprovals = lazy(() => import('./pages/PendingApprovals'));
const Expenses = lazy(() => import('./pages/Expenses'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FunctionDetail = lazy(() => import('./pages/FunctionDetail'));
const PaymentMethodsPage = lazy(() => import('./pages/PaymentMethodsPage'));
const InvitationsPage = lazy(() => import('./pages/InvitationsPage'));

const PricingPage = lazy(() => import('./pages/subscription/PricingPage'));
const SubscriptionPage = lazy(() => import('./pages/subscription/SubscriptionPage'));
const TrialExpiredPage = lazy(() => import('./pages/subscription/TrialExpiredPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/subscription/SubscriptionSuccessPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#D97706', fontWeight: 800 }}>
    ⚡ VizhaBook Loading…
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/functions" element={<Functions />} />
              <Route path="/entry" element={<MoiEntry />} />
              <Route path="/invitations" element={<InvitationsPage />} />
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
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/checkin" element={<GuestCheckin />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
}