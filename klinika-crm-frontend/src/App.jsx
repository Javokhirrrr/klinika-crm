import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import AppLayout from "./layouts/AppLayout";
import BarcodeScannerProvider from "./components/BarcodeScannerProvider";

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: 12
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #EFF6FF', borderTopColor: '#3B82F6',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>Yuklanmoqda...</span>
    </div>
  );
}

// ─── Lazy imports — faqat kerak bo'lganda yuklanadi ──────────────────────────
// Public pages (tez kerak)
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));

// Special public pages
const Twa = lazy(() => import("./pages/Twa.jsx"));
const QueueDisplay = lazy(() => import("./pages/QueueDisplay.jsx"));
const QueueStatusPage = lazy(() => import("./pages/QueueStatusPage.jsx"));
const VideoCallPage = lazy(() => import("./pages/VideoCallPage.jsx"));

// Dashboard (birinchi ko'rinadigan — eager-ga yaqin)
const Dashboard = lazy(() => import("./pages/HippoDashboard.jsx"));

// Main pages
const SimplePatients = lazy(() => import("./pages/SimplePatients.jsx"));
const SimpleAppointments = lazy(() => import("./pages/SimpleAppointments.jsx"));
const SimpleDoctors = lazy(() => import("./pages/SimpleDoctors.jsx"));
const SimpleServices = lazy(() => import("./pages/SimpleServices.jsx"));
const SimplePayments = lazy(() => import("./pages/SimplePayments.jsx"));
const Queue = lazy(() => import("./pages/Queue.jsx"));
const SimpleQueue = lazy(() => import("./pages/SimpleQueue.jsx"));

const SimpleAttendance = lazy(() => import("./pages/SimpleAttendance.jsx"));
const SimpleReports = lazy(() => import("./pages/SimpleReports.jsx"));
const SimpleSettings = lazy(() => import("./pages/SimpleSettings.jsx"));
const SimpleSalaries = lazy(() => import("./pages/SimpleSalaries.jsx"));
const SimpleCalendar = lazy(() => import("./pages/SimpleCalendar.jsx"));
const SimpleDoctorRoom = lazy(() => import("./pages/SimpleDoctorRoom.jsx"));
const SimpleCommissions = lazy(() => import("./pages/SimpleCommissions.jsx"));
const TelegramBot = lazy(() => import("./pages/TelegramBot.jsx"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard.jsx"));
const OutstandingDebts = lazy(() => import("./pages/OutstandingDebts.jsx"));
const VideoAppointments = lazy(() => import("./pages/VideoAppointments.jsx"));
const KioskPage = lazy(() => import("./pages/KioskPage.jsx"));


// Other pages (less visited)
const PatientProfile = lazy(() => import("./pages/PatientProfile.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const Employees = lazy(() => import("./pages/Employees.jsx"));
const DoctorWallet = lazy(() => import("./pages/DoctorWallet.jsx"));
const Departments = lazy(() => import("./pages/Departments.jsx"));
const DoctorAnalytics = lazy(() => import("./pages/DoctorAnalytics.jsx"));
const DoctorStatusBoard = lazy(() => import("./pages/DoctorStatusBoard.jsx"));
const LiveQueue = lazy(() => import("./pages/LiveQueue.jsx"));
const AdminOverview = lazy(() => import("./pages/AdminOverview.jsx"));
const ModernDashboard = lazy(() => import("./pages/ModernDashboard/ModernDashboard.jsx"));
const Debug = lazy(() => import("./pages/Debug.jsx"));

// Areas (rarely visited)
const CashierApp = lazy(() => import("./areas/cashier/App.jsx"));
const DoctorApp = lazy(() => import("./areas/doctor/App.jsx"));
const DirectorApp = lazy(() => import("./areas/director/App.jsx"));

// Old pages (kept for backward compat)
const ReceptionDashboard = lazy(() => import("./pages/ReceptionDashboard.jsx"));
const DirectorDashboard = lazy(() => import("./pages/DirectorDashboard.jsx"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard.jsx"));

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ── Public routes ── */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/twa" element={<Twa />} />
                <Route path="/queue-display" element={<QueueDisplay />} />
                {/* PUBLIC: QR navbat holati — auth siz */}
                <Route path="/queue-status" element={<QueueStatusPage />} />
                {/* PUBLIC: Kiosk — bemor navbat oladi (auth siz) */}
                <Route path="/kiosk" element={<KioskPage />} />


                {/* ── Protected + Layout ── */}
                <Route element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  {/* 🔍 Global barcode scanner — hamma sahifada ishlaydi */}
                  <Route path="*" element={<BarcodeScannerProvider />} />
                  {/* Dashboard */}
                  <Route index element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/modern-dashboard" element={<ModernDashboard />} />
                  <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
                  <Route path="/dashboard/director" element={<DirectorDashboard />} />
                  <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
                  {/* Video Call (auth kerak) */}
                  <Route path="/video-call/:appointmentId" element={<VideoCallPage />} />
                  {/* Video Qabul bo'limi */}
                  <Route path="/video-appointments" element={<VideoAppointments />} />

                  {/* Core pages */}
                  <Route path="/patients" element={<SimplePatients />} />
                  <Route path="/patients/:id" element={<PatientProfile />} />
                  <Route path="/appointments" element={<SimpleAppointments />} />
                  <Route path="/doctor-room" element={<SimpleDoctorRoom />} />
                  <Route path="/doctors" element={<SimpleDoctors />} />
                  <Route path="/services" element={<SimpleServices />} />
                  <Route path="/payments" element={<SimplePayments />} />
                  <Route path="/reports" element={<SimpleReports />} />
                  <Route path="/calendar" element={<SimpleCalendar />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/system" element={<SimpleSettings />} />

                  {/* Users */}
                  <Route path="/users" element={<Employees />} />
                  <Route path="/employees" element={<Employees />} />

                  {/* Extra features */}
                  <Route path="/attendance" element={<SimpleAttendance />} />
                  <Route path="/commissions" element={<SimpleCommissions />} />
                  <Route path="/telegram-bot" element={<TelegramBot />} />
                  <Route path="/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/outstanding-debts" element={<OutstandingDebts />} />
                  <Route path="/queue" element={<Queue />} />
                  <Route path="/live-queue" element={<LiveQueue />} />

                  <Route path="/salaries" element={<SimpleSalaries />} />

                  {/* Doctor features */}
                  <Route path="/doctors/:id/wallet" element={<DoctorWallet />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/analytics/doctors" element={<DoctorAnalytics />} />
                  <Route path="/doctors/status" element={<DoctorStatusBoard />} />

                  {/* Areas */}
                  <Route path="/cashier" element={<CashierApp />} />
                  <Route path="/doctor" element={<DoctorApp />} />
                  <Route path="/director" element={<DirectorApp />} />

                  {/* Admin only */}
                  <Route path="/admin/overview" element={
                    <ProtectedRoute adminOnly>
                      <AdminOverview />
                    </ProtectedRoute>
                  } />

                  {/* Debug */}
                  <Route path="/debug" element={<Debug />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
