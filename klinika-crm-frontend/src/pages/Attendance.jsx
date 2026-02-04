import { useState, useEffect } from 'react';
import { FiClock, FiLogIn, FiLogOut, FiCalendar, FiCheckCircle, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
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
    const [stats, setStats] = useState({ totalDays: 0, onTime: 0, late: 0, avgHours: 0 });

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

            // Calculate stats
            const totalDays = data.attendances.length;
            const onTime = data.attendances.filter(a => a.status === 'on_time').length;
            const late = data.attendances.filter(a => a.status === 'late').length;
            const avgHours = data.attendances.reduce((sum, a) => sum + (a.workHours || 0), 0) / totalDays || 0;

            setStats({ totalDays, onTime, late, avgHours: avgHours.toFixed(1) });
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
        return new Date(date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDuration = (minutes) => {
        if (!minutes || minutes === 0) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}s ${mins}daq`;
        if (hours > 0) return `${hours} soat`;
        return `${mins} daq`;
    };

    const getStatusBadge = (status) => {
        const badges = {
            on_time: { text: 'O\'z vaqtida', class: 'status-success', icon: <FiCheckCircle /> },
            late: { text: 'Kechikdi', class: 'status-warning', icon: <FiAlertCircle /> },
            working: { text: 'Ishda', class: 'status-info', icon: <FiClock /> },
            absent: { text: 'Kelmadi', class: 'status-danger', icon: <FiAlertCircle /> },
            half_day: { text: 'Yarim kun', class: 'status-secondary', icon: <FiClock /> },
        };
        const badge = badges[status] || { text: status, class: 'status-secondary', icon: <FiClock /> };
        return (
            <span className={`status-badge ${badge.class}`}>
                {badge.icon}
                <span>{badge.text}</span>
            </span>
        );
    };

    return (
        <div className="attendance-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <FiClock />
                    </div>
                    <div>
                        <h1>Davomat Tizimi</h1>
                        <p>Ishga kelish va ketish vaqtini belgilang</p>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error">
                    <FiAlertCircle />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="alert alert-success">
                    <FiCheckCircle />
                    <span>{success}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-primary">
                        <FiCalendar />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Jami kunlar</div>
                        <div className="stat-value">{stats.totalDays}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-success">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">O'z vaqtida</div>
                        <div className="stat-value">{stats.onTime}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-warning">
                        <FiAlertCircle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Kechikish</div>
                        <div className="stat-value">{stats.late}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-info">
                        <FiTrendingUp />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">O'rtacha ish soati</div>
                        <div className="stat-value">{stats.avgHours}s</div>
                    </div>
                </div>
            </div>

            {/* Today's Status */}
            <div className="today-card">
                <div className="card-header">
                    <h2>Bugungi Holat</h2>
                    <div className="current-time">
                        {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {todayAttendance ? (
                    <div className="today-content">
                        <div className="time-display-grid">
                            <div className="time-display">
                                <div className="time-icon clock-in">
                                    <FiLogIn />
                                </div>
                                <div className="time-info">
                                    <div className="time-label">Kelish vaqti</div>
                                    <div className="time-value">{formatTime(todayAttendance.clockIn)}</div>
                                </div>
                            </div>

                            <div className="time-display">
                                <div className="time-icon clock-out">
                                    <FiLogOut />
                                </div>
                                <div className="time-info">
                                    <div className="time-label">Ketish vaqti</div>
                                    <div className="time-value">{formatTime(todayAttendance.clockOut)}</div>
                                </div>
                            </div>

                            <div className="time-display">
                                <div className="time-icon work-hours">
                                    <FiClock />
                                </div>
                                <div className="time-info">
                                    <div className="time-label">Ish soati</div>
                                    <div className="time-value">{todayAttendance.workHours || 0} soat</div>
                                </div>
                            </div>

                            <div className="time-display">
                                <div className="time-icon status">
                                    <FiCheckCircle />
                                </div>
                                <div className="time-info">
                                    <div className="time-label">Holat</div>
                                    <div className="time-value">{getStatusBadge(todayAttendance.status)}</div>
                                </div>
                            </div>
                        </div>

                        {todayAttendance.lateMinutes > 0 && (
                            <div className="late-notice">
                                <FiAlertCircle />
                                <span>Kechikish: <strong>{todayAttendance.lateMinutes} daqiqa</strong></span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="no-attendance">
                        <FiClock className="no-attendance-icon" />
                        <p>Bugun hali ishga kelmagansiz</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="action-section">
                    {!todayAttendance ? (
                        <button
                            className="action-btn btn-clock-in"
                            onClick={handleClockIn}
                            disabled={loading}
                        >
                            <FiLogIn />
                            <span>Ishga Kelish</span>
                        </button>
                    ) : !todayAttendance.clockOut ? (
                        <button
                            className="action-btn btn-clock-out"
                            onClick={handleClockOut}
                            disabled={loading}
                        >
                            <FiLogOut />
                            <span>Ishdan Ketish</span>
                        </button>
                    ) : (
                        <div className="completed-badge">
                            <FiCheckCircle />
                            <span>Bugungi ish kuni yakunlandi</span>
                        </div>
                    )}
                </div>
            </div>

            {/* History Table */}
            <div className="history-card">
                <div className="card-header">
                    <h2>Davomat Tarixi</h2>
                    <div className="total-badge">Jami: {total}</div>
                </div>

                {loading && <div className="loading-spinner">Yuklanmoqda...</div>}

                {!loading && history.length === 0 && (
                    <div className="no-data">
                        <FiCalendar className="no-data-icon" />
                        <p>Davomat tarixi yo'q</p>
                    </div>
                )}

                {!loading && history.length > 0 && (
                    <>
                        <div className="table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>SANA</th>
                                        <th>KELISH</th>
                                        <th>KETISH</th>
                                        <th>ISH SOATI</th>
                                        <th>HOLAT</th>
                                        <th>KECHIKISH</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((att) => (
                                        <tr key={att._id}>
                                            <td>
                                                <div className="date-cell">
                                                    <FiCalendar />
                                                    <span>{formatDate(att.date)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="time-cell clock-in">
                                                    {formatTime(att.clockIn)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="time-cell clock-out">
                                                    {formatTime(att.clockOut)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="hours-cell">
                                                    {att.workHours ? `${att.workHours} soat` : '-'}
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(att.status)}</td>
                                            <td>
                                                {att.lateMinutes && att.lateMinutes > 0 ? (
                                                    <span className="late-badge">
                                                        {formatDuration(att.lateMinutes)}
                                                    </span>
                                                ) : (
                                                    <span className="on-time-badge">-</span>
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
                                    className="pagination-btn"
                                >
                                    ← Oldingi
                                </button>
                                <span className="page-indicator">
                                    Sahifa <strong>{page}</strong> / {Math.ceil(total / 20)}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= Math.ceil(total / 20)}
                                    className="pagination-btn"
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
