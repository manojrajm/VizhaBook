import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Loader, Sparkles, ShieldCheck, Check, Image as ImageIcon } from 'lucide-react';
import { TRANSLATIONS } from '../../utils/translations';

const GreetingCard = ({ guestName, amount, functionName, functionDate = '', lang = 'en', familyLead = 'Host', phone = '' }) => {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const cardRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [activeTheme, setActiveTheme] = useState('royal_sapphire'); // 'royal_sapphire' | 'royal_gold' | 'temple' | 'executive'
    const [copiedNotice, setCopiedNotice] = useState(false);

    // Format phone number to clean country-coded digits (e.g. 919876543210)
    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const hasValidPhone = cleanPhone.length >= 10;

    const amountDisplay = typeof amount === 'number'
        ? `₹ ${amount.toLocaleString('en-IN')}`
        : amount;

    const captureCard = async () => {
        if (!cardRef.current) return null;
        const canvas = await html2canvas(cardRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: null,
            logging: false,
            allowTaint: true
        });
        return canvas;
    };

    // Download PNG File
    const handleDownload = async () => {
        setLoading(true);
        try {
            const canvas = await captureCard();
            if (!canvas) return;
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `VizhaBook-Greeting-${guestName.replace(/\s+/g, '-')}.png`;
            link.click();
        } catch (err) {
            console.error('Download failed:', err);
        }
        setLoading(false);
    };

    // Senior Architect Direct WhatsApp Engine: Bypasses OS contact picker completely
    const handleShareDirectWhatsApp = async () => {
        setShareLoading(true);
        setCopiedNotice(true);

        const greetingText = lang === 'ta'
            ? `💐 திருமண நன்றி 💐\n\nஅன்புள்ள ${guestName},\n${functionName} விழாவில் கலந்துகொண்டு ${amountDisplay} வழங்கியமைக்கு மனமார்ந்த நன்றிகள்! 🙏\n\nஅன்புடன்,\n${familyLead} குடும்பத்தினர்`
            : `💐 Wedding Gratitude 💐\n\nDear ${guestName},\nThank you for attending our ${functionName} and for your generous gift of ${amountDisplay}. 🙏\n\nWith Warm Regards,\n${familyLead} Family`;

        // Direct Deep Link URL targeting target guest phone number
        const waUrl = hasValidPhone
            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(greetingText)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(greetingText)}`;

        try {
            const canvas = await captureCard();
            if (canvas) {
                canvas.toBlob(async (blob) => {
                    // 1. Copy image blob directly to System Clipboard
                    if (navigator.clipboard && window.ClipboardItem) {
                        try {
                            await navigator.clipboard.write([
                                new ClipboardItem({ 'image/png': blob })
                            ]);
                        } catch (clipErr) {
                            console.warn('Clipboard write notice:', clipErr);
                        }
                    }

                    // 2. Download PNG file as backup
                    const file = new File([blob], `VizhaBook-Greeting-${guestName}.png`, { type: 'image/png' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    link.click();
                    URL.revokeObjectURL(url);

                    // 3. Directly open WhatsApp Chat to the target unsaved guest phone number (Bypassing OS Share Sheet completely!)
                    setTimeout(() => {
                        window.open(waUrl, '_blank');
                        setShareLoading(false);
                    }, 350);

                }, 'image/png');
            } else {
                window.open(waUrl, '_blank');
                setShareLoading(false);
            }
        } catch (err) {
            console.error('Share error:', err);
            window.open(waUrl, '_blank');
            setShareLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* THEME SELECTOR PILLS */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                    { id: 'royal_sapphire', label: '🌌 Royal Sapphire Gold' },
                    { id: 'royal_gold', label: '👑 Royal Maroon' },
                    { id: 'temple', label: '🌺 Temple Gold' },
                    { id: 'executive', label: '✨ Minimal Gold' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTheme(t.id)}
                        style={{
                            padding: '6px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800,
                            border: activeTheme === t.id ? '2px solid #D97706' : '1px solid #E2E8F0',
                            background: activeTheme === t.id ? '#FEF3C7' : '#FFFFFF',
                            color: activeTheme === t.id ? '#B45309' : '#64748B',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* THE EXACT ROYAL SAPPHIRE & GOLD CARD TEMPLATE (CAPTURED VIA CANVAS) */}
            <div
                ref={cardRef}
                style={{
                    width: '100%',
                    background: activeTheme === 'royal_sapphire' 
                        ? 'radial-gradient(circle at 50% 0%, #0F172A 0%, #030712 100%)'
                        : activeTheme === 'royal_gold'
                        ? 'radial-gradient(circle at 50% 0%, #4A0E17 0%, #1A0307 100%)'
                        : activeTheme === 'temple'
                        ? 'radial-gradient(circle at 50% 0%, #7C2D12 0%, #2A0902 100%)'
                        : '#0F172A',
                    padding: '24px 20px',
                    borderRadius: '24px',
                    color: '#FFFFFF',
                    fontFamily: lang === 'ta' ? "'Noto Sans Tamil', sans-serif" : "'Playfair Display', serif",
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    border: '1px solid #1E293B'
                }}
            >
                {/* INTRICATE GOLDEN DOUBLE BORDER FRAME WITH ORNATE CORNERS */}
                <div style={{
                    border: '2px solid #D97706',
                    borderRadius: '18px',
                    padding: '28px 18px',
                    position: 'relative',
                    textAlign: 'center',
                    outline: '1px solid rgba(217, 119, 6, 0.4)',
                    outlineOffset: '-6px'
                }}>

                    {/* TOP CENTER GOLDEN DIYA / KALASAM EMBLEM */}
                    <div style={{ fontSize: '32px', color: '#F59E0B', marginBottom: '6px' }}>🪔</div>

                    {/* SCRIPT THANK YOU TITLE */}
                    <h2 style={{
                        fontFamily: "'Playfair Display', 'Georgia', serif",
                        fontSize: '2.5rem',
                        fontStyle: 'italic',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 50%, #F59E0B 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: '0 0 4px 0',
                        letterSpacing: '1px'
                    }}>
                        {lang === 'ta' ? 'நன்றி நவிதல்' : 'Thank You'}
                    </h2>

                    {/* SUBTITLE */}
                    <div style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#FCD34D',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginBottom: '18px'
                    }}>
                        {lang === 'ta' ? 'நல்வரவிற்கும் அன்பளிப்பிற்கும் நன்றி' : 'FOR YOUR LOVELY PRESENCE & GENEROUS GIFT'}
                    </div>

                    {/* GUEST NAME SECTION */}
                    <div style={{ fontSize: '0.92rem', fontStyle: 'italic', color: '#93C5FD', marginBottom: '2px' }}>
                        {lang === 'ta' ? 'அன்புள்ள' : 'Dear'}
                    </div>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: '#F59E0B',
                        fontFamily: "'Playfair Display', serif",
                        marginBottom: '14px'
                    }}>
                        {guestName}
                    </div>

                    <p style={{ fontSize: '0.88rem', color: '#CBD5E1', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                        {lang === 'ta' ? 'எங்களது விழாவில் கலந்துகொண்டு வழங்கிய அன்பளிப்பு:' : 'Thank you so much for your kind gift of'}
                    </p>

                    {/* GOLD FILIGREE AMOUNT BOX */}
                    <div style={{
                        display: 'inline-block',
                        border: '2px solid #D97706',
                        borderRadius: '14px',
                        padding: '10px 28px',
                        background: 'rgba(217, 119, 6, 0.15)',
                        boxShadow: '0 4px 20px rgba(217, 119, 6, 0.25)',
                        margin: '0 auto 18px auto'
                    }}>
                        <span style={{
                            fontSize: '1.6rem',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {amountDisplay}
                        </span>
                    </div>

                    {/* BLESSINGS SENTENCE */}
                    <p style={{ fontSize: '0.88rem', color: '#E2E8F0', fontStyle: 'italic', margin: '0 0 20px 0' }}>
                        {lang === 'ta' ? 'உங்கள் அன்பும் நல்வாழ்த்துகளும் எங்களுக்கு மிகவும் விலைமதிப்பற்றவை.' : 'Your love and blessings mean a lot to us.'}
                    </p>

                    {/* GOLDEN CIRCULAR WREATH EMBLEM */}
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        border: '2px solid #F59E0B',
                        margin: '0 auto 18px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(245, 158, 11, 0.15)',
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
                    }}>
                        <span style={{ fontSize: '28px' }}>👤</span>
                    </div>

                    {/* FUNCTION NAME & DATE */}
                    <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#FDE68A',
                        marginBottom: '4px'
                    }}>
                        {functionName}
                    </div>

                    {functionDate && (
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '18px' }}>
                            📅 {functionDate}
                        </div>
                    )}

                    {/* FOOTER */}
                    <div style={{
                        borderTop: '1px dashed rgba(217, 119, 6, 0.4)',
                        paddingTop: '16px',
                        marginTop: '8px'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: '#FCD34D', fontStyle: 'italic', marginBottom: '4px' }}>
                            {lang === 'ta' ? 'அன்பும் நன்றியுடன் ❤' : 'With Love & Gratitude ❤'}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                            {familyLead} {lang === 'ta' ? 'குடும்பத்தினர்' : 'Family'}
                        </div>
                    </div>

                    {/* VERIFIED STAMP BADGE */}
                    <div style={{
                        marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        <ShieldCheck size={14} color="#D97706" /> VizhaBook Official Verified Digital Receipt
                    </div>

                </div>
            </div>

            {/* CLIPBOARD / COPY CONFIRMATION TOAST */}
            {copiedNotice && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center' }}>
                    📋 {lang === 'ta' ? 'வாழ்த்து அட்டைப் படம் Clipboard-இல் பிரதி எடுக்கப்பட்டது! வாட்ஸ்அப்பில் Paste (ஒட்டு) செய்யவும்.' : 'Card Image copied to Clipboard! Long Press ➔ Paste in WhatsApp chat to send Image + Text.'}
                </div>
            )}

            {/* ACTION BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                
                {/* Direct Unsaved Number WhatsApp Share with Auto-Attached Image */}
                <button
                    onClick={handleShareDirectWhatsApp}
                    disabled={shareLoading}
                    style={{
                        padding: '14px 16px', background: shareLoading ? '#94A3B8' : '#25D366',
                        color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800,
                        fontSize: '0.92rem', cursor: shareLoading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                    }}
                >
                    {shareLoading ? <Loader size={18} className="pm-spin" /> : <Share2 size={18} />}
                    {lang === 'ta' ? 'WhatsApp (படம் + உரை)' : 'Send Image + Text'}
                </button>

                {/* Download HD PNG */}
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    style={{
                        padding: '14px 16px', background: loading ? '#94A3B8' : '#1E3A8A',
                        color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800,
                        fontSize: '0.92rem', cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(30, 58, 138, 0.3)'
                    }}
                >
                    {loading ? <Loader size={18} className="pm-spin" /> : <Download size={18} />}
                    {lang === 'ta' ? 'HD படம் சேமி' : 'Save HD Card'}
                </button>
            </div>

            {/* Unsaved Phone Number Hint */}
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                {hasValidPhone 
                    ? `📱 Direct WhatsApp to +${cleanPhone} (Auto-copies image & opens chat)` 
                    : (lang === 'ta' ? '📱 தொலைபேசி எண் மூலம் வாட்ஸ்அப்பில் பகிரவும்.' : '📱 Enter guest phone number for direct WhatsApp chat.')}
            </div>
        </div>
    );
};

export default GreetingCard;
