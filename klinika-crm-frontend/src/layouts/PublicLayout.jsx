import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="card auth-card">
          <Outlet />
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-hero">
          <h1>Klinika CRM</h1>
          <p>Qabulni rejalashtiring, bemorlarni yuriting va to‘lovlarni nazorat qiling.</p>
        </div>
      </div>
    </div>
  );
}
