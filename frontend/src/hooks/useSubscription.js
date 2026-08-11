import { useState, useEffect, useCallback } from 'react';
import paymentService from '../services/paymentService';

export const useSubscription = () => {
    const [loading, setLoading] = useState(true);
    const [subData, setSubData] = useState(null);
    const [usageData, setUsageData] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [subRes, usageRes] = await Promise.all([
                paymentService.getCurrentSubscription(),
                paymentService.getUsage()
            ]);

            setSubData(subRes);
            setUsageData(usageRes);
        } catch (e) {
            console.error('useSubscription error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const status = subData?.status || usageData?.status || 'TRIAL';
    const isTrial = status === 'TRIAL';
    const isActive = status === 'ACTIVE';
    const isExpired = status === 'EXPIRED' || !!usageData?.isExpired;

    return {
        loading,
        subscription: subData?.subscription || null,
        plan: subData?.plan || null,
        status,
        isTrial,
        isActive,
        isExpired,
        daysRemaining: subData?.daysRemaining ?? 14,
        functionLimit: usageData?.functionLimit ?? 1,
        entryLimit: usageData?.entryLimit ?? 300,
        functionsUsed: usageData?.functionsUsed ?? 0,
        entriesUsed: usageData?.entriesUsed ?? 0,
        canCreateFunction: usageData?.canCreateFunction ?? !isExpired,
        canCreateEntry: usageData?.canCreateEntry ?? !isExpired,
        refetch: fetchData
    };
};

export default useSubscription;
