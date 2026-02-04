import { useState, useEffect } from 'react';
import { FiDollarSign, FiCalendar } from 'react-icons/fi';
import http from '../lib/http';
import '../styles/simple-pages.css';

export default function SimpleSalaries() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const res = await http.get('/users');
            setEmployees(res.items || res || []);
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
                    <h1>Maoshlar</h1>
                    <p className="text-muted">Xodimlar maoshlari</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Yuklanmoqda...</div>
            ) : employees.length === 0 ? (
                <div className="empty-state">
                    <FiDollarSign size={64} />
                    <p>Xodimlar yo'q</p>
                </div>
            ) : (
                <div className="simple-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ISM</th>
                                <th>ROL</th>
                                <th>MAOSH</th>
                                <th>HOLAT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            {emp.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-info">
                                            {emp.role === 'doctor' ? 'Shifokor' :
                                                emp.role === 'reception' ? 'Qabulxona' :
                                                    emp.role === 'accountant' ? 'Buxgalter' :
                                                        emp.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                                            {emp.salary?.toLocaleString() || '0'} so'm
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-success">To'landi</span>
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
