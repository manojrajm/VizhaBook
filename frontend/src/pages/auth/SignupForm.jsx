import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const COUNTRY_CODES = [
    { code: '+91', country: 'IN', label: '🇮🇳 +91' },
    { code: '+1', country: 'US', label: '🇺🇸 +1' },
    { code: '+44', country: 'GB', label: '🇬🇧 +44' },
    { code: '+61', country: 'AU', label: '🇦🇺 +61' },
    { code: '+971', country: 'AE', label: '🇦🇪 +971' },
    { code: '+65', country: 'SG', label: '🇸🇬 +65' },
    { code: '+60', country: 'MY', label: '🇲🇾 +60' },
    { code: '+49', country: 'DE', label: '🇩🇪 +49' },
    { code: '+33', country: 'FR', label: '🇫🇷 +33' },
    { code: '+81', country: 'JP', label: '🇯🇵 +81' },
    { code: '+86', country: 'CN', label: '🇨🇳 +86' },
    { code: '+82', country: 'KR', label: '🇰🇷 +82' },
    { code: '+966', country: 'SA', label: '🇸🇦 +966' },
    { code: '+974', country: 'QA', label: '🇶🇦 +974' },
    { code: '+968', country: 'OM', label: '🇴🇲 +968' },
    { code: '+973', country: 'BH', label: '🇧🇭 +973' },
    { code: '+965', country: 'KW', label: '🇰🇼 +965' },
    { code: '+94', country: 'LK', label: '🇱🇰 +94' },
    { code: '+977', country: 'NP', label: '🇳🇵 +977' },
    { code: '+880', country: 'BD', label: '🇧🇩 +880' },
];

const TOTAL_STEPS = 5;

const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;

    if (score <= 1) return { level: 'weak', label: 'Weak', segments: 1 };
    if (score <= 3) return { level: 'medium', label: 'Medium', segments: 3 };
    return { level: 'strong', label: 'Strong', segments: 5 };
};

const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -80 : 80, opacity: 0 })
};

