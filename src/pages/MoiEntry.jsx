import React, { useState } from 'react';
import { Gift, Wallet, Send, User, Calendar, MessageCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MOCK_FUNCTIONS, MOCK_GUESTS } from '../utils/mockData';
import { TRANSLATIONS } from '../utils/translations';
import GreetingCard from '../components/ui/GreetingCard';
import { sendWhatsAppMessage, sendSMSMessage } from '../utils/communication';

const MoiEntry = () => {
    const { functions, guests, addEntry, addGuest, lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [formData, setFormData] = useState({
        guestName: '',
        phone: '',
        relation: 'Relative',
        functionId: '',
        amount: '',
        giftType: 'Cash',
        description: ''
    });
    const [success, setSuccess] = useState(false);
    const [lastAdded, setLastAdded] = useState(null);

    const displayFunctions = functions.length ? functions : MOCK_FUNCTIONS;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Automatically create a new Guest record in the background
        const newGuest = addGuest({
            name: formData.guestName,
            phone: formData.phone,
            relation: formData.relation
        });

        const func = displayFunctions.find(f => f.id === parseInt(formData.functionId));

        const entry = {
            guestId: newGuest.id, // Link to the newly created guest
            functionId: formData.functionId,
            giftType: formData.giftType,
            description: formData.description,
            guestName: newGuest.name,
            functionName: func ? func.name : 'Unknown',
            phone: newGuest.phone,
            amount: parseFloat(formData.amount) || 0,
            date: new Date().toISOString()
        };

        addEntry(entry);
        setLastAdded(entry);

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#10B981', '#3B82F6']
        });

        setSuccess(true);
        setFormData({ guestName: '', phone: '', relation: 'Relative', functionId: '', amount: '', giftType: 'Cash', description: '' });
    };

    return (
        <div className="animate-fade" style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
            {success && lastAdded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '4rem', height: '4rem', background: '#DCFCE7', color: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Entry Recorded!</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Your gift entry has been saved successfully.</p>
                    </div>

                    <GreetingCard
                        guestName={lastAdded.guestName}
                        amount={lastAdded.amount > 0 ? lastAdded.amount : lastAdded.description}
                        functionName={lastAdded.functionName}
                        lang={lang}
                        familyLead="Arun"
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
                        {lang === 'en' ? 'Add Another Entry' : 'மற்றொரு பதிவைச் சேர்க்க'}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h1 style={{
                            fontSize: '3rem',
                            fontWeight: 900,
                            marginBottom: '0.5rem',
                            background: 'var(--primary-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: "'Playfair Display', serif"
                        }}>
                            {lang === 'en' ? 'Moi Entry' : 'மொய் பதிவு'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Record gifts and money presented by your guests.</p>
                    </header>

                    <Card glass={true} style={{
                        padding: '2.5rem',
                        borderRadius: '2rem',
                    }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
                            {/* NEW GUEST INPUTS INSTEAD OF DROPDOWN */}
                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Guest Name' : 'விருந்தினர் பெயர்'}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={lang === 'en' ? 'e.g. Kumar' : 'குமார்'}
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}
                                    value={formData.guestName}
                                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">{lang === 'en' ? 'Mobile Number' : 'கைபேசி எண்'} (Optional)</label>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">{lang === 'en' ? 'Relation' : 'உறவு முறை'}</label>
                                    <select
                                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}
                                        value={formData.relation}
                                        onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                    >
                                        <option value="Relative">{lang === 'en' ? 'Relative' : 'உறவினர்'}</option>
                                        <option value="Friend">{lang === 'en' ? 'Friend' : 'நண்பர்'}</option>
                                        <option value="Colleague">{lang === 'en' ? 'Colleague' : 'சக பணியாளர்'}</option>
                                        <option value="Neighbor">{lang === 'en' ? 'Neighbor' : 'அண்டை வீட்டார்'}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Select Function' : 'விழாவைத் தேர்ந்தெடுக்கவும்'}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}
                                    value={formData.functionId}
                                    onChange={(e) => setFormData({ ...formData, functionId: e.target.value })}
                                >
                                    <option value="">-- Choose function --</option>
                                    {displayFunctions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Gift Type' : 'பரிசு வகை'}</label>
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
                                                background: formData.giftType === type ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.7)',
                                                color: formData.giftType === type ? 'white' : 'var(--text-secondary)',
                                                fontWeight: 800,
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow: formData.giftType === type ? '0 4px 15px rgba(214, 51, 132, 0.3)' : 'none'
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.giftType === 'Cash' ? (
                                <div className="form-group">
                                    <label className="form-label">{lang === 'en' ? 'Amount (₹)' : 'தொகை (₹)'}</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '2px solid var(--border-color)', fontSize: '2rem', textAlign: 'center', fontWeight: 800, background: 'rgba(255,255,255,0.9)', color: 'var(--primary-color)' }}
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">{lang === 'en' ? 'Description' : 'விவரம்'}</label>
                                    <textarea
                                        required
                                        placeholder={lang === 'en' ? 'e.g. 24ct Gold Chain' : 'உதாரணமாக: தங்கச் செயின்'}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', height: '5rem', resize: 'none', background: 'rgba(255,255,255,0.7)' }}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            )}

                            <button type="submit" style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '1rem',
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                marginTop: '1rem',
                                background: 'var(--primary-gradient)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 10px 25px rgba(214, 51, 132, 0.4)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}>
                                {lang === 'en' ? 'RECORD MOI' : 'மொய்ப் பதிவு செய்'}
                            </button>
                        </form>
                    </Card>
                </div>
            )}
        </div >
    );
};

export default MoiEntry;

