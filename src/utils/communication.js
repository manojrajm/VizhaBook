// ─── Greeting Message (card-template style) ───────────────────────────────
export const getMessageText = ({ guestName, functionName, amount, giftType, description }, lang = 'en') => {
    const giftDetail = giftType === 'Cash'
        ? `₹${Number(amount).toLocaleString('en-IN')}`
        : description;

    if (lang === 'ta') {
        return (
            `💐 திருமண நன்றி 💐` +
            `\n\nஅன்புள்ள ${guestName} அவர்களுக்கு,` +
            `\n\nஎங்கள் ${functionName} விழாவில் கலந்து கொண்டு` +
            `\n\n${giftDetail} மொய் வழங்கியதற்கு` +
            `\n\nஎங்கள் மனமார்ந்த நன்றிகள். 🙏` +
            `\n\nஅன்புடன்,\nகுடும்பத்தினர்`
        );
    }

    return (
        `💐 Wedding Thanks 💐` +
        `\n\nDear ${guestName},` +
        `\n\nThank you for attending our ${functionName}` +
        `\n\nand for your generous gift of ${giftDetail}.` +
        `\n\nOur Heartfelt Thanks 🙏` +
        `\n\nWith Love,\nFamily`
    );
};

// ─── Invite Message ────────────────────────────────────────────────────────
export const getInviteText = (guestName, lang = 'en') => {
    if (lang === 'ta') {
        return `அன்புள்ள ${guestName},\n\nஎங்கள் வீட்டு விழாவிற்கு உங்களை அன்போடு அழைக்கிறோம். 🙏\nஉங்கள் வருகையை எதிர்பார்க்கிறோம்.\n\nஅன்புடன்,\nகுடும்பத்தினர்`;
    }
    return `Dear ${guestName},\n\nWe cordially invite you to our celebration. 🙏\nWe look forward to your presence.\n\nWith Love,\nFamily`;
};

// ─── WhatsApp ──────────────────────────────────────────────────────────────
export const sendWhatsAppMessage = (entry, lang = 'en') => {
    let phone = (entry.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
        alert(lang === 'ta' ? 'சரியான கைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid mobile number.');
        return;
    }
    if (phone.length === 10) phone = '91' + phone; // Automatically add India country code if exactly 10 digits

    const message = getMessageText(entry, lang);
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
};

// ─── SMS (fixed: use location.href for sms: protocol) ─────────────────────
export const sendSMSMessage = (entry, lang = 'en') => {
    const phone = (entry.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
        alert(lang === 'ta' ? 'சரியான கைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid mobile number.');
        return;
    }

    const message = getMessageText(entry, lang);
    const encodedMsg = encodeURIComponent(message);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const smsUrl = isIOS
        ? `sms:${phone}&body=${encodedMsg}`
        : `sms:${phone}?body=${encodedMsg}`;
    window.location.href = smsUrl;
};

// ─── Invite WhatsApp ───────────────────────────────────────────────────────
export const sendInviteWhatsApp = (guest, lang = 'en') => {
    let phone = (guest.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
        alert(lang === 'ta' ? 'சரியான கைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid mobile number.');
        return;
    }
    if (phone.length === 10) phone = '91' + phone;

    const message = getInviteText(guest.name, lang);
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
};

// ─── Invite SMS (fixed) ────────────────────────────────────────────────────
export const sendInviteSMS = (guest, lang = 'en') => {
    const phone = (guest.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
        alert(lang === 'ta' ? 'சரியான கைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a valid mobile number.');
        return;
    }

    const message = getInviteText(guest.name, lang);
    const encodedMsg = encodeURIComponent(message);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const smsUrl = isIOS
        ? `sms:${phone}&body=${encodedMsg}`
        : `sms:${phone}?body=${encodedMsg}`;
    window.location.href = smsUrl;
};
