import React, { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Menu Item Component
const MenuItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
    onClick={onClick}
  >
    <span className="menu-icon">{icon}</span>
    <span className="menu-label">{label}</span>
  </NavLink>
);

// Menu Group Component
const MenuGroup = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Don't render if no children
  if (!children || (Array.isArray(children) && children.filter(Boolean).length === 0)) {
    return null;
  }

  return (
    <div className="menu-group">
      <div
        className={`menu-group-header ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="menu-group-title">
          <span className="menu-group-icon">{icon}</span>
          <span className="menu-group-label">{title}</span>
        </div>
        <span className="menu-group-arrow">{isOpen ? '▼' : '▶'}</span>
      </div>
      {isOpen && (
        <div className="menu-group-items">
          {children}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const nav = useNavigate();
  const { logout, isAdmin, org, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Get user role
  const userRole = user?.role || 'reception';

  // Define permissions for each role
  const rolePermissions = useMemo(() => ({
    owner: {
      dashboard: true,
      reports: true,
      appointments: true,
      services: true,
      payments: true,
      queue: true,
      patients: true,
      doctors: true,
      doctorRoom: true,
      attendance: true,
      commissions: true,
      salaries: true, // Only owner can see salaries
      users: true,
      calendar: true,
      notifications: true,
      system: true,
    },
    admin: {
      dashboard: true,
      reports: true,
      appointments: true,
      services: true,
      payments: true,
      queue: true,
      patients: true,
      doctors: true,
      doctorRoom: true,
      attendance: true,
      commissions: true,
      users: true,
      calendar: true,
      notifications: true,
      system: true,
    },
    doctor: {
      dashboard: true,
      appointments: true,
      patients: true,
      doctorRoom: true,
      queue: true,
      payments: false, // view only, not manage
      attendance: true,
      commissions: true,
      calendar: true,
    },
    reception: {
      dashboard: true,
      appointments: true,
      services: true,
      payments: true,
      queue: true,
      patients: true,
      doctors: true,
      calendar: true,
      attendance: true,
    },
    accountant: {
      dashboard: true,
      reports: true,
      payments: true,
      commissions: true,
      patients: true,
      appointments: true,
    },
    nurse: {
      patients: true,
      queue: true,
      appointments: true,
      attendance: true,
      calendar: true,
    },
  }), []);

  // Get permissions for current user role
  const permissions = rolePermissions[userRole] || rolePermissions.reception;

  // Helper to check if user has permission
  const can = (permission) => permissions[permission] === true;

  return (
    <>
      {/* Mobile Hamburger */}
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Overlay */}
      <div className={`sidebar-overlay ${menuOpen ? 'active' : ''}`} onClick={closeMenu}></div>

      {/* Sidebar */}
      <aside className={`modern-sidebar ${menuOpen ? 'open' : ''}`}>
        {/* Brand Logo */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="logo-circle">K</div>
          </div>
          <div className="brand-text">
            <span className="brand-name">Klinika</span>
            <span className="brand-accent">CRM</span>
          </div>
        </div>

        {/* Scrollable Menu Area */}
        <div className="sidebar-menu">
          {/* Bosh sahifa - Main Dashboard */}
          {(can('dashboard') || can('reports') || can('salaries')) && (
            <MenuGroup title="Bosh sahifa" icon="📊" defaultOpen={true}>
              {can('dashboard') && <MenuItem to="/dashboard" icon="📈" label="Dashboard" onClick={closeMenu} />}
              {can('reports') && <MenuItem to="/reports" icon="📄" label="Reports" onClick={closeMenu} />}
              {can('salaries') && <MenuItem to="/salaries" icon="💰" label="Maoshlar" onClick={closeMenu} />}
            </MenuGroup>
          )}

          {/* Mahsulotlar - Products & Services */}
          {(can('appointments') || can('services') || can('payments') || can('queue')) && (
            <MenuGroup title="Mahsulotlar" icon="🏥">
              {can('appointments') && <MenuItem to="/appointments" icon="📅" label="Appointments" onClick={closeMenu} />}
              {can('services') && <MenuItem to="/services" icon="💊" label="Services" onClick={closeMenu} />}
              {can('payments') && <MenuItem to="/payments" icon="💳" label="Payments" onClick={closeMenu} />}
              {can('queue') && <MenuItem to="/queue" icon="📋" label="Navbat" onClick={closeMenu} />}
            </MenuGroup>
          )}

          {/* Ombor - Inventory & Stock */}
          {(can('patients') || can('doctors')) && (
            <MenuGroup title="Ombor" icon="📦">
              {can('patients') && <MenuItem to="/patients" icon="👥" label="Patients" onClick={closeMenu} />}
              {can('doctors') && <MenuItem to="/doctors" icon="⚕️" label="Shifokorlar" onClick={closeMenu} />}
            </MenuGroup>
          )}

          {/* Ishlab chiqarish - Operations */}
          {(can('doctorRoom') || can('attendance') || can('commissions')) && (
            <MenuGroup title="Ishlab chiqarish" icon="🏭">
              {can('doctorRoom') && <MenuItem to="/doctor-room" icon="🩺" label="Doctor Room" onClick={closeMenu} />}
              {can('attendance') && <MenuItem to="/attendance" icon="⏰" label="Davomat" onClick={closeMenu} />}
              {can('commissions') && <MenuItem to="/commissions" icon="💰" label="Foizlar" onClick={closeMenu} />}
            </MenuGroup>
          )}

          {/* Hamkorlar - Partners & System */}
          {(can('users') || can('calendar') || can('notifications') || can('system')) && (
            <MenuGroup title="Hamkorlar" icon="🤝">
              {can('users') && <MenuItem to="/users" icon="👤" label="Users" onClick={closeMenu} />}
              {can('calendar') && <MenuItem to="/calendar" icon="📆" label="Calendar" onClick={closeMenu} />}
              {can('notifications') && <MenuItem to="/notifications" icon="🔔" label="Notifications" onClick={closeMenu} />}
              {can('system') && <MenuItem to="/system" icon="⚙️" label="System" onClick={closeMenu} />}
              {isAdmin && (
                <MenuItem to="/admin/overview" icon="🔐" label="Admin Overview" onClick={closeMenu} />
              )}
            </MenuGroup>
          )}
        </div>

        {/* Bottom User Section */}
        <div className="sidebar-footer">
          {org && (
            <div className="org-info">
              <div className="org-avatar">{org.name?.[0] || 'O'}</div>
              <div className="org-details">
                <div className="org-name">{org.name || "Organization"}</div>
                {org.code && <div className="org-code">Kod: {org.code}</div>}
              </div>
            </div>
          )}

          {/* User info */}
          {user && (
            <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {user.name} • {user.role === 'reception' ? 'Qabulxona' : user.role === 'doctor' ? 'Shifokor' : user.role === 'accountant' ? 'Buxgalter' : user.role === 'nurse' ? 'Hamshira' : user.role === 'owner' ? 'Direktor' : user.role}
            </div>
          )}

          <button
            onClick={() => {
              logout();
              nav("/login", { replace: true });
              closeMenu();
            }}
            className="logout-btn"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
