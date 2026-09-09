import React, { useState, useEffect, useRef } from 'react';
import { Users, Calendar, IndianRupee, Crown, TrendingUp, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const kpiCardsRef = useRef([]);
    const distributionRef = useRef(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminService.getDashboard();
            setData(res);
        } catch (err) {
            setError(err.message || 'Failed to load executive dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // GSAP Card Stagger Animation when data arrives
    useEffect(() => {
        if (data && kpiCardsRef.current.length > 0) {
            gsap.fromTo(
                kpiCardsRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
            );

            if (distributionRef.current) {
                gsap.fromTo(
                    distributionRef.current,
                    { y: 40, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, delay: 0.4, ease: 'power3.out' }
                );
            }
        }
    }, [data]);

    const formatINR = (val) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            
            <main className="admin-main-content">
                <header className="admin-page-header">
                    <div>
                        <h1 className="admin-page-title">Executive SaaS Dashboard</h1>
                        <p className="admin-page-description">Real-time business metrics & subscription analytics for VizhaBook</p>
                    </div>

                    <button 
                        className="admin-refresh-btn" 
                        onClick={fetchDashboardData}
                        disabled={loading}
                        title="Refresh metrics"
                    >
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                        <span>Refresh Data</span>
                    </button>
                </header>

                {error && (
                    <div className="admin-alert error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {loading && !data ? (
                    <div className="admin-loading-container">
                        <Loader2 className="spin" size={36} />
                        <p>Aggregating platform KPI statistics...</p>
                    </div>
                ) : data ? (
                    <>
                        {/* 4 PRIMARY KPI CARDS */}
                        <div className="admin-kpi-grid">
                            {/* KPI 1: TOTAL USERS */}
                            <div className="admin-kpi-card" ref={(el) => (kpiCardsRef.current[0] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">TOTAL REGISTERED USERS</span>
                                    <div className="kpi-icon-box blue">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div className="kpi-value">{formatINR(data.totalUsers)}</div>
                                <div className="kpi-meta positive">
                                    <TrendingUp size={14} />
                                    <span>+{data.usersThisMonth || 0} users added this month</span>
                                </div>
                            </div>

                            {/* KPI 2: TOTAL FUNCTIONS */}
                            <div className="admin-kpi-card" ref={(el) => (kpiCardsRef.current[1] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">TOTAL FUNCTIONS CREATED</span>
                                    <div className="kpi-icon-box purple">
                                        <Calendar size={20} />
                                    </div>
                                </div>
                                <div className="kpi-value">{formatINR(data.totalFunctions)}</div>
                                <div className="kpi-meta neutral">
                                    <span>Weddings, Engagements & Receptions</span>
                                </div>
                            </div>

                            {/* KPI 3: TOTAL MOI AMOUNT */}
                            <div className="admin-kpi-card" ref={(el) => (kpiCardsRef.current[2] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">TOTAL MOI PROCESSED</span>
                                    <div className="kpi-icon-box emerald">
                                        <IndianRupee size={20} />
                                    </div>
                                </div>
                                <div className="kpi-value emerald">₹ {formatINR(data.totalMoiAmount)}</div>
                                <div className="kpi-meta neutral">
                                    <span>Processed through VizhaBook</span>
                                </div>
                            </div>

                            {/* KPI 4: MOST POPULAR SUBSCRIPTION PLAN */}
                            <div className="admin-kpi-card highlight" ref={(el) => (kpiCardsRef.current[3] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">MOST POPULAR PLAN</span>
                                    <div className="kpi-icon-box amber">
                                        <Crown size={20} />
                                    </div>
                                </div>
                                <div className="kpi-value amber">{data.mostPopularPlan || 'Gold Plan'}</div>
                                <div className="kpi-meta amber-text">
                                    <span>{formatINR(data.mostPopularPlanCount || 0)} Active Subscribed Users</span>
                                </div>
                            </div>
                        </div>

                        {/* SUBSCRIPTION DISTRIBUTION SECTION */}
                        <div className="admin-section-card" ref={distributionRef}>
                            <div className="section-card-header">
                                <h3>Subscription Plan Distribution</h3>
                                <p>Active user breakdown across VizhaBook pricing tiers</p>
                            </div>

                            <div className="distribution-list">
                                {(data.subscriptionStats || []).map((item, idx) => {
                                    const count = item.count || 0;
                                    const percentage = item.percentage || 0;
                                    return (
                                        <div key={idx} className="distribution-row">
                                            <div className="distribution-info">
                                                <span className="plan-title">{item.plan}</span>
                                                <span className="plan-count">{formatINR(count)} Users ({percentage}%)</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div 
                                                    className={`progress-bar-fill ${item.plan.toLowerCase().includes('gold') ? 'amber' : item.plan.toLowerCase().includes('silver') ? 'slate' : item.plan.toLowerCase().includes('platinum') ? 'purple' : 'blue'}`}
                                                    style={{ width: `${Math.max(percentage, 2)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : null}
            </main>
        </div>
    );
};

export default AdminDashboardPage;
