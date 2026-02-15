import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home, Users, Calendar, Settings, LogOut,
  UserCheck, TrendingUp, LayoutGrid, Stethoscope, CreditCard, ListOrdered,
  Radio, ClipboardList, Percent, Wallet, BarChart3, Building2, Activity,
  ChevronLeft, Menu, X
} from "lucide-react";

const menuItems = [
  { to: "/", icon: Home, label: "Bosh Sahifa" },
  { to: "/patients", icon: Users, label: "Bemorlar" },
  { to: "/doctors", icon: UserCheck, label: "Shifokorlar" },
  { to: "/departments", icon: Building2, label: "Bo'limlar" },
  { to: "/doctors/status", icon: Activity, label: "Shifokorlar Holati" },
  { to: "/doctor-room", icon: Stethoscope, label: "Shifokor Xonasi" },
  { to: "/appointments", icon: Calendar, label: "Qabullar" },
  { to: "/services", icon: LayoutGrid, label: "Xizmatlar" },
  { to: "/payments", icon: CreditCard, label: "To'lovlar" },
  { to: "/queue", icon: ListOrdered, label: "Navbat" },
  { to: "/live-queue", icon: Radio, label: "Jonli Navbat" },
  { to: "/attendance", icon: ClipboardList, label: "Davomat" },
  { to: "/commissions", icon: Percent, label: "Ulushlar" },
  { to: "/salaries", icon: Wallet, label: "Maosh" },
  { to: "/analytics/doctors", icon: BarChart3, label: "Analitika" },
  { to: "/reports", icon: TrendingUp, label: "Hisobotlar" },
  { to: "/calendar", icon: Calendar, label: "Kalendar" },
  { to: "/system", icon: Settings, label: "Sozlamalar" },
];

export default function Sidebar({ isOpen = true, toggle }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          "fixed top-4 left-4 z-40 lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-border shadow-sm hover:bg-gray-50 transition-colors",
          mobileOpen ? "hidden" : "flex"
        )}
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col h-screen",
          "bg-white border-r border-border transition-all duration-300 ease-in-out",
          // Mobile:
          !mobileOpen && "-translate-x-full lg:translate-x-0", // Default hidden on mobile, visible on desktop base
          mobileOpen && "translate-x-0",

          // Desktop:
          "lg:static lg:h-auto lg:translate-x-0", // Reset fixed/transform on desktop
          isOpen ? "lg:w-64" : "lg:w-0 lg:overflow-hidden lg:border-none"
        )}
      >
        <div className="w-64 flex flex-col h-full"> {/* Inner wrapper for fixed width content */}
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 truncate">Klinika</span>

            {/* Mobile Close */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden ml-auto text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Desktop Toggle (Close/Open) */}
            <button
              onClick={toggle}
              className="hidden lg:flex ml-auto text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          {/* Menu */}
          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-0.5 py-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User profile at bottom */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{user?.name || "User"}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email || user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                title="Chiqish"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
