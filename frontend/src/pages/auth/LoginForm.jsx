import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X, CheckCircle, Rocket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onSwitchToSignup, initialEmail = '' }) => {
    const navigate = useNavigate();
    const { login, signup, resetPassword } = useAuth();
    const [email, setEmail] = useState(initialEmail || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [forgotError, setForgotError] = useState('');

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address or phone number.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);
        await new Promise(r => setTimeout(r, 400));

        const result = await login(email, password, rememberMe);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleDemoLogin = async () => {
        setError('');
        setDemoLoading(true);
        const demoEmail = 'demo@vizhabook.com';
        const demoPass = 'demo1234';

        setEmail(demoEmail);
        setPassword(demoPass);

        await new Promise(r => setTimeout(r, 400));

        let result = await login(demoEmail, demoPass, true);
        if (!result.success) {
            await signup({
                name: 'Demo Admin',
                phone: '9876543210',
                countryCode: '+91',
                email: demoEmail,
                password: demoPass
            });
            result = await login(demoEmail, demoPass, true);
        }

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Unable to start demo mode.');
        }
        setDemoLoading(false);
    };

    const handleForgotPassword = async () => {
        setForgotError('');
        setForgotSuccess('');

        if (!forgotEmail.trim()) {
            setForgotError('Please enter your email address.');
            return;
        }

        const result = resetPassword(forgotEmail);
        if (result.success) {
            setForgotSuccess(result.message);
        } else {
            setForgotError(result.error);
        }
    };

    return (
        <>
            <motion.form
                onSubmit={handleLogin}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="auth-login-form"
            >
                {/* Form Header */}
                <div className="login-header-group">
                    <h2 className="login-title">Welcome Back!</h2>
                    <p className="login-subtitle">Sign in to continue to your workspace</p>
                    
                    {/* Gold Ornament Divider */}
                    <div className="gold-ornament-divider">
                        <svg width="140" height="12" viewBox="0 0 140 12" fill="none">
                            <path d="M0 6H55" stroke="#E9B856" strokeWidth="1" strokeOpacity="0.6"/>
                            <path d="M85 6H140" stroke="#E9B856" strokeWidth="1" strokeOpacity="0.6"/>
                            <circle cx="58" cy="6" r="2" fill="#E9B856"/>
                            <circle cx="82" cy="6" r="2" fill="#E9B856"/>
                            <path d="M64 6 C64 3, 70 3, 70 6 C70 9, 76 9, 76 6 C76 3, 70 3, 70 6 Z" stroke="#E9B856" strokeWidth="1.2" fill="none"/>
                            <circle cx="70" cy="6" r="1.5" fill="#E9B856"/>
                        </svg>
                    </div>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="auth-error-box"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <AlertCircle size={16} color="#FCA5A5" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Field 1: Email Address / Phone Number */}
                <div className="login-field-group">
                    <label className="login-field-label" htmlFor="login-email">
                        Email Address / Phone Number
                    </label>
                    <div className="login-field-input-box">
                        <span className="field-icon"><Mail size={18} /></span>
                        <input
                            className="field-input"
                            type="text"
                            placeholder="Enter your email or phone number"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            autoComplete="username"
                            id="login-email"
                        />
                    </div>
                </div>

                {/* Field 2: Password */}
                <div className="login-field-group">
                    <div className="login-label-row">
                        <label className="login-field-label" htmlFor="login-password">
                            Password
                        </label>
                        <button
                            type="button"
                            className="login-forgot-pass"
                            onClick={() => { setShowForgot(true); setForgotEmail(email); }}
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <div className="login-field-input-box">
                        <span className="field-icon"><Lock size={18} /></span>
                        <input
                            className="field-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            autoComplete="current-password"
                            id="login-password"
                        />
                        <button
                            type="button"
                            className="field-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Field 3: Remember me Checkbox */}
                <div className="login-options-bar">
                    <label className="login-checkbox-label" htmlFor="remember-me">
                        <input
                            type="checkbox"
                            className="login-checkbox"
                            id="remember-me"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="checkbox-text">Remember me</span>
                    </label>

                    {/* Quick Demo Trigger (Subtle) */}
                    <button
                        type="button"
                        className="quick-demo-link"
                        onClick={handleDemoLogin}
                        title="Instant Demo Access"
                    >
                        ⚡ Try Demo Mode
                    </button>
                </div>

                {/* CTA Button: Log In ➔ */}
                <button
                    type="submit"
                    className="login-btn-primary"
                    disabled={loading || demoLoading}
                    id="login-submit"
                >
                    {loading ? (
                        <span>Logging In...</span>
                    ) : (
                        <span>Log In ➔</span>
                    )}
                </button>

                {/* OR Divider */}
                <div className="login-or-divider">
                    <span className="divider-line" />
                    <span className="divider-text">OR</span>
                    <span className="divider-line" />
                </div>

                {/* Social Login Buttons */}
                <div className="login-social-group">
                    <button type="button" className="social-btn" id="social-google" onClick={handleDemoLogin}>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                            <path fill="#34A853" d="M16.04 18.013C14.95 18.72 13.56 19.091 12 19.091c-3.1 0-5.727-2.09-6.672-4.906L1.24 17.35C3.198 21.302 7.27 24 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                            <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                            <path fill="#FBBC05" d="M5.328 14.185A7.13 7.13 0 0 1 4.909 12c0-.758.125-1.49.353-2.175L1.24 6.65A11.93 11.93 0 0 0 0 12c0 1.92.445 3.735 1.24 5.35l4.088-3.165Z"/>
                        </svg>
                        <span>Continue with Google</span>
                    </button>
                    
                    <button type="button" className="social-btn" id="social-microsoft" onClick={handleDemoLogin}>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <rect fill="#F25022" x="1" y="1" width="10" height="10"/>
                            <rect fill="#7FBA00" x="13" y="1" width="10" height="10"/>
                            <rect fill="#00A4EF" x="1" y="13" width="10" height="10"/>
                            <rect fill="#FFB900" x="13" y="13" width="10" height="10"/>
                        </svg>
                        <span>Continue with Microsoft</span>
                    </button>
                </div>

                {/* Footer Switch Link */}
                <p className="login-footer-note">
                    Don't have an account?{' '}
                    <button type="button" className="create-acc-link" onClick={onSwitchToSignup}>
                        Create Account
                    </button>
                </p>

                {/* Legal Footer Links */}
                <div className="auth-footer-legal">
                    <span>© 2026 VizhaBook. All rights reserved.</span>
                    <span className="dot">•</span>
                    <button type="button" className="legal-link">Privacy Policy</button>
                    <span className="dot">•</span>
                    <button type="button" className="legal-link">Terms of Service</button>
                </div>
            </motion.form>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgot && (
                    <motion.div
                        className="auth-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowForgot(false); }}
                    >
                        <motion.div
                            className="auth-modal-card"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <div className="modal-header">
                                <h3>Reset Password</h3>
                                <button onClick={() => setShowForgot(false)} className="close-btn">
                                    <X size={20} />
                                </button>
                            </div>
                            <p>Enter your email address and we'll send you a password reset link.</p>

                            {forgotError && (
                                <div className="auth-error-box">
                                    <AlertCircle size={16} color="#FCA5A5" />
                                    <span>{forgotError}</span>
                                </div>
                            )}
                            {forgotSuccess && (
                                <div className="auth-success-box">
                                    <CheckCircle size={16} color="#6EE7B7" />
                                    <span>{forgotSuccess}</span>
                                </div>
                            )}

                            <div className="login-field-group" style={{ marginBottom: '1.25rem' }}>
                                <div className="login-field-input-box">
                                    <span className="field-icon"><Mail size={18} /></span>
                                    <input
                                        className="field-input"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={forgotEmail}
                                        onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); setForgotSuccess(''); }}
                                        id="forgot-email"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                className="login-btn-primary"
                                onClick={handleForgotPassword}
                                id="forgot-submit"
                            >
                                Send Reset Link
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default LoginForm;


