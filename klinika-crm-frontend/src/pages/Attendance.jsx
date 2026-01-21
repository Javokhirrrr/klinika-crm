import { useState, useEffect } from 'react';
import { attendanceAPI } from '../api/newFeatures';
import './Attendance.css';

export default function Attendance() {
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadTodayAttendance();
        loadHistory();
    }, [page]);

    const loadTodayAttendance = async () => {
        try {
            const { data } = await attendanceAPI.getMyToday();
            setTodayAttendance(data.attendance);
        } catch (err) {
            console.error('Load today error:', err);
        }
    };

    const loadHistory = async () => {
        try {
            setLoading(true);
            const { data } = await attendanceAPI.getMyHistory({ page, limit: 20 });
            setHistory(data.attendances);
            setTotal(data.pagination.total);
        } catch (err) {
            setError('Tarixni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await attendanceAPI.clockIn();
            setSuccess(data.message);
            setTodayAttendance(data.attendance);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await attendanceAPI.clockOut();
            setSuccess(data.message);
            setTodayAttendance(data.attendance);
            loadHistory(); // Refresh history
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('uz-UZ');
    };

    const getStatusBadge = (status) => {
        const badges = {
            on_time: { text: 'O\'z vaqtida', class: 'badge-success' },
            late: { text: 'Kechikdi', class: 'badge-warning' },
            working: { text: 'Ishda', class: 'badge-info' },
            absent: { text: 'Kelmadi', class: 'badge-danger' },
            half_day: { text: 'Yarim kun', class: 'badge-secondary' },
        };
        const badge = badges[status] || { text: status, class: 'badge-secondary' };
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    return (
        <div className="attendance-page">
            <div className="page-header">
                <h1>⏰ Davomat</h1>
                <p>Ishga kelish va ketish vaqtini belgilang</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Today's Status */}
            <div className="today-status-card">
                <h2>Bugungi holat</h2>
                {todayAttendance ? (
                    <div className="status-grid">
                        <div className="status-item">
                            <span className="label">Kelish vaqti:</span>
                            <span className="value">{formatTime(todayAttendance.clockIn)}</span>
                        </div>
                        <div className="status-item">
                            <span className="label">Ketish vaqti:</span>
                            <span className="value">{formatTime(todayAttendance.clockOut)}</span>
                        </div>
                        <div className="status-item">
                            <span className="label">Ish soati:</span>
                            <span className="value">{todayAttendance.workHours || 0} soat</span>
                        </div>
                        <div className="status-item">
                            <span className="label">Holat:</span>
                            <span className="value">{getStatusBadge(todayAttendance.status)}</span>
                        </div>
                        {todayAttendance.lateMinutes > 0 && (
                            <div className="status-item">
                                <span className="label">Kechikish:</span>
                                <span className="value text-warning">{todayAttendance.lateMinutes} daqiqa</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="no-data">Bugun hali ishga kelmagansiz</p>
                )}

                {/* Clock In/Out Buttons */}
                <div className="action-buttons">
                    {!todayAttendance ? (
                        <button
                            className="btn btn-primary btn-large"
                            onClick={handleClockIn}
                            disabled={loading}
                        >
                            🕐 Ishga kelish
                        </button>
                    ) : !todayAttendance.clockOut ? (
                        <button
                            className="btn btn-danger btn-large"
                            onClick={handleClockOut}
                            disabled={loading}
                        >
                            🏠 Ishdan ketish
                        </button>
                    ) : (
                        <div className="completed-message">
                            ✅ Bugungi ish kuni yakunlandi
                        </div>
                    )}
                </div>
            </div>

            {/* History Table */}
            <div className="history-section">
                <h2>Davomat tarixi</h2>
                {loading && <div className="loading">Yuklanmoqda...</div>}
                {!loading && history.length === 0 && (
                    <p className="no-data">Davomat tarixi yo'q</p>
                )}
                {!loading && history.length > 0 && (
                    <>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Sana</th>
                                        <th>Kelish</th>
                                        <th>Ketish</th>
                                        <th>Ish soati</th>
                                        <th>Holat</th>
                                        <th>Kechikish</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((att) => (
                                        <tr key={att._id}>
                                            <td>{formatDate(att.date)}</td>
                                            <td>{formatTime(att.clockIn)}</td>
                                            <td>{formatTime(att.clockOut)}</td>
                                            <td>{att.workHours ? `${att.workHours} soat` : '-'}</td>
                                            <td>{getStatusBadge(att.status)}</td>
                                            <td>
                                                {att.lateMinutes > 0 ? (
                                                    <span className="text-warning">{att.lateMinutes} daq</span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
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
