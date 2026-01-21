// src/pages/Twa.jsx
import { useEffect, useMemo, useState } from "react";

/* ========================= API BASE BUILDER ========================= */
const RAW_API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_BASE = RAW_API_BASE || "";
const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : `/api${path}`);

/* ========================= Telegram helpers ========================= */
function useTelegram() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  const theme = tg?.themeParams || {};
  const color = (k, fallback) => theme?.[k] || fallback;
  return { tg, theme, color };
}

/* ========================= Auth (TWA init) ========================= */
function useAuth() {
  const { tg } = useTelegram();
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const initData = useMemo(() => tg?.initData || "", [tg]);

  useEffect(() => {
    let ignore = false;
    async function go() {
      if (!tg) { setReady(true); return; }
      try {
        tg.expand?.();
        tg.ready?.();
        const r = await fetch(apiUrl("/twa/auth"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData || tg.initDataUnsafe }),
        });
        let data = {};
        try { data = await r.json(); } catch {}
        if (!ignore && data?.accessToken) setToken(data.accessToken);
      } catch {} finally {
        if (!ignore) setReady(true);
      }
    }
    go();
    return () => { ignore = true; };
  }, [initData, tg]);

  return { token, ready };
}

/* ========================= Small API helper ========================= */
async function api(token, path, opts = {}) {
  const r = await fetch(apiUrl(path), {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: opts.credentials || "include",
  });
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw body || { message: "Request failed" };
    return body;
  }
  const text = await r.text().catch(() => "");
  if (!r.ok) throw { message: text || "Request failed" };
  return text;
}

