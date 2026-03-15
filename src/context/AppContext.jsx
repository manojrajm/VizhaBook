import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [functions, setFunctions] = useState(() => {
        const saved = localStorage.getItem('moi_functions');
        return saved ? JSON.parse(saved) : [];
    });

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
        return saved ? JSON.parse(saved) : { upiId: 'vizhabook@okhdfcbank', hostName: 'Vizha Book' };
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

    // Pull from Cloud on mount if enabled
    useEffect(() => {
        if (!isCloudEnabled || !cloudId) return;

        const syncDoc = doc(db, 'sync_sessions', cloudId);
        
        // Use onSnapshot for real-time pull from other devices
        const unsub = onSnapshot(syncDoc, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                // Avoid infinite loops by checking source
                if (isBroadcasting.current) return;
                
                setIsSyncing(true);
                if (data.functions) setFunctions(data.functions);
                if (data.guests) setGuests(data.guests);
                if (data.entries) setEntries(data.entries);
                if (data.expenses) setExpenses(data.expenses);
                setTimeout(() => setIsSyncing(false), 1000);
            }
        });

        return () => unsub();
    }, [cloudId, isCloudEnabled]);

    // Push to Cloud on local changes
    useEffect(() => {
        if (!isCloudEnabled || !cloudId) return;
        if (isBroadcasting.current) return; // Don't push what we just pulled

        const timer = setTimeout(async () => {
            const syncDoc = doc(db, 'sync_sessions', cloudId);
            await setDoc(syncDoc, {
                functions, guests, entries, expenses,
                lastSynced: new Date().toISOString()
            }, { merge: true });
        }, 2000); // Debounce push

        return () => clearTimeout(timer);
    }, [functions, guests, entries, expenses, cloudId, isCloudEnabled]);

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
            addFunction, addGuest, addEntry, addExpense,
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
