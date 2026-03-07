import React, { createContext, useContext, useState, useEffect } from 'react';

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

    const [theme, setTheme] = useState(localStorage.getItem('moi_theme') || 'light');
    const [lang, setLang] = useState(localStorage.getItem('moi_lang') || 'en');

    useEffect(() => {
        localStorage.setItem('moi_functions', JSON.stringify(functions));
    }, [functions]);

    useEffect(() => {
        localStorage.setItem('moi_guests', JSON.stringify(guests));
    }, [guests]);

    useEffect(() => {
        localStorage.setItem('moi_entries', JSON.stringify(entries));
    }, [entries]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('moi_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('moi_lang', lang);
    }, [lang]);

    const addFunction = (func) => {
        setFunctions([...functions, { ...func, id: Date.now() }]);
    };

    const addGuest = (guest) => {
        const newGuest = { ...guest, id: Date.now() };
        setGuests([...guests, newGuest]);
        return newGuest; // Return the new guest so we can immediately read its generated ID
    };

    const addEntry = (entry) => {
        setEntries([...entries, { ...entry, id: Date.now() }]);
    };

    const removeFunction = (id) => setFunctions(functions.filter(f => f.id !== id));
    const removeGuest = (id) => setGuests(guests.filter(g => g.id !== id));
    const removeEntry = (id) => setEntries(entries.filter(e => e.id !== id));

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    const toggleLang = () => setLang(lang === 'en' ? 'ta' : 'en');

    return (
        <AppContext.Provider value={{
            functions, guests, entries,
            addFunction, addGuest, addEntry,
            removeFunction, removeGuest, removeEntry,
            theme, toggleTheme,
            lang, toggleLang
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
