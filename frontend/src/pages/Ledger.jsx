import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
        let currentFns = [];
        if (fnRes.success && fnRes.functions.length > 0) {
            currentFns = fnRes.functions;
            setFunctions(fnRes.functions);
        } else {
            currentFns = localFunctions.length ? localFunctions : MOCK_FUNCTIONS;
            setFunctions(currentFns);
        }

        // Load configured payment methods for active function
        try {
            const targetFnId = functionFilter !== 'All' ? functionFilter : (currentFns[0]?.id);
            if (targetFnId) {
                const pmRes = await paymentMethodService.getPaymentMethodsByFunction(targetFnId);
                if (pmRes.success && pmRes.paymentMethods) {
                    setPaymentMethods(pmRes.paymentMethods);
                }
            }
        } catch (e) {
            console.warn('Payment methods load in ledger:', e.message);
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
    }, [localEntries, localFunctions, functionFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Update payment methods when selected function changes
    useEffect(() => {
        if (functionFilter && functionFilter !== 'All') {
            paymentMethodService.getPaymentMethodsByFunction(functionFilter).then(res => {
                if (res.success && res.paymentMethods) {
                    setPaymentMethods(res.paymentMethods);
                }
            }).catch(() => {});
        }
    }, [functionFilter]);

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

    // Compute dedicated KPI cards for each individual configured UPI Account
    const upiKpiCards = useMemo(() => {
        const map = {};

        // Pre-fill configured active UPI payment methods
        paymentMethods.forEach(pm => {
            if (pm.method_type === 'UPI' && pm.is_active) {
                map[pm.id] = {
                    id: pm.id,
                    name: pm.display_name || pm.name,
                    upiId: pm.upi_id,
                    amount: 0,
                    count: 0
                };
            }
        });

        // Aggregate actual amounts from filtered entries
        filteredEntries.forEach(e => {
            const amt = Number(e.amount) || 0;
            if (e.paymentMethodId && map[e.paymentMethodId]) {
                map[e.paymentMethodId].amount += amt;
                map[e.paymentMethodId].count += 1;
            } else if (e.paymentMethodId && !map[e.paymentMethodId] && (e.paymentMethodType === 'UPI' || e.paymentMode === 'UPI')) {
                const key = e.paymentMethodId;
                map[key] = {
                    id: key,
                    name: e.paymentMethodDisplayName || e.paymentMethodName || 'UPI Account',
                    upiId: e.upiId || e.paymentMethodProvider || '',
                    amount: amt,
                    count: 1
                };
            } else if (!e.paymentMethodId && e.paymentMethodName && e.paymentMethodName !== 'Cash' && e.paymentMode === 'UPI') {
                const key = e.paymentMethodName;
                if (!map[key]) {
                    map[key] = {
                        id: key,
                        name: e.paymentMethodName,
                        upiId: '',
                        amount: 0,
                        count: 0
                    };
                }
                map[key].amount += amt;
                map[key].count += 1;
            }
        });

        return Object.values(map);
    }, [paymentMethods, filteredEntries]);

    // Compute filtered hard cash collection
    const filteredCashAmount = useMemo(() => {
        return filteredEntries
            .filter(e => e.paymentMethodType === 'CASH' || e.paymentMode === 'Cash' || (!e.paymentMethodType && e.paymentMode !== 'UPI'))
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    }, [filteredEntries]);

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

            {/* Dynamic KPI Summary Cards Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Total Collection Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem 1.4rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', borderLeft: '5px solid #1E3A8A' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'மொத்த மொய் வசூல்' : 'Total Moi Collection'}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
                        ₹{totalFilteredAmount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                        {filteredEntries.length} {isTa ? 'பதிவுகள்' : 'entries'}
                    </div>
                </div>

                {/* Hard Cash Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem 1.4rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', borderLeft: '5px solid #10B981' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'நேரடி பண வசூல்' : 'Physical Cash (In-Hand)'}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                        ₹{filteredCashAmount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                        💵 Hard Cash In-Hand
                    </div>
                </div>

                {/* Dynamic Individual UPI Account Cards */}
                {upiKpiCards.map((upi, idx) => {
                    const borderColors = ['#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
                    const bColor = borderColors[idx % borderColors.length];
                    return (
                        <div key={upi.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem 1.4rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', borderLeft: `5px solid ${bColor}` }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>📱 {upi.name}</span>
                                <span style={{ fontSize: '0.62rem', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: '100px', fontWeight: 800 }}>UPI {idx + 1}</span>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E3A8A', marginTop: '4px' }}>
                                ₹{Number(upi.amount).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', fontFamily: 'monospace', fontWeight: 600 }}>
                                {upi.upiId ? upi.upiId : `${upi.count} ${isTa ? 'பதிவுகள்' : 'entries'}`}
                            </div>
                        </div>
                    );
                })}

                {/* Fallback if no individual UPI configured but upiCollection > 0 */}
                {upiKpiCards.length === 0 && (
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.2rem 1.4rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', borderLeft: '5px solid #3B82F6' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isTa ? 'UPI வசூல் (GPay / PhonePe)' : 'UPI Collection'}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E3A8A', marginTop: '4px' }}>₹{kpis.upiCollection.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 700, marginTop: '2px' }}>Online Transfer</div>
                    </div>
                )}
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
                        <option value="All">{isTa ? 'அனைத்து கணக்குகள்' : 'All Payment Methods'}</option>
                        <option value="Cash">{isTa ? '💵 நேரடி ரொக்கம் (Cash)' : '💵 Physical Cash'}</option>
                        <option value="UPI">{isTa ? '📱 அனைத்து UPI கணக்குகள்' : '📱 All UPI Accounts'}</option>
                        {paymentMethods.map(pm => (
                            <option key={pm.id} value={pm.id}>📱 {pm.display_name || pm.name} ({pm.upi_id || pm.provider})</option>
                        ))}
                    </select>

                    {/* Entry Source Filter */}
                    <select
                        style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                    >
                        <option value="All">{isTa ? 'அனைத்து வாயில்கள்' : 'All Entry Sources'}</option>
                        <option value="manual">⌨ Manual Typing</option>
                        <option value="voice">🎙 Voice Speech</option>
                        <option value="qr_checkin">📲 QR Guest Check-in</option>
                    </select>
                </div>
            </div>

            {/* Moi Entries Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                        <Loader2 size={24} className="pm-spin" style={{ margin: '0 auto 8px' }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>{isTa ? 'ஏற்றப்படுகிறது…' : 'Loading Moi entries…'}</p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <Gift size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
                            {isTa ? 'பதிவுகள் எதுவும் காணப்படவில்லை' : 'No Moi entries found'}
                        </h4>
                        <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
                            {isTa ? 'தேடல் அல்லது வடிப்பான்களை மாற்றி முயற்சிக்கவும்.' : 'Try adjusting your search query or filters.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '1rem 1.25rem' }}>Guest Name</th>
                                    <th style={{ padding: '1rem 1.25rem' }}>Gift & Amount</th>
                                    <th style={{ padding: '1rem 1.25rem' }}>Payment Source</th>
                                    <th style={{ padding: '1rem 1.25rem' }}>Entry Source</th>
                                    <th style={{ padding: '1rem 1.25rem' }}>Transaction Ref</th>
                                    <th style={{ padding: '1rem 1.25rem' }}>Date</th>
                                    <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map(entry => {
                                    const isUpi = entry.paymentMethodType === 'UPI' || entry.paymentMode === 'UPI';
                                    const pmLabel = entry.paymentMethodName || entry.paymentMode || 'Cash';
                                    const pmUpi = entry.upiId || entry.paymentMethodProvider || '';

                                    return (
                                        <tr key={entry.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }} className="ledger-tr">
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>{entry.guestName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span>{entry.functionName || 'General'}</span>
                                                    {entry.relation && <span>• {entry.relation}</span>}
                                                </div>
                                            </td>

                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                {Number(entry.amount) > 0 ? (
                                                    <div style={{ fontWeight: 900, color: '#059669', fontSize: '1.1rem' }}>
                                                        ₹{Number(entry.amount).toLocaleString('en-IN')}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontWeight: 700, color: '#4F46E5' }}>
                                                        {entry.giftType || entry.giftItem || 'Gift'}
                                                    </div>
                                                )}
                                            </td>

                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{
                                                        fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '100px', width: 'fit-content',
                                                        background: isUpi ? '#EFF6FF' : '#ECFDF5',
                                                        color: isUpi ? '#1D4ED8' : '#047857',
                                                        border: isUpi ? '1px solid #BFDBFE' : '1px solid #A7F3D0'
                                                    }}>
                                                        {isUpi ? `📱 ${pmLabel}` : `💵 Physical Cash`}
                                                    </span>
                                                    {pmUpi && <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>{pmUpi}</span>}
                                                </div>
                                            </td>

                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>
                                                    {entry.entrySource === 'voice' ? '🎙 Voice' : entry.entrySource === 'qr_checkin' ? '📲 Check-in' : '⌨ Manual'}
                                                </span>
                                            </td>

                                            <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.78rem', color: entry.transactionReference ? '#1E3A8A' : '#94A3B8' }}>
                                                {entry.transactionReference || '—'}
                                            </td>

                                            <td style={{ padding: '1rem 1.25rem', color: '#64748B', fontSize: '0.78rem' }}>
                                                {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </td>

                                            <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => sendWhatsAppMessage(entry, lang)}
                                                        style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                                        title="Send WhatsApp"
                                                    >
                                                        <MessageCircle size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                                        title="Delete"
                                                    >
                                                        <User size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ledger;
