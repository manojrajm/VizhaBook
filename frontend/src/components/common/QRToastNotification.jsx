import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, X, Clock, Phone, Heart } from 'lucide-react';
import './QRToastNotification.css';

const SingleToastItem = ({ toast, onApprove, onDismiss, duration = 5000 }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isCash = (toast.giftType || toast.gift_type) === 'Cash';
    const guestName = toast.guestName || toast.guest_name || 'Guest';
    const functionName = toast.functionName || toast.function_name;

    // Auto-dismiss countdown timer (5 seconds)
    useEffect(() => {
        if (isHovered) return; // Pause timer on hover

        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast.id, duration, isHovered, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, x: 80, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="qr-toast-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="qr-toast-accent-line" />
            
            <div className="qr-toast-header">
                <div className="qr-toast-title">
                    <span className="live-pulse-dot" />
                    <Bell size={14} className="toast-bell-icon" />
                    <span className="toast-header-text">Live QR Check-In</span>
                </div>

                <button 
                    className="qr-toast-close-btn" 
                    onClick={() => onDismiss(toast.id)}
                    title="Dismiss notification"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="qr-toast-body">
                <div className="qr-toast-guest-info">
                    <h4 className="qr-guest-name">{guestName}</h4>
                    <div className="qr-guest-meta">
                        {toast.relation && <span>❤️ {toast.relation}</span>}
                        {toast.phone && <span>📱 {toast.phone}</span>}
                        {functionName && <span className="qr-fn-badge">📍 {functionName}</span>}
                    </div>
                </div>

                <div className="qr-toast-amount-box">
                    {isCash ? (
                        <span className="qr-amount-text">₹{Number(toast.amount || 0).toLocaleString('en-IN')}</span>
                    ) : (
                        <span className="qr-gift-tag">🎁 {toast.giftType || toast.gift_type || 'Gift'}</span>
                    )}
                </div>
            </div>

            <div className="qr-toast-actions">
                <button
                    className="btn-toast-approve"
                    onClick={() => onApprove(toast)}
                >
                    <CheckCircle size={14} />
                    <span>Approve Now</span>
                </button>
            </div>

            {/* Auto-Dismiss Progress Bar */}
            <div className="qr-toast-progress-container">
                <div 
                    className={`qr-toast-progress-bar ${isHovered ? 'paused' : ''}`}
                    style={{ animationDuration: `${duration}ms` }}
                />
            </div>
        </motion.div>
    );
};

const QRToastNotification = ({ toasts = [], onApprove, onDismiss }) => {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="qr-toast-stack-container">
            <AnimatePresence mode="popLayout">
                {toasts.slice(0, 5).map((toast) => (
                    <SingleToastItem
                        key={toast.id}
                        toast={toast}
                        onApprove={onApprove}
                        onDismiss={onDismiss}
                        duration={5000}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default QRToastNotification;
