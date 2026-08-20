import React, { useState, useRef } from 'react';
import { X, Send, MapPin, Users, CheckCircle, Sparkles, Filter, ExternalLink, UserPlus, Upload, FileSpreadsheet } from 'lucide-react';

const InviteBroadcastModal = ({ isOpen, onClose, functionDetail, guests = [], lang = 'en' }) => {
    if (!isOpen) return null;

    const isTa = lang === 'ta';
    const fileInputRef = useRef(null);
    const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | 'VIP' | 'Relative' | 'Friend'
    const [venueLocation, setVenueLocation] = useState(functionDetail?.venueLocation || 'https://maps.google.com/?q=Wedding+Hall');
    const [customGuests, setCustomGuests] = useState([]);
    const [customMessage, setCustomMessage] = useState(
        isTa
            ? `💐 மனமார்ந்த அழைப்பிதழ் 💐\n\nஅன்புள்ள {GUEST_NAME},\nஎங்களது ${functionDetail?.name || 'சிறப்பு'} விழாவிற்கு உங்களை குடும்பத்துடன் அன்போடு அழைக்கிறோம். 🙏\n\n📅 தேதி: ${functionDetail?.date || 'அடுத்த வாரம்'}\n📍 மண்டபம்: ${functionDetail?.venue || 'திருமண மண்டபம்'}\n🗺️ Google Maps: {MAP_LINK}\n\nஅன்புடன்,\n${functionDetail?.host || 'குடும்பத்தினர்'}`
            : `💐 Warm Invitation 💐\n\nDear {GUEST_NAME},\nWe cordially invite you and your family to grace our ${functionDetail?.name || 'Grand Event'} celebration. 🙏\n\n📅 Date: ${functionDetail?.date || 'Upcoming'}\n📍 Venue: ${functionDetail?.venue || 'Event Hall'}\n🗺️ Google Maps: {MAP_LINK}\n\nWith Love & Blessings,\n${functionDetail?.host || 'Host Family'}`
    );

    const [sentStatus, setSentStatus] = useState({}); // { guestId: true }

    // Combine base guests + imported custom guests
    const allCombinedGuests = [...guests, ...customGuests];

    // Filter guests with phone numbers
    const validGuests = allCombinedGuests.filter(g => {
        const phone = (g.phone || '').replace(/\D/g, '');
        if (phone.length < 10) return false;
        if (selectedCategory === 'ALL') return true;
        return (g.relation || '').toLowerCase().includes(selectedCategory.toLowerCase());
    });

    // 1. Web Contact Picker API: Select Contacts directly from Phone
    const handleImportMobileContacts = async () => {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const props = ['name', 'tel'];
                const opts = { multiple: true };
                const picked = await navigator.contacts.select(props, opts);
                if (picked && picked.length > 0) {
                    const imported = picked.map((c, i) => ({
                        id: 'm_contact_' + Date.now() + '_' + i,
                        guestName: (c.name && c.name[0]) ? c.name[0] : 'Mobile Guest',
                        phone: (c.tel && c.tel[0]) ? c.tel[0].replace(/\D/g, '') : '',
                        relation: 'Relative'
                    })).filter(g => g.phone.length >= 10);
                    setCustomGuests(prev => [...prev, ...imported]);
                    alert(isTa ? `✅ ${imported.length} மொபைல் தொடர்புகள் இறக்குமதி செய்யப்பட்டன!` : `✅ ${imported.length} Mobile Contacts Imported!`);
                }
            } catch (err) {
                console.warn('Contact picker cancelled/unavailable:', err);
                fileInputRef.current?.click();
            }
        } else {
            // Trigger CSV File Upload fallback if Web Contacts API is unsupported on browser
            fileInputRef.current?.click();
        }
    };

    // 2. CSV / Spreadsheet File Import
    const handleCsvUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result || '';
            const lines = text.split('\n');
            const imported = [];

            lines.forEach((line, index) => {
                if (!line.trim() || index === 0 && line.toLowerCase().includes('name')) return;
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const name = parts[0].trim().replace(/^["']|["']$/g, '');
                    const phone = parts[1].trim().replace(/\D/g, '');
                    const relation = parts[2] ? parts[2].trim() : 'Relative';

                    if (phone.length >= 10) {
                        imported.push({
                            id: 'csv_' + Date.now() + '_' + index,
                            guestName: name || 'Guest',
                            phone: phone,
                            relation: relation
                        });
                    }
                }
            });

            if (imported.length > 0) {
                setCustomGuests(prev => [...prev, ...imported]);
                alert(isTa ? `✅ ${imported.length} தொடர்புகள் CSV-யிலிருந்து பெறப்பட்டன!` : `✅ ${imported.length} Contacts Imported from CSV File!`);
            } else {
                alert(isTa ? 'CSV கோப்பில் தொலைபேசி எண்கள் எதுவும் இல்லை.' : 'No valid contacts found in CSV file.');
            }
        };
        reader.readAsText(file);
    };

    const handleSendWhatsAppInvite = (guest) => {
        let phone = (guest.phone || '').replace(/\D/g, '');
        if (phone.length === 10) phone = '91' + phone;

        const messageText = customMessage
            .replace('{GUEST_NAME}', guest.guestName || guest.name || (isTa ? 'அன்பு நண்பர்' : 'Dear Guest'))
            .replace('{MAP_LINK}', venueLocation);

        const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank');

        setSentStatus(prev => ({ ...prev, [guest.id || guest.phone]: true }));
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt,.xlsx"
                style={{ display: 'none' }}
                onChange={handleCsvUpload}
            />

            <div style={{
                background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '640px',
                maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid #CBD5E1',
                boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)', position: 'relative'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <X size={18} color="#64748B" />
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{ width: '42px', height: '42px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={22} color="#D97706" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                            {isTa ? 'வாட்ஸ்அப் மொத்த அழைப்பிதழ் மையம்' : 'WhatsApp Bulk Invitation Center'}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                            {isTa ? 'உறவினர்களுக்கு ஒரே நேரத்தில் அழைப்பிதழ் & கூகுள் மேப் லொகேஷன் அனுப்பவும்' : 'Broadcast invite cards & Google Maps location pins to guests'}
                        </p>
                    </div>
                </div>

                {/* IMPORT CONTACTS TOOLBAR (MOBILE CONTACTS & CSV FILE) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                    <button
                        onClick={handleImportMobileContacts}
                        style={{
                            padding: '10px 14px', borderRadius: '12px', background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                            color: '#1D4ED8', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        <UserPlus size={16} />
                        {isTa ? '📱 மொபைல் காண்டாக்ட்ஸ் இறக்குமதி' : '📱 Import Mobile Contacts'}
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            padding: '10px 14px', borderRadius: '12px', background: '#ECFDF5', border: '1.5px solid #A7F3D0',
                            color: '#047857', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        <FileSpreadsheet size={16} />
                        {isTa ? '📄 Excel / CSV கோப்பு அப்லோட்' : '📄 Upload Excel / CSV List'}
                    </button>
                </div>

                {/* Category Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                        { id: 'ALL', label: isTa ? 'அனைத்து விருந்தினர்கள்' : 'All Guests' },
                        { id: 'VIP', label: '⭐ VIPs' },
                        { id: 'Relative', label: isTa ? 'உறவினர்கள்' : 'Relatives' },
                        { id: 'Friend', label: isTa ? 'நண்பர்கள்' : 'Friends' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedCategory(tab.id)}
                            style={{
                                padding: '8px 14px', borderRadius: '100px', fontSize: '0.82rem', fontWeight: 800,
                                border: selectedCategory === tab.id ? '2px solid #D97706' : '1px solid #E2E8F0',
                                background: selectedCategory === tab.id ? '#FEF3C7' : '#F8FAFC',
                                color: selectedCategory === tab.id ? '#B45309' : '#64748B',
                                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Venue Location Pin Input */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <MapPin size={16} color="#EA580C" /> {isTa ? 'மண்டப Google Maps லொகேஷன் லிங்க்' : 'Venue Google Maps Location Link'}
                    </label>
                    <input
                        type="text"
                        value={venueLocation}
                        onChange={(e) => setVenueLocation(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC' }}
                    />
                </div>

                {/* Guest List Selector */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1rem', maxHeight: '220px', overflowY: 'auto', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                            {isTa ? 'தேர்ந்தெடுக்கப்பட்ட தொடர்புகள்' : 'Target Guest List'} ({validGuests.length})
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                            ✓ Direct WhatsApp Ready
                        </span>
                    </div>

                    {validGuests.length === 0 ? (
                        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8', margin: '1.5rem 0' }}>
                            {isTa ? 'தொலைபேசி எண் கொண்ட விருந்தினர்கள் இல்லை. மேலே உள்ள Import பட்டனை கிளிக் செய்யவும்.' : 'No guests found. Click Import Mobile Contacts or Upload Excel above.'}
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {validGuests.map((g, idx) => {
                                const isSent = sentStatus[g.id || g.phone];
                                return (
                                    <div key={g.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{g.guestName || g.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>📱 +{g.phone} ({g.relation || 'Guest'})</div>
                                        </div>
                                        <button
                                            onClick={() => handleSendWhatsAppInvite(g)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                background: isSent ? '#DCFCE7' : '#25D366',
                                                color: isSent ? '#166534' : '#FFFFFF',
                                                fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            {isSent ? <CheckCircle size={14} /> : <Send size={14} />}
                                            {isSent ? (isTa ? 'அனுப்பப்பட்டது' : 'Sent') : (isTa ? 'அழைப்பிதழ் அனுப்பு' : 'Send Invite')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748B' }}>
                    {isTa ? '📱 வாட்ஸ்அப் மூலம் காண்டாக்ட்ஸை சேமிக்காமல் நேரடியாக அழைப்பிதழ் அனுப்பலாம்.' : '📱 Sends invitations directly via WhatsApp without saving contacts.'}
                </div>
            </div>
        </div>
    );
};

export default InviteBroadcastModal;
