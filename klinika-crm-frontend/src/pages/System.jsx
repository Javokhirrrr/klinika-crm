import { useEffect, useState } from "react";
import http from "../lib/http.js";

// --- Icons ---
const Icons = {
  Cog: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.795l-.75-1.3m-7.5-12.99l-.75-1.3m-6.063 16.658l-.26-1.477M4.614 10.698l-.26-1.477M16.5 19.795l-.75-1.3M8.904 17.785l-1.15-.964M19.366 7.178l-1.149-.964M12 21.75l-1.41-.513M13.41 2.25l-1.41-.513" /></svg>,
  Server: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
  Chat: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
  Cube: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
};


// --- Tabs Content ---

const BotsTab = () => {
  const [bots, setBots] = useState([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await http.get("/bots");
      setBots(res.items || []);
    } catch (e) {
      setMsg({ text: "Botlarni yuklashda xatolik", type: "error" });
    } finally { setLoading(false); }
  }

  async function add() {
    if (!token.trim()) {
      setMsg({ text: "Token kiriting", type: "error" });
      return;
    }
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      await http.post("/bots", { token: token.trim() });
      setToken("");
      load();
      setMsg({ text: "✅ Bot muvaffaqiyatli qo'shildi!", type: "success" });
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } catch (e) {
      setMsg({ text: "❌ " + (e.response?.data?.message || "Token noto'g'ri"), type: "error" });
    } finally { setLoading(false); }
  }

  async function remove(id, name) {
    if (!confirm(`"${name}" botini o'chirishni xohlaysizmi?`)) return;
    try {
      await http.delete(`/bots/${id}`);
      setMsg({ text: "Bot o'chirildi", type: "success" });
      load();
      setTimeout(() => setMsg({ text: "", type: "" }), 2000);
    } catch (e) {
      setMsg({ text: "O'chirishda xatolik", type: "error" });
    }
  }

  return (
    <div style={styles.twoColumnLayout}>
      {/* Left Column - Add Bot */}
      <div style={styles.leftColumn}>
        <div style={styles.addBotCard}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: 'white' }}>
              🤖 Telegram Bot
            </h3>
            <p style={{ fontSize: '14px', margin: 0, opacity: 0.9, color: 'white' }}>
              BotFather orqali bot yarating
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>
              Bot Token
            </label>
            <input
              style={styles.tokenInput}
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && add()}
              disabled={loading}
            />
          </div>

          <button
            style={{
              ...styles.addBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
            onClick={add}
            disabled={loading}
          >
            {loading ? "⏳ Tekshirilmoqda..." : "➕ Bot Qo'shish"}
          </button>

          {msg.text && (
            <div style={{
              ...styles.message,
              marginTop: '16px',
              background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: 'white',
              border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
            }}>
              {msg.text}
            </div>
          )}

          <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'white' }}>
              📚 Qanday yaratiladi?
            </div>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', opacity: 0.9, lineHeight: '1.8', color: 'white' }}>
              <li>Telegram'da @BotFather ni oching</li>
              <li>/newbot buyrug'ini yuboring</li>
              <li>Bot nomi va username kiriting</li>
              <li>Token'ni nusxalab bu yerga kiriting</li>
            </ol>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              BotFather'ni ochish →
            </a>
          </div>
        </div>
      </div>

      {/* Right Column - Bots List */}
      <div style={styles.rightColumn}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 8px 0' }}>
            Ulangan Botlar
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            {bots.length} ta bot ulangan
          </p>
        </div>

        {loading && bots.length === 0 ? (
          <div style={styles.loadingCard}>
            <div style={styles.spinner}></div>
            <p>Yuklanmoqda...</p>
          </div>
        ) : bots.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤖</div>
            <p style={{ fontSize: '18px', color: '#374151', margin: '0 0 8px 0', fontWeight: '600' }}>
              Hali botlar qo'shilmagan
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Chap tomonda bot token kiriting
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bots.map(b => (
              <div key={b._id} style={styles.botCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '28px', marginRight: '12px' }}>🤖</span>
                      {b.name}
                    </div>
                    <div style={{ fontSize: '15px', color: '#6b7280', marginBottom: '12px', fontFamily: 'monospace' }}>
                      @{b.username}
                    </div>
                  </div>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => remove(b._id, b.name)}
                    title="O'chirish"
                  >
                    🗑️
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#059669', fontWeight: '500' }}>
                    <span style={styles.statusDot}></span>
                    Faol
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString('uz-UZ') : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
};

