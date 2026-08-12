import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Star, Crown, Check, Shield, Lock, Clock, Zap, Globe, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import useSubscription from '../../hooks/useSubscription';
import paymentService from '../../services/paymentService';
import loginDesktopImg from '../../assets/LoginDesktop.png';
import './PricingPage.css';

/* =============================================================
   Static plan config — IDs match subscription_plans DB table
   ============================================================= */
const PLAN_CONFIGS = [
    {
        id: 'PLAN_BASIC',
        name: 'Basic Plan',
        subtitle: 'Perfect for small functions',
        price: 499,
        period: '/ year',
        limitPill: '1 Function / 300 Entries',
        tier: 'basic',
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
        btnText: 'Choose Basic'
    },
    {
        id: 'PLAN_STANDARD',
        name: 'Standard Plan',
        subtitle: 'Best for multiple functions',
        price: 999,
        period: '/ year',
        limitPill: '5 Functions / 2000 Entries',
        tier: 'standard',
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
        btnText: 'Choose Standard'
    },
    {
        id: 'PLAN_PREMIUM',
        name: 'Premium Plan',
        subtitle: 'For large events & families',
        price: 1999,
        period: '/ year',
        limitPill: 'Unlimited Functions / 5000 Entries',
        tier: 'premium',
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
        btnText: 'Choose Premium'
    }
];

