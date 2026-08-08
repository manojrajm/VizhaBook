import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Loader } from 'lucide-react';
import { TRANSLATIONS } from '../../utils/translations';

const GreetingCard = ({ guestName, amount, functionName, lang = 'en', familyLead = 'Host', phone = '' }) => {
    const t = TRANSLATIONS[lang];
    const cardRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);

    const captureCard = async () => {
        if (!cardRef.current) return null;
        const canvas = await html2canvas(cardRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#fff0f4',
            logging: false,
            allowTaint: true
        });
        return canvas;
    };

    // Download the card as PNG
    const handleDownload = async () => {
        setLoading(true);
        try {
            const canvas = await captureCard();
            if (!canvas) return;
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `moi-greeting-${guestName.replace(/\s+/g, '-')}.png`;
            link.click();
        } catch (err) {
            console.error('Download failed:', err);
        }
        setLoading(false);
    };

    // Share card image directly to guest's WhatsApp
    const handleShareImage = async () => {
        setShareLoading(true);

        // Normalise phone: strip non-digits, add 91 country code if 10 digits
        let cleanPhone = (phone || '').replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
        const hasPhone = cleanPhone.length >= 12;

        // Greeting text that will pre-fill in WhatsApp
        const greetingText = lang === 'ta'
            ? `💐 திருமண நன்றி 💐\n\nஅன்புள்ள ${guestName},\n${functionName} விழாவில் கலந்துகொண்டு ${typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : amount} வழங்கியதற்கு நன்றி! 🙏\n\nஅன்புடன்,\n${familyLead} குடும்பத்தினர்`
            : `💐 Wedding Thanks 💐\n\nDear ${guestName},\nThank you for attending our ${functionName} and for your generous gift of ${typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : amount}. 🙏\n\nWith Love,\n${familyLead} Family`;

        const waUrl = hasPhone
            ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greetingText)}`
            : `https://wa.me/?text=${encodeURIComponent(greetingText)}`;

        try {
            const canvas = await captureCard();
            if (!canvas) { setShareLoading(false); return; }

            canvas.toBlob(async (blob) => {
                const file = new File([blob], `moi-greeting-${guestName}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    // Mobile: share the actual PNG image via native share sheet
                    try {
                        await navigator.share({
                            title: lang === 'ta' ? 'திருமண நன்றி' : 'Wedding Thanks',
                            text: greetingText,
                            files: [file]
                        });
                        // After sharing, also open WhatsApp directly to the guest's number
                        if (hasPhone) {
                            setTimeout(() => window.open(waUrl, '_blank'), 800);
                        }
                    } catch (_) {
                        // User cancelled share sheet — open WhatsApp directly
                        window.open(waUrl, '_blank');
                    }
                } else {
                    // Desktop: download the image first, then open WhatsApp web with text
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    link.click();
                    URL.revokeObjectURL(url);
                    // Open WhatsApp with pre-filled message to the guest's number
                    setTimeout(() => window.open(waUrl, '_blank'), 600);
                }
                setShareLoading(false);
            }, 'image/png');
        } catch (err) {
            console.error('Share failed:', err);
            setShareLoading(false);
        }
    };

    const amountDisplay = typeof amount === 'number'
        ? `₹${amount.toLocaleString('en-IN')}`
        : amount;

    return (
        <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
            {/* ── THE CARD (this gets captured as image) ── */}
            <div
                ref={cardRef}
                style={{
                    background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                    padding: '20px',
                    borderRadius: '20px',
                    fontFamily: lang === 'ta' ? "'Noto Sans Tamil', sans-serif" : "'Inter', sans-serif",
                }}
            >
                <div style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '30px 24px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(200,80,100,0.15)'
                }}>
                    {/* Flower icon */}
                    <div style={{ fontSize: '42px', marginBottom: '10px' }}>💐</div>

                    {/* Title */}
                    <div style={{
                        fontSize: '26px',
                        color: '#d63384',
                        fontWeight: 'bold',
                        marginBottom: '18px',
                        fontFamily: lang === 'ta' ? "'Noto Sans Tamil', sans-serif" : "'Playfair Display', serif"
                    }}>
                        {t.weddingThanks}
                    </div>

                    {/* Dear guest */}
                    <p style={{ fontSize: '17px', color: '#444', margin: '10px 0', lineHeight: 1.7 }}>
                        {t.dear}{' '}
                        <strong style={{ fontSize: '20px', color: '#222' }}>{guestName}</strong>{' '}
                        {t.toGuest},
                    </p>

                    {/* Attending message */}
                    <p style={{ fontSize: '16px', color: '#555', margin: '8px 0', lineHeight: 1.7 }}>
                        {t.attendingMsg} {functionName}
                    </p>

                    {/* Amount badge */}
                    <div style={{
                        fontSize: '26px',
                        color: '#e63946',
                        fontWeight: '900',
                        margin: '16px 0',
                        lineHeight: 1.4
                    }}>
                        {amountDisplay} {t.presentedMsg}
                    </div>

                    {/* Heartfelt thanks */}
                    <p style={{ fontSize: '16px', color: '#444', margin: '10px 0', lineHeight: 1.7 }}>
                        {t.heartfeltThanks}
                    </p>

                    {/* Footer */}
                    <div style={{
                        marginTop: '20px',
                        borderTop: '1px dashed #fad0c4',
                        paddingTop: '16px',
                        fontWeight: 'bold',
                        color: '#374151',
                        fontSize: '16px',
                        lineHeight: 1.7
                    }}>
                        {t.withLove}<br />
                        {familyLead} {t.family} 🙏
                    </div>
                </div>
            </div>

            {/* ── ACTION BUTTONS BELOW CARD ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginTop: '16px'
            }}>
                {/* Share Image to WhatsApp */}
                <button
                    onClick={handleShareImage}
                    disabled={shareLoading}
                    style={{
                        padding: '12px 16px',
                        background: shareLoading ? '#ccc' : '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: shareLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    {shareLoading
                        ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {lang === 'ta' ? 'பகிரப்படுகிறது...' : 'Sharing...'}</>
                        : <><Share2 size={16} /> {lang === 'ta' ? 'WhatsApp படம்' : 'Share Image'}</>
                    }
                </button>

                {/* Download PNG */}
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    style={{
                        padding: '12px 16px',
                        background: loading ? '#ccc' : '#d63384',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    {loading
                        ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {lang === 'ta' ? 'பதிவிறக்கம்...' : 'Saving...'}</>
                        : <><Download size={16} /> {lang === 'ta' ? 'படம் சேமி' : 'Save Image'}</>
                    }
                </button>
            </div>

            <p style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#9ca3af',
                marginTop: '8px',
                marginBottom: 0
            }}>
                {lang === 'ta'
                    ? '📱 மொபைல்: WhatsApp-ல் நேரடியாக பகிரலாம். கணினி: படம் save ஆகும்.'
                    : '📱 Mobile: share directly to WhatsApp. Desktop: image will download.'}
            </p>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default GreetingCard;
