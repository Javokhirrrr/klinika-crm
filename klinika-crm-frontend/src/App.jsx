import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import HippoLayout from "./layouts/HippoLayout";
import HippoDashboard from "./pages/HippoDashboard";

// Pages
import Debug from "./pages/Debug.jsx";
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
import Employees from "./pages/Employees.jsx";
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
import SimplePatients from "./pages/SimplePatients.jsx";
import SimpleAppointments from "./pages/SimpleAppointments.jsx";
import SimplePayments from "./pages/SimplePayments.jsx";
import SimpleQueue from "./pages/SimpleQueue.jsx";
import SimpleAttendance from "./pages/SimpleAttendance.jsx";
import SimpleReports from "./pages/SimpleReports.jsx";
import SimpleSettings from "./pages/SimpleSettings.jsx";
import SimpleSalaries from "./pages/SimpleSalaries.jsx";
import SimpleDoctors from "./pages/SimpleDoctors.jsx";
import SimpleServices from "./pages/SimpleServices.jsx";
import SimpleCalendar from "./pages/SimpleCalendar.jsx";
import SimpleDoctorRoom from "./pages/SimpleDoctorRoom.jsx";
import SimpleCommissions from "./pages/SimpleCommissions.jsx";
import ModernDashboard from "./pages/ModernDashboard/ModernDashboard.jsx";
// NEW DOCTOR FEATURES
import DoctorWallet from "./pages/DoctorWallet.jsx";
import Departments from "./pages/Departments.jsx";
import DoctorAnalytics from "./pages/DoctorAnalytics.jsx";
import DoctorStatusBoard from "./pages/DoctorStatusBoard.jsx";
import PatientProfile from "./pages/PatientProfile.jsx";
import LiveQueue from "./pages/LiveQueue.jsx";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

// Smart Dashboard Router - Now uses SimpleDashboard for everyone
function SmartDashboard() {
  // Everyone gets the simple, intuitive dashboard
  return <SimpleDashboard />;
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
                    <HippoLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HippoDashboard />} />
                <Route path="/dashboard" element={<HippoDashboard />} />
                <Route path="/modern-dashboard" element={<ModernDashboard />} />
                <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
                <Route path="/dashboard/director" element={<DirectorDashboard />} />
                <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
                <Route path="/patients" element={<SimplePatients />} />
                <Route path="/patients/:id" element={<PatientProfile />} />
                <Route path="/appointments" element={<SimpleAppointments />} />
                <Route path="/doctor-room" element={<SimpleDoctorRoom />} />
                <Route path="/doctors" element={<SimpleDoctors />} />
                <Route path="/services" element={<SimpleServices />} />
                <Route path="/payments" element={<SimplePayments />} />
                <Route path="/users" element={<Employees />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/reports" element={<SimpleReports />} />
                <Route path="/calendar" element={<SimpleCalendar />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/system" element={<SimpleSettings />} />

                {/* NEW FEATURES */}
                <Route path="/attendance" element={<SimpleAttendance />} />
                <Route path="/commissions" element={<SimpleCommissions />} />
                <Route path="/queue" element={<SimpleQueue />} />
                <Route path="/live-queue" element={<LiveQueue />} />
                <Route path="/salaries" element={<SimpleSalaries />} />

                {/* DOCTOR FEATURES */}
                <Route path="/doctors/:id/wallet" element={<DoctorWallet />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/analytics/doctors" element={<DoctorAnalytics />} />
                <Route path="/doctors/status" element={<DoctorStatusBoard />} />

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
              // Debug Route
                <Route path="/debug" element={<Debug />} />
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
