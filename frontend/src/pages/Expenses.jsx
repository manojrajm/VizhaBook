import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { IndianRupee, Tag, PlusCircle, Trash2, Calendar, Filter, ChevronRight, Loader2, CreditCard, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import expenseService from '../services/expenseService';

const Expenses = () => {
    const { functions, lang } = useApp();
    const isTa = lang === 'ta';

    const [dbExpenses, setDbExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Catering',
        functionId: '',
        paymentMode: 'Cash',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Auto-select first function if not selected
    useEffect(() => {
        if (!formData.functionId && functions.length > 0) {
            setFormData(prev => ({ ...prev, functionId: String(functions[0].id) }));
        }
    }, [functions, formData.functionId]);

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        const res = await expenseService.getExpenses({ functionId: selectedFilter });
        if (res.success && res.expenses) {
            setDbExpenses(res.expenses);
        }
        setLoading(false);
    }, [selectedFilter]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    const filteredExpenses = useMemo(() => {
        if (selectedFilter === 'all') return dbExpenses;
        return dbExpenses.filter(e => String(e.functionId) === String(selectedFilter));
    }, [dbExpenses, selectedFilter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || Number(formData.amount) <= 0) return;

        setSubmitting(true);
        const payload = {
            functionId: formData.functionId,
            title: formData.title.trim() || formData.category,
            category: formData.category,
            amount: Number(formData.amount),
            paymentMode: formData.paymentMode,
            expenseDate: formData.expenseDate,
            notes: formData.notes.trim()
        };

        const res = await expenseService.createExpense(payload);
        setSubmitting(false);

        if (res.success) {
            setFormData(prev => ({
                ...prev,
                title: '',
                amount: '',
                notes: ''
            }));
            loadExpenses();
        } else {
            alert(res.error || 'Failed to record expense.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isTa ? 'இந்த செலவுப் பதிவை நீக்க வேண்டுமா?' : 'Delete this expense entry?')) return;
        const res = await expenseService.deleteExpense(id);
        if (res.success) {
            loadExpenses();
        } else {
            alert(res.error || 'Failed to delete expense.');
        }
    };

    const expenseCategories = ['Catering', 'Decoration', 'Hall/Venue', 'Photography', 'Gifts/Return Gifts', 'Transport', 'Other'];
    const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const fadeUp = (delay = 0) => ({
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    });

    return (
        <div className="animate-fade" style={{ maxWidth: '1050px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header Area */}
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <motion.div {...fadeUp(0)} style={{ flex: '1 1 300px' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        fontFamily: "'Playfair Display', serif",
                        color: '#0F172A',
                        marginBottom: '0.25rem'
                    }}>
                        {isTa ? 'செலவு மேலாண்மை (Expenses)' : 'Expense Manager'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
                        {isTa ? 'விழாவின் அனைத்து செலவுகளையும் ஒழுங்கமைத்து பதிவு செய்யவும்.' : 'Log and manage all vendor, venue, and catering expenses.'}
                    </p>
                </motion.div>

                <motion.div {...fadeUp(0.1)} style={{ 
                    padding: '1.25rem 1.75rem', 
                    textAlign: 'center',
                    background: '#FFFFFF',
                    borderRadius: '1.25rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
                    borderLeft: '5px solid #EF4444'
                }}>
                    <p style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        {selectedFilter === 'all' ? (isTa ? 'மொத்த செலவு' : 'Grand Total Expenses') : (isTa ? 'பிரித்த செலவு' : 'Filtered Function Total')}
                    </p>
                    <p style={{ fontSize: '2rem', fontWeight: 900, color: '#DC2626', margin: 0 }}>₹{totalFiltered.toLocaleString('en-IN')}</p>
                </motion.div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
                {/* Left Column: Log New Expense Form */}
                <motion.div {...fadeUp(0.2)} style={{
                    background: '#FFFFFF', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(15,23,42,0.05)'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PlusCircle size={22} color="#1E3A8A" />
                        {isTa ? 'புதிய செலவு பதிவு' : 'Log New Expense'}
                    </h3>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        
                        {/* Function Selection */}
                        <div className="form-group">
                            <label className="form-label">{isTa ? 'தொடர்புடைய விழா' : 'Related Function'}</label>
                            <select
                                required
                                style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
                                value={formData.functionId}
                                onChange={(e) => setFormData({ ...formData, functionId: e.target.value })}
                            >
                                <option value="" disabled>-- Select Function --</option>
                                {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>

                        {/* Title / Description */}
                        <div className="form-group">
                            <label className="form-label">{isTa ? 'செலவு தலைப்பு / விவரம்' : 'Expense Title / Item'}</label>
                            <input
                                type="text"
                                required
                                placeholder={isTa ? 'எ.கா. சமையல் முன்பணம்' : 'e.g. Catering Advance Payment'}
                                style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A' }}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Category & Amount */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="form-label">{isTa ? 'வகை' : 'Category'}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A', fontWeight: 600 }}
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">{isTa ? 'தொகை (₹)' : 'Amount (₹)'}</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="0"
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '2px solid #EF4444', background: '#FFFFFF', color: '#0F172A', fontWeight: 800, fontSize: '1.1rem' }}
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Payment Mode & Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="form-label">{isTa ? 'செலுத்திய முறை' : 'Payment Mode'}</label>
                                <select
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A' }}
                                    value={formData.paymentMode}
                                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                >
                                    <option value="Cash">💵 Physical Cash</option>
                                    <option value="UPI">📱 UPI / GPay / PhonePe</option>
                                    <option value="Bank Transfer">🏛 Bank Transfer</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">{isTa ? 'தேதி' : 'Date'}</label>
                                <input
                                    type="date"
                                    required
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A' }}
                                    value={formData.expenseDate}
                                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <label className="form-label">{isTa ? 'குறிப்பு (விருப்பம்)' : 'Notes / Vendor Details'}</label>
                            <input
                                type="text"
                                placeholder={isTa ? 'கூடுதல் விவரங்கள்' : 'e.g. Paid to Ramesh Catering Services'}
                                style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF' }}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%', padding: '1.1rem', borderRadius: '0.875rem',
                                background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', color: 'white', border: 'none',
                                fontWeight: 800, fontSize: '1.05rem', cursor: submitting ? 'not-allowed' : 'pointer',
                                marginTop: '0.5rem', boxShadow: '0 8px 20px rgba(30, 58, 138, 0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            {submitting ? <Loader2 size={18} className="pm-spin" /> : <PlusCircle size={18} />}
                            {submitting ? (isTa ? 'சேமிக்கப்படுகிறது…' : 'Saving…') : (isTa ? 'செலவைச் சேமிக்க' : 'Save Expense Record')}
                        </button>
                    </form>
                </motion.div>

                {/* Right Column: Expense List & Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Function Filter Toolbar */}
                    <div style={{ background: '#FFFFFF', padding: '0.85rem 1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Filter size={18} color="#D97706" />
                        <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter:</span>
                        <select 
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            style={{ background: 'none', border: 'none', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem', outline: 'none', cursor: 'pointer', flex: 1 }}
                        >
                            <option value="all">{isTa ? 'அனைத்து விழாக்கள்' : 'All Functions'}</option>
                            {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>

                    {/* Expense Records List */}
                    {loading ? (
                        <div style={{ background: '#FFFFFF', padding: '3rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                            <Loader2 size={24} className="pm-spin" style={{ margin: '0 auto 8px' }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>{isTa ? 'ஏற்றப்படுகிறது…' : 'Loading PostgreSQL expenses…'}</p>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div style={{ background: '#FFFFFF', padding: '3.5rem 2rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                            <Tag size={42} opacity={0.3} style={{ margin: '0 auto 1rem' }} />
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem' }}>{isTa ? 'செலவுகள் எதுவும் இல்லை' : 'No expenses recorded'}</h4>
                            <p style={{ fontSize: '0.88rem', margin: 0 }}>{isTa ? 'புதிய செலவை பதிவு செய்யவும்.' : 'Use the form on the left to log your first expense.'}</p>
                        </div>
                    ) : (
                        filteredExpenses.map(expense => (
                            <div
                                key={expense.id}
                                style={{
                                    background: '#FFFFFF', padding: '1.25rem', borderRadius: '1.25rem',
                                    border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(15,23,42,0.02)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ 
                                        width: '44px', height: '44px', borderRadius: '12px', 
                                        background: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Tag size={20} color="#DC2626" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', marginBottom: '2px' }}>
                                            {expense.title || expense.category}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                                            <span style={{ fontWeight: 700, color: '#1E3A8A', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                                                {expense.category}
                                            </span>
                                            <span style={{ color: '#64748B' }}>• {expense.functionName || 'General'}</span>
                                            {expense.paymentMode && (
                                                <span style={{ color: '#059669', fontWeight: 600 }}>• {expense.paymentMode}</span>
                                            )}
                                        </div>
                                        {expense.notes && (
                                            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                                                {expense.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#DC2626' }}>
                                            -₹{Number(expense.amount).toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                            {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(expense.id)}
                                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                        title="Delete Expense"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Expenses;
