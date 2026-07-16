import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, IndianRupee, BarChart2, ShieldCheck } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import './AuthPage.css';

const features = [
    {
        icon: <Users size={20} />,
        iconClass: 'moi',
        title: 'Moi Entries',
        desc: 'Track every gift with love & blessings'
    },
    {
        icon: <IndianRupee size={20} />,
        iconClass: 'expense',
        title: 'Expense Management',
        desc: 'Plan, track & manage every expense'
    },
    {
        icon: <BarChart2 size={20} />,
        iconClass: 'report',
        title: 'Detailed Reports',
        desc: 'Beautiful reports to save and share'
    },
    {
        icon: <ShieldCheck size={20} />,
        iconClass: 'security',
        title: 'Secure & Reliable',
        desc: 'Your data is safe with advanced security'
    }
];

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState('login');

    const switchToSignup = () => setActiveTab('signup');
    const switchToLogin = () => setActiveTab('login');

    return (
        <div className="auth-page">
            {/* ===== Desktop Hero Panel (Left) ===== */}
            <div className="auth-hero">
                {/* Decorative blobs */}
                <div className="auth-hero-decor auth-hero-decor-1" />
                <div className="auth-hero-decor auth-hero-decor-2" />

                <div className="auth-hero-content">
                    {/* Logo */}
                    <motion.div
                        className="auth-logo-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <img src="/logo.png" alt="VizhaBook" className="auth-logo-img" />
                        <div className="auth-logo-text">
                            <span className="auth-logo-name">VizhaBook</span>
                            <span className="auth-logo-name-tamil">விழாபுக்</span>
                            <span className="auth-logo-tagline">From Moi to Digital, Traditions Sustained</span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        className="auth-headline"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    >
                        <h1>
                            Celebrate.<br />
                            Record.<br />
                            <strong>Remember Forever.</strong>
                        </h1>
                        <p>
                            Manage your functions, Moi entries,
                            expenses and reports in one
                            beautifully simple platform.
                        </p>
                    </motion.div>

                    {/* Features */}
                    <motion.div
                        className="auth-features"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                className="auth-feature-item"
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                            >
                                <div className={`auth-feature-icon ${f.iconClass}`}>
                                    {f.icon}
                                </div>
                                <div className="auth-feature-text">
                                    <h4>{f.title}</h4>
                                    <p>{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Footer Quote */}
                    <motion.div
                        className="auth-hero-footer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                    >
                        <div className="auth-hero-quote">
                            <span className="quote-mark">"</span>
                            <span>Preserve Traditions. Embrace Technology.</span>
                            <span className="quote-mark">"</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ===== Mobile Header ===== */}
            <div className="auth-mobile-header">
                <img src="/logo.png" alt="VizhaBook" className="auth-mobile-logo" />
                <h1 className="auth-mobile-title">VizhaBook</h1>
                <span className="auth-mobile-tamil">விழாபுக்</span>
                <p className="auth-mobile-subtitle">From Moi to Digital, Traditions Sustained</p>
            </div>

            {/* ===== Form Panel (Right) ===== */}
            <div className="auth-form-panel">
                <div className="auth-form-container">
                    {/* Tabs */}
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                            onClick={switchToLogin}
                            id="tab-login"
                        >
                            Login
                        </button>
                        <button
                            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                            onClick={switchToSignup}
                            id="tab-signup"
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'login' ? (
                            <LoginForm
                                key="login"
                                onSwitchToSignup={switchToSignup}
                            />
                        ) : (
                            <SignupForm
                                key="signup"
                                onSwitchToLogin={switchToLogin}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
