import { useState, useEffect } from 'react';
import { FiClock, FiLogIn, FiLogOut, FiCalendar } from 'react-icons/fi';
import { attendanceAPI } from '../api/newFeatures';
import '../styles/simple-pages.css';

export default function SimpleAttendance() {
    const [todayRecord, setTodayRecord] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const res = await attendanceAPI.getMy();
            const records = res.data || [];

            const today = new Date().toISOString().split('T')[0];
            const todayRec = records.find(r => r.date?.startsWith(today));

            setTodayRecord(todayRec);
            setHistory(records.slice(0, 10));
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            await attendanceAPI.checkIn();
            loadAttendance();
        } catch (error) {
            console.error('Check-in error:', error);
        }
    };

    const handleCheckOut = async () => {
        try {
            await attendanceAPI.checkOut();
            loadAttendance();
        } catch (error) {
            console.error('Check-out error:', error);
        }
    };

    const formatTime = (date) => {
        if (!date) return '--:--';
        return new Date(date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '0s 0daq';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}s ${mins}daq`;
    };

    return (
        <div className="simple-page">
            <div className="page-header">
                <div>
                    <h1>Davomat</h1>
                    <p className="text-muted">{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Today's Status */}
                <div className="simple-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                            {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                                Kelish
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                                {formatTime(todayRecord?.checkIn)}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                                Ketish
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                                {formatTime(todayRecord?.checkOut)}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button
                            className="btn btn-success btn-lg"
                            onClick={handleCheckIn}
                            disabled={todayRecord?.checkIn}
                        >
                            <FiLogIn />
                            KELISH
                        </button>
                        <button
                            className="btn btn-danger btn-lg"
                            onClick={handleCheckOut}
                            disabled={!todayRecord?.checkIn || todayRecord?.checkOut}
                        >
                            <FiLogOut />
                            KETISH
                        </button>
                    </div>
                </div>

                {/* History */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Tarix</h2>
                {loading ? (
                    <div className="loading-state">Yuklanmoqda...</div>
                ) : history.length === 0 ? (
                    <div className="empty-state">
                        <FiClock size={64} />
                        <p>Tarix yo'q</p>
                    </div>
                ) : (
                    <div className="simple-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>SANA</th>
                                    <th>KELISH</th>
                                    <th>KETISH</th>
                                    <th>ISH SOATI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record) => (
                                    <tr key={record._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FiCalendar size={16} />
                                                {new Date(record.date).toLocaleDateString('uz-UZ')}
                                            </div>
                                        </td>
                                        <td>{formatTime(record.checkIn)}</td>
                                        <td>{formatTime(record.checkOut)}</td>
                                        <td>{formatDuration(record.workMinutes)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
