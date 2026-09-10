import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Edit3, Clock, User, Gift, IndianRupee, AlertCircle, QrCode, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import moiService from '../services/moiService';

const PendingApprovals = () => {
    const { pendingEntries: localPending, approvePendingEntry, rejectPendingEntry, refetchMoiEntries, lang } = useApp();
    const [dbPending, setDbPending] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Fetch live pending check-ins from PostgreSQL database API
    const fetchPendingCheckins = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await moiService.getPendingCheckins();
            if (res.success && res.pendingEntries) {
                setDbPending(res.pendingEntries);
            }
        } catch (e) {
            console.warn('PendingApprovals fetch error:', e.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    // Fast 3-second auto-poll fallback for multi-device Render.com mobile QR check-ins
    useEffect(() => {
        fetchPendingCheckins(true);
        const interval = setInterval(() => fetchPendingCheckins(false), 3000);
        return () => clearInterval(interval);
    }, [fetchPendingCheckins]);

    // Combine PostgreSQL DB pending check-ins + local state (deduplicated by ID)
    const combinedPendingMap = new Map();
    dbPending.forEach(item => combinedPendingMap.set(String(item.id), item));
    localPending.forEach(item => {
        if (!combinedPendingMap.has(String(item.id))) {
            combinedPendingMap.set(String(item.id), item);
        }
    });

    const displayPending = Array.from(combinedPendingMap.values());

    const startEdit = (entry) => {
        setEditId(entry.id);
        setEditAmount(String(entry.amount || ''));
        setEditDescription(entry.description || entry.gift_item || '');
    };

    const handleApprove = async (entry) => {
        // Optimistic removal from UI so item disappears instantly and cannot be re-clicked
        setDbPending(prev => prev.filter(p => String(p.id) !== String(entry.id)));
        approvePendingEntry(entry.id);
        if (editId === entry.id) setEditId(null);

        const editedData = {
            amount: editId === entry.id ? parseFloat(editAmount) || entry.amount : entry.amount,
            description: editId === entry.id ? editDescription || entry.description : entry.description,
            guestName: entry.guestName || entry.guest_name,
            phone: entry.phone,
            relation: entry.relation
        };

        // Approve in PostgreSQL Backend Database
        try {
            await moiService.approvePendingCheckin(entry.id, editedData);
            if (refetchMoiEntries) await refetchMoiEntries();
        } catch (e) {
            console.warn('PostgreSQL approve pending fallback:', e.message);
        }
    };

    const handleReject = async (id) => {
        setDbPending(prev => prev.filter(p => String(p.id) !== String(id)));
        rejectPendingEntry(id);
        if (editId === id) setEditId(null);

        try {
            await moiService.rejectPendingCheckin(id);
        } catch (e) {
            console.warn('PostgreSQL reject pending fallback:', e.message);
        }
    };

    const timeSince = (iso) => {
        if (!iso) return 'Just now';
        const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const sortedPending = [...displayPending].sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt) : new Date(0);
        const dateB = b.submittedAt ? new Date(b.submittedAt) : new Date(0);
        return dateB - dateA;
    });

    return (
        <div className="animate-fade" style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{
                        fontSize: '2.5rem', fontWeight: 900,
                        fontFamily: "'Playfair Display', serif",
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        marginBottom: '0.5rem'
                    }}>
                        {lang === 'en' ? '🔔 Pending Approvals' : '🔔 சரிபார்க்க வேண்டியவை'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {lang === 'en' ? 'Review guest entries from QR check-in. Edit amount if incorrect, then approve.' : 'QR பதிவுகளின் தகவல்களைச் சரிபார்த்து உறுதிப்படுத்தவும்.'}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchPendingCheckins}
                    style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '0.75rem', padding: '0.5rem 1rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700,
                        color: 'var(--text-primary)'
                    }}
                >
                    <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    {lang === 'en' ? 'Refresh' : 'புதுப்பி'}
                </button>
            </div>

            {/* List */}
            {sortedPending.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '2rem',
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-md)'
                    }}
                >
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <CheckCircle size={38} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {lang === 'en' ? 'All Clear! 🎉' : 'அனைத்தும் சரிபார்க்கப்பட்டது! 🎉'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
                        {lang === 'en' ? 'No pending entries. Guests are using the QR check-in.' : 'சரிபார்க்க வேண்டிய புதிய பதிவுகள் எதுவும் இல்லை.'}
                    </p>
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <AnimatePresence>
                        {sortedPending.map(entry => {
                            const isEditing = editId === entry.id;
                            const isCash = (entry.giftType || entry.gift_type) === 'Cash';
                            const gName = entry.guestName || entry.guest_name;
                            const fName = entry.functionName || entry.function_name;

                            return (
                                <motion.div
                                    key={entry.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '1.5rem',
                                        padding: '1.5rem',
                                        boxShadow: 'var(--shadow-md)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Accent top line */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                                        background: isCash ? 'linear-gradient(90deg, #F59E0B, #10B981)' : 'linear-gradient(90deg, #8B5CF6, #EC4899)'
                                    }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.6rem',
                                                    borderRadius: '100px', background: 'rgba(245, 158, 11, 0.15)', color: '#D97706',
                                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                                }}>
                                                    📱 Mobile QR Check-In
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                    <Clock size={12} /> {timeSince(entry.submittedAt || entry.createdAt)}
                                                </span>
                                            </div>

                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                                {gName}
                                            </h3>

                                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                {entry.relation && <span>❤️ {entry.relation}</span>}
                                                {entry.phone && <span>📱 {entry.phone}</span>}
                                                {fName && <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>📍 {fName}</span>}
                                            </div>
                                        </div>

                                        {/* Amount Badge */}
                                        <div style={{ textAlign: 'right' }}>
                                            {isCash ? (
                                                <div style={{
                                                    fontSize: '1.5rem', fontWeight: 900, color: '#10B981',
                                                    fontFamily: "'Playfair Display', serif"
                                                }}>
                                                    ₹{Number(entry.amount).toLocaleString('en-IN')}
                                                </div>
                                            ) : (
                                                <span style={{
                                                    fontSize: '0.85rem', fontWeight: 800, padding: '0.3rem 0.75rem',
                                                    borderRadius: '100px', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6'
                                                }}>
                                                    🎁 {entry.giftType || entry.gift_type}
                                                </span>
                                            )}
                                            {entry.paymentMode === 'UPI' && (
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8B5CF6', display: 'block', marginTop: '2px' }}>
                                                    🟣 UPI Paid
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* UTR / Transaction Note */}
                                    {(entry.utr || entry.description || entry.transactionReference) && (
                                        <div style={{
                                            background: 'var(--bg-secondary)', borderRadius: '0.875rem',
                                            padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {entry.utr && <div><strong style={{ color: 'var(--text-primary)' }}>UTR / Ref:</strong> {entry.utr}</div>}
                                            {entry.description && <div><strong style={{ color: 'var(--text-primary)' }}>Note:</strong> {entry.description}</div>}
                                        </div>
                                    )}

                                    {/* Edit Mode Inline Controls */}
                                    {isEditing && (
                                        <div style={{
                                            background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)',
                                            borderRadius: '1rem', padding: '1rem', marginBottom: '1.25rem'
                                        }}>
                                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#D97706' }}>
                                                ✏️ Edit Entry Details before Approval
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                {isCash ? (
                                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Correct Amount (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={editAmount}
                                                            onChange={e => setEditAmount(e.target.value)}
                                                            style={{
                                                                width: '100%', padding: '0.5rem', borderRadius: '0.5rem',
                                                                border: '1px solid var(--border-color)', fontWeight: 700
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Description</label>
                                                        <input
                                                            type="text"
                                                            value={editDescription}
                                                            onChange={e => setEditDescription(e.target.value)}
                                                            style={{
                                                                width: '100%', padding: '0.5rem', borderRadius: '0.5rem',
                                                                border: '1px solid var(--border-color)', fontWeight: 600
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleApprove(entry)}
                                            style={{
                                                flex: 2, padding: '0.875rem', borderRadius: '0.875rem', border: 'none',
                                                background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white',
                                                fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                                            }}
                                        >
                                            <CheckCircle size={18} />
                                            {lang === 'en' ? 'Approve Entry' : 'உறுதி செய்'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => startEdit(entry)}
                                            style={{
                                                padding: '0.875rem', borderRadius: '0.875rem',
                                                border: '1px solid var(--border-color)',
                                                background: isEditing ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-secondary)',
                                                color: isEditing ? '#D97706' : 'var(--text-primary)',
                                                fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                                            }}
                                        >
                                            <Edit3 size={16} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleReject(entry.id)}
                                            style={{
                                                padding: '0.875rem', borderRadius: '0.875rem',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444',
                                                fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                                            }}
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default PendingApprovals;
