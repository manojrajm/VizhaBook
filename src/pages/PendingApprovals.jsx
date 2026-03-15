import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Edit3, Clock, User, Gift, IndianRupee, AlertCircle, QrCode } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PendingApprovals = () => {
    const { pendingEntries, approvePendingEntry, rejectPendingEntry, lang } = useApp();
    const [editId, setEditId] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const startEdit = (entry) => {
        setEditId(entry.id);
        setEditAmount(String(entry.amount || ''));
        setEditDescription(entry.description || '');
    };

    const handleApprove = (entry) => {
        const editedData = {
            amount: editId === entry.id ? parseFloat(editAmount) || entry.amount : entry.amount,
            description: editId === entry.id ? editDescription || entry.description : entry.description,
            date: new Date().toISOString()
        };
        approvePendingEntry(entry.id, editedData);
        setEditId(null);
    };

    const handleReject = (id) => {
        rejectPendingEntry(id);
        if (editId === id) setEditId(null);
    };

    const timeSince = (iso) => {
        const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const sortedPending = [...pendingEntries].sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt) : new Date(0);
        const dateB = b.submittedAt ? new Date(b.submittedAt) : new Date(0);
        return dateA - dateB;
    });

    return (
        <div className="animate-fade" style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '2.5rem', fontWeight: 900,
                    fontFamily: "'Playfair Display', serif",
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    marginBottom: '0.5rem'
                }}>
                    {lang === 'en' ? '🔔 Pending Approvals' : '🔔 ஒப்புதல் காத்திருக்கும்'}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {lang === 'en'
                        ? 'Review guest entries from QR check-in. Edit amount if incorrect, then approve.'
                        : 'QR check-in-வழி வந்த entries-ஐ சரிபாருங்கள். தொகை தவறாக இருந்தால் திருத்துங்கள், பிறகு approve செய்யுங்கள்.'}
                </p>
            </div>

            {/* Empty State */}
            <AnimatePresence>
                {pendingEntries.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            textAlign: 'center', padding: '4rem 2rem',
                            background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
                            border: '1px solid var(--border-color)', borderRadius: '2rem',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto 1rem' }} />
                        </motion.div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {lang === 'en' ? 'All Clear! 🎉' : 'எல்லாம் சரி! 🎉'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {lang === 'en' ? 'No pending entries. Guests are using the QR check-in.' : 'காத்திருக்கும் பதிவுகள் எதுவும் இல்லை.'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pending Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <AnimatePresence>
                    {sortedPending.map((entry, idx) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{
                                background: 'var(--bg-card)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '1.5rem',
                                padding: '1.5rem',
                                boxShadow: 'var(--shadow-md)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Yellow accent bar */}
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                width: '4px', background: 'linear-gradient(180deg, #F59E0B, #D97706)',
                                borderRadius: '4px 0 0 4px'
                            }} />

                            <div style={{ paddingLeft: '0.5rem' }}>
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <User size={16} color="var(--primary-color)" />
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{entry.guestName}</span>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '999px',
                                                background: 'rgba(30, 58, 138, 0.1)', color: 'var(--primary-color)',
                                                fontSize: '0.7rem', fontWeight: 700
                                            }}>{entry.relation}</span>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>{entry.functionName}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        <Clock size={14} />
                                        {timeSince(entry.submittedAt)}
                                    </div>
                                </div>

                                {/* Amount / Description — Editable */}
                                {entry.giftType === 'Cash' ? (
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <IndianRupee size={16} color="#10B981" />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Guest submitted amount:</span>
                                        </div>
                                        {editId === entry.id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={e => setEditAmount(e.target.value)}
                                                    autoFocus
                                                    style={{
                                                        padding: '0.75rem 1rem', borderRadius: '0.75rem',
                                                        border: '2px solid var(--primary-color)',
                                                        fontSize: '1.5rem', fontWeight: 800,
                                                        color: 'var(--primary-color)', background: 'white',
                                                        width: '160px', textAlign: 'center', outline: 'none'
                                                    }}
                                                />
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>← Edit if wrong</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-color)' }}>
                                                    ₹{Number(entry.amount).toLocaleString('en-IN')}
                                                </span>
                                                <button
                                                    onClick={() => startEdit(entry)}
                                                    style={{
                                                        padding: '0.4rem 0.8rem', borderRadius: '0.5rem',
                                                        background: 'rgba(245, 158, 11, 0.1)', color: '#D97706',
                                                        border: '1px solid rgba(245,158,11,0.3)',
                                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                    }}
                                                >
                                                    <Edit3 size={12} /> Edit
                                                </button>
                                            </div>
                                        )}

                                        {/* Display UTR if Payment Mode is UPI */}
                                        {entry.paymentMode === 'UPI' && entry.utr && (
                                            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <QrCode size={14} color="#8B5CF6" />
                                                <span style={{ fontSize: '0.8rem', color: '#6D28D9', fontWeight: 600 }}>UPI UTR:</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4C1D95', fontFamily: 'monospace' }}>{entry.utr}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                            <Gift size={16} color="#8B5CF6" />
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gift Item:</span>
                                        </div>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.description}</span>
                                    </div>
                                )}

                                {/* Warning hint */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.6rem 1rem', borderRadius: '0.75rem',
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    marginBottom: '1.25rem'
                                }}>
                                    <AlertCircle size={14} color="#F59E0B" />
                                    <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 500 }}>
                                        {lang === 'en'
                                            ? 'Verify amount with guest before approving. Edit if incorrect.'
                                            : 'Approve செய்வதற்கு முன் guest-உடன் தொகையை சரிபாருங்கள்.'}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleApprove(entry)}
                                        style={{
                                            flex: 2, padding: '0.875rem', borderRadius: '1rem',
                                            background: 'linear-gradient(135deg, #10B981, #059669)',
                                            color: 'white', border: 'none', fontWeight: 800,
                                            fontSize: '0.95rem', cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        <CheckCircle size={18} /> Approve ✅
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleReject(entry.id)}
                                        style={{
                                            flex: 1, padding: '0.875rem', borderRadius: '1rem',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)',
                                            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                                        }}
                                    >
                                        <XCircle size={16} /> Reject
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PendingApprovals;
