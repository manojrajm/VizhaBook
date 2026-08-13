import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, MapPin, FileText, Gift, IndianRupee,
    TrendingUp, Layers, Plus, Pencil, Clock, Hash, CheckCircle2, AlertCircle, CreditCard, Wallet
} from 'lucide-react';
import functionService from '../services/functionService';
import paymentMethodService from '../services/paymentMethodService';
import './FunctionDetail.css';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt      = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const fmtDate  = (d, opts) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', opts || { day:'numeric', month:'long', year:'numeric' }); }
    catch { return d; }
};
const fmtShort = (d) => fmtDate(d, { day:'numeric', month:'short', year:'numeric' });

const getInitials = (name = '') =>
    name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';

/* ─── Event Type Registry ─────────────────────────────────────────────────── */
const detectType = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('wedding') || n.includes('marriage') || n.includes('kalyanam') || n.includes('திருமணம்'))
        return { label: 'Wedding / Kalyanam', heroClass: 'wedding', emoji: '💒' };
    if (n.includes('ear') || n.includes('piercing') || n.includes('kaadukuthu') || n.includes('காதுகுத்து'))
        return { label: 'Ear Piercing', heroClass: 'birthday', emoji: '👂' };
    if (n.includes('puberty') || n.includes('manjal') || n.includes('மஞ்சள்'))
        return { label: 'Puberty Ceremony', heroClass: 'baby', emoji: '🌸' };
    if (n.includes('baby') || n.includes('shower') || n.includes('valaikappu') || n.includes('வளைகாப்பு'))
        return { label: 'Baby Shower', heroClass: 'baby', emoji: '👶' };
    if (n.includes('house') || n.includes('grihapravesam') || n.includes('புதுமனை'))
        return { label: 'Grihapravesam', heroClass: 'house', emoji: '🏡' };
    if (n.includes('birthday') || n.includes('பிறந்தநாள்'))
        return { label: 'Birthday Celebration', heroClass: 'birthday', emoji: '🎂' };
    return { label: 'Family Celebration', heroClass: 'default', emoji: '🪔' };
};

/* ─── Stat Card Component ─────────────────────────────────────────────────── */
const StatCard = ({ type, icon: Icon, label, value, sub, delay }) => (
    <div className={`fd-stat-card ${type}`} style={{ animationDelay: `${delay}s` }}>
        <div className="fd-stat-icon-row">
            <div className={`fd-stat-icon ${type}`}>
                <Icon size={18} />
            </div>
        </div>
        <span className="fd-stat-label">{label}</span>
        <span className="fd-stat-value">{value}</span>
        {sub && <span className="fd-stat-sub">{sub}</span>}
    </div>
);

