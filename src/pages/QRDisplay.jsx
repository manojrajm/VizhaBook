import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Users, CheckCircle, Clock, Wifi } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MOCK_FUNCTIONS } from '../utils/mockData';

const QRDisplay = () => {
    const { functions, pendingEntries, lang } = useApp();
    const [selectedFnId, setSelectedFnId] = useState('');

    const displayFunctions = functions.length ? functions : MOCK_FUNCTIONS;
    const selectedFn = displayFunctions.find(f => String(f.id) === String(selectedFnId)) || displayFunctions[0];

    const baseUrl = window.location.origin;
    const checkinUrl = `${baseUrl}/checkin?fnId=${selectedFn?.id || ''}&fnName=${encodeURIComponent(selectedFn?.name || '')}`;

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
                    {lang === 'en' ? 'Show this QR to guests — they self-register on their phone' : 'இந்த QR-ஐ guests-கு காட்டுங்கள் — அவர்களே பதிவு செய்குவார்கள்'}
                </p>
            </motion.div>

            {/* Function Selector */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <select
                    value={selectedFnId}
                    onChange={e => setSelectedFnId(e.target.value)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '1rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        minWidth: '280px'
                    }}
                >
                    {displayFunctions.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
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
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {selectedFn?.name}
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

            {/* Pending badge if > 0 */}
            <AnimatePresence>
                {pendingEntries.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: 'white',
                            borderRadius: '1rem',
                            padding: '1rem 2rem',
                            fontWeight: 700,
                            fontSize: '1rem',
                            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <CheckCircle size={20} />
                        {lang === 'en'
                            ? `${pendingEntries.length} guest${pendingEntries.length > 1 ? 's' : ''} waiting for your approval!`
                            : `${pendingEntries.length} guest-கள் உங்கள் ஒப்புதலுக்காக காத்திருக்கிறார்கள்!`}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QRDisplay;