/* ========================= Reusable UI ========================= */
function AppChrome({ title }) {
  const { tg, color } = useTelegram();
  useEffect(() => { tg?.BackButton?.hide?.(); }, [tg]);

  const styleTag = `
    :root{
      --tg-bg: ${color("bg_color", "#f7f7fb")};
      --tg-text: ${color("text_color", "#0f172a")};
      --tg-hint: ${color("hint_color", "#6b7280")};
      --tg-link: ${color("link_color", "#2563eb")};
      --tg-button: ${color("button_color", "#2563eb")};
      --tg-button-text: ${color("button_text_color", "#ffffff")};
      --tg-card: ${color("secondary_bg_color", "#ffffff")};
      --sep: #00000012;
    }
    *{ box-sizing:border-box; }
    html,body,#root{ height:100%; }
    body{ margin:0; background:var(--tg-bg); color:var(--tg-text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    .container{ min-height:100dvh; padding-bottom:96px; }

    .AppBar{ position:sticky; top:0; z-index:10; backdrop-filter:saturate(180%) blur(10px); border-bottom:1px solid var(--sep); }
    .AppBar-inner{ display:flex; align-items:center; gap:10px; padding:14px 16px; background:linear-gradient(180deg, color-mix(in srgb, var(--tg-button) 18%, transparent) 0%, transparent 100%); }
    .logo{ height:32px; width:32px; border-radius:10px; background:var(--tg-button); display:grid; place-items:center; color:var(--tg-button-text); font-weight:700; }
    .title{ font-weight:700; font-size:16px; }
    .subtitle{ margin-left:auto; font-size:12px; color:var(--tg-hint); }

    .grid{ display:grid; gap:12px; padding:16px; }
    .card{ background:var(--tg-card); border:1px solid var(--sep); border-radius:16px; padding:14px; box-shadow:0 1px 2px rgba(0,0,0,.04); }
    .cardTitle{ font-size:13px; color:var(--tg-hint); margin-bottom:8px; }

    .row{ display:flex; align-items:center; gap:10px; }

    .btn{ appearance:none; border:none; outline:none; padding:10px 14px; border-radius:12px; background:var(--tg-button); color:var(--tg-button-text); font-weight:600; font-size:14px; }
    .btn.ghost{ background:transparent; color:var(--tg-link); border:1px solid var(--sep); }
    .btn:disabled{ opacity:.6; }

    .input, .select, .textarea{ width:100%; border:1px solid var(--sep); background:transparent; color:var(--tg-text); padding:10px 12px; border-radius:12px; font-size:14px; }
    .textarea{ resize:vertical; min-height:84px; }
    label.lbl{ font-size:12px; color:var(--tg-hint); margin-bottom:6px; display:block; }

    .stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
    .stat{ background:color-mix(in srgb, var(--tg-button) 8%, var(--tg-card)); border:1px solid var(--sep); border-radius:14px; padding:10px; }
    .statLabel{ font-size:12px; color:var(--tg-hint); }
    .statValue{ font-weight:700; font-size:16px; }

    .listItem{ display:flex; gap:10px; padding:10px 0; border-bottom:1px dashed var(--sep); }
    .listItem:last-child{ border-bottom:none; }
    .pill{ padding:6px 10px; border-radius:999px; border:1px solid var(--sep); font-size:12px; }

    .chips{ display:flex; flex-wrap:wrap; gap:8px; }
    .chip{ border:1px solid var(--sep); padding:8px 12px; border-radius:999px; font-size:13px; }
    .chip.active{ background:var(--tg-button); color:var(--tg-button-text); border-color:transparent; }

    .Bottom{ position:fixed; bottom:0; left:0; right:0; border-top:1px solid var(--sep); background:var(--tg-card); padding:6px env(safe-area-inset-right) calc(6px + env(safe-area-inset-bottom)) env(safe-area-inset-left); }
    .tabs{ display:flex; }
    .tab{ flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:8px 0; font-size:12px; color:var(--tg-hint); }
    .tab.active{ color:var(--tg-text); font-weight:700; }
  `;

  return (
    <>
      <style>{styleTag}</style>
      <div className="AppBar">
        <div className="AppBar-inner">
          <div className="logo">K</div>
          <div className="title">{title}</div>
          <div className="subtitle">Telegram WebApp</div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children, pad = true }) {
  return (
    <div className="card">
      {title && <div className="cardTitle">{title}</div>}
      <div style={{ paddingTop: pad ? 2 : 0 }}>{children}</div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const Item = ({ id, icon, label }) => (
    <button className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div>{label}</div>
    </button>
  );
  return (
    <div className="Bottom">
      <div className="tabs">
        <Item id="home" icon="🏠" label="Home" />
        <Item id="book" icon="🗓️" label="Book" />
        <Item id="visits" icon="📋" label="Visits" />
        <Item id="payments" icon="💳" label="Pay" />
        <Item id="profile" icon="👤" label="Profile" />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
      {sub && <div className="statLabel" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ========================= Main Screen ========================= */
export default function Twa() {
  const { token, ready } = useAuth();
  const [tab, setTab] = useState("home");
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState(null);
  const [visits, setVisits] = useState([]);
  const [pays, setPays] = useState([]);

  async function loadAll() {
    if (!token) return;
    setBusy(true);
    try {
      const [m, v, p] = await Promise.all([
        api(token, "/twa/me"),
        api(token, "/twa/appointments"),
        api(token, "/twa/payments"),
      ]);
      setMe(m || {});
      setVisits(v?.items || []);
      setPays(p?.items || []);
    } finally { setBusy(false); }
  }

  useEffect(() => { if (ready) loadAll(); }, [ready, token]);

  return (
    <div className="container">
      <AppChrome title={me?.org?.name || "Klinika CRM"} />
      <div className="grid">
        {tab === "home" && (
          <>
            <Section>
              <div className="row">
                <div style={{ height:48, width:48, borderRadius:14, background:"#00000010", display:"grid", placeItems:"center", fontSize:20 }}>🧑‍⚕️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, lineHeight:1.1 }}>
                    {me?.patient?.firstName} {me?.patient?.lastName}
                  </div>
                  <div style={{ fontSize:12, color:"var(--tg-hint)" }}>{me?.patient?.phone}</div>
                </div>
                <button className="btn" onClick={() => setTab("book")}>Yozilish</button>
              </div>
            </Section>

            <Section title="Qisqa statistika">
              <div className="stats">
                <Stat label="Qabul" value={me?.stats?.visits ?? 0} />
                <Stat label="To‘lov" value={(me?.stats?.paid ?? 0).toLocaleString()} sub="so‘m" />
                <Stat label="Qarz" value={(me?.stats?.debt ?? 0).toLocaleString()} sub="so‘m" />
              </div>
            </Section>

            <Section title="Yaqin qabul">
              {!visits.length && <div style={{ fontSize:14, color:"var(--tg-hint)" }}>Hozircha qabul yo‘q</div>}
              {visits.slice(0,3).map(a => (
                <div key={a._id} className="listItem">
                  <div style={{ fontSize:20 }}>🗓️</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{new Date(a.startsAt).toLocaleString()}</div>
                    <div style={{ fontSize:12, color:"var(--tg-hint)" }}>{a.doctorName || "Shifokor"} • {a.status}</div>
                  </div>
                </div>
              ))}
            </Section>
          </>
        )}

        {tab === "book" && <BookTab token={token} onSuccess={loadAll} />}

        {tab === "visits" && (
          <Section title="Qabul tarixi">
            {!visits.length && <div style={{ fontSize:14, color:"var(--tg-hint)" }}>Ma’lumot yo‘q</div>}
            {visits.map(v => (
              <div key={v._id} className="listItem">
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{new Date(v.startsAt).toLocaleString()}</div>
                  <div style={{ fontSize:12, color:"var(--tg-hint)" }}>{v.doctorName || "Shifokor"} • {v.status}</div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {tab === "payments" && (
          <Section title="To‘lovlar">
            {!pays.length && <div style={{ fontSize:14, color:"var(--tg-hint)" }}>Ma’lumot yo‘q</div>}
            {pays.map(p => (
              <div key={p._id} className="listItem" style={{ alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700 }}>{Number(p.amount||0).toLocaleString()} so‘m</div>
                  <div style={{ fontSize:12, color:"var(--tg-hint)" }}>{p.method} • {new Date(p.createdAt).toLocaleString()}</div>
                </div>
                <a className="pill" href={apiUrl(`/twa/invoice/${p.appointmentId}`)} target="_blank" rel="noreferrer">Invoice</a>
              </div>
            ))}
          </Section>
        )}

        {tab === "profile" && (
          <Section title="Profil">
            <div className="grid" style={{ padding:0 }}>
              <div><span style={{ color:"var(--tg-hint)" }}>Ism:</span> {me?.patient?.firstName} {me?.patient?.lastName}</div>
              <div><span style={{ color:"var(--tg-hint)" }}>Telefon:</span> {me?.patient?.phone}</div>
              <div><span style={{ color:"var(--tg-hint)" }}>Email:</span> {me?.patient?.email || "—"}</div>
              <div><span style={{ color:"var(--tg-hint)" }}>Tashkilot:</span> {me?.org?.name}</div>
            </div>
          </Section>
        )}

        {busy && <div className="card">Yuklanmoqda…</div>}
      </div>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

/* ========================= Booking ========================= */
function BookTab({ token, onSuccess }) {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ doctorId: "", startsAt: "", serviceIds: [], note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [ds, ss] = await Promise.all([
          api(token, "/twa/doctors"),
          api(token, "/twa/services"),
        ]);
        if (!ignore) {
          setDoctors(ds?.items || []);
          setServices(ss?.items || []);
        }
      } catch {}
    }
    load();
    return () => { ignore = true; };
  }, [token]);

  function toggleService(id) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter(x => x !== id)
        : [...f.serviceIds, id],
    }));
  }

  async function submit() {
    setBusy(true); setMsg("");
    try {
      await api(token, "/twa/book", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMsg("✅ Qabulga yozildingiz");
      setForm({ doctorId: "", startsAt: "", serviceIds: [], note: "" });
      onSuccess?.();
    } catch (e) {
      setMsg(e?.message || "❌ Xatolik. Qaytadan urinib ko‘ring");
    } finally { setBusy(false); }
  }

  return (
    <Section title="Qabulga yozilish">
      <div className="grid" style={{ padding:0 }}>
        <div>
          <label className="lbl">Shifokor</label>
          <select className="select" value={form.doctorId} onChange={(e) => setForm(f => ({ ...f, doctorId: e.target.value }))}>
            <option value="">Shifokorni tanlang</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>{d.firstName} {d.lastName} — {d.spec}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="lbl">Vaqt</label>
          <input className="input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm(f => ({ ...f, startsAt: e.target.value }))} />
        </div>

        <div>
          <label className="lbl">Xizmatlar</label>
          <div className="chips">
            {services.map(s => (
              <button type="button" key={s._id} className={`chip ${form.serviceIds.includes(s._id) ? "active" : ""}`} onClick={() => toggleService(s._id)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="lbl">Izoh</label>
          <textarea className="textarea" placeholder="Ixtiyoriy" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>

        <div className="row" style={{ gap:8 }}>
          <button className="btn" disabled={busy || !form.startsAt || !form.doctorId} onClick={submit}>{busy ? "…" : "Yuborish"}</button>
          <button className="btn ghost" onClick={() => history.back()}>Orqaga</button>
        </div>

        {msg && <div className="pill" style={{ alignSelf:"flex-start" }}>{msg}</div>}
      </div>
    </Section>
  );
}
