import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Bell, Cloud, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './AppHeader.css';

const AppHeader = ({ onToggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme, lang, toggleLang, pendingEntries, isCloudEnabled } = useApp();
    const { currentUser, logout } = useAuth();

    const pendingCount = pendingEntries?.length || 0;

    // Get dynamic page title from location
    const getPageTitle = (pathname) => {
        switch (pathname) {
            case '/':
                return lang === 'en' ? 'Dashboard Overview' : 'முகப்புப் பக்கம்';
            case '/functions':
                return lang === 'en' ? 'Celebration Events' : 'நிர்வகிக்கும் விழாக்கள்';
            case '/entry':
                return lang === 'en' ? 'Moi Entry' : 'மொய்ப் பதிவு';
            case '/ledger':
                return lang === 'en' ? 'Ledger & Gift Records' : 'பேரேடு மற்றும் பரிசு விவரங்கள்';
            case '/expenses':
                return lang === 'en' ? 'Event Expenses' : 'விழா செலவுகள்';
            case '/analytics':
                return lang === 'en' ? 'Analytics & Insights' : 'புள்ளிவிவரம் & பகுப்பாய்வு';
            case '/qr-display':
                return lang === 'en' ? 'QR Guest Check-In' : 'QR விருந்தினர் வருகைப்பதிவு';
            case '/approvals':
                return lang === 'en' ? 'Pending Approvals' : 'நிலுவையில் உள்ள ஒப்புதல்கள்';
            case '/subscription':
                return lang === 'en' ? 'Subscription & Usage' : 'சந்தா மற்றும் பயன்பாடு';
            case '/pricing':
                return lang === 'en' ? 'Subscription Plans' : 'சந்தா திட்டங்கள்';
            case '/settings':
            case '/settings/subscription':
                return lang === 'en' ? 'Account & System Settings' : 'அமைப்பு அமைப்புகள்';
            case '/subscription/expired':
                return lang === 'en' ? 'Trial Expired' : 'இலவச காலம் முடிந்தது';
            case '/subscription/success':
                return lang === 'en' ? 'Subscription Activated' : 'சந்தா செயல்படுத்தப்பட்டது';
            default:
                return 'VizhaBook';
        }
    };

    return (
        <header className="saas-app-header">
            {/* Left Title & Mobile Hamburger */}
            <div className="header-left-group">
                <button
                    className="header-hamburger-btn"
                    onClick={onToggleSidebar}
                    title="Toggle navigation"
                    id="sidebar-toggle"
                >
                    <Menu size={22} />
                </button>

                <h1 className="header-page-title">
                    {getPageTitle(location.pathname)}
                </h1>
            </div>

            {/* Right Tools & Profile */}
            <div className="header-right-group">
                {/* Cloud Sync Status */}
                {isCloudEnabled && (
                    <div className="header-sync-status">
                        <Cloud size={12} />
                        <span>CLOUD SYNC</span>
                    </div>
                )}

                {/* Language Switch */}
                <button
                    onClick={toggleLang}
                    className="header-btn"
                    title="Switch language"
                >
                    {lang === 'en' ? 'தமிழ்' : 'EN'}
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="header-btn header-icon-btn"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {/* Notification Bell */}
                <button
                    onClick={() => navigate('/approvals')}
                    className="header-btn header-icon-btn"
                    title="Notifications / Pending Approvals"
                >
                    <Bell size={16} />
                    {pendingCount > 0 && (
                        <span className="header-notification-badge">{pendingCount}</span>
                    )}
                </button>

                {/* User Profile Info & Logout */}
                <div className="header-user-badge">
                    {currentUser && (
                        <span className="header-user-name">
                            {currentUser.name}
                        </span>
                    )}

                    <button
                        onClick={logout}
                        title="Logout"
                        className="header-logout-btn"
                        id="navbar-logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
