import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Trophy, Medal, TrendingUp, Users, Gift, Clock, Filter, Layers, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import moiService from '../services/moiService';

const SAPPHIRE_COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

const Analytics = () => {
    const { entries: localEntries, expenses, functions, lang } = useApp();
    const isTa = lang === 'ta';
    const [selectedFunction, setSelectedFunction] = useState('all');
    const [dbEntries, setDbEntries] = useState([]);

    useEffect(() => {
        const fetchEntries = async () => {
            const res = await moiService.getMoiEntries();
            if (res.success && res.entries) {
                setDbEntries(res.entries);
            }
        };
        fetchEntries();
    }, []);

    const allEntries = dbEntries.length ? dbEntries : localEntries;

    // --- Filtering Logic ---
    const filteredEntries = useMemo(() => {
        if (selectedFunction === 'all') return allEntries;
        return allEntries.filter(e => String(e.functionId) === String(selectedFunction));
    }, [allEntries, selectedFunction]);

    const filteredExpenses = useMemo(() => {
        if (selectedFunction === 'all') return expenses;
        return expenses.filter(e => String(e.functionId) === String(selectedFunction));
    }, [expenses, selectedFunction]);

    // --- Computed Analytics ---
    const relationData = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => { map[e.relation || 'Other'] = (map[e.relation || 'Other'] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [filteredEntries]);

    const giftTypeData = useMemo(() => {
        const map = { Cash: 0, Jewel: 0, 'Gift Item': 0 };
        filteredEntries.forEach(e => {
            const key = e.giftType || e.giftItem || 'Cash';
            if (key in map) map[key]++;
        });
        return Object.entries(map).map(([name, count]) => ({ name, count }));
    }, [filteredEntries]);

    const paymentMethodData = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            const key = e.paymentMethodName || e.paymentMode || 'Cash';
            map[key] = (map[key] || 0) + (Number(e.amount) || 0);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [filteredEntries]);

    const monthlyData = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            const d = new Date(e.createdAt || e.date);
            if (isNaN(d.getTime())) return;
            const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            map[key] = (map[key] || 0) + (Number(e.amount) || 0);
        });
        return Object.entries(map).map(([month, total]) => ({ month, total }));
    }, [filteredEntries]);

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
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            📊 {isTa ? 'இந்த பிரிவில் தரவு இல்லை.' : 'No data for this filter.'}
        </div>
    );

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header & Filter */}
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{
                        fontSize: '2.5rem', fontWeight: 900, fontFamily: "'Playfair Display', serif",
                        color: '#0F172A',
                        marginBottom: '0.25rem'
                    }}>
                        {isTa ? '📊 மொய் பகுப்பாய்வு' : '📊 Analytics & Insights'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {isTa ? 'உங்கள் மொய் தரவுகள் மற்றும் செலுத்தல் முறைகளின் பகுப்பாய்வு' : 'Advanced insights into your gifts and payment collections'}
                    </p>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '1rem', border: '1px solid #E2E8F0',
                    background: '#FFFFFF'
                }}>
                    <Filter size={18} color="#D97706" />
                    <select
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                        style={{
                            background: 'none', border: 'none', color: '#0F172A',
                            fontWeight: 700, fontSize: '0.95rem', outline: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="all">{isTa ? 'அனைத்து விசேஷங்களும்' : 'All Functions'}</option>
                        {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #1E3A8A' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'மொத்த மொய் வசூல்' : 'Total Moi Received'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>{filteredEntries.length} {isTa ? 'பதிவுகள்' : 'gifts'}</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #EF4444' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'மொத்த செலவு' : 'Total Expenses'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#DC2626', marginTop: '6px' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #10B981' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'மீதி இருப்பு' : 'Net Balance'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>₹{netBalance.toLocaleString('en-IN')}</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>

                {/* PAYMENT METHOD DISTRIBUTION CHART */}
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} color="#D97706" />
                        {isTa ? 'கட்டண முறைகள் ஒப்பீடு (Payment Methods)' : 'Payment Method Collection'}
                    </h3>
                    {paymentMethodData.length === 0 ? noDataMsg : (
                        <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentMethodData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                                    <YAxis stroke="#64748B" fontSize={12} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                                    <Bar dataKey="value" fill="#1E3A8A" radius={[8, 8, 0, 0]}>
                                        {paymentMethodData.map((_, i) => (
                                            <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* GUEST RELATION PIE CHART */}
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} color="#3B82F6" />
                        {isTa ? 'உறவு முறை பகிர்வு' : 'Relation Distribution'}
                    </h3>
                    {relationData.length === 0 ? noDataMsg : (
                        <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={relationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={4}>
                                        {relationData.map((_, i) => <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

            </div>

            {/* Top Donors Ranking */}
            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={20} color="#D97706" />
                    {isTa ? 'உயர்ந்த மொய் வழங்கி விருந்தினர்கள்' : 'Top Gift Contributors'}
                </h3>
                {topDonors.length === 0 ? noDataMsg : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        {topDonors.map((d, i) => (
                            <div key={d.name} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem' }}>{medals[i]}</div>
                                <div style={{ fontWeight: 800, color: '#0F172A', margin: '4px 0 2px' }}>{d.name}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>₹{d.total.toLocaleString('en-IN')}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
