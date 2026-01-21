import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/patients", label: "Patients", icon: "🧑‍⚕️" },
  { to: "/appointments", label: "Appointments", icon: "📅" },
  { to: "/services", label: "Services", icon: "🧾" },
  { to: "/payments", label: "Payments", icon: "💳" },
  { to: "/reports", label: "Reports", icon: "📈" },
  { to: "/users", label: "Users", icon: "👤" },
  { to: "/system", label: "System", icon: "🛠️" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">Klinika CRM</div>
      <nav className="menu">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              "menu-link" + (isActive ? " active" : "")
            }
          >
            <span className="i">{it.icon}</span>
            <span className="t">{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
