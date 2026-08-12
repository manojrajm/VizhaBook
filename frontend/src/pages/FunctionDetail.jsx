import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Heart, Calendar, MapPin, FileText, Tag,
    Gift, IndianRupee, TrendingUp, Layers, Plus, Pencil,
    AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import functionService from '../services/functionService';

const statusMap = {
    ACTIVE: { label: 'Active', color: '#059669', bg: 'rgba(16,185,129,0.12)' },
    COMPLETED: { label: 'Completed', color: '#4F46E5', bg: 'rgba(99,102,241,0.12)' },
    ARCHIVED: { label: 'Archived', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' }
};

const fmt = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch { return d; }
};

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: '1.1rem 1.3rem',
        display: 'flex',
        gap: '0.9rem',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
    }}>
        <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: color || 'rgba(30,58,138,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary-color)', flexShrink: 0
        }}>
            <Icon size={20} />
        </div>
        <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        </div>
    </div>
);

const FunctionDetail = () => {
    const { functionId } = useParams();
    const navigate = useNavigate();

    const [fn, setFn] = useState(null);
    const [moiEntries, setMoiEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            const res = await functionService.getFunctionById(functionId);
            if (res.success) {
                setFn(res.function);
                setMoiEntries(res.recentMoiEntries || []);
            } else {
                setError(res.error || 'Failed to load function details.');
            }
            setLoading(false);
        };
        load();
    }, [functionId]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading function details…</span>
        </div>
    );

    if (error || !fn) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', textAlign: 'center' }}>
            <AlertCircle size={48} color="var(--text-secondary)" />
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>{error || 'Function not found'}</h3>
            <button
                onClick={() => navigate('/functions')}
                style={{ height: 38, padding: '0 18px', borderRadius: 8, background: 'var(--primary-color)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
                Back to Functions
            </button>
        </div>
    );

    const status = statusMap[fn.status] || statusMap.ACTIVE;
    const netAmount = (Number(fn.total_moi_amount) || 0) - (Number(fn.total_expenses) || 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Back link + Title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => navigate('/functions')}
                    id="btn-back-functions"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        height: 36, padding: '0 14px', borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: 'transparent', color: 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                        fontFamily: 'inherit', transition: 'all 0.18s ease'
                    }}
                >
                    <ArrowLeft size={15} /> Back to Functions
                </button>
            </div>

            {/* Function Hero Card */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 18,
                padding: '1.75rem 2rem',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, rgba(30,58,138,0.1), rgba(59,130,246,0.1))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary-color)'
                        }}>
                            <Heart size={26} />
                        </div>
                        <div>
                            <h1 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '1.75rem', fontWeight: 700,
                                color: 'var(--text-primary)', margin: 0
                            }}>{fn.name}</h1>
                            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Calendar size={13} /> {fmtDate(fn.event_date)}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                            padding: '4px 12px', borderRadius: 100,
                            fontSize: '0.72rem', fontWeight: 700,
                            background: status.bg, color: status.color
                        }}>{status.label}</span>
                        <button
                            id="btn-edit-function-detail"
                            onClick={() => navigate('/functions')}
                            style={{
                                height: 36, padding: '0 14px', borderRadius: 8,
                                border: '1px solid var(--border-color)',
                                background: 'transparent', color: 'var(--text-secondary)',
                                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 5,
                                fontFamily: 'inherit'
                            }}
                        >
                            <Pencil size={14} /> Edit Function
                        </button>
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    {fn.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={15} /> <span>{fn.location}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <Tag size={15} /> <span>Status: <strong style={{ color: status.color }}>{status.label}</strong></span>
                    </div>
                </div>

                {fn.description && (
                    <div style={{
                        background: 'var(--bg-nested)', borderRadius: 8, padding: '0.85rem 1rem',
                        fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                            <FileText size={13} /> Description
                        </div>
                        {fn.description}
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard icon={Gift} label="Moi Entries" value={fn.moi_entry_count || 0} />
                <StatCard icon={IndianRupee} label="Total Moi Amount" value={fmt(fn.total_moi_amount)} />
                <StatCard icon={Layers} label="Total Expenses" value={fmt(fn.total_expenses)} />
                <StatCard icon={TrendingUp} label="Net Amount" value={fmt(netAmount)} color={netAmount >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(220,38,38,0.1)'} />
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                    id="btn-add-moi-entry"
                    onClick={() => navigate('/entry')}
                    style={{
                        height: 40, padding: '0 18px', borderRadius: 8,
                        background: 'var(--primary-color)', color: '#fff',
                        border: 'none', fontWeight: 700, fontSize: '0.875rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'inherit'
                    }}
                >
                    <Plus size={15} /> Add Moi Entry
                </button>
            </div>

            {/* Recent Moi Entries */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 16,
                padding: '1.4rem 1.5rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
                    Recent Moi Entries
                </h3>

                {moiEntries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <Gift size={36} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                        No Moi entries recorded yet for this function.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {moiEntries.map(m => (
                            <div key={m.id} style={{
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.65rem 0.9rem',
                                borderRadius: 8,
                                background: 'var(--bg-nested)',
                                fontSize: '0.875rem',
                                gap: '0.5rem',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {m.guest_name || m.guestName || '—'}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                    {m.gift_type || m.giftType || m.type || '—'}
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                                    {fmt(m.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FunctionDetail;
