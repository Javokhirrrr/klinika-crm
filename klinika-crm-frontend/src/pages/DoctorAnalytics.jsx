// src/pages/DoctorAnalytics.jsx
import { useEffect, useState } from "react";
import http from "../lib/http";

const fmtMoney = (n) => Number(n || 0).toLocaleString();

export default function DoctorAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const params = {};
            if (from) params.from = from;
            if (to) params.to = to;

            const result = await http.get("/analytics/doctors", params);
            setData(result);
        } catch (err) {
            console.error(err);
            alert("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="page">Yuklanmoqda...</div>;

    return (
        <div className="page">
            <h1>Shifokorlar Analitikasi</h1>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="row" style={{ gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                        <label className="muted">Dan</label>
                        <input
                            className="input"
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="muted">Gacha</label>
                        <input
                            className="input"
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>
                    <button className="btn primary" onClick={load} style={{ marginTop: 20 }}>
                        Qo'llash
                    </button>
                    <button
                        className="btn"
                        onClick={() => {
                            setFrom("");
                            setTo("");
                        }}
                        style={{ marginTop: 20 }}
                    >
                        Tozalash
                    </button>
                </div>
            </div>

            {/* Top Doctors */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ margin: 0 }}>🏆 Top Shifokorlar (Qabullar bo'yicha)</h3>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Shifokor</th>
                                <th>Mutaxassislik</th>
                                <th>Qabullar</th>
                                <th>Daromad</th>
                                <th>Reyting</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data?.topDoctors || data.topDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center" }}>
                                        Ma'lumot yo'q
                                    </td>
                                </tr>
                            ) : (
                                data.topDoctors.map((item, idx) => (
                                    <tr key={item.doctor?._id || idx}>
                                        <td style={{ fontWeight: 700, fontSize: 18 }}>
                                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>
                                            {item.doctor?.firstName} {item.doctor?.lastName}
                                        </td>
                                        <td>{item.doctor?.spec || "—"}</td>
                                        <td style={{ fontWeight: 700, color: "#3b82f6" }}>
                                            {item.appointmentCount}
                                        </td>
                                        <td style={{ fontWeight: 700, color: "#10b981" }}>
                                            {fmtMoney(item.totalRevenue)} so'm
                                        </td>
                                        <td>
                                            <span style={{ color: "#f59e0b" }}>
                                                ⭐ {Number(item.doctor?.rating || 0).toFixed(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Department Stats */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ margin: 0 }}>🏥 Bo'limlar Statistikasi</h3>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Bo'lim</th>
                                <th>Shifokorlar Soni</th>
                                <th>O'rtacha Reyting</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data?.departmentStats || data.departmentStats.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: "center" }}>
                                        Ma'lumot yo'q
                                    </td>
                                </tr>
                            ) : (
                                data.departmentStats.map((dept, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 600 }}>{dept._id || "Noma'lum"}</td>
                                        <td>{dept.doctorCount}</td>
                                        <td>
                                            <span style={{ color: "#f59e0b" }}>
                                                ⭐ {Number(dept.avgRating || 0).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status Distribution */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ margin: 0 }}>📊 Shifokorlar Holati</h3>
                </div>

                <div style={{ padding: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
                        {!data?.statusDistribution || data.statusDistribution.length === 0 ? (
                            <div>Ma'lumot yo'q</div>
                        ) : (
                            data.statusDistribution.map((status, idx) => {
                                const statusMap = {
                                    available: { label: "Bo'sh", color: "#10b981", icon: "✅" },
                                    busy: { label: "Band", color: "#ef4444", icon: "🔴" },
                                    break: { label: "Tanaffus", color: "#f59e0b", icon: "☕" },
                                    offline: { label: "Offline", color: "#6b7280", icon: "⚫" }
                                };

                                const info = statusMap[status._id] || { label: status._id, color: "#3b82f6", icon: "📍" };

                                return (
                                    <div
                                        key={idx}
                                        className="card"
                                        style={{
                                            padding: 16,
                                            background: info.color,
                                            color: "#fff",
                                            textAlign: "center"
                                        }}
                                    >
                                        <div style={{ fontSize: 32 }}>{info.icon}</div>
                                        <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>{info.label}</div>
                                        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
                                            {status.count}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Specialization Stats */}
            <div className="card">
                <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ margin: 0 }}>🩺 Mutaxassisliklar</h3>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Mutaxassislik</th>
                                <th>Shifokorlar Soni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data?.specializationStats || data.specializationStats.length === 0 ? (
                                <tr>
                                    <td colSpan={2} style={{ textAlign: "center" }}>
                                        Ma'lumot yo'q
                                    </td>
                                </tr>
                            ) : (
                                data.specializationStats.map((spec, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 600 }}>{spec._id || "Noma'lum"}</td>
                                        <td>
                                            <span className="badge primary">{spec.count}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
