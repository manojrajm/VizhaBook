import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Wallet, Send, User, Calendar, MessageCircle, CheckCircle2, MessageSquare, Mic, MicOff, AlertTriangle, Zap, CreditCard, Hash, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import useSubscription from '../hooks/useSubscription';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MOCK_FUNCTIONS } from '../utils/mockData';
import { TRANSLATIONS } from '../utils/translations';
import GreetingCard from '../components/ui/GreetingCard';
import { sendWhatsAppMessage, sendSMSMessage } from '../utils/communication';
import paymentMethodService from '../services/paymentMethodService';
import moiService from '../services/moiService';
import functionService from '../services/functionService';

const MoiEntry = () => {
    const navigate = useNavigate();
    const { functions, addEntry, addGuest, lang } = useApp();
    const { canCreateEntry, isExpired, entryLimit } = useSubscription();
    const t = TRANSLATIONS[lang];

    const [showLimitModal, setShowLimitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
    const [entrySource, setEntrySource] = useState('manual');
    const [realFunctions, setRealFunctions] = useState([]);

    const [formData, setFormData] = useState({
        guestName: '',
        phone: '',
        relation: 'Relative',
        functionId: '',
        amount: '',
        giftType: 'Cash',
        description: '',
        paymentMethodId: '',
        paymentMode: 'Cash',
        transactionReference: ''
    });

    const [success, setSuccess] = useState(false);
    const [lastAdded, setLastAdded] = useState(null);
    const [isListening, setIsListening] = useState(false);

    // Fetch user functions from PostgreSQL backend
    useEffect(() => {
        const fetchUserFunctions = async () => {
            const res = await functionService.getFunctions();
            if (res.success && res.functions && res.functions.length > 0) {
                setRealFunctions(res.functions);
            } else if (functions && functions.length > 0) {
                setRealFunctions(functions);
            }
        };
        fetchUserFunctions();
    }, [functions]);

    const displayFunctions = realFunctions.length ? realFunctions : (functions.length ? functions : MOCK_FUNCTIONS);

    // Auto-select first function if none selected
    useEffect(() => {
        if (!formData.functionId && displayFunctions.length > 0) {
            setFormData(prev => ({ ...prev, functionId: String(displayFunctions[0].id) }));
        }
    }, [displayFunctions, formData.functionId]);

    // Fetch payment methods when functionId changes
    useEffect(() => {
        if (!formData.functionId) {
            setAvailablePaymentMethods([]);
            return;
        }
        const fetchMethods = async () => {
            const res = await paymentMethodService.getPaymentMethodsByFunction(formData.functionId);
            if (res.success && res.paymentMethods) {
                const activeOnly = res.paymentMethods.filter(pm => pm.is_active);
                setAvailablePaymentMethods(activeOnly);
                const defaultPm = activeOnly.find(pm => pm.is_default) || activeOnly[0];
                if (defaultPm) {
                    setFormData(prev => ({
                        ...prev,
                        paymentMethodId: defaultPm.id,
                        paymentMode: defaultPm.method_type === 'UPI' ? 'UPI' : (defaultPm.method_type === 'CASH' ? 'Cash' : defaultPm.method_type)
                    }));
                }
            }
        };
        fetchMethods();
    }, [formData.functionId]);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert(lang === 'en' ? 'Speech recognition is not supported in this browser.' : 'உங்கள் பிரவுசரில் குரல் பதிவு வசதி இல்லை.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = lang === 'en' ? 'en-IN' : 'ta-IN';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e) => {
            console.error('Speech recognition error', e);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            parseTranscript(transcript);
        };

        recognition.start();
    };

    const parseTranscript = (text) => {
        let newName = formData.guestName;
        let newAmount = formData.amount;
        let newRelation = formData.relation;
        let matchedPmId = formData.paymentMethodId;
        let matchedMode = formData.paymentMode;

        // Set entry source to voice
        setEntrySource('voice');

        // Extract amount (numbers)
        const amountMatch = text.match(/\d+/);
        if (amountMatch) {
            newAmount = amountMatch[0];
            text = text.replace(newAmount, '').trim();
        } else {
            if (text.includes('thousand') || text.includes('ஆயிரம்')) newAmount = '1000';
            else if (text.includes('five hundred') || text.includes('ஐநூறு')) newAmount = '500';
            else if (text.includes('two thousand') || text.includes('இரண்டாயிரம்')) newAmount = '2000';
            else if (text.includes('ten thousand') || text.includes('பத்தாயிரம்')) newAmount = '10000';
        }

        // Detect payment methods from speech
        if (text.includes('gpay') || text.includes('google pay') || text.includes('ஜிபே') || text.includes('ஜி பே')) {
            const pm = availablePaymentMethods.find(m => (m.provider || '').toLowerCase().includes('gpay') || m.name.toLowerCase().includes('gpay'));
            if (pm) { matchedPmId = pm.id; matchedMode = 'UPI'; }
            text = text.replace(/gpay|google pay|ஜிபே|ஜி பே/gi, '').trim();
        } else if (text.includes('phonepe') || text.includes('போன்பே') || text.includes('போன் பே')) {
            const pm = availablePaymentMethods.find(m => (m.provider || '').toLowerCase().includes('phonepe') || m.name.toLowerCase().includes('phonepe'));
            if (pm) { matchedPmId = pm.id; matchedMode = 'UPI'; }
            text = text.replace(/phonepe|போன்பே|போன் பே/gi, '').trim();
        } else if (text.includes('cash') || text.includes('கேஷ்') || text.includes('பணம்') || text.includes('ரொக்கம்')) {
            const pm = availablePaymentMethods.find(m => m.method_type === 'CASH');
            if (pm) { matchedPmId = pm.id; matchedMode = 'Cash'; }
            text = text.replace(/cash|கேஷ்|பணம்|ரொக்கம்/gi, '').trim();
        }

        // Detect relation
        const relMap = {
            'uncle': 'Relative', 'mama': 'Relative', 'chithappa': 'Relative', 'periyappa': 'Relative', 'மாமா': 'Relative', 'சித்தப்பா': 'Relative', 'பெரியப்பா': 'Relative',
            'friend': 'Friend', 'நண்பர்': 'Friend', 'nanban': 'Friend',
            'colleague': 'Colleague', 'office': 'Colleague', 'ஆபீஸ்': 'Colleague',
            'neighbor': 'Neighbor', 'pakkathu': 'Neighbor', 'பக்கத்து': 'Neighbor'
        };

        for (const [key, val] of Object.entries(relMap)) {
            if (text.includes(key)) {
                newRelation = val;
                text = text.replace(new RegExp(key, 'gi'), '').trim();
                break;
            }
        }

        const cleanName = text.replace(/rupees|rubai|ரூபாய்|hundred|thousand|oru|oru rubai/gi, '').trim();
        if (cleanName.length > 1) {
            newName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }

        setFormData(prev => ({
            ...prev,
            guestName: newName || prev.guestName,
            amount: newAmount || prev.amount,
            relation: newRelation,
            giftType: newAmount ? 'Cash' : prev.giftType,
            paymentMethodId: matchedPmId,
            paymentMode: matchedMode
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isExpired) {
            navigate('/subscription/expired');
            return;
        }
        if (!canCreateEntry) {
            setShowLimitModal(true);
            return;
        }

        setSubmitting(true);

        const selectedPm = availablePaymentMethods.find(pm => pm.id === formData.paymentMethodId);
        const resolvedMode = selectedPm ? (selectedPm.method_type === 'UPI' ? 'UPI' : (selectedPm.method_type === 'CASH' ? 'Cash' : selectedPm.method_type)) : formData.paymentMode;

        const payload = {
            functionId: formData.functionId,
            guestName: formData.guestName,
            villageCity: '',
            phone: formData.phone,
            relation: formData.relation,
            amount: formData.giftType === 'Cash' ? (parseFloat(formData.amount) || 0) : 0,
            giftItem: formData.giftType,
            giftType: formData.giftType,
            paymentMode: resolvedMode,
            paymentMethodId: formData.paymentMethodId || null,
            entrySource: entrySource || 'manual',
            transactionReference: formData.transactionReference || null
        };

        const res = await moiService.createMoiEntry(payload);
        setSubmitting(false);

        if (res.success) {
            const func = displayFunctions.find(f => String(f.id) === String(formData.functionId));
            const entryForCard = {
                ...res.entry,
                guestName: formData.guestName,
                functionName: func ? func.name : 'Unknown',
                phone: formData.phone,
                amount: payload.amount,
                description: formData.description || formData.giftType
            };

            addEntry(entryForCard);
            setLastAdded(entryForCard);

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F59E0B', '#10B981', '#3B82F6']
            });

            setSuccess(true);
            setFormData(prev => ({
                ...prev,
                guestName: '',
                phone: '',
                amount: '',
                description: '',
                transactionReference: ''
            }));
            setEntrySource('manual');
        } else if (res.limitReached) {
            setShowLimitModal(true);
        } else {
            alert(res.error || 'Failed to save Moi entry.');
        }
    };

    const isTa = lang === 'ta';

    return (
        <div className="animate-fade" style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0 3rem' }}>
            {success && lastAdded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '4rem', height: '4rem', background: '#DCFCE7', color: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>{isTa ? 'மொய் பதிவு செய்யப்பட்டது!' : 'Entry Recorded!'}</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{isTa ? 'உங்கள் மொய்ப் பதிவு வெற்றியடைந்தது.' : 'Your gift entry has been saved successfully.'}</p>
                    </div>

                    <GreetingCard
                        guestName={lastAdded.guestName}
                        amount={lastAdded.amount > 0 ? lastAdded.amount : lastAdded.description}
                        functionName={lastAdded.functionName}
                        lang={lang}
                        familyLead={displayFunctions.find(f => String(f.id) === String(lastAdded.functionId))?.host || lastAdded.functionName}
                        phone={lastAdded.phone}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                        <button
                            onClick={() => sendWhatsAppMessage(lastAdded, lang)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', background: '#25D366', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)' }}
                        >
                            <MessageCircle size={20} />
                            WhatsApp
                        </button>
                        <button
                            onClick={() => sendSMSMessage(lastAdded, lang)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)' }}
                        >
                            <MessageSquare size={20} />
                            SMS Auto-Send
                        </button>
                    </div>

                    <button onClick={() => setSuccess(false)} style={{ width: '100%', height: '3.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                        {isTa ? 'மற்றொரு பதிவைச் சேர்க்க' : 'Add Another Entry'}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <header style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            marginBottom: '0.4rem',
                            color: '#0F172A',
                            fontFamily: "'Playfair Display', serif"
                        }}>
                            {isTa ? 'மொய் பதிவு' : 'Moi Entry'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{isTa ? 'விழாவில் பெறப்பட்ட பணம் மற்றும் பரிசுகளைப் பதிவு செய்யவும்' : 'Record gifts and money presented by your guests'}</p>
                    </header>

                    <Card glass={true} style={{
                        padding: '2rem',
                        borderRadius: '1.5rem',
                        boxShadow: '0 8px 30px rgba(15,23,42,0.06)'
                    }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>

                            {/* SELECT FUNCTION */}
                            <div className="form-group">
                                <label className="form-label">{isTa ? 'விழாவைத் தேர்ந்தெடுக்கவும்' : 'Select Function'}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
                                    value={formData.functionId}
                                    onChange={(e) => setFormData({ ...formData, functionId: e.target.value })}
                                >
                                    <option value="">{isTa ? '-- விழாவைத் தேர்வு செய் --' : '-- Choose function --'}</option>
                                    {displayFunctions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>

                            {/* GUEST NAME WITH VOICE BUTTON */}
                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label className="form-label" style={{ margin: 0 }}>{isTa ? 'விருந்தினர் பெயர்' : 'Guest Name'}</label>
                                    <button
                                        type="button"
                                        onClick={startListening}
                                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: isListening ? '#EF4444' : '#1D4ED8', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700 }}
                                    >
                                        {isListening ? <MicOff size={14} className="animate-pulse" /> : <Mic size={14} />}
                                        {isListening ? (isTa ? 'கேட்கிறது...' : 'Listening...') : (isTa ? 'குரல் வழி பதிவு' : 'Tap to Speak')}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder={isTa ? 'எ.கா. குமார்' : 'e.g. Kumar'}
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF' }}
                                    value={formData.guestName}
                                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                                />
                            </div>

                            {/* PHONE & RELATION */}
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">{isTa ? 'கைபேசி எண் (விருப்பம்)' : 'Mobile Number (Optional)'}</label>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF' }}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">{isTa ? 'உறவு முறை' : 'Relation'}</label>
                                    <select
                                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF' }}
                                        value={formData.relation}
                                        onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                    >
                                        <option value="Relative">{isTa ? 'உறவினர்' : 'Relative'}</option>
                                        <option value="Friend">{isTa ? 'நண்பர்' : 'Friend'}</option>
                                        <option value="Colleague">{isTa ? 'சக பணியாளர்' : 'Colleague'}</option>
                                        <option value="Neighbor">{isTa ? 'அண்டை வீட்டார்' : 'Neighbor'}</option>
                                    </select>
                                </div>
                            </div>

                            {/* GIFT TYPE */}
                            <div className="form-group">
                                <label className="form-label">{isTa ? 'பரிசு வகை' : 'Gift Type'}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    {['Cash', 'Jewel', 'Gift Item'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, giftType: type })}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '0.75rem',
                                                border: formData.giftType === type ? 'none' : '1px solid var(--border-color)',
                                                background: formData.giftType === type ? 'linear-gradient(135deg, #1E3A8A, #1e40af)' : '#FFFFFF',
                                                color: formData.giftType === type ? 'white' : 'var(--text-secondary)',
                                                fontWeight: 800,
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {type === 'Cash' ? (isTa ? 'பணம்' : 'Cash') : type === 'Jewel' ? (isTa ? 'நகை' : 'Jewel') : (isTa ? 'பொருள்' : 'Gift Item')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* AMOUNT / DESCRIPTION */}
                            {formData.giftType === 'Cash' ? (
                                <div className="form-group">
                                    <label className="form-label">{isTa ? 'தொகை (₹)' : 'Amount (₹)'}</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        style={{ width: '100%', padding: '0.9rem', borderRadius: '0.75rem', border: '2px solid #D97706', fontSize: '2rem', textAlign: 'center', fontWeight: 800, background: '#FFFFFF', color: '#0F172A' }}
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">{isTa ? 'விவரம்' : 'Description'}</label>
                                    <textarea
                                        required
                                        placeholder={isTa ? 'எ.கா. 24ct தங்கச் செயின்' : 'e.g. 24ct Gold Chain'}
                                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', height: '4.5rem', resize: 'none', background: '#FFFFFF' }}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* PAYMENT METHOD SELECTION */}
                            {formData.giftType === 'Cash' && availablePaymentMethods.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{isTa ? 'பணம் பெற்ற முறை' : 'How did they pay?'}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700 }}>
                                            {isTa ? 'கட்டண கணக்கு' : 'Payment Account'}
                                        </span>
                                    </label>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.65rem' }}>
                                        {availablePaymentMethods.map(pm => {
                                            const isSelected = formData.paymentMethodId === pm.id;
                                            return (
                                                <div
                                                    key={pm.id}
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        paymentMethodId: pm.id,
                                                        paymentMode: pm.method_type === 'UPI' ? 'UPI' : (pm.method_type === 'CASH' ? 'Cash' : pm.method_type)
                                                    })}
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: '0.75rem',
                                                        border: isSelected ? '2px solid #1E3A8A' : '1px solid #E2E8F0',
                                                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '2px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{pm.name}</span>
                                                        {pm.is_default && <span style={{ fontSize: '0.6rem', color: '#B45309', fontWeight: 800 }}>★</span>}
                                                    </div>
                                                    {pm.upi_id && (
                                                        <span style={{ fontSize: '0.7rem', color: '#1E3A8A', fontFamily: 'monospace' }}>{pm.upi_id}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* TRANSACTION REFERENCE / UTR */}
                            {formData.giftType === 'Cash' && (
                                <div className="form-group">
                                    <label className="form-label">{isTa ? 'பரிவர்த்தனை எண் / UTR (விருப்பம்)' : 'Transaction Reference / UTR (Optional)'}</label>
                                    <input
                                        type="text"
                                        placeholder={isTa ? 'எ.கா. UPI123456789' : 'e.g. UPI123456789 or UTR'}
                                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF' }}
                                        value={formData.transactionReference}
                                        onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: '100%',
                                    padding: '1.15rem',
                                    borderRadius: '0.875rem',
                                    fontSize: '1.15rem',
                                    fontWeight: 800,
                                    marginTop: '0.5rem',
                                    background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 10px 25px rgba(30, 58, 138, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {submitting ? <Loader2 size={20} className="pm-spin" /> : null}
                                {submitting ? (isTa ? 'பதிவு செய்யப்படுகிறது…' : 'Recording…') : (isTa ? 'மொய்ப் பதிவு செய்' : 'RECORD MOI')}
                            </button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Limit Modal */}
            {showLimitModal && (
                <div className="sub-modal-overlay">
                    <div className="sub-modal-box">
                        <div className="modal-icon-alert">
                            <AlertTriangle size={42} color="#FBBF24" />
                        </div>
                        <h3>Moi Entry Limit Reached</h3>
                        <p>
                            Your current plan allows <strong>{entryLimit}</strong> total Moi & Gift entries. Upgrade your plan to continue recording entries for your events.
                        </p>

                        <div className="modal-btn-row">
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => setShowLimitModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-settings-primary"
                                style={{ flex: 1, height: '44px', justifyContent: 'center' }}
                                onClick={() => { setShowLimitModal(false); navigate('/pricing'); }}
                            >
                                <Zap size={16} />
                                <span>Upgrade Plan</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoiEntry;
