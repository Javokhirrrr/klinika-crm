import { useState, useEffect } from 'react';
import { commissionAPI } from '../api/newFeatures';
import './Commissions.css';

export default function Commissions() {
    const [earnings, setEarnings] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadEarnings();
        loadHistory();
    }, [page, filter]);

    const loadEarnings = async () => {
        try {
            const { data } = await commissionAPI.getMyEarnings();
            setEarnings(data.earnings);
        } catch (err) {
            console.error('Load earnings error:', err);
        }
    };

    const loadHistory = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 20 };
            if (filter !== 'all') params.status = filter;

            const { data } = await commissionAPI.getMyHistory(params);
            setHistory(data.commissions);
            setTotal(data.pagination.total);
        } catch (err) {
            console.error('Load history error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString('uz-UZ') + ' so\'m';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('uz-UZ');
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Kutilmoqda', class: 'badge-warning' },
            approved: { text: 'Tasdiqlandi', class: 'badge-info' },
            paid: { text: 'To\'landi', class: 'badge-success' },
            cancelled: { text: 'Bekor qilindi', class: 'badge-danger' },
        };
        const badge = badges[status] || { text: status, class: 'badge-secondary' };
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    return (
        <div className="commissions-page">
            <div className="page-header">
                <h1>💰 Foizlar</h1>
                <p>Sizning daromadingiz va foizlar tarixi</p>
            </div>

            {/* Earnings Summary */}
            {earnings && (
                <div className="earnings-summary">
                    <div className="earnings-card pending">
                        <div className="earnings-icon">⏳</div>
                        <div className="earnings-info">
                            <div className="earnings-label">Kutilmoqda</div>
                            <div className="earnings-value">{formatCurrency(earnings.pending.amount)}</div>
                            <div className="earnings-count">{earnings.pending.count} ta</div>
                        </div>
                    </div>

                    <div className="earnings-card approved">
                        <div className="earnings-icon">✅</div>
                        <div className="earnings-info">
                            <div className="earnings-label">Tasdiqlandi</div>
                            <div className="earnings-value">{formatCurrency(earnings.approved.amount)}</div>
                            <div className="earnings-count">{earnings.approved.count} ta</div>
                        </div>
                    </div>

                    <div className="earnings-card paid">
                        <div className="earnings-icon">💵</div>
                        <div className="earnings-info">
                            <div className="earnings-label">To'landi</div>
                            <div className="earnings-value">{formatCurrency(earnings.paid.amount)}</div>
                            <div className="earnings-count">{earnings.paid.count} ta</div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Section */}
            <div className="history-section">
                <div className="history-header">
                    <h2>Foizlar tarixi</h2>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Hammasi
                        </button>
                        <button
                            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Kutilmoqda
                        </button>
                        <button
                            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                            onClick={() => setFilter('approved')}
                        >
                            Tasdiqlandi
                        </button>
                        <button
                            className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
                            onClick={() => setFilter('paid')}
                        >
                            To'landi
                        </button>
                    </div>
                </div>

                {loading && <div className="loading">Yuklanmoqda...</div>}

                {!loading && history.length === 0 && (
                    <p className="no-data">Foizlar tarixi yo'q</p>
                )}

                {!loading && history.length > 0 && (
                    <>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Sana</th>
                                        <th>Bemor</th>
                                        <th>Asosiy summa</th>
                                        <th>Foiz %</th>
                                        <th>Foiz summasi</th>
                                        <th>Holat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((comm) => (
                                        <tr key={comm._id}>
                                            <td>{formatDate(comm.createdAt)}</td>
                                            <td>
                                                {comm.patientId ?
                                                    `${comm.patientId.firstName} ${comm.patientId.lastName}` :
                                                    '-'
                                                }
                                            </td>
                                            <td>{formatCurrency(comm.baseAmount)}</td>
                                            <td>{comm.percentage}%</td>
                                            <td className="amount-highlight">{formatCurrency(comm.amount)}</td>
                                            <td>{getStatusBadge(comm.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {total > 20 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn btn-secondary"
                                >
                                    ← Oldingi
                                </button>
                                <span className="page-info">
                                    Sahifa {page} / {Math.ceil(total / 20)}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= Math.ceil(total / 20)}
                                    className="btn btn-secondary"
                                >
                                    Keyingi →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
