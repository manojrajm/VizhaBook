import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import functionService from '../services/functionService';
import expenseService from '../services/expenseService';
import moiService from '../services/moiService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [functions, setFunctions] = useState(() => {
        const saved = localStorage.getItem('moi_functions');
        return saved ? JSON.parse(saved) : [];
    });

    // Auto-sync functions and expenses from PostgreSQL on mount & Socket.io WebSockets
    useEffect(() => {
        const syncDbOnMount = async () => {
            try {
                const res = await functionService.getFunctions();
                if (res.success && res.functions && res.functions.length > 0) {
                    setFunctions(res.functions);
                }
            } catch (e) {
                console.warn('AppContext DB functions sync:', e.message);
            }
            try {
                const expRes = await expenseService.getExpenses();
                if (expRes.success && expRes.expenses) {
                    setExpenses(expRes.expenses);
                }
            } catch (e) {
                console.warn('AppContext DB expenses sync:', e.message);
            }
            try {
                const moiRes = await moiService.getMoiEntries();
                if (moiRes.success && moiRes.entries) {
                    setEntries(moiRes.entries);
                }
            } catch (e) {
                console.warn('AppContext DB moi entries sync:', e.message);
            }
        };
        syncDbOnMount();

        // Connect Socket.io Client for 0ms instant multi-counter WebSockets sync
        const host = window.location.hostname || 'localhost';
        const socket = io(`http://${host}:5002`, { transports: ['websocket', 'polling'] });

        socket.on('connect', () => {
            console.log(`⚡ [Socket.io Client] Connected to real-time server (${socket.id})`);
        });

        socket.on('NEW_MOI_ENTRY', (newEntry) => {
            console.log('📡 [Socket.io Client] Received NEW_MOI_ENTRY:', newEntry);
            if (newEntry && newEntry.id) {
                setEntries(prev => {
                    if (prev.some(e => String(e.id) === String(newEntry.id))) return prev;
                    return [newEntry, ...prev];
                });
            }
        });

        socket.on('NEW_PENDING_CHECKIN', (newPending) => {
            console.log('📡 [Socket.io Client] Received NEW_PENDING_CHECKIN:', newPending);
            if (newPending && newPending.id) {
                setPendingEntries(prev => {
                    if (prev.some(p => String(p.id) === String(newPending.id))) return prev;
                    return [newPending, ...prev];
                });
            }
        });

        socket.on('PENDING_APPROVED', (data) => {
            console.log('📡 [Socket.io Client] Received PENDING_APPROVED:', data);
            const pId = data?.pendingId || data;
            if (pId) {
                setPendingEntries(prev => prev.filter(p => String(p.id) !== String(pId)));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const refetchMoiEntries = async () => {
        try {
            const res = await moiService.getMoiEntries();
            if (res.success && res.entries) {
                setEntries(res.entries);
            }
        } catch (e) {
            console.warn('refetchMoiEntries error:', e.message);
        }
    };

    const [guests, setGuests] = useState(() => {
        const saved = localStorage.getItem('moi_guests');
        return saved ? JSON.parse(saved) : [];
    });

    const [entries, setEntries] = useState(() => {
        const saved = localStorage.getItem('moi_entries');
        return saved ? JSON.parse(saved) : [];
    });

    const [pendingEntries, setPendingEntries] = useState(() => {
        const saved = localStorage.getItem('moi_pending');
        return saved ? JSON.parse(saved) : [];
    });

    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('moi_expenses');
        return saved ? JSON.parse(saved) : [];
    });

    const [theme, setTheme] = useState(localStorage.getItem('moi_theme') || 'light');
    const [lang, setLang] = useState(localStorage.getItem('moi_lang') || 'en');
    const [isSyncing, setIsSyncing] = useState(false);
    const [cloudId, setCloudId] = useState(localStorage.getItem('moi_cloud_id') || '');
    const [isCloudEnabled, setIsCloudEnabled] = useState(localStorage.getItem('moi_cloud_enabled') === 'true');
    const [hostSettings, setHostSettings] = useState(() => {
        const saved = localStorage.getItem('moi_host_settings');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed && parsed.upiId && parsed.upiId !== 'vizhabook@okhdfcbank') {
            return parsed;
        }
        return { upiId: 'gauthamtamizha007-1@oksbi', hostName: 'Vizha Book' };
    });

    const channelRef = useRef(null);
    const lastReceived = useRef({});

    // -------- BroadcastChannel Setup --------
    useEffect(() => {
        channelRef.current = new BroadcastChannel('vizha-sync');

        channelRef.current.onmessage = (event) => {
            const { type, payload } = event.data;
            lastReceived.current[type] = JSON.stringify(payload);
            setIsSyncing(true);
            setTimeout(() => setIsSyncing(false), 1500);

            switch (type) {
                case 'SYNC_FUNCTIONS': setFunctions(payload); break;
                case 'SYNC_GUESTS': setGuests(payload); break;
                case 'SYNC_ENTRIES': setEntries(payload); break;
                case 'SYNC_PENDING': setPendingEntries(payload); break;
                case 'SYNC_EXPENSES': setExpenses(payload); break;
                case 'SYNC_HOST_SETTINGS': setHostSettings(payload); break;
                default: break;
            }
        };

        return () => channelRef.current?.close();
    }, []);

    const broadcast = (type, payload) => {
        channelRef.current?.postMessage({ type, payload });
    };

    // -------- LocalStorage Sync + Broadcast --------
    useEffect(() => {
        const payload = JSON.stringify(functions);
        localStorage.setItem('moi_functions', payload);
        if (lastReceived.current['SYNC_FUNCTIONS'] !== payload) broadcast('SYNC_FUNCTIONS', functions);
        lastReceived.current['SYNC_FUNCTIONS'] = payload;
    }, [functions]);

    useEffect(() => {
        const payload = JSON.stringify(guests);
        localStorage.setItem('moi_guests', payload);
        if (lastReceived.current['SYNC_GUESTS'] !== payload) broadcast('SYNC_GUESTS', guests);
        lastReceived.current['SYNC_GUESTS'] = payload;
    }, [guests]);

    useEffect(() => {
        const payload = JSON.stringify(entries);
        localStorage.setItem('moi_entries', payload);
        if (lastReceived.current['SYNC_ENTRIES'] !== payload) broadcast('SYNC_ENTRIES', entries);
        lastReceived.current['SYNC_ENTRIES'] = payload;
    }, [entries]);

    useEffect(() => {
        const payload = JSON.stringify(pendingEntries);
        localStorage.setItem('moi_pending', payload);
        if (lastReceived.current['SYNC_PENDING'] !== payload) broadcast('SYNC_PENDING', pendingEntries);
        lastReceived.current['SYNC_PENDING'] = payload;
    }, [pendingEntries]);

    useEffect(() => {
        const payload = JSON.stringify(expenses);
        localStorage.setItem('moi_expenses', payload);
        if (lastReceived.current['SYNC_EXPENSES'] !== payload) broadcast('SYNC_EXPENSES', expenses);
        lastReceived.current['SYNC_EXPENSES'] = payload;
    }, [expenses]);
    
    useEffect(() => {
        const payload = JSON.stringify(hostSettings);
        localStorage.setItem('moi_host_settings', payload);
        if (lastReceived.current['SYNC_HOST_SETTINGS'] !== payload) broadcast('SYNC_HOST_SETTINGS', hostSettings);
        lastReceived.current['SYNC_HOST_SETTINGS'] = payload;
    }, [hostSettings]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('moi_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('moi_lang', lang);
    }, [lang]);

    useEffect(() => {
        localStorage.setItem('moi_cloud_id', cloudId);
    }, [cloudId]);

    useEffect(() => {
        localStorage.setItem('moi_cloud_enabled', isCloudEnabled);
    }, [isCloudEnabled]);

    useEffect(() => {
        localStorage.setItem('moi_host_settings', JSON.stringify(hostSettings));
    }, [hostSettings]);

    // -------- Cloud Sync Logic --------
    const isFirstRun = useRef(true);

    // -------- CRUD Operations --------
    const addFunction = (func) => {
        setFunctions(prev => [...prev, { ...func, id: Date.now() }]);
    };

    const addGuest = (guest) => {
        const newGuest = { ...guest, id: Date.now() };
        setGuests(prev => [...prev, newGuest]);
        return newGuest;
    };

    const addEntry = (entry) => {
        setEntries(prev => [...prev, { ...entry, id: Date.now() }]);
    };

    const addExpense = (expense) => {
        setExpenses(prev => [...prev, { ...expense, id: Date.now() }]);
    };

    // Pending entries for QR Check-In verification flow
    const addPendingEntry = (entry) => {
        const pending = { ...entry, id: Date.now(), submittedAt: new Date().toISOString() };
        setPendingEntries(prev => [...prev, pending]);
    };

    const approvePendingEntry = (id, editedData) => {
        const pending = pendingEntries.find(p => p.id === id);
        if (!pending) return;
        const finalEntry = { ...pending, ...editedData };
        // Create guest and then entry
        const newGuest = addGuest({ name: finalEntry.guestName, phone: finalEntry.phone || '', relation: finalEntry.relation });
        addEntry({ ...finalEntry, guestId: newGuest.id });
        setPendingEntries(prev => prev.filter(p => p.id !== id));
    };

    const rejectPendingEntry = (id) => {
        setPendingEntries(prev => prev.filter(p => p.id !== id));
    };

    const removeFunction = (id) => setFunctions(prev => prev.filter(f => f.id !== id));
    const removeGuest = (id) => setGuests(prev => prev.filter(g => g.id !== id));
    const removeEntry = (id) => setEntries(prev => prev.filter(e => e.id !== id));

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    const toggleLang = () => setLang(lang === 'en' ? 'ta' : 'en');

    return (
        <AppContext.Provider value={{
            functions, guests, entries, pendingEntries, expenses,
            addFunction, addGuest, addEntry, addExpense, refetchMoiEntries,
            addPendingEntry, approvePendingEntry, rejectPendingEntry,
            removeFunction, removeGuest, removeEntry, removeExpense: (id) => setExpenses(prev => prev.filter(e => e.id !== id)),
            theme, toggleTheme,
            lang, toggleLang,
            isSyncing,
            cloudId, setCloudId,
            isCloudEnabled, setIsCloudEnabled,
            hostSettings, setHostSettings
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
