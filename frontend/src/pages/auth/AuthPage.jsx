import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import loginDesktopImg from '../../assets/LoginDesktop.png';
import './AuthPage.css';

const cardVariants = {
    initial: { rotateY: 90, opacity: 0, scale: 0.95 },
    animate: { rotateY: 0, opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.8, 0.25, 1] } },
    exit: { rotateY: -90, opacity: 0, scale: 0.95, transition: { duration: 0.35, ease: [0.25, 0.8, 0.25, 1] } }
};

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [prefilledEmail, setPrefilledEmail] = useState('');

    const switchToSignup = () => setActiveTab('signup');
    const switchToLogin = (email = '') => {
        if (typeof email === 'string' && email) {
            setPrefilledEmail(email);
        }
        setActiveTab('login');
    };

    return (
        <div className="auth-page-container">
            {/* ===== MAIN AUTH BOARD CONTAINER ===== */}
            <div className="auth-board">

                {/* ==============================================
                   LEFT HERO PANEL (Desktop & Tablet View)
                   ============================================== */}
                <div className="auth-hero-panel">
                    <img
                        src={loginDesktopImg}
                        alt="VizhaBook Traditions"
                        className="hero-image-exact"
                    />
                </div>

                {/* ==============================================
                   RIGHT FORM PANEL (3D Golden Card Perspective)
                   ============================================== */}
                <div className="auth-form-panel">
                    <div className="auth-card-perspective-wrapper">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                variants={cardVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="auth-form-card"
                            >
                                <div className="auth-form-wrapper">
                                    {activeTab === 'login' ? (
                                        <LoginForm onSwitchToSignup={switchToSignup} initialEmail={prefilledEmail} />
                                    ) : (
                                        <SignupForm onSwitchToLogin={switchToLogin} />
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;
