import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ShieldCheck, Zap, LayoutDashboard } from 'lucide-react';
import './TrialExpiredPage.css';

const TrialExpiredPage = () => {
    const navigate = useNavigate();

    return (
        <div className="trial-expired-page">
            <div className="expired-card">
                <div className="expired-icon-box">
                    <AlertOctagon size={48} color="#FCA5A5" />
                </div>

                <span className="expired-top-tag">ACTION REQUIRED</span>
                <h1 className="expired-title">Your Free Trial Has Ended</h1>

                <p className="expired-message">
                    Your 14-day free trial period has ended. Choose a subscription plan to continue using VizhaBook and managing your events, moi contributions, and reports without interruption.
                </p>

                <div className="data-safe-banner">
                    <ShieldCheck size={20} color="#6EE7B7" />
                    <div>
                        <strong>Your Data Is 100% Safe & Retained</strong>
                        <p>All your created Functions, Moi Entries, Expenses, and Reports remain stored securely in PostgreSQL. No data will ever be deleted.</p>
                    </div>
                </div>

                <div className="expired-btn-row">
                    <button
                        type="button"
                        className="btn-expired-primary"
                        onClick={() => navigate('/pricing')}
                    >
                        <Zap size={18} />
                        <span>View Subscription Plans</span>
                    </button>

                    <button
                        type="button"
                        className="btn-expired-secondary"
                        onClick={() => navigate('/')}
                    >
                        <LayoutDashboard size={18} />
                        <span>Go to Dashboard (Read-Only)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrialExpiredPage;
