import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const data = res.data;

      const accessToken = data.accessToken || data.token || data.access_token || null;
      const refreshToken = data.refreshToken || data.refresh_token || null;
      const user = data.user || data.data?.user || null;
      const org = data.org || null;

      login({ user, accessToken, refreshToken, org });
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || err.message || 'Login xatosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-side">
        <div className="brandX">
          <div className="logoDot" />
          <div className="brand-title">Klinika <span className="brandAccent">CRM</span></div>
          <div className="brand-sub">Kirish</div>
        </div>

        <form className="glass-card" onSubmit={handleSubmit}>
          <label className="label">Email yoki Telefon</label>
          <input
            className="inputX"
            type="text"
            placeholder="email@example.com yoki +99890..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="label">Parol</label>
          <input
            className="inputX"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="errorX">{error}</div>}

          <button className="btnX primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Yuklanmoqda…' : 'Kirish'}
          </button>

          <div className="mutedX" style={{ marginTop: 12 }}>
            Hali ro'yhatdan o'tmadizsiz? <Link to="/register">Ro'yxatdan o'tish</Link>
          </div>
        </form>
      </section>

      <aside className="hero-panel">
        <div className="hero-inner">
          <h1 className="hero-title">Soddalashtirilgan klinika boshqaruvi</h1>
          <p className="hero-text">Qabulni rejalashtiring, bemorlar va to'lovlarni yuriting, hisobotlarni avtomatik oling.</p>
          <div className="hero-figure" />
        </div>
      </aside>
    </div>
  );
}
