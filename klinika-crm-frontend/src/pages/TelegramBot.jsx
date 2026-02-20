import { useState, useEffect } from "react";
import http from "../lib/http";

/* ─── Telegram SVG Icon ─────────────────────────────────────────── */
const TelegramIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);
const PlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
    </svg>
);
const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
);
const CopyIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);
const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);
const LinkIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);
const CheckIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/* ─── Helper ────────────────────────────────────────────────────── */
const fmtDate = (s) => {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" });
};

/* ─── Main Component ────────────────────────────────────────────── */
export default function TelegramBot() {
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [token, setToken] = useState("");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");
    const [deleting, setDeleting] = useState(null);
    const [copied, setCopied] = useState("");

    // Broadcast message
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadMsg, setBroadMsg] = useState("");
    const [sending, setSending] = useState(false);

    // Stats (from patients with telegramChatId)
    const [stats, setStats] = useState({ linked: 0, total: 0 });

    useEffect(() => { loadBots(); loadStats(); }, []);

    const loadBots = async () => {
        setLoading(true);
        try {
            const res = await http.get("/bots");
            setBots(res.items || res || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadStats = async () => {
        try {
            const [linked, total] = await Promise.all([
                http.get("/patients", { params: { hasTelegram: true, limit: 1 } }).catch(() => ({ total: 0 })),
                http.get("/patients", { params: { limit: 1 } }).catch(() => ({ total: 0 })),
            ]);
            setStats({ linked: linked.total || 0, total: total.total || 0 });
        } catch { }
    };

    const handleAdd = async () => {
        if (!token.trim()) { setAddError("Token kiritilmagan"); return; }
        setAdding(true); setAddError("");
        try {
            await http.post("/bots", { token: token.trim() });
            setToken(""); setShowAdd(false);
            loadBots();
        } catch (e) {
            setAddError(e?.message || "Xatolik. Token noto'g'ri bo'lishi mumkin.");
        } finally { setAdding(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Botni o'chirishni tasdiqlaysizmi?")) return;
        setDeleting(id);
        try {
            await http.del(`/bots/${id}`);
            setBots(prev => prev.filter(b => b._id !== id));
        } catch (e) { alert("O'chirishda xatolik: " + (e?.message || "")); }
        finally { setDeleting(null); }
    };

    const copyLink = (username) => {
        const link = `https://t.me/${username}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(username);
            setTimeout(() => setCopied(""), 2000);
        });
    };

    const handleBroadcast = async () => {
        if (!broadMsg.trim()) return;
        setSending(true);
        try {
            await http.post("/bots/broadcast", { message: broadMsg });
            setBroadMsg(""); setShowBroadcast(false);
            alert("Xabar muvaffaqiyatli yuborildi!");
        } catch (e) {
            alert("Xabar yuborishda xatolik: " + (e?.message || ""));
        } finally { setSending(false); }
    };

    const activeBots = bots.filter(b => b.isActive);

    return (
        <div style={S.page}>

            {/* ── Page Header ─────────────────────────────────────────── */}
            <div style={S.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={S.telegramGradient}>
                        <TelegramIcon size={28} />
                    </div>
                    <div>
                        <h1 style={S.title}>Telegram Bot</h1>
                        <p style={S.subtitle}>Bot boshqaruvi va bildirishnomalar</p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button style={S.btnOutline} onClick={loadBots}>
                        <RefreshIcon /> Yangilash
                    </button>
                    {activeBots.length > 0 && (
                        <button style={{ ...S.btnOutline, borderColor: "#2563eb", color: "#2563eb" }} onClick={() => setShowBroadcast(true)}>
                            <SendIcon /> Ommaviy xabar
                        </button>
                    )}
                    <button style={S.btnPrimary} onClick={() => setShowAdd(true)}>
                        <PlusIcon /> Bot qo'shish
                    </button>
                </div>
            </div>

            {/* ── Stats Row ───────────────────────────────────────────── */}
            <div style={S.statsRow}>
                {[
                    {
                        icon: "🤖", label: "Faol botlar",
                        value: String(activeBots.length),
                        sub: `${bots.length} ta jami`,
                        grad: "linear-gradient(135deg,#0088cc,#229ED9)",
                    },
                    {
                        icon: "👤", label: "Ulangan foydalanuvchilar",
                        value: String(stats.linked),
                        sub: `${stats.total} ta bemordan`,
                        grad: "linear-gradient(135deg,#667eea,#764ba2)",
                    },
                    {
                        icon: "📨", label: "Bot imkoniyatlari",
                        value: "3 ta",
                        sub: "Qabul, navbat, tarix",
                        grad: "linear-gradient(135deg,#43e97b,#38f9d7)",
                    },
                    {
                        icon: "🔔", label: "Bildirishnoma turlari",
                        value: "5 ta",
                        sub: "Avtomatik yuboriladi",
                        grad: "linear-gradient(135deg,#fa709a,#fee140)",
                    },
                ].map((s, i) => (
                    <div key={i} style={S.statCard}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                    >
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: s.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                            {s.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{s.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── How It Works ─────────────────────────────────────────── */}
            <div style={S.card}>
                <div style={S.cardHeader}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>📖 Qanday ishlaydi?</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, padding: "16px 20px" }}>
                    {[
                        { step: "1", icon: "🤖", title: "Bot yarating", desc: "@BotFather orqali bot oching va tokenni nusxa oling" },
                        { step: "2", icon: "➕", title: "Tokenni qo'shing", desc: "\"Bot qo'shish\" tugmasi orqali tokenni kiriting" },
                        { step: "3", icon: "👥", title: "Bemorlar ulaning", desc: "Bemorlar bot orqali ro'yxatdan o'tadi" },
                        { step: "4", icon: "📩", title: "Avtomatik xabarlar", desc: "Qabul, navbat haqida bildirishnomalar jo'natiladi" },
                    ].map(s => (
                        <div key={s.step} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 10px", borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#0088cc,#229ED9)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, marginBottom: 10 }}>{s.step}</div>
                            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Bot List ─────────────────────────────────────────────── */}
            <div style={S.card}>
                <div style={S.cardHeader}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                        🤖 Botlar ro'yxati
                        <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 20, background: "#f1f5f9", fontSize: 13, fontWeight: 700, color: "#64748b" }}>{bots.length}</span>
                    </span>
                </div>

                {loading ? (
                    <div style={{ padding: "48px", textAlign: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0088cc", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
                        <div style={{ color: "#94a3b8", fontWeight: 600, fontSize: 14 }}>Yuklanmoqda...</div>
                    </div>
                ) : bots.length === 0 ? (
                    <div style={{ padding: "56px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Bot qo'shilmagan</div>
                        <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>Telegram bot qo'shib, bemorlaringizga bildirishnomalar yuboring</div>
                        <button style={S.btnPrimary} onClick={() => setShowAdd(true)}>
                            <PlusIcon /> Birinchi botni qo'shish
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: "8px 0" }}>
                        {bots.map(bot => (
                            <div key={bot._id} style={S.botRow}
                                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                onMouseLeave={e => e.currentTarget.style.background = ""}
                            >
                                {/* Avatar */}
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#0088cc,#229ED9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                    <TelegramIcon size={24} />
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{bot.name}</span>
                                        <span style={{ padding: "2px 10px", borderRadius: 20, background: bot.isActive ? "#d1fae5" : "#fee2e2", color: bot.isActive ? "#065f46" : "#991b1b", fontSize: 11, fontWeight: 700 }}>
                                            {bot.isActive ? "✅ Faol" : "❌ Nofaol"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>@{bot.username}</span>
                                        <span style={{ fontSize: 12, color: "#94a3b8" }}>ID: {bot.botId}</span>
                                        <span style={{ fontSize: 12, color: "#94a3b8" }}>Qo'shildi: {fmtDate(bot.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                    {/* Telegram link */}
                                    <a href={`https://t.me/${bot.username}`} target="_blank" rel="noreferrer"
                                        style={{ ...S.btnIcon, color: "#0088cc", borderColor: "#bfdbfe", background: "#eff6ff", textDecoration: "none" }}
                                        title="Botni Telegram'da ochish"
                                    >
                                        <LinkIcon />
                                    </a>
                                    {/* Copy link */}
                                    <button style={{ ...S.btnIcon, color: copied === bot.username ? "#059669" : "#64748b" }}
                                        onClick={() => copyLink(bot.username)} title="Havolani nusxalash"
                                    >
                                        {copied === bot.username ? <CheckIcon /> : <CopyIcon />}
                                    </button>
                                    {/* Delete */}
                                    <button
                                        style={{ ...S.btnIcon, color: "#dc2626", borderColor: "#fecaca", background: "#fff5f5" }}
                                        onClick={() => handleDelete(bot._id)}
                                        disabled={deleting === bot._id}
                                        title="O'chirish"
                                    >
                                        {deleting === bot._id
                                            ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fca5a5", borderTopColor: "#dc2626", animation: "spin .6s linear infinite" }} />
                                            : <TrashIcon />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Bot Imkoniyatlari ─────────────────────────────────────── */}
            <div style={S.card}>
                <div style={S.cardHeader}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>⚡ Bot buyruqlari</span>
                </div>
                <div style={{ padding: "8px 20px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                        {[
                            { cmd: "/start", icon: "👋", desc: "Botni ishga tushirish va ro'yxatdan o'tish" },
                            { cmd: "/qabul", icon: "📅", desc: "Qabul vaqtini ko'rish" },
                            { cmd: "/navbat", icon: "🔢", desc: "Navbat raqamini va kutish vaqtini bilish" },
                            { cmd: "/tarix", icon: "📋", desc: "Tibbiy tarixni ko'rish" },
                            { cmd: "/tolovlar", icon: "💳", desc: "To'lovlar tarixini ko'rish" },
                            { cmd: "/shifokorlar", icon: "👨‍⚕️", desc: "Klinikadagi shifokorlar ro'yxati" },
                        ].map(c => (
                            <div key={c.cmd} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                                <span style={{ fontSize: 20, flexShrink: 0 }}>{c.icon}</span>
                                <div>
                                    <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: "#0088cc", marginBottom: 3 }}>{c.cmd}</div>
                                    <div style={{ fontSize: 12, color: "#64748b" }}>{c.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Add Bot Modal ─────────────────────────────────────────── */}
            {showAdd && (
                <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                    <div style={S.modal}>
                        <div style={S.modalHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ ...S.telegramGradient, width: 40, height: 40, borderRadius: 12 }}>
                                    <TelegramIcon size={22} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>Yangi bot qo'shish</div>
                                    <div style={{ fontSize: 13, color: "#94a3b8" }}>BotFather dan olingan token</div>
                                </div>
                            </div>
                            <button style={S.closeBtn} onClick={() => { setShowAdd(false); setToken(""); setAddError(""); }}>✕</button>
                        </div>

                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {/* Instructions */}
                            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "12px 14px" }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#1d4ed8", marginBottom: 6 }}>📋 Qanday olish?</div>
                                <ol style={{ margin: 0, padding: "0 0 0 16px", fontSize: 13, color: "#3b82f6", lineHeight: 1.8 }}>
                                    <li>Telegram'da <strong>@BotFather</strong> ga yozing</li>
                                    <li><code style={{ background: "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>/newbot</code> buyrug'ini yuboring</li>
                                    <li>Bot nomini va username'ini kiriting</li>
                                    <li>Token nusxalanadi — uni quyida kiriting</li>
                                </ol>
                            </div>

                            {/* Token input */}
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                                    Bot Token <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={e => { setToken(e.target.value); setAddError(""); }}
                                    placeholder="1234567890:ABCdefGHIjklMno-PQRstuVWXyz..."
                                    style={{ ...S.input, fontFamily: "monospace", fontSize: 13 }}
                                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                                    autoFocus
                                />
                                {addError && (
                                    <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, background: "#fee2e2", border: "1px solid #fca5a5", fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                                        ❌ {addError}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={S.modalFooter}>
                            <button style={S.btnCancel} onClick={() => { setShowAdd(false); setToken(""); setAddError(""); }}>Bekor</button>
                            <button style={{ ...S.btnPrimary, background: "linear-gradient(135deg,#0088cc,#229ED9)", boxShadow: "0 4px 14px rgba(0,136,204,0.3)" }}
                                onClick={handleAdd} disabled={adding || !token.trim()}
                            >
                                {adding
                                    ? <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin .6s linear infinite" }} /> Tekshirilmoqda...</>
                                    : <><TelegramIcon size={17} /> Botni ulash</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Broadcast Modal ───────────────────────────────────────── */}
            {showBroadcast && (
                <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowBroadcast(false)}>
                    <div style={S.modal}>
                        <div style={S.modalHeader}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>📢 Ommaviy xabar</div>
                                <div style={{ fontSize: 13, color: "#94a3b8" }}>Barcha ulangan foydalanuvchilarga</div>
                            </div>
                            <button style={S.closeBtn} onClick={() => setShowBroadcast(false)}>✕</button>
                        </div>

                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff7ed", border: "1.5px solid #fed7aa", fontSize: 13, color: "#9a3412" }}>
                                ⚠️ Bu xabar <strong>{stats.linked} ta</strong> ulangan foydalanuvchiga yuboriladi.
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Xabar matni</label>
                                <textarea
                                    value={broadMsg}
                                    onChange={e => setBroadMsg(e.target.value)}
                                    placeholder="Barcha bemorlar uchun xabar kiriting...\n\nMarkdown qo'llab-quvvatlanadi: **qalin**, _kursiv_"
                                    rows={5}
                                    style={{ ...S.input, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit", minHeight: 120 }}
                                />
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, textAlign: "right" }}>{broadMsg.length} belgi</div>
                            </div>
                        </div>

                        <div style={S.modalFooter}>
                            <button style={S.btnCancel} onClick={() => setShowBroadcast(false)}>Bekor</button>
                            <button
                                style={{ ...S.btnPrimary, opacity: (!broadMsg.trim() || sending) ? 0.7 : 1 }}
                                onClick={handleBroadcast}
                                disabled={!broadMsg.trim() || sending}
                            >
                                {sending
                                    ? <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin .6s linear infinite" }} /> Yuborilmoqda...</>
                                    : <><SendIcon /> Yuborish</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const S = {
    page: { padding: "28px 32px", maxWidth: 1200, margin: "0 auto", fontFamily: "'Inter', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 },
    title: { fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 2px", letterSpacing: "-0.02em" },
    subtitle: { fontSize: 14, color: "#64748b", margin: 0 },
    telegramGradient: {
        width: 52, height: 52, borderRadius: 16,
        background: "linear-gradient(135deg,#0088cc 0%,#229ED9 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", flexShrink: 0,
        boxShadow: "0 4px 14px rgba(0,136,204,0.35)",
    },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 22 },
    statCard: {
        background: "white", borderRadius: 16, padding: "18px 20px",
        display: "flex", alignItems: "center", gap: 16,
        border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "transform .15s, box-shadow .15s", cursor: "default",
    },
    card: {
        background: "white", borderRadius: 16, marginBottom: 20,
        border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
    },
    cardHeader: {
        padding: "16px 20px", borderBottom: "1.5px solid #f1f5f9",
        background: "#fafbff",
    },
    botRow: {
        display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
        borderBottom: "1px solid #f8fafc", transition: "background .1s",
    },
    btnPrimary: {
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "10px 20px", borderRadius: 10, border: "none",
        background: "linear-gradient(135deg,#0088cc,#229ED9)",
        color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14,
        boxShadow: "0 4px 14px rgba(0,136,204,0.28)", transition: "all .15s",
        fontFamily: "inherit",
    },
    btnOutline: {
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
        background: "white", color: "#475569", cursor: "pointer",
        fontWeight: 600, fontSize: 13, fontFamily: "inherit", transition: "all .12s",
    },
    btnIcon: {
        width: 34, height: 34, borderRadius: 8, border: "1.5px solid #e2e8f0",
        background: "white", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", transition: "all .12s",
        fontFamily: "inherit",
    },
    btnCancel: {
        padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0",
        background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569",
        fontFamily: "inherit",
    },
    overlay: {
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    },
    modal: {
        background: "white", width: "100%", maxWidth: 500, borderRadius: 20,
        boxShadow: "0 25px 60px rgba(0,0,0,0.2)", overflow: "hidden",
        animation: "modalIn .2s cubic-bezier(.34,1.56,.64,1) both",
    },
    modalHeader: {
        padding: "18px 22px", borderBottom: "1.5px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#fafbff",
    },
    modalFooter: {
        padding: "14px 22px", borderTop: "1.5px solid #f1f5f9",
        display: "flex", gap: 10, justifyContent: "flex-end",
        background: "#fafbff",
    },
    closeBtn: {
        width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9",
        cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex",
        alignItems: "center", justifyContent: "center",
    },
    input: {
        width: "100%", padding: "10px 13px", borderRadius: 10,
        border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
        fontFamily: "'Inter', sans-serif", color: "#1e293b",
        boxSizing: "border-box", transition: "border-color .15s",
    },
};
