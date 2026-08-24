import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Users, CheckCircle, Clock, Wifi, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import useFunctions from '../hooks/useFunctions';

const QRDisplay = () => {
    const { pendingEntries, lang } = useApp();
    const { functions: dbFunctions, loading, refetch } = useFunctions();
    const [selectedFnId, setSelectedFnId] = useState('');
    const [customHost, setCustomHost] = useState(() => {
        return localStorage.getItem('vizhabook_custom_qr_host') || '';
    });

    useEffect(() => {
        refetch();
    }, [refetch]);

    const displayFunctions = dbFunctions && dbFunctions.length > 0 ? dbFunctions : [];
    const selectedFn = displayFunctions.find(f => String(f.id) === String(selectedFnId)) || displayFunctions[0] || { id: '', name: 'Select Function' };

    const currentOrigin = window.location.origin;
    const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

    const effectiveBaseUrl = customHost.trim() || currentOrigin;
    const checkinUrl = `${effectiveBaseUrl}/#/checkin?fnId=${selectedFn?.id}&fnName=${encodeURIComponent(selectedFn?.name || '')}`;

    const handleHostChange = (e) => {
        const val = e.target.value;
        setCustomHost(val);
        localStorage.setItem('vizhabook_custom_qr_host', val);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem',
            gap: '2rem'
        }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
            >
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    fontFamily: "'Playfair Display', serif",
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '0.5rem'
                }}>
                    {lang === 'en' ? '📱 Guest QR Check-In' : '📱 விருந்தினர் QR பதிவு'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    {lang === 'en' ? 'Show this QR to guests — they self-register on their phone' : 'இந்த QR-ஐ guests-கு காட்டுங்கள் — அவர்களே பதிவு செய்வார்கள்'}
                </p>
            </motion.div>

            {/* Function Selector & Host IP Override */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '460px' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                        <Loader2 size={18} className="spin" /> {lang === 'en' ? 'Loading PostgreSQL Events…' : 'நிகழ்வுகள் ஏற்றப்படுகின்றன…'}
                    </div>
                ) : (
                    <select
                        value={selectedFnId || selectedFn?.id || ''}
                        onChange={e => setSelectedFnId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '1rem',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        {displayFunctions.length === 0 ? (
                            <option value="">{lang === 'en' ? 'No Active Functions Found' : 'நிகழ்வுகள் எதுவும் இல்லை'}</option>
                        ) : (
                            displayFunctions.map(f => (
                                <option key={f.id} value={f.id}>{f.name} ({f.status || 'ACTIVE'})</option>
                            ))
                        )}
                    </select>
                )}

                {/* Local Network IP Banner & Input */}
                <div style={{
                    width: '100%',
                    background: '#FEF3C7',
                    border: '1.5px solid #FCD34D',
                    borderRadius: '1rem',
                    padding: '1rem',
                    fontSize: '0.82rem',
                    color: '#B45309'
                }}>
                    <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Wifi size={16} color="#D97706" />
                        {lang === 'en' ? '📱 Mobile Scanning Network Setting' : '📱 மொபைல் ஸ்கேன் செய்யும் நெட்வொர்க் முகவரி'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#92400E', marginBottom: '8px', lineHeight: 1.4 }}>
                        {isLocalhost
                            ? (lang === 'en'
                                ? 'Note: Mobile phones cannot reach "localhost". Enter your computer\'s Wi-Fi IP (e.g. http://192.168.0.103:5174)'
                                : 'குறிப்பு: மொபைல் போன்கள் "localhost"-ஐத் திறக்க முடியாது. கணினியின் Wi-Fi IP முகவரியை (எ.கா: http://192.168.0.103:5174) உள்ளிடவும்.')
                            : (lang === 'en' ? 'Active Host URL:' : 'செயலில் உள்ள URL முகவரி:')
                        }
                    </div>
                    <input
                        type="text"
                        placeholder="http://192.168.0.103:5174"
                        value={customHost}
                        onChange={handleHostChange}
                        style={{
                            width: '100%',
                            padding: '0.6rem 0.8rem',
                            borderRadius: '0.6rem',
                            border: '1px solid #F59E0B',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#0F172A',
                            background: '#FFFFFF',
                            fontFamily: 'monospace'
                        }}
                    />
                </div>
            </motion.div>

            {/* QR Code Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{
                    background: 'white',
                    borderRadius: '2rem',
                    padding: '3rem',
                    boxShadow: 'var(--shadow-3d)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Animated decorative rings */}
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: `${120 + i * 80}px`,
                            height: `${120 + i * 80}px`,
                            borderRadius: '50%',
                            border: `2px solid rgba(30, 58, 138, ${0.08 / i})`,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none'
                        }}
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}

                <div style={{
                    padding: '1rem',
                    borderRadius: '1rem',
                    background: 'white',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <QRCodeSVG
                        value={checkinUrl}
                        size={240}
                        fgColor="#0F172A"
                        bgColor="white"
                        level="H"
                        imageSettings={{
                            src: '/logo.png',
                            width: 40,
                            height: 40,
                            excavate: true
                        }}
                    />
                </div>

                <div style={{ textAlign: 'center', zIndex: 10 }}>
                    <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {selectedFn?.name || 'Manoj\'s mariage'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {lang === 'en' ? 'Scan to register your gift' : 'உங்கள் மொய் பதிவு செய்ய scan செய்யுங்கள்'}
                    </p>
                </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
            >
                {[
                    { icon: <Clock size={20} />, label: lang === 'en' ? 'Pending Review' : 'காத்திருக்கும்', value: pendingEntries.length, color: '#F59E0B' },
                    { icon: <Users size={20} />, label: lang === 'en' ? 'Ready to Scan' : 'Ready', value: '✓', color: '#10B981' },
                    { icon: <Wifi size={20} />, label: lang === 'en' ? 'Same Network' : 'Same WiFi', value: '●', color: '#3B82F6' }
                ].map((stat, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: 'var(--bg-card)', backdropFilter: 'blur(10px)',
                        border: '1px solid var(--border-color)', borderRadius: '1rem',
                        padding: '0.875rem 1.25rem', boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ color: stat.color }}>{stat.icon}</div>
                        <div>
                            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default QRDisplay;
