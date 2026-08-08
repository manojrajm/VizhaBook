import React, { useState } from 'react';
import { Plus, MapPin, Calendar as CalendarIcon, User, Search, Filter, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MOCK_FUNCTIONS } from '../utils/mockData';
import { TRANSLATIONS } from '../utils/translations';

const Functions = () => {
    const { functions, addFunction, removeFunction, lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Marriage',
        date: '',
        location: '',
        host: '',
        upiId: ''
    });

    const displayFunctions = functions.length ? functions : MOCK_FUNCTIONS;

    const handleSubmit = (e) => {
        e.preventDefault();
        addFunction(formData);
        setFormData({ name: '', type: 'Marriage', date: '', location: '', host: '', upiId: '' });
        setShowForm(false);
    };

    const functionTypes = [
        'Marriage', 'Engagement', 'Mottai', 'House Warming', 'Birthday', 'Baby Shower'
    ];

    const getCategoryImage = (type) => {
        const images = {
            'Marriage': '🏮',
            'Engagement': '💍',
            'Mottai': '🪒',
            'House Warming': '🏠',
            'Birthday': '🎂',
            'Baby Shower': '🍼'
        };
        return images[type] || '✨';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Animated Header */}
            <header className="animate-fade" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{
                        fontSize: '3.5rem',
                        fontWeight: 900,
                        fontFamily: "'Playfair Display', serif",
                        marginBottom: '0.5rem',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 4px 8px rgba(30, 58, 138, 0.2))'
                    }}>
                        {lang === 'en' ? 'Celebration Events' : 'நிர்வகிக்கும் விழாக்கள்'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', fontWeight: 600 }}>
                        {lang === 'en' ? 'Manage and track all your family functions in one beautiful place.' : 'உங்கள் குடும்ப விழாக்களை இங்கே அழகாக நிர்வகிக்கலாம்.'}
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} style={{
                    padding: '1rem 2rem',
                    borderRadius: '999px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--primary-color)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                    className="btn-secondary"
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                        e.currentTarget.style.background = 'var(--primary-gradient)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.background = 'var(--bg-card)';
                        e.currentTarget.style.color = 'var(--primary-color)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}>
                    <Plus size={20} style={{ strokeWidth: 3 }} />
                    {lang === 'en' ? 'NEW FUNCTION' : 'புதிய விழா'}
                </button>
            </header>

            {/* Glassmorphic Modal */}
            {showForm && (
                <div className="modal-backdrop" onClick={() => setShowForm(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="modal-content animate-fade" onClick={e => e.stopPropagation()} style={{
                        background: 'var(--bg-card)',
                        backdropFilter: 'blur(20px)',
                        padding: '2.5rem',
                        borderRadius: '2rem',
                        width: '100%',
                        maxWidth: '550px',
                        boxShadow: 'var(--shadow-3d)',
                        border: 'var(--glass-border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                                {lang === 'en' ? 'Add New Celebration' : 'புதிய விழா'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                style={{
                                    background: '#f3f4f6', border: 'none', width: '2.5rem', height: '2.5rem', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            >
                                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Function Name' : 'விழாவின் பெயர்'}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={lang === 'en' ? 'e.g. Ramesh & Priya Wedding' : 'உதாரணமாக: ரமேஷ் மற்றும் பிரியா திருமணம்'}
                                    style={{ padding: '1rem', borderRadius: '0.75rem', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">{lang === 'en' ? 'Function Type' : 'விழா வகை'}</label>
                                    <select
                                        style={{ padding: '1rem', borderRadius: '0.75rem', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        {functionTypes.map(type => <option key={type} value={type} style={{ background: 'var(--bg-primary)' }}>{getCategoryImage(type)} {type}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{lang === 'en' ? 'Date' : 'தேதி'}</label>
                                    <input
                                        type="date"
                                        required
                                        style={{ padding: '1rem', borderRadius: '0.75rem', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Location' : 'இடம்'}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={lang === 'en' ? 'e.g. Chennai' : 'உதாரணமாக: சென்னை'}
                                    style={{ padding: '1rem', borderRadius: '0.75rem', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Host Name' : 'நடத்துபவர் பெயர்'}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={lang === 'en' ? 'Who is hosting?' : 'விழா நடத்துபவர் யார்?'}
                                    style={{ padding: '1rem', borderRadius: '0.75rem', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}
                                    value={formData.host}
                                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'UPI ID for Payments (Optional)' : 'பணம் செலுத்த UPI ID (விருப்பம்)'}</label>
                                <input
                                    type="text"
                                    placeholder={lang === 'en' ? 'e.g. name@upi' : 'உதாரணமாக: name@upi'}
                                    style={{ padding: '1rem', borderRadius: '0.75rem', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}
                                    value={formData.upiId}
                                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                />
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <button type="submit" style={{
                                    width: '100%', padding: '1.25rem', borderRadius: '1rem', background: 'var(--primary-gradient)', color: 'white', border: 'none', fontSize: '1.125rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(214, 51, 132, 0.3)', transition: 'transform 0.2s ease'
                                }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {lang === 'en' ? 'CREATE EXTRAVAGANZA 🎉' : 'விழாவை உருவாக்கு 🎉'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Creative Animated Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2.5rem' }}>
                {displayFunctions.map((func, idx) => (
                    <Card key={func.id} className="celebration-card glass-premium float-3d" style={{
                        animation: `modalSlide 0.5s ease-out forwards`,
                        animationDelay: `${idx * 0.1}s`,
                        opacity: 0,
                        padding: 0,
                        overflow: 'hidden'
                    }}>
                        {/* Breathtaking Gradient Banner */}
                        <div style={{
                            height: '140px',
                            background: 'var(--primary-gradient)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            {/* Decorative background circle */}
                            <div className="glow-pulse" style={{ position: 'absolute', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', right: '-50px', top: '-100px' }}></div>
                            <div style={{ position: 'absolute', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', left: '-20px', bottom: '-50px' }}></div>

                            <span style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))', transform: 'translateY(10px)' }}>{getCategoryImage(func.type)}</span>

                            <button
                                onClick={() => removeFunction(func.id)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: 'none', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.6)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                title="Remove Event"
                            >
                                <Plus size={16} style={{ transform: 'rotate(45deg)', strokeWidth: 3 }} />
                            </button>
                        </div>

                        {/* Bold Overlapping Date Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '110px',
                            left: '2rem',
                            background: 'var(--bg-secondary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '1rem',
                            boxShadow: 'var(--shadow-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            border: '1px solid var(--border-color)',
                            zIndex: 10
                        }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {new Date(func.date).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                                {new Date(func.date).getDate()}
                            </span>
                        </div>

                        {/* Rich Content Area */}
                        <div style={{ padding: '3rem 2rem 2rem 2rem' }}>
                            <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                {func.type}
                            </div>

                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.2, fontFamily: "'Playfair Display', serif" }}>
                                {func.name}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '8px', background: 'var(--bg-nested)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', border: '1px solid var(--border-color)' }}>
                                        <MapPin size={16} style={{ strokeWidth: 2.5 }} />
                                    </div>
                                    {func.location}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '8px', background: 'var(--bg-nested)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', border: '1px solid var(--border-color)' }}>
                                        <User size={16} style={{ strokeWidth: 2.5 }} />
                                    </div>
                                    <span>Hosted by <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{func.host}</span></span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Functions;

