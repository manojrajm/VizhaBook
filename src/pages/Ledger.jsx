import React, { useState } from 'react';
import { Search, Filter, Download, FileSpreadsheet, Wallet, Gift, MessageSquare, MessageCircle, Calendar, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MOCK_ENTRIES, MOCK_FUNCTIONS } from '../utils/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { sendWhatsAppMessage, sendSMSMessage } from '../utils/communication';

const Ledger = () => {
    const { entries, functions, removeEntry, lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [functionFilter, setFunctionFilter] = useState('All');

    const displayEntries = entries.length ? entries : MOCK_ENTRIES;
    const displayFunctions = functions.length ? functions : MOCK_FUNCTIONS;

    const filteredEntries = displayEntries.filter(entry => {
        const matchesSearch = entry.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.functionName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || entry.giftType === filterType;
        const matchesFunction = functionFilter === 'All' || entry.functionId?.toString() === functionFilter || entry.functionName === functionFilter;
        return matchesSearch && matchesType && matchesFunction;
    });

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(displayEntries.map(e => ({
            'Guest Name': e.guestName,
            'Function': e.functionName,
            'Amount (₹)': e.amount,
            'Gift Type': e.giftType,
            'Description': e.description || '',
            'Date': new Date(e.date).toLocaleString()
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Moi Records");
        XLSX.writeFile(workbook, "Digital_Moi_Records.xlsx");
    };

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.25rem', color: 'var(--text-primary)' }}>{lang === 'en' ? 'Moi Ledger' : 'மொய் கணக்கு'}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>{lang === 'en' ? 'Complete record of all gifts received.' : 'பெறப்பட்ட அனைத்து மொய் விவரங்களின் தொகுப்பு.'}</p>
                </div>
                <button className="btn-secondary" onClick={exportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} /> {lang === 'en' ? 'Export CSV' : 'ஏற்றுமதி செய்'}
                </button>
            </header>

            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.25rem' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                    <input
                        type="text"
                        placeholder={lang === 'en' ? 'Search records...' : 'தேடுங்கள்...'}
                        style={{
                            width: '100%',
                            padding: '0.875rem 1rem 0.875rem 3rem',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--border-color)',
                            background: 'white',
                            fontSize: '0.95rem'
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        style={{
                            padding: '0.875rem 1.25rem',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--border-color)',
                            background: 'white',
                            fontSize: '0.95rem',
                            minWidth: '200px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                        value={functionFilter}
                        onChange={(e) => setFunctionFilter(e.target.value)}
                    >
                        <option value="All">{lang === 'en' ? 'All Functions' : 'அனைத்து விழாக்கள்'}</option>
                        {displayFunctions.map(f => (
                            <option key={f.id} value={f.name}>{f.name}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                        {['All', 'Cash', 'Jewel', 'Gift Item'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    padding: '0.875rem 1.25rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    background: filterType === type ? 'var(--primary-color)' : 'white',
                                    color: filterType === type ? 'white' : 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    boxShadow: filterType === type ? '0 4px 10px rgba(214, 51, 132, 0.2)' : 'none'
                                }}
                            >
                                {type === 'All' && lang === 'ta' ? 'அனைத்தும்' : type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border-color)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recipient & Event</th>
                                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Amount/Gift</th>
                                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Send Greetings</th>
                                <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map((entry) => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{entry.guestName}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.functionName}</p>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                                            {entry.amount > 0 ? `₹${entry.amount.toLocaleString('en-IN')}` : entry.description}
                                        </p>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600, background: '#F3F4F6', color: 'var(--text-secondary)' }}>
                                            {entry.giftType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => sendWhatsAppMessage(entry, lang)}
                                                className="btn-whatsapp"
                                                title="WhatsApp"
                                                style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#25D366', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => sendSMSMessage(entry, lang)}
                                                className="btn-sms"
                                                title="SMS"
                                                style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#8B5CF6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => removeEntry(entry.id)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                        >
                                            <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={{ background: 'var(--bg-primary)', borderTop: '2px solid var(--border-color)', fontWeight: 800 }}>
                            <tr>
                                <td colSpan="2" style={{ padding: '1.25rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                    {lang === 'en' ? `Total (${filteredEntries.length} entries)` : `மொத்தம் (${filteredEntries.length} பதிவுகள்)`}
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--primary-color)', fontSize: '1.125rem' }}>
                                    ₹{filteredEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0).toLocaleString('en-IN')}
                                </td>
                                <td colSpan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Ledger;

