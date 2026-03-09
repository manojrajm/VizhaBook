import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/layout/Navbar';

import Dashboard from './pages/Dashboard';
import Functions from './pages/Functions';
import MoiEntry from './pages/MoiEntry';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import QRDisplay from './pages/QRDisplay';
import GuestCheckin from './pages/GuestCheckin';
import PendingApprovals from './pages/PendingApprovals';

function Layout() {
  return (
    <div className="app-container">
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
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* Public guest check-in */}
          <Route path="/checkin" element={<GuestCheckin />} />

          {/* Main app */}
          <Route path="/*" element={<Layout />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;