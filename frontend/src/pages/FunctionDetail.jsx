import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, MapPin, FileText, Gift, IndianRupee,
    TrendingUp, Layers, Plus, Pencil, Clock, Hash, CheckCircle2, AlertCircle, CreditCard
} from 'lucide-react';
import functionService from '../services/functionService';
import paymentMethodService from '../services/paymentMethodService';
import './FunctionDetail.css';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmt      = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const fmtDate  = (d, opts) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', opts || { day:'numeric', month:'long', year:'numeric' }); }
    catch { return d; }
};
const fmtShort = (d) => fmtDate(d, { day:'numeric', month:'short', year:'numeric' });

const getInitials = (name = '') =>
    name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';

/* ─── Event type registry ─────────────────────────────────────────────────── */
const detectType = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('wedding') || n.includes('marriage') || n.includes('kalyanam') || n.includes('திருமணம்'))
        return { emoji: '🏮', heroClass: 'wedding',     typeLabel: 'Wedding' };
    if (n.includes('birthday') || n.includes('bday'))
        return { emoji: '🎂', heroClass: 'birthday',    typeLabel: 'Birthday' };
    if (n.includes('house') || n.includes('housewarming') || n.includes('griha'))
        return { emoji: '🏠', heroClass: 'house',       typeLabel: 'House Warming' };
    if (n.includes('baby') || n.includes('shower') || n.includes('valaikaapu'))
        return { emoji: '🍼', heroClass: 'baby',        typeLabel: 'Baby Shower' };
    if (n.includes('anniv'))
        return { emoji: '💑', heroClass: 'anniversary', typeLabel: 'Anniversary' };
    if (n.includes('engag'))
        return { emoji: '💍', heroClass: 'wedding',     typeLabel: 'Engagement' };
    if (n.includes('reception'))
        return { emoji: '🎊', heroClass: 'wedding',     typeLabel: 'Reception' };
    return { emoji: '✨', heroClass: 'default', typeLabel: 'Celebration' };
};

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
const StatCard = ({ type, icon: Icon, label, value, sub, delay }) => (
    <div className={`fd-stat-card ${type}`} style={{ animationDelay: `${delay}s` }}>
        <div className="fd-stat-icon-row">
            <div className={`fd-stat-icon ${type}`}><Icon size={18} /></div>
        </div>
        <div className="fd-stat-label">{label}</div>
        <div className="fd-stat-value">{value}</div>
        {sub && <div className="fd-stat-sub">{sub}</div>}
    </div>
);

/* ─── Main Component ──────────────────────────────────────────────────────── */
const FunctionDetail = () => {
    const { functionId } = useParams();
    const navigate = useNavigate();

    const [fn,         setFn]         = useState(null);
    const [moiEntries, setMoiEntries] = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);

    const [configuredPaymentMethods, setConfiguredPaymentMethods] = useState([]);

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

            // Fetch payment methods for this function
            try {
                const pmRes = await paymentMethodService.getPaymentMethodsByFunction(functionId);
                if (pmRes.success) setConfiguredPaymentMethods(pmRes.paymentMethods || []);
            } catch (e) { console.warn(e); }

            setLoading(false);
        };
        load();
    }, [functionId]);

    /* ── Loading ── */
    if (loading) return (
        <div className="fd-loading">
            <div className="fd-loading-ring" />
            <p className="fd-loading-text">Loading celebration details…</p>
        </div>
    );

    /* ── Error ── */
    if (error || !fn) return (
        <div className="fd-error-box">
            <div className="fd-error-emoji">😕</div>
            <h3 className="fd-error-title">{error || 'Function not found'}</h3>
            <p className="fd-error-sub">The function you're looking for may have been deleted or moved.</p>
            <button
                className="fd-back-btn"
                style={{ marginTop: '0.5rem' }}
                onClick={() => navigate('/functions')}
            >
                <ArrowLeft size={14} /> Back to Functions
            </button>
        </div>
    );

    const { emoji, heroClass, typeLabel } = detectType(fn.name);
    const netAmount = (Number(fn.total_moi_amount) || 0) - (Number(fn.total_expenses) || 0);
    const isNetPositive = netAmount >= 0;

    return (
        <div className="fd-page">
            {/* ── Back ── */}
            <button id="btn-back-functions" className="fd-back-btn" onClick={() => navigate('/functions')}>
                <ArrowLeft size={14} /> Back to Functions
            </button>

            {/* ═══════════════ HERO ═══════════════ */}
            <div className={`fd-hero ${heroClass}`}>
                {/* Decorative orbs */}
                <div className="fd-hero-orb fd-hero-orb-1" />
                <div className="fd-hero-orb fd-hero-orb-2" />

                {/* Main content */}
                <div className="fd-hero-content">
                    <div className="fd-hero-main">
                        <div className="fd-event-emoji-wrap">{emoji}</div>
                        <div className="fd-hero-text">
                            <div className="fd-hero-eyebrow">
                                <span>🎉</span> {typeLabel}
                            </div>
                            <h1 className="fd-hero-name">{fn.name}</h1>
                            <div className="fd-hero-meta">
                                <span className="fd-hero-meta-item">
                                    <Calendar size={13} />
                                    {fmtDate(fn.event_date)}
                                </span>
                                {fn.location && (
                                    <span className="fd-hero-meta-item">
                                        <MapPin size={13} />
                                        {fn.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="fd-hero-right">
                        <span className={`fd-status-pill ${fn.status}`}>
                            {fn.status === 'ACTIVE' ? '● Active'
                                : fn.status === 'COMPLETED' ? '✓ Completed'
                                : '○ Archived'}
                        </span>
                        <div className="fd-hero-actions">
                            <button
                                id="btn-edit-function-detail"
                                className="fd-hero-btn"
                                onClick={() => navigate('/functions')}
                            >
                                <Pencil size={14} /> Edit Function
                            </button>
                            <button
                                id="btn-add-moi-entry-hero"
                                className="fd-hero-btn primary"
                                onClick={() => navigate('/entry')}
                            >
                                <Plus size={14} /> Add Moi Entry
                            </button>
                        </div>
                    </div>
                </div>

                {/* Description inside hero */}
                {fn.description && (
                    <div className="fd-hero-desc">
                        <div className="fd-desc-box">
                            <FileText size={15} className="fd-desc-icon" />
                            <p className="fd-desc-text">{fn.description}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════ STAT CARDS ═══════════════ */}
            <div className="fd-stats-grid">
                <StatCard
                    type="moi" icon={Gift}
                    label="Moi Entries"
                    value={fn.moi_entry_count || 0}
                    sub="Total gifts recorded"
                    delay={0.05}
                />
                <StatCard
                    type="amount" icon={IndianRupee}
                    label="Total Moi Amount"
                    value={fmt(fn.total_moi_amount)}
                    sub="Gifts received"
                    delay={0.1}
                />
                <StatCard
                    type="expense" icon={Layers}
                    label="Total Expenses"
                    value={fmt(fn.total_expenses)}
                    sub="Event expenditure"
                    delay={0.15}
                />
                <StatCard
                    type="net" icon={TrendingUp}
                    label="Net Amount"
                    value={fmt(netAmount)}
                    sub={isNetPositive ? '▲ Surplus' : '▼ Deficit'}
                    delay={0.2}
                />
            </div>

            {/* ═══════════════ INFO + ENTRIES ROW ═══════════════ */}
            <div className="fd-info-row">
                {/* Quick Info Panel */}
                <div className="fd-info-panel">
                    <p className="fd-info-panel-title">Event Details</p>

                    <div className="fd-info-row-item">
                        <div className="fd-info-item-icon"><Calendar size={15} /></div>
                        <div>
                            <div className="fd-info-item-label">Event Date</div>
                            <div className="fd-info-item-value">{fmtDate(fn.event_date)}</div>
                        </div>
                    </div>

                    {fn.location && (
                        <div className="fd-info-row-item">
                            <div className="fd-info-item-icon"><MapPin size={15} /></div>
                            <div>
                                <div className="fd-info-item-label">Venue</div>
                                <div className="fd-info-item-value">{fn.location}</div>
                            </div>
                        </div>
                    )}

                    <div className="fd-info-row-item">
                        <div className="fd-info-item-icon">
                            {fn.status === 'ACTIVE' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        </div>
                        <div>
                            <div className="fd-info-item-label">Status</div>
                            <div className="fd-info-item-value"
                                style={{ color: fn.status === 'ACTIVE' ? '#059669' : fn.status === 'COMPLETED' ? '#4F46E5' : '#6B7280' }}
                            >
                                {fn.status === 'ACTIVE' ? 'Active' : fn.status === 'COMPLETED' ? 'Completed' : 'Archived'}
                            </div>
                        </div>
                    </div>

                    <div className="fd-info-row-item">
                        <div className="fd-info-item-icon"><Hash size={15} /></div>
                        <div>
                            <div className="fd-info-item-label">Event Type</div>
                            <div className="fd-info-item-value">{typeLabel} {emoji}</div>
                        </div>
                    </div>

                    <div className="fd-info-row-item">
                        <div className="fd-info-item-icon"><Clock size={15} /></div>
                        <div>
                            <div className="fd-info-item-label">Created On</div>
                            <div className="fd-info-item-value">{fmtShort(fn.created_at)}</div>
                        </div>
                    </div>
                </div>

                {/* Recent Moi Entries Panel */}
                <div className="fd-moi-panel">
                    <div className="fd-moi-panel-header">
                        <h3 className="fd-moi-panel-title">
                            <Gift size={16} />
                            Recent Moi Entries
                            {moiEntries.length > 0 && (
                                <span className="fd-moi-count-badge">{moiEntries.length}</span>
                            )}
                        </h3>
                        <button
                            id="btn-add-moi-entry"
                            className="fd-moi-add-btn"
                            onClick={() => navigate('/entry')}
                        >
                            <Plus size={13} /> Add Entry
                        </button>
                    </div>

                    {moiEntries.length === 0 ? (
                        <div className="fd-moi-empty">
                            <div className="fd-moi-empty-emoji">🎁</div>
                            <p className="fd-moi-empty-title">No Moi entries yet</p>
                            <p className="fd-moi-empty-sub">
                                Start recording Moi and gift entries for this celebration.
                            </p>
                            <button
                                className="fd-moi-add-btn"
                                style={{ marginTop: '0.5rem' }}
                                onClick={() => navigate('/entry')}
                            >
                                <Plus size={13} /> Record First Entry
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="fd-moi-table-header">
                                <span className="fd-moi-th">Guest Name</span>
                                <span className="fd-moi-th">Gift Type</span>
                                <span className="fd-moi-th">Amount</span>
                                <span className="fd-moi-th">Date</span>
                            </div>
                            {moiEntries.map((m) => (
                                <div key={m.id} className="fd-moi-row">
                                    <div className="fd-moi-guest">
                                        <div className="fd-moi-avatar">
                                            {getInitials(m.guest_name || m.guestName || '?')}
                                        </div>
                                        <span className="fd-moi-name">
                                            {m.guest_name || m.guestName || '—'}
                                        </span>
                                    </div>
                                    <span className="fd-moi-type">
                                        {m.gift_type || m.giftType || m.type || 'Cash'}
                                    </span>
                                    <span className="fd-moi-amount">{fmt(m.amount)}</span>
                                    <span className="fd-moi-date">{fmtShort(m.created_at)}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FunctionDetail;
