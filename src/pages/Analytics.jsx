import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Trophy, Medal, TrendingUp, Users, Gift, Clock, Filter, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SAPPHIRE_COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

const Analytics = () => {
    const { entries, expenses, functions, lang } = useApp();
    const [selectedFunction, setSelectedFunction] = useState('all');

    // --- Filtering Logic ---
    const filteredEntries = useMemo(() => {
        if (selectedFunction === 'all') return entries;
        return entries.filter(e => e.functionId === selectedFunction || parseInt(e.functionId) === parseInt(selectedFunction));
    }, [entries, selectedFunction]);

    const filteredExpenses = useMemo(() => {
        if (selectedFunction === 'all') return expenses;
        return expenses.filter(e => e.functionId === selectedFunction || e.functionId === String(selectedFunction));
    }, [expenses, selectedFunction]);

    // --- Computed Analytics ---
    const relationData = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => { map[e.relation || 'Other'] = (map[e.relation || 'Other'] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [filteredEntries]);

    const giftTypeData = useMemo(() => {
        const map = { Cash: 0, Jewel: 0, 'Gift Item': 0 };
        filteredEntries.forEach(e => { if (e.giftType in map) map[e.giftType]++; });
        return Object.entries(map).map(([name, count]) => ({ name, count }));
    }, [filteredEntries]);

    const monthlyData = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            const d = new Date(e.date);
            if (isNaN(d.getTime())) return;
            const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            map[key] = (map[key] || 0) + (e.amount || 0);
        });
        return Object.entries(map).map(([month, total]) => ({ month, total }));
    }, [filteredEntries]);

    const hourlyData = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: 0 }));
        filteredEntries.forEach(e => {
            const d = new Date(e.date);
            if (isNaN(d.getTime())) return;
            const h = d.getHours();
            hours[h].count++;
        });
        return hours.filter(h => h.count > 0);
    }, [filteredEntries]);

    const expenseCategoryData = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [filteredExpenses]);

    const topDonors = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            const name = e.guestName || 'Unknown';
            map[name] = (map[name] || 0) + (e.amount || 0);
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, total], i) => ({ name, total, rank: i + 1 }));
    }, [filteredEntries]);

    const totalAmount = filteredEntries.reduce((s, e) => s + (e.amount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netBalance = totalAmount - totalExpenses;

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const medalColors = ['#F59E0B', '#94A3B8', '#D97706', '#64748B', '#475569'];

    const noDataMsg = (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            📊 {lang === 'en' ? 'No data for this filter.' : 'இந்த பிரிவில் தரவு இல்லை.'}
        </div>
    );

    const fadeUp = (delay = 0) => ({
        initial: { opacity: 0, y: 30, rotateX: -5 },
        animate: { opacity: 1, y: 0, rotateX: 0 },
        transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    });

    const hover3D = {
        whileHover: { 
            rotateY: 5, 
            rotateX: 5, 
            scale: 1.03,
            translateZ: 20,
            transition: { type: 'spring', stiffness: 300, damping: 20 }
        }
    };

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', perspective: '1200px' }}>
            {/* Header & Filter */}
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                <motion.div {...fadeUp(0)} style={{ flex: '1 1 300px' }}>
                    <h1 className="text-glow" style={{
                        fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', fontWeight: 900, fontFamily: "'Playfair Display', serif",
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        marginBottom: '0.25rem',
                        lineHeight: 1.1
                    }}>
                        {lang === 'en' ? '📊 Analytics' : '📊 புள்ளிவிவரம்'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {lang === 'en' ? 'Advanced insights into your digital ledger' : 'உங்கள் மொய் தரவுகளின் ஆழமான பார்வை'}
                    </p>
                </motion.div>

                <motion.div {...fadeUp(0.1)} className="glass-premium float-3d" style={{ 
                    display: 'flex', alignItems: 'center', gap: '1rem', 
                    padding: '0.75rem 1.25rem', 
                    borderRadius: '1.25rem', border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <Filter size={18} color="var(--accent)" />
                    <select 
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                        style={{ 
                            background: 'none', border: 'none', color: 'var(--text-primary)', 
                            fontWeight: 700, fontSize: '1rem', outline: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="all" style={{ background: 'var(--bg-card)' }}>{lang === 'en' ? 'All Functions' : 'அனைத்து விசேஷங்களும்'}</option>
                        {functions.map(f => <option key={f.id} value={f.id} style={{ background: 'var(--bg-card)' }}>{f.name}</option>)}
                    </select>
                </motion.div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {[
                    { label: lang === 'en' ? 'Total Collected' : 'மொத்தம்', value: `₹${totalAmount.toLocaleString('en-IN')}`, icon: <TrendingUp size={24} />, color: '#10B981' },
                    { label: lang === 'en' ? 'Total Expenses' : 'செலவுகள்', value: `₹${totalExpenses.toLocaleString('en-IN')}`, icon: <Clock size={24} />, color: '#EF4444' },
                    { label: lang === 'en' ? 'Net Balance' : 'மீதி', value: `₹${netBalance.toLocaleString('en-IN')}`, icon: <Layers size={24} />, color: netBalance >= 0 ? '#6366F1' : '#EF4444' },
                    { label: lang === 'en' ? 'Total Entries' : 'மொத்த பதிவுகள்', value: filteredEntries.length, icon: <Users size={24} />, color: '#F59E0B' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        {...fadeUp(0.2 + i * 0.05)} 
                        {...hover3D}
                        className="glass-premium glow-hover"
                        style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'default' }}
                    >
                        <div style={{
                            padding: '1rem', borderRadius: '1.25rem',
                            background: `${stat.color}15`, color: stat.color,
                            boxShadow: `0 8px 16px ${stat.color}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{stat.icon}</div>
                        <div>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{stat.value}</p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {/* Trend Chart */}
                <motion.div {...fadeUp(0.4)} {...hover3D} className="glass-premium glow-hover" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>📈 {lang === 'en' ? 'Collection Trend' : 'மொய் வரவு வரைபடம்'}</h3>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }} />
                                <Area type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={4} fill="url(#areaGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : noDataMsg}
                </motion.div>

                {/* Expense Breakdown */}
                <motion.div {...fadeUp(0.5)} {...hover3D} className="glass-premium glow-hover" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>📉 {lang === 'en' ? 'Expense Distribution' : 'செலவு பிரிவு'}</h3>
                    {expenseCategoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                    {expenseCategoryData.map((_, i) => <Cell key={i} fill={['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF'][i % 5]} />)}
                                </Pie>
                                <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : noDataMsg}
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Guest Relations */}
                <motion.div {...fadeUp(0.6)} {...hover3D} className="glass-premium glow-hover" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>👥 {lang === 'en' ? 'Guest Relations' : 'உறவு பிரிவு'}</h3>
                    {relationData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={relationData} cx="50%" cy="50%" outerRadius={90} dataKey="value" stroke="none">
                                    {relationData.map((_, i) => <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : noDataMsg}
                </motion.div>

                {/* Top Donors */}
                <motion.div {...fadeUp(0.7)} {...hover3D} className="glass-premium glow-hover" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>🏆 {lang === 'en' ? 'Top Contributors' : 'முக்கிய மொய் கொடுத்தவர்கள்'}</h3>
                    {topDonors.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {topDonors.map((donor, i) => (
                                <div key={donor.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>{medals[i]}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{donor.name}</span>
                                            <span style={{ fontWeight: 900, color: 'var(--accent)' }}>₹{donor.total.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(donor.total / (topDonors[0]?.total || 1)) * 100}%` }}
                                                transition={{ duration: 1, delay: 1 }}
                                                style={{ height: '100%', background: 'var(--accent)' }} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : noDataMsg}
                </motion.div>
            </div>
        </div>
    );
};

export default Analytics;
