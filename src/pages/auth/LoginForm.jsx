import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onSwitchToSignup }) => {
    const { login, resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [forgotError, setForgotError] = useState('');

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);
        // Small delay to simulate auth
        await new Promise(r => setTimeout(r, 600));

        const result = login(email, password, rememberMe);
        if (!result.success) {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleForgotPassword = async () => {
        setForgotError('');
        setForgotSuccess('');

        if (!forgotEmail.trim()) {
            setForgotError('Please enter your email address.');
            return;
        }
        if (!validateEmail(forgotEmail)) {
            setForgotError('Please enter a valid email address.');
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
            >
                {/* Header */}
                <div className="auth-form-header">
                    <h2>Welcome <strong>Back!</strong></h2>
                    <p>Login to continue to your account</p>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="auth-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <AlertCircle size={16} color="#FCA5A5" />
                            <span className="auth-error-text">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Email */}
                <div className="auth-input-group">
                    <label className="auth-input-label">Email Address</label>
                    <div className={`auth-input-wrapper ${error && !email ? 'error' : ''}`}>
                        <span className="auth-input-icon"><Mail size={18} /></span>
                        <input
                            className="auth-input"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            autoComplete="email"
                            id="login-email"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="auth-input-group">
                    <label className="auth-input-label">Password</label>
                    <div className={`auth-input-wrapper ${error && !password ? 'error' : ''}`}>
                        <span className="auth-input-icon"><Lock size={18} /></span>
                        <input
                            className="auth-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            autoComplete="current-password"
                            id="login-password"
                        />
                        <button
                            type="button"
                            className="auth-input-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Options Row */}
                <div className="auth-options-row">
                    <label className="auth-checkbox-label" htmlFor="remember-me">
                        <input
                            type="checkbox"
                            className="auth-checkbox"
                            id="remember-me"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="auth-checkbox-text">Remember me</span>
                    </label>
                    <button
                        type="button"
                        className="auth-forgot-link"
                        onClick={() => { setShowForgot(true); setForgotEmail(email); }}
                    >
                        Forgot Password?
                    </button>
                </div>

                {/* Login Button */}
                <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={loading}
                    id="login-submit"
                >
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                            />
                            Logging in...
                        </span>
                    ) : (
                        <>
                            Login
                            <span className="btn-arrow"><ArrowRight size={16} /></span>
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className="auth-divider">
                    <div className="auth-divider-line" />
                    <span className="auth-divider-text">or continue with</span>
                    <div className="auth-divider-line" />
                </div>

                {/* Social Buttons */}
                <div className="auth-social-row">
                    <button type="button" className="auth-social-btn google" title="Sign in with Google" id="social-google">
                        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/><path fill="#34A853" d="M16.04 18.013C14.95 18.72 13.56 19.091 12 19.091c-3.1 0-5.727-2.09-6.672-4.906L1.24 17.35C3.198 21.302 7.27 24 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/><path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/><path fill="#FBBC05" d="M5.328 14.185A7.13 7.13 0 0 1 4.909 12c0-.758.125-1.49.353-2.175L1.24 6.65A11.93 11.93 0 0 0 0 12c0 1.92.445 3.735 1.24 5.35l4.088-3.165Z"/></svg>
                    </button>
                    <button type="button" className="auth-social-btn github" title="Sign in with GitHub" id="social-github">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
                    </button>
                    <button type="button" className="auth-social-btn microsoft" title="Sign in with Microsoft" id="social-microsoft">
                        <svg width="20" height="20" viewBox="0 0 24 24"><rect fill="#F25022" x="1" y="1" width="10" height="10"/><rect fill="#7FBA00" x="13" y="1" width="10" height="10"/><rect fill="#00A4EF" x="1" y="13" width="10" height="10"/><rect fill="#FFB900" x="13" y="13" width="10" height="10"/></svg>
                    </button>
                </div>

                {/* Footer */}
                <p className="auth-footer-text">
                    Don't have an account?{' '}
                    <button type="button" className="auth-footer-link" onClick={onSwitchToSignup}>
                        Sign Up
                    </button>
                </p>
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
                            className="auth-modal"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h3>Reset Password</h3>
                                <button
                                    onClick={() => setShowForgot(false)}
                                    style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '0.25rem' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <p>Enter your email address and we'll send you a password reset link.</p>

                            {forgotError && (
                                <div className="auth-error">
                                    <AlertCircle size={16} color="#FCA5A5" />
                                    <span className="auth-error-text">{forgotError}</span>
                                </div>
                            )}
                            {forgotSuccess && (
                                <div className="auth-success">
                                    <span className="auth-success-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={16} color="#6EE7B7" />
                                        {forgotSuccess}
                                    </span>
                                </div>
                            )}

                            <div className="auth-input-group" style={{ marginBottom: '1.25rem' }}>
                                <div className="auth-input-wrapper">
                                    <span className="auth-input-icon"><Mail size={18} /></span>
                                    <input
                                        className="auth-input"
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
                                className="auth-btn-primary"
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
