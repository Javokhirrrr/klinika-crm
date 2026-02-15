// src/pages/DoctorWallet.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../lib/http";

const fmtDT = (d) => (d ? new Date(d).toLocaleString() : "—");
const fmtMoney = (n) => Number(n || 0).toLocaleString();

export default function DoctorWallet() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [showBonus, setShowBonus] = useState(false);
    const [showPenalty, setShowPenalty] = useState(false);

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        loadAll();
    }, [id]);

    async function loadAll() {
        setLoading(true);
        try {
            const [docData, walletData, statsData, txData] = await Promise.all([
                http.get(`/doctors/${id}`),
                http.get(`/doctors/${id}/wallet`),
                http.get(`/doctors/${id}/wallet/stats`),
                http.get(`/doctors/${id}/wallet/transactions?limit=50`)
            ]);

            setDoctor(docData);
            setWallet(walletData);
            setStats(statsData);
            setTransactions(txData.items || []);
        } catch (err) {
            console.error(err);
            alert("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    }

    async function handleWithdrawal() {
        if (!amount || Number(amount) <= 0) {
            alert("To'g'ri summa kiriting");
            return;
        }

        setBusy(true);
        try {
            await http.post(`/doctors/${id}/wallet/withdrawal`, {
                amount: Number(amount),
                description
            });
            setShowWithdrawal(false);
            setAmount("");
            setDescription("");
            await loadAll();
        } catch (err) {
            alert(err?.response?.data?.message || "Xatolik");
        } finally {
            setBusy(false);
        }
    }

    async function handleBonus() {
        if (!amount || Number(amount) <= 0) {
            alert("To'g'ri summa kiriting");
            return;
        }

        setBusy(true);
        try {
            await http.post(`/doctors/${id}/wallet/bonus`, {
                amount: Number(amount),
                description
            });
            setShowBonus(false);
            setAmount("");
            setDescription("");
            await loadAll();
        } catch (err) {
            alert(err?.response?.data?.message || "Xatolik");
        } finally {
            setBusy(false);
        }
    }

    async function handlePenalty() {
        if (!amount || Number(amount) <= 0) {
            alert("To'g'ri summa kiriting");
            return;
        }

        setBusy(true);
        try {
            await http.post(`/doctors/${id}/wallet/penalty`, {
                amount: Number(amount),
                description
            });
            setShowPenalty(false);
            setAmount("");
            setDescription("");
            await loadAll();
        } catch (err) {
            alert(err?.response?.data?.message || "Xatolik");
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <div className="page">Yuklanmoqda...</div>;

    return (
        <div className="page">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button className="btn" onClick={() => navigate("/doctors")}>← Orqaga</button>
                <h1 style={{ margin: 0 }}>
                    {doctor?.firstName} {doctor?.lastName} - Hamyon
                </h1>
            </div>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
                <div className="card" style={{ padding: 16, background: "#10b981", color: "#fff" }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>Joriy Balans</div>
                    <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
                        {fmtMoney(wallet?.balance)} so'm
                    </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                    <div className="muted" style={{ fontSize: 14 }}>Jami Topgan</div>
                    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
                        {fmtMoney(wallet?.totalEarned)} so'm
                    </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                    <div className="muted" style={{ fontSize: 14 }}>Jami Yechib Olingan</div>
                    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
                        {fmtMoney(wallet?.totalWithdrawn)} so'm
                    </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                    <div className="muted" style={{ fontSize: 14 }}>Bonuslar</div>
                    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: "#10b981" }}>
                        +{fmtMoney(wallet?.totalBonus)} so'm
                    </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                    <div className="muted" style={{ fontSize: 14 }}>Jarimalar</div>
                    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: "#ef4444" }}>
                        -{fmtMoney(wallet?.totalPenalty)} so'm
                    </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                    <div className="muted" style={{ fontSize: 14 }}>Shu Oy</div>
                    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
                        {fmtMoney(stats?.currentMonthEarnings)} so'm
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button className="btn primary" onClick={() => setShowWithdrawal(true)}>
                        💸 Pul Yechish
                    </button>
                    <button className="btn" style={{ background: "#10b981", color: "#fff" }} onClick={() => setShowBonus(true)}>
                        🎁 Bonus Berish
                    </button>
                    <button className="btn danger" onClick={() => setShowPenalty(true)}>
                        ⚠️ Jarima Berish
                    </button>
                </div>
            </div>

            {/* Transactions */}
            <div className="card">
                <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ margin: 0 }}>Tranzaksiyalar Tarixi</h3>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Sana</th>
                                <th>Turi</th>
                                <th>Summa</th>
                                <th>Tavsif</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center" }}>
                                        Tranzaksiyalar yo'q
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx._id}>
                                        <td>{fmtDT(tx.createdAt)}</td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background:
                                                        tx.type === "earning"
                                                            ? "#10b981"
                                                            : tx.type === "bonus"
                                                                ? "#3b82f6"
                                                                : tx.type === "withdrawal"
                                                                    ? "#f59e0b"
                                                                    : "#ef4444"
                                                }}
                                            >
                                                {tx.type === "earning"
                                                    ? "Daromad"
                                                    : tx.type === "bonus"
                                                        ? "Bonus"
                                                        : tx.type === "withdrawal"
                                                            ? "Yechish"
                                                            : "Jarima"}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: tx.amount >= 0 ? "#10b981" : "#ef4444" }}>
                                            {tx.amount >= 0 ? "+" : ""}
                                            {fmtMoney(tx.amount)} so'm
                                        </td>
                                        <td>{tx.description || "—"}</td>
                                        <td>
                                            <span className={`badge ${tx.status === "completed" ? "success" : ""}`}>
                                                {tx.status === "completed" ? "Bajarildi" : tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {showWithdrawal && (
                <div className="modal-backdrop" onClick={() => setShowWithdrawal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Pul Yechish</h3>
                        <div style={{ marginTop: 16 }}>
                            <label className="muted">Summa (so'm)</label>
                            <input
                                className="input"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <label className="muted">Tavsif</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ixtiyoriy"
                            />
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                            <button className="btn" onClick={() => setShowWithdrawal(false)}>
                                Bekor qilish
                            </button>
                            <button className="btn primary" onClick={handleWithdrawal} disabled={busy}>
                                {busy ? "..." : "Yechish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bonus Modal */}
            {showBonus && (
                <div className="modal-backdrop" onClick={() => setShowBonus(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Bonus Berish</h3>
                        <div style={{ marginTop: 16 }}>
                            <label className="muted">Summa (so'm)</label>
                            <input
                                className="input"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <label className="muted">Tavsif</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Bonus sababi"
                            />
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                            <button className="btn" onClick={() => setShowBonus(false)}>
                                Bekor qilish
                            </button>
                            <button
                                className="btn"
                                style={{ background: "#10b981", color: "#fff" }}
                                onClick={handleBonus}
                                disabled={busy}
                            >
                                {busy ? "..." : "Bonus Berish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Penalty Modal */}
            {showPenalty && (
                <div className="modal-backdrop" onClick={() => setShowPenalty(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Jarima Berish</h3>
                        <div style={{ marginTop: 16 }}>
                            <label className="muted">Summa (so'm)</label>
                            <input
                                className="input"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <label className="muted">Tavsif</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Jarima sababi"
                                required
                            />
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                            <button className="btn" onClick={() => setShowPenalty(false)}>
                                Bekor qilish
                            </button>
                            <button className="btn danger" onClick={handlePenalty} disabled={busy}>
                                {busy ? "..." : "Jarima Berish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
