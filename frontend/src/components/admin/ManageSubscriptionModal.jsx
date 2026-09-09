import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, Sparkles, CreditCard } from 'lucide-react';
import { gsap } from 'gsap';
import { adminService } from '../../services/adminService';
import './ManageSubscriptionModal.css';

const ManageSubscriptionModal = ({ user, onClose, onSuccess }) => {
    const modalRef = useRef(null);
    const overlayRef = useRef(null);

    const [planId, setPlanId] = useState('PLAN_BASIC');
    const [duration, setDuration] = useState('1_YEAR');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [amount, setAmount] = useState(499);
    const [notes, setNotes] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Pre-fill default plan or current user plan
    useEffect(() => {
        if (user && user.subscription && user.subscription.planId) {
            setPlanId(user.subscription.planId);
        }

        // GSAP Modal Entrance Animation
        if (overlayRef.current && modalRef.current) {
            gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
            gsap.fromTo(
                modalRef.current,
                { y: 30, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }
            );
        }
    }, [user]);

    // Update amount based on plan selection defaults
    const handlePlanChange = (e) => {
        const selected = e.target.value;
        setPlanId(selected);
        if (selected === 'PLAN_BASIC') setAmount(499);
        else if (selected === 'PLAN_STANDARD' || selected === 'PLAN_PRO') setAmount(999);
        else if (selected === 'PLAN_PREMIUM') setAmount(1999);
        else if (selected === 'PLAN_ENTERPRISE') setAmount(2499);
        else setAmount(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        // Client-side Validation
        if (parseFloat(amount) < 0 || isNaN(parseFloat(amount))) {
            setError('Please enter a valid payment amount.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                planId,
                duration,
                paymentMethod,
                amount: parseFloat(amount),
                notes: notes.trim()
            };

            const response = await adminService.updateUserSubscription(user.id, payload);

            setSuccessMsg(response.message || 'Subscription successfully updated!');

            // GSAP Success Pulse
            if (modalRef.current) {
                gsap.to(modalRef.current, { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1 });
            }

            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1200);
        } catch (err) {
            setError(err.message || 'Failed to update subscription.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="admin-modal-overlay" ref={overlayRef} onClick={onClose}>
            <div 
                className="admin-modal-card" 
                ref={modalRef} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="admin-modal-header">
                    <div className="admin-modal-title-box">
                        <CreditCard className="admin-modal-icon" size={22} />
                        <div>
                            <h3>Manage Subscription</h3>
                            <p>{user.name} ({user.email})</p>
                        </div>
                    </div>
                    <button className="admin-modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="admin-modal-current-info">
                    <div className="info-chip">
                        <span className="label">Current Plan:</span>
                        <span className="value bold">{user.subscription?.planName || 'Free Plan'}</span>
                    </div>
                    <div className="info-chip">
                        <span className="label">Current Status:</span>
                        <span className={`status-badge ${user.subscription?.status?.toLowerCase()}`}>
                            {user.subscription?.status || 'TRIAL'}
                        </span>
                    </div>
                    <div className="info-chip">
                        <span className="label">Expiry Date:</span>
                        <span className="value">
                            {user.subscription?.endDate 
                                ? new Date(user.subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '14 Days Trial'}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="admin-modal-alert error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="admin-modal-alert success">
                        <CheckCircle size={18} />
                        <span>{successMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="form-row two-col">
                        <div className="form-group">
                            <label>Subscription Plan</label>
                            <select value={planId} onChange={handlePlanChange} className="admin-select">
                                <option value="PLAN_BASIC">Basic Plan (₹499/yr)</option>
                                <option value="PLAN_STANDARD">Standard Plan (₹999/yr)</option>
                                <option value="PLAN_PRO">Pro Celebration Plan (₹999/yr)</option>
                                <option value="PLAN_PREMIUM">Premium Plan (₹1999/yr)</option>
                                <option value="PLAN_ENTERPRISE">Grand Enterprise Plan (₹2499/yr)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Subscription Duration</label>
                            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="admin-select">
                                <option value="1_MONTH">1 Month</option>
                                <option value="3_MONTHS">3 Months</option>
                                <option value="6_MONTHS">6 Months</option>
                                <option value="1_YEAR">1 Year (Best Value)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row two-col">
                        <div className="form-group">
                            <label>Payment Method</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="admin-select">
                                <option value="CASH">Cash Payment (Offline at Office)</option>
                                <option value="BANK_TRANSFER">Direct Bank / UPI Transfer</option>
                                <option value="MANUAL">Manual Business Activation</option>
                                <option value="ONLINE">Online Gateway (Razorpay)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Amount Collected (₹)</label>
                            <input 
                                type="number"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="admin-input"
                                placeholder="999"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Admin Internal Notes / Justification</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="admin-textarea"
                            placeholder="e.g. Customer paid ₹999 cash at office. Activated Gold plan manually."
                            rows={3}
                        />
                    </div>

                    <div className="admin-modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="spin" size={18} />
                                    <span>Updating DB...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>Activate / Update Subscription</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManageSubscriptionModal;
