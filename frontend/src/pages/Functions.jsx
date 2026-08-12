import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, ArrowUpDown, Heart, MapPin, Calendar,
    Eye, Pencil, Trash2, AlertTriangle, Zap, CheckCircle2,
    AlertCircle, X, Loader2, FolderOpen
} from 'lucide-react';
import useFunctions from '../hooks/useFunctions';
import { functionSchema } from '../schemas/function.schema';
import './Functions.css';

/* ─── Toast Component ───────────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`fn-toast ${type}`}>
            {type === 'success'
                ? <CheckCircle2 size={18} />
                : <AlertCircle size={18} />
            }
            <span>{message}</span>
        </div>
    );
};

/* ─── Function Form (Create / Edit Modal) ────────────────────────────────────── */
const FunctionForm = ({ initial, onSubmit, onClose, title, submitting }) => {
    const [form, setForm] = useState({
        name: initial?.name || '',
        event_date: initial?.event_date
            ? initial.event_date.split('T')[0]
            : '',
        location: initial?.location || '',
        description: initial?.description || '',
        status: initial?.status || 'ACTIVE'
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsed = functionSchema.safeParse(form);
        if (!parsed.success) {
            const fieldErrors = {};
            for (const issue of parsed.error.issues) {
                fieldErrors[issue.path[0]] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }
        onSubmit(form);
    };

    return (
        <div className="fn-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="fn-modal" role="dialog" aria-modal="true">
                <div className="fn-modal-header">
                    <h2 className="fn-modal-title">{title}</h2>
                    <button className="fn-modal-close" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>

                <form className="fn-form" onSubmit={handleSubmit} noValidate>
                    {/* Name */}
                    <div className="fn-field">
                        <label htmlFor="fn-name">
                            Function Name <span className="required">*</span>
                        </label>
                        <input
                            id="fn-name"
                            className={`fn-input ${errors.name ? 'error' : ''}`}
                            type="text"
                            name="name"
                            placeholder="e.g. Arjun's Wedding Reception"
                            value={form.name}
                            onChange={handleChange}
                            maxLength={150}
                            autoFocus
                        />
                        {errors.name && <p className="fn-field-error"><AlertCircle size={12} />{errors.name}</p>}
                    </div>

                    {/* Event Date */}
                    <div className="fn-field">
                        <label htmlFor="fn-event-date">
                            Event Date <span className="required">*</span>
                        </label>
                        <input
                            id="fn-event-date"
                            className={`fn-input ${errors.event_date ? 'error' : ''}`}
                            type="date"
                            name="event_date"
                            value={form.event_date}
                            onChange={handleChange}
                        />
                        {errors.event_date && <p className="fn-field-error"><AlertCircle size={12} />{errors.event_date}</p>}
                    </div>

                    {/* Location */}
                    <div className="fn-field">
                        <label htmlFor="fn-location">Location</label>
                        <input
                            id="fn-location"
                            className={`fn-input ${errors.location ? 'error' : ''}`}
                            type="text"
                            name="location"
                            placeholder="e.g. Chennai, Tamil Nadu"
                            value={form.location}
                            onChange={handleChange}
                            maxLength={255}
                        />
                        {errors.location && <p className="fn-field-error"><AlertCircle size={12} />{errors.location}</p>}
                    </div>

                    {/* Status */}
                    <div className="fn-field">
                        <label htmlFor="fn-status">Status</label>
                        <select
                            id="fn-status"
                            className="fn-select"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="fn-field">
                        <label htmlFor="fn-description">Description</label>
                        <textarea
                            id="fn-description"
                            className="fn-textarea"
                            name="description"
                            placeholder="Optional details about this function…"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="fn-modal-footer">
                        <button type="button" className="fn-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="fn-btn-submit" disabled={submitting}>
                            {submitting
                                ? <><Loader2 size={15} className="spin" /> Saving…</>
                                : <><CheckCircle2 size={15} /> {initial ? 'Update Function' : 'Create Function'}</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Delete Confirmation Dialog ─────────────────────────────────────────────── */
const DeleteConfirm = ({ fn, onConfirm, onClose, deleting }) => (
    <div className="fn-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="fn-confirm-modal" role="dialog" aria-modal="true">
            <div className="fn-confirm-icon">
                <Trash2 size={24} />
            </div>
            <h3 className="fn-confirm-title">Delete this function?</h3>
            <p className="fn-confirm-desc">
                You are about to permanently delete <strong>{fn.name}</strong>.
                This may also remove or affect its associated Moi entries and expenses.
                This action cannot be undone.
            </p>
            <div className="fn-confirm-footer">
                <button className="fn-btn-cancel" onClick={onClose}>Cancel</button>
                <button className="fn-btn-danger" onClick={onConfirm} disabled={deleting}>
                    {deleting
                        ? <><Loader2 size={14} className="spin" /> Deleting…</>
                        : <><Trash2 size={14} /> Delete</>
                    }
                </button>
            </div>
        </div>
    </div>
);

/* ─── Subscription Limit Modal ───────────────────────────────────────────────── */
const LimitModal = ({ limitInfo, onClose, onViewPlans }) => (
    <div className="fn-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="fn-limit-modal" role="dialog" aria-modal="true">
            <div className="fn-limit-icon">
                {limitInfo?.isExpired ? <AlertTriangle size={28} /> : <Zap size={28} />}
            </div>
            <h3 className="fn-limit-title">
                {limitInfo?.isExpired ? 'Subscription Expired' : 'Function Limit Reached'}
            </h3>
            <p className="fn-limit-desc">
                {limitInfo?.isExpired
                    ? 'Your trial or subscription has expired. Please choose a plan to continue creating functions and recording Moi entries.'
                    : `Your current plan allows ${limitInfo?.functionLimit || 1} function(s). Upgrade your plan to create more functions and manage larger events.`
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

/* ─── Main Functions Page ────────────────────────────────────────────────────── */
const Functions = () => {
    const navigate = useNavigate();
    const { functions, loading, error, refetch, createFn, updateFn, deleteFn } = useFunctions();

    // Fetch on mount
    useEffect(() => { refetch(); }, [refetch]);

    // UI state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortAsc, setSortAsc] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [limitInfo, setLimitInfo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    // Derived filtered + sorted list
    const displayFunctions = useMemo(() => {
        let list = [...functions];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(f =>
                f.name?.toLowerCase().includes(q) ||
                f.location?.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'ALL') {
            list = list.filter(f => f.status === statusFilter);
        }

        list.sort((a, b) => {
            const da = new Date(a.event_date);
            const db = new Date(b.event_date);
            return sortAsc ? da - db : db - da;
        });

        return list;
    }, [functions, search, statusFilter, sortAsc]);

    const handleCreate = async (data) => {
        setSubmitting(true);
        const res = await createFn(data);
        setSubmitting(false);
        if (res.success) {
            setShowCreate(false);
            showToast('Function created successfully!');
        } else if (res.limitReached || res.isExpired) {
            setShowCreate(false);
            setLimitInfo(res);
        } else {
            showToast(res.error || 'Failed to create function.', 'error');
        }
    };

    const handleEdit = async (data) => {
        setSubmitting(true);
        const res = await updateFn(editTarget.id, data);
        setSubmitting(false);
        if (res.success) {
            setEditTarget(null);
            showToast('Function updated successfully!');
        } else {
            showToast(res.error || 'Failed to update function.', 'error');
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        const res = await deleteFn(deleteTarget.id);
        setDeleting(false);
        setDeleteTarget(null);
        if (res.success) {
            showToast('Function deleted successfully!');
        } else {
            showToast(res.error || 'Failed to delete function.', 'error');
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try {
            return new Date(d).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        } catch { return d; }
    };

    const formatAmount = (n) => {
        const num = Number(n) || 0;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    return (
        <div className="fn-page">
            {/* ── Header ── */}
            <header className="fn-header">
                <div className="fn-header-left">
                    <h1>Functions</h1>
                    <p>Manage all your celebration events in one place</p>
                </div>
                <button
                    id="btn-create-function"
                    className="fn-create-btn"
                    onClick={() => setShowCreate(true)}
                >
                    <Plus size={16} />
                    Create Function
                </button>
            </header>

            {/* ── Toolbar ── */}
            <div className="fn-toolbar">
                <div className="fn-search-box">
                    <Search className="search-icon" size={16} />
                    <input
                        id="fn-search"
                        className="fn-search-input"
                        type="text"
                        placeholder="Search by name or location…"
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
                <button
                    className="fn-sort-btn"
                    onClick={() => setSortAsc(prev => !prev)}
                    title="Toggle date sort"
                >
                    <ArrowUpDown size={14} />
                    Date {sortAsc ? '↑' : '↓'}
                </button>
            </div>

            {/* ── Content ── */}
            {loading && (
                <div className="fn-skeleton-grid">
                    {[1, 2, 3].map(i => <div key={i} className="fn-skeleton-card" />)}
                </div>
            )}

            {!loading && error && (
                <div className="fn-state-box">
                    <AlertCircle size={48} className="fn-state-icon" />
                    <h3 className="fn-state-title">Unable to load functions</h3>
                    <p className="fn-state-desc">{error}</p>
                    <button className="fn-create-btn" style={{ marginTop: '0.5rem' }} onClick={refetch}>
                        Try Again
                    </button>
                </div>
            )}

            {!loading && !error && displayFunctions.length === 0 && (
                <div className="fn-state-box">
                    <FolderOpen size={56} className="fn-state-icon" />
                    <h3 className="fn-state-title">
                        {functions.length === 0 ? 'No functions yet' : 'No results found'}
                    </h3>
                    <p className="fn-state-desc">
                        {functions.length === 0
                            ? 'Create your first function to start recording Moi and gifts.'
                            : 'Try adjusting your search or filter.'
                        }
                    </p>
                    {functions.length === 0 && (
                        <button className="fn-create-btn" style={{ marginTop: '0.5rem' }} onClick={() => setShowCreate(true)}>
                            <Plus size={14} /> Create Function
                        </button>
                    )}
                </div>
            )}

            {!loading && !error && displayFunctions.length > 0 && (
                <div className="fn-grid">
                    {displayFunctions.map(fn => (
                        <div key={fn.id} className="fn-card">
                            <div className="fn-card-header">
                                <div className="fn-card-icon">
                                    <Heart size={20} />
                                </div>
                                <div className="fn-card-title-group">
                                    <h3 className="fn-card-name" title={fn.name}>{fn.name}</h3>
                                    <p className="fn-card-date">
                                        <Calendar size={12} />
                                        {formatDate(fn.event_date)}
                                    </p>
                                </div>
                                <span className={`fn-status-badge ${fn.status}`}>
                                    {fn.status === 'ACTIVE' ? 'Active'
                                        : fn.status === 'COMPLETED' ? 'Completed'
                                        : 'Archived'}
                                </span>
                            </div>

                            {fn.location && (
                                <p className="fn-card-location">
                                    <MapPin size={13} />
                                    {fn.location}
                                </p>
                            )}

                            <div className="fn-card-stats">
                                <div className="fn-stat-chip">
                                    <span className="fn-stat-label">Moi Entries</span>
                                    <span className="fn-stat-value">{fn.moi_entry_count || 0}</span>
                                </div>
                                <div className="fn-stat-chip">
                                    <span className="fn-stat-label">Total Moi</span>
                                    <span className="fn-stat-value">{formatAmount(fn.total_moi_amount)}</span>
                                </div>
                            </div>

                            <div className="fn-card-actions">
                                <button
                                    className="fn-action-btn view"
                                    onClick={() => navigate(`/functions/${fn.id}`)}
                                    id={`btn-view-${fn.id}`}
                                >
                                    <Eye size={14} /> View
                                </button>
                                <button
                                    className="fn-action-btn"
                                    onClick={() => setEditTarget(fn)}
                                    id={`btn-edit-${fn.id}`}
                                >
                                    <Pencil size={13} /> Edit
                                </button>
                                <button
                                    className="fn-action-btn delete"
                                    onClick={() => setDeleteTarget(fn)}
                                    id={`btn-delete-${fn.id}`}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modals ── */}
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

            {/* ── Toast ── */}
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