const PricingPage = () => {
    const navigate = useNavigate();
    const { lang, toggleLang } = useApp();
    const { subscription, plan: activePlan, isTrial, isActive, isExpired, loading: subLoading } = useSubscription();

    const [plans, setPlans] = useState([]);
    const [billingPeriod, setBillingPeriod] = useState('annual');
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    useEffect(() => {
        const loadPlans = async () => {
            setLoadingPlans(true);
            const data = await paymentService.getPlans();
            setPlans(data);
            setLoadingPlans(false);
        };
        loadPlans();
    }, []);

    /* Merge live prices from backend, fall back to static config */
    const displayPlans = PLAN_CONFIGS.map(cfg => {
        const live = plans.find(p => p.id === cfg.id);
        return live
            ? { ...cfg, price: Number(live.price) || cfg.price }
            : cfg;
    });

    const isCurrentPlan = (planId) => {
        if (!isActive || !activePlan) return false;
        return activePlan.id === planId;
    };

    const handleChoosePlan = async (planId) => {
        if (isCurrentPlan(planId)) return;
        setSelectedPlanId(planId);
        const res = await paymentService.selectPlan(planId);
        if (res.success) {
            navigate('/subscription/success', {
                state: { plan: res.plan, subscription: res.subscription }
            });
        } else {
            alert(res.error || 'Failed to select plan. Please try again.');
            setSelectedPlanId(null);
        }
    };

    const getCtaLabel = (plan) => {
        if (isCurrentPlan(plan.id)) return 'Current Plan';
        if (selectedPlanId === plan.id) return 'Processing…';
        return plan.btnText;
    };

    return (
        <div className="pp-container">
            {/* ============================================
                LEFT — Exact LoginDesktop.png artwork reuse
                ============================================ */}
            <div className="pp-hero-panel">
                <img
                    src={loginDesktopImg}
                    alt="VizhaBook Traditions"
                    className="pp-hero-image"
                />
            </div>

            {/* ============================================
                RIGHT — Premium Pricing Content
                ============================================ */}
            <div className="pp-content-panel">

                {/* Language selector top-right */}
                <div className="pp-lang-row">
                    <button
                        type="button"
                        className="pp-lang-btn"
                        onClick={toggleLang}
                        id="pricing-lang-toggle"
                    >
                        <Globe size={15} />
                        <span>{lang === 'en' ? 'English' : 'தமிழ்'}</span>
                        <ChevronDown size={14} />
                    </button>
                </div>

                {/* Heading */}
                <div className="pp-heading-area">
                    <h1 className="pp-main-title">
                        Choose Your<br />
                        <span className="pp-title-gold">Subscription Plan</span>
                    </h1>
                    <p className="pp-main-subtitle">
                        Select the perfect plan to continue<br />your digital journey
                    </p>
                    <div className="pp-gold-divider" aria-hidden="true">
                        <span />
                        <svg width="24" height="10" viewBox="0 0 24 10" fill="none">
                            <circle cx="12" cy="5" r="3" fill="#C99A32" />
                            <circle cx="4" cy="5" r="1.5" fill="#C99A32" opacity="0.5" />
                            <circle cx="20" cy="5" r="1.5" fill="#C99A32" opacity="0.5" />
                        </svg>
                        <span />
                    </div>
                </div>

                {/* Annual / Monthly Toggle */}
                <div className="pp-toggle-wrapper">
                    <span className="pp-save-text">Save up to 20% with Annual Plan</span>
                    <div className="pp-toggle-pill" role="group" aria-label="Billing Period">
                        <button
                            type="button"
                            id="billing-annual"
                            className={`pp-toggle-btn ${billingPeriod === 'annual' ? 'active' : ''}`}
                            onClick={() => setBillingPeriod('annual')}
                        >
                            Annual
                        </button>
                        <button
                            type="button"
                            id="billing-monthly"
                            className={`pp-toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
                            onClick={() => setBillingPeriod('monthly')}
                        >
                            Monthly
                        </button>
                    </div>
                </div>

                {/* =========================================
                    PLAN CARDS
                    ========================================= */}
                <div className="pp-cards-grid">
                    {displayPlans.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = isCurrentPlan(plan.id);
                        const isProcessing = selectedPlanId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`pp-card ${plan.tier} ${plan.isPopular ? 'featured' : ''} ${isCurrent ? 'is-current' : ''}`}
                            >
                                {plan.isPopular && (
                                    <div className="pp-popular-badge" aria-label="Most Popular Plan">
                                        MOST POPULAR
                                    </div>
                                )}

                                {/* Plan icon */}
                                <div className={`pp-plan-icon-box ${plan.tier}`}>
                                    <Icon size={22} />
                                </div>

                                {/* Plan name */}
                                <h3 className="pp-plan-name">{plan.name}</h3>
                                <p className="pp-plan-subtitle">{plan.subtitle}</p>

                                {/* Price */}
                                <div className="pp-price-row">
                                    <span className="pp-price-currency">₹</span>
                                    <span className="pp-price-value">{plan.price.toLocaleString('en-IN')}</span>
                                    <span className="pp-price-period">{plan.period}</span>
                                </div>

                                {/* Limit pill */}
                                <div className={`pp-limit-pill ${plan.tier}`}>
                                    {plan.limitPill}
                                </div>

                                {/* Feature list */}
                                <ul className="pp-features-list">
                                    {plan.features.map((feat, i) => (
                                        <li key={i} className="pp-feature-row">
                                            <Check size={13} className={`pp-check ${plan.tier}`} />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <button
                                    type="button"
                                    id={`cta-${plan.id.toLowerCase()}`}
                                    className={`pp-cta-btn ${plan.tier} ${isCurrent ? 'current' : ''}`}
                                    onClick={() => handleChoosePlan(plan.id)}
                                    disabled={isCurrent || isProcessing}
                                >
                                    {getCtaLabel(plan)}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Shield Banner */}
                <div className="pp-shield-banner">
                    <Shield size={15} color="#E9B856" />
                    <span>All plans include regular updates, secure cloud storage and dedicated data protection.</span>
                </div>

                {/* Security Trust Icons */}
                <div className="pp-trust-bar">
                    <div className="pp-trust-item">
                        <div className="pp-trust-icon"><Shield size={15} /></div>
                        <div>
                            <div className="pp-trust-title">Secure Payment</div>
                            <div className="pp-trust-desc">Powered by Razorpay<br />100% secure transactions</div>
                        </div>
                    </div>
                    <div className="pp-trust-item">
                        <div className="pp-trust-icon"><Lock size={15} /></div>
                        <div>
                            <div className="pp-trust-title">Data Protection</div>
                            <div className="pp-trust-desc">Enterprise-grade security<br />Your data is always safe</div>
                        </div>
                    </div>
                    <div className="pp-trust-item">
                        <div className="pp-trust-icon"><Clock size={15} /></div>
                        <div>
                            <div className="pp-trust-title">Cancel Anytime</div>
                            <div className="pp-trust-desc">No lock-ins. Cancel or<br />upgrade anytime</div>
                        </div>
                    </div>
                    <div className="pp-trust-item">
                        <div className="pp-trust-icon"><Zap size={15} /></div>
                        <div>
                            <div className="pp-trust-title">Instant Activation</div>
                            <div className="pp-trust-desc">Get immediate access<br />after successful payment</div>
                        </div>
                    </div>
                </div>

                {/* Footer contact */}
                <div className="pp-contact-footer">
                    Need help choosing a plan?{' '}
                    <button
                        type="button"
                        onClick={() => alert('Support: support@vizhabook.com')}
                        id="pricing-contact-us"
                    >
                        Contact us
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
