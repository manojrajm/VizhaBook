import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Functions from './pages/Functions';
import MoiEntry from './pages/MoiEntry';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
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
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

