import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, ArrowUpDown, Calendar, Eye, Pencil, Trash2,
    AlertTriangle, Zap, CheckCircle2, AlertCircle, X, Loader2,
    Sparkles, TrendingUp, LayoutGrid, PartyPopper
} from 'lucide-react';
import useFunctions from '../hooks/useFunctions';
import { functionSchema } from '../schemas/function.schema';
import './Functions.css';

/* ─── Event type registry ─────────────────────────────────────────────────────
   Maps function name keywords → emoji, stripe colour class, label
   ─────────────────────────────────────────────────────────────────────────── */
const detectType = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('wedding') || n.includes('marriage') || n.includes('kalyanam') || n.includes('திருமணம்'))
        return { emoji: '🏮', stripe: 'wedding',     label: 'Wedding' };
    if (n.includes('birthday') || n.includes('bday') || n.includes('பிறந்தநாள்'))
        return { emoji: '🎂', stripe: 'birthday',    label: 'Birthday' };
    if (n.includes('house') || n.includes('gruh') || n.includes('housewarming') || n.includes('griha'))
        return { emoji: '🏠', stripe: 'house',       label: 'House Warming' };
    if (n.includes('baby') || n.includes('shower') || n.includes('valaikaapu') || n.includes('seemantham'))
        return { emoji: '🍼', stripe: 'baby',        label: 'Baby Shower' };
    if (n.includes('anniv'))
        return { emoji: '💑', stripe: 'anniversary', label: 'Anniversary' };
    if (n.includes('engag') || n.includes('nischay'))
        return { emoji: '💍', stripe: 'wedding',     label: 'Engagement' };
    if (n.includes('reception'))
        return { emoji: '🎊', stripe: 'wedding',     label: 'Reception' };
    return { emoji: '✨', stripe: 'default', label: 'Celebration' };
};

