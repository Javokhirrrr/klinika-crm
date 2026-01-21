// src/pages/AdminOverview.jsx
import { useEffect, useMemo, useState } from "react";
import http from "../lib/http.js";

export default function AdminOverview() {
  /* ====== Overview (karta) ====== */
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await http.get("/admin/overview");
      setData(r);
    } catch (e) {
      setError(e?.response?.data?.message || "Ma'lumot yuklanmadi");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  /* ====== Sections (dropdown) ====== */
  const sections = [
    { key: "orgs", label: "Tashkilotlar" },
    { key: "plans", label: "To‘lovlar va tariflar" },
    { key: "bank", label: "Bank to‘lovida xatolik" },
    { key: "pos", label: "Hippo-POS versiyalari" },
    { key: "roam", label: "Rоumingni boshqarish" },
    { key: "sign", label: "Elektron imzo" },
  ];
  const [active, setActive] = useState("orgs");
  const [menuOpen, setMenuOpen] = useState(false);

  /* ====== Orgs table state ====== */
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    code: "",
    name: "",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [list, setList] = useState({
    items: [],
    total: 0,
    totals: { balance: 0, credit: 0 },
  });
  const [listLoading, setListLoading] = useState(false);

  async function loadOrgs(p = page, l = limit) {
    if (active !== "orgs") return;
    setListLoading(true);
    try {
      const r = await http.get("/admin/orgs", {
        page: p,
        limit: l,
        name: filters.name,
        code: filters.code,
        from: filters.from,
        to: filters.to,
        sort: "createdAt:desc",
      });
      setList(r);
      setPage(r.page);
      setLimit(r.limit);
    } finally {
      setListLoading(false);
    }
  }

  // sahifa ochilganda va bo‘lim orgs bo‘lsa — avtomatik yuklash
  useEffect(() => {
    loadOrgs(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // bo‘lim almashganda ham yuklash
  useEffect(() => {
    if (active === "orgs") loadOrgs(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const canSearch = useMemo(() => active === "orgs", [active]);

  /* ====== Render ====== */
  return (
    <div className="page admin">
      <div className="hdr">
        <div>
          <h1>Platforma statistikasi</h1>
          <p className="muted">
            Klinikalar va foydalanuvchilar bo‘yicha umumiy ko‘rsatkichlar.
          </p>
        </div>
        <div className="actions">
          <div className="dropdown">
            <button className="btn" onClick={() => setMenuOpen((v) => !v)}>
              Bo‘limlar ▾
            </button>
            {menuOpen && (
              <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
                {sections.map((s) => (
                  <div
                    key={s.key}
                    className={`mi ${active === s.key ? "on" : ""}`}
                    onClick={() => {
                      setActive(s.key);
                      setMenuOpen(false);
                    }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="btn" onClick={load}>
            Yangilash
          </button>
        </div>
      </div>

      {loading && (
        <div className="skeletons">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="sk" key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="alert">
          {error}
          <button className="btn sm" onClick={load}>
            Qayta urinish
          </button>
        </div>
      )}

      {data && (
        <>
          {/* top 3 cards */}
          <section className="grid">
            <StatCard
              title="Jami klinikalar"
              value={data.orgs}
              hint="Ro‘yxatdan o‘tgan barcha klinikalar"
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 21V8l9-5 9 5v13" />
                  <path d="M9 21V12h6v9" />
                </svg>
              }
            />
            <StatCard
              title="Aktiv klinikalar"
              value={data.activeOrgs}
              hint="Hozir faol"
              accent
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 7l-8 10-5-5" />
                </svg>
              }
            />
            <StatCard
              title="Jami foydalanuvchilar"
              value={data.users}
              hint="Admin + shifokor + xodimlar"
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 00-3-3.87" />
                  <path d="M4 21v-2a4 4 0 013-3.87" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
          </section>

          {/* ORGS TABLE */}
          {active === "orgs" && (
            <section className="card">
              <div className="tableHdr">
                <div className="title">Barcha tashkilotlar</div>
                <div className="muted">
                  Tashkilotlar soni: <b>{list.total}</b>
                </div>
              </div>

              {/* Filters */}
              <div className="filters">
                <input
                  type="date"
                  className="input"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, from: e.target.value }))
                  }
                  placeholder="Boshlanish sana"
                />
                <input
                  type="date"
                  className="input"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, to: e.target.value }))
                  }
                  placeholder="Tugash sana"
                />
                <input
                  className="input"
                  placeholder="Kod bo‘yicha qidirish"
                  value={filters.code}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, code: e.target.value }))
                  }
                />
                <input
                  className="input"
                  placeholder="Nomi bo‘yicha qidirish"
                  value={filters.name}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, name: e.target.value }))
                  }
                />
                <button
                  className="btn primary"
                  disabled={!canSearch || listLoading}
                  onClick={() => loadOrgs(1, limit)}
                >
                  {listLoading ? "Yuklanmoqda..." : "Topish"}
                </button>
              </div>

              {/* Table */}
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 60, textAlign: "left" }}>#</th>
                      <th>Nomi</th>
                      <th style={{ width: 120 }}>Kod</th>
                      <th style={{ width: 180 }}>Yaratilgan sana</th>
                      <th style={{ width: 160, textAlign: "right" }}>Balans</th>
                      <th style={{ width: 160, textAlign: "right" }}>Kredit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.items.map((o, i) => (
                      <tr key={o._id}>
                        <td>{(page - 1) * limit + i + 1}</td>
                        <td>
                          <a href={`#org/${o._id}`} className="alink">
                            {o.name}
                          </a>
                        </td>
                        <td>{o.code}</td>
                        <td>
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleString()
                            : ""}
                        </td>
                        <td className="num">
                          {(o.balance ?? 0).toLocaleString("uz-UZ")}
                        </td>
                        <td className="num">
                          {(o.credit ?? 0).toLocaleString("uz-UZ")}
                        </td>
                      </tr>
                    ))}
                    {list.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ textAlign: "center", padding: 16 }}
                          className="muted"
                        >
                          Ma’lumot topilmadi
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: "right" }}>
                        <b>Jami:</b>
                      </td>
                      <td className="num">
                        <b>
                          {(list.totals?.balance || 0).toLocaleString("uz-UZ")}
                        </b>
                      </td>
                      <td className="num">
                        <b>
                          {(list.totals?.credit || 0).toLocaleString("uz-UZ")}
                        </b>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination */}
              <div className="pager">
                <button
                  className="btn"
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    loadOrgs(p, limit);
                  }}
                >
                  &lt;
                </button>
                <div className="muted">
                  Sahifa: <b>{page}</b>
                </div>
                <button
                  className="btn"
                  disabled={page * limit >= list.total}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    loadOrgs(p, limit);
                  }}
                >
                  &gt;
                </button>
                <div className="spacer" />
                <div className="muted">Ko‘rsatish:</div>
                <select
                  className="input"
                  style={{ width: 90 }}
                  value={limit}
                  onChange={(e) => {
                    const l = Number(e.target.value);
                    setLimit(l);
                    setPage(1);
                    loadOrgs(1, l);
                  }}
                >
                  {[10, 20, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {/* Boshqa bo‘limlar uchun placeholderlar */}
          {active !== "orgs" && (
            <section className="card">
              <div className="muted">
                “{sections.find((s) => s.key === active)?.label}” bo‘limi tez
                orada.
              </div>
            </section>
          )}
        </>
      )}

      <style>{css}</style>
    </div>
  );
}

