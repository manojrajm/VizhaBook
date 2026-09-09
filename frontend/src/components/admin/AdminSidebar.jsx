import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeftRight, LogOut, ShieldCheck } from 'lucide-react';
import { gsap } from 'gsap';
import { adminService } from '../../services/adminService';
import './AdminSidebar.css';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    useEffect(() => {
        if (sidebarRef.current) {
            gsap.fromTo(
                sidebarRef.current,
                { x: -50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
            );
        }
    }, []);

    const handleLogout = () => {
        adminService.logout();
        navigate('/admin/login');
    };

    return (
        <aside className="admin-sidebar" ref={sidebarRef}>
            <div className="admin-sidebar-header">
                <div className="admin-logo-box">
                    <img src="/logo.png" alt="VizhaBook Logo" className="admin-logo-img" onError={(e) => e.target.style.display = 'none'} />
                    <span className="admin-logo-text">VizhaBook</span>
                </div>
                <div className="admin-badge">
                    <ShieldCheck size={14} /> SUPER ADMIN
                </div>
            </div>

            <nav className="admin-nav">
                <NavLink 
                    to="/admin/dashboard" 
                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink 
                    to="/admin/users" 
                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                >
                    <Users size={20} />
                    <span>User Management</span>
                </NavLink>

                <div className="admin-nav-divider"></div>

                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="admin-nav-item secondary"
                >
                    <ArrowLeftRight size={20} />
                    <span>Go to User App</span>
                </button>
            </nav>

            <div className="admin-sidebar-footer">
                <div className="admin-user-info">
                    <div className="admin-avatar">
                        {(adminUser.name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="admin-user-details">
                        <div className="admin-user-name">{adminUser.name || 'Super Admin'}</div>
                        <div className="admin-user-email">{adminUser.email || 'admin@vizhabook.com'}</div>
                    </div>
                </div>
                <button onClick={handleLogout} className="admin-logout-btn" title="Sign out of Admin Portal">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
