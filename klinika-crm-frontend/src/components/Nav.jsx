import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Item = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    className={({ isActive }) => "navItem" + (isActive ? " active" : "")}
    onClick={onClick}
  >
    {children}
  </NavLink>
);

export default function Nav() {
  const nav = useNavigate();
  const { logout, isAdmin, org } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Hamburger button */}
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className="brand">
        Klinika <span className="brandAccent">CRM</span>
      </div>

      {/* Overlay for mobile */}
      <div className={`nav-overlay ${menuOpen ? 'active' : ''}`} onClick={closeMenu}></div>

      {/* Navigation */}
      <nav className={`nav ${menuOpen ? 'open' : ''}`}>
        <Item to="/dashboard" onClick={closeMenu}>Dashboard</Item>
        <Item to="/doctor-room" onClick={closeMenu}>Doctor</Item>
        <Item to="/appointments" onClick={closeMenu}>Appointments</Item>
        <Item to="/patients" onClick={closeMenu}>Patients</Item>
        <Item to="/doctors" onClick={closeMenu}>Shifokorlar</Item>
        <Item to="/services" onClick={closeMenu}>Services</Item>
        <Item to="/payments" onClick={closeMenu}>Payments</Item>
        <Item to="/users" onClick={closeMenu}>Users</Item>
        <Item to="/reports" onClick={closeMenu}>Reports</Item>
        <Item to="/calendar" onClick={closeMenu}>Calendar</Item>
        <Item to="/notifications" onClick={closeMenu}>Notifications</Item>
        <Item to="/system" onClick={closeMenu}>System</Item>

        {/* NEW FEATURES */}
        <Item to="/attendance" onClick={closeMenu}>⏰ Davomat</Item>
        <Item to="/commissions" onClick={closeMenu}>💰 Foizlar</Item>
        <Item to="/queue" onClick={closeMenu}>📋 Navbat</Item>

        {isAdmin && <Item to="/admin/overview" onClick={closeMenu}>Admin Overview</Item>}

        <div className="navRight">
          {org && (
            <div className="orgCard">
              <div className="orgName" title={org.name || ""}>
                {org.name || "—"}
              </div>
              {org.code && <div className="orgCode">Kod: {org.code}</div>}
            </div>
          )}
          <button
            onClick={() => {
              logout();
              nav("/login", { replace: true });
              closeMenu();
            }}
            className="navItem"
          >
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
