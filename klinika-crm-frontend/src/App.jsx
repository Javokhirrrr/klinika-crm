import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";

// Pages
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ReceptionDashboard from "./pages/ReceptionDashboard.jsx";
import DirectorDashboard from "./pages/DirectorDashboard.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import Patients from "./pages/Patients.jsx";
import Appointments from "./pages/Appointments.jsx";
import Services from "./pages/Services.jsx";
import Users from "./pages/Users.jsx";
import Reports from "./pages/Reports.jsx";
import System from "./pages/System.jsx";
import DoctorRoom from "./pages/DoctorRoom.jsx";
import AdminOverview from "./pages/AdminOverview.jsx";
import CashierApp from "./areas/cashier/App.jsx";
import DoctorApp from "./areas/doctor/App.jsx";
import DirectorApp from "./areas/director/App.jsx";
import Payments from "./pages/Payments.jsx";
// NEW
import Doctors from "./pages/Doctors.jsx";
import Attendance from "./pages/Attendance.jsx";
import Commissions from "./pages/Commissions.jsx";
import Queue from "./pages/Queue.jsx";
import QueueDisplay from "./pages/QueueDisplay.jsx";
// TWA (Telegram WebApp) — PUBLIC ROUTE
import Twa from "./pages/Twa.jsx";
import Calendar from "./pages/Calendar.jsx";
import Notifications from "./pages/Notifications.jsx";
import Salaries from "./pages/Salaries.jsx";
import SimpleDashboard from "./pages/SimpleDashboard.jsx";
import ModernDashboard from "./pages/ModernDashboard/ModernDashboard.jsx";

// Smart Dashboard Router - Now uses SimpleDashboard for everyone
function SmartDashboard() {
  // Everyone gets the simple, intuitive dashboard
  return <SimpleDashboard />;
}

// Sidebar layout
function PrivateLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* --- Public routes --- */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Telegram WebApp — PUBLIC, NO LAYOUT, NO AUTH */}
              <Route path="/twa" element={<Twa />} />

              {/* Queue Display — PUBLIC, NO LAYOUT, NO AUTH (for waiting room TV) */}
              <Route path="/queue-display" element={<QueueDisplay />} />

              {/* --- Protected + layout --- */}
              <Route
                element={
                  <ProtectedRoute>
                    <PrivateLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SmartDashboard />} />
                <Route path="/dashboard" element={<SmartDashboard />} />
                <Route path="/modern-dashboard" element={<ModernDashboard />} />
                <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
                <Route path="/dashboard/director" element={<DirectorDashboard />} />
                <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/doctor-room" element={<DoctorRoom />} />
                <Route path="/doctors" element={<Doctors />} /> {/* NEW */}
                <Route path="/services" element={<Services />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/users" element={<Users />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/system" element={<System />} />

                {/* NEW FEATURES */}
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/commissions" element={<Commissions />} />
                <Route path="/queue" element={<Queue />} />
                <Route path="/salaries" element={<Salaries />} />

                {/* areas */}
                <Route path="/cashier" element={<CashierApp />} />
                <Route path="/doctor" element={<DoctorApp />} />
                <Route path="/director" element={<DirectorApp />} />

                {/* ADMIN ONLY */}
                <Route
                  path="/admin/overview"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminOverview />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
