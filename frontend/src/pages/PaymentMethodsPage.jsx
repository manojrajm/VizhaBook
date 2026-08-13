import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, QrCode, Star, Power, Pencil, Trash2, X, AlertCircle,
    CheckCircle2, Loader2, Download, CreditCard, Wallet, Landmark, RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import functionService from '../services/functionService';
import paymentMethodService from '../services/paymentMethodService';
import { paymentMethodSchema } from '../schemas/paymentMethod.schema';
import './PaymentMethods.css';

/* ─── Provider Icon Mapper ─────────────────────────────────────────────────── */
const getProviderIcon = (provider, type) => {
    const p = (provider || '').toLowerCase();
    if (p.includes('gpay') || p.includes('google')) return { text: 'GPay', class: 'GPay', icon: '🟢' };
    if (p.includes('phonepe')) return { text: 'PhonePe', class: 'PhonePe', icon: '🟣' };
    if (p.includes('paytm')) return { text: 'Paytm', class: 'Paytm', icon: '🔷' };
    if (p.includes('bhim')) return { text: 'BHIM', class: 'BHIM', icon: '🟧' };
    if (type === 'CASH') return { text: 'Cash', class: 'CASH', icon: '💵' };
    if (type === 'BANK_TRANSFER') return { text: 'Bank', class: 'BANK', icon: '🏦' };
    return { text: provider || type || 'UPI', class: 'DEFAULT', icon: '💳' };
};

