import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Printer, Download, FileText, CheckCircle2, ShieldCheck, DollarSign, CreditCard, Gift, Users, Award, Calendar, Building } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import { MOCK_ENTRIES, MOCK_FUNCTIONS } from '../utils/mockData';
import { TRANSLATIONS } from '../utils/translations';
import paymentMethodService from '../services/paymentMethodService';

const Reports = () => {
    const { entries, functions, lang } = useApp();
    const isTa = lang === 'ta';
    const t = TRANSLATIONS[lang];

    const [selectedFunctionId, setSelectedFunctionId] = useState(functions[0]?.id || 'all');
    const displayEntries = entries.length ? entries : MOCK_ENTRIES;
    const displayFunctions = functions.length ? functions : MOCK_FUNCTIONS;

    const filteredEntries = useMemo(() => {
        if (selectedFunctionId === 'all') return displayEntries;
        return displayEntries.filter(e => String(e.functionId) === String(selectedFunctionId) || e.functionName === selectedFunctionId);
    }, [displayEntries, selectedFunctionId]);

    const currentFunc = displayFunctions.find(f => String(f.id) === String(selectedFunctionId)) || displayFunctions[0];

    // Compute Settlement Metrics
    const totalCash = filteredEntries
        .filter(e => e.paymentMethodType === 'CASH' || e.paymentMode === 'Cash' || (!e.paymentMethodType && e.paymentMode !== 'UPI'))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const upiBreakdown = useMemo(() => {
        const map = {};
        filteredEntries.forEach(e => {
            if (e.paymentMethodType === 'UPI' || e.paymentMode === 'UPI') {
                const key = e.paymentMethodDisplayName || e.paymentMethodName || 'UPI Account';
                if (!map[key]) {
                    map[key] = {
                        name: key,
                        upiId: e.upiId || e.paymentMethodProvider || '',
                        amount: 0,
                        count: 0
                    };
                }
                map[key].amount += Number(e.amount) || 0;
                map[key].count += 1;
            }
        });
        return Object.values(map);
    }, [filteredEntries]);

    const totalUpiAmount = upiBreakdown.reduce((sum, item) => sum + item.amount, 0);
    const totalAmount = totalCash + totalUpiAmount;
    const totalJewelsCount = filteredEntries.filter(e => e.giftType === 'Jewel' || e.giftItem === 'Jewel').length;
    const totalGiftsCount = filteredEntries.filter(e => e.giftType === 'Gift Item' || e.giftItem === 'Gift Item').length;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
            
            {/* Action Bar (Screen Only) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.25rem', color: '#0F172A', fontFamily: "'Playfair Display', serif", margin: '0 0 4px', fontWeight: 800 }}>
                        {isTa ? 'குடும்ப கணக்கு ஒப்படைப்பு சான்றிதழ்' : 'End-of-Event Settlement Audit Report'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        {isTa ? 'விழாவின் முடிவில் மூத்தவர்களிடம் பணத்தை ஒப்படைப்பதற்கான அதிகாரப்பூர்வ அறிக்கை.' : 'Official financial handover statement for family elders and audit reconciliation.'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                        value={selectedFunctionId}
                        onChange={(e) => setSelectedFunctionId(e.target.value)}
                        style={{ height: '44px', padding: '0 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '0.9rem', fontWeight: 700 }}
                    >
                        <option value="all">{isTa ? 'அனைத்து விழாக்கள்' : 'All Functions'}</option>
                        {displayFunctions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>

                    <button
                        onClick={handlePrint}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 20px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1E3A8A, #1e40af)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)'
                        }}
                    >
                        <Printer size={18} />
                        {isTa ? 'அறிக்கையை அச்சிடுக (Print / PDF)' : 'Print Settlement Audit'}
                    </button>
                </div>
            </div>

            {/* FORMAL SETTLEMENT AUDIT REPORT DOCUMENT (PRINTABLE) */}
            <div id="printable-settlement-report" style={{
                background: '#FFFFFF', borderRadius: '24px', border: '2px solid #1E3A8A', padding: '2.5rem',
                boxShadow: '0 20px 40px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', gap: '2rem'
            }}>
                {/* Formal Header */}
                <div style={{ borderBottom: '3px double #1E3A8A', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A', fontWeight: 900, letterSpacing: '0.08em', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            <ShieldCheck size={20} color="#D97706" /> VizhaBook Ledger Verification
                        </div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0F172A', margin: '0.4rem 0 0.2rem', fontFamily: "'Playfair Display', serif" }}>
                            {currentFunc ? currentFunc.name : 'Celebration Function'}
                        </h1>
                        <p style={{ margin: 0, color: '#475569', fontWeight: 600, fontSize: '0.95rem' }}>
                            Official Family Cash & Digital Collection Settlement Audit Statement
                        </p>
                    </div>

                    <div style={{ textAlign: 'right', background: '#F8FAFC', padding: '0.85rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Report Date & Time</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                            {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                    </div>
                </div>

                {/* Event Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Host / Family Lead</span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{currentFunc?.host || 'Family Lead'}</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Event Date</span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{currentFunc?.date || new Date().toLocaleDateString('en-IN')}</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Guests Recorded</span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{filteredEntries.length} Guests</div>
                    </div>
                </div>

                {/* Core Financial Settlement Summary Cards */}
                <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
                        1. Handover Financial Summary
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        
                        {/* Physical Cash In-Hand */}
                        <div style={{ background: '#ECFDF5', border: '2px solid #10B981', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 4px 14px rgba(16,185,129,0.1)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                💵 Physical Hard Cash (In-Hand)
                            </div>
                            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#047857', marginTop: '6px' }}>
                                ₹{totalCash.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                                Handover Amount for Family Elders
                            </div>
                        </div>

                        {/* Digital UPI Bank Total */}
                        <div style={{ background: '#EFF6FF', border: '2px solid #3B82F6', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 4px 14px rgba(59,130,246,0.1)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📱 Digital Bank UPI Transfers
                            </div>
                            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1E3A8A', marginTop: '6px' }}>
                                ₹{totalUpiAmount.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 700, marginTop: '4px' }}>
                                Deposited Directly in Bank Accounts
                            </div>
                        </div>

                        {/* Grand Total Combined Collection */}
                        <div style={{ background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 4px 14px rgba(245,158,11,0.1)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                👑 Grand Total Function Collection
                            </div>
                            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#78350F', marginTop: '6px' }}>
                                ₹{totalAmount.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 700, marginTop: '4px' }}>
                                Combined Net Collection
                            </div>
                        </div>
                    </div>
                </div>

                {/* Individual UPI Account Breakdown Table */}
                <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem' }}>
                        2. Individual UPI Accounts Breakdown
                    </h3>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', color: '#475569', fontWeight: 800 }}>
                                <th style={{ padding: '0.85rem 1rem' }}>Account Name</th>
                                <th style={{ padding: '0.85rem 1rem' }}>UPI ID</th>
                                <th style={{ padding: '0.85rem 1rem' }}>Entries Count</th>
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total Received (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upiBreakdown.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '1rem', color: '#64748B', textAlign: 'center' }}>No UPI transactions recorded for this function.</td>
                                </tr>
                            ) : upiBreakdown.map(u => (
                                <tr key={u.name} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0F172A' }}>📱 {u.name}</td>
                                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#1E3A8A', fontWeight: 700 }}>{u.upiId || '—'}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 600 }}>{u.count} entries</td>
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900, color: '#1E3A8A', fontSize: '1.05rem' }}>₹{u.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Jewels & Gift Items Audit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Jewels / Gold Count</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>{totalJewelsCount} Jewel Items Received</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Other Gift Articles</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#8B5CF6', marginTop: '2px' }}>{totalGiftsCount} Gift Items Received</div>
                    </div>
                </div>

                {/* Formal Handover Signature Certification */}
                <div style={{ marginTop: '2rem', borderTop: '2px dashed #CBD5E1', paddingTop: '2rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.75rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Formal Handover Verification & Signatures
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', textAlign: 'center' }}>
                        <div>
                            <div style={{ height: '50px', borderBottom: '1.5px solid #0F172A', marginBottom: '8px' }}></div>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>Family Lead / Host Signature</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>({currentFunc?.host || 'Host Name'})</div>
                        </div>

                        <div>
                            <div style={{ height: '50px', borderBottom: '1.5px solid #0F172A', marginBottom: '8px' }}></div>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>Moi Desk Operator Signature</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>(Ledger Operator)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