/* ─── Main Function Detail Page ───────────────────────────────────────────── */
const FunctionDetail = () => {
    const { functionId } = useParams();
    const navigate = useNavigate();

    const [fn, setFn] = useState(null);
    const [moiEntries, setMoiEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

            try {
                const pmRes = await paymentMethodService.getPaymentMethodsByFunction(functionId);
                if (pmRes.success) setConfiguredPaymentMethods(pmRes.paymentMethods || []);
            } catch (e) {
                console.warn('Failed to load payment methods in function detail:', e.message);
            }

            setLoading(false);
        };
        load();
    }, [functionId]);

    // Calculate Collection Sources Breakdown
    const collectionSources = useMemo(() => {
        const map = {};

        configuredPaymentMethods.forEach(pm => {
            map[pm.id] = {
                id: pm.id,
                name: pm.display_name || pm.name,
                upi_id: pm.upi_id,
                type: pm.method_type,
                received: 0,
                count: 0
            };
        });

        let cashTotal = 0;
        let cashCount = 0;

        moiEntries.forEach(m => {
            const amt = Number(m.amount) || 0;
            if (m.payment_method_id && map[m.payment_method_id]) {
                map[m.payment_method_id].received += amt;
                map[m.payment_method_id].count += 1;
            } else {
                cashTotal += amt;
                cashCount += 1;
            }
        });

        const list = Object.values(map);
        list.push({
            id: 'cash_default',
            name: 'Cash',
            upi_id: null,
            type: 'CASH',
            received: cashTotal,
            count: cashCount
        });

        return list;
    }, [configuredPaymentMethods, moiEntries]);

    if (loading) return (
        <div className="fd-loading">
            <div className="fd-loading-ring" />
            <p className="fd-loading-text">Loading celebration details…</p>
        </div>
    );

    if (error || !fn) return (
        <div className="fd-error-box">
            <AlertCircle size={40} className="fd-error-icon" />
            <h3 className="fd-error-title">Function Not Found</h3>
            <p className="fd-error-msg">{error || "The function you requested could not be found."}</p>
            <button className="fd-back-btn" onClick={() => navigate('/functions')}>
                <ArrowLeft size={16} /> Back to Functions
            </button>
        </div>
    );

    const { label: typeLabel, heroClass, emoji } = detectType(fn.name);
    const netAmount = (Number(fn.total_moi_amount) || 0) - (Number(fn.total_expenses) || 0);
    const isNetPositive = netAmount >= 0;

    return (
        <div className="fd-page">
            {/* Top Back Navigation Button */}
            <button className="fd-back-btn" onClick={() => navigate('/functions')}>
                <ArrowLeft size={15} /> All Functions
            </button>

            {/* ═══════════════ HERO BANNER ═══════════════ */}
            <div className={`fd-hero ${heroClass}`}>
                <div className="fd-hero-orb fd-hero-orb-1" />
                <div className="fd-hero-orb fd-hero-orb-2" />

                <div className="fd-hero-content">
                    <div className="fd-hero-main">
                        <div className="fd-event-emoji-wrap">{emoji}</div>
                        <div className="fd-hero-text">
                            <div className="fd-hero-eyebrow">{typeLabel}</div>
                            <h1 className="fd-hero-name">{fn.name}</h1>
                            <div className="fd-hero-meta">
                                <div className="fd-hero-meta-item">
                                    <Calendar size={14} /> {fmtDate(fn.event_date)}
                                </div>
                                {fn.location && (
                                    <div className="fd-hero-meta-item">
                                        <MapPin size={14} /> {fn.location}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="fd-hero-right">
                        <span className={`fd-status-pill ${fn.status || 'ACTIVE'}`}>
                            ● {fn.status || 'ACTIVE'}
                        </span>
                        <div className="fd-hero-actions">
                            <button
                                className="fd-hero-btn"
                                onClick={() => navigate('/functions')}
                            >
                                <Pencil size={14} /> Edit Celebration
                            </button>
                            <button
                                className="fd-hero-btn primary"
                                onClick={() => navigate('/entry')}
                            >
                                <Plus size={14} /> Record Moi
                            </button>
                        </div>
                    </div>
                </div>

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

            {/* ═══════════════ COLLECTION SOURCES BREAKDOWN ═══════════════ */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(15,23,42,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Playfair Display', serif" }}>
                        <CreditCard size={18} color="#D97706" />
                        Collection Sources
                    </h3>
                    <button
                        onClick={() => navigate('/settings/payment-methods')}
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '7px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Manage Payment Methods
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                    {collectionSources.map(cs => (
                        <div key={cs.id} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{cs.name}</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px', borderRadius: '100px', background: cs.type === 'UPI' ? '#EFF6FF' : '#DCFCE7', color: cs.type === 'UPI' ? '#1D4ED8' : '#15803D', border: cs.type === 'UPI' ? '1px solid #BFDBFE' : '1px solid #BBF7D0' }}>
                                    {cs.type}
                                </span>
                            </div>
                            {cs.upi_id && (
                                <span style={{ fontSize: '0.78rem', color: '#1E3A8A', fontFamily: 'monospace', fontWeight: 700 }}>{cs.upi_id}</span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669' }}>{fmt(cs.received)}</span>
                                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>{cs.count} Entries</span>
                            </div>
                        </div>
                    ))}
                </div>
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
