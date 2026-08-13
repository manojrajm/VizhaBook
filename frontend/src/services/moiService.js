// VizhaBook Moi Service — API Abstraction Layer for PostgreSQL /api/moi

const getHeaders = () => {
    const token = localStorage.getItem('vizhabook_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const moiService = {
    // GET /api/moi (with optional query filters)
    getMoiEntries: async (filters = {}) => {
        try {
            const query = new URLSearchParams();
            if (filters.functionId) query.append('functionId', filters.functionId);
            if (filters.paymentMethodId) query.append('paymentMethodId', filters.paymentMethodId);
            if (filters.entrySource) query.append('entrySource', filters.entrySource);
            if (filters.giftType) query.append('giftType', filters.giftType);
            if (filters.search) query.append('search', filters.search);

            const url = `/api/moi${query.toString() ? '?' + query.toString() : ''}`;
            const res = await fetch(url, { headers: getHeaders() });
            const data = await res.json();

            if (!res.ok) return { success: false, error: data.error || 'Failed to fetch Moi entries.' };
            return {
                success: true,
                count: data.count || 0,
                totalAmount: data.totalAmount || 0,
                upiCollection: data.upiCollection || 0,
                cashCollection: data.cashCollection || 0,
                paymentBreakdown: data.paymentBreakdown || {},
                entries: data.entries || []
            };
        } catch (e) {
            console.error('moiService.getMoiEntries:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // POST /api/moi
    createMoiEntry: async (payload) => {
        try {
            const res = await fetch('/api/moi', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, ...data };
            return { success: true, entry: data.entry };
        } catch (e) {
            console.error('moiService.createMoiEntry:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // PUT /api/moi/:id
    updateMoiEntry: async (id, payload) => {
        try {
            const res = await fetch(`/api/moi/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to update Moi entry.' };
            return { success: true, entry: data.entry };
        } catch (e) {
            console.error('moiService.updateMoiEntry:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // DELETE /api/moi/:id
    deleteMoiEntry: async (id) => {
        try {
            const res = await fetch(`/api/moi/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to delete Moi entry.' };
            return { success: true };
        } catch (e) {
            console.error('moiService.deleteMoiEntry:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    }
};

export default moiService;
