// VizhaBook Expense Service — API Abstraction for PostgreSQL public.expenses table

const getHeaders = () => {
    const token = localStorage.getItem('vizhabook_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const expenseService = {
    // GET /api/expenses?functionId=...&category=...
    getExpenses: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.functionId && params.functionId !== 'all') queryParams.append('functionId', params.functionId);
            if (params.category && params.category !== 'all') queryParams.append('category', params.category);

            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const res = await fetch(`/api/expenses${queryString}`, { headers: getHeaders() });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to fetch expenses.' };
            return {
                success: true,
                expenses: data.expenses || [],
                totalExpense: data.totalExpense || 0
            };
        } catch (e) {
            console.error('expenseService.getExpenses:', e.message);
            return { success: false, error: 'Network error fetching expenses.' };
        }
    },

    // POST /api/expenses
    createExpense: async (payload) => {
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to record expense.' };
            return { success: true, expense: data.expense };
        } catch (e) {
            console.error('expenseService.createExpense:', e.message);
            return { success: false, error: 'Network error recording expense.' };
        }
    },

    // DELETE /api/expenses/:id
    deleteExpense: async (id) => {
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to delete expense.' };
            return { success: true, message: data.message };
        } catch (e) {
            console.error('expenseService.deleteExpense:', e.message);
            return { success: false, error: 'Network error deleting expense.' };
        }
    }
};

export default expenseService;
