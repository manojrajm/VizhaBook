import React from 'react';
import { Users, Calendar, Gift, IndianRupee, Clock, ArrowUpRight, TrendingUp, User } from 'lucide-react';
import Card from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { MOCK_ENTRIES, MOCK_FUNCTIONS, MOCK_GUESTS } from '../utils/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const { functions, guests, entries, lang } = useApp();

    const displayFunctions = functions.length ? functions : MOCK_FUNCTIONS;
    const displayGuests = guests.length ? guests : MOCK_GUESTS;
    const displayEntries = entries.length ? entries : MOCK_ENTRIES;

    const totalAmount = displayEntries.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const stats = {
        totalFunctions: displayFunctions.length,
        totalGuests: displayGuests.length,
        totalAmount: totalAmount,
        totalGifts: displayEntries.length
    };

    const chartData = [
        { name: 'Jan', amount: 4000 },
        { name: 'Feb', amount: 3000 },
        { name: 'Mar', amount: 2000 },
        { name: 'Apr', amount: 2780 },
        { name: 'May', amount: 1890 },
        { name: 'Jun', amount: 2390 },
        { name: 'Jul', amount: 3490 },
    ];

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <Card className="hero-banner" style={{ height: '300px', padding: 0, overflow: 'hidden' }}>
                <div className="hero-overlay"></div>
                <div className="hero-content" style={{ padding: '4rem' }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem', opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{lang === 'en' ? 'Welcome back' : 'மீண்டும் வருக'}</p>
                    <h1 className="hero-title" style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>Vizha Book</h1>
                    <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'white', maxWidth: '600px', opacity: 0.9 }}>
                        {lang === 'en'
                            ? 'Experience the future of traditional gift tracking for your special occasions.'
                            : 'உங்கள் இல்ல விழாக்களுக்கான டிஜிட்டல் மொய் கணக்கு மேலாண்மை.'}
                    </p>
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <Card style={{ padding: '1.25rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--primary-color)', borderRadius: '0.75rem' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'en' ? 'Total Functions' : 'மொத்த விழாக்கள்'}</p>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{stats.totalFunctions}</h3>
                        </div>
                    </div>
                </Card>

                <Card style={{ padding: '1.25rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '0.75rem' }}>
                            <Users size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'en' ? 'Total Guests' : 'மொத்த விருந்தினர்கள்'}</p>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{stats.totalGuests}</h3>
                        </div>
                    </div>
                </Card>

                <Card style={{ padding: '1.25rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '0.75rem' }}>
                            <IndianRupee size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'en' ? 'Total Moi Amount' : 'மொத்த மொய்'}</p>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>₹{stats.totalAmount.toLocaleString('en-IN')}</h3>
                        </div>
                    </div>
                </Card>

                <Card style={{ padding: '1.25rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', borderRadius: '0.75rem' }}>
                            <Gift size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'en' ? 'Gift Entries' : 'பரிசு பதிவுகள்'}</p>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{stats.totalGifts}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1.5rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{lang === 'en' ? 'Collection Trend' : 'மொய் வசூல் போக்கு'}</h3>
                        <TrendingUp size={18} color="var(--primary-color)" />
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: 'var(--text-secondary)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: 'var(--shadow-lg)', fontSize: '0.875rem' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card style={{ padding: '1.5rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{lang === 'en' ? 'Recent Entries' : 'சமீபத்திய பதிவுகள்'}</h3>
                        <Clock size={18} color="var(--primary-color)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {displayEntries.slice(0, 5).map((entry, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: '#F9FAFB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '2.5rem', height: '2.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                        {entry.guestName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{entry.guestName}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.functionName}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>₹{entry.amount || '—'}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(entry.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;

