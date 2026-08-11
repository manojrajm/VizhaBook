// VizhaBook Subscription & Payment Service Abstraction Layer

export const paymentService = {
    // Fetch active subscription plans from backend
    getPlans: async () => {
        try {
            const res = await fetch('/api/subscription-plans');
            const data = await res.json();
            return data.success ? data.plans : [];
        } catch (e) {
            console.error('Error fetching subscription plans:', e);
            return [];
        }
    },

    // Fetch current subscription status & countdown
    getCurrentSubscription: async () => {
        const token = localStorage.getItem('vizhabook_token');
        if (!token) return null;
        try {
            const res = await fetch('/api/subscriptions/current', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            return data.success ? data : null;
        } catch (e) {
            console.error('Error fetching current subscription:', e);
            return null;
        }
    },

    // Fetch usage metrics and limits
    getUsage: async () => {
        const token = localStorage.getItem('vizhabook_token');
        if (!token) return null;
        try {
            const res = await fetch('/api/subscriptions/usage', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            return data.success ? data : null;
        } catch (e) {
            console.error('Error fetching usage metrics:', e);
            return null;
        }
    },

    // Select and activate a plan (Simulated payment activation until Phase 5 Razorpay)
    selectPlan: async (planId) => {
        const token = localStorage.getItem('vizhabook_token');
        if (!token) return { success: false, error: 'Authentication required' };
        try {
            const res = await fetch('/api/subscriptions/select-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId })
            });
            const data = await res.json();
            return data;
        } catch (e) {
            console.error('Error selecting plan:', e);
            return { success: false, error: 'Failed to process plan selection' };
        }
    },

    // Cancel current subscription
    cancelSubscription: async () => {
        const token = localStorage.getItem('vizhabook_token');
        if (!token) return { success: false, error: 'Authentication required' };
        try {
            const res = await fetch('/api/subscriptions/cancel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await res.json();
        } catch (e) {
            console.error('Error cancelling subscription:', e);
            return { success: false, error: 'Failed to cancel subscription' };
        }
    },

    // Abstracted payment verification (For future Phase 5 Razorpay integration)
    verifyPayment: async (paymentDetails) => {
        console.log('[Razorpay Abstraction] Payment verification placeholder called:', paymentDetails);
        return { success: true, verified: true };
    }
};

export default paymentService;