/* ─── Toast ───────────────────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fn-toast ${type}`}>
            {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message}</span>
        </div>
    );
};

/* ─── Function Form ───────────────────────────────────────────────────────── */
const FunctionForm = ({ initial, onSubmit, onClose, title, submitting }) => {
    const [form, setForm] = useState({
        name:        initial?.name        || '',
        event_date:  initial?.event_date  ? initial.event_date.split('T')[0] : '',
        location:    initial?.location    || '',
        description: initial?.description || '',
        status:      initial?.status      || 'ACTIVE'
    });
    const [errors, setErrors] = useState({});

    const set = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsed = functionSchema.safeParse(form);
        if (!parsed.success) {
            const fe = {};
            for (const issue of parsed.error.issues) fe[issue.path[0]] = issue.message;
            setErrors(fe);
            return;
        }
        onSubmit(form);
    };

    return (
        <div className="fn-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="fn-modal" role="dialog" aria-modal="true" aria-labelledby="fn-modal-title-id">

                {/* Gradient header */}
                <div className="fn-modal-top">
                    <h2 className="fn-modal-title" id="fn-modal-title-id">
                        {initial ? '✏️ Edit Function' : '🎊 Create Function'}
                    </h2>
                    <button className="fn-modal-close" onClick={onClose} aria-label="Close dialog">
                        <X size={15} />
                    </button>
                </div>

                {/* Form body */}
                <div className="fn-modal-body">
                    <form className="fn-form" onSubmit={handleSubmit} noValidate id="fn-form">

                        <div className="fn-field">
                            <label htmlFor="fn-name">Function Name <span className="required">*</span></label>
                            <input
                                id="fn-name"
                                className={`fn-input ${errors.name ? 'error' : ''}`}
                                type="text"
                                name="name"
                                placeholder="e.g. Arjun's Wedding, Meena Birthday…"
                                value={form.name}
                                onChange={set}
                                maxLength={150}
                                autoFocus
                            />
                            {errors.name && <p className="fn-field-error"><AlertCircle size={12} />{errors.name}</p>}
                        </div>

                        <div className="fn-field">
                            <label htmlFor="fn-event-date">Event Date <span className="required">*</span></label>
                            <input
                                id="fn-event-date"
                                className={`fn-input ${errors.event_date ? 'error' : ''}`}
                                type="date"
                                name="event_date"
                                value={form.event_date}
                                onChange={set}
                            />
                            {errors.event_date && <p className="fn-field-error"><AlertCircle size={12} />{errors.event_date}</p>}
                        </div>

                        <div className="fn-field">
                            <label htmlFor="fn-location">Venue / Location</label>
                            <input
                                id="fn-location"
                                className={`fn-input ${errors.location ? 'error' : ''}`}
                                type="text"
                                name="location"
                                placeholder="e.g. Rajapalaiyam, Tamil Nadu"
                                value={form.location}
                                onChange={set}
                                maxLength={255}
                            />
                            {errors.location && <p className="fn-field-error"><AlertCircle size={12} />{errors.location}</p>}
                        </div>

                        <div className="fn-field">
                            <label htmlFor="fn-status">Status</label>
                            <select id="fn-status" className="fn-select" name="status" value={form.status} onChange={set}>
                                <option value="ACTIVE">🟢 Active</option>
                                <option value="COMPLETED">🔵 Completed</option>
                                <option value="ARCHIVED">⚫ Archived</option>
                            </select>
                        </div>

                        <div className="fn-field">
                            <label htmlFor="fn-description">Notes / Description</label>
                            <textarea
                                id="fn-description"
                                className="fn-textarea"
                                name="description"
                                placeholder="Any additional details about this function…"
                                value={form.description}
                                onChange={set}
                            />
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="fn-modal-footer">
                    <button type="button" className="fn-btn-cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" form="fn-form" className="fn-btn-submit" disabled={submitting}>
                        {submitting
                            ? <><Loader2 size={14} className="spin" /> Saving…</>
                            : <><CheckCircle2 size={14} /> {initial ? 'Save Changes' : 'Create Function'}</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Delete Confirmation ─────────────────────────────────────────────────── */
const DeleteConfirm = ({ fn, onConfirm, onClose, deleting }) => (
    <div className="fn-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="fn-confirm-modal" role="alertdialog" aria-modal="true">
            <div className="fn-confirm-icon-wrap"><Trash2 size={24} /></div>
            <h3 className="fn-confirm-title">Delete this function?</h3>
            <p className="fn-confirm-desc">
                You are about to permanently delete <strong>"{fn.name}"</strong>.
                This action may also remove associated Moi entries and expenses.
                This cannot be undone.
            </p>
            <div className="fn-confirm-footer">
                <button className="fn-btn-cancel" onClick={onClose}>Cancel</button>
                <button className="fn-btn-danger" onClick={onConfirm} disabled={deleting}>
                    {deleting
                        ? <><Loader2 size={13} className="spin" /> Deleting…</>
                        : <><Trash2 size={13} /> Delete Forever</>
                    }
                </button>
            </div>
        </div>
    </div>
);

/* ─── Limit Modal ─────────────────────────────────────────────────────────── */
const LimitModal = ({ limitInfo, onClose, onViewPlans }) => (
    <div className="fn-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="fn-limit-modal" role="dialog" aria-modal="true">
            <div className="fn-limit-icon">
                {limitInfo?.isExpired ? '⏰' : '⚡'}
            </div>
            <h3 className="fn-limit-title">
                {limitInfo?.isExpired ? 'Subscription Expired' : 'Function Limit Reached'}
            </h3>
            <p className="fn-limit-desc">
                {limitInfo?.isExpired
                    ? 'Your trial or subscription has expired. Choose a plan to continue managing your celebrations.'
                    : `Your current plan allows up to ${limitInfo?.functionLimit || 1} function(s). Upgrade to manage more events.`
                }
            </p>
            <div className="fn-limit-footer">
                <button className="fn-btn-cancel" onClick={onClose}>Close</button>
                <button className="fn-btn-upgrade" onClick={onViewPlans}>
                    <Zap size={14} /> View Plans
                </button>
            </div>
        </div>
    </div>
);

/* ─── Main Page ───────────────────────────────────────────────────────────── */
const Functions = () => {
    const navigate = useNavigate();
    const { functions, loading, error, refetch, createFn, updateFn, deleteFn } = useFunctions();

    useEffect(() => { refetch(); }, [refetch]);

    const [search,       setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortAsc,      setSortAsc]      = useState(false);
    const [showCreate,   setShowCreate]   = useState(false);
    const [editTarget,   setEditTarget]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [limitInfo,    setLimitInfo]    = useState(null);
    const [submitting,   setSubmitting]   = useState(false);
    const [deleting,     setDeleting]     = useState(false);
    const [toast,        setToast]        = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    /* Derived list */
    const displayFunctions = useMemo(() => {
        let list = [...functions];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(f =>
                f.name?.toLowerCase().includes(q) ||
                f.location?.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'ALL') list = list.filter(f => f.status === statusFilter);
        list.sort((a, b) => {
            const da = new Date(a.event_date), db = new Date(b.event_date);
            return sortAsc ? da - db : db - da;
        });
        return list;
    }, [functions, search, statusFilter, sortAsc]);

    /* Aggregate hero stats */
    const totalMoi  = functions.reduce((s, f) => s + (Number(f.total_moi_amount) || 0), 0);
    const activeCount    = functions.filter(f => f.status === 'ACTIVE').length;
    const completedCount = functions.filter(f => f.status === 'COMPLETED').length;

    /* CRUD handlers */
    const handleCreate = async (data) => {
        setSubmitting(true);
        const res = await createFn(data);
        setSubmitting(false);
        if (res.success) { setShowCreate(false); showToast('Function created successfully! 🎉'); }
        else if (res.limitReached || res.isExpired) { setShowCreate(false); setLimitInfo(res); }
        else showToast(res.error || 'Failed to create function.', 'error');
    };

    const handleEdit = async (data) => {
        setSubmitting(true);
        const res = await updateFn(editTarget.id, data);
        setSubmitting(false);
        if (res.success) { setEditTarget(null); showToast('Function updated successfully!'); }
        else showToast(res.error || 'Failed to update.', 'error');
    };

    const handleDelete = async () => {
        setDeleting(true);
        const res = await deleteFn(deleteTarget.id);
        setDeleting(false);
        setDeleteTarget(null);
        if (res.success) showToast('Function deleted.');
        else showToast(res.error || 'Failed to delete.', 'error');
    };

    const fmt      = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
    const fmtMoney = (n) => `₹${(Number(n)||0).toLocaleString('en-IN')}`;

    return (
        <div className="fn-page">
            {/* ═══════════ HERO BANNER ═══════════ */}
            <div className="fn-hero">
                <div className="fn-hero-orb fn-hero-orb-1" />
                <div className="fn-hero-orb fn-hero-orb-2" />

                <div className="fn-hero-content">
                    <div className="fn-hero-left">
                        <div className="fn-hero-eyebrow">
                            <PartyPopper size={12} /> Celebration Management
                        </div>
                        <h1 className="fn-hero-title">
                            Your <span>Functions</span>
                        </h1>
                        <p className="fn-hero-sub">
                            Manage weddings, birthdays &amp; family celebrations — all in one place
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                        <button
                            id="btn-create-function"
                            className="fn-create-btn"
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus size={17} />
                            Create Function
                        </button>

                        {/* Hero Stats */}
                        <div className="fn-hero-stats">
                            <div className="fn-hero-stat">
                                <div className="fn-hero-stat-value">{functions.length}</div>
                                <div className="fn-hero-stat-label">Total</div>
                            </div>
                            <div className="fn-hero-stat">
                                <div className="fn-hero-stat-value">{activeCount}</div>
                                <div className="fn-hero-stat-label">Active</div>
                            </div>
                            <div className="fn-hero-stat">
                                <div className="fn-hero-stat-value">{completedCount}</div>
                                <div className="fn-hero-stat-label">Done</div>
                            </div>
                            <div className="fn-hero-stat">
                                <div className="fn-hero-stat-value" style={{ fontSize: '1.1rem' }}>{fmtMoney(totalMoi)}</div>
                                <div className="fn-hero-stat-label">Total Moi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ TOOLBAR ═══════════ */}
            <div className="fn-toolbar">
                <div className="fn-search-box">
                    <Search className="search-icon" size={15} />
                    <input
                        id="fn-search"
                        className="fn-search-input"
                        type="text"
                        placeholder="Search by name or venue…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    id="fn-status-filter"
                    className="fn-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
                <button className="fn-sort-btn" onClick={() => setSortAsc(p => !p)} title="Toggle date sort">
                    <ArrowUpDown size={14} />
                    Date {sortAsc ? '↑ Oldest' : '↓ Newest'}
                </button>
                {!loading && (
                    <span className="fn-result-count">
                        {displayFunctions.length} function{displayFunctions.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ═══════════ STATES ═══════════ */}
            {loading && (
                <div className="fn-skeleton-grid">
                    {[1, 2, 3, 4].map(i => <div key={i} className="fn-skeleton-card" style={{ animationDelay: `${i * 0.12}s` }} />)}
                </div>
            )}

            {!loading && error && (
                <div className="fn-state-box">
                    <div className="fn-state-emoji">😕</div>
                    <h3 className="fn-state-title">Unable to load functions</h3>
                    <p className="fn-state-desc">{error}</p>
                    <button className="fn-create-btn" style={{ marginTop: '0.5rem' }} onClick={refetch}>
                        Try Again
                    </button>
                </div>
            )}

            {!loading && !error && displayFunctions.length === 0 && (
                <div className="fn-state-box">
                    <div className="fn-state-emoji">
                        {functions.length === 0 ? '🏮' : '🔍'}
                    </div>
                    <h3 className="fn-state-title">
                        {functions.length === 0 ? 'No functions yet' : 'No results found'}
                    </h3>
                    <p className="fn-state-desc">
                        {functions.length === 0
                            ? 'Create your first function to start recording Moi, gifts, and expenses for your celebrations.'
                            : 'Try adjusting your search term or status filter.'
                        }
                    </p>
                    {functions.length === 0 && (
                        <button className="fn-create-btn" style={{ marginTop: '0.5rem' }} onClick={() => setShowCreate(true)}>
                            <Plus size={15} /> Create First Function
                        </button>
                    )}
                </div>
            )}

            {/* ═══════════ CARDS GRID ═══════════ */}
            {!loading && !error && displayFunctions.length > 0 && (
                <div className="fn-grid">
                    {displayFunctions.map((fn, idx) => {
                        const { emoji, stripe } = detectType(fn.name);
                        return (
                            <div
                                key={fn.id}
                                className="fn-card"
                                style={{ animationDelay: `${idx * 0.06}s` }}
                            >
                                {/* Coloured top stripe based on event type */}
                                <div className={`fn-card-stripe ${stripe}`} />

                                {/* Card Body */}
                                <div className="fn-card-body">
                                    <div className="fn-card-header">
                                        <div className={`fn-event-badge ${stripe}`}>
                                            {emoji}
                                        </div>

                                        <div className="fn-card-title-group">
                                            <h3 className="fn-card-name" title={fn.name}>{fn.name}</h3>
                                            <div className="fn-card-meta">
                                                <p className="fn-card-date">
                                                    <Calendar size={12} />
                                                    {fmt(fn.event_date)}
                                                </p>
                                                {fn.location && (
                                                    <p className="fn-card-location">
                                                        📍 {fn.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <span className={`fn-status-badge ${fn.status}`}>
                                            {fn.status === 'ACTIVE' ? 'Active'
                                                : fn.status === 'COMPLETED' ? 'Completed'
                                                : 'Archived'}
                                        </span>
                                    </div>

                                    {/* Stats chips */}
                                    <div className="fn-card-stats">
                                        <div className="fn-stat-chip">
                                            <span className="fn-stat-label">Moi Entries</span>
                                            <span className="fn-stat-value">{fn.moi_entry_count || 0}</span>
                                        </div>
                                        <div className="fn-stat-chip">
                                            <span className="fn-stat-label">Total Moi</span>
                                            <span className="fn-stat-value">{fmtMoney(fn.total_moi_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="fn-card-footer">
                                    <button
                                        id={`btn-view-${fn.id}`}
                                        className="fn-action-btn view"
                                        onClick={() => navigate(`/functions/${fn.id}`)}
                                    >
                                        <Eye size={13} /> View Details
                                    </button>
                                    <button
                                        id={`btn-edit-${fn.id}`}
                                        className="fn-action-btn"
                                        onClick={() => setEditTarget(fn)}
                                    >
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <button
                                        id={`btn-delete-${fn.id}`}
                                        className="fn-action-btn delete"
                                        onClick={() => setDeleteTarget(fn)}
                                        aria-label={`Delete ${fn.name}`}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══════════ MODALS ═══════════ */}
            {showCreate && (
                <FunctionForm
                    title="Create Function"
                    onSubmit={handleCreate}
                    onClose={() => setShowCreate(false)}
                    submitting={submitting}
                />
            )}

            {editTarget && (
                <FunctionForm
                    title="Edit Function"
                    initial={editTarget}
                    onSubmit={handleEdit}
                    onClose={() => setEditTarget(null)}
                    submitting={submitting}
                />
            )}

            {deleteTarget && (
                <DeleteConfirm
                    fn={deleteTarget}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                    deleting={deleting}
                />
            )}

            {limitInfo && (
                <LimitModal
                    limitInfo={limitInfo}
                    onClose={() => setLimitInfo(null)}
                    onViewPlans={() => { setLimitInfo(null); navigate('/pricing'); }}
                />
            )}

            {/* ═══════════ TOAST ═══════════ */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default Functions;
