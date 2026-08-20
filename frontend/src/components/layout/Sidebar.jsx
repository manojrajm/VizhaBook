import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Heart, Gift, ClipboardList, IndianRupee, BarChart3,
    QrCode, CheckSquare, ShieldCheck, Zap, Settings, LogOut, CreditCard,
    ChevronsLeft, ChevronsRight, ChevronDown, X, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import useSubscription from '../../hooks/useSubscription';
import { TRANSLATIONS } from '../../utils/translations';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, onCollapseChange }) => {
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const { lang, pendingEntries } = useApp();
    const { subscription, plan, isTrial, isExpired, functionsUsed, functionLimit } = useSubscription();

    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const pendingCount = pendingEntries?.length || 0;

    // Collapsed state initialized from localStorage
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('vizhabook_sidebar_collapsed') === 'true';
    });

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('vizhabook_sidebar_collapsed', String(nextState));
        if (onCollapseChange) {
            onCollapseChange(nextState);
        }
    };

    useEffect(() => {
        if (onCollapseChange) {
            onCollapseChange(isCollapsed);
        }
    }, [isCollapsed, onCollapseChange]);

    const navSections = [
        {
            title: t.mainSection,
            items: [
                { path: '/', label: t.dashboard, icon: LayoutDashboard },
                { path: '/functions', label: t.functions, icon: Heart },
                { path: '/invitations', label: lang === 'ta' ? 'அழைப்பிதழ்கள்' : 'Invitations', icon: Send },
                { path: '/entry', label: t.moiEntry, icon: Gift },
                { path: '/ledger', label: t.ledger, icon: ClipboardList },
                { path: '/expenses', label: t.expenses, icon: IndianRupee },
                { path: '/analytics', label: t.analytics, icon: BarChart3 }
            ]
        },
        {
            title: t.toolsSection,
            items: [
                { path: '/settings/payment-methods', label: lang === 'ta' ? 'பணம் பெறும் முறைகள்' : 'Payment Methods', icon: CreditCard },
                { path: '/qr-display', label: t.qrCheckIn, icon: QrCode },
                { path: '/approvals', label: t.approvals, icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : null }
            ]
        },
        {
            title: t.billingSection,
            items: [
                { path: '/subscription', label: t.subscription, icon: ShieldCheck },
                { path: '/pricing', label: t.upgradePlan, icon: Zap }
            ]
        },
        {
            title: t.systemSection,
            items: [
                { path: '/settings', label: t.settings, icon: Settings }
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
            ? t.freeTrial
            : isExpired
                ? t.trialExpired
                : 'Free Account';

    const expiryDate = subscription?.end_date
        ? new Date(subscription.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '31 Aug 2027';

    const funcPercent = functionLimit === null ? 25 : Math.min(100, Math.round((functionsUsed / (functionLimit || 1)) * 100));

    return (
        <>
            {/* Backdrop for Mobile Drawer */}
            {isOpen && (
                <div
                    className="sidebar-mobile-backdrop"
                    onClick={onClose}
                />
            )}

            {/* Main Dark Navy Vertical Sidebar */}
            <aside className={`saas-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}>
                {/* Header / Brand Logo */}
                <div className="sidebar-header">
                    <NavLink to="/" className="sidebar-brand-box" onClick={onClose}>
                        <img src="/logo.png" alt="Vizha Book" className="sidebar-logo-img" />
                        <div className="sidebar-brand-text">
                            <span className="sidebar-app-name">Vizha Book</span>

                            <span className="sidebar-app-tamil">விழாபுக்</span>
                        </div>
                    </NavLink>

                    <div className="sidebar-live-badge">
                        <span className="sidebar-live-dot" />
                        <span>LIVE</span>
                    </div>

                    {/* Mobile Drawer Close */}
                    {isOpen && (
                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}
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
                                        title={isCollapsed ? item.label : undefined}
                                        className={`sidebar-nav-item ${isCurrent ? 'active' : ''}`}
                                    >
                                        {isCurrent && <span className="sidebar-active-bar" />}
                                        <span className="sidebar-nav-icon">
                                            <IconComponent size={18} />
                                        </span>
                                        <span className="sidebar-item-text">{item.label}</span>
                                        {item.badge && (
                                            <span className="sidebar-badge">{item.badge}</span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Bottom User Profile Section (MNC SaaS Card) */}
                <div className="sidebar-profile-section">
                    <div className="sidebar-user-card">
                        <div className="sidebar-user-top">
                            <div className="sidebar-user-left">
                                <div className="sidebar-avatar-circle">
                                    {getInitials(currentUser?.name)}
                                </div>
                                <div className="sidebar-user-info-text">
                                    <div className="sidebar-user-name">{currentUser?.name || 'Aravind'}</div>
                                    <div className="sidebar-user-plan">{planLabel}</div>
                                </div>
                            </div>
                            <ChevronDown size={14} className="sidebar-user-chevron sidebar-user-info-text" />
                        </div>

                        {/* Usage Progress Meter */}
                        <div className="sidebar-user-progress">
                            <div className="progress-track">
                                <div className="progress-fill" style={{ width: `${funcPercent}%` }} />
                            </div>
                            <p className="sidebar-renew-date">{t.renewsOn} {expiryDate}</p>
                        </div>

                        {/* Card Logout Button */}
                        <button
                            onClick={logout}
                            title={t.logout}
                            className="sidebar-card-logout"
                            id="sidebar-logout"
                        >
                            <LogOut size={14} />
                            <span className="sidebar-user-info-text">{t.logout}</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Collapse Control */}
                <div className="sidebar-collapse-bar">
                    <button
                        type="button"
                        className="sidebar-collapse-btn"
                        onClick={toggleCollapse}
                        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                        <span className="sidebar-collapse-text">{t.collapse}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
