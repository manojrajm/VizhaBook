import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import useSubscription from '../../hooks/useSubscription';
import paymentService from '../../services/paymentService';
import './SubscriptionSettingsPage.css';

const SubscriptionSettingsPage = () => {
    const navigate = useNavigate();
    const {
        loading,
        subscription,
        plan,
        status,
        isTrial,
        isExpired,
        functionsUsed,
        functionLimit,
        entriesUsed,
        entryLimit,
        refetch
    } = useSubscription();

    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [msg, setMsg] = useState('');

    const handleConfirmCancel = async () => {
        setCancelling(true);
        const res = await paymentService.cancelSubscription();
        setCancelling(false);
        setShowCancelModal(false);
        if (res.success) {
            setMsg('Subscription cancelled successfully.');
            refetch();
        } else {
            alert(res.error || 'Failed to cancel subscription.');
        }
    };

    if (loading) {
        return (
            <div className="sub-loading-container">
                <RefreshCw className="spin-icon" size={32} color="#D4A845" />
                <p>Loading subscription settings...</p>
            </div>
        );
    }

    const planName = plan ? plan.name : isTrial ? 'Free Trial' : 'Trial Expired';

    return (
        <div className="sub-settings-page">
            <div className="sub-settings-card">
                <div className="settings-header">
                    <h2>Subscription Settings</h2>
                    <p>Manage your billing plan, limits, and subscription lifecycle</p>
                </div>

                {msg && (
                    <div className="settings-alert-box">
                        <CheckCircle size={16} color="#6EE7B7" />
                        <span>{msg}</span>
                    </div>
                )}

                <div className="settings-grid">
                    <div className="settings-item">
                        <span className="set-label">Current Plan</span>
                        <span className="set-val gold">{planName}</span>
                    </div>

                    <div className="settings-item">
                        <span className="set-label">Status</span>
                        <span className={`set-status-pill ${status.toLowerCase()}`}>{status}</span>
                    </div>

                    <div className="settings-item">
                        <span className="set-label">Start Date</span>
                        <span className="set-val">
                            {subscription ? new Date(subscription.start_date).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>

                    <div className="settings-item">
                        <span className="set-label">End / Expiry Date</span>
                        <span className="set-val">
                            {subscription ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>

                    <div className="settings-item">
                        <span className="set-label">Billing Cycle</span>
                        <span className="set-val">{plan ? plan.billing_period : 'N/A'}</span>
                    </div>

                    <div className="settings-item">
                        <span className="set-label">Usage Summary</span>
                        <span className="set-val">
                            {functionsUsed} / {functionLimit === null ? '∞' : functionLimit} Functions, {entriesUsed} / {entryLimit} Entries
                        </span>
                    </div>
                </div>

                {/* Actions Row */}
                <div className="settings-actions-row">
                    <button
                        type="button"
                        className="btn-settings-primary"
                        onClick={() => navigate('/pricing')}
                    >
                        <Zap size={16} />
                        <span>{isTrial || isExpired ? 'Upgrade Plan' : 'Change Plan'}</span>
                    </button>

                    {status === 'ACTIVE' && (
                        <button
                            type="button"
                            className="btn-settings-danger"
                            onClick={() => setShowCancelModal(true)}
                        >
                            <XCircle size={16} />
                            <span>Cancel Subscription</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="sub-modal-overlay">
                    <div className="sub-modal-box">
                        <div className="modal-icon-alert">
                            <AlertTriangle size={36} color="#FBBF24" />
                        </div>
                        <h3>Cancel Subscription?</h3>
                        <p>
                            Are you sure you want to cancel your subscription? Your data (Functions, Moi Entries, Expenses) will remain stored safely, but your access will be limited upon expiration.
                        </p>

                        <div className="modal-btn-row">
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => setShowCancelModal(false)}
                            >
                                Keep Subscription
                            </button>
                            <button
                                type="button"
                                className="btn-modal-confirm"
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? 'Cancelling...' : 'Yes, Cancel Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionSettingsPage;
