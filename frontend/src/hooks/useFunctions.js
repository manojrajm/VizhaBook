import { useState, useCallback } from 'react';
import functionService from '../services/functionService';

const useFunctions = () => {
    const [functions, setFunctions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchFunctions = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await functionService.getFunctions();
        if (res.success) {
            setFunctions(res.functions);
        } else {
            setError(res.error || 'Failed to load functions.');
        }
        setLoading(false);
    }, []);

    const createFn = async (payload) => {
        const res = await functionService.createFunction(payload);
        if (res.success) {
            await fetchFunctions();
        }
        return res;
    };

    const updateFn = async (id, payload) => {
        const res = await functionService.updateFunction(id, payload);
        if (res.success) {
            await fetchFunctions();
        }
        return res;
    };

    const deleteFn = async (id) => {
        const res = await functionService.deleteFunction(id);
        if (res.success) {
            setFunctions(prev => prev.filter(f => f.id !== id));
        }
        return res;
    };

    return {
        functions,
        loading,
        error,
        refetch: fetchFunctions,
        createFn,
        updateFn,
        deleteFn
    };
};

export default useFunctions;
