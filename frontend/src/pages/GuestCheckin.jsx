import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, User, Phone, Heart, IndianRupee, CheckCircle2, ChevronDown, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { paymentMethodService } from '../services/paymentMethodService';

const GuestCheckin = () => {
    const { hostSettings, addPendingEntry } = useApp();
    const params = new URLSearchParams(window.location.search);
    const fnId = params.get('fnId');
    const fnName = decodeURIComponent(params.get('fnName') || 'VizhaBook Event');

    const [activePaymentMethods, setActivePaymentMethods] = useState([]);
    const [selectedUpiId, setSelectedUpiId] = useState('');

    const [formData, setFormData] = useState({
        guestName: '',
        phone: '',
        relation: 'Relative',
        giftType: 'Cash',
        paymentMode: 'Cash', // Cash or UPI
        amount: '',
        utr: '',
        description: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Fetch live function payment methods from PostgreSQL database API
    useEffect(() => {
        if (!fnId) return;
        const fetchFunctionPaymentMethods = async () => {
            try {
                const res = await paymentMethodService.getPaymentMethodsByFunction(fnId);
                if (res.success && res.paymentMethods && res.paymentMethods.length > 0) {
                    const activeOnly = res.paymentMethods.filter(pm => pm.is_active);
                    setActivePaymentMethods(activeOnly);
                    const firstUpi = activeOnly.find(pm => pm.upi_id || pm.details?.upi_id);
                    if (firstUpi) {
                        setSelectedUpiId((firstUpi.upi_id || firstUpi.details?.upi_id || '').trim());
                    }
                }
            } catch (err) {
                console.warn('GuestCheckin payment methods sync error:', err.message);
            }
        };
        fetchFunctionPaymentMethods();
    }, [fnId]);

    // Sanitize Payee Name and VPA Handle according to NPCI URI specs
    const cleanPn = fnName.replace(/['"&%#]/g, '').trim() || 'VizhaBook Host';
    const rawVpa = selectedUpiId || (activePaymentMethods[0] && activePaymentMethods[0].upi_id) || hostSettings?.upiId || '';
    const cleanVpa = (rawVpa && rawVpa !== 'vizhabook@okhdfcbank' ? rawVpa : 'gauthamtamizha007-1@oksbi').trim();
    const formattedAmount = Number(formData.amount || 0);

    // Standard Universal NPCI UPI URI
    const upiString = `upi://pay?pa=${cleanVpa}&pn=${encodeURIComponent(cleanPn)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent('VizhaBook Moi Gift')}`;

    const validate = () => {
        const e = {};
        if (!formData.guestName.trim()) e.guestName = 'பெயர் தேவை / Name required';
        if (formData.giftType === 'Cash' && (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0))
            e.amount = 'சரியான தொகை / Valid amount required';
        if (formData.giftType === 'Cash' && formData.paymentMode === 'UPI' && !formData.utr.trim())
            e.utr = 'UTR எண் தேவை / UTR number required';
        if (formData.giftType !== 'Cash' && !formData.description.trim())
            e.description = 'விளக்கம் தேவை / Description required';
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setSubmitting(true);

        addPendingEntry({
            ...formData,
            functionId: fnId,
            functionName: fnName,
            upiId: formData.paymentMode === 'UPI' ? cleanVpa : null,
            paymentMode: formData.giftType === 'Cash' ? formData.paymentMode : null,
            utr: formData.paymentMode === 'UPI' ? formData.utr : null,
            transactionReference: formData.paymentMode === 'UPI' ? formData.utr : null,
            entrySource: 'qr_checkin',
            amount: formData.giftType === 'Cash' ? parseFloat(formData.amount) : 0
        });

        setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 800);
    };

    const inputStyle = (err) => ({
        width: '100%',
        padding: '0.875rem 1rem',
        borderRadius: '0.875rem',
        border: `2px solid ${err ? '#EF4444' : 'rgba(30, 58, 138, 0.15)'}`,
        background: 'rgba(255,255,255,0.9)',
        fontSize: '1rem',
        color: '#0F172A',
        outline: 'none',
        transition: 'border-color 0.2s'
    });

    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0F172A, #1E3A8A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '2rem',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        maxWidth: '400px',
                        width: '100%'
                    }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <CheckCircle2 size={72} color="#10B981" style={{ margin: '0 auto 1.5rem' }} />
                    </motion.div>
                    <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', fontFamily: "'Playfair Display', serif" }}>
                        நன்றி! 🙏
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        Thank you, <strong style={{ color: 'white' }}>{formData.guestName}</strong>!
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        Your gift entry has been submitted for verification. The host will confirm it shortly.
                    </p>
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '1rem', padding: '1rem', marginTop: '1.5rem'
                    }}>
                        <p style={{ color: '#10B981', fontWeight: 700, margin: 0 }}>
                            {formData.giftType === 'Cash' ? `₹${Number(formData.amount).toLocaleString('en-IN')}` : formData.description}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{fnName}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 150 }}
                style={{
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(25px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '2rem',
                    padding: '2.5rem 1.5rem',
                    width: '100%',
                    maxWidth: '420px',
                    margin: 'auto'
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/logo.png" alt="Vizha Book" style={{ height: '48px', marginBottom: '1rem' }} />
                    <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 900, fontFamily: "'Playfair Display', serif", marginBottom: '0.25rem' }}>
                        மொய் பதிவு
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{fnName}</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Guest Name */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                            👤 உங்கள் பெயர் / Your Name *
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Karthik"
                            style={inputStyle(errors.guestName)}
                            value={formData.guestName}
                            onChange={e => { setFormData({ ...formData, guestName: e.target.value }); setErrors({ ...errors, guestName: '' }); }}
                        />
                        {errors.guestName && <p style={{ color: '#FCA5A5', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.guestName}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                            📱 Mobile (Optional)
                        </label>
                        <input
                            type="tel"
                            placeholder="9876543210"
                            style={inputStyle(false)}
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    {/* Relation */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                            ❤️ உறவு / Relation
                        </label>
                        <select
                            style={{ ...inputStyle(false), cursor: 'pointer' }}
                            value={formData.relation}
                            onChange={e => setFormData({ ...formData, relation: e.target.value })}
                        >
                            <option value="Relative">உறவினர் / Relative</option>
                            <option value="Friend">நண்பர் / Friend</option>
                            <option value="Colleague">சக பணியாளர் / Colleague</option>
                            <option value="Neighbour">அண்டை வீட்டார் / Neighbour</option>
                        </select>
                    </div>

                    {/* Gift Type */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                            🎁 பரிசு வகை / Gift Type
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {['Cash', 'Jewel', 'Gift Item'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, giftType: type, amount: '', description: '' })}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        border: formData.giftType === type ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                        background: formData.giftType === type ? 'linear-gradient(135deg, #0F172A, #1E3A8A)' : 'rgba(255,255,255,0.08)',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        boxShadow: formData.giftType === type ? '0 4px 15px rgba(30,58,138,0.5)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >{type}</button>
                            ))}
                        </div>
                    </div>

                    {/* Amount or Description */}
                    {formData.giftType === 'Cash' ? (
                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                                💰 தொகை / Amount (₹) *
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                min="1"
                                style={{ ...inputStyle(errors.amount), fontSize: '1.5rem', textAlign: 'center', fontWeight: 800 }}
                                value={formData.amount}
                                onChange={e => { setFormData({ ...formData, amount: e.target.value }); setErrors({ ...errors, amount: '' }); }}
                            />
                            {errors.amount && <p style={{ color: '#FCA5A5', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.amount}</p>}

                            {/* Payment Mode (Cash / UPI) */}
                            <div style={{ marginTop: '1.25rem' }}>
                                <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                                    💳 செலுத்தும் முறை / Payment Mode
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {['Cash', 'UPI'].map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMode: mode })}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '0.75rem',
                                                border: formData.paymentMode === mode ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                                background: formData.paymentMode === mode ? (mode === 'UPI' ? '#8B5CF6' : '#10B981') : 'rgba(255,255,255,0.08)',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.4rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {mode === 'UPI' ? <QrCode size={16} /> : <IndianRupee size={16} />}
                                            {mode === 'Cash' ? 'பணம் / Cash' : 'UPI (GPay/PhonePe)'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* UPI Verification Section */}
                            <AnimatePresence>
                                {formData.paymentMode === 'UPI' && formData.amount > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ marginTop: '1.25rem', overflow: 'hidden' }}
                                    >
                                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center', marginBottom: '1rem', border: '2px solid #E5E7EB' }}>
                                            
                                            {/* Function UPI Selector */}
                                            {activePaymentMethods.length > 1 && (
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Select Host UPI Account</label>
                                                    <select
                                                        value={selectedUpiId}
                                                        onChange={(e) => setSelectedUpiId(e.target.value)}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', marginTop: '4px', fontWeight: 700 }}
                                                    >
                                                        {activePaymentMethods.map((pm, idx) => (
                                                            <option key={idx} value={pm.upi_id}>{pm.display_name || pm.name} ({pm.upi_id})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <p style={{ color: '#4B5563', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                1-Click Direct Mobile Pay ₹{Number(formData.amount).toLocaleString('en-IN')}
                                            </p>

                                            {/* DIRECT 1-CLICK UPI APP LAUNCH BUTTONS */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                                <a 
                                                    href={upiString}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                                        background: 'linear-gradient(135deg, #1A73E8 0%, #1557B0 100%)', color: 'white',
                                                        padding: '0.95rem 1.25rem', borderRadius: '1rem', fontWeight: 800,
                                                        textDecoration: 'none', fontSize: '0.95rem', boxShadow: '0 4px 14px rgba(26, 115, 232, 0.35)'
                                                    }}
                                                >
                                                    <img src="https://www.gstatic.com/images/branding/product/1x/gpay_32dp.png" alt="GPay" style={{ height: '22px' }} />
                                                    Pay ₹{Number(formData.amount).toLocaleString('en-IN')} with Google Pay
                                                </a>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    <a 
                                                        href={upiString}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                            background: '#5F259F', color: 'white', padding: '0.75rem',
                                                            borderRadius: '0.75rem', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        🟣 PhonePe
                                                    </a>

                                                    <a 
                                                        href={upiString}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                            background: '#00BAF2', color: 'white', padding: '0.75rem',
                                                            borderRadius: '0.75rem', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        🔷 Paytm
                                                    </a>
                                                </div>
                                            </div>

                                            {/* High Res SVG QR Code for Desk Scans */}
                                            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #E2E8F0' }}>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>Or scan QR code from another device:</p>
                                                <div style={{ display: 'inline-block', padding: '0.75rem', background: 'white', border: '1px solid #E5E7EB', borderRadius: '1rem' }}>
                                                    <QRCodeSVG 
                                                        value={upiString} 
                                                        size={150} 
                                                        level="H"
                                                        imageSettings={{
                                                            src: "https://www.gstatic.com/images/branding/product/1x/gpay_64dp.png",
                                                            x: undefined,
                                                            y: undefined,
                                                            height: 26,
                                                            width: 26,
                                                            excavate: true,
                                                        }}
                                                    />
                                                </div>
                                                <p style={{ color: '#1E3A8A', fontSize: '0.78rem', fontWeight: 800, marginTop: '6px', fontFamily: 'monospace' }}>
                                                    Payee UPI: {cleanVpa}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                                                🧾 UTR / Transaction No. *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter 12-digit UTR number"
                                                style={inputStyle(errors.utr)}
                                                value={formData.utr}
                                                onChange={e => { setFormData({ ...formData, utr: e.target.value }); setErrors({ ...errors, utr: '' }); }}
                                            />
                                            {errors.utr && <p style={{ color: '#FCA5A5', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.utr}</p>}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                                📝 விளக்கம் / Description *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Gold chain, Saree..."
                                style={inputStyle(errors.description)}
                                value={formData.description}
                                onChange={e => { setFormData({ ...formData, description: e.target.value }); setErrors({ ...errors, description: '' }); }}
                            />
                            {errors.description && <p style={{ color: '#FCA5A5', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.description}</p>}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '1rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            marginTop: '0.5rem',
                            boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                            transition: 'all 0.2s',
                            opacity: submitting ? 0.7 : 1
                        }}
                    >
                        {submitting ? 'சமர்ப்பிக்கிறது… / Submitting...' : '🎁 மொய் பதிவு செய் / SUBMIT MOI'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default GuestCheckin;