function StatCard({ title, value, hint, icon, accent }) {
  return (
    <div className={`card ${accent ? "accent" : ""}`}>
      <div className="stat">
        <div className="ico">{icon}</div>
        <div>
          <div className="title">{title}</div>
          <div className="val">
            {Number(value || 0).toLocaleString("uz-UZ")}
          </div>
          <div className="hint">{hint}</div>
        </div>
      </div>
    </div>
  );
}

const css = `
:root{ --bg:#f7f9fc; --ink:#0f172a; --muted:#6b7280; --line:#e5e7eb; --card:#ffffff; --brand:#2563eb; }
.page.admin{min-height:100vh;background:var(--bg);color:var(--ink);padding:18px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
h1{margin:0 0 6px 0;font-size:28px}
.muted{color:var(--muted)}
.actions{display:flex;gap:8px;align-items:center}
.btn{border:1px solid var(--line);background:#fff;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
.btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
.btn.sm{padding:6px 10px;border-radius:8px;margin-left:10px}
.dropdown{position:relative}
.menu{position:absolute;right:0;top:100%;background:#fff;border:1px solid var(--line);border-radius:12px;margin-top:6px;min-width:260px;box-shadow:0 10px 32px rgba(16,24,40,.12);z-index:30}
.menu .mi{padding:10px 12px;cursor:pointer}
.menu .mi:hover{background:#f8fafc}
.menu .mi.on{font-weight:800;color:#1d4ed8}

.grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
.stat{display:flex;align-items:center;gap:12px}
.ico{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#eef2ff;color:#1d4ed8}
.stat .val{font-size:28px;font-weight:900}
.stat .title{font-weight:800}
.stat .hint{color:var(--muted);font-size:12px}
.accent .ico{background:#ecfdf5;color:#059669}

.skeletons{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.sk{height:98px;border-radius:14px;background:linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6);background-size:200% 100%;animation:s 1.2s linear infinite}
@keyframes s{0%{background-position:0 0}100%{background-position:-200% 0}}

.alert{background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;padding:10px 12px;border-radius:12px;margin:10px 0}

.tableHdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.filters{display:grid;grid-template-columns:repeat(5, 1fr);gap:8px;margin-bottom:10px}
.input{border:1px solid var(--line);background:#fff;border-radius:10px;padding:9px 10px}
.tableWrap{overflow:auto;border:1px solid var(--line);border-radius:12px}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.table thead th{background:#f8fafc;border-bottom:1px solid var(--line);text-align:left;color:#334155}
.table .num{text-align:right}
.alink{color:#0ea5e9;text-decoration:none} .alink:hover{text-decoration:underline}
.pager{display:flex;gap:8px;align-items:center;margin-top:10px}
.pager .spacer{flex:1}

@media (max-width: 1100px){
  .grid{grid-template-columns:1fr}
  .filters{grid-template-columns:1fr}
}
`;
