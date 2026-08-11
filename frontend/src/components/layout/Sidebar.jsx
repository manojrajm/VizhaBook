import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Heart, Gift, ClipboardList, IndianRupee, BarChart2,
    QrCode, CheckSquare, ShieldCheck, Zap, Settings, Wifi, LogOut, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import useSubscription from '../../hooks/useSubscription';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const { pendingEntries, isSyncing } = useApp();
    const { plan, status, isTrial, isExpired } = useSubscription();

    const pendingCount = pendingEntries?.length || 0;

    const navSections = [
        {
            title: 'MAIN',
            items: [
                { path: '/', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/functions', label: 'Functions', icon: Heart },
                { path: '/entry', label: 'Moi Entry', icon: Gift },
                { path: '/ledger', label: 'Ledger', icon: ClipboardList },
                { path: '/expenses', label: 'Expenses', icon: IndianRupee },
                { path: '/analytics', label: 'Analytics', icon: BarChart2 }
            ]
        },
        {
            title: 'TOOLS',
            items: [
                { path: '/qr-display', label: 'QR Check-In', icon: QrCode, badge: pendingCount > 0 ? pendingCount : null },
                { path: '/approvals', label: 'Approvals', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : null }
            ]
        },
        {
            title: 'BILLING',
            items: [
                { path: '/subscription', label: 'Subscription', icon: ShieldCheck },
                { path: '/pricing', label: 'Upgrade Plan', icon: Zap }
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { path: '/settings', label: 'Settings', icon: Settings }
            ]
        }
    ];

    const getInitials = (name) => {
        if (!name) return 'VB';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const planLabel = plan
        ? `${plan.name} • Active`
        : isTrial
        ? 'Free Trial'
        : isExpired
        ? 'Trial Expired'
        : 'Free Account';

    return (
        <>
            {/* Backdrop for Mobile Drawer */}
            {isOpen && (
                <div
                    className="sidebar-mobile-backdrop"
                    onClick={onClose}
                />
            )}

            {/* Main Vertical Sidebar */}
            <aside className={`saas-sidebar ${isOpen ? 'mobile-open' : ''}`}>
                {/* Header / Logo */}
                <div className="sidebar-header">
                    <NavLink to="/" className="sidebar-brand-box" onClick={onClose}>
                        <img src="/logo.png" alt="Vizha Book" className="sidebar-logo-img" />
                        <div className="sidebar-brand-text">
                            <span className="sidebar-app-name">Vizha Book</span>
                            <span className="sidebar-app-tamil">விழாபுக்</span>
                        </div>
                    </NavLink>

                    <div className="sidebar-live-badge">
                        <Wifi size={10} />
                        <span>LIVE</span>
                    </div>

                    {/* Close Mobile Drawer Icon */}
                    {isOpen && (
                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            className="mobile-only"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Nav Sections Scroll Container */}
                <div className="sidebar-nav-container">
                    {navSections.map((sec, idx) => (
                        <div key={idx} className="sidebar-section">
                            <span className="sidebar-section-title">{sec.title}</span>
                            {sec.items.map((item) => {
                                const IconComponent = item.icon;
                                const isCurrent = location.pathname === item.path ||
                                    (item.path === '/settings' && location.pathname.startsWith('/settings'));

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`sidebar-nav-item ${isCurrent ? 'active' : ''}`}
                                    >
                                        {isCurrent && <span className="sidebar-active-bar" />}
                                        <span className="sidebar-nav-icon">
                                            <IconComponent size={18} />
                                        </span>
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <span className="sidebar-badge">{item.badge}</span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Bottom User Profile */}
                <div className="sidebar-user-footer">
                    <div className="sidebar-user-details">
                        <div className="sidebar-avatar-circle">
                            {getInitials(currentUser?.name)}
                        </div>
                        <div>
                            <div className="sidebar-user-name">{currentUser?.name || 'Aravind'}</div>
                            <div className="sidebar-user-plan">{planLabel}</div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        title="Logout"
                        className="sidebar-logout-btn"
                        id="sidebar-logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
