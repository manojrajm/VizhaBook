import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gift, Wallet, Send, User, Calendar, MessageCircle, CheckCircle2,
    MessageSquare, Mic, MicOff, AlertTriangle, Zap, CreditCard, Hash,
    QrCode, DollarSign, Clock, Sparkles, X, Check, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
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

    // Live Payment QR Modal State
    const [showQrModal, setShowQrModal] = useState(false);
    const [pendingQrPayload, setPendingQrPayload] = useState(null);

    const [formData, setFormData] = useState({
        guestName: '',
        phone: '',
        relation: 'Relative',
        functionId: '',
        amount: '',
        giftType: 'Cash',
        description: '',
        paymentMethodId: '', // '' = Physical Hard Cash, or specific pm_id for UPI
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

        setEntrySource('voice');

        // Extract amount (Numeric or Tamil words)
        const amountMatch = text.match(/\d+/);
        if (amountMatch) {
            newAmount = amountMatch[0];
            text = text.replace(newAmount, '').trim();
        } else {
            if (text.includes('lakh') || text.includes('லட்சம்')) newAmount = '100000';
            else if (text.includes('fifty thousand') || text.includes('ஐம்பதாயிரம்') || text.includes('அம்பதாயிரம்')) newAmount = '50000';
            else if (text.includes('twenty thousand') || text.includes('இருபதாயிரம்')) newAmount = '20000';
            else if (text.includes('ten thousand') || text.includes('பத்தாயிரம்')) newAmount = '10000';
            else if (text.includes('five thousand') || text.includes('ஐயாயிரம்')) newAmount = '5000';
            else if (text.includes('two thousand') || text.includes('இரண்டாயிரம்')) newAmount = '2000';
            else if (text.includes('thousand') || text.includes('ஆயிரம்')) newAmount = '1000';
            else if (text.includes('five hundred') || text.includes('ஐநூறு')) newAmount = '500';
        }

        // Detect payment method / Hard Cash from speech
        if (text.includes('hard cash') || text.includes('physical cash') || text.includes('கையில காசு') || text.includes('நேரடி பணம்') || text.includes('பணம்') || text.includes('ரொக்கம்')) {
            matchedPmId = '';
            matchedMode = 'Cash';
            text = text.replace(/hard cash|physical cash|கையில காசு|நேரடி பணம்|பணம்|ரொக்கம்/gi, '').trim();
        } else if (text.includes('gpay') || text.includes('google pay') || text.includes('ஜிபே') || text.includes('ஜி பே')) {
            const pm = availablePaymentMethods.find(m => (m.provider || '').toLowerCase().includes('gpay') || (m.display_name || m.name || '').toLowerCase().includes('gpay'));
            if (pm) { matchedPmId = pm.id; matchedMode = 'UPI'; }
            text = text.replace(/gpay|google pay|ஜிபே|ஜி பே/gi, '').trim();
        } else if (text.includes('phonepe') || text.includes('போன்பே') || text.includes('போன் பே')) {
            const pm = availablePaymentMethods.find(m => (m.provider || '').toLowerCase().includes('phonepe') || (m.display_name || m.name || '').toLowerCase().includes('phonepe'));
            if (pm) { matchedPmId = pm.id; matchedMode = 'UPI'; }
            text = text.replace(/phonepe|போன்பே|போன் பே/gi, '').trim();
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

    // Helper: Execute backend save API
    const saveEntryToBackend = async (payload, isPending = false) => {
        setSubmitting(true);
        const finalPayload = {
            ...payload,
            status: isPending ? 'PENDING_APPROVAL' : 'CONFIRMED'
        };

        const res = await moiService.createMoiEntry(finalPayload);
        setSubmitting(false);

        if (res.success) {
            const func = displayFunctions.find(f => String(f.id) === String(formData.functionId));
            const entryForCard = {
                ...res.entry,
                guestName: formData.guestName,
                functionName: func ? func.name : 'Unknown',
                phone: formData.phone,
                amount: finalPayload.amount,
                description: formData.description || formData.giftType
            };

            addEntry(entryForCard);
            setLastAdded(entryForCard);

            if (!isPending) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#F59E0B', '#10B981', '#3B82F6']
                });
            }

            setSuccess(true);
            setShowQrModal(false);
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
            setShowQrModal(false);
            setShowLimitModal(true);
        } else {
            alert(res.error || 'Failed to save Moi entry.');
        }
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

        const selectedPm = availablePaymentMethods.find(pm => pm.id === formData.paymentMethodId);
        const isUpiPayment = formData.giftType === 'Cash' && selectedPm && selectedPm.method_type === 'UPI';
        const numAmount = parseFloat(formData.amount) || 0;

        const payload = {
            functionId: formData.functionId,
            guestName: formData.guestName,
            villageCity: '',
            phone: formData.phone,
            relation: formData.relation,
            amount: formData.giftType === 'Cash' ? numAmount : 0,
            giftItem: formData.giftType,
            giftType: formData.giftType,
            paymentMode: isUpiPayment ? 'UPI' : 'Cash',
            paymentMethodId: formData.paymentMethodId || null,
            entrySource: entrySource || 'manual',
            transactionReference: formData.transactionReference || null
        };

        // If guest pays via UPI and amount > 0, trigger Live Dynamic QR Modal!
        if (isUpiPayment && numAmount > 0) {
            setPendingQrPayload(payload);
            setShowQrModal(true);
        } else {
            // Direct save for Hard Cash or Gift Items
            await saveEntryToBackend(payload, false);
        }
    };

    const isTa = lang === 'ta';
    const activeQrPm = availablePaymentMethods.find(pm => pm.id === formData.paymentMethodId);
    const qrString = activeQrPm ? `upi://pay?pa=${activeQrPm.upi_id}&pn=${encodeURIComponent(activeQrPm.display_name || activeQrPm.name || 'VizhaBook')}&am=${formData.amount}&cu=INR` : '';

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

                            {/* HOW DID THEY PAY? (PHYSICAL CASH vs. CONFIGURED UPI ACCOUNTS) */}
                            {formData.giftType === 'Cash' && (
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{isTa ? 'பணம் பெற்ற முறை' : 'How did they pay?'}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700 }}>
                                            {isTa ? 'கட்டண முறை' : 'Payment Mode'}
                                        </span>
                                    </label>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.65rem' }}>
                                        {/* Option 1: Physical Hard Cash Pill */}
                                        <div
                                            onClick={() => setFormData({
                                                ...formData,
                                                paymentMethodId: '',
                                                paymentMode: 'Cash'
                                            })}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '0.75rem',
                                                border: formData.paymentMethodId === '' ? '2px solid #059669' : '1px solid #E2E8F0',
                                                background: formData.paymentMethodId === '' ? '#ECFDF5' : '#FFFFFF',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '2px',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: formData.paymentMethodId === '' ? '#047857' : '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    💵 {isTa ? 'நேரடி ரொக்கம்' : 'Physical Cash'}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                                                {isTa ? 'கையிலக் கொடுத்த பணம்' : 'Hand-to-Hand Cash'}
                                            </span>
                                        </div>

                                        {/* Option 2...N: Configured UPI Account Pills */}
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
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            📱 {pm.display_name || pm.name}
                                                        </span>
                                                        {pm.is_default && <span style={{ fontSize: '0.6rem', color: '#B45309', fontWeight: 800 }}>★</span>}
                                                    </div>
                                                    {pm.upi_id && (
                                                        <span style={{ fontSize: '0.7rem', color: '#1E3A8A', fontFamily: 'monospace', fontWeight: 600 }}>{pm.upi_id}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* TRANSACTION REFERENCE / UTR */}
                            {formData.giftType === 'Cash' && formData.paymentMethodId !== '' && (
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

            {/* ═══════════════ LIVE DYNAMIC UPI QR PAYMENT MODAL ═══════════════ */}
            {showQrModal && activeQrPm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '440px',
                        padding: '2rem', border: '2px solid #F59E0B', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
                        display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowQrModal(false)}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={18} color="#64748B" />
                        </button>

                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#FEF3C7', padding: '4px 12px', borderRadius: '100px' }}>
                                📱 Live UPI Payment QR
                            </span>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: '0.5rem 0 0.2rem', fontFamily: "'Playfair Display', serif" }}>
                                {formData.guestName}
                            </h3>
                            <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#059669', margin: 0 }}>
                                ₹{Number(formData.amount).toLocaleString('en-IN')}
                            </p>
                        </div>

                        {/* High Resolution Dynamic QR */}
                        <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <QRCodeSVG
                                value={qrString}
                                size={190}
                                level="H"
                                includeMargin={true}
                            />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A' }}>
                                    {activeQrPm.display_name || activeQrPm.name}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600 }}>
                                    {activeQrPm.upi_id}
                                </div>
                            </div>
                        </div>

                        {/* Operator Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => saveEntryToBackend(pendingQrPayload, false)}
                                style={{
                                    width: '100%', padding: '0.9rem', borderRadius: '12px', background: 'linear-gradient(135deg, #059669, #10B981)',
                                    color: 'white', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                {submitting ? <Loader2 size={18} className="pm-spin" /> : <CheckCircle2 size={18} />}
                                {isTa ? '✅ பணம் பெறப்பட்டது (உறுதி செய்)' : '✅ Payment Received & Confirmed'}
                            </button>

                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => saveEntryToBackend(pendingQrPayload, true)}
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '12px', background: '#FEF3C7',
                                    color: '#B45309', border: '1px solid #FCD34D', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                <Clock size={16} />
                                {isTa ? '⏳ சரிபார்க்க சேமி (நிலுவையில் வைக்க)' : '⏳ Save as Pending Verification'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowQrModal(false)}
                                style={{
                                    width: '100%', padding: '0.65rem', borderRadius: '12px', background: 'transparent',
                                    color: '#64748B', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                                }}
                            >
                                {isTa ? 'திருத்து / ரத்து செய்' : '✏ Edit / Cancel'}
                            </button>
                        </div>
                    </div>
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
