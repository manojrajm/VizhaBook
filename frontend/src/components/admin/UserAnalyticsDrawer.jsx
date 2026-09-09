import React, { useState, useEffect, useRef } from 'react';
import { 
    X, User, Mail, Phone, Calendar, Shield, CreditCard, Ban, CheckCircle, 
    BarChart3, CalendarDays, Receipt, AlertCircle, Loader2, IndianRupee, Layers, FileSpreadsheet
} from 'lucide-react';
import { gsap } from 'gsap';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { adminService } from '../../services/adminService';
import './UserAnalyticsDrawer.css';

const UserAnalyticsDrawer = ({ userId, onClose, onOpenManageSub, onStatusChange }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'payments'
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const overlayRef = useRef(null);
    const drawerRef = useRef(null);

    useEffect(() => {
        // Entrance animation
        if (overlayRef.current && drawerRef.current) {
            gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
            gsap.fromTo(drawerRef.current, { x: '100%' }, { x: '0%', duration: 0.35, ease: 'power3.out' });
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminService.getUserAnalytics(userId);
            setAnalytics(data);
        } catch (err) {
            setError(err.message || 'Failed to load user analytics data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchAnalytics();
        }
    }, [userId]);

    const handleClose = () => {
        if (overlayRef.current && drawerRef.current) {
            gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' });
            gsap.to(drawerRef.current, { 
                x: '100%', 
                duration: 0.25, 
                ease: 'power3.in', 
                onComplete: onClose 
            });
        } else {
            onClose();
        }
    };

    const handleToggleAccountStatus = async () => {
        if (!analytics?.user) return;
        const currentStatus = analytics.user.accountStatus || 'ACTIVE';
        const targetStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        const confirmMsg = targetStatus === 'SUSPENDED'
            ? `Are you sure you want to SUSPEND ${analytics.user.name}'s account? The user will be restricted from accessing their host portal.`
            : `Are you sure you want to REACTIVATE ${analytics.user.name}'s account?`;

        if (!window.confirm(confirmMsg)) return;

        setUpdatingStatus(true);
        try {
            await adminService.toggleUserStatus(userId, targetStatus);
            setAnalytics(prev => prev ? {
                ...prev,
                user: { ...prev.user, accountStatus: targetStatus }
            } : null);
            if (onStatusChange) onStatusChange();
        } catch (err) {
            alert(err.message || 'Failed to update account status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getUsagePercent = (used, limit) => {
        if (!limit || limit === 0) return 0;
        const pct = Math.round((used / limit) * 100);
        return Math.min(pct, 100);
    };

    return (
        <div className="analytics-drawer-overlay" ref={overlayRef} onClick={handleClose}>
            <div className="analytics-drawer" ref={drawerRef} onClick={(e) => e.stopPropagation()}>
                {/* DRAWER HEADER */}
                <header className="drawer-header">
                    <div className="drawer-title-box">
                        <div className="user-avatar-lg">
                            {analytics?.user?.name ? analytics.user.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div className="drawer-user-headline">
                                <h2>{analytics?.user?.name || 'User Profile'}</h2>
                                <span className={`account-status-pill ${(analytics?.user?.accountStatus || 'ACTIVE').toLowerCase()}`}>
                                    {analytics?.user?.accountStatus || 'ACTIVE'}
                                </span>
                            </div>
                            <p className="drawer-subtext">Account ID: <code>{analytics?.user?.accountId || 'N/A'}</code> • Joined {formatDate(analytics?.user?.createdAt)}</p>
                        </div>
                    </div>

                    <button className="drawer-close-btn" onClick={handleClose} title="Close (Esc)">
                        <X size={20} />
                    </button>
                </header>

                {loading ? (
                    <div className="drawer-loading">
                        <Loader2 className="spin" size={36} />
                        <p>Loading analytics & function metrics...</p>
                    </div>
                ) : error ? (
                    <div className="drawer-error">
                        <AlertCircle size={24} />
                        <p>{error}</p>
                        <button onClick={fetchAnalytics} className="btn-retry">Retry</button>
                    </div>
                ) : analytics ? (
                    <div className="drawer-body">
                        {/* QUICK ACTION BAR */}
                        <div className="drawer-quick-actions">
                            <div className="user-info-chips">
                                <span className="info-chip"><Mail size={13} /> {analytics.user.email}</span>
                                <span className="info-chip"><Phone size={13} /> {analytics.user.phone ? `${analytics.user.countryCode || '+91'} ${analytics.user.phone}` : 'N/A'}</span>
                            </div>

                            <div className="action-buttons-group">
                                <button 
                                    className="btn-action primary"
                                    onClick={() => {
                                        handleClose();
                                        if (onOpenManageSub) onOpenManageSub(analytics.user);
                                    }}
                                >
                                    <CreditCard size={14} />
                                    <span>Manage Subscription</span>
                                </button>

                                <button 
                                    className={`btn-action ${analytics.user.accountStatus === 'SUSPENDED' ? 'success' : 'danger'}`}
                                    onClick={handleToggleAccountStatus}
                                    disabled={updatingStatus}
                                >
                                    {updatingStatus ? (
                                        <Loader2 className="spin" size={14} />
                                    ) : analytics.user.accountStatus === 'SUSPENDED' ? (
                                        <>
                                            <CheckCircle size={14} />
                                            <span>Reactivate Account</span>
                                        </>
                                    ) : (
                                        <>
                                            <Ban size={14} />
                                            <span>Suspend Account</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* NAV TABS */}
                        <nav className="drawer-tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <BarChart3 size={15} />
                                <span>Overview & SaaS Usage</span>
                            </button>

                            <button 
                                className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                                onClick={() => setActiveTab('events')}
                            >
                                <CalendarDays size={15} />
                                <span>Functions & Events ({analytics.functions?.length || 0})</span>
                            </button>

                            <button 
                                className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('payments')}
                            >
                                <Receipt size={15} />
                                <span>Payment History ({analytics.payments?.length || 0})</span>
                            </button>
                        </nav>

                        {/* TAB CONTENTS */}
                        <div className="tab-content">
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="overview-tab-container">
                                    {/* SUBSCRIPTION SUMMARY CARD */}
                                    <div className="sub-summary-card">
                                        <div className="sub-card-header">
                                            <div>
                                                <span className="sub-plan-label">ACTIVE PLAN</span>
                                                <h3>{analytics.subscription.planName}</h3>
                                            </div>
                                            <span className={`sub-status-tag ${(analytics.subscription.status || 'TRIAL').toLowerCase()}`}>
                                                {analytics.subscription.status}
                                            </span>
                                        </div>
                                        <div className="sub-card-meta">
                                            <span>Plan Cost: <strong>₹{analytics.subscription.planPrice}</strong></span>
                                            <span>Renews / Expires: <strong>{formatDate(analytics.subscription.endDate)}</strong></span>
                                        </div>
                                    </div>

                                    {/* HOST USAGE PROGRESS GAUGES */}
                                    <div className="usage-gauges-grid">
                                        <div className="gauge-card">
                                            <div className="gauge-header">
                                                <span className="gauge-title"><Layers size={14} /> Functions Created</span>
                                                <span className="gauge-count">{analytics.usage.functionsUsed} / {analytics.usage.functionLimit || '∞'}</span>
                                            </div>
                                            {analytics.usage.functionLimit ? (
                                                <div className="progress-bar-bg">
                                                    <div 
                                                        className="progress-bar-fill indigo" 
                                                        style={{ width: `${getUsagePercent(analytics.usage.functionsUsed, analytics.usage.functionLimit)}%` }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="unlimited-badge">Unlimited Access</p>
                                            )}
                                        </div>

                                        <div className="gauge-card">
                                            <div className="gauge-header">
                                                <span className="gauge-title"><FileSpreadsheet size={14} /> Moi Entries Logged</span>
                                                <span className="gauge-count">{analytics.usage.entriesUsed} / {analytics.usage.entryLimit ? analytics.usage.entryLimit.toLocaleString() : '∞'}</span>
                                            </div>
                                            {analytics.usage.entryLimit ? (
                                                <div className="progress-bar-bg">
                                                    <div 
                                                        className="progress-bar-fill emerald" 
                                                        style={{ width: `${getUsagePercent(analytics.usage.entriesUsed, analytics.usage.entryLimit)}%` }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="unlimited-badge">Unlimited Access</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* FINANCIAL METRICS SUMMARY CARDS */}
                                    <div className="financial-summary-grid">
                                        <div className="fin-metric-card success">
                                            <span className="fin-label">Total Moi Collected</span>
                                            <h3 className="fin-value">{formatCurrency(analytics.usage.totalMoiAmount)}</h3>
                                            <span className="fin-subtext">Across {analytics.functions?.length || 0} event(s)</span>
                                        </div>

                                        <div className="fin-metric-card danger">
                                            <span className="fin-label">Total Event Expenses</span>
                                            <h3 className="fin-value">{formatCurrency(analytics.usage.totalExpenseAmount)}</h3>
                                            <span className="fin-subtext">Venue & catering costs</span>
                                        </div>

                                        <div className="fin-metric-card primary">
                                            <span className="fin-label">Net Host Balance</span>
                                            <h3 className="fin-value">{formatCurrency(analytics.usage.netVolume)}</h3>
                                            <span className="fin-subtext">Collections minus Expenses</span>
                                        </div>
                                    </div>

                                    {/* RECHARTS COMPARISON CHART */}
                                    {analytics.functions && analytics.functions.length > 0 && (
                                        <div className="chart-section-card">
                                            <h4>Event Financial Comparison (Moi vs Expenses)</h4>
                                            <div style={{ width: '100%', height: 260, marginTop: 12 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={analytics.functions.map(f => ({ name: f.name.length > 15 ? f.name.slice(0, 15) + '...' : f.name, Moi: f.moiTotal, Expenses: f.expenseTotal }))}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                        <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                                                        <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                                        <Tooltip 
                                                            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                                                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: 8, color: '#FFF' }}
                                                        />
                                                        <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                                                        <Bar dataKey="Moi" name="Moi Collected (₹)" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="Expenses" name="Expenses Spent (₹)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EVENTS TAB */}
                            {activeTab === 'events' && (
                                <div className="events-tab-container">
                                    {analytics.functions?.length === 0 ? (
                                        <div className="drawer-empty-state">
                                            <CalendarDays size={36} />
                                            <p>No functions or events created by this host yet.</p>
                                        </div>
                                    ) : (
                                        <div className="events-list">
                                            {analytics.functions.map((fn) => (
                                                <div className="event-item-card" key={fn.id}>
                                                    <div className="event-item-header">
                                                        <div>
                                                            <h4>{fn.name}</h4>
                                                            <p className="event-location-text">{fn.location || 'Location Not Specified'} • Date: {formatDate(fn.eventDate)}</p>
                                                        </div>
                                                        <span className="event-entries-badge">{fn.moiCount} Moi Gift Entries</span>
                                                    </div>

                                                    <div className="event-item-stats">
                                                        <div className="stat-box">
                                                            <span className="stat-lbl">Moi Collected</span>
                                                            <span className="stat-val success">{formatCurrency(fn.moiTotal)}</span>
                                                        </div>
                                                        <div className="stat-box">
                                                            <span className="stat-lbl">Expenses</span>
                                                            <span className="stat-val danger">{formatCurrency(fn.expenseTotal)}</span>
                                                        </div>
                                                        <div className="stat-box">
                                                            <span className="stat-lbl">Net Surplus</span>
                                                            <span className="stat-val primary">{formatCurrency(fn.netBalance)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PAYMENTS TAB */}
                            {activeTab === 'payments' && (
                                <div className="payments-tab-container">
                                    {analytics.payments?.length === 0 ? (
                                        <div className="drawer-empty-state">
                                            <Receipt size={36} />
                                            <p>No payment records found for this account.</p>
                                        </div>
                                    ) : (
                                        <table className="drawer-table">
                                            <thead>
                                                <tr>
                                                    <th>PAYMENT DATE</th>
                                                    <th>TRANSACTION ID</th>
                                                    <th>AMOUNT</th>
                                                    <th>STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics.payments.map((p) => (
                                                    <tr key={p.id}>
                                                        <td>{formatDate(p.paymentDate)}</td>
                                                        <td><code>{p.id}</code></td>
                                                        <td className="font-semibold">{formatCurrency(p.amount)}</td>
                                                        <td>
                                                            <span className={`status-pill ${(p.status || 'SUCCESS').toLowerCase()}`}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default UserAnalyticsDrawer;
