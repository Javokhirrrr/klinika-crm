import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome, FiUsers, FiCalendar, FiDollarSign,
  FiClock, FiActivity, FiSettings, FiLogOut,
  FiUserCheck, FiTrendingUp, FiGrid
} from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user, org } = useAuth();

  const menuItems = [
    { to: "/", icon: FiHome, label: "Bosh Sahifa" },
    { to: "/patients", icon: FiUsers, label: "Bemorlar" },
    { to: "/doctors", icon: FiUserCheck, label: "Shifokorlar" },
    { to: "/appointments", icon: FiCalendar, label: "Qabullar" },
    { to: "/services", icon: FiGrid, label: "Xizmatlar" },
    { to: "/payments", icon: FiDollarSign, label: "To'lovlar" },
    { to: "/queue", icon: FiClock, label: "Navbat" },
    { to: "/attendance", icon: FiActivity, label: "Davomat" },
    { to: "/salaries", icon: FiDollarSign, label: "Maosh" },
    { to: "/reports", icon: FiTrendingUp, label: "Hisobotlar" },
    { to: "/calendar", icon: FiCalendar, label: "Kalendar" },
    { to: "/system", icon: FiSettings, label: "Sozlamalar" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="modern-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">K</div>
        <div className="logo-text">
          <span className="logo-name">Klinika</span>
          <span className="logo-crm">CRM</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User Info */}
        {user && (
          <div className="user-info">
            <div className="user-avatar">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role">
                {user.role === 'owner' ? 'Direktor' :
                  user.role === 'doctor' ? 'Shifokor' :
                    user.role === 'reception' ? 'Qabulxona' :
                      user.role === 'accountant' ? 'Buxgalter' :
                        user.role}
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button className="logout-button" onClick={handleLogout}>
          <FiLogOut />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
