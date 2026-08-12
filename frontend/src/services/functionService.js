// VizhaBook Function Service — REST API abstraction layer
// All requests include Bearer token from localStorage

const API_BASE = '/api/functions';

const getHeaders = () => {
    const token = localStorage.getItem('vizhabook_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const functionService = {
    // GET /api/functions — fetch all functions for authenticated account
    getFunctions: async () => {
        try {
            const res = await fetch(API_BASE, { headers: getHeaders() });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to fetch functions.' };
            return { success: true, functions: data.functions || [] };
        } catch (e) {
            console.error('functionService.getFunctions:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // GET /api/functions/:id — fetch single function with stats
    getFunctionById: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/${id}`, { headers: getHeaders() });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Function not found.' };
            return { success: true, function: data.function, recentMoiEntries: data.recentMoiEntries || [] };
        } catch (e) {
            console.error('functionService.getFunctionById:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // POST /api/functions — create new function
    createFunction: async (payload) => {
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, ...data };
            return { success: true, function: data.function };
        } catch (e) {
            console.error('functionService.createFunction:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // PUT /api/functions/:id — update a function
    updateFunction: async (id, payload) => {
        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, ...data };
            return { success: true, function: data.function };
        } catch (e) {
            console.error('functionService.updateFunction:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // DELETE /api/functions/:id — delete a function
    deleteFunction: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to delete function.' };
            return { success: true };
        } catch (e) {
            console.error('functionService.deleteFunction:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    }
};

export default functionService;
