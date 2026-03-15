import React, { useState } from 'react';
import { PlusCircle, Search, TrendingUp, Users, Gift, ArrowRight, Clock, Cloud, CloudOff, RefreshCw, Settings, X, Save, Calendar, IndianRupee } from 'lucide-react';
import Card from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { MOCK_ENTRIES, MOCK_FUNCTIONS, MOCK_GUESTS } from '../utils/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = (delay) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: delay * 0.1 }
});

const Dashboard = () => {
    const { functions, entries, guests, lang, cloudId, setCloudId, isCloudEnabled, setIsCloudEnabled, isSyncing, hostSettings, setHostSettings } = useApp();
    const [search, setSearch] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [tempSettings, setTempSettings] = useState(hostSettings);

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
            <motion.div {...fadeUp(0)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <h1 style={{ fontWeight: 900, fontFamily: "'Playfair Display', serif", background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem', lineHeight: 1.1 }}>
                            {lang === 'en' ? 'Dashboard' : 'டாஷ்போர்டு'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back to your Vizha Book</p>
                    </div>
                    
                    {/* Cloud Sync & Settings Status */}
                    <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: isCloudEnabled ? '#10B981' : '#EF4444' }}>
                                {isCloudEnabled ? (isSyncing ? 'SYNCING...' : 'CLOUD SYNC ON') : 'OFFLINE MODE'}
                            </p>
                            {isCloudEnabled && cloudId && <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ID: {cloudId}</p>}
                        </div>
                        <div onClick={() => {
                            if (!isCloudEnabled) {
                                const id = prompt("Enter a unique Cloud ID (e.g. your phone number):");
                                if (id) { setCloudId(id); setIsCloudEnabled(true); }
                            } else {
                                if (confirm("Disable Cloud Sync? Data will remain on this device only.")) setIsCloudEnabled(false);
                            }
                        }} style={{ cursor: 'pointer', padding: '0.5rem', borderRadius: '10px', background: isCloudEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isCloudEnabled ? '#10B981' : '#EF4444' }}>
                            {isCloudEnabled ? <Cloud size={20} /> : <CloudOff size={20} />}
                        </div>
                        <div onClick={() => {
                            setTempSettings(hostSettings);
                            setShowSettings(true);
                        }} style={{ cursor: 'pointer', padding: '0.5rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>
                            <Settings size={20} />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '2rem', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>{lang === 'en' ? 'Host Settings' : 'அமைப்புகள்'}</h2>
                                <X size={24} onClick={() => setShowSettings(false)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                        {lang === 'en' ? 'Payment UPI ID (GPay/PhonePe)' : 'GPay UPI ஐடி'}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={tempSettings.upiId} 
                                        onChange={e => setTempSettings({ ...tempSettings, upiId: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                        {lang === 'en' ? 'Host Display Name' : 'பெயர் (Host)'}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={tempSettings.hostName} 
                                        onChange={e => setTempSettings({ ...tempSettings, hostName: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>FIREBASE CLOUD CONFIG</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <input 
                                            type="text" 
                                            placeholder="API Key"
                                            value={tempSettings.apiKey || ''} 
                                            onChange={e => setTempSettings({ ...tempSettings, apiKey: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '0.8rem' }}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Project ID"
                                            value={tempSettings.projectId || ''} 
                                            onChange={e => setTempSettings({ ...tempSettings, projectId: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '0.8rem' }}
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setHostSettings(tempSettings);
                                        setShowSettings(false);
                                        alert("Settings saved! Please reload if you changed Firebase config.");
                                    }}
                                    style={{ background: 'var(--primary-gradient)', color: 'white', padding: '1rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                                >
                                    <Save size={18} />
                                    {lang === 'en' ? 'Save Changes' : 'சேமிக்கவும்'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            <div className="responsive-grid">
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

            <div className="responsive-grid">
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

                <Card className="glass-premium float-3d" style={{ padding: '1.5rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{lang === 'en' ? 'Recent Entries' : 'சமீபத்திய பதிவுகள்'}</h3>
                        <Clock size={18} color="var(--primary-color)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <AnimatePresence>
                            {displayEntries.slice(0, 5).map((entry, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, backgroundColor: 'var(--border-color)' }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: 'var(--bg-nested)', border: '1px solid var(--border-color)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '2.5rem', height: '2.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.75rem' }}>
                                            {entry.guestName.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{entry.guestName}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.functionName}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--primary-color)', fontSize: '0.875rem' }}>₹{entry.amount || '—'}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(entry.date).toLocaleDateString()}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
