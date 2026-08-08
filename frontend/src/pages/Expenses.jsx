import React, { useState, useMemo } from 'react';
import { IndianRupee, Tag, PlusCircle, Trash2, Calendar, Filter, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const Expenses = () => {
    const { expenses, addExpense, removeExpense, functions, lang } = useApp();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [formData, setFormData] = useState({
        amount: '',
        category: 'Catering',
        functionId: '',
        note: ''
    });

    const filteredExpenses = useMemo(() => {
        if (selectedFilter === 'all') return expenses;
        return expenses.filter(e => e.functionId === selectedFilter || String(e.functionId) === String(selectedFilter));
    }, [expenses, selectedFilter]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const func = functions.find(f => String(f.id) === String(formData.functionId));
        
        addExpense({
            amount: parseFloat(formData.amount) || 0,
            category: formData.category,
            functionId: formData.functionId,
            functionName: func ? func.name : 'General',
            note: formData.note,
            date: new Date().toISOString()
        });

        setFormData({ amount: '', category: 'Catering', functionId: formData.functionId, note: '' });
    };

    const expenseCategories = ['Catering', 'Decoration', 'Hall/Venue', 'Photography', 'Gifts/Return Gifts', 'Transport', 'Other'];
    const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const fadeUp = (delay = 0) => ({
        initial: { opacity: 0, y: 30, rotateX: -5 },
        animate: { opacity: 1, y: 0, rotateX: 0 },
        transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    });

    const hover3D = {
        whileHover: { 
            rotateY: 5, 
            rotateX: 5, 
            scale: 1.02,
            translateZ: 15,
            transition: { type: 'spring', stiffness: 300, damping: 20 }
        }
    };

    return (
        <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto', perspective: '1200px' }}>
            {/* Header Area */}
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                <motion.div {...fadeUp(0)} style={{ flex: '1 1 300px' }}>
                    <h1 className="text-glow" style={{
                        fontWeight: 900,
                        fontFamily: "'Playfair Display', serif",
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        marginBottom: '0.25rem',
                        lineHeight: 1.1
                    }}>
                        {lang === 'en' ? 'Expense Tracker' : 'செலவுகள்'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
                        {lang === 'en' ? 'Manage and filter outgoing costs for your functions.' : 'உங்கள் விசேஷங்களுக்கான செலவுகளை ஒழுங்குபடுத்துங்கள்.'}
                    </p>
                </motion.div>

                <motion.div {...fadeUp(0.1)} {...hover3D} className="glass-premium" style={{ 
                    padding: '1rem 1.5rem', 
                    textAlign: 'center',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>
                        {selectedFilter === 'all' ? (lang === 'en' ? 'Grand Total' : 'மொத்த செலவு') : (lang === 'en' ? 'Filtered Total' : 'பிரித்த செலவு')}
                    </p>
                    <p className="text-glow" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#EF4444' }}>₹{totalFiltered.toLocaleString('en-IN')}</p>
                </motion.div>
            </div>

            <div className="responsive-grid" style={{ alignItems: 'start' }}>
                {/* Left Column: Form */}
                <motion.div {...fadeUp(0.2)} {...hover3D} className="glass-premium glow-hover" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PlusCircle size={24} color="var(--accent)" />
                        {lang === 'en' ? 'Log New Expense' : 'புதிய செலவு'}
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label">{lang === 'en' ? 'Related Function' : 'விசேஷம்'}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                    value={formData.functionId}
                                    onChange={(e) => setFormData({ ...formData, functionId: e.target.value })}
                                >
                                    <option value="" disabled style={{ background: 'var(--bg-card)' }}>-- Select Function --</option>
                                    <option value="general" style={{ background: 'var(--bg-card)' }}>General Expense</option>
                                    {functions.map(f => <option key={f.id} value={f.id} style={{ background: 'var(--bg-card)' }}>{f.name}</option>)}
                                </select>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label className="form-label">{lang === 'en' ? 'Category' : 'வகை'}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {expenseCategories.map(c => <option key={c} value={c} style={{ background: 'var(--bg-card)' }}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">{lang === 'en' ? 'Amount (₹)' : 'தொகை'}</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="0"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem', outline: 'none' }}
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                        <div>
                            <label className="form-label">{lang === 'en' ? 'Note (Optional)' : 'குறிப்பு'}</label>
                            <input
                                type="text"
                                placeholder={lang === 'en' ? 'e.g. Stage Advance' : 'உதாரணம்: முன்பணம்'}
                                style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', outline: 'none' }}
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            style={{
                                width: '100%', padding: '1.25rem', borderRadius: '1rem',
                                background: 'var(--primary-gradient)', color: 'white', border: 'none',
                                fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
                                marginTop: '0.5rem', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
                            }}
                        >
                            {lang === 'en' ? 'Verify & Save' : 'சரிபார்த்து சேமி'}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Right Column: List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* List Filter */}
                    <motion.div {...fadeUp(0.3)} className="glass-premium" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Filter size={18} color="var(--accent)" />
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Filter:</span>
                        <select 
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 700, outline: 'none', cursor: 'pointer', flex: 1 }}
                        >
                            <option value="all" style={{ background: 'var(--bg-card)' }}>Everywhere</option>
                            <option value="general" style={{ background: 'var(--bg-card)' }}>General</option>
                            {functions.map(f => <option key={f.id} value={f.id} style={{ background: 'var(--bg-card)' }}>{f.name}</option>)}
                        </select>
                    </motion.div>

                    <AnimatePresence mode="popLayout">
                        {filteredExpenses.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="glass-premium"
                                style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
                            >
                                <IndianRupee size={48} opacity={0.1} style={{ margin: '0 auto 1.5rem' }} />
                                <p style={{ fontWeight: 600 }}>{lang === 'en' ? 'No expenses found.' : 'செலவுகள் எதுவும் இல்லை.'}</p>
                            </motion.div>
                        ) : (
                            filteredExpenses.slice().reverse().map((expense, i) => (
                                <motion.div
                                    layout
                                    key={expense.id}
                                    {...fadeUp(0.3 + i * 0.05)}
                                    {...hover3D}
                                    className="glass-premium glow-hover"
                                    style={{
                                        padding: '1.5rem',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        cursor: 'default'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '48px', height: '48px', borderRadius: '1rem', 
                                            background: 'rgba(239, 68, 68, 0.1)', display: 'flex', 
                                            alignItems: 'center', justifyContent: 'center' 
                                        }}>
                                            <Tag size={20} color="#EF4444" />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{expense.category}</span>
                                                <ChevronRight size={14} color="var(--text-secondary)" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                                    {expense.functionName}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {expense.note && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{expense.note}</span>}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                                    <Calendar size={12} />
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <span style={{ fontWeight: 900, fontSize: '1.5rem', color: '#EF4444', letterSpacing: '-0.5px' }}>
                                            -₹{expense.amount.toLocaleString('en-IN')}
                                        </span>
                                        <motion.button 
                                            whileHover={{ scale: 1.2, color: '#DC2626' }}
                                            onClick={() => removeExpense(expense.id)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.5rem', opacity: 0.6 }}
                                        >
                                            <Trash2 size={18} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
