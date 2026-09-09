import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeftRight, LogOut, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';
import { adminService } from '../../services/adminService';
import './AdminSidebar.css';

const AdminSidebar = ({ onCollapseToggle }) => {
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    });

    useEffect(() => {
        if (sidebarRef.current) {
            gsap.fromTo(
                sidebarRef.current,
                { x: -40, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
            );
        }
    }, []);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('admin_sidebar_collapsed', String(nextState));

        if (sidebarRef.current) {
            gsap.to(sidebarRef.current, {
                width: nextState ? '80px' : '260px',
                duration: 0.35,
                ease: 'power2.inOut'
            });
        }

        if (onCollapseToggle) {
            onCollapseToggle(nextState);
        }
    };

    const handleLogout = () => {
        adminService.logout();
        navigate('/admin/login');
    };

    return (
        <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`} ref={sidebarRef}>
            <div className="admin-sidebar-header">
                <div className="admin-logo-box">
                    <img src="/logo.png" alt="VizhaBook Logo" className="admin-logo-img" onError={(e) => e.target.style.display = 'none'} />
                    {!isCollapsed && <span className="admin-logo-text">VizhaBook</span>}
                </div>

                {!isCollapsed && (
                    <div className="admin-badge">
                        <ShieldCheck size={14} /> SUPER ADMIN
                    </div>
                )}

                <button 
                    className="admin-collapse-toggle-btn" 
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className="admin-nav">
                <NavLink 
                    to="/admin/dashboard" 
                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? "Executive Dashboard" : ""}
                >
                    <LayoutDashboard size={20} className="nav-icon" />
                    {!isCollapsed && <span>Dashboard</span>}
                </NavLink>

                <NavLink 
                    to="/admin/users" 
                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? "User Management" : ""}
                >
                    <Users size={20} className="nav-icon" />
                    {!isCollapsed && <span>User Management</span>}
                </NavLink>

                <div className="admin-nav-divider"></div>

                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="admin-nav-item secondary"
                    title={isCollapsed ? "Go to User Application" : ""}
                >
                    <ArrowLeftRight size={20} className="nav-icon" />
                    {!isCollapsed && <span>Go to User App</span>}
                </button>
            </nav>

            <div className="admin-sidebar-footer">
                <div className="admin-user-info">
                    <div className="admin-avatar">
                        {(adminUser.name || 'A')[0].toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="admin-user-details">
                            <div className="admin-user-name">{adminUser.name || 'Super Admin'}</div>
                            <div className="admin-user-email">{adminUser.email || 'admin@vizhabook.com'}</div>
                        </div>
                    )}
                </div>
                <button onClick={handleLogout} className="admin-logout-btn" title="Sign out of Admin Portal">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
