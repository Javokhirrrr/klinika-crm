import { useState } from 'react';
import { FiSettings, FiUser, FiBriefcase, FiLock, FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/simple-pages.css';

export default function SimpleSettings() {
    const { user, org } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', icon: FiUser, label: 'Profil' },
        { id: 'organization', icon: FiBriefcase, label: 'Tashkilot' },
        { id: 'security', icon: FiLock, label: 'Xavfsizlik' },
        { id: 'notifications', icon: FiBell, label: 'Bildirishnomalar' }
    ];

    return (
        <div className="simple-page">
            <div className="page-header">
                <div>
                    <h1>Sozlamalar</h1>
                    <p className="text-muted">Tizim sozlamalari</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                background: activeTab === tab.id ? 'var(--primary-50)' : 'white',
                                border: `1px solid ${activeTab === tab.id ? 'var(--primary-500)' : 'var(--gray-200)'}`,
                                borderRadius: '12px',
                                color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--gray-700)',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="simple-card" style={{ padding: '2rem' }}>
                    {activeTab === 'profile' && (
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                                Profil Ma'lumotlari
                            </h2>
                            <div className="form-group">
                                <label>Ism</label>
                                <input type="text" className="input" defaultValue={user?.name} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" className="input" defaultValue={user?.email} />
                            </div>
                            <div className="form-group">
                                <label>Rol</label>
                                <input type="text" className="input" value={user?.role} disabled />
                            </div>
                            <button className="btn btn-primary">Saqlash</button>
                        </div>
                    )}

                    {activeTab === 'organization' && (
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                                Tashkilot Ma'lumotlari
                            </h2>
                            <div className="form-group">
                                <label>Nomi</label>
                                <input type="text" className="input" defaultValue={org?.name} />
                            </div>
                            <div className="form-group">
                                <label>Kod</label>
                                <input type="text" className="input" defaultValue={org?.code} />
                            </div>
                            <button className="btn btn-primary">Saqlash</button>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                                Xavfsizlik
                            </h2>
                            <div className="form-group">
                                <label>Joriy Parol</label>
                                <input type="password" className="input" />
                            </div>
                            <div className="form-group">
                                <label>Yangi Parol</label>
                                <input type="password" className="input" />
                            </div>
                            <div className="form-group">
                                <label>Parolni Tasdiqlash</label>
                                <input type="password" className="input" />
                            </div>
                            <button className="btn btn-primary">Parolni O'zgartirish</button>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                                Bildirishnomalar
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>Email bildirishnomalar</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>Yangi qabullar haqida</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input type="checkbox" />
                                    <span>To'lovlar haqida</span>
                                </label>
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Saqlash</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
