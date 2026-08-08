import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import { MOCK_ENTRIES, MOCK_FUNCTIONS } from '../utils/mockData';
import { TRANSLATIONS } from '../utils/translations';

const Reports = () => {
    const { entries, functions, lang } = useApp();
    const t = TRANSLATIONS[lang];

    const displayEntries = entries.length ? entries : MOCK_ENTRIES;
    const displayFunctions = functions.length ? functions : MOCK_FUNCTIONS;

    // Data processing for charts
    const giftTypeData = [
        { name: 'Cash', value: displayEntries.filter(e => e.giftType === 'Cash').length },
        { name: 'Jewel', value: displayEntries.filter(e => e.giftType === 'Jewel').length },
        { name: 'Gift', value: displayEntries.filter(e => e.giftType === 'Gift').length },
    ];

    const functionStats = displayFunctions.map(f => ({
        name: f.name.split(' ').slice(0, 2).join(' '), // Shorten name for chart
        amount: displayEntries.filter(e => e.functionName === f.name).reduce((acc, curr) => acc + (curr.amount || 0), 0)
    }));

    const COLORS = ['var(--maroon)', 'var(--gold)', '#8B5CF6', '#EC4899'];

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
                <h2 className="festive-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Celebration Analytics</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>{lang === 'en' ? 'Visual insights into your gift collections.' : 'உங்கள் பரிசுகளின் காட்சி நுண்ணறிவு.'}</p>
            </header>

            <div className="grid-2">
                <Card style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '1.5rem', border: 'none' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Collection Trend</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={functionStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'white' }}
                                    cursor={{ fill: 'var(--cream)' }}
                                />
                                <Bar dataKey="amount" fill="url(#colorBar)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--maroon)" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="var(--gold)" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '1.5rem', border: 'none' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Gift Distribution</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={giftTypeData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {giftTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <Card style={{ background: 'var(--maroon)', color: 'white', border: 'none', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-1rem', right: '-1rem', width: '5rem', height: '5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>Max Moi</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 900 }}>₹{Math.max(...displayEntries.map(e => e.amount || 0)).toLocaleString('en-IN')}</p>
                </Card>

                <Card style={{ background: 'var(--gold)', color: 'white', border: 'none', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-1rem', right: '-1rem', width: '5rem', height: '5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>Average Gift</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 900 }}>
                        ₹{Math.round(displayEntries.reduce((acc, curr) => acc + (curr.amount || 0), 0) / (displayEntries.filter(e => e.amount > 0).length || 1)).toLocaleString('en-IN')}
                    </p>
                </Card>

                <Card style={{ background: 'var(--text-primary)', color: 'white', border: 'none', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-1rem', right: '-1rem', width: '5rem', height: '5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>Jewels Received</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 900 }}>{displayEntries.filter(e => e.giftType === 'Jewel').length}</p>
                </Card>
            </div>
        </div>
    );
};

export default Reports;

