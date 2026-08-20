// VizhaBook Offline Storage Utility (IndexedDB / LocalStorage Queue for Low Network)

const OFFLINE_QUEUE_KEY = 'vizhabook_offline_moi_queue_v1';
const PLAN_CACHE_KEY = 'vizhabook_cached_plan_v1';

/**
 * Save active subscription plan details to local cache when online
 */
export const cacheSubscriptionPlan = (planData) => {
    try {
        localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify({
            ...planData,
            cachedAt: new Date().toISOString()
        }));
    } catch (e) {
        console.warn('Failed to cache plan locally:', e);
    }
};

/**
 * Retrieve cached subscription plan details offline
 */
export const getCachedSubscriptionPlan = () => {
    try {
        const raw = localStorage.getItem(PLAN_CACHE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Failed to read cached plan:', e);
    }
    // Default fallback plan if uncached
    return {
        planName: 'Pro Trial',
        entryLimit: 500,
        currentCount: 0,
        isPro: true
    };
};

/**
 * Save entry to offline queue when wedding hall network drops
 */
export const saveOfflineEntry = (entryPayload) => {
    try {
        const currentQueue = getOfflineQueue();
        const offlineEntry = {
            ...entryPayload,
            offlineId: 'off_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            createdAt: new Date().toISOString(),
            isOffline: true
        };
        currentQueue.push(offlineEntry);
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(currentQueue));
        return offlineEntry;
    } catch (e) {
        console.error('Error saving offline entry:', e);
        return null;
    }
};

/**
 * Retrieve all pending offline entries
 */
export const getOfflineQueue = () => {
    try {
        const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn('Error reading offline queue:', e);
        return [];
    }
};

/**
 * Clear offline queue after successful backend batch sync
 */
export const clearOfflineQueue = () => {
    try {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
        console.warn('Error clearing offline queue:', e);
    }
};

/**
 * Validate offline entry limit against cached subscription plan
 */
export const validateOfflinePlanLimit = (existingEntriesCount = 0) => {
    const cachedPlan = getCachedSubscriptionPlan();
    const offlineCount = getOfflineQueue().length;
    const totalEffectiveCount = existingEntriesCount + offlineCount;

    const limit = cachedPlan.entryLimit || 500;
    const isAllowed = totalEffectiveCount < limit;

    return {
        isAllowed,
        limit,
        totalEffectiveCount,
        offlineCount,
        remaining: Math.max(0, limit - totalEffectiveCount)
    };
};
