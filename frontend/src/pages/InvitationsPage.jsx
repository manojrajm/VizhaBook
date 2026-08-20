import React, { useState, useRef } from 'react';
import {
    Send, Users, MapPin, CheckCircle, Search, UserPlus, FileSpreadsheet,
    Plus, Sparkles, Filter, CheckCircle2, MessageCircle, ExternalLink, ShieldCheck, Heart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import Card from '../components/ui/Card';

const InvitationsPage = () => {
    const { functions, moiEntries, addEntry, lang } = useApp();
    const isTa = lang === 'ta';
    const fileInputRef = useRef(null);

    const activeFunction = functions && functions.length > 0 ? functions[0] : { name: 'Grand Celebration', date: '2026-10-15', host: 'Family' };

    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [customGuests, setCustomGuests] = useState([]);
    const [sentStatus, setSentStatus] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newGuestForm, setNewGuestForm] = useState({ name: '', phone: '', relation: 'Relative' });

    const [venueLocation, setVenueLocation] = useState('https://maps.google.com/?q=Wedding+Hall');
    const [customMessage, setCustomMessage] = useState(
        isTa
            ? `💐 மனமார்ந்த அழைப்பிதழ் 💐\n\nஅன்புள்ள {GUEST_NAME},\nஎங்களது ${activeFunction.name} விழாவிற்கு உங்களை குடும்பத்துடன் அன்போடு அழைக்கிறோம். 🙏\n\n📅 தேதி: ${activeFunction.date || 'அடுத்த வாரம்'}\n📍 மண்டபம்: ${activeFunction.venue || 'திருமண மண்டபம்'}\n🗺️ Google Maps: {MAP_LINK}\n\nஅன்புடன்,\n${activeFunction.host || 'குடும்பத்தினர்'}`
            : `💐 Warm Invitation 💐\n\nDear {GUEST_NAME},\nWe cordially invite you and your family to grace our ${activeFunction.name} celebration. 🙏\n\n📅 Date: ${activeFunction.date || 'Upcoming'}\n📍 Venue: ${activeFunction.venue || 'Event Hall'}\n🗺️ Google Maps: {MAP_LINK}\n\nWith Love & Blessings,\n${activeFunction.host || 'Host Family'}`
    );

    // Combine base entries + custom imported guests
    const allCombinedGuests = [...(moiEntries || []), ...customGuests];

    // Filter guests
    const filteredGuests = allCombinedGuests.filter(g => {
        const name = (g.guestName || g.name || '').toLowerCase();
        const phone = (g.phone || '').replace(/\D/g, '');
        const relation = (g.relation || '').toLowerCase();

        const matchesSearch = name.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);
        const matchesCategory = selectedCategory === 'ALL' || relation.includes(selectedCategory.toLowerCase());

        return matchesSearch && matchesCategory;
    });

    // Mobile Contacts Import
    const handleImportMobileContacts = async () => {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const picked = await navigator.contacts.select(['name', 'tel'], { multiple: true });
                if (picked && picked.length > 0) {
                    const imported = picked.map((c, i) => ({
                        id: 'm_contact_' + Date.now() + '_' + i,
                        guestName: (c.name && c.name[0]) ? c.name[0] : 'Mobile Guest',
                        phone: (c.tel && c.tel[0]) ? c.tel[0].replace(/\D/g, '') : '',
                        relation: 'Relative'
                    })).filter(g => g.phone.length >= 10);
                    setCustomGuests(prev => [...prev, ...imported]);
                    alert(isTa ? `✅ ${imported.length} தொடர்புகள் பெறப்பட்டன!` : `✅ ${imported.length} Mobile Contacts Imported!`);
                }
            } catch (err) {
                console.warn('Contact picker cancelled:', err);
                fileInputRef.current?.click();
            }
        } else {
            fileInputRef.current?.click();
        }
    };

    // CSV File Import
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
            }
        };
        reader.readAsText(file);
    };

    // Add Manual Guest
    const handleAddManualGuest = (e) => {
        e.preventDefault();
        if (!newGuestForm.name || !newGuestForm.phone) return;
        setCustomGuests(prev => [
            ...prev,
            {
                id: 'man_' + Date.now(),
                guestName: newGuestForm.name,
                phone: newGuestForm.phone.replace(/\D/g, ''),
                relation: newGuestForm.relation
            }
        ]);
        setNewGuestForm({ name: '', phone: '', relation: 'Relative' });
        setShowAddModal(false);
    };

    // Dispatch WhatsApp Invitation
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

    const sentCount = Object.keys(sentStatus).length;

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
            
            <input type="file" ref={fileInputRef} accept=".csv,.txt" style={{ display: 'none' }} onChange={handleCsvUpload} />

            {/* PAGE HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#FEF3C7', padding: '4px 12px', borderRadius: '100px' }}>
                        💌 MNC Invitation & Broadcast Studio
                    </span>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0F172A', margin: '0.4rem 0 0.2rem', fontFamily: "'Playfair Display', serif" }}>
                        {isTa ? 'அழைப்பிதழ் & வாட்ஸ்அப் பரப்புரை மையம்' : 'Guest Invitations & Broadcast Studio'}
                    </h1>
                    <p style={{ color: '#64748B', fontWeight: 600, margin: 0 }}>
                        {isTa ? 'உறவினர்களுக்கு வாட்ஸ்அப் மூலம் அழைப்பிதழ் & கூகுள் மேப் லொகேஷன் அனுப்பவும்' : 'Broadcast personalized digital invitation cards & Google Maps pins'}
                    </p>
                </div>

                {/* IMPORTER BUTTON TOOLBAR */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleImportMobileContacts}
                        style={{
                            padding: '0.85rem 1.25rem', borderRadius: '14px', background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                            color: '#1D4ED8', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(29, 78, 216, 0.08)'
                        }}
                    >
                        <UserPlus size={18} />
                        {isTa ? 'மொபைல் காண்டாக்ட்ஸ்' : 'Import Mobile Contacts'}
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            padding: '0.85rem 1.25rem', borderRadius: '14px', background: '#ECFDF5', border: '1.5px solid #A7F3D0',
                            color: '#047857', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(4, 120, 87, 0.08)'
                        }}
                    >
                        <FileSpreadsheet size={18} />
                        {isTa ? 'Excel / CSV அப்லோட்' : 'Upload CSV File'}
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            padding: '0.85rem 1.25rem', borderRadius: '14px', background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)',
                            color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(30, 58, 138, 0.3)'
                        }}
                    >
                        <Plus size={18} />
                        {isTa ? 'புதிய விருந்தினர்' : 'Add Guest'}
                    </button>
                </div>
            </div>

            {/* EXECUTIVE SUMMARY KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 4px 15px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'மொத்த விருந்தினர்கள்' : 'Total Guests'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{allCombinedGuests.length}</div>
                    <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>✓ Directory Ready</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 4px 15px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'அழைப்பு அனுப்பப்பட்டவை' : 'Invites Broadcasted'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#25D366', marginTop: '4px' }}>{sentCount}</div>
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>✓ Sent via WhatsApp</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 4px 15px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'வாட்ஸ்அப் எண்கள்' : 'WhatsApp Ready'}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1D4ED8', marginTop: '4px' }}>{filteredGuests.length}</div>
                    <div style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 700, marginTop: '2px' }}>📱 Direct Chat Supported</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 4px 15px rgba(15,23,42,0.03)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'நடைபெறும் விழா' : 'Active Celebration'}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#D97706', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeFunction.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700, marginTop: '2px' }}>📅 {activeFunction.date}</div>
                </div>
            </div>

            {/* BROADCAST CARD & MESSAGE EDITOR */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} color="#D97706" />
                    {isTa ? 'அழைப்பிதழ் மற்றும் லொகேஷன் அமைப்பு' : 'Invitation Card & Location Pin Customizer'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                            <MapPin size={16} color="#EA580C" /> {isTa ? 'மண்டப Google Maps லொகேஷன் லிங்க்' : 'Venue Google Maps Location URL'}
                        </label>
                        <input
                            type="text"
                            value={venueLocation}
                            onChange={(e) => setVenueLocation(e.target.value)}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#F8FAFC', marginBottom: '1rem' }}
                        />

                        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '6px', display: 'block' }}>
                            {isTa ? 'வாட்ஸ்அப் செய்தி வார்ப்புரு (Template)' : 'WhatsApp Message Template ({GUEST_NAME} & {MAP_LINK})'}
                        </label>
                        <textarea
                            rows={6}
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', fontFamily: 'inherit', lineHeight: 1.5 }}
                        />
                    </div>

                    {/* LIVE PREVIEW CARD */}
                    <div style={{ background: 'radial-gradient(circle at 50% 0%, #0F172A 0%, #030712 100%)', border: '2px solid #D97706', borderRadius: '20px', padding: '1.5rem', color: '#FFFFFF', textAlign: 'center', position: 'relative' }}>
                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>🪔</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B' }}>
                            {isTa ? 'மனமார்ந்த அழைப்பிதழ்' : 'Warm Invitation'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '4px 0 12px' }}>
                            {activeFunction.name}
                        </div>

                        <div style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.6, textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(217,119,6,0.3)' }}>
                            {customMessage.replace('{GUEST_NAME}', 'விருந்தினர்').replace('{MAP_LINK}', 'https://maps.google.com/...')}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} color="#D97706" /> Official VizhaBook Digital Invite
                        </div>
                    </div>
                </div>
            </div>

            {/* GUEST MATRIX TABLE */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                
                {/* TOOLBAR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    {/* CATEGORY TABS */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
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
                                    padding: '8px 16px', borderRadius: '100px', fontSize: '0.82rem', fontWeight: 800,
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

                    {/* SEARCH INPUT */}
                    <div style={{ position: 'relative', width: '260px' }}>
                        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder={isTa ? 'பெயர் / போன் தேடுக…' : 'Search name or phone…'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.25rem', borderRadius: '100px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        />
                    </div>
                </div>

                {/* TABLE */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#0F172A', color: '#FFFFFF', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '14px 16px', borderRadius: '12px 0 0 12px' }}>{isTa ? 'விருந்தினர் பெயர்' : 'Guest Name'}</th>
                                <th style={{ padding: '14px 16px' }}>{isTa ? 'தொலைபேசி எண்' : 'Mobile Phone'}</th>
                                <th style={{ padding: '14px 16px' }}>{isTa ? 'உறவுமுறை' : 'Relation'}</th>
                                <th style={{ padding: '14px 16px' }}>{isTa ? 'வாட்ஸ்அப் நிலை' : 'WhatsApp Status'}</th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>{isTa ? 'செயல்பாடு' : 'Action'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
                                        {isTa ? 'விருந்தினர்கள் யாரும் இல்லை. மேலே உள்ள Import பட்டனைப் பயன்படுத்தவும்.' : 'No guests found. Click Import Mobile Contacts or Upload CSV above.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredGuests.map((g, idx) => {
                                    const isSent = sentStatus[g.id || g.phone];
                                    const phoneDigits = (g.phone || '').replace(/\D/g, '');
                                    const hasValidPhone = phoneDigits.length >= 10;

                                    return (
                                        <tr key={g.id || idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'all 0.15s' }}>
                                            <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                                                {g.guestName || g.name || 'Guest'}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#334155', fontFamily: 'monospace', fontWeight: 700 }}>
                                                {hasValidPhone ? `+${phoneDigits}` : <span style={{ color: '#EF4444' }}>Invalid</span>}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700 }}>
                                                    {g.relation || 'Relative'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                {isSent ? (
                                                    <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', padding: '4px 10px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle2 size={14} /> {isTa ? 'அழைப்பிதழ் அனுப்பப்பட்டது' : 'Invite Broadcasted'}
                                                    </span>
                                                ) : (
                                                    <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '4px 10px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800 }}>
                                                        ⏳ Ready to Send
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                <button
                                                    disabled={!hasValidPhone}
                                                    onClick={() => handleSendWhatsAppInvite(g)}
                                                    style={{
                                                        padding: '8px 16px', borderRadius: '10px', border: 'none',
                                                        background: hasValidPhone ? (isSent ? '#166534' : '#25D366') : '#CBD5E1',
                                                        color: '#FFFFFF', fontWeight: 800, fontSize: '0.82rem',
                                                        cursor: hasValidPhone ? 'pointer' : 'not-allowed',
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        boxShadow: hasValidPhone ? '0 3px 10px rgba(37,211,102,0.25)' : 'none'
                                                    }}
                                                >
                                                    <Send size={14} />
                                                    {isSent ? (isTa ? 'மீண்டும் அனுப்பு' : 'Resend') : (isTa ? 'வாட்ஸ்அப் அனுப்பு' : 'Send Invite')}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD MANUAL GUEST MODAL */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '2rem', border: '1px solid #CBD5E1', position: 'relative' }}>
                        <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={18} color="#64748B" />
                        </button>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: '0 0 1.25rem' }}>
                            {isTa ? 'புதிய விருந்தினரைச் சேர்க்க' : 'Add Guest Manually'}
                        </h3>
                        <form onSubmit={handleAddManualGuest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>{isTa ? 'விருந்தினர் பெயர்' : 'Guest Name'}</label>
                                <input type="text" required value={newGuestForm.name} onChange={(e) => setNewGuestForm({ ...newGuestForm, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>{isTa ? 'தொலைபேசி எண்' : 'Mobile Phone'}</label>
                                <input type="tel" required value={newGuestForm.phone} onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', marginTop: '4px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>{isTa ? 'உறவுமுறை' : 'Relation'}</label>
                                <select value={newGuestForm.relation} onChange={(e) => setNewGuestForm({ ...newGuestForm, relation: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', marginTop: '4px' }}>
                                    <option value="Relative">Relative</option>
                                    <option value="VIP">VIP</option>
                                    <option value="Friend">Friend</option>
                                </select>
                            </div>
                            <button type="submit" style={{ padding: '0.9rem', borderRadius: '12px', background: '#1E3A8A', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', marginTop: '0.5rem' }}>
                                {isTa ? 'விருந்தினரைச் சேமி' : 'Save Guest'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InvitationsPage;
