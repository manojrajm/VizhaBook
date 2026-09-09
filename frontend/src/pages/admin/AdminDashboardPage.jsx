import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, Calendar, IndianRupee, Crown, TrendingUp, RefreshCw, 
    Loader2, AlertCircle, MapPin, Gift, Clock, DollarSign, PieChart as PieIcon, BarChart2 
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, 
    XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { gsap } from 'gsap';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import './AdminDashboardPage.css';

const DONUT_COLORS = ['#2563eb', '#9333ea', '#059669', '#d97706', '#e11d48', '#64748b'];

const AdminDashboardPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState('30_DAYS');

    const kpiCardsRef = useRef([]);
    const chartsRef = useRef(null);

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

    // GSAP Card Stagger Animation
    useEffect(() => {
        if (data && kpiCardsRef.current.length > 0) {
            gsap.fromTo(
                kpiCardsRef.current.filter(Boolean),
                { y: 25, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
            );

            if (chartsRef.current) {
                gsap.fromTo(
                    chartsRef.current,
                    { y: 35, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.55, delay: 0.3, ease: 'power3.out' }
                );
            }
        }
    }, [data]);

    const formatINR = (val) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Just now';
        const diffMs = new Date().getTime() - new Date(dateStr).getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            
            <main className="admin-main-content">
                <header className="admin-page-header">
                    <div>
                        <div className="admin-subtitle-badge">
                            <BarChart2 size={14} /> PRO DATA ANALYTICS SUITE
                        </div>
                        <h1 className="admin-page-title">Executive SaaS Dashboard</h1>
                        <p className="admin-page-description">Real-time platform performance, regional Moi hubs & subscription analytics</p>
                    </div>

                    <div className="admin-header-actions">
                        <select 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value)} 
                            className="admin-range-select"
                        >
                            <option value="7_DAYS">Last 7 Days</option>
                            <option value="30_DAYS">Last 30 Days</option>
                            <option value="THIS_YEAR">This Year (2026)</option>
                            <option value="ALL">All Time</option>
                        </select>

                        <button 
                            className="admin-refresh-btn" 
                            onClick={fetchDashboardData}
                            disabled={loading}
                            title="Refresh metrics"
                        >
                            <RefreshCw size={16} className={loading ? 'spin' : ''} />
                            <span>Refresh Data</span>
                        </button>
                    </div>
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
                        <p>Aggregating platform analytics & transaction metrics...</p>
                    </div>
                ) : data ? (
                    <>
                        {/* 6 EXECUTIVE KPI METRIC CARDS */}
                        <div className="admin-kpi-grid-6">
                            {/* KPI 1: TOTAL USERS */}
                            <div className="admin-kpi-card" ref={(el) => (kpiCardsRef.current[0] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">TOTAL REGISTERED HOSTS</span>
                                    <div className="kpi-icon-box blue">
                                        <Users size={18} />
                                    </div>
                                </div>
                                <div className="kpi-value">{formatINR(data.totalUsers)}</div>
                                <div className="kpi-meta positive">
                                    <TrendingUp size={14} />
                                    <span>+{data.usersThisMonth || 0} hosts this month</span>
                                </div>
                            </div>

                            {/* KPI 2: TOTAL FUNCTIONS */}
                            <div className="admin-kpi-card" ref={(el) => (kpiCardsRef.current[1] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">TOTAL FUNCTIONS CREATED</span>
                                    <div className="kpi-icon-box purple">
                                        <Calendar size={18} />
                                    </div>
                                </div>
                                <div className="kpi-value">{formatINR(data.totalFunctions)}</div>
                                <div className="kpi-meta neutral">
                                    <span>Weddings & Receptions</span>
                                </div>
                            </div>

                            {/* KPI 3: TOTAL MOI AMOUNT */}
                            <div className="admin-kpi-card" ref={(el) => (kpiCardsRef.current[2] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">TOTAL MOI PROCESSED</span>
                                    <div className="kpi-icon-box emerald">
                                        <IndianRupee size={18} />
                                    </div>
                                </div>
                                <div className="kpi-value emerald">₹ {formatINR(data.totalMoiAmount)}</div>
                                <div className="kpi-meta neutral">
                                    <span>Processed via VizhaBook</span>
                                </div>
                            </div>

                            {/* KPI 4: MONTHLY REVENUE */}
                            <div className="admin-kpi-card" ref={(el) => (kpiCardsRef.current[3] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">SUBSCRIPTION REVENUE (MRR)</span>
                                    <div className="kpi-icon-box cyan">
                                        <DollarSign size={18} />
                                    </div>
                                </div>
                                <div className="kpi-value cyan">₹ {formatINR(data.monthlyRevenue)}</div>
                                <div className="kpi-meta positive">
                                    <TrendingUp size={14} />
                                    <span>Active MRR Volume</span>
                                </div>
                            </div>

                            {/* KPI 5: AVG MOI PER EVENT */}
                            <div className="admin-kpi-card" ref={(el) => (kpiCardsRef.current[4] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">AVG MOI PER EVENT</span>
                                    <div className="kpi-icon-box teal">
                                        <Gift size={18} />
                                    </div>
                                </div>
                                <div className="kpi-value teal">₹ {formatINR(data.avgMoiPerEvent)}</div>
                                <div className="kpi-meta neutral">
                                    <span>Average Collection</span>
                                </div>
                            </div>

                            {/* KPI 6: MOST POPULAR PLAN */}
                            <div className="admin-kpi-card highlight" ref={(el) => (kpiCardsRef.current[5] = el)}>
                                <div className="kpi-card-header">
                                    <span className="kpi-label">MOST POPULAR PLAN</span>
                                    <div className="kpi-icon-box amber">
                                        <Crown size={18} />
                                    </div>
                                </div>
                                <div className="kpi-value amber">{data.mostPopularPlan || 'Free Plan'}</div>
                                <div className="kpi-meta amber-text">
                                    <span>{formatINR(data.mostPopularPlanCount || 0)} Active Subscriptions</span>
                                </div>
                            </div>
                        </div>

                        {/* ROW 1: CHARTS (MONTHLY TRENDS & EVENT BREAKDOWN) */}
                        <div className="admin-charts-row" ref={chartsRef}>
                            {/* CHART 1: MONTHLY MOI & REVENUE TRENDS (AREA CHART) */}
                            <div className="admin-chart-card flex-2">
                                <div className="chart-card-header">
                                    <div>
                                        <h3>Monthly Collection & Revenue Trends</h3>
                                        <p>Moi volume processed vs Subscription revenue over time</p>
                                    </div>
                                    <div className="chart-legend-pills">
                                        <span className="pill-dot blue"></span> Moi Volume (₹)
                                        <span className="pill-dot emerald"></span> Subscription MRR (₹)
                                    </div>
                                </div>

                                <div className="recharts-wrapper">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={data.monthlyTrends || []} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="moiGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                                </linearGradient>
                                                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                                            <Tooltip 
                                                formatter={(value) => [`₹ ${formatINR(value)}`, '']}
                                                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="moiAmount" name="Moi Amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#moiGradient)" />
                                            <Area type="monotone" dataKey="revenueAmount" name="Subscription Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#revGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* CHART 2: EVENT TYPE BREAKDOWN (DONUT CHART) */}
                            <div className="admin-chart-card flex-1">
                                <div className="chart-card-header">
                                    <div>
                                        <h3>Event Category Breakdown</h3>
                                        <p>Distribution by function type</p>
                                    </div>
                                    <PieIcon size={18} className="text-muted" />
                                </div>

                                <div className="donut-chart-wrapper">
                                    <ResponsiveContainer width="100%" height={210}>
                                        <PieChart>
                                            <Pie
                                                data={data.eventTypeDistribution || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="count"
                                                nameKey="category"
                                            >
                                                {(data.eventTypeDistribution || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(val, name) => [`${val} Functions`, name]}
                                                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="donut-legend-grid">
                                    {(data.eventTypeDistribution || []).map((item, idx) => (
                                        <div key={idx} className="donut-legend-item">
                                            <span className="legend-dot" style={{ background: DONUT_COLORS[idx % DONUT_COLORS.length] }}></span>
                                            <span className="legend-label">{item.category}</span>
                                            <span className="legend-val">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: RECENT TRANSACTIONS STREAM & TOP DISTRICTS */}
                        <div className="admin-bottom-row">
                            {/* RECENT REAL-TIME MOI TRANSACTIONS */}
                            <div className="admin-section-card flex-2">
                                <div className="section-card-header flex-between">
                                    <div>
                                        <h3>Real-Time Moi Activity Stream</h3>
                                        <p>Live Moi entries logged across Tamil Nadu celebrations</p>
                                    </div>
                                    <span className="live-pulse-badge">
                                        <span className="pulse-dot"></span> LIVE STREAM
                                    </span>
                                </div>

                                <div className="table-responsive">
                                    <table className="admin-mini-table">
                                        <thead>
                                            <tr>
                                                <th>GUEST NAME</th>
                                                <th>EVENT / FUNCTION</th>
                                                <th>CITY / DISTRICT</th>
                                                <th>AMOUNT</th>
                                                <th>TIME</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(data.recentTransactions || []).map((tx) => (
                                                <tr key={tx.id}>
                                                    <td className="font-semibold text-dark">{tx.guestName}</td>
                                                    <td className="text-secondary">{tx.functionName}</td>
                                                    <td>
                                                        <span className="city-chip">
                                                            <MapPin size={12} /> {tx.city}
                                                        </span>
                                                    </td>
                                                    <td className="font-semibold text-emerald">₹ {formatINR(tx.amount)}</td>
                                                    <td className="text-muted">
                                                        <Clock size={12} /> {formatTimeAgo(tx.createdAt)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* TOP REGIONAL / DISTRICT HUBS */}
                            <div className="admin-section-card flex-1">
                                <div className="section-card-header">
                                    <h3>Top Regional Moi Hubs</h3>
                                    <p>Highest collecting cities in Tamil Nadu</p>
                                </div>

                                <div className="regional-hubs-list">
                                    {(data.topDistricts || []).map((district, idx) => {
                                        const maxAmount = data.topDistricts[0]?.totalAmount || 1;
                                        const pct = Math.round((district.totalAmount / maxAmount) * 100);
                                        return (
                                            <div key={idx} className="regional-hub-item">
                                                <div className="hub-info-line">
                                                    <span className="hub-city font-semibold">
                                                        #{idx + 1} {district.city}
                                                    </span>
                                                    <span className="hub-amount text-emerald font-bold">
                                                        ₹ {formatINR(district.totalAmount)}
                                                    </span>
                                                </div>
                                                <div className="hub-progress-track">
                                                    <div className="hub-progress-fill" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* SUBSCRIPTION PLAN DISTRIBUTION */}
                        <div className="admin-section-card margin-top">
                            <div className="section-card-header">
                                <h3>Subscription Plan Breakdown</h3>
                                <p>Active user distribution across VizhaBook pricing tiers</p>
                            </div>

                            <div className="distribution-grid-layout">
                                {(data.subscriptionStats || []).map((item, idx) => {
                                    const count = item.count || 0;
                                    const percentage = item.percentage || 0;
                                    return (
                                        <div key={idx} className="subscription-plan-card">
                                            <div className="plan-card-top">
                                                <span className="plan-name-label">{item.plan}</span>
                                                <span className="plan-user-count">{formatINR(count)} Users</span>
                                            </div>
                                            <div className="plan-pct-value">{percentage}%</div>
                                            <div className="progress-bar-container">
                                                <div 
                                                    className="progress-bar-fill blue"
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
