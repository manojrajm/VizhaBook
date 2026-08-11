import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Calendar, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import useSubscription from '../../hooks/useSubscription';
import './SubscriptionPage.css';

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const {
        loading,
        subscription,
        plan,
        status,
        isTrial,
        isExpired,
        daysRemaining,
        functionLimit,
        entryLimit,
        functionsUsed,
        entriesUsed
    } = useSubscription();

    if (loading) {
        return (
            <div className="sub-loading-container">
                <RefreshCw className="spin-icon" size={32} color="#D4A845" />
                <p>Loading subscription details...</p>
            </div>
        );
    }

    const planName = plan ? plan.name : isTrial ? 'Free Trial' : 'Trial Expired';
    const funcLimitText = functionLimit === null ? 'Unlimited' : functionLimit;
    const funcPercent = functionLimit === null ? 20 : Math.min(100, Math.round((functionsUsed / functionLimit) * 100));
    const entryPercent = Math.min(100, Math.round((entriesUsed / entryLimit) * 100));

    return (
        <div className="subscription-status-page">
            {/* Header Banner */}
            <div className="sub-status-header">
                <div>
                    <span className={`sub-status-badge ${status.toLowerCase()}`}>
                        {status === 'ACTIVE' ? 'ACTIVE SUBSCRIPTION' : status === 'TRIAL' ? 'FREE TRIAL' : 'EXPIRED'}
                    </span>
                    <h1 className="sub-status-title">{planName}</h1>
                    <p className="sub-status-subtitle">
                        {isTrial
                            ? `You are currently on a 14-day free trial. ${daysRemaining} days remaining.`
                            : isExpired
                            ? 'Your trial or subscription has expired. Upgrade your plan to unlock full access.'
                            : 'Your account subscription is active and in good standing.'}
                    </p>
                </div>

                <button
                    type="button"
                    className="sub-upgrade-btn"
                    onClick={() => navigate('/pricing')}
                >
                    <Zap size={18} />
                    <span>{isTrial || isExpired ? 'Upgrade Plan' : 'Change Plan'}</span>
                </button>
            </div>

            {/* Main Details Grid */}
            <div className="sub-details-grid">
                {/* Usage Card 1: Functions */}
                <div className="sub-usage-card">
                    <div className="usage-card-header">
                        <h3>Functions Usage</h3>
                        <span className="usage-count">{functionsUsed} / {funcLimitText}</span>
                    </div>

                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${funcPercent}%`, background: funcPercent > 90 ? '#EF4444' : '#D4A845' }}
                        />
                    </div>
                    <p className="usage-hint">
                        {functionLimit === null
                            ? 'Unlimited functions allowed within your active subscription period.'
                            : `${functionsUsed} out of ${functionLimit} functions created.`}
                    </p>
                </div>

                {/* Usage Card 2: Moi Entries */}
                <div className="sub-usage-card">
                    <div className="usage-card-header">
                        <h3>Moi / Gift Entries Usage</h3>
                        <span className="usage-count">{entriesUsed} / {entryLimit}</span>
                    </div>

                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${entryPercent}%`, background: entryPercent > 90 ? '#EF4444' : '#D4A845' }}
                        />
                    </div>
                    <p className="usage-hint">
                        {`${entriesUsed} out of ${entryLimit} total Moi & Gift entries recorded.`}
                    </p>
                </div>
            </div>

            {/* Dates & Account Specs */}
            <div className="sub-info-panel">
                <h3>Subscription Info</h3>
                <div className="info-rows">
                    <div className="info-row">
                        <Calendar size={18} color="#E9B856" />
                        <div>
                            <span className="info-label">Started On</span>
                            <span className="info-val">
                                {subscription ? new Date(subscription.start_date).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="info-row">
                        <Clock size={18} color="#E9B856" />
                        <div>
                            <span className="info-label">Expires On</span>
                            <span className="info-val">
                                {subscription ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="info-row">
                        <ShieldCheck size={18} color="#E9B856" />
                        <div>
                            <span className="info-label">Billing Cycle</span>
                            <span className="info-val">{plan ? plan.billing_period : 'Free Trial'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