const SignupForm = ({ onSwitchToLogin }) => {
    const { signup, sendOtp, verifyOtp } = useAuth();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Form data
    const [name, setName] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [completed, setCompleted] = useState(false);

    // OTP resend timer
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const goNext = () => {
        setDirection(1);
        setStep(prev => prev + 1);
        setError('');
    };

    const goBack = () => {
        setDirection(-1);
        setStep(prev => prev - 1);
        setError('');
    };

    // Step 1: Name
    const handleNameNext = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Please enter your name.');
            return;
        }
        if (!/^[A-Za-z\s]+$/.test(trimmed)) {
            setError('Name should contain only letters and spaces.');
            return;
        }
        if (trimmed.length < 2) {
            setError('Name must be at least 2 characters.');
            return;
        }
        goNext();
    };

    // Step 2: Phone
    const handlePhoneNext = () => {
        const trimmed = phone.trim();
        if (!trimmed) {
            setError('Please enter your mobile number.');
            return;
        }
        if (!/^\d+$/.test(trimmed)) {
            setError('Mobile number should contain only digits.');
            return;
        }
        if (countryCode === '+91' && trimmed.length !== 10) {
            setError('Indian mobile numbers must be exactly 10 digits.');
            return;
        }
        if (trimmed.length < 7 || trimmed.length > 15) {
            setError('Please enter a valid mobile number.');
            return;
        }
        goNext();
    };

    // Step 3: Email → send OTP
    const handleEmailNext = async () => {
        const trimmed = email.trim();
        if (!trimmed) {
            setError('Please enter your email address.');
            return;
        }
        if (!validateEmail(trimmed)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        await new Promise(r => setTimeout(r, 500));
        const result = sendOtp(trimmed);
        setLoading(false);

        if (result.success) {
            setResendTimer(30);
            goNext();
        }
    };

    // Step 4: OTP
    const handleOtpChange = useCallback((index, value) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    }, [otp]);

    const handleOtpKeyDown = useCallback((index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    }, [otp]);

    const handleOtpPaste = useCallback((e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const newOtp = [...otp];
            for (let i = 0; i < 6; i++) {
                newOtp[i] = pasted[i] || '';
            }
            setOtp(newOtp);
            const focusIdx = Math.min(pasted.length, 5);
            otpRefs.current[focusIdx]?.focus();
        }
    }, [otp]);

    const handleVerifyOtp = () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter the complete 6-digit code.');
            return;
        }
        const result = verifyOtp(email, code);
        if (result.success) {
            goNext();
        } else {
            setError(result.error);
        }
    };

    const handleResendOtp = () => {
        if (resendTimer > 0) return;
        sendOtp(email);
        setResendTimer(30);
        setOtp(['', '', '', '', '', '']);
    };

    // Step 5: Password → create account
    const handleCreateAccount = async () => {
        if (!password) {
            setError('Please enter a password.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setError('Password must contain at least one uppercase letter.');
            return;
        }
        if (!/[0-9]/.test(password)) {
            setError('Password must contain at least one number.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        await new Promise(r => setTimeout(r, 600));

        const result = signup({
            name: name.trim(),
            phone: phone.trim(),
            countryCode,
            email: email.trim(),
            password
        });

        setLoading(false);

        if (result.success) {
            setCompleted(true);
        } else {
            setError(result.error);
        }
    };

    const passwordStrength = getPasswordStrength(password);

    // Success screen
    if (completed) {
        return (
            <motion.div
                className="auth-success-screen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.div
                    className="auth-success-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    🎉
                </motion.div>
                <h2>Account Created Successfully!</h2>
                <p>Welcome to VizhaBook, {name.trim().split(' ')[0]}! Your account is ready.</p>
                <button
                    className="auth-btn-primary"
                    onClick={onSwitchToLogin}
                    style={{ marginTop: '1rem', maxWidth: '280px' }}
                    id="goto-login"
                >
                    Go to Login Page
                    <span className="btn-arrow"><ArrowRight size={16} /></span>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
        >
            {/* Step Progress */}
            <div className="auth-step-progress">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <React.Fragment key={i}>
                        <div
                            className={`auth-step-dot ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'completed' : ''}`}
                        />
                        {i < TOTAL_STEPS - 1 && (
                            <div className={`auth-step-connector ${i + 1 < step ? 'active' : ''}`} />
                        )}
                    </React.Fragment>
                ))}
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

            {/* Steps */}
            <AnimatePresence mode="wait" custom={direction}>
                {/* Step 1: Name */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <div className="auth-form-header">
                            <h2>What's your <strong>Name?</strong></h2>
                            <p>Let's start with your full name</p>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Full Name</label>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon"><User size={18} /></span>
                                <input
                                    className="auth-input"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^[A-Za-z\s]*$/.test(val)) {
                                            setName(val);
                                            setError('');
                                        }
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
                                    autoFocus
                                    id="signup-name"
                                />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#4B5563', marginTop: '0.15rem' }}>
                                Only letters and spaces allowed
                            </span>
                        </div>

                        <button className="auth-btn-primary" onClick={handleNameNext} id="step1-next">
                            Continue
                            <span className="btn-arrow"><ArrowRight size={16} /></span>
                        </button>

                        <p className="auth-footer-text" style={{ marginTop: '1.5rem' }}>
                            Already have an account?{' '}
                            <button type="button" className="auth-footer-link" onClick={onSwitchToLogin}>
                                Login
                            </button>
                        </p>
                    </motion.div>
                )}

                {/* Step 2: Phone */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <div className="auth-form-header">
                            <h2>Your <strong>Mobile Number</strong></h2>
                            <p>We'll use this for your account profile</p>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Mobile Number</label>
                            <div className="auth-phone-wrapper">
                                <select
                                    className="auth-country-select"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    id="signup-country-code"
                                >
                                    {COUNTRY_CODES.map(cc => (
                                        <option key={cc.code} value={cc.code}>{cc.label}</option>
                                    ))}
                                </select>
                                <div className="auth-phone-input-wrapper">
                                    <div className="auth-input-wrapper">
                                        <span className="auth-input-icon"><Phone size={18} /></span>
                                        <input
                                            className="auth-input"
                                            type="tel"
                                            placeholder="Enter mobile number"
                                            value={phone}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^\d*$/.test(val)) {
                                                    setPhone(val);
                                                    setError('');
                                                }
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePhoneNext()}
                                            autoFocus
                                            id="signup-phone"
                                        />
                                    </div>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#4B5563', marginTop: '0.15rem' }}>
                                Numbers only{countryCode === '+91' ? ' • 10 digits for India' : ''}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="auth-btn-secondary" onClick={goBack} style={{ flex: '0 0 auto', width: '48px', padding: '0.85rem' }}>
                                <ArrowLeft size={18} />
                            </button>
                            <button className="auth-btn-primary" onClick={handlePhoneNext} style={{ flex: 1 }} id="step2-next">
                                Continue
                                <span className="btn-arrow"><ArrowRight size={16} /></span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Email */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <div className="auth-form-header">
                            <h2>Your <strong>Email Address</strong></h2>
                            <p>We'll send a verification code to this email</p>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Email Address</label>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon"><Mail size={18} /></span>
                                <input
                                    className="auth-input"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEmailNext()}
                                    autoFocus
                                    id="signup-email"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="auth-btn-secondary" onClick={goBack} style={{ flex: '0 0 auto', width: '48px', padding: '0.85rem' }}>
                                <ArrowLeft size={18} />
                            </button>
                            <button className="auth-btn-primary" onClick={handleEmailNext} disabled={loading} style={{ flex: 1 }} id="step3-next">
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                            style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                                        />
                                        Sending OTP...
                                    </span>
                                ) : (
                                    <>
                                        Send Verification Code
                                        <span className="btn-arrow"><ArrowRight size={16} /></span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: OTP */}
                {step === 4 && (
                    <motion.div
                        key="step4"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <div className="auth-form-header" style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <ShieldCheck size={36} color="#D4A845" />
                            </div>
                            <h2>Verify your <strong>Email</strong></h2>
                            <p>Enter the 6-digit code sent to <strong style={{ color: '#D4A845' }}>{email}</strong></p>
                        </div>

                        <div className="auth-otp-container" onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => otpRefs.current[i] = el}
                                    className={`auth-otp-input ${digit ? 'filled' : ''}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    autoFocus={i === 0}
                                    id={`otp-${i}`}
                                />
                            ))}
                        </div>

                        <div className="auth-resend-row">
                            {resendTimer > 0 ? (
                                <span className="auth-resend-timer">Resend code in {resendTimer}s</span>
                            ) : (
                                <button className="auth-resend-btn" onClick={handleResendOtp}>
                                    Resend Code
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button className="auth-btn-secondary" onClick={goBack} style={{ flex: '0 0 auto', width: '48px', padding: '0.85rem' }}>
                                <ArrowLeft size={18} />
                            </button>
                            <button className="auth-btn-primary" onClick={handleVerifyOtp} style={{ flex: 1 }} id="step4-verify">
                                Verify Code
                                <span className="btn-arrow"><ArrowRight size={16} /></span>
                            </button>
                        </div>

                        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#4B5563', marginTop: '1rem' }}>
                            💡 Dev mode: use code <strong style={{ color: '#D4A845' }}>123456</strong>
                        </p>
                    </motion.div>
                )}

                {/* Step 5: Password */}
                {step === 5 && (
                    <motion.div
                        key="step5"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <div className="auth-form-header">
                            <h2>Set your <strong>Password</strong></h2>
                            <p>Choose a strong password for your account</p>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Password</label>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon"><Lock size={18} /></span>
                                <input
                                    className="auth-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    autoFocus
                                    id="signup-password"
                                />
                                <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {password && (
                                <>
                                    <div className="auth-strength-bar">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className={`auth-strength-segment ${i <= passwordStrength.segments ? passwordStrength.level : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <span className={`auth-strength-text ${passwordStrength.level}`}>
                                        Password strength: {passwordStrength.label}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Confirm Password</label>
                            <div className={`auth-input-wrapper ${confirmPassword && password !== confirmPassword ? 'error' : ''}`}>
                                <span className="auth-input-icon"><Lock size={18} /></span>
                                <input
                                    className="auth-input"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                                    id="signup-confirm-password"
                                />
                                <button type="button" className="auth-input-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {confirmPassword && password === confirmPassword && (
                                <span style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                                    <CheckCircle size={12} /> Passwords match
                                </span>
                            )}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#4B5563', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Password must contain: min 8 characters, 1 uppercase letter, 1 number
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="auth-btn-secondary" onClick={goBack} style={{ flex: '0 0 auto', width: '48px', padding: '0.85rem' }}>
                                <ArrowLeft size={18} />
                            </button>
                            <button className="auth-btn-primary" onClick={handleCreateAccount} disabled={loading} style={{ flex: 1 }} id="step5-create">
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                            style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                                        />
                                        Creating Account...
                                    </span>
                                ) : (
                                    <>
                                        Create Account
                                        <span className="btn-arrow"><ArrowRight size={16} /></span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SignupForm;
