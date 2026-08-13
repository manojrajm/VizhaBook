import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Wallet, Gift, MessageSquare, MessageCircle, Calendar, Plus, MapPin, User, Clock, QrCode, Mic, CreditCard, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import { MOCK_ENTRIES, MOCK_FUNCTIONS } from '../utils/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { sendWhatsAppMessage, sendSMSMessage } from '../utils/communication';
import { motion, AnimatePresence } from 'framer-motion';
import moiService from '../services/moiService';
import functionService from '../services/functionService';
import paymentMethodService from '../services/paymentMethodService';

const Ledger = () => {
    const { entries: localEntries, functions: localFunctions, removeEntry, lang } = useApp();
    const isTa = lang === 'ta';

    const [entries, setEntries] = useState([]);
    const [functions, setFunctions] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [functionFilter, setFunctionFilter] = useState('All');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
    const [sourceFilter, setSourceFilter] = useState('All');

    const [kpis, setKpis] = useState({
        totalAmount: 0,
        count: 0,
        upiCollection: 0,
        cashCollection: 0,
        paymentBreakdown: {}
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        // Load functions
        const fnRes = await functionService.getFunctions();
        if (fnRes.success && fnRes.functions.length > 0) {
            setFunctions(fnRes.functions);
        } else {
            setFunctions(localFunctions.length ? localFunctions : MOCK_FUNCTIONS);
        }

        // Load Moi entries from PostgreSQL API
        const res = await moiService.getMoiEntries();
        if (res.success && res.entries) {
            setEntries(res.entries);
            setKpis({
                totalAmount: res.totalAmount || 0,
                count: res.count || 0,
                upiCollection: res.upiCollection || 0,
                cashCollection: res.cashCollection || 0,
                paymentBreakdown: res.paymentBreakdown || {}
            });
        } else {
            setEntries(localEntries.length ? localEntries : MOCK_ENTRIES);
            const total = (localEntries.length ? localEntries : MOCK_ENTRIES).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            setKpis({
                totalAmount: total,
                count: (localEntries.length ? localEntries : MOCK_ENTRIES).length,
                upiCollection: total * 0.6,
                cashCollection: total * 0.4,
                paymentBreakdown: { 'Cash': total * 0.4, 'GPay': total * 0.6 }
            });
        }
        setLoading(false);
    }, [localEntries, localFunctions]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredEntries = entries.filter(entry => {
        const guest = (entry.guestName || '').toLowerCase();
        const func = (entry.functionName || '').toLowerCase();
        const txn = (entry.transactionReference || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchesSearch = !searchTerm.trim() || guest.includes(search) || func.includes(search) || txn.includes(search);
        const matchesType = filterType === 'All' || entry.giftType === filterType || entry.giftItem === filterType;
        const matchesFunction = functionFilter === 'All' || String(entry.functionId) === String(functionFilter) || entry.functionName === functionFilter;
        const matchesSource = sourceFilter === 'All' || entry.entrySource === sourceFilter;
        const matchesPm = paymentMethodFilter === 'All'
            || (paymentMethodFilter === 'UNSPECIFIED' && !entry.paymentMethodId)
            || (paymentMethodFilter === 'UPI' && (entry.paymentMethodType === 'UPI' || entry.paymentMode === 'UPI'))
            || (paymentMethodFilter === 'Cash' && (entry.paymentMethodType === 'CASH' || entry.paymentMode === 'Cash' || (!entry.paymentMethodType && entry.paymentMode !== 'UPI')))
            || (entry.paymentMethodId === paymentMethodFilter);

        return matchesSearch && matchesType && matchesFunction && matchesSource && matchesPm;
    });

    const totalFilteredAmount = filteredEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredEntries.map(e => ({
            'Guest Name': e.guestName,
            'Function': e.functionName || '—',
            'Amount (₹)': e.amount || 0,
            'Gift Type': e.giftType || e.giftItem || 'Cash',
            'Payment Method': e.paymentMethodName || e.paymentMode || 'Not specified',
            'Payment Type': e.paymentMethodType || e.paymentMode || 'Cash',
            'Entry Source': e.entrySource || 'manual',
            'Transaction Ref': e.transactionReference || '—',
            'Date': e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Moi Records");
        XLSX.writeFile(workbook, "VizhaBook_Digital_Moi_Records.xlsx");
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isTa ? 'இந்த மொய்ப் பதிவை நீக்க வேண்டுமா?' : 'Delete this Moi entry?')) return;
        const res = await moiService.deleteMoiEntry(id);
        if (res.success) {
            loadData();
        } else {
            removeEntry(id);
            loadData();
        }
    };

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2.5rem' }}>

            {/* Header */}
            <header className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.25rem', color: '#0F172A', fontFamily: "'Playfair Display', serif", margin: '0 0 4px', fontWeight: 800 }}>
                        {isTa ? 'மொய் கணக்குப் புத்தகம் (Ledger)' : 'Moi Ledger'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        {isTa ? 'பெறப்பட்ட அனைத்து மொய் மற்றும் பரிசுகளின் முழுமையான விவரங்கள்.' : 'Complete record of all gifts and payments received across functions.'}
                    </p>
                </div>
                <button className="btn-secondary" onClick={exportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', padding: '0 18px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', fontWeight: 700, cursor: 'pointer' }}>
                    <Download size={18} /> {isTa ? 'Excel / CSV பதிவிறக்கு' : 'Export Excel'}
                </button>
            </header>

            {/* KPI Summary Cards Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem 1.4rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', borderLeft: '5px solid #1E3A8A' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isTa ? 'மொத்த மொய் வசூல்' : 'Total Moi Collection'}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>₹{kpis.totalAmount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>{kpis.count} {isTa ? 'பதிவுகள்' : 'entries'}</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem 1.4rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', borderLeft: '5px solid #3B82F6' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isTa ? 'UPI வசூல் (GPay / PhonePe)' : 'UPI Collection'}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E3A8A', marginTop: '4px' }}>₹{kpis.upiCollection.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 700, marginTop: '2px' }}>Online Transfer</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem 1.4rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', borderLeft: '5px solid #10B981' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isTa ? 'நேரடி பண வசூல்' : 'Cash Collection'}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>₹{kpis.cashCollection.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>Physical Cash</div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                    <input
                        type="text"
                        placeholder={isTa ? 'பெயர், விழா அல்லது UTR எண் தேட…' : 'Search guest, function or UTR ref...'}
                        style={{
                            width: '100%',
                            height: '42px',
                            padding: '0 1rem 0 2.75rem',
                            borderRadius: '10px',
                            border: '1.5px solid #E2E8F0',
                            background: '#F8FAFC',
                            color: '#0F172A',
                            fontSize: '0.9rem',
                            outline: 'none'
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Function Filter */}
                    <select
                        style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                        value={functionFilter}
                        onChange={(e) => setFunctionFilter(e.target.value)}
                    >
                        <option value="All">{isTa ? 'அனைத்து விழாக்கள்' : 'All Functions'}</option>
                        {functions.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>

                    {/* Payment Method Filter */}
                    <select
                        style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                        value={paymentMethodFilter}
                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    >
                        <option value="All">{isTa ? 'அனைத்து செலுத்தல் முறைகள்' : 'All Payment Methods'}</option>
                        <option value="UPI">UPI (GPay / PhonePe)</option>
                        <option value="Cash">{isTa ? 'பணம் (Cash)' : 'Cash'}</option>
                        <option value="UNSPECIFIED">{isTa ? 'குறிப்பிடப்படவில்லை' : 'Not Specified'}</option>
                    </select>

                    {/* Source Filter */}
                    <select
                        style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                    >
                        <option value="All">{isTa ? 'அனைத்து வழிகள் (All Sources)' : 'All Entry Sources'}</option>
                        <option value="manual">{isTa ? 'நேரடி பதிவு (Manual)' : 'Manual Entry'}</option>
                        <option value="voice">{isTa ? 'குரல் பதிவு (Voice)' : 'Voice Entry'}</option>
                        <option value="qr_checkin">{isTa ? 'QR செக்-இன் (QR Check-In)' : 'QR Check-In'}</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', color: '#64748B', gap: '8px' }}>
                        <Loader2 size={22} className="pm-spin" />
                        <span>{isTa ? 'ஏற்றுகிறது…' : 'Loading ledger entries…'}</span>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'விருந்தினர் & விழா' : 'Guest & Event'}</th>
                                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'தொகை / பரிசு' : 'Amount / Gift'}</th>
                                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'செலுத்திய முறை' : 'Payment Method'}</th>
                                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'பதிவு வழி' : 'Source'}</th>
                                <th style={{ textAlign: 'center', padding: '1rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'வாழ்த்து அனுப்ப' : 'Greetings'}</th>
                                <th style={{ textAlign: 'right', padding: '1rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{isTa ? 'செயல்' : 'Action'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                                        {isTa ? 'பதிவுகள் எதுவும் இல்லை' : 'No records found matching your filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry, idx) => (
                                    <tr key={entry.id || idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAF2E6' }}>
                                        {/* Guest & Function */}
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{entry.guestName}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                                                {entry.functionName || 'Function'} {entry.phone ? `• 📞 ${entry.phone}` : ''}
                                            </p>
                                        </td>

                                        {/* Amount */}
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <p style={{ margin: 0, fontWeight: 900, color: '#059669', fontSize: '1.05rem' }}>
                                                {Number(entry.amount) > 0 ? `₹${Number(entry.amount).toLocaleString('en-IN')}` : (entry.giftItem || entry.description || 'Gift')}
                                            </p>
                                            {entry.transactionReference && (
                                                <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
                                                    Ref: {entry.transactionReference}
                                                </p>
                                            )}
                                        </td>

                                        {/* Payment Method */}
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '100px',
                                                fontSize: '0.72rem',
                                                fontWeight: 800,
                                                background: entry.paymentMethodName ? '#EFF6FF' : '#F1F5F9',
                                                color: entry.paymentMethodName ? '#1D4ED8' : '#475569',
                                                border: '1px solid #DBEAFE'
                                            }}>
                                                💳 {entry.paymentMethodName || entry.paymentMode || 'Not specified'}
                                            </span>
                                        </td>

                                        {/* Entry Source */}
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                background: entry.entrySource === 'voice' ? '#F3E8FF' : (entry.entrySource === 'qr_checkin' ? '#DCFCE7' : '#F1F5F9'),
                                                color: entry.entrySource === 'voice' ? '#7C3AED' : (entry.entrySource === 'qr_checkin' ? '#15803D' : '#475569')
                                            }}>
                                                {entry.entrySource === 'voice' ? '🎙️ Voice' : (entry.entrySource === 'qr_checkin' ? '📱 QR Check-In' : '✍️ Manual')}
                                            </span>
                                        </td>

                                        {/* Greetings */}
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => sendWhatsAppMessage(entry, lang)}
                                                    title="Send WhatsApp"
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25D366', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => sendSMSMessage(entry, lang)}
                                                    title="Send SMS"
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#8B5CF6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            </div>
                                        </td>

                                        {/* Delete */}
                                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                                title="Delete entry"
                                            >
                                                <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0', fontWeight: 800 }}>
                            <tr>
                                <td colSpan="2" style={{ padding: '1.1rem 1.25rem', textAlign: 'right', color: '#64748B', fontSize: '0.825rem', textTransform: 'uppercase' }}>
                                    {isTa ? `மொத்தம் (${filteredEntries.length} பதிவுகள்)` : `Total (${filteredEntries.length} entries)`}
                                </td>
                                <td colSpan="4" style={{ padding: '1.1rem 1.25rem', color: '#0F172A', fontSize: '1.25rem', fontWeight: 900 }}>
                                    ₹{totalFilteredAmount.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Ledger;
