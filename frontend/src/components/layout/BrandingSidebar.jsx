import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Heart, Gift, ClipboardList, IndianRupee,
    BarChart2, QrCode, CheckSquare, X, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './BrandingSidebar.css';

const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/functions', label: 'Functions', icon: <Heart size={18} /> },
    { path: '/entry', label: 'Moi Entry', icon: <Gift size={18} /> },
    { path: '/ledger', label: 'Ledger', icon: <ClipboardList size={18} /> },
    { path: '/expenses', label: 'Expenses', icon: <IndianRupee size={18} /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { path: '/qr-display', label: 'QR Check-In', icon: <QrCode size={18} /> },
    { path: '/approvals', label: 'Approvals', icon: <CheckSquare size={18} /> },
];

const BrandingSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    const handleLogout = () => {
        setIsOpen(false);
        logout();
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <>
            {/* Toggle Button — always visible */}
            <button
                className="branding-toggle-btn"
                onClick={() => setIsOpen(true)}
                title="Open sidebar"
                id="sidebar-toggle"
            >
                <img src="/logo.png" alt="VB" />
            </button>

            {/* Sidebar Overlay + Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="branding-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Sidebar */}
                        <motion.aside
                            className="branding-sidebar"
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {/* Close Button */}
                            <button
                                className="branding-close-btn"
                                onClick={() => setIsOpen(false)}
                                title="Close sidebar"
                                id="sidebar-close"
                            >
                                <X size={16} />
                            </button>

                            <div className="branding-content">
                                {/* Logo Section */}
                                <div className="branding-logo-section">
                                    <img src="/logo.png" alt="VizhaBook" className="branding-logo-img" />
                                    <div>
                                        <div className="branding-app-name">VizhaBook</div>
                                        <div className="branding-app-tamil">விழாபுக்</div>
                                        <div className="branding-tagline">From Moi to Digital, Traditions Sustained</div>
                                    </div>
                                </div>

                                {/* User Info */}
                                {currentUser && (
                                    <div className="branding-user-info">
                                        <div className="branding-user-avatar">
                                            {getInitials(currentUser.name)}
                                        </div>
                                        <div>
                                            <p className="branding-user-name">{currentUser.name}</p>
                                            <p className="branding-user-email">{currentUser.email}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation */}
                                <nav className="branding-nav">
                                    <span className="branding-nav-title">Navigation</span>
                                    {navItems.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.path === '/'}
                                            className={({ isActive }) =>
                                                `branding-nav-item ${isActive ? 'active' : ''}`
                                            }
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className="branding-nav-icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </NavLink>
                                    ))}
                                </nav>

                                {/* Logout */}
                                <button
                                    className="branding-nav-item"
                                    onClick={handleLogout}
                                    style={{ color: '#EF4444', marginTop: '0.5rem' }}
                                    id="sidebar-logout"
                                >
                                    <span className="branding-nav-icon"><LogOut size={18} /></span>
                                    <span>Logout</span>
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="branding-footer">
                                <p className="branding-footer-quote">
                                    <span className="quote-mark">"</span>{' '}
                                    Preserve Traditions. Embrace Technology.{' '}
                                    <span className="quote-mark">"</span>
                                </p>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default BrandingSidebar;
