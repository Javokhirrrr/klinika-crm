// src/pages/DoctorStatusBoard.jsx
import { useEffect, useState } from "react";
import http from "../lib/http";

export default function DoctorStatusBoard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        load();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            if (autoRefresh) {
                load();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    async function load() {
        try {
            const result = await http.get("/doctors/status/all");
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function changeStatus(doctorId, newStatus) {
        try {
            await http.patch(`/doctors/${doctorId}/status`, { status: newStatus });
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || "Xatolik");
        }
    }

    if (loading) return <div className="page">Yuklanmoqda...</div>;

    const statusConfig = {
        available: { label: "Bo'sh", color: "#86efac", icon: "✅" },      // Soft green
        busy: { label: "Band", color: "#fca5a5", icon: "🔴" },           // Soft red
        break: { label: "Tanaffus", color: "#fcd34d", icon: "☕" },      // Soft yellow
        offline: { label: "Offline", color: "#cbd5e1", icon: "⚫" }      // Soft gray
    };

    return (
        <div className="page">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <h1 style={{ margin: 0 }}>Shifokorlar Holati</h1>
                <span className="muted">({data?.total || 0})</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        <span className="muted">Avtomatik yangilanish (10s)</span>
                    </label>
                    <button className="btn" onClick={load}>
                        🔄 Yangilash
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
                {Object.entries(statusConfig).map(([status, config]) => {
                    const count = data?.grouped?.[status]?.length || 0;
                    return (
                        <div
                            key={status}
                            className="card"
                            style={{
                                padding: 16,
                                background: config.color,
                                color: "#fff",
                                textAlign: "center"
                            }}
                        >
                            <div style={{ fontSize: 32 }}>{config.icon}</div>
                            <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>{config.label}</div>
                            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{count}</div>
                        </div>
                    );
                })}
            </div>

            {/* Status Groups */}
            {Object.entries(statusConfig).map(([status, config]) => {
                const doctors = data?.grouped?.[status] || [];
                if (doctors.length === 0) return null;

                return (
                    <div key={status} className="card" style={{ marginBottom: 20 }}>
                        <div
                            style={{
                                padding: 16,
                                borderBottom: "1px solid #e5e7eb",
                                background: config.color,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                gap: 12
                            }}
                        >
                            <span style={{ fontSize: 24 }}>{config.icon}</span>
                            <h3 style={{ margin: 0 }}>{config.label}</h3>
                            <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 700 }}>
                                {doctors.length}
                            </span>
                        </div>

                        <div style={{ padding: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                                {doctors.map((doc) => (
                                    <div
                                        key={doc._id}
                                        className="card"
                                        style={{
                                            padding: 16,
                                            border: `2px solid ${config.color}`,
                                            background: "#fff"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                            <div
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: "50%",
                                                    background: config.color,
                                                    color: "#fff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 20,
                                                    fontWeight: 700
                                                }}
                                            >
                                                {doc.firstName?.[0]}
                                                {doc.lastName?.[0]}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: 16 }}>
                                                    {doc.firstName} {doc.lastName}
                                                </div>
                                                <div className="muted" style={{ fontSize: 13 }}>
                                                    {doc.spec || "Mutaxassislik yo'q"}
                                                </div>
                                            </div>
                                        </div>

                                        {doc.departmentName && (
                                            <div style={{ fontSize: 13, marginBottom: 8 }}>
                                                <span className="muted">Bo'lim:</span> {doc.departmentName}
                                            </div>
                                        )}

                                        {doc.room && (
                                            <div style={{ fontSize: 13, marginBottom: 8 }}>
                                                <span className="muted">Kabinet:</span> {doc.room}
                                            </div>
                                        )}

                                        {doc.currentPatientId && (
                                            <div style={{ fontSize: 13, marginBottom: 8, color: "#ef4444" }}>
                                                <span className="muted">Bemor:</span>{" "}
                                                {doc.currentPatientId.firstName} {doc.currentPatientId.lastName}
                                            </div>
                                        )}

                                        {doc.lastStatusUpdate && (
                                            <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                                                Yangilangan: {new Date(doc.lastStatusUpdate).toLocaleTimeString()}
                                            </div>
                                        )}

                                        {/* Status Change Buttons */}
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {Object.entries(statusConfig).map(([newStatus, newConfig]) => {
                                                if (newStatus === status) return null;
                                                return (
                                                    <button
                                                        key={newStatus}
                                                        className="btn"
                                                        style={{
                                                            fontSize: 12,
                                                            padding: "4px 8px",
                                                            background: newConfig.color,
                                                            color: "#fff",
                                                            border: "none"
                                                        }}
                                                        onClick={() => changeStatus(doc._id, newStatus)}
                                                    >
                                                        {newConfig.icon} {newConfig.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}

            {data?.total === 0 && (
                <div className="card" style={{ padding: 40, textAlign: "center" }}>
                    <div className="muted">Shifokorlar topilmadi</div>
                </div>
            )}
        </div>
    );
}
