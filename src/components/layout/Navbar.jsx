import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Moon, Sun, LayoutDashboard, Heart, ClipboardList, Gift, Menu, X, QrCode, BarChart2, CheckSquare, Wifi, IndianRupee, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

const Navbar = () => {
    const { theme, toggleTheme, lang, toggleLang, pendingEntries, isSyncing, isCloudEnabled, cloudId } = useApp();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pendingCount = pendingEntries?.length || 0;

    const navItems = [
        { path: '/', label: lang === 'en' ? 'Dashboard' : 'டாஷ்போர்டு', icon: <LayoutDashboard size={20} /> },
        { path: '/functions', label: lang === 'en' ? 'Functions' : 'விழாக்கள்', icon: <Heart size={20} /> },
        { path: '/entry', label: lang === 'en' ? 'Moi Entry' : 'மொய் பதிவு', icon: <Gift size={20} /> },
        { path: '/ledger', label: lang === 'en' ? 'Ledger' : 'பேரேடு', icon: <ClipboardList size={20} /> },
        { path: '/expenses', label: lang === 'en' ? 'Expenses' : 'செலவுகள்', icon: <IndianRupee size={20} /> },
        { path: '/analytics', label: lang === 'en' ? 'Analytics' : 'புள்ளிவிவரம்', icon: <BarChart2 size={20} /> },
        {
            path: '/qr-display', label: lang === 'en' ? 'QR Check-In' : 'QR பதிவு', icon: <QrCode size={20} />,
            badge: pendingCount > 0 ? pendingCount : null
        },
        {
            path: '/approvals', label: lang === 'en' ? 'Approvals' : 'ஒப்புதல்', icon: <CheckSquare size={20} />,
            badge: pendingCount > 0 ? pendingCount : null
        },
    ];

    const navLinkStyle = (isActive) => ({
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 0.85rem', borderRadius: '0.75rem',
        fontSize: '0.85rem', fontWeight: isActive ? 700 : 500,
        color: isActive ? 'white' : 'var(--text-secondary)',
        background: isActive ? 'var(--primary-gradient)' : 'transparent',
        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.2s ease', textDecoration: 'none',
        whiteSpace: 'nowrap', position: 'relative'
    });

    return (
        <header style={{
            height: '70px', padding: '0 1.5rem',
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 30px rgba(15,23,42,0.06)',
            position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <img src="/logo.png" alt="Vizha Book" style={{ height: '38px', objectFit: 'contain' }} />
                <span style={{
                    fontSize: '1.4rem', fontWeight: 900,
                    fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em',
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>Vizha Book</span>

                {/* LIVE Sync Badge */}
                <motion.div
                    animate={{ opacity: isSyncing ? [1, 0.4, 1] : 1 }}
                    transition={{ duration: 0.6, repeat: isSyncing ? Infinity : 0 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.55rem', borderRadius: '999px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '0.65rem', fontWeight: 700,
                        color: '#10B981', userSelect: 'none'
                    }}
                >
                    <Wifi size={10} />
                    LIVE
                </motion.div>

                {/* CLOUD Sync Badge */}
                {isCloudEnabled && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.55rem', borderRadius: '999px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        fontSize: '0.65rem', fontWeight: 700,
                        color: '#3B82F6', userSelect: 'none'
                    }}>
                        <Cloud size={10} />
                        CLOUD
                    </div>
                )}
            </div>

            {/* Desktop Nav */}
            <nav className="desktop-only" style={{ display: 'flex', gap: '0.25rem', overflow: 'hidden' }}>
                {navItems.map((item) => (
                    <NavLink key={item.path} to={item.path} end={item.path === '/'}
                        style={({ isActive }) => navLinkStyle(isActive)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.badge && (
                            <motion.span
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute', top: '-4px', right: '-4px',
                                    background: '#EF4444', color: 'white',
                                    borderRadius: '999px', fontSize: '0.6rem',
                                    fontWeight: 800, minWidth: '16px', height: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 4px'
                                }}
                            >{item.badge}</motion.span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Desktop Actions */}
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <button onClick={toggleLang} style={{
                    padding: '0.4rem 0.875rem', fontWeight: 700, fontSize: '0.72rem',
                    borderRadius: '0.75rem', border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)', background: 'var(--bg-card)', cursor: 'pointer'
                }}>
                    {lang === 'en' ? 'தமிழ்' : 'EN'}
                </button>
                <button onClick={toggleTheme} style={{
                    width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                    border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
            </div>

            {/* Mobile Hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {pendingCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                            background: '#EF4444', color: 'white', borderRadius: '999px',
                            fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem'
                        }}
                    >{pendingCount} pending</motion.span>
                )}
                <button
                    className="mobile-only"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.5rem', display: 'flex' }}
                >
                    {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
            </div>

            {/* Mobile Dropdown */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -15, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="mobile-only"
                        style={{
                            position: 'absolute', top: '78px', left: '1rem', right: '1rem',
                            background: 'var(--bg-card)', backdropFilter: 'blur(25px)',
                            WebkitBackdropFilter: 'blur(25px)',
                            borderRadius: '1.5rem', padding: '1.25rem',
                            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)',
                            display: 'flex', flexDirection: 'column', gap: '0.875rem', zIndex: 200
                        }}
                    >
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {navItems.map((item) => (
                                <NavLink key={item.path} to={item.path} end={item.path === '/'}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={({ isActive }) => ({
                                        ...navLinkStyle(isActive),
                                        padding: '0.875rem 1rem', fontSize: '1rem', position: 'relative'
                                    })}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <span style={{
                                            marginLeft: 'auto', background: '#EF4444', color: 'white',
                                            borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800,
                                            padding: '0.1rem 0.5rem'
                                        }}>{item.badge}</span>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                        <div style={{ height: '1px', background: 'var(--border-color)' }} />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={toggleLang} style={{
                                flex: 1, padding: '0.75rem', fontWeight: 700, fontSize: '0.85rem',
                                borderRadius: '1rem', border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)', background: 'var(--bg-card)', cursor: 'pointer'
                            }}>{lang === 'en' ? 'தமிழ்' : 'English'}</button>
                            <button onClick={toggleTheme} style={{
                                width: '3rem', height: '3rem', borderRadius: '50%',
                                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-secondary)'
                            }}>
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;