const SystemInfoTab = () => {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    http.get("/system/health").then(setHealth).catch(() => { });
  }, []);

  return (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
      <div style={{ ...styles.card, padding: '24px' }}>
        <h3 style={styles.cardTitle}>Tizim holati</h3>
        <div style={{ marginTop: '12px', fontSize: '14px' }}>
          <div style={{ marginBottom: '8px' }}>Server: <span style={{ color: 'green' }}>Ishlamoqda</span></div>
          <div style={{ marginBottom: '8px' }}>Vaqt: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : '...'}</div>
          <div>Uptime: {health?.uptime ? (health.uptime / 60).toFixed(1) + ' min' : '...'}</div>
        </div>
      </div>
    </div>
  )
}


export default function System() {
  const [activeTab, setActiveTab] = useState("bots");

  const tabs = [
    { id: "bots", label: "Bildirishnomalar", icon: Icons.Chat },
    { id: "system", label: "Tizim", icon: Icons.Cog },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Sozlamalar</h1>
        <p style={styles.subtitle}>Tizim boshqaruvi</p>
      </div>

      <div style={styles.tabs}>
        {tabs.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                ...styles.tab,
                color: active ? '#2563eb' : '#6b7280',
                borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                background: active ? '#eff6ff' : 'transparent'
              }}
            >
              <t.icon /> {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: '24px' }}>
        {activeTab === "bots" && <BotsTab />}
        {activeTab === "system" && <SystemInfoTab />}
      </div>
    </div>
  );
}

// --- Styles ---
const styles = {
  container: { padding: "32px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif", color: "#111827" },
  header: { marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "15px", color: "#6b7280", margin: 0 },

  tabs: { display: 'flex', borderBottom: '1px solid #e5e7eb', gap: '4px' },
  tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: 'none', background: 'none', outline: 'none', transition: 'all 0.2s', borderRadius: '8px 8px 0 0' },

  card: { background: "white", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", overflow: "hidden" },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: '600' },

  // 2-Column Layout
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: '24px',
    maxWidth: '1400px'
  },

  leftColumn: {
    position: 'sticky',
    top: '24px',
    alignSelf: 'start'
  },

  rightColumn: {
    minHeight: '400px'
  },

  // New Bot Management Styles
  addBotCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '32px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
    color: 'white'
  },

  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
    color: 'inherit'
  },

  sectionDesc: {
    fontSize: '14px',
    margin: '8px 0 0 0',
    opacity: 0.95,
    color: 'inherit'
  },

  tokenInput: {
    flex: 1,
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.3)',
    fontSize: '14px',
    outline: 'none',
    background: 'rgba(255,255,255,0.95)',
    fontFamily: 'monospace',
    transition: 'all 0.2s'
  },

  addBtn: {
    padding: '14px 28px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },

  message: {
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    animation: 'slideIn 0.3s ease'
  },

  botsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px'
  },

  botCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '16px',
    border: '2px solid #f3f4f6',
    transition: 'all 0.3s ease',
    cursor: 'default',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },

  botName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center'
  },

  botUsername: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
    fontFamily: 'monospace'
  },

  botStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#059669',
    fontWeight: '500'
  },

  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 2s ease-in-out infinite'
  },

  deleteBtn: {
    background: '#fee2e2',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      background: '#fecaca'
    }
  },

  emptyCard: {
    background: 'white',
    padding: '60px 40px',
    borderRadius: '16px',
    border: '2px dashed #e5e7eb',
    textAlign: 'center'
  },

  loadingCard: {
    background: 'white',
    padding: '60px 40px',
    borderRadius: '16px',
    border: '1px solid #f3f4f6',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },

  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Table
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { textAlign: "left", padding: "16px 24px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: "600", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" },
  thRight: { textAlign: "right", padding: "16px 24px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: "600", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" },
  tr: { borderBottom: "1px solid #f9fafb" },
  td: { padding: "16px 24px", verticalAlign: "middle", color: "#1f2937" },
  tdRight: { padding: "16px 24px", textAlign: "right", verticalAlign: "middle" },

  loading: { padding: "40px", textAlign: "center", color: "#6b7280" },
  empty: { padding: "40px", textAlign: "center", color: "#6b7280", fontStyle: "italic" },

  // Buttons & Inputs
  primaryBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#111827", color: "white", padding: "10px 20px", borderRadius: "10px", fontWeight: "500", border: "none", cursor: "pointer", transition: "all 0.2s" },
  btn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "white", color: "#374151", fontWeight: "500", cursor: "pointer" },
  actionBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "white", color: "#6b7280", cursor: "pointer", transition: "all 0.2s" },

  formGroup: { marginBottom: '16px' },
  label: { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box" },

  // Modal
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" },
  modal: { background: "white", padding: "0", borderRadius: "20px", width: "500px", maxWidth: "95vw", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" },
  modalHeader: { padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { margin: 0, fontSize: "18px", fontWeight: "600" },
  modalBody: { padding: "24px" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "4px" },
};

