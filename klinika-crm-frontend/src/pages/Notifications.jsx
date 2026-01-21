// src/pages/Notifications.jsx
import React, { useState, useEffect } from 'react';
import http from '../lib/http';
import { useToast } from '../components/Toast';
import { PageLoading } from '../components/LoadingStates';

export default function Notifications() {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'templates', 'history'

    // Settings
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [telegramEnabled, setTelegramEnabled] = useState(false);
    const [smsProvider, setSmsProvider] = useState('eskiz'); // 'eskiz', 'playmobile'
    const [smsApiKey, setSmsApiKey] = useState('');
    const [telegramBotToken, setTelegramBotToken] = useState('');

    // Templates
    const [templates, setTemplates] = useState([
        { id: 1, name: 'Qabul eslatmasi', type: 'appointment_reminder', content: 'Hurmatli {patient_name}, sizning qabulingiz {date} kuni {time} da. Shifokor: {doctor_name}' },
        { id: 2, name: 'To\'lov eslatmasi', type: 'payment_reminder', content: 'Hurmatli {patient_name}, sizda {amount} so\'m to\'lov qoldi.' },
        { id: 3, name: 'Qabul tasdiqlash', type: 'appointment_confirmation', content: 'Sizning qabulingiz tasdiqlandi. Sana: {date}, Vaqt: {time}' }
    ]);

    // Test notification
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [sending, setSending] = useState(false);

    async function saveSettings() {
        setLoading(true);
        try {
            await http.post('/system/notification-settings', {
                smsEnabled,
                telegramEnabled,
                smsProvider,
                smsApiKey,
                telegramBotToken
            });
            toast.success('Sozlamalar saqlandi');
        } catch (error) {
            toast.error('Xatolik: ' + (error.message || 'Sozlamalarni saqlashda xatolik'));
        } finally {
            setLoading(false);
        }
    }

    async function sendTestNotification() {
        if (!testPhone || !testMessage) {
            toast.warning('Telefon raqami va xabarni kiriting');
            return;
        }

        setSending(true);
        try {
            await http.post('/notifications/send-test', {
                phone: testPhone,
                message: testMessage
            });
            toast.success('Test xabar yuborildi');
            setTestPhone('');
            setTestMessage('');
        } catch (error) {
            toast.error('Xatolik: ' + (error.message || 'Xabar yuborishda xatolik'));
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="page">
            <h1>Bildirishnomalar</h1>

            {/* Tabs */}
            <div style={styles.tabs}>
                <button
                    className={`btn ${activeTab === 'settings' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Sozlamalar
                </button>
                <button
                    className={`btn ${activeTab === 'templates' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('templates')}
                >
                    Shablonlar
                </button>
                <button
                    className={`btn ${activeTab === 'test' ? 'primary' : ''}`}
                    onClick={() => setActiveTab('test')}
                >
                    Test
                </button>
            </div>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="card" style={{ marginTop: 24 }}>
                    <h2 style={styles.sectionTitle}>SMS Sozlamalari</h2>

                    <div style={styles.settingRow}>
                        <label style={styles.label}>
                            <input
                                type="checkbox"
                                checked={smsEnabled}
                                onChange={e => setSmsEnabled(e.target.checked)}
                                style={{ marginRight: 8 }}
                            />
                            SMS bildirishnomalarni yoqish
                        </label>
                    </div>

                    {smsEnabled && (
                        <>
                            <div style={styles.settingRow}>
                                <label style={styles.label}>SMS Provayder</label>
                                <select
                                    className="input"
                                    value={smsProvider}
                                    onChange={e => setSmsProvider(e.target.value)}
                                    style={{ maxWidth: 300 }}
                                >
                                    <option value="eskiz">Eskiz.uz</option>
                                    <option value="playmobile">Playmobile</option>
                                </select>
                            </div>

                            <div style={styles.settingRow}>
                                <label style={styles.label}>API Key</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={smsApiKey}
                                    onChange={e => setSmsApiKey(e.target.value)}
                                    placeholder="API kalitini kiriting"
                                    style={{ maxWidth: 400 }}
                                />
                            </div>
                        </>
                    )}

                    <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

                    <h2 style={styles.sectionTitle}>Telegram Sozlamalari</h2>

                    <div style={styles.settingRow}>
                        <label style={styles.label}>
                            <input
                                type="checkbox"
                                checked={telegramEnabled}
                                onChange={e => setTelegramEnabled(e.target.value)}
                                style={{ marginRight: 8 }}
                            />
                            Telegram bildirishnomalarni yoqish
                        </label>
                    </div>

                    {telegramEnabled && (
                        <div style={styles.settingRow}>
                            <label style={styles.label}>Bot Token</label>
                            <input
                                type="password"
                                className="input"
                                value={telegramBotToken}
                                onChange={e => setTelegramBotToken(e.target.value)}
                                placeholder="Bot tokenini kiriting"
                                style={{ maxWidth: 400 }}
                            />
                            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                                @BotFather dan bot yaratib, tokenni oling
                            </p>
                        </div>
                    )}

                    <div style={{ marginTop: 24 }}>
                        <button
                            className="btn primary"
                            onClick={saveSettings}
                            disabled={loading}
                        >
                            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                    </div>
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="card" style={{ marginTop: 24 }}>
                    <h2 style={styles.sectionTitle}>Xabar Shablonlari</h2>

                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 14, color: '#6b7280' }}>
                            Mavjud o'zgaruvchilar: {'{patient_name}'}, {'{doctor_name}'}, {'{date}'}, {'{time}'}, {'{amount}'}
                        </p>
                    </div>

                    {templates.map(template => (
                        <div key={template.id} style={styles.templateCard}>
                            <div style={styles.templateHeader}>
                                <h3 style={{ margin: 0, fontSize: 16 }}>{template.name}</h3>
                                <span className="badge">{template.type}</span>
                            </div>
                            <textarea
                                className="input"
                                value={template.content}
                                onChange={e => {
                                    setTemplates(templates.map(t =>
                                        t.id === template.id ? { ...t, content: e.target.value } : t
                                    ));
                                }}
                                rows={3}
                                style={{ marginTop: 12, width: '100%' }}
                            />
                        </div>
                    ))}

                    <div style={{ marginTop: 24 }}>
                        <button className="btn primary">
                            Shablonlarni saqlash
                        </button>
                    </div>
                </div>
            )}

            {/* Test Tab */}
            {activeTab === 'test' && (
                <div className="card" style={{ marginTop: 24 }}>
                    <h2 style={styles.sectionTitle}>Test Xabar Yuborish</h2>

                    <div style={styles.settingRow}>
                        <label style={styles.label}>Telefon raqami</label>
                        <input
                            type="tel"
                            className="input"
                            value={testPhone}
                            onChange={e => setTestPhone(e.target.value)}
                            placeholder="+998901234567"
                            style={{ maxWidth: 300 }}
                        />
                    </div>

                    <div style={styles.settingRow}>
                        <label style={styles.label}>Xabar</label>
                        <textarea
                            className="input"
                            value={testMessage}
                            onChange={e => setTestMessage(e.target.value)}
                            placeholder="Test xabarni kiriting..."
                            rows={4}
                            style={{ maxWidth: 500 }}
                        />
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <button
                            className="btn primary"
                            onClick={sendTestNotification}
                            disabled={sending || !smsEnabled}
                        >
                            {sending ? 'Yuborilmoqda...' : 'Test xabar yuborish'}
                        </button>
                        {!smsEnabled && (
                            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>
                                SMS sozlamalarni yoqing
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    tabs: {
        display: 'flex',
        gap: 8,
        marginTop: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 16,
        color: '#111827'
    },
    settingRow: {
        marginBottom: 20
    },
    label: {
        display: 'block',
        fontSize: 14,
        fontWeight: 500,
        marginBottom: 8,
        color: '#374151'
    },
    templateCard: {
        padding: 16,
        background: '#f9fafb',
        borderRadius: 8,
        marginBottom: 12,
        border: '1px solid #e5e7eb'
    },
    templateHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }
};