/* ─── Toast Component ───────────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fn-toast ${type}`}>
            {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message}</span>
        </div>
    );
};

/* ─── Add / Edit Modal Component ───────────────────────────────────────────── */
const PaymentMethodFormModal = ({ initial, functionId, onSubmit, onClose, submitting, lang }) => {
    const [form, setForm] = useState({
        name: initial?.name || '',
        method_type: initial?.method_type || 'UPI',
        provider: initial?.provider || 'GPay',
        upi_id: initial?.upi_id || '',
        is_active: initial?.is_active !== undefined ? initial.is_active : true,
        is_default: initial?.is_default || false,
        display_order: initial?.display_order || 0
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setForm(prev => ({ ...prev, [name]: val }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsed = paymentMethodSchema.safeParse(form);
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

    const isTa = lang === 'ta';

    return (
        <div className="fn-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="fn-modal" role="dialog" aria-modal="true">
                <div className="fn-modal-top">
                    <h2 className="fn-modal-title">
                        {initial
                            ? (isTa ? '✏️ பணம் பெறும் முறையைத் திருத்து' : '✏️ Edit Payment Method')
                            : (isTa ? '💳 பணம் பெறும் முறையைச் சேர்' : '💳 Add Payment Method')
                        }
                    </h2>
                    <button className="fn-modal-close" onClick={onClose} aria-label="Close">
                        <X size={15} />
                    </button>
                </div>

                <div className="fn-modal-body">
                    <form className="fn-form" onSubmit={handleSubmit} noValidate id="pm-form">

                        {/* Display Name */}
                        <div className="fn-field">
                            <label htmlFor="pm-name">
                                {isTa ? 'பெயர்' : 'Display Name'} <span className="required">*</span>
                            </label>
                            <input
                                id="pm-name"
                                className={`fn-input ${errors.name ? 'error' : ''}`}
                                type="text"
                                name="name"
                                placeholder={isTa ? 'எ.கா. GPay - Manoj' : 'e.g. GPay - Manoj'}
                                value={form.name}
                                onChange={handleChange}
                                maxLength={100}
                                autoFocus
                            />
                            {errors.name && <p className="fn-field-error"><AlertCircle size={12} />{errors.name}</p>}
                        </div>

                        {/* Method Type */}
                        <div className="fn-field">
                            <label htmlFor="pm-method-type">
                                {isTa ? 'வகை' : 'Payment Type'}
                            </label>
                            <select
                                id="pm-method-type"
                                className="fn-select"
                                name="method_type"
                                value={form.method_type}
                                onChange={handleChange}
                            >
                                <option value="UPI">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                                <option value="CASH">{isTa ? 'பணம் (Cash)' : 'Cash'}</option>
                                <option value="BANK_TRANSFER">{isTa ? 'வங்கி கணக்கு (Bank Transfer)' : 'Bank Transfer'}</option>
                                <option value="OTHER">{isTa ? 'மற்றவை (Other)' : 'Other'}</option>
                            </select>
                        </div>

                        {/* UPI Specific Fields */}
                        {form.method_type === 'UPI' && (
                            <>
                                <div className="fn-field">
                                    <label htmlFor="pm-provider">{isTa ? 'வழங்குநர் (Provider)' : 'Provider'}</label>
                                    <select
                                        id="pm-provider"
                                        className="fn-select"
                                        name="provider"
                                        value={form.provider}
                                        onChange={handleChange}
                                    >
                                        <option value="GPay">GPay (Google Pay)</option>
                                        <option value="PhonePe">PhonePe</option>
                                        <option value="Paytm">Paytm</option>
                                        <option value="BHIM">BHIM UPI</option>
                                        <option value="Other">Other UPI</option>
                                    </select>
                                </div>

                                <div className="fn-field">
                                    <label htmlFor="pm-upi-id">
                                        UPI ID <span className="required">*</span>
                                    </label>
                                    <input
                                        id="pm-upi-id"
                                        className={`fn-input ${errors.upi_id ? 'error' : ''}`}
                                        type="text"
                                        name="upi_id"
                                        placeholder="e.g. manoj@oksbi"
                                        value={form.upi_id}
                                        onChange={handleChange}
                                    />
                                    {errors.upi_id && <p className="fn-field-error"><AlertCircle size={12} />{errors.upi_id}</p>}
                                </div>
                            </>
                        )}

                        {/* Set as Default Checkbox */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.25rem' }}>
                            <input
                                id="pm-is-default"
                                type="checkbox"
                                name="is_default"
                                checked={form.is_default}
                                onChange={handleChange}
                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                            />
                            <label htmlFor="pm-is-default" style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                                {isTa ? 'முதன்மை கணக்காக வை (Set as Default)' : 'Set as Default Payment Method for this function'}
                            </label>
                        </div>

                    </form>
                </div>

                <div className="fn-modal-footer">
                    <button type="button" className="fn-btn-cancel" onClick={onClose}>
                        {isTa ? 'ரத்து' : 'Cancel'}
                    </button>
                    <button type="submit" form="pm-form" className="fn-btn-submit" disabled={submitting}>
                        {submitting
                            ? <><Loader2 size={14} className="pm-spin" /> {isTa ? 'சேமிக்கப்படுகிறது…' : 'Saving…'}</>
                            : <><CheckCircle2 size={14} /> {initial ? (isTa ? 'மாற்றங்களை சேமி' : 'Save Changes') : (isTa ? 'முறையைச் சேர்' : 'Add Payment Method')}</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Show QR Code Modal Component ─────────────────────────────────────────── */
const ShowQrModal = ({ method, onClose, lang }) => {
    const [amount, setAmount] = useState('');
    const qrContainerRef = useRef(null);

    const upiLink = `upi://pay?pa=${method.upi_id}&pn=${encodeURIComponent(method.provider || method.name)}&cu=INR${amount && !isNaN(amount) && Number(amount) > 0 ? '&am=' + amount : ''}`;

    const handleDownload = () => {
        const svgElement = qrContainerRef.current?.querySelector('svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 40;
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `UPI-QR-${method.name.replace(/\s+/g, '_')}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const isTa = lang === 'ta';

    return (
        <div className="fn-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="pm-qr-modal" role="dialog" aria-modal="true">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{method.name}</h3>
                    <button className="fn-modal-close" onClick={onClose}><X size={15} /></button>
                </div>

                <div className="pm-qr-box" ref={qrContainerRef}>
                    <QRCodeSVG
                        value={upiLink}
                        size={200}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <div style={{ width: '100%' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 700, color: '#1E3A8A', fontFamily: 'monospace' }}>
                        {method.upi_id}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                        {isTa ? 'மொய் அனுப்ப ஸ்கேன் செய்யவும்' : 'Scan to pay Moi contribution'}
                    </p>
                </div>

                {/* Optional prefilled amount field */}
                <div style={{ width: '100%', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        {isTa ? 'தொகை (விருப்பமானால்)' : 'Amount (Optional)'}
                    </label>
                    <input
                        className="pm-qr-amount-input"
                        type="number"
                        placeholder="e.g. 5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                    <button className="fn-btn-cancel" style={{ flex: 1 }} onClick={onClose}>
                        {isTa ? 'மூடு' : 'Close'}
                    </button>
                    <button className="fn-btn-submit" style={{ flex: 1.5 }} onClick={handleDownload}>
                        <Download size={14} /> {isTa ? 'QR பதிவிறக்கு' : 'Download QR'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Payment Methods Page ────────────────────────────────────────────── */
const PaymentMethodsPage = () => {
    const navigate = useNavigate();
    const { lang } = useApp();
    const isTa = lang === 'ta';

    const [functions, setFunctions] = useState([]);
    const [selectedFunctionId, setSelectedFunctionId] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    // 1. Fetch user's functions
    const fetchFunctionsList = useCallback(async () => {
        const res = await functionService.getFunctions();
        if (res.success && res.functions.length > 0) {
            setFunctions(res.functions);
            if (!selectedFunctionId) {
                setSelectedFunctionId(res.functions[0].id);
            }
        } else {
            setLoading(false);
        }
    }, [selectedFunctionId]);

    // 2. Fetch payment methods for selected function
    const fetchPaymentMethods = useCallback(async () => {
        if (!selectedFunctionId) return;
        setLoading(true);
        const res = await paymentMethodService.getPaymentMethodsByFunction(selectedFunctionId);
        if (res.success) {
            setPaymentMethods(res.paymentMethods);
        } else {
            showToast(res.error || 'Failed to load payment methods.', 'error');
        }
        setLoading(false);
    }, [selectedFunctionId]);

    useEffect(() => {
        fetchFunctionsList();
    }, [fetchFunctionsList]);

    useEffect(() => {
        if (selectedFunctionId) {
            fetchPaymentMethods();
        }
    }, [selectedFunctionId, fetchPaymentMethods]);

    // Handlers
    const handleCreateOrUpdate = async (formData) => {
        setSubmitting(true);
        if (editTarget) {
            const res = await paymentMethodService.updatePaymentMethod(editTarget.id, formData);
            setSubmitting(false);
            if (res.success) {
                setEditTarget(null);
                fetchPaymentMethods();
                showToast(isTa ? 'பணம் பெறும் முறை புதுப்பிக்கப்பட்டது!' : 'Payment method updated successfully!');
            } else {
                showToast(res.error || 'Failed to update payment method.', 'error');
            }
        } else {
            const res = await paymentMethodService.createPaymentMethod(selectedFunctionId, formData);
            setSubmitting(false);
            if (res.success) {
                setShowForm(false);
                fetchPaymentMethods();
                showToast(isTa ? 'பணம் பெறும் முறை சேர்க்கப்பட்டது! 🎉' : 'Payment method created successfully! 🎉');
            } else {
                showToast(res.error || 'Failed to create payment method.', 'error');
            }
        }
    };

    const handleToggleStatus = async (pm) => {
        const newStatus = !pm.is_active;
        const res = await paymentMethodService.togglePaymentMethodStatus(pm.id, newStatus);
        if (res.success) {
            fetchPaymentMethods();
            showToast(newStatus ? (isTa ? 'செயல்படுத்தப்பட்டது' : 'Payment method activated') : (isTa ? 'செயலிழக்கப்பட்டது' : 'Payment method deactivated'));
        } else {
            showToast(res.error || 'Failed to toggle status.', 'error');
        }
    };

    const handleSetDefault = async (pm) => {
        if (pm.is_default) return;
        const res = await paymentMethodService.setDefaultPaymentMethod(pm.id);
        if (res.success) {
            fetchPaymentMethods();
            showToast(isTa ? 'முதன்மை கணக்காக அமைக்கப்பட்டது' : 'Set as default payment method');
        } else {
            showToast(res.error || 'Failed to set default method.', 'error');
        }
    };

    const handleDelete = async (pm) => {
        if (!window.confirm(isTa ? 'இந்த முறையை நிச்சயமாக நீக்க வேண்டுமா?' : `Delete payment method "${pm.name}"?`)) return;
        const res = await paymentMethodService.deletePaymentMethod(pm.id);
        if (res.success) {
            fetchPaymentMethods();
            showToast(isTa ? 'நீக்கப்பட்டது' : 'Payment method deleted');
        } else {
            showToast(res.error || 'Failed to delete payment method.', 'error');
        }
    };

    return (
        <div className="pm-page">
            {/* Header */}
            <header className="pm-header">
                <div className="pm-header-left">
                    <h1>{isTa ? 'பணம் பெறும் முறைகள்' : 'Payment Methods'}</h1>
                    <p>{isTa ? 'உங்கள் விழாக்களுக்கான UPI மற்றும் மொய் பெறும் வழிகள்' : 'Configure how you receive Moi and gifts for your functions'}</p>
                </div>
            </header>

            {/* Function selector & Add button bar */}
            <div className="pm-function-bar">
                <div className="pm-function-select-group">
                    <label htmlFor="pm-select-function">{isTa ? 'விழாவைத் தேர்ந்தெடுக்கவும்:' : 'Function:'}</label>
                    <select
                        id="pm-select-function"
                        className="pm-function-select"
                        value={selectedFunctionId}
                        onChange={(e) => setSelectedFunctionId(e.target.value)}
                    >
                        {functions.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.event_date?.split('T')[0]})</option>
                        ))}
                    </select>
                </div>

                <button
                    className="pm-add-btn"
                    onClick={() => setShowForm(true)}
                    disabled={!selectedFunctionId}
                >
                    <Plus size={16} />
                    {isTa ? 'புதிய முறை சேர்க்க' : 'Add Payment Method'}
                </button>
            </div>

            {/* Content */}
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', color: '#64748B', gap: '8px' }}>
                    <Loader2 size={24} className="pm-spin" />
                    <span>{isTa ? 'ஏற்றுகிறது…' : 'Loading payment methods…'}</span>
                </div>
            )}

            {!loading && functions.length === 0 && (
                <div className="fn-state-box">
                    <div className="fn-state-emoji">🪔</div>
                    <h3 className="fn-state-title">{isTa ? 'விழாக்கள் இல்லை' : 'No functions found'}</h3>
                    <p className="fn-state-desc">{isTa ? 'பணம் பெறும் முறைகளை அமைக்க முதலில் ஒரு விழாவை உருவாக்கவும்.' : 'Please create a function first to configure payment methods.'}</p>
                    <button className="pm-add-btn" onClick={() => navigate('/functions')}>
                        {isTa ? 'விழா உருவாக்கு' : 'Go to Functions'}
                    </button>
                </div>
            )}

            {!loading && selectedFunctionId && paymentMethods.length === 0 && (
                <div className="fn-state-box">
                    <div className="fn-state-emoji">💳</div>
                    <h3 className="fn-state-title">{isTa ? 'பணம் பெறும் முறைகள் இல்லை' : 'No payment methods configured'}</h3>
                    <p className="fn-state-desc">{isTa ? 'இந்த விழாவிற்கு GPay, PhonePe, ரொக்கம் அல்லது வங்கி கணக்குகளைச் சேர்க்கவும்.' : 'Add GPay, PhonePe, Cash, or Bank Transfer to receive Moi for this function.'}</p>
                    <button className="pm-add-btn" onClick={() => setShowForm(true)}>
                        <Plus size={16} /> {isTa ? 'முறை சேர்க்க' : 'Add Payment Method'}
                    </button>
                </div>
            )}

            {!loading && paymentMethods.length > 0 && (
                <div className="pm-grid">
                    {paymentMethods.map(pm => {
                        const { text, class: iconClass, icon } = getProviderIcon(pm.provider, pm.method_type);
                        return (
                            <div key={pm.id} className={`pm-card ${!pm.is_active ? 'inactive' : ''}`}>
                                <div className="pm-card-top">
                                    <div className={`pm-provider-badge ${iconClass}`}>
                                        {icon}
                                    </div>
                                    <div className="pm-card-info">
                                        <h3 className="pm-card-title" title={pm.name}>{pm.name}</h3>
                                        {pm.method_type === 'UPI' && pm.upi_id && (
                                            <span className="pm-card-upi">{pm.upi_id}</span>
                                        )}
                                        {pm.method_type !== 'UPI' && (
                                            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                                                {pm.method_type === 'CASH' ? (isTa ? 'நேரடி பணம்' : 'Physical Cash') : pm.method_type}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pm-badges-row">
                                    {pm.is_default && (
                                        <span className="pm-pill default">★ {isTa ? 'முதன்மை' : 'Default'}</span>
                                    )}
                                    <span className={`pm-pill ${pm.is_active ? 'active' : 'inactive'}`}>
                                        {pm.is_active ? (isTa ? 'செயலில்' : 'Active') : (isTa ? 'செயலிழந்தது' : 'Inactive')}
                                    </span>
                                    <span className="pm-pill type">{pm.method_type}</span>
                                </div>

                                <div className="pm-card-actions">
                                    {pm.method_type === 'UPI' && pm.upi_id && (
                                        <button className="pm-btn qr" onClick={() => setQrTarget(pm)}>
                                            <QrCode size={14} /> {isTa ? 'QR காட்டு' : 'Show QR'}
                                        </button>
                                    )}
                                    {!pm.is_default && pm.is_active && (
                                        <button className="pm-btn star" onClick={() => handleSetDefault(pm)} title="Set as default">
                                            <Star size={14} /> {isTa ? 'முதன்மை' : 'Default'}
                                        </button>
                                    )}
                                    <button className="pm-btn" onClick={() => setEditTarget(pm)}>
                                        <Pencil size={13} /> {isTa ? 'திருத்து' : 'Edit'}
                                    </button>
                                    <button className="pm-btn" onClick={() => handleToggleStatus(pm)}>
                                        <Power size={13} /> {pm.is_active ? (isTa ? 'நிறுத்து' : 'Deactivate') : (isTa ? 'இயக்கு' : 'Activate')}
                                    </button>
                                    <button className="pm-btn danger" onClick={() => handleDelete(pm)}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {showForm && (
                <PaymentMethodFormModal
                    functionId={selectedFunctionId}
                    onSubmit={handleCreateOrUpdate}
                    onClose={() => setShowForm(false)}
                    submitting={submitting}
                    lang={lang}
                />
            )}

            {editTarget && (
                <PaymentMethodFormModal
                    initial={editTarget}
                    functionId={selectedFunctionId}
                    onSubmit={handleCreateOrUpdate}
                    onClose={() => setEditTarget(null)}
                    submitting={submitting}
                    lang={lang}
                />
            )}

            {qrTarget && (
                <ShowQrModal
                    method={qrTarget}
                    onClose={() => setQrTarget(null)}
                    lang={lang}
                />
            )}

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

export default PaymentMethodsPage;
