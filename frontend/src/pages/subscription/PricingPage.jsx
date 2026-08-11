import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Star, Crown, Check, Shield, Lock, Clock, Zap, Globe, Sparkles } from 'lucide-react';
import paymentService from '../../services/paymentService';
import './PricingPage.css';

const PricingPage = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [billingPeriod, setBillingPeriod] = useState('annual');
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    useEffect(() => {
        const loadPlans = async () => {
            setLoading(true);
            const data = await paymentService.getPlans();
            setPlans(data);
            setLoading(false);
        };
        loadPlans();
    }, []);

    const handleChoosePlan = async (planId) => {
        setSelectedPlanId(planId);
        const res = await paymentService.selectPlan(planId);
        if (res.success) {
            navigate('/subscription/success', { state: { plan: res.plan, subscription: res.subscription } });
        } else {
            alert(res.error || 'Failed to select plan');
            setSelectedPlanId(null);
        }
    };

    // Default static fallback definitions matching reference screenshot if backend is starting up
    const defaultPlans = [
        {
            id: 'PLAN_BASIC',
            name: 'Basic Plan',
            subtitle: 'Perfect for small functions',
            price: 499,
            period: '/ year',
            limitPill: '1 Function / 300 Entries',
            accentClass: 'basic',
            icon: Leaf,
            features: [
                '1 Function',
                'Up to 300 Moi/Gift Entries',
                'Expense Tracking',
                'Basic Reports',
                'PDF Export',
                'Basic Dashboard',
                'Email Support'
            ],
            btnText: 'Choose Basic',
            btnClass: 'basic'
        },
        {
            id: 'PLAN_STANDARD',
            name: 'Standard Plan',
            subtitle: 'Best for multiple functions',
            price: 999,
            period: '/ year',
            limitPill: '5 Functions / 2000 Entries',
            accentClass: 'standard',
            icon: Star,
            isPopular: true,
            features: [
                '5 Functions',
                'Up to 2000 Moi/Gift Entries',
                'Expense Tracking',
                'Advanced Reports',
                'PDF & Excel Export',
                'QR Guest Check-in',
                'Advanced Dashboard',
                'Priority Email Support'
            ],
            btnText: 'Choose Standard',
            btnClass: 'standard'
        },
        {
            id: 'PLAN_PREMIUM',
            name: 'Premium Plan',
            subtitle: 'For large events & families',
            price: 1999,
            period: '/ year',
            limitPill: 'Unlimited Functions / 5000 Entries',
            accentClass: 'premium',
            icon: Crown,
            features: [
                'Unlimited Functions (Within Year)',
                'Up to 5000 Moi/Gift Entries',
                'Expense Tracking',
                'Advanced Reports',
                'PDF & Excel Export',
                'QR Guest Check-in',
                'Advanced Dashboard',
                'Priority Support',
                'Data Backup & Restore'
            ],
            btnText: 'Choose Premium',
            btnClass: 'premium'
        }
    ];

    const displayPlans = plans.length > 0 ? plans.map(p => {
        const idLower = (p.id || p.name).toLowerCase();
        if (idLower.includes('basic')) {
            return { ...defaultPlans[0], id: p.id, price: Number(p.price) || 499 };
        } else if (idLower.includes('standard')) {
            return { ...defaultPlans[1], id: p.id, price: Number(p.price) || 999 };
        } else {
            return { ...defaultPlans[2], id: p.id, price: Number(p.price) || 1999 };
        }
    }) : defaultPlans;

    return (
        <div className="pricing-page-container">
            <div className="pricing-board">
                {/* LEFT HERO PANEL (Traditional Cream & Gold Cultural Identity) */}
                <div className="pricing-hero-panel">
                    {/* Garland Top */}
                    <div className="pricing-garland-top">
                        <svg width="100%" height="80" viewBox="0 0 500 80" fill="none" preserveAspectRatio="none">
                            <path d="M0,0 Q125,70 250,0 Q375,70 500,0 L500,0 L0,0 Z" fill="#D4AF37" fillOpacity="0.15" />
                            <path d="M0,0 Q125,50 250,0 Q375,50 500,0" stroke="#E9B856" strokeWidth="2" fill="none" />
                            <circle cx="125" cy="35" r="4" fill="#E9B856" />
                            <circle cx="375" cy="35" r="4" fill="#E9B856" />
                        </svg>
                    </div>

                    {/* Logo & Branding */}
                    <div className="pricing-logo-wrapper">
                        {/* Gold Crest Emblem */}
                        <svg className="pricing-emblem-icon" viewBox="0 0 120 120" fill="none">
                            <circle cx="60" cy="60" r="54" stroke="#D4AF37" strokeWidth="2" strokeDasharray="4 2" />
                            <path d="M60 15 L72 38 L98 42 L79 61 L83 87 L60 75 L37 87 L41 61 L22 42 L48 38 Z" fill="url(#goldGrad)" stroke="#B8860B" strokeWidth="1" />
                            <rect x="42" y="42" width="36" height="36" rx="4" fill="#5A390F" />
                            <text x="60" y="65" fill="#FAF0D9" fontSize="16" fontFamily="Playfair Display" textAnchor="middle" fontWeight="bold">மொய்</text>
                            <defs>
                                <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#FAD675" />
                                    <stop offset="100%" stopColor="#C49842" />
                                </linearGradient>
                            </defs>
                        </svg>

                        <h1 className="pricing-brand-title">VizhaBook</h1>
                        <h2 className="pricing-brand-tamil">விழாபுக்</h2>
                        <p className="pricing-brand-tagline">FROM MOI TO DIGITAL, TRADITIONS SUSTAINED</p>
                    </div>

                    {/* 4 Feature Circles */}
                    <div className="pricing-features-grid">
                        <div className="pricing-circle-card">
                            <div className="pricing-circle-icon-box">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 00-4 4v2"/><circle cx="17" cy="11" r="3"/><path d="M22 21v-2a3 3 0 00-3-3h-1"/></svg>
                            </div>
                            <h4 className="pricing-circle-title">MANAGE FUNCTIONS</h4>
                            <p className="pricing-circle-desc">Create & manage your functions effortlessly</p>
                        </div>

                        <div className="pricing-circle-card">
                            <div className="pricing-circle-icon-box">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                            </div>
                            <h4 className="pricing-circle-title">TRACK MOI & GIFTS</h4>
                            <p className="pricing-circle-desc">Record and track contributions with ease</p>
                        </div>

                        <div className="pricing-circle-card">
                            <div className="pricing-circle-icon-box">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            </div>
                            <h4 className="pricing-circle-title">MANAGE EXPENSES</h4>
                            <p className="pricing-circle-desc">Keep track of all your expenses in one place</p>
                        </div>

                        <div className="pricing-circle-card">
                            <div className="pricing-circle-icon-box">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            </div>
                            <h4 className="pricing-circle-title">DETAILED REPORTS</h4>
                            <p className="pricing-circle-desc">Get powerful insights and export reports</p>
                        </div>
                    </div>

                    {/* Bottom Skyline & Kolam */}
                    <div className="pricing-bottom-illustration">
                        <svg className="pricing-kolam-rangoli" viewBox="0 0 200 80" fill="none">
                            <path d="M100 10 C120 30, 160 30, 180 10 C160 50, 160 70, 100 70 C40 70, 40 50, 20 10 C40 30, 80 30, 100 10 Z" stroke="#C49842" strokeWidth="1.5" />
                            <circle cx="100" cy="40" r="8" fill="#E9B856" />
                        </svg>
                        <div className="pricing-skyline-bg" />
                    </div>
                </div>

                {/* RIGHT CONTENT PANEL (Luxury Deep Purple & SaaS Cards) */}
                <div className="pricing-content-panel">
                    {/* Header & Annual Toggle */}
                    <div className="pricing-header-area">
                        <h2 className="pricing-main-title">Choose Your Subscription Plan</h2>
                        <p className="pricing-main-subtitle">Select the perfect plan to continue your digital journey</p>

                        <div className="pricing-toggle-wrapper">
                            <span className="pricing-save-badge">Save up to 20% with Annual Plan</span>
                            <div className="pricing-toggle-pill">
                                <button
                                    type="button"
                                    className={`toggle-btn ${billingPeriod === 'annual' ? 'active' : ''}`}
                                    onClick={() => setBillingPeriod('annual')}
                                >
                                    Annual
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
                                    onClick={() => setBillingPeriod('monthly')}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3 Plan Cards Container */}
                    <div className="pricing-cards-container">
                        {displayPlans.map((plan) => {
                            const IconComponent = plan.icon;
                            return (
                                <div
                                    key={plan.id}
                                    className={`pricing-plan-card ${plan.isPopular ? 'featured' : ''}`}
                                >
                                    {plan.isPopular && (
                                        <div className="featured-top-badge">MOST POPULAR</div>
                                    )}

                                    <div>
                                        <div className="card-icon-header">
                                            <div className={`plan-accent-icon ${plan.accentClass}`}>
                                                <IconComponent size={22} />
                                            </div>
                                            <h3 className="card-plan-name">{plan.name}</h3>
                                            <p className="card-plan-subtitle">{plan.subtitle}</p>
                                        </div>

                                        <div className="card-price-box">
                                            <span className="price-val">₹{plan.price}</span>
                                            <span className="price-period"> {plan.period}</span>
                                        </div>

                                        <div className={`limit-pill-badge ${plan.accentClass}`}>
                                            {plan.limitPill}
                                        </div>

                                        <ul className="card-features-list">
                                            {plan.features.map((feat, idx) => (
                                                <li key={idx} className="feature-item-row">
                                                    <Check size={14} className={`check-icon ${plan.accentClass}`} />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <button
                                        type="button"
                                        className={`card-cta-btn ${plan.btnClass}`}
                                        onClick={() => handleChoosePlan(plan.id)}
                                        disabled={selectedPlanId === plan.id}
                                    >
                                        {selectedPlanId === plan.id ? 'Processing...' : plan.btnText}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Security & Banner Area */}
                    <div>
                        <div className="pricing-shield-banner">
                            <Shield size={16} color="#E9B856" />
                            <span>All plans include regular updates, secure cloud storage and dedicated data protection.</span>
                        </div>

                        <div className="pricing-security-bar">
                            <div className="security-item">
                                <div className="sec-icon-box"><Shield size={16} /></div>
                                <div>
                                    <div className="sec-title">Secure Payment</div>
                                    <div className="sec-desc">Powered by Razorpay 100% secure transactions</div>
                                </div>
                            </div>

                            <div className="security-item">
                                <div className="sec-icon-box"><Lock size={16} /></div>
                                <div>
                                    <div className="sec-title">Data Protection</div>
                                    <div className="sec-desc">Enterprise-grade security Your data is always safe</div>
                                </div>
                            </div>

                            <div className="security-item">
                                <div className="sec-icon-box"><Clock size={16} /></div>
                                <div>
                                    <div className="sec-title">Cancel Anytime</div>
                                    <div className="sec-desc">No lock-ins. Cancel or upgrade anytime</div>
                                </div>
                            </div>

                            <div className="security-item">
                                <div className="sec-icon-box"><Zap size={16} /></div>
                                <div>
                                    <div className="sec-title">Instant Activation</div>
                                    <div className="sec-desc">Get immediate access after successful payment</div>
                                </div>
                            </div>
                        </div>

                        <div className="pricing-contact-link">
                            Need help choosing a plan? <button type="button" onClick={() => alert('Support team: support@vizhabook.com')}>Contact us</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
