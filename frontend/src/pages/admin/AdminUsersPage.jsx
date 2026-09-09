import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, RefreshCw, CreditCard, Loader2, AlertCircle, UserCheck, BarChart2 } from 'lucide-react';
import { gsap } from 'gsap';
import AdminSidebar from '../../components/admin/AdminSidebar';
import ManageSubscriptionModal from '../../components/admin/ManageSubscriptionModal';
import UserAnalyticsDrawer from '../../components/admin/UserAnalyticsDrawer';
import { adminService } from '../../services/adminService';
import './AdminUsersPage.css';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [selectedUser, setSelectedUser] = useState(null);
    const [analyticsUserId, setAnalyticsUserId] = useState(null);
    const tableRowsRef = useRef([]);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminService.getUsers(search, planFilter, statusFilter);
            setUsers(data.users || []);
        } catch (err) {
            setError(err.message || 'Failed to load users list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [search, planFilter, statusFilter]);

    // GSAP Row Entrance Animation
    useEffect(() => {
        if (users.length > 0 && tableRowsRef.current.length > 0) {
            gsap.fromTo(
                tableRowsRef.current.filter(Boolean),
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
            );
        }
    }, [users]);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />

            <main className="admin-main-content">
                <header className="admin-page-header">
                    <div>
                        <h1 className="admin-page-title">User & Subscription Management</h1>
                        <p className="admin-page-description">Manage all registered VizhaBook hosts, view deep-dive analytics, and activate offline subscriptions</p>
                    </div>

                    <button 
                        className="admin-refresh-btn" 
                        onClick={fetchUsers}
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                        <span>Refresh List</span>
                    </button>
                </header>

                {error && (
                    <div className="admin-alert error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* FILTER BAR */}
                <div className="admin-filter-bar">
                    <div className="search-input-box">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by Name, Email, or Mobile Number..."
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={16} className="filter-icon" />
                        <select 
                            value={planFilter} 
                            onChange={(e) => setPlanFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="ALL">All Subscription Plans</option>
                            <option value="PLAN_FREE">Free Plan</option>
                            <option value="PLAN_SILVER">Silver Plan</option>
                            <option value="PLAN_GOLD">Gold Plan</option>
                            <option value="PLAN_PLATINUM">Platinum Plan</option>
                        </select>

                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="TRIAL">TRIAL</option>
                            <option value="EXPIRED">EXPIRED</option>
                        </select>
                    </div>
                </div>

                {/* USERS TABLE */}
                <div className="admin-table-container">
                    {loading ? (
                        <div className="admin-loading-container">
                            <Loader2 className="spin" size={32} />
                            <p>Loading registered users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="admin-empty-state">
                            <UserCheck size={48} className="empty-icon" />
                            <h3>No Users Found</h3>
                            <p>Try adjusting your search query or filters.</p>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>USER NAME</th>
                                    <th>EMAIL</th>
                                    <th>MOBILE</th>
                                    <th>CURRENT PLAN</th>
                                    <th>STATUS</th>
                                    <th>EXPIRY DATE</th>
                                    <th>CREATED DATE</th>
                                    <th className="text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, idx) => {
                                    const sub = user.subscription || {};
                                    const statusLower = (sub.status || 'TRIAL').toLowerCase();
                                    return (
                                        <tr key={user.id} ref={(el) => (tableRowsRef.current[idx] = el)}>
                                            <td>
                                                <div 
                                                    className="user-name-cell clickable"
                                                    onClick={() => setAnalyticsUserId(user.id)}
                                                    title="Click to view deep-dive user analytics"
                                                >
                                                    <div className="user-avatar-sm">
                                                        {user.name ? user.name[0].toUpperCase() : 'U'}
                                                    </div>
                                                    <div className="user-name-wrapper">
                                                        <span className="user-name-text">{user.name}</span>
                                                        <span className="view-analytics-link"><BarChart2 size={12} /> Analytics</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-secondary">{user.email}</td>
                                            <td className="text-secondary">{user.phone ? `${user.countryCode || '+91'} ${user.phone}` : 'N/A'}</td>
                                            <td>
                                                <span className="plan-badge">
                                                    {sub.planName || 'Free Plan'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${statusLower}`}>
                                                    {sub.status || 'TRIAL'}
                                                </span>
                                            </td>
                                            <td className="text-secondary">{formatDate(sub.endDate)}</td>
                                            <td className="text-secondary">{formatDate(user.createdAt)}</td>
                                            <td className="text-right">
                                                <div className="action-btn-row">
                                                    <button 
                                                        className="btn-view-analytics"
                                                        onClick={() => setAnalyticsUserId(user.id)}
                                                        title="View host profile analytics drawer"
                                                    >
                                                        <BarChart2 size={14} />
                                                        <span>Analytics</span>
                                                    </button>

                                                    <button 
                                                        className="btn-manage-sub"
                                                        onClick={() => setSelectedUser(user)}
                                                    >
                                                        <CreditCard size={14} />
                                                        <span>Manage Sub</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* MANAGE SUBSCRIPTION MODAL */}
                {selectedUser && (
                    <ManageSubscriptionModal 
                        user={selectedUser} 
                        onClose={() => setSelectedUser(null)}
                        onSuccess={fetchUsers}
                    />
                )}

                {/* USER DEEP-DIVE ANALYTICS DRAWER */}
                {analyticsUserId && (
                    <UserAnalyticsDrawer 
                        userId={analyticsUserId}
                        onClose={() => setAnalyticsUserId(null)}
                        onOpenManageSub={(user) => setSelectedUser(user)}
                        onStatusChange={fetchUsers}
                    />
                )}
            </main>
        </div>
    );
};

export default AdminUsersPage;
