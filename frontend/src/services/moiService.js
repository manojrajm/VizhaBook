// VizhaBook Moi Service — API Abstraction Layer for PostgreSQL /api/moi
import { API_BASE_URL } from '../config/api';

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

            const url = `${API_BASE_URL}/api/moi${query.toString() ? '?' + query.toString() : ''}`;
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
            const res = await fetch(`${API_BASE_URL}/api/moi`, {
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
            const res = await fetch(`${API_BASE_URL}/api/moi/${id}`, {
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
            const res = await fetch(`${API_BASE_URL}/api/moi/${id}`, {
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
    },

    // -------- PENDING QR CHECK-IN APPROVALS API --------

    // POST /api/moi/pending (PUBLIC for guest check-in)
    submitPendingCheckin: async (payload) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/moi/pending`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to submit QR check-in.' };
            return { success: true, pendingEntry: data.pendingEntry };
        } catch (e) {
            console.error('moiService.submitPendingCheckin:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // GET /api/moi/pending (Protected for Host)
    getPendingCheckins: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/moi/pending`, { headers: getHeaders() });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to fetch pending check-ins.' };
            return { success: true, pendingEntries: data.pendingEntries || [] };
        } catch (e) {
            console.error('moiService.getPendingCheckins:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // POST /api/moi/pending/:id/approve (Protected for Host)
    approvePendingCheckin: async (id, payload = {}) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/moi/pending/${id}/approve`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to approve check-in.' };
            return { success: true, entry: data.entry };
        } catch (e) {
            console.error('moiService.approvePendingCheckin:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // DELETE /api/moi/pending/:id (Protected for Host)
    rejectPendingCheckin: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/moi/pending/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to reject check-in.' };
            return { success: true };
        } catch (e) {
            console.error('moiService.rejectPendingCheckin:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    }
};

export default moiService;
