import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Trophy, Medal, TrendingUp, Users, Gift, Clock, Filter, Layers, CreditCard, PieChart as PieIcon, BarChart3, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import moiService from '../services/moiService';
import paymentMethodService from '../services/paymentMethodService';
import expenseService from '../services/expenseService';

const SAPPHIRE_COLORS = ['#1E3A8A', '#059669', '#D97706', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

const Analytics = () => {
    const { entries: localEntries, expenses: localExpenses, functions, lang } = useApp();
    const isTa = lang === 'ta';
    const [selectedFunction, setSelectedFunction] = useState('all');
    const [dbEntries, setDbEntries] = useState([]);
    const [dbExpenses, setDbExpenses] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            const res = await moiService.getMoiEntries();
            if (res.success && res.entries) {
                setDbEntries(res.entries);
            }
            const expRes = await expenseService.getExpenses();
            if (expRes.success && expRes.expenses) {
                setDbExpenses(expRes.expenses);
            }
        };
        fetchAnalyticsData();
    }, []);

    // Load payment methods when selectedFunction changes
    useEffect(() => {
        if (selectedFunction && selectedFunction !== 'all') {
            paymentMethodService.getPaymentMethodsByFunction(selectedFunction).then(res => {
                if (res.success && res.paymentMethods) setPaymentMethods(res.paymentMethods);
            }).catch(() => {});
        }
    }, [selectedFunction]);

    const allEntries = dbEntries.length ? dbEntries : localEntries;
    const allExpenses = dbExpenses.length ? dbExpenses : localExpenses;

    // --- Strict Function Filtering ---
    const filteredEntries = useMemo(() => {
        if (selectedFunction === 'all') return allEntries;
        return allEntries.filter(e => String(e.functionId) === String(selectedFunction));
    }, [allEntries, selectedFunction]);

    const filteredExpenses = useMemo(() => {
        if (selectedFunction === 'all') return allExpenses;
        return allExpenses.filter(e => String(e.functionId) === String(selectedFunction));
    }, [allExpenses, selectedFunction]);

    // --- Data Scientist Computed Visualizations ---

    // 1. Payment Method Breakdown (Cash vs. Dynamic UPI Accounts)
    const paymentMethodData = useMemo(() => {
        const map = {};

        // Pre-fill configured payment methods for active function
        paymentMethods.forEach(pm => {
            if (pm.is_active) {
                map[pm.id] = {
                    name: pm.display_name || pm.name,
                    amount: 0,
                    count: 0
                };
            }
        });

        // Add Physical Cash default
        map['CASH_DEFAULT'] = { name: isTa ? 'நேரடி ரொக்கம்' : 'Physical Cash', amount: 0, count: 0 };

        filteredEntries.forEach(e => {
            const amt = Number(e.amount) || 0;
            if (e.paymentMethodId && map[e.paymentMethodId]) {
                map[e.paymentMethodId].amount += amt;
                map[e.paymentMethodId].count += 1;
            } else if (!e.paymentMethodId || e.paymentMode === 'Cash') {
                map['CASH_DEFAULT'].amount += amt;
                map['CASH_DEFAULT'].count += 1;
            } else {
                const key = e.paymentMethodName || e.paymentMode || 'UPI Account';
                if (!map[key]) map[key] = { name: key, amount: 0, count: 0 };
                map[key].amount += amt;
                map[key].count += 1;
            }
        });

        return Object.values(map).filter(item => item.amount > 0 || item.count > 0);
    }, [paymentMethods, filteredEntries, isTa]);

    // 2. Collection Timeline & Cumulative Velocity Area Chart
    const velocityData = useMemo(() => {
        const map = {};
        const sorted = [...filteredEntries].sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
        
        let cumulative = 0;
        sorted.forEach(e => {
            const d = new Date(e.createdAt || e.date);
            if (isNaN(d.getTime())) return;
            const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const amt = Number(e.amount) || 0;
            cumulative += amt;
            map[dateStr] = {
                date: dateStr,
                daily: (map[dateStr]?.daily || 0) + amt,
                cumulative
            };
        });

        return Object.values(map);
    }, [filteredEntries]);

    // 3. Guest Relation Distribution
    const relationData = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            const key = e.relation || 'Relative';
            map[key] = (map[key] || 0) + (Number(e.amount) || 0);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [filteredEntries]);

    // 4. Gift Type Distribution Donut Chart
    const giftTypeData = useMemo(() => {
        const map = { Cash: 0, Jewel: 0, 'Gift Item': 0 };
        filteredEntries.forEach(e => {
            const key = e.giftType || e.giftItem || 'Cash';
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([name, count]) => ({ name, count }));
    }, [filteredEntries]);

    // 5. Top Contributor Donors
    const topDonors = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            const name = e.guestName || 'Unknown';
            map[name] = (map[name] || 0) + (Number(e.amount) || 0);
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, total], i) => ({ name, total, rank: i + 1 }));
    }, [filteredEntries]);

    const totalAmount = filteredEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netBalance = totalAmount - totalExpenses;
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    const noDataMsg = (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600 }}>
            📊 {isTa ? 'இந்த பிரிவில் தரவு இல்லை.' : 'No entries available for this view.'}
        </div>
    );

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
            {/* Header & Function Filter */}
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{
                        fontSize: '2.5rem', fontWeight: 900, fontFamily: "'Playfair Display', serif",
                        color: '#0F172A',
                        marginBottom: '0.25rem'
                    }}>
                        {isTa ? '📊 மொய் பகுப்பாய்வு மையம்' : '📊 Data Insights & Analytics'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {isTa ? 'நேரடி ரொக்கம் மற்றும் UPI கட்டண முறைகளின் முழுமையான பகுப்பாய்வு' : 'Data scientist level collection insights and dynamic payment method analytics'}
                    </p>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '1rem', border: '1px solid #E2E8F0',
                    background: '#FFFFFF', boxShadow: '0 4px 12px rgba(15,23,42,0.03)'
                }}>
                    <Filter size={18} color="#D97706" />
                    <select
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                        style={{
                            background: 'none', border: 'none', color: '#0F172A',
                            fontWeight: 800, fontSize: '0.95rem', outline: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="all">{isTa ? 'அனைத்து விசேஷங்களும்' : 'All Functions'}</option>
                        {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
            </div>

            {/* KPI Executive Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #1E3A8A', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isTa ? 'மொத்த மொய் வசூல்' : 'Total Moi Received'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>{filteredEntries.length} {isTa ? 'பதிவுகள்' : 'gifts'}</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #EF4444', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isTa ? 'மொத்த செலவு' : 'Total Expenses'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#DC2626', marginTop: '6px' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>{filteredExpenses.length} {isTa ? 'செலவுப் பதிவுகள்' : 'expense records'}</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #10B981', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isTa ? 'மீதி இருப்பு' : 'Net Balance'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>₹{netBalance.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px', fontWeight: 700 }}>Surplus Balance</div>
                </div>
            </div>

            {/* VISUALIZATION GRID 1: PAYMENT METHOD BREAKDOWN BAR CHART & CUMULATIVE VELOCITY */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

                {/* 📊 CHART 1: PAYMENT METHOD BREAKDOWN (CASH vs INDIVIDUAL UPIs) */}
                <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <CreditCard size={20} color="#D97706" />
                            {isTa ? 'கட்டண கணக்குகள் ஒப்பீடு (Collection Breakdown)' : 'Payment Account Collection'}
                        </h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: '100px' }}>
                            Per-UPI / Cash
                        </span>
                    </div>

                    {paymentMethodData.length === 0 ? noDataMsg : (
                        <div style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentMethodData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} fontWeight={600} />
                                    <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Collection']} />
                                    <Bar dataKey="amount" radius={[10, 10, 0, 0]} barSize={40}>
                                        {paymentMethodData.map((_, i) => (
                                            <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* 📈 CHART 2: COLLECTION CUMULATIVE VELOCITY AREA CHART */}
                <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <Activity size={20} color="#3B82F6" />
                            {isTa ? 'வசூல் வேக வரைபடம் (Cumulative Growth)' : 'Cumulative Collection Velocity'}
                        </h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: '100px' }}>
                            Timeline Trend
                        </span>
                    </div>

                    {velocityData.length === 0 ? noDataMsg : (
                        <div style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={velocityData}>
                                    <defs>
                                        <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} fontWeight={600} />
                                    <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Total Collection']} />
                                    <Area type="monotone" dataKey="cumulative" stroke="#1E3A8A" strokeWidth={3} fillOpacity={1} fill="url(#velocityGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* VISUALIZATION GRID 2: RELATION DEMOGRAPHICS & GIFT TYPES DONUT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

                {/* 🏛 CHART 3: GUEST RELATION DEMOGRAPHICS STACKED BAR CHART */}
                <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={20} color="#10B981" />
                        {isTa ? 'உறவு முறை வசூல் பங்களிப்பு (Relation Share)' : 'Relationship Collection Share'}
                    </h3>
                    {relationData.length === 0 ? noDataMsg : (
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={relationData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                                    <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} fontWeight={700} width={80} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Contribution']} />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                        {relationData.map((_, i) => (
                                            <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* 🍩 CHART 4: GIFT TYPE DISTRIBUTION DONUT CHART */}
                <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieIcon size={20} color="#8B5CF6" />
                        {isTa ? 'பரிசு வகை பகுப்பாய்வு (Gifts Split)' : 'Gift Type Breakdown'}
                    </h3>
                    {giftTypeData.length === 0 ? noDataMsg : (
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={giftTypeData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={5}>
                                        {giftTypeData.map((_, i) => <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(val) => [`${val} entries`, 'Count']} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* TOP CONTRIBUTOR LEADERBOARD MATRIX */}
            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={22} color="#D97706" />
                    {isTa ? 'உயர்ந்த மொய் வழங்கி விருந்தினர்கள்' : 'Top Gift Contributors Leaderboard'}
                </h3>
                {topDonors.length === 0 ? noDataMsg : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {topDonors.map((d, i) => (
                            <div key={d.name} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}>
                                <div style={{ fontSize: '1.75rem' }}>{medals[i]}</div>
                                <div style={{ fontWeight: 800, color: '#0F172A', margin: '6px 0 2px', fontSize: '1.05rem' }}>{d.name}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>₹{d.total.toLocaleString('en-IN')}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
