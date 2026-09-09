import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { adminService } from '../../services/adminService';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const logoRef = useRef(null);
    const formCardRef = useRef(null);

    useEffect(() => {
        // Redirect if already logged in as SUPER_ADMIN
        const adminToken = localStorage.getItem('adminToken');
        const adminUserRaw = localStorage.getItem('adminUser');
        if (adminToken && adminUserRaw) {
            try {
                const u = JSON.parse(adminUserRaw);
                if (u && u.role === 'SUPER_ADMIN') {
                    navigate('/admin/dashboard', { replace: true });
                    return;
                }
            } catch (e) {}
        }

        // GSAP Animations
        const tl = gsap.timeline();
        if (logoRef.current) {
            tl.fromTo(logoRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
        }
        if (formCardRef.current) {
            tl.fromTo(formCardRef.current, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }, "-=0.3");
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Simple Zod-like Client Validation
        if (!email || !email.includes('@')) {
            setError('Please enter a valid admin email address.');
            return;
        }

        if (!password) {
            setError('Password is required.');
            return;
        }

        setLoading(true);

        try {
            const data = await adminService.login(email.trim(), password);

            if (data.user && data.user.role === 'SUPER_ADMIN') {
                navigate('/admin/dashboard');
            } else {
                setError('Access denied. Super Admin role required.');
            }
        } catch (err) {
            setError(err.message || 'Invalid admin credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-wrapper">
                <div className="admin-login-header" ref={logoRef}>
                    <div className="admin-brand-icon">
                        <ShieldCheck size={36} />
                    </div>
                    <h1 className="admin-brand-title">VizhaBook</h1>
                    <span className="admin-portal-badge">SUPER ADMIN PORTAL</span>
                    <p className="admin-brand-subtitle">Platform Management & Executive Analytics</p>
                </div>

                <div className="admin-login-card" ref={formCardRef}>
                    {error && (
                        <div className="admin-alert error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="admin-login-form">
                        <div className="admin-form-group">
                            <label>Admin Email Address</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@vizhabook.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label>Password</label>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={18} />
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button 
                                    type="button" 
                                    className="toggle-password-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="admin-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="spin" size={20} />
                                    <span>Authenticating Admin...</span>
                                </>
                            ) : (
                                <span>Sign In to Admin Portal</span>
                            )}
                        </button>
                    </form>

                    <div className="admin-login-footer">
                        <p>🔐 Restricted Area. Authorized Super Admin Personnel Only.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
