import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import loginDesktopImg from '../../assets/LoginDesktop.png';
import './AuthPage.css';

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [language, setLanguage] = useState('English');

    const switchToSignup = () => setActiveTab('signup');
    const switchToLogin = () => setActiveTab('login');

    return (
        <div className="auth-page-container">
            {/* ===== MAIN AUTH BOARD CARD ===== */}
            <div className="auth-board">

                {/* ==============================================
                   LEFT HERO PANEL (Exact LoginDesktop.png image)
                   ============================================== */}
                <div className="auth-hero-panel">
                    <img
                        src={loginDesktopImg}
                        alt="VizhaBook Traditions"
                        className="hero-image-exact"
                    />
                </div>

                {/* ==============================================
                   RIGHT FORM PANEL (Royal Deep Purple Theme)
                   ============================================== */}
                <div className="auth-form-panel">
                    {/* Floating MNC SaaS Card with Golden Border */}
                    <div className="auth-form-card">
                        {/* Language Selector Dropdown (Top Right) */}
                        <div className="auth-lang-picker">
                            <button className="lang-btn" type="button">
                                <Globe size={15} />
                                <span>{language}</span>
                                <span className="lang-chevron">⌵</span>
                            </button>
                        </div>

                        <div className="auth-form-wrapper">
                            {activeTab === 'login' ? (
                                <LoginForm onSwitchToSignup={switchToSignup} />
                            ) : (
                                <SignupForm onSwitchToLogin={switchToLogin} />
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;



