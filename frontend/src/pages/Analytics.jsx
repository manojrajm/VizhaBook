import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import {
    Trophy, Medal, TrendingUp, Users, Gift, Clock, Filter, Layers,
    CreditCard, PieChart as PieIcon, BarChart3, Activity, ShieldCheck,
    AlertTriangle, Sparkles, DollarSign
} from 'lucide-react';
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

    // --- DATA SCIENTIST COMPUTED METRICS & CHARTS ---

    // 1. Per-Function Revenue vs Expense Comparison Data
    const functionComparisonData = useMemo(() => {
        const map = {};
        functions.forEach(f => {
            map[f.id] = { name: f.name, collection: 0, expense: 0 };
        });

        allEntries.forEach(e => {
            const fId = e.functionId;
            if (map[fId]) map[fId].collection += Number(e.amount) || 0;
        });

        allExpenses.forEach(exp => {
            const fId = exp.functionId;
            if (map[fId]) map[fId].expense += Number(exp.amount) || 0;
        });

        return Object.values(map).filter(f => f.collection > 0 || f.expense > 0);
    }, [functions, allEntries, allExpenses]);

    // 2. Payment Method Breakdown (Cash vs. Dynamic UPI Accounts)
    const paymentMethodData = useMemo(() => {
        const map = {};

        paymentMethods.forEach(pm => {
            if (pm.is_active) {
                map[pm.id] = {
                    name: pm.display_name || pm.name,
                    amount: 0,
                    count: 0
                };
            }
        });

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

    // 3. Collection Timeline Velocity Area Chart
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

    // 4. Guest Relation Demographics Breakdown
    const relationData = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            const key = e.relation || (isTa ? 'உறவினர்' : 'Relative');
            map[key] = (map[key] || 0) + (Number(e.amount) || 0);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [filteredEntries, isTa]);

    // 5. Non-Cash Gifts Count & Breakdown (Jewels & Physical Gift Items only)
    const nonCashGiftsCount = useMemo(() => {
        return filteredEntries.filter(e => {
            const giftType = (e.giftType || '').toLowerCase();
            const giftItem = (e.giftItem || '').toLowerCase();
            const isJewel = giftType === 'jewel' || giftType.includes('jewel') || giftItem.includes('gold') || giftItem.includes('silver') || giftItem.includes('jewel');
            const isGiftItem = giftType === 'gift item' || giftType === 'gift' || (giftItem && giftItem !== 'cash' && !isJewel);
            return isJewel || isGiftItem;
        }).length;
    }, [filteredEntries]);

    // 6. Top Contributor Donors Leaderboard (Cash & Physical Gifts)
    const topDonors = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            const name = e.guestName || e.name || 'Guest';
            if (!map[name]) {
                map[name] = {
                    name,
                    totalCash: 0,
                    gifts: []
                };
            }
            const amt = Number(e.amount) || 0;
            map[name].totalCash += amt;

            // Collect gift item or jewel name if presented
            const giftText = e.giftItem || (e.giftType !== 'Cash' ? e.giftType : null);
            if (giftText && giftText.toLowerCase() !== 'cash') {
                map[name].gifts.push(giftText);
            }
        });

        return Object.values(map)
            .sort((a, b) => {
                if (b.totalCash !== a.totalCash) return b.totalCash - a.totalCash;
                return b.gifts.length - a.gifts.length;
            })
            .slice(0, 5);
    }, [filteredEntries]);

    const totalAmount = filteredEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netBalance = totalAmount - totalExpenses;
    const avgMoiPerGuest = filteredEntries.length > 0 ? Math.round(totalAmount / filteredEntries.length) : 0;
    const expenseRatio = totalAmount > 0 ? Math.round((totalExpenses / totalAmount) * 100) : 0;

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    const noDataMsg = (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600 }}>
            📊 {isTa ? 'இந்த பிரிவில் தரவு இல்லை.' : 'No entries available for this view.'}
        </div>
    );

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
            
            {/* Header & Function Filter */}
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{
                        fontSize: '2.5rem', fontWeight: 900, fontFamily: "'Playfair Display', serif",
                        color: '#0F172A', marginBottom: '0.25rem'
                    }}>
                        {isTa ? '📊 நிதி & மொய் பகுப்பாய்வு மையம்' : '📊 Executive Financial Intelligence'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                        {isTa ? 'வரவு-செலவு கணக்குகள், வசூல் முறைகள் மற்றும் விருந்தினர் பங்களிப்புகளின் முழுமையான வரைகலை பகுப்பாய்வு.' : 'Data Scientist level analytics on income, expenses, dynamic UPI accounts, and guest demographics.'}
                    </p>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem',
                    borderRadius: '1rem', border: '1px solid #E2E8F0', background: '#FFFFFF', boxShadow: '0 4px 12px rgba(15,23,42,0.03)'
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
                        <option value="all">{isTa ? 'அனைத்து விழாக்கள்' : 'All Functions'}</option>
                        {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
            </div>

            {/* 4 EXECUTIVE FINANCIAL KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                
                {/* 1. Total Moi Received */}
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #1E3A8A', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'மொத்த மொய் வரவு' : 'Total Moi Received'}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.78rem', color: '#1E3A8A', marginTop: '4px', fontWeight: 700 }}>
                        {filteredEntries.length} {isTa ? 'விருந்தினர்கள்' : 'entries'} • (Avg ₹{avgMoiPerGuest.toLocaleString('en-IN')})
                    </div>
                </div>

                {/* 2. Total Outflow Expenses */}
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #DC2626', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'மொத்த செலவுகள்' : 'Total Outflow Expenses'}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: '4px', fontWeight: 700 }}>
                        {filteredExpenses.length} {isTa ? 'செலவு பதிவுகள்' : 'expenses'} ({expenseRatio}% of Income)
                    </div>
                </div>

                {/* 3. Net Surplus Balance */}
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: `5px solid ${netBalance >= 0 ? '#059669' : '#DC2626'}`, boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'நிகர சேமிப்பு இருப்பு' : 'Net Surplus Balance'}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: netBalance >= 0 ? '#059669' : '#DC2626', marginTop: '4px' }}>
                        ₹{netBalance.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: netBalance >= 0 ? '#059669' : '#DC2626', marginTop: '4px', fontWeight: 700 }}>
                        {netBalance >= 0 ? (isTa ? '✓ இலாபகரமான சேமிப்பு' : '✓ Capital Retained') : (isTa ? '⚠️ பற்றாக்குறை' : '⚠️ Deficit Outflow')}
                    </div>
                </div>

                {/* 4. Non-Cash Gift Contributions */}
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', borderLeft: '5px solid #D97706', boxShadow: '0 4px 14px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'பொருட்கள் / நகை பரிசுகள்' : 'Jewels & Gift Items'}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
                        {nonCashGiftsCount} {isTa ? 'பரிசுகள்' : 'items'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#D97706', marginTop: '4px', fontWeight: 700 }}>
                        🎁 Physical Gift Contributions
                    </div>
                </div>
            </div>

            {/* AI AUDIT & BUDGET HEALTH INDICATOR */}
            {totalAmount > 0 && (
                <div style={{
                    background: expenseRatio > 60 ? '#FEF2F2' : '#F0FDF4',
                    border: `1.5px solid ${expenseRatio > 60 ? '#FECACA' : '#BBF7D0'}`,
                    padding: '1.25rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {expenseRatio > 60 ? <AlertTriangle size={24} color="#DC2626" /> : <ShieldCheck size={24} color="#059669" />}
                        <div>
                            <div style={{ fontWeight: 900, fontSize: '1rem', color: expenseRatio > 60 ? '#991B1B' : '#065F46' }}>
                                {expenseRatio > 60 
                                    ? (isTa ? '⚠️ எச்சரிக்கை: செலவுகள் வரவில் 60%-க்கு மேல் உயர்ந்துள்ளது!' : '⚠️ Warning: Expenditure exceeds 60% of total collections!')
                                    : (isTa ? '🛡 நிதி நிலைமை ஆரோக்கியமாக உள்ளது!' : '🛡 Healthy Financial Status — Budget is well-controlled.')}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: expenseRatio > 60 ? '#B91C1C' : '#047857' }}>
                                {isTa ? `வரவு: ₹${totalAmount.toLocaleString('en-IN')} | செலவு: ₹${totalExpenses.toLocaleString('en-IN')} (${expenseRatio}%)` : `Total Collection: ₹${totalAmount.toLocaleString('en-IN')} | Expenses: ₹${totalExpenses.toLocaleString('en-IN')} (${expenseRatio}%)`}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VISUALIZATION GRID 1: PER-FUNCTION COMPARISON & COLLECTION VELOCITY */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

                {/* 📊 CHART 1: PER-FUNCTION REVENUE VS EXPENSE COMPARISON BAR CHART */}
                <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <BarChart3 size={20} color="#1E3A8A" />
                            {isTa ? 'விழாக்கள் வரவு vs செலவு ஒப்பீடு' : 'Function Revenue vs Expense Comparison'}
                        </h3>
                    </div>

                    {functionComparisonData.length === 0 ? noDataMsg : (
                        <div style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={functionComparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} fontWeight={700} />
                                    <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`]} />
                                    <Legend />
                                    <Bar dataKey="collection" name={isTa ? 'மொய் வரவு (Income)' : 'Moi Collection'} fill="#1E3A8A" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="expense" name={isTa ? 'செலவு (Outflow)' : 'Expense Outflow'} fill="#DC2626" radius={[8, 8, 0, 0]} />
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
                            {isTa ? 'வசூல் நேரடி வளர்ச்சி வரைபடம்' : 'Cumulative Collection Velocity'}
                        </h3>
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

            {/* VISUALIZATION GRID 2: PAYMENT METHOD BREAKDOWN & RELATION DEMOGRAPHICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

                {/* 💳 CHART 3: PAYMENT METHOD BREAKDOWN (CASH vs PER-UPI) */}
                <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={20} color="#D97706" />
                        {isTa ? 'கட்டண கணக்குகள் வசூல் (UPI & Cash Split)' : 'Payment Account Breakdown'}
                    </h3>

                    {paymentMethodData.length === 0 ? noDataMsg : (
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentMethodData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} fontWeight={600} />
                                    <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Collection']} />
                                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={36}>
                                        {paymentMethodData.map((_, i) => (
                                            <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* 👥 CHART 4: GUEST RELATION DEMOGRAPHICS */}
                <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={20} color="#10B981" />
                        {isTa ? 'உறவுமுறை நிதி பங்களிப்பு' : 'Relationship Demographics'}
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
            </div>

            {/* TOP GIFT CONTRIBUTOR LEADERBOARD MATRIX */}
            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={22} color="#D97706" />
                    {isTa ? 'உயர்ந்த மொய் வழங்கி விருந்தினர்கள்' : 'Top Gift Contributors Leaderboard'}
                </h3>
                {topDonors.length === 0 ? noDataMsg : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        {topDonors.map((d, i) => (
                            <div key={d.name} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}>
                                <div style={{ fontSize: '1.75rem' }}>{medals[i]}</div>
                                <div style={{ fontWeight: 800, color: '#0F172A', margin: '6px 0 2px', fontSize: '1.05rem' }}>{d.name}</div>
                                
                                {d.totalCash > 0 && (
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>
                                        ₹{d.totalCash.toLocaleString('en-IN')}
                                    </div>
                                )}

                                {d.gifts.length > 0 ? (
                                    <div style={{
                                        fontSize: '0.82rem', fontWeight: 800, color: '#B45309', background: '#FEF3C7',
                                        border: '1px solid #FCD34D', padding: '4px 10px', borderRadius: '8px', marginTop: '6px',
                                        display: 'inline-block'
                                    }}>
                                        🎁 {d.gifts.join(', ')}
                                    </div>
                                ) : d.totalCash === 0 ? (
                                    <div style={{ fontSize: '0.82rem', color: '#D97706', fontWeight: 700, marginTop: '4px' }}>
                                        🎁 {isTa ? 'அன்பளிப்பு பரிசு' : 'Gift Item'}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
