// src/pages/Salaries.jsx
import { useState, useEffect } from 'react';
import http from '../lib/http';
import './Salaries.css';

const roleNames = {
    owner: 'Direktor',
    admin: 'Admin',
    reception: 'Qabulxona',
    doctor: 'Shifokor',
    accountant: 'Buxgalter',
    nurse: 'Hamshira'
};

export default function Salaries() {
    const [month, setMonth] = useState('');
    const [salaries, setSalaries] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        baseSalary: 0,
        kpiBonus: 0,
        kpiCriteria: '',
        commissionRate: 0,
        commissionEnabled: false
    });

    // Initialize with current month
    useEffect(() => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setMonth(currentMonth);
    }, []);

    // Load data when month changes
    useEffect(() => {
        if (month) {
            loadData();
        }
    }, [month]);

    async function loadData() {
        setLoading(true);
        try {
            const [salariesData, summaryData] = await Promise.all([
                http.get('/salaries', { month }),
                http.get('/salaries/summary', { month })
            ]);
            setSalaries(salariesData.salaries || []);
            setSummary(summaryData.summary || null);
        } catch (e) {
            console.error('Load error:', e);
            alert(e?.message || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    }

    function openEdit(salary) {
        setEditingUser(salary);
        setEditForm({
            baseSalary: salary.baseSalary || 0,
            kpiBonus: salary.kpiBonus || 0,
            kpiCriteria: salary.kpiCriteria || '',
            commissionRate: salary.commissionRate || 0,
            commissionEnabled: salary.role === 'doctor' && salary.commissionRate > 0
        });
    }

    async function saveEdit() {
        if (!editingUser) return;

        try {
            await http.put(`/salaries/${editingUser.userId}`, editForm);
            setEditingUser(null);
            await loadData();
            alert('✅ Saqlandi!');
        } catch (e) {
            console.error('Save error:', e);
            alert(e?.message || 'Saqlashda xatolik');
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
    };

    return (
        <div className="page salaries-page">
            <div className="page-header">
                <h1>💰 Oylik Maoshlar</h1>
                <div className="header-actions">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="month-selector"
                    />
                    <button onClick={loadData} disabled={loading} className="btn btn-primary">
                        {loading ? '⏳ Yuklanmoqda...' : '🔄 Yangilash'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="summary-cards">
                    <div className="summary-card">
                        <div className="card-icon">👥</div>
                        <div className="card-content">
                            <div className="card-label">Xodimlar soni</div>
                            <div className="card-value">{summary.employeeCount}</div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="card-icon">💵</div>
                        <div className="card-content">
                            <div className="card-label">Fix oyliklar</div>
                            <div className="card-value">{formatCurrency(summary.totalBaseSalary)}</div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="card-icon">🎯</div>
                        <div className="card-content">
                            <div className="card-label">KPI bonuslari</div>
                            <div className="card-value">{formatCurrency(summary.totalKpiBonus)}</div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="card-icon">💰</div>
                        <div className="card-content">
                            <div className="card-label">Foizlar</div>
                            <div className="card-value">{formatCurrency(summary.totalCommission)}</div>
                        </div>
                    </div>

                    <div className="summary-card total">
                        <div className="card-icon">📊</div>
                        <div className="card-content">
                            <div className="card-label">JAMI XARAJAT</div>
                            <div className="card-value total-value">{formatCurrency(summary.totalSalary)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Salaries Table */}
            <div className="card">
                <div className="table-wrapper">
                    <table className="table salaries-table">
                        <thead>
                            <tr>
                                <th>Xodim</th>
                                <th>Lavozim</th>
                                <th>Fix oylik</th>
                                <th>KPI bonus</th>
                                <th>Foiz</th>
                                <th>Ish kunlari</th>
                                <th className="total-column">JAMI</th>
                                <th>Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaries.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                        {loading ? '⏳ Yuklanmoqda...' : '📭 Ma\'lumot topilmadi'}
                                    </td>
                                </tr>
                            ) : (
                                salaries.map((salary) => (
                                    <tr key={salary.userId}>
                                        <td>
                                            <div className="employee-info">
                                                <div className="employee-name">{salary.name}</div>
                                                <div className="employee-email">{salary.email}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge role-${salary.role}`}>
                                                {roleNames[salary.role] || salary.role}
                                            </span>
                                        </td>
                                        <td className="currency">{formatCurrency(salary.baseSalary)}</td>
                                        <td className="currency">
                                            {formatCurrency(salary.kpiBonus)}
                                            {salary.kpiCriteria && (
                                                <div className="kpi-criteria" title={salary.kpiCriteria}>
                                                    📋 {salary.kpiCriteria}
                                                </div>
                                            )}
                                        </td>
                                        <td className="currency">
                                            {salary.role === 'doctor' ? (
                                                <>
                                                    {formatCurrency(salary.commission)}
                                                    {salary.commissionRate > 0 && (
                                                        <div className="commission-rate">({salary.commissionRate}%)</div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="attendance-info">
                                                <span className="work-days">{salary.workDays}</span>
                                                <span className="text-muted">/ {salary.expectedWorkDays}</span>
                                            </div>
                                        </td>
                                        <td className="currency total-column">
                                            <strong>{formatCurrency(salary.totalSalary)}</strong>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => openEdit(salary)}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                ✏️ Tahrirlash
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>✏️ Maosh sozlamalari</h2>
                            <button onClick={() => setEditingUser(null)} className="close-btn">✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="employee-header">
                                <h3>{editingUser.name}</h3>
                                <p className="text-muted">{roleNames[editingUser.role]} • {editingUser.email}</p>
                            </div>

                            <div className="form-group">
                                <label>💵 Fix oylik maosh</label>
                                <input
                                    type="number"
                                    value={editForm.baseSalary}
                                    onChange={(e) => setEditForm({ ...editForm, baseSalary: Number(e.target.value) })}
                                    className="form-control"
                                    placeholder="0"
                                    min="0"
                                    step="100000"
                                />
                            </div>

                            <div className="form-group">
                                <label>🎯 KPI bonusi</label>
                                <input
                                    type="number"
                                    value={editForm.kpiBonus}
                                    onChange={(e) => setEditForm({ ...editForm, kpiBonus: Number(e.target.value) })}
                                    className="form-control"
                                    placeholder="0"
                                    min="0"
                                    step="50000"
                                />
                            </div>

                            <div className="form-group">
                                <label>📋 KPI mezonlari</label>
                                <textarea
                                    value={editForm.kpiCriteria}
                                    onChange={(e) => setEditForm({ ...editForm, kpiCriteria: e.target.value })}
                                    className="form-control"
                                    placeholder="Masalan: 300 ta bemor qabul qilish"
                                    rows="2"
                                />
                            </div>

                            {editingUser.role === 'doctor' && (
                                <>
                                    <div className="form-group">
                                        <label>💰 Foiz stavkasi (%)</label>
                                        <input
                                            type="number"
                                            value={editForm.commissionRate}
                                            onChange={(e) => setEditForm({ ...editForm, commissionRate: Number(e.target.value) })}
                                            className="form-control"
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                            step="5"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={editForm.commissionEnabled}
                                                onChange={(e) => setEditForm({ ...editForm, commissionEnabled: e.target.checked })}
                                            />
                                            <span>Foizni yoqish</span>
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setEditingUser(null)} className="btn btn-secondary">
                                ❌ Bekor qilish
                            </button>
                            <button onClick={saveEdit} className="btn btn-primary">
                                ✅ Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
