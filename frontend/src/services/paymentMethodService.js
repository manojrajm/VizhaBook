// VizhaBook Payment Method Service — API Abstraction Layer

const getHeaders = () => {
    const token = localStorage.getItem('vizhabook_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const paymentMethodService = {
    // GET /api/functions/:functionId/payment-methods
    getPaymentMethodsByFunction: async (functionId) => {
        try {
            const res = await fetch(`/api/functions/${functionId}/payment-methods`, { headers: getHeaders() });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to fetch payment methods.' };
            return { success: true, paymentMethods: data.paymentMethods || [] };
        } catch (e) {
            console.error('paymentMethodService.getPaymentMethodsByFunction:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // POST /api/functions/:functionId/payment-methods
    createPaymentMethod: async (functionId, payload) => {
        try {
            const res = await fetch(`/api/functions/${functionId}/payment-methods`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to create payment method.' };
            return { success: true, paymentMethod: data.paymentMethod };
        } catch (e) {
            console.error('paymentMethodService.createPaymentMethod:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // PUT /api/payment-methods/:id
    updatePaymentMethod: async (id, payload) => {
        try {
            const res = await fetch(`/api/payment-methods/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to update payment method.' };
            return { success: true, paymentMethod: data.paymentMethod };
        } catch (e) {
            console.error('paymentMethodService.updatePaymentMethod:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // PATCH /api/payment-methods/:id/status
    togglePaymentMethodStatus: async (id, is_active) => {
        try {
            const res = await fetch(`/api/payment-methods/${id}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ is_active })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to toggle status.' };
            return { success: true, paymentMethod: data.paymentMethod };
        } catch (e) {
            console.error('paymentMethodService.togglePaymentMethodStatus:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // PATCH /api/payment-methods/:id/default
    setDefaultPaymentMethod: async (id) => {
        try {
            const res = await fetch(`/api/payment-methods/${id}/default`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to set default payment method.' };
            return { success: true, paymentMethod: data.paymentMethod };
        } catch (e) {
            console.error('paymentMethodService.setDefaultPaymentMethod:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    },

    // DELETE /api/payment-methods/:id
    deletePaymentMethod: async (id) => {
        try {
            const res = await fetch(`/api/payment-methods/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Failed to delete payment method.' };
            return { success: true };
        } catch (e) {
            console.error('paymentMethodService.deletePaymentMethod:', e.message);
            return { success: false, error: 'Network error. Please check your connection.' };
        }
    }
};

export default paymentMethodService;
