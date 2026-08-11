import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import paymentService from '../../services/paymentService';
import './SubscriptionSuccessPage.css';

const SubscriptionSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const plan = location.state?.plan;
    const subscription = location.state?.subscription;

    useEffect(() => {
        paymentService.verifyPayment({
            planId: plan?.id,
            subscriptionId: subscription?.id
        });
    }, [plan, subscription]);

    const planName = plan ? plan.name : 'Standard Plan';
    const amount = plan ? plan.price : 999;
    const startDate = subscription ? new Date(subscription.start_date) : new Date();
    const endDate = subscription ? new Date(subscription.end_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return (
        <div className="sub-success-page">
            <div className="success-card">
                <div className="success-icon-box">
                    <CheckCircle2 size={54} color="#34D399" />
                </div>

                <div className="success-sparkle-tag">
                    <Sparkles size={14} color="#FAD675" />
                    <span>PAYMENT SUCCESSFUL</span>
                </div>

                <h1 className="success-title">Subscription Activated!</h1>
                <p className="success-subtitle">Welcome to VizhaBook {planName}</p>

                {/* Receipt Card */}
                <div className="success-receipt-box">
                    <div className="receipt-row">
                        <span className="rec-label">Plan Name</span>
                        <span className="rec-val gold">{planName}</span>
                    </div>

                    <div className="receipt-row">
                        <span className="rec-label">Amount Paid</span>
                        <span className="rec-val">₹{amount}</span>
                    </div>

                    <div className="receipt-row">
                        <span className="rec-label">Validity Period</span>
                        <span className="rec-val">{startDate.toLocaleDateString()} → {endDate.toLocaleDateString()}</span>
                    </div>

                    <div className="receipt-row">
                        <span className="rec-label">Billing Cycle</span>
                        <span className="rec-val">{plan?.billing_period || 'YEARLY'}</span>
                    </div>

                    <div className="receipt-row">
                        <span className="rec-label">Payment Status</span>
                        <span className="rec-val green">✓ Verified</span>
                    </div>
                </div>

                {/* Features Included */}
                <div className="success-features-box">
                    <h4>Plan Highlights Unlocked</h4>
                    <div className="features-chips">
                        <span className="chip">✓ Functions Unlocked</span>
                        <span className="chip">✓ Moi Entries Expanded</span>
                        <span className="chip">✓ PDF & Excel Exports</span>
                        <span className="chip">✓ QR Check-in</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="btn-success-cta"
                    onClick={() => navigate('/')}
                >
                    <span>Go to Dashboard</span>
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default SubscriptionSuccessPage;
