import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Shield, Bell, Globe, CreditCard, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import SubscriptionSettingsPage from './subscription/SubscriptionSettingsPage';
import PaymentMethodsPage from './PaymentMethodsPage';
import './SettingsPage.css';

const SettingsPage = () => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const { lang, toggleLang } = useApp();

    const isSubInitial = location.pathname.includes('/subscription');
    const isPmInitial = location.pathname.includes('/payment-methods');
    const [activeTab, setActiveTab] = useState(isPmInitial ? 'payment-methods' : (isSubInitial ? 'billing' : 'profile'));

    return (
        <div className="settings-container">
            <div className="settings-header-banner">
                <h2>System Settings</h2>
                <p>Manage your account preferences, notifications, language, and subscription plan</p>
            </div>

            {/* Tabs List */}
            <div className="settings-tabs-list">
                <button
                    className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <User size={18} />
                    <span>Profile</span>
                </button>

                <button
                    className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                    onClick={() => setActiveTab('account')}
                >
                    <Shield size={18} />
                    <span>Account & Security</span>
                </button>

                <button
                    className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                >
                    <Bell size={18} />
                    <span>Notifications</span>
                </button>

                <button
                    className={`settings-tab-btn ${activeTab === 'language' ? 'active' : ''}`}
                    onClick={() => setActiveTab('language')}
                >
                    <Globe size={18} />
                    <span>Language & Region</span>
                </button>

                <button
                    className={`settings-tab-btn ${activeTab === 'payment-methods' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payment-methods')}
                >
                    <QrCode size={18} />
                    <span>Function Payment Methods</span>
                </button>

                <button
                    className={`settings-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('billing')}
                >
                    <CreditCard size={18} />
                    <span>Subscription & Billing</span>
                </button>
            </div>

            {/* Tab Panel Content */}
            {activeTab === 'profile' && (
                <div className="settings-tab-content">
                    <h3 className="settings-card-title">User Profile Details</h3>
                    <div className="settings-form-grid">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input className="form-input" type="text" defaultValue={currentUser?.name || 'Aravind'} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input className="form-input" type="email" defaultValue={currentUser?.email || 'aravind040806@gmail.com'} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input className="form-input" type="text" defaultValue={currentUser?.phone || '+91 9876543210'} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <input className="form-input" type="text" defaultValue={currentUser?.role || 'USER'} readOnly />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'account' && (
                <div className="settings-tab-content">
                    <h3 className="settings-card-title">Account Security</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Your account is secured with hashed passwords and token-based authentication.
                    </p>
                    <div className="settings-form-grid">
                        <div className="form-group">
                            <label>Account ID</label>
                            <input className="form-input" type="text" defaultValue={currentUser?.accountId || 'acc_default'} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Password Status</label>
                            <input className="form-input" type="text" defaultValue="•••••••• (Bcrypt Encrypted)" readOnly />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="settings-tab-content">
                    <h3 className="settings-card-title">Notification Preferences</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                            <span>Send WhatsApp receipt confirmations on Moi entries</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                            <span>Send SMS notifications for pending approvals</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                            <span>Email subscription renewal alerts</span>
                        </label>
                    </div>
                </div>
            )}

            {activeTab === 'language' && (
                <div className="settings-tab-content">
                    <h3 className="settings-card-title">Language & Regional Settings</h3>
                    <div className="settings-form-grid">
                        <div className="form-group">
                            <label>Current Application Language</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: 700 }}>{lang === 'en' ? 'English (EN)' : 'தமிழ் (TA)'}</span>
                                <button className="btn-save-settings" style={{ marginTop: 0 }} onClick={toggleLang}>
                                    Switch to {lang === 'en' ? 'தமிழ்' : 'English'}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Currency Display</label>
                            <input className="form-input" type="text" defaultValue="INR (₹ Indian Rupee)" readOnly />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'payment-methods' && (
                <PaymentMethodsPage />
            )}

            {activeTab === 'billing' && (
                <SubscriptionSettingsPage />
            )}
        </div>
    );
};

export default SettingsPage;
