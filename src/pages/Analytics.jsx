import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Trophy, Medal, TrendingUp, Users, Gift, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SAPPHIRE_COLORS = ['#1E3A8A', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

const Analytics = () => {
    const { entries, lang } = useApp();

    // --- Computed Analytics ---
    const relationData = useMemo(() => {
        const map = {};
        entries.forEach(e => { map[e.relation || 'Other'] = (map[e.relation || 'Other'] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [entries]);

    const giftTypeData = useMemo(() => {
        const map = { Cash: 0, Jewel: 0, 'Gift Item': 0 };
        entries.forEach(e => { if (e.giftType in map) map[e.giftType]++; });
        return Object.entries(map).map(([name, count]) => ({ name, count }));
    }, [entries]);

    const monthlyData = useMemo(() => {
        const map = {};
        entries.forEach(e => {
            const d = new Date(e.date);
            const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            map[key] = (map[key] || 0) + (e.amount || 0);
        });
        return Object.entries(map).map(([month, total]) => ({ month, total }));
    }, [entries]);

    const hourlyData = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: 0 }));
        entries.forEach(e => {
            const h = new Date(e.date).getHours();
            hours[h].count++;
        });
        return hours.filter(h => h.count > 0);
    }, [entries]);

    const topDonors = useMemo(() => {
        const map = {};
        entries.forEach(e => {
            const name = e.guestName || 'Unknown';
            map[name] = (map[name] || 0) + (e.amount || 0);
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, total], i) => ({ name, total, rank: i + 1 }));
    }, [entries]);

    const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);
    const avgAmount = entries.length ? Math.round(totalAmount / entries.length) : 0;

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const medalColors = ['#F59E0B', '#94A3B8', '#D97706', '#64748B', '#475569'];

    const cardStyle = {
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-md)'
    };

    const noDataMsg = (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            📊 {lang === 'en' ? 'No data yet — add Moi entries to see charts.' : 'தரவு இல்லை — Moi entries சேர்த்தால் charts தெரியும்.'}
        </div>
    );

    const fadeUp = (delay = 0) => ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, duration: 0.4 }
    });

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <h1 style={{
                    fontSize: '3rem', fontWeight: 900, fontFamily: "'Playfair Display', serif",
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    marginBottom: '0.5rem'
                }}>
                    {lang === 'en' ? '📊 Analytics' : '📊 புள்ளிவிவரம்'}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {lang === 'en' ? 'Deep insights into your Moi collections' : 'உங்கள் மொய் தரவுகளின் ஆழமான பார்வை'}
                </p>
            </motion.div>

            {/* Summary Cards */}
            <motion.div {...fadeUp(0.05)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                    { label: lang === 'en' ? 'Total Collected' : 'மொத்தம்', value: `₹${totalAmount.toLocaleString('en-IN')}`, icon: <TrendingUp size={22} />, color: '#10B981' },
                    { label: lang === 'en' ? 'Total Entries' : 'மொத்த பதிவுகள்', value: entries.length, icon: <Gift size={22} />, color: '#3B82F6' },
                    { label: lang === 'en' ? 'Avg Gift' : 'சராசரி தொகை', value: `₹${avgAmount.toLocaleString('en-IN')}`, icon: <Users size={22} />, color: '#F59E0B' },
                ].map((stat, i) => (
                    <div key={i} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            padding: '0.875rem', borderRadius: '1rem',
                            background: `${stat.color}18`, color: stat.color,
                            boxShadow: `0 4px 12px ${stat.color}20`
                        }}>{stat.icon}</div>
                        <div>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{stat.value}</p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Row 1: Trend + Relation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Monthly Trend */}
                <motion.div {...fadeUp(0.1)} style={cardStyle}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>
                        📈 {lang === 'en' ? 'Collection Trend' : 'மொய் வரைபடம்'}
                    </h3>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Total']} />
                                <Area type="monotone" dataKey="total" stroke="#1E3A8A" strokeWidth={2.5} fill="url(#areaGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : noDataMsg}
                </motion.div>

                {/* Relation Pie */}
                <motion.div {...fadeUp(0.15)} style={cardStyle}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>
                        👥 {lang === 'en' ? 'Guest Relations' : 'உறவு பிரிவு'}
                    </h3>
                    {relationData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={relationData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {relationData.map((_, i) => <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : noDataMsg}
                </motion.div>
            </div>

            {/* Row 2: Gift Type Bar + Peak Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Gift Type Bar */}
                <motion.div {...fadeUp(0.2)} style={cardStyle}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>
                        🎁 {lang === 'en' ? 'Gift Type Distribution' : 'பரிசு வகை'}
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={giftTypeData} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {giftTypeData.map((_, i) => <Cell key={i} fill={SAPPHIRE_COLORS[i]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Peak Hours */}
                <motion.div {...fadeUp(0.25)} style={cardStyle}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>
                        ⏰ {lang === 'en' ? 'Peak Hours' : 'பிரதான நேரம்'}
                    </h3>
                    {hourlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={hourlyData} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : noDataMsg}
                </motion.div>
            </div>

            {/* Top Donors Leaderboard */}
            <motion.div {...fadeUp(0.3)} style={cardStyle}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>
                    🏆 {lang === 'en' ? 'Top 5 Donors' : 'மேல் 5 மொய் கொடுத்தவர்கள்'}
                </h3>
                {topDonors.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {topDonors.map((donor, i) => (
                            <motion.div
                                key={donor.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.08 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem 1.25rem', borderRadius: '1rem',
                                    background: i === 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(30, 58, 138, 0.04)',
                                    border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.2)' : 'transparent'}`
                                }}
                            >
                                <span style={{ fontSize: '1.5rem', minWidth: '2rem', textAlign: 'center' }}>{medals[i]}</span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{donor.name}</p>
                                    <div style={{ height: '6px', borderRadius: '999px', background: '#e2e8f0', marginTop: '0.4rem', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(donor.total / (topDonors[0]?.total || 1)) * 100}%` }}
                                            transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                                            style={{ height: '100%', background: `linear-gradient(90deg, ${medalColors[i]}, ${medalColors[i]}99)`, borderRadius: '999px' }}
                                        />
                                    </div>
                                </div>
                                <span style={{ fontWeight: 900, fontSize: '1.1rem', color: medalColors[i] }}>
                                    ₹{donor.total.toLocaleString('en-IN')}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                ) : noDataMsg}
            </motion.div>
        </div>
    );
};

export default Analytics;
