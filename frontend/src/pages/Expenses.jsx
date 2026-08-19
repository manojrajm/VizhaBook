import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    IndianRupee, Tag, PlusCircle, Trash2, Calendar, Filter, ChevronRight,
    Loader2, CreditCard, FileText, Download, Search, LayoutGrid, List,
    X, Check, ChevronDown, ChevronUp, Layers, PieChart as PieIcon, DollarSign, Printer, ShieldCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import expenseService from '../services/expenseService';

const Expenses = () => {
    const { functions, lang } = useApp();
    const isTa = lang === 'ta';

    const [dbExpenses, setDbExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFunction, setSelectedFunction] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grouped'

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal & Visual Report State
    const [showModal, setShowModal] = useState(false);
    const [showVisualReport, setShowVisualReport] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Catering',
        functionId: '',
        paymentMode: 'Cash',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Accordion Expanded Categories State
    const [expandedCategories, setExpandedCategories] = useState({});

    // Auto-select first function for modal form
    useEffect(() => {
        if (!formData.functionId && functions.length > 0) {
            setFormData(prev => ({ ...prev, functionId: String(functions[0].id) }));
        }
    }, [functions, formData.functionId]);

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        const res = await expenseService.getExpenses({ functionId: selectedFunction, category: selectedCategory });
        if (res.success && res.expenses) {
            setDbExpenses(res.expenses);
        }
        setLoading(false);
    }, [selectedFunction, selectedCategory]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    // Reset pagination when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedFunction, selectedCategory]);

    // --- Search and Filter Logic ---
    const filteredExpenses = useMemo(() => {
        return dbExpenses.filter(exp => {
            const title = (exp.title || '').toLowerCase();
            const category = (exp.category || '').toLowerCase();
            const func = (exp.functionName || '').toLowerCase();
            const notes = (exp.notes || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            const matchesSearch = !searchTerm.trim() || title.includes(search) || category.includes(search) || func.includes(search) || notes.includes(search);
            const matchesFunction = selectedFunction === 'all' || String(exp.functionId) === String(selectedFunction);
            const matchesCategory = selectedCategory === 'all' || (exp.category || '').toLowerCase() === selectedCategory.toLowerCase();

            return matchesSearch && matchesFunction && matchesCategory;
        });
    }, [dbExpenses, searchTerm, selectedFunction, selectedCategory]);

    // --- KPI Executive Metrics ---
    const grandTotal = useMemo(() => filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [filteredExpenses]);
    const cashTotal = useMemo(() => filteredExpenses.filter(e => e.paymentMode === 'Cash' || !e.paymentMode).reduce((s, e) => s + (Number(e.amount) || 0), 0), [filteredExpenses]);
    const digitalTotal = useMemo(() => filteredExpenses.filter(e => e.paymentMode === 'UPI' || e.paymentMode === 'Bank Transfer').reduce((s, e) => s + (Number(e.amount) || 0), 0), [filteredExpenses]);

    const topCategoryInfo = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(e => {
            const cat = e.category || 'Other';
            map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
        });
        let topCat = 'None';
        let maxAmt = 0;
        for (const [cat, amt] of Object.entries(map)) {
            if (amt > maxAmt) { maxAmt = amt; topCat = cat; }
        }
        return { name: topCat, amount: maxAmt };
    }, [filteredExpenses]);

    // --- Category Grouped Data ---
    const groupedByCategory = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(exp => {
            const cat = exp.category || 'Other';
            if (!map[cat]) map[cat] = { name: cat, total: 0, items: [] };
            map[cat].total += Number(exp.amount) || 0;
            map[cat].items.push(exp);
        });
        return Object.values(map);
    }, [filteredExpenses]);

    // --- Paginated Items for Table View ---
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
    const paginatedExpenses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredExpenses.slice(start, start + itemsPerPage);
    }, [filteredExpenses, currentPage]);

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
            setShowModal(false);
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

    // Chart Data for Executive Visual Report
    const categoryChartData = useMemo(() => {
        return groupedByCategory.map(g => ({
            name: g.name,
            amount: g.total
        }));
    }, [groupedByCategory]);

    const paymentModeChartData = useMemo(() => {
        return [
            { name: isTa ? 'நேரடி ரொக்கம்' : 'Physical Cash', value: cashTotal },
            { name: isTa ? 'டிஜிட்டல் செலுத்துதல்கள்' : 'UPI & Bank Transfers', value: digitalTotal }
        ].filter(item => item.value > 0);
    }, [cashTotal, digitalTotal, isTa]);

    const SAPPHIRE_COLORS = ['#1E3A8A', '#059669', '#D97706', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

    // MNC Pro-Level Styled Excel Export Engine (Full Background Colors, Fonts, Borders & Column Widths)
    const exportToExcel = () => {
        const dateStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

        let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>VizhaBook Executive Report</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; }
                .banner-title { background-color: #1E3A8A; color: #FFFFFF; font-size: 18pt; font-weight: bold; padding: 16px; text-align: center; font-family: 'Georgia', serif; }
                .banner-subtitle { background-color: #0F172A; color: #94A3B8; font-size: 10pt; text-align: center; padding: 6px; }
                .kpi-row { background-color: #FEF3C7; color: #B45309; font-size: 11pt; font-weight: bold; padding: 10px; border: 1px solid #FCD34D; text-align: center; }
                .col-header { background-color: #1E3A8A; color: #FFFFFF; font-size: 11pt; font-weight: bold; text-transform: uppercase; padding: 10px; border: 1px solid #1e40af; text-align: left; }
                .data-row-even { background-color: #FFFFFF; color: #0F172A; font-size: 10pt; border-bottom: 1px solid #E2E8F0; }
                .data-row-odd { background-color: #F8FAFC; color: #0F172A; font-size: 10pt; border-bottom: 1px solid #E2E8F0; }
                .amount-col { color: #DC2626; font-weight: bold; text-align: right; }
                .total-row { background-color: #FEF2F2; color: #991B1B; font-size: 12pt; font-weight: bold; border-top: 2px solid #DC2626; border-bottom: 2px double #DC2626; padding: 10px; }
                .section-header { background-color: #0F172A; color: #F59E0B; font-size: 13pt; font-weight: bold; padding: 10px; text-align: left; border-left: 5px solid #F59E0B; }
                .cat-header { background-color: #334155; color: #FFFFFF; font-size: 10pt; font-weight: bold; padding: 8px; }
            </style>
        </head>
        <body>
            <table border="0" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                <tr>
                    <td colspan="8" class="banner-title">VIZHABOOK ENTERPRISE FINANCIAL EXPENSE STATEMENT</td>
                </tr>
                <tr>
                    <td colspan="8" class="banner-subtitle">Generated On: ${dateStr} | Confidential Organization Financial Ledger</td>
                </tr>
                <tr>
                    <td colspan="8" class="kpi-row">
                        EXECUTIVE SUMMARY: Grand Total Outflow = ₹${grandTotal.toLocaleString('en-IN')} | Cash Payments = ₹${cashTotal.toLocaleString('en-IN')} | Digital/Bank = ₹${digitalTotal.toLocaleString('en-IN')} | Total Records = ${filteredExpenses.length}
                    </td>
                </tr>
                <tr><td colspan="8"></td></tr>
                <tr class="col-header">
                    <td style="width: 60px; text-align: center;">SL. NO</td>
                    <td style="width: 250px;">EXPENSE TITLE / VENDOR</td>
                    <td style="width: 150px;">CATEGORY</td>
                    <td style="width: 200px;">FUNCTION NAME</td>
                    <td style="width: 140px; text-align: right;">AMOUNT (₹)</td>
                    <td style="width: 140px;">PAYMENT MODE</td>
                    <td style="width: 130px;">EXPENSE DATE</td>
                    <td style="width: 300px;">NOTES / REMARKS</td>
                </tr>
        `;

        filteredExpenses.forEach((e, i) => {
            const rowClass = i % 2 === 0 ? 'data-row-even' : 'data-row-odd';
            htmlContent += `
                <tr class="${rowClass}">
                    <td style="text-align: center; font-weight: bold;">${i + 1}</td>
                    <td style="font-weight: bold; color: #0F172A;">${e.title || e.category}</td>
                    <td style="color: #1E3A8A; font-weight: bold;">${e.category}</td>
                    <td>${e.functionName || 'General'}</td>
                    <td class="amount-col">-₹${Number(e.amount).toLocaleString('en-IN')}</td>
                    <td style="font-weight: bold;">${e.paymentMode || 'Cash'}</td>
                    <td>${e.expenseDate ? new Date(e.expenseDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td style="color: #64748B;">${e.notes || '—'}</td>
                </tr>
            `;
        });

        htmlContent += `
                <tr><td colspan="8"></td></tr>
                <tr class="total-row">
                    <td colspan="4" style="text-align: right;">GRAND TOTAL EXPENDITURE OUTFLOW:</td>
                    <td style="text-align: right; font-size: 14pt; color: #DC2626;">-₹${grandTotal.toLocaleString('en-IN')}</td>
                    <td colspan="3"></td>
                </tr>
                <tr><td colspan="8"></td></tr>
                <tr><td colspan="8"></td></tr>
                <tr>
                    <td colspan="8" class="section-header">CATEGORY BREAKDOWN & EXPENDITURE MATRIX</td>
                </tr>
                <tr class="cat-header">
                    <td colspan="2">CATEGORY NAME</td>
                    <td colspan="2" style="text-align: center;">RECORD COUNT</td>
                    <td colspan="2" style="text-align: right;">TOTAL CATEGORY OUTFLOW (₹)</td>
                    <td colspan="2" style="text-align: right;">PERCENTAGE SHARE (%)</td>
                </tr>
        `;

        groupedByCategory.forEach((g, idx) => {
            const share = grandTotal > 0 ? ((g.total / grandTotal) * 100).toFixed(1) + '%' : '0%';
            const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            htmlContent += `
                <tr style="background-color: ${bg}; font-size: 10pt;">
                    <td colspan="2" style="font-weight: bold; color: #0F172A;">🏷 ${g.name}</td>
                    <td colspan="2" style="text-align: center; font-weight: bold;">${g.items.length} items</td>
                    <td colspan="2" style="text-align: right; font-weight: bold; color: #DC2626;">₹${g.total.toLocaleString('en-IN')}</td>
                    <td colspan="2" style="text-align: right; font-weight: bold; color: #1E3A8A;">${share}</td>
                </tr>
            `;
        });

        htmlContent += `
            </table>
        </body>
        </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'VizhaBook_MNC_Expenses_Executive_Report.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const toggleCategoryAccordion = (catName) => {
        setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
    };

    const expenseCategories = ['Catering', 'Decoration', 'Hall/Venue', 'Photography', 'Gifts/Return Gifts', 'Transport', 'Other'];

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>

            {/* Header & Main Actions */}
            <header className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{
                        fontSize: '2.5rem', fontWeight: 900, fontFamily: "'Playfair Display', serif",
                        color: '#0F172A', marginBottom: '0.25rem'
                    }}>
                        {isTa ? 'செலவு மேலாண்மை (Expenses)' : 'Expense Management'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                        {isTa ? 'விழாவின் அனைத்து செலவுகளையும் ஒழுங்கமைத்து பகுப்பாய்வு செய்யவும்.' : 'Enterprise-grade expense tracking, categorized reporting, and financial analytics.'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={exportToExcel}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 18px',
                            borderRadius: '12px', background: '#FFFFFF', border: '1.5px solid #CBD5E1',
                            color: '#0F172A', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(15,23,42,0.03)'
                        }}
                    >
                        <Download size={18} color="#059669" />
                        {isTa ? 'Excel பதிவிறக்கு' : 'Export Excel'}
                    </button>



                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 20px',
                            borderRadius: '12px', background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)',
                            color: 'white', border: 'none', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)'
                        }}
                    >
                        <PlusCircle size={18} />
                        {isTa ? '+ புதிய செலவு சேர்' : '+ Log New Expense'}
                    </button>
                </div>
            </header>

            {/* 4 TOP EXECUTIVE SUMMARY KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>

                {/* Grand Total Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '1.4rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', borderLeft: '5px solid #DC2626' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'மொத்த செலவு' : 'Grand Total Outflow'}
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>
                        ₹{grandTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                        {filteredExpenses.length} {isTa ? 'பதிவுகள்' : 'expense records'}
                    </div>
                </div>

                {/* Physical Cash Expenses */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '1.4rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', borderLeft: '5px solid #059669' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'நேரடி பணச் செலவுகள்' : 'Cash Expenditures'}
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                        ₹{cashTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '2px', fontWeight: 700 }}>
                        💵 Physical Cash Handed Over
                    </div>
                </div>

                {/* Digital / Bank Transfers */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '1.4rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', borderLeft: '5px solid #3B82F6' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'டிஜிட்டல் / வங்கி செலுத்துதல்கள்' : 'Digital / Bank Transfers'}
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#1E3A8A', marginTop: '4px' }}>
                        ₹{digitalTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#2563EB', marginTop: '2px', fontWeight: 700 }}>
                        📱 UPI & Bank Transfers
                    </div>
                </div>

                {/* Top Expenditure Category */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '1.4rem', boxShadow: '0 4px 14px rgba(15,23,42,0.03)', borderLeft: '5px solid #D97706' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isTa ? 'அதிக செலவு வகை' : 'Top Expense Category'}
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🏷 {topCategoryInfo.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#D97706', marginTop: '2px', fontWeight: 800 }}>
                        ₹{topCategoryInfo.amount.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* MNC ENTERPRISE TOOLBAR (SEARCH, CATEGORY, FUNCTION, VIEW SWITCHER) */}
            <div style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                boxShadow: '0 4px 20px rgba(15,23,42,0.03)'
            }}>
                {/* Search Input */}
                <div style={{ position: 'relative', flex: '1 1 260px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                    <input
                        type="text"
                        placeholder={isTa ? 'செலவு தலைப்பு, வகை அல்லது குறிப்பு தேட…' : 'Search expenses by title, category or notes...'}
                        style={{
                            width: '100%', height: '42px', padding: '0 1rem 0 2.75rem', borderRadius: '10px',
                            border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A', fontSize: '0.9rem', outline: 'none'
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Category Filter */}
                    <select
                        style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">{isTa ? 'அனைத்து வகைகள்' : 'All Categories'}</option>
                        {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Function Filter */}
                    <select
                        style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                    >
                        <option value="all">{isTa ? 'அனைத்து விழாக்கள்' : 'All Functions'}</option>
                        {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>

                    {/* View Switcher (Table vs Grouped Accordion) */}
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: 'none',
                                background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                                color: viewMode === 'table' ? '#1E3A8A' : '#64748B',
                                fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                                boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                            }}
                        >
                            <List size={15} />
                            {isTa ? 'அட்டவணை' : 'Table'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('grouped')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: 'none',
                                background: viewMode === 'grouped' ? '#FFFFFF' : 'transparent',
                                color: viewMode === 'grouped' ? '#1E3A8A' : '#64748B',
                                fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                                boxShadow: viewMode === 'grouped' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                            }}
                        >
                            <Layers size={15} />
                            {isTa ? 'வகைகள் வாரியாக' : 'Grouped'}
                        </button>
                    </div>
                </div>
            </div>

            {/* VIEW MODE 1: PAGINATED ENTERPRISE TABLE VIEW */}
            {viewMode === 'table' && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                    {loading ? (
                        <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                            <Loader2 size={24} className="pm-spin" style={{ margin: '0 auto 8px' }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>{isTa ? 'செலவு விவரங்கள் ஏற்றப்படுகிறது…' : 'Loading expense records…'}</p>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                            <Tag size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
                                {isTa ? 'செலவுப் பதிவுகள் எதுவும் காணப்படவில்லை' : 'No expense records found'}
                            </h4>
                            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
                                {isTa ? 'தேடல் அல்லது வடிப்பான்களை மாற்றி முயற்சிக்கவும்.' : 'Try adjusting your search query or category filters.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                                            <th style={{ padding: '1rem 1.25rem' }}>Expense Item / Title</th>
                                            <th style={{ padding: '1rem 1.25rem' }}>Category</th>
                                            <th style={{ padding: '1rem 1.25rem' }}>Function</th>
                                            <th style={{ padding: '1rem 1.25rem' }}>Payment Mode</th>
                                            <th style={{ padding: '1rem 1.25rem' }}>Date</th>
                                            <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Amount (₹)</th>
                                            <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedExpenses.map(exp => (
                                            <tr key={exp.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }} className="ledger-tr">
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                                                        {exp.title || exp.category}
                                                    </div>
                                                    {exp.notes && (
                                                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                                                            {exp.notes}
                                                        </div>
                                                    )}
                                                </td>

                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E3A8A', background: '#EFF6FF', padding: '4px 10px', borderRadius: '100px', border: '1px solid #BFDBFE' }}>
                                                        {exp.category}
                                                    </span>
                                                </td>

                                                <td style={{ padding: '1rem 1.25rem', color: '#334155', fontWeight: 600 }}>
                                                    {exp.functionName || 'General'}
                                                </td>

                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <span style={{
                                                        fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                                                        background: exp.paymentMode === 'UPI' || exp.paymentMode === 'Bank Transfer' ? '#ECFDF5' : '#FEF3C7',
                                                        color: exp.paymentMode === 'UPI' || exp.paymentMode === 'Bank Transfer' ? '#047857' : '#B45309'
                                                    }}>
                                                        {exp.paymentMode === 'UPI' ? '📱 UPI' : exp.paymentMode === 'Bank Transfer' ? '🏛 Bank' : '💵 Cash'}
                                                    </span>
                                                </td>

                                                <td style={{ padding: '1rem 1.25rem', color: '#64748B', fontSize: '0.8rem' }}>
                                                    {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                </td>

                                                <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 900, color: '#DC2626', fontSize: '1.1rem' }}>
                                                    -₹{Number(exp.amount).toLocaleString('en-IN')}
                                                </td>

                                                <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => handleDelete(exp.id)}
                                                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700 }}
                                                        title="Delete Expense"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* PAGINATION BAR */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                                    Showing <strong style={{ color: '#0F172A' }}>{Math.min(filteredExpenses.length, (currentPage - 1) * itemsPerPage + 1)}</strong> - <strong style={{ color: '#0F172A' }}>{Math.min(filteredExpenses.length, currentPage * itemsPerPage)}</strong> of <strong style={{ color: '#0F172A' }}>{filteredExpenses.length}</strong> expenses
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        style={{
                                            padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF',
                                            color: currentPage === 1 ? '#94A3B8' : '#0F172A', fontWeight: 700, fontSize: '0.82rem',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Previous
                                    </button>

                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A', padding: '0 8px' }}>
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        style={{
                                            padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF',
                                            color: currentPage >= totalPages ? '#94A3B8' : '#0F172A', fontWeight: 700, fontSize: '0.82rem',
                                            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* VIEW MODE 2: CATEGORY GROUPED ACCORDION VIEW */}
            {viewMode === 'grouped' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {groupedByCategory.length === 0 ? (
                        <div style={{ background: '#FFFFFF', padding: '4rem 2rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                            <Layers size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>No grouped categories available</h4>
                        </div>
                    ) : (
                        groupedByCategory.map(catGroup => {
                            const isExpanded = expandedCategories[catGroup.name] !== false; // expanded by default
                            return (
                                <div key={catGroup.name} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
                                    <div
                                        onClick={() => toggleCategoryAccordion(catGroup.name)}
                                        style={{
                                            padding: '1.25rem 1.5rem', background: '#F8FAFC', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>🏷</span>
                                            <div>
                                                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>{catGroup.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>{catGroup.items.length} items</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DC2626' }}>
                                                -₹{catGroup.total.toLocaleString('en-IN')}
                                            </div>
                                            {isExpanded ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '0.75rem 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                            {catGroup.items.map(item => (
                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px dashed #F1F5F9' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>{item.title || item.category}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                            {item.functionName} • {item.paymentMode || 'Cash'} {item.notes ? `• ${item.notes}` : ''}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <span style={{ fontWeight: 900, color: '#DC2626', fontSize: '1rem' }}>-₹{Number(item.amount).toLocaleString('en-IN')}</span>
                                                        <button onClick={() => handleDelete(item.id)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* LOG EXPENSE POPUP MODAL */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '520px',
                        padding: '2rem', border: '2px solid #1E3A8A', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
                        display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={18} color="#64748B" />
                        </button>

                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#EFF6FF', padding: '4px 12px', borderRadius: '100px' }}>
                                💳 New Expense Entry
                            </span>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: '0.4rem 0 0', fontFamily: "'Playfair Display', serif" }}>
                                {isTa ? 'செலவு விவரங்களைப் பதிவு செய்' : 'Log New Expense Record'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                            {/* Function Selection */}
                            <div>
                                <label className="form-label">{isTa ? 'தொடர்புடைய விழா' : 'Related Function'}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A', fontWeight: 700 }}
                                    value={formData.functionId}
                                    onChange={(e) => setFormData({ ...formData, functionId: e.target.value })}
                                >
                                    <option value="" disabled>-- Choose Function --</option>
                                    {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="form-label">{isTa ? 'செலவு தலைப்பு / விவரம்' : 'Expense Title / Vendor Item'}</label>
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
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A', fontWeight: 700 }}
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
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '2px solid #DC2626', background: '#FFFFFF', color: '#0F172A', fontWeight: 800, fontSize: '1.1rem' }}
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Mode & Date */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">{isTa ? 'செலுத்திய முறை' : 'Payment Mode'}</label>
                                    <select
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#FFFFFF', color: '#0F172A' }}
                                        value={formData.paymentMode}
                                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                    >
                                        <option value="Cash">💵 Physical Cash</option>
                                        <option value="UPI">📱 UPI Transfer</option>
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
                            <div>
                                <label className="form-label">{isTa ? 'குறிப்பு (விருப்பம்)' : 'Notes / Vendor Info'}</label>
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
                                    width: '100%', padding: '1.1rem', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', color: 'white', border: 'none',
                                    fontWeight: 800, fontSize: '1.05rem', cursor: submitting ? 'not-allowed' : 'pointer',
                                    marginTop: '0.5rem', boxShadow: '0 8px 20px rgba(30, 58, 138, 0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {submitting ? <Loader2 size={18} className="pm-spin" /> : <Check size={18} />}
                                {submitting ? (isTa ? 'சேமிக்கப்படுகிறது…' : 'Saving…') : (isTa ? 'செலவைப் பதிவு செய்' : 'SAVE EXPENSE RECORD')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* VISUAL EXECUTIVE REPORT MODAL (WITH RECHARTS BAR & PIE GRAPH VISUALS) */}
            {showVisualReport && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1050,
                    background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', overflowY: 'auto'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '850px',
                        padding: '2.5rem', border: '2px solid #1E3A8A', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
                        display: 'flex', flexDirection: 'column', gap: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A', fontWeight: 900, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    <ShieldCheck size={18} color="#D97706" /> MNC Executive Financial Audit Report
                                </div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', margin: '0.3rem 0 0.1rem', fontFamily: "'Playfair Display', serif" }}>
                                    VizhaBook Expense Outflow Analysis
                                </h2>
                                <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                                    Categorized Expenditure Breakdown, Cash vs Digital Split & Visual Graphs
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => window.print()}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #1E3A8A, #1e40af)', color: 'white', border: 'none',
                                        fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                                    }}
                                >
                                    <Printer size={16} /> Print / Download PDF
                                </button>
                                <button
                                    onClick={() => setShowVisualReport(false)}
                                    style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={18} color="#64748B" />
                                </button>
                            </div>
                        </div>

                        {/* Executive Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', borderRadius: '14px' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>Total Outflow</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>₹{grandTotal.toLocaleString('en-IN')}</div>
                            </div>
                            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '14px' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>Cash Payments</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>₹{cashTotal.toLocaleString('en-IN')}</div>
                            </div>
                            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '14px' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>Digital / Bank</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E3A8A', marginTop: '2px' }}>₹{digitalTotal.toLocaleString('en-IN')}</div>
                            </div>
                            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '14px' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>Top Category</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#B45309', marginTop: '2px' }}>{topCategoryInfo.name}</div>
                            </div>
                        </div>

                        {/* RECHARTS DATA VISUALIZATION GRAPHS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                            {/* Bar Chart */}
                            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    📊 Category Expenditure Distribution
                                </h4>
                                <div style={{ height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                                            <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontWeight={700} />
                                            <YAxis stroke="#64748B" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                                            <RechartsTooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Outflow']} />
                                            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                                {categoryChartData.map((_, i) => (
                                                    <Cell key={i} fill={SAPPHIRE_COLORS[i % SAPPHIRE_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie Chart */}
                            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🍩 Cash vs Digital Payment Split
                                </h4>
                                <div style={{ height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={paymentModeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={4}>
                                                {paymentModeChartData.map((_, i) => (
                                                    <Cell key={i} fill={i === 0 ? '#059669' : '#1E3A8A'} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Classified Items Table */}
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>
                                Classified Expense Statement
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', color: '#475569', fontWeight: 800 }}>
                                        <th style={{ padding: '8px 12px' }}>Title / Item</th>
                                        <th style={{ padding: '8px 12px' }}>Category</th>
                                        <th style={{ padding: '8px 12px' }}>Function</th>
                                        <th style={{ padding: '8px 12px' }}>Mode</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.slice(0, 15).map(e => (
                                        <tr key={e.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0F172A' }}>{e.title || e.category}</td>
                                            <td style={{ padding: '8px 12px', color: '#1E3A8A', fontWeight: 700 }}>{e.category}</td>
                                            <td style={{ padding: '8px 12px', color: '#475569' }}>{e.functionName || 'General'}</td>
                                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{e.paymentMode || 'Cash'}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#DC2626' }}>-₹{Number(e.amount).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
