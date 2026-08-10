import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { signupSchema } from '../../schemas/auth.schema';

const COUNTRY_CODES = [
    { code: '+91', label: '🇮🇳 +91' },
    { code: '+1', label: '🇺🇸 +1' },
    { code: '+44', label: '🇬🇧 +44' },
    { code: '+61', label: '🇦🇺 +61' },
    { code: '+971', label: '🇦🇪 +971' },
    { code: '+65', label: '🇸🇬 +65' },
    { code: '+60', label: '🇲🇾 +60' },
];

const SignupForm = ({ onSwitchToLogin }) => {
    const { signup } = useAuth();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            phone: '',
            countryCode: '+91',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordValue = watch('password') || '';
    const confirmPasswordValue = watch('confirmPassword') || '';

    const getPasswordStrength = (pass) => {
        if (!pass) return null;
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        if (score <= 1) return { level: 'weak', label: 'Weak', color: '#FCA5A5', width: '33%' };
        if (score <= 3) return { level: 'medium', label: 'Medium', color: '#FBBF24', width: '66%' };
        return { level: 'strong', label: 'Strong', color: '#34D399', width: '100%' };
    };

    const strength = getPasswordStrength(passwordValue);
    const passwordsMatch = confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue;

    const onValidSubmit = async (formData) => {
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const result = await signup({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            countryCode: formData.countryCode,
            password: formData.password
        });

        if (result.success) {
            setSuccessMsg('Account Created Successfully! Redirecting to Log In...');
            setLoading(false);
            setTimeout(() => {
                onSwitchToLogin(formData.email.trim());
            }, 1400);
        } else {
            setError(result.error || 'Failed to create account. Please try again.');
            setLoading(false);
        }
    };

    const firstError = error || errors.name?.message || errors.phone?.message || errors.email?.message || errors.password?.message || errors.confirmPassword?.message;

    return (
        <motion.form
            onSubmit={handleSubmit(onValidSubmit)}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="auth-signup-form"
        >
            {/* Header */}
            <div className="login-header-group">
                <h2 className="login-title">Create Account</h2>
                <p className="login-subtitle">Join VizhaBook to manage your events & mois</p>

                {/* Gold Ornament Divider */}
                <div className="gold-ornament-divider">
                    <svg width="140" height="12" viewBox="0 0 140 12" fill="none">
                        <path d="M0 6H55" stroke="#E9B856" strokeWidth="1" strokeOpacity="0.6" />
                        <path d="M85 6H140" stroke="#E9B856" strokeWidth="1" strokeOpacity="0.6" />
                        <circle cx="58" cy="6" r="2" fill="#E9B856" />
                        <circle cx="82" cy="6" r="2" fill="#E9B856" />
                        <path d="M64 6 C64 3, 70 3, 70 6 C70 9, 76 9, 76 6 C76 3, 70 3, 70 6 Z" stroke="#E9B856" strokeWidth="1.2" fill="none" />
                        <circle cx="70" cy="6" r="1.5" fill="#E9B856" />
                    </svg>
                </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {firstError && (
                    <motion.div
                        className="auth-error-box"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <AlertCircle size={16} color="#FCA5A5" />
                        <span>{firstError}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Toast Banner */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        className="auth-success-box"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <CheckCircle size={16} color="#6EE7B7" />
                        <span>{successMsg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Field 1: Name */}
            <div className="login-field-group">
                <label className="login-field-label" htmlFor="signup-name">
                    Full Name
                </label>
                <div className="login-field-input-box">
                    <span className="field-icon"><User size={18} /></span>
                    <input
                        className="field-input"
                        type="text"
                        placeholder="Enter your full name"
                        {...register('name')}
                        id="signup-name"
                    />
                </div>
            </div>

            {/* Field 2: Mobile Number */}
            <div className="login-field-group">
                <label className="login-field-label" htmlFor="signup-phone">
                    Mobile Number
                </label>
                <div className="phone-field-row">
                    <select
                        className="country-code-select"
                        {...register('countryCode')}
                    >
                        {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                    </select>
                    <div className="login-field-input-box phone-input-box">
                        <span className="field-icon"><Phone size={18} /></span>
                        <input
                            className="field-input"
                            type="tel"
                            placeholder="10-digit phone number"
                            {...register('phone')}
                            id="signup-phone"
                        />
                    </div>
                </div>
            </div>

            {/* Field 3: Email Address */}
            <div className="login-field-group">
                <label className="login-field-label" htmlFor="signup-email">
                    Email Address
                </label>
                <div className="login-field-input-box">
                    <span className="field-icon"><Mail size={18} /></span>
                    <input
                        className="field-input"
                        type="email"
                        placeholder="name@example.com"
                        {...register('email')}
                        id="signup-email"
                    />
                </div>
            </div>

            {/* Field 4: Password */}
            <div className="login-field-group">
                <div className="login-label-row">
                    <label className="login-field-label" htmlFor="signup-password">
                        Password
                    </label>
                    {strength && (
                        <span className="strength-text" style={{ color: strength.color }}>
                            {strength.label}
                        </span>
                    )}
                </div>
                <div className="login-field-input-box">
                    <span className="field-icon"><Lock size={18} /></span>
                    <input
                        className="field-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create password"
                        {...register('password')}
                        id="signup-password"
                    />
                    <button
                        type="button"
                        className="field-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {strength && (
                    <div className="strength-bar-bg">
                        <div
                            className="strength-bar-fill"
                            style={{ width: strength.width, backgroundColor: strength.color }}
                        />
                    </div>
                )}
            </div>

            {/* Field 5: Confirm Password */}
            <div className="login-field-group">
                <div className="login-label-row">
                    <label className="login-field-label" htmlFor="signup-confirm-password">
                        Confirm Password
                    </label>
                    {confirmPasswordValue && (
                        <span className="match-status" style={{ color: passwordsMatch ? '#34D399' : '#FCA5A5' }}>
                            {passwordsMatch ? '✓ Matches' : '✗ Mismatch'}
                        </span>
                    )}
                </div>
                <div className="login-field-input-box">
                    <span className="field-icon"><Lock size={18} /></span>
                    <input
                        className="field-input"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm password"
                        {...register('confirmPassword')}
                        id="signup-confirm-password"
                    />
                    <button
                        type="button"
                        className="field-toggle-btn"
                        onClick={() => setShowConfirm(!showConfirm)}
                    >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* CTA Button: Create Account ➔ */}
            <button
                type="submit"
                className={`login-submit-btn ${loading ? 'btn-loading' : ''}`}
                disabled={loading}
            >
                {loading ? (
                    <span className="btn-spinner" />
                ) : (
                    <span>Create Account &#10140;</span>
                )}
            </button>

            {/* Footer Prompt */}
            <div className="login-footer-prompt">
                <span>Already have an account?</span>{' '}
                <button
                    type="button"
                    className="login-switch-btn"
                    onClick={onSwitchToLogin}
                >
                    Log In
                </button>
            </div>
        </motion.form>
    );
};

export default SignupForm;
