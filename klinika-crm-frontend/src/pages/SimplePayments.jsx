import { useState, useEffect } from 'react';
import { FiPlus, FiDollarSign, FiCreditCard, FiPrinter, FiCalendar } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/simple-pages.css';

export default function SimplePayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({ today: 0, total: 0 });

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const res = await http.get('/payments');
            const items = res.items || res || [];
            setPayments(items);

            const today = new Date().toISOString().split('T')[0];
            const todayTotal = items
                .filter(p => p.createdAt?.startsWith(today))
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            const total = items.reduce((sum, p) => sum + (p.amount || 0), 0);

            setStats({ today: todayTotal, total });
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="simple-page">
            <div className="page-header">
                <div>
                    <h1>To'lovlar</h1>
                    <p className="text-muted">Jami: {payments.length} ta to'lov</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                    <FiPlus />
                    Yangi To'lov
                </button>
            </div>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon success">
                        <FiDollarSign />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Bugungi Tushum</div>
                        <div className="stat-value">{(stats.today / 1000).toFixed(0)}K</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <FiDollarSign />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Jami Tushum</div>
                        <div className="stat-value">{(stats.total / 1000).toFixed(0)}K</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Yuklanmoqda...</div>
            ) : payments.length === 0 ? (
                <div className="empty-state">
                    <FiDollarSign size={64} />
                    <p>To'lovlar yo'q</p>
                </div>
            ) : (
                <div className="simple-table">
                    <table>
                        <thead>
                            <tr>
                                <th>SANA</th>
                                <th>BEMOR</th>
                                <th>SUMMA</th>
                                <th>USUL</th>
                                <th>AMALLAR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FiCalendar size={16} />
                                            {new Date(payment.createdAt).toLocaleDateString('uz-UZ')}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            {payment.patientId?.firstName} {payment.patientId?.lastName}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                                            {payment.amount?.toLocaleString()} so'm
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${payment.method === 'cash' ? 'badge-success' : 'badge-info'}`}>
                                            {payment.method === 'cash' ? 'Naqd' : 'Karta'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="action-btn primary" title="Check">
                                            <FiPrinter />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
