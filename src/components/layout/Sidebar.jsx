import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, HeartHandshake, ListOrdered, BarChart3, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../utils/translations';

const Sidebar = () => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];

    const menuItems = [
        { icon: LayoutDashboard, label: t.dashboard, path: '/' },
        { icon: Calendar, label: t.functions, path: '/functions' },
        { icon: Users, label: t.guests, path: '/guests' },
        { icon: HeartHandshake, label: t.moiEntry, path: '/entry' },
        { icon: ListOrdered, label: t.ledger, path: '/ledger' },
        { icon: BarChart3, label: t.reports, path: '/reports' },
    ];

    return (
        <aside className="sidebar">
            <div className="logo">
                <h1 className="text-2xl font-bold festive-text flex items-center gap-2 m-0">
                    <span style={{ fontSize: '1.875rem' }}>🎉</span> Digital Moi
                </h1>
            </div>
            <nav className="nav-links">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
