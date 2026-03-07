import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Moon, Sun, User, LayoutDashboard, Users, Heart, ClipboardList, BarChart3, Gift, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

const Navbar = () => {
    const { theme, toggleTheme, lang, toggleLang } = useApp();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/', label: lang === 'en' ? 'Dashboard' : 'டாஷ்போர்டு', icon: <LayoutDashboard size={20} /> },
        { path: '/functions', label: lang === 'en' ? 'Functions' : 'விழாக்கள்', icon: <Heart size={20} /> },
        { path: '/entry', label: lang === 'en' ? 'Moi Entry' : 'மொய் பதிவு', icon: <Gift size={20} /> },
        { path: '/ledger', label: lang === 'en' ? 'Ledger' : 'பேரேடு', icon: <ClipboardList size={20} /> },
    ];

    return (
        <header className="navbar" style={{
            height: '70px',
            padding: '0 2rem',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src="/logo.png" alt="Vizha Book Logo" style={{ height: '40px', objectFit: 'contain' }} />
                <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    fontFamily: "'Playfair Display', serif",
                    letterSpacing: '-0.02em',
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>Vizha Book</span>
            </div>

            <nav className="desktop-only" style={{ display: 'flex', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.9rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                            background: isActive ? '#FFF7ED' : 'transparent',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                        })}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={toggleLang}
                    style={{
                        padding: '0.5rem 1rem',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        background: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                >
                    {lang === 'en' ? 'TAMIL' : 'ENGLISH'}
                </button>
                <button
                    onClick={toggleTheme}
                    style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        border: '1px solid var(--border-color)',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)'
                    }}
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                    AD
                </div>
            </div>

            {/* Mobile Hamburger Button */}
            <button
                className="mobile-only"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* Framer Motion Mobile Dropdown */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="mobile-only"
                        style={{
                            position: 'absolute',
                            top: '80px',
                            left: '1rem',
                            right: '1rem',
                            background: 'var(--bg-card)',
                            backdropFilter: 'blur(25px)',
                            WebkitBackdropFilter: 'blur(25px)',
                            borderRadius: '1.5rem',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            zIndex: 200
                        }}
                    >
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '1rem',
                                        borderRadius: '1rem',
                                        fontSize: '1rem',
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        background: isActive ? 'rgba(214, 51, 132, 0.1)' : 'transparent',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none'
                                    })}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={toggleLang}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    borderRadius: '1rem',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    background: 'white',
                                    cursor: 'pointer',
                                    flex: 1,
                                    marginRight: '1rem'
                                }}
                            >
                                {lang === 'en' ? 'TAMIL' : 'ENGLISH'}
                            </button>
                            <button
                                onClick={toggleTheme}
                                style={{
                                    width: '3rem',
                                    height: '3rem',
                                    borderRadius: '50%',
                                    border: '1px solid var(--border-color)',
                                    background: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;

