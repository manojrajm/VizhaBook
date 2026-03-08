import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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

    const [theme, setTheme] = useState(localStorage.getItem('moi_theme') || 'light');
    const [lang, setLang] = useState(localStorage.getItem('moi_lang') || 'en');
    const [isSyncing, setIsSyncing] = useState(false);

    const channelRef = useRef(null);
    const isBroadcasting = useRef(false);

    // -------- BroadcastChannel Setup --------
    useEffect(() => {
        channelRef.current = new BroadcastChannel('vizha-sync');

        channelRef.current.onmessage = (event) => {
            const { type, payload } = event.data;
            isBroadcasting.current = true;
            setIsSyncing(true);
            setTimeout(() => setIsSyncing(false), 1500);

            switch (type) {
                case 'SYNC_FUNCTIONS': setFunctions(payload); break;
                case 'SYNC_GUESTS': setGuests(payload); break;
                case 'SYNC_ENTRIES': setEntries(payload); break;
                case 'SYNC_PENDING': setPendingEntries(payload); break;
                default: break;
            }
            isBroadcasting.current = false;
        };

        return () => channelRef.current?.close();
    }, []);

    const broadcast = (type, payload) => {
        channelRef.current?.postMessage({ type, payload });
    };

    // -------- LocalStorage Sync + Broadcast --------
    useEffect(() => {
        localStorage.setItem('moi_functions', JSON.stringify(functions));
        if (!isBroadcasting.current) broadcast('SYNC_FUNCTIONS', functions);
    }, [functions]);

    useEffect(() => {
        localStorage.setItem('moi_guests', JSON.stringify(guests));
        if (!isBroadcasting.current) broadcast('SYNC_GUESTS', guests);
    }, [guests]);

    useEffect(() => {
        localStorage.setItem('moi_entries', JSON.stringify(entries));
        if (!isBroadcasting.current) broadcast('SYNC_ENTRIES', entries);
    }, [entries]);

    useEffect(() => {
        localStorage.setItem('moi_pending', JSON.stringify(pendingEntries));
        if (!isBroadcasting.current) broadcast('SYNC_PENDING', pendingEntries);
    }, [pendingEntries]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('moi_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('moi_lang', lang);
    }, [lang]);

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
            functions, guests, entries, pendingEntries,
            addFunction, addGuest, addEntry,
            addPendingEntry, approvePendingEntry, rejectPendingEntry,
            removeFunction, removeGuest, removeEntry,
            theme, toggleTheme,
            lang, toggleLang,
            isSyncing
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
