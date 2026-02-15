import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "@/lib/utils";
import {
    Home, Users, Calendar, Settings, LogOut,
    UserCheck, LayoutGrid, Stethoscope, CreditCard, ListOrdered,
    TrendingUp, Activity, Package, FileText, Banknote
} from "lucide-react";

export default function HippoSidebar({ mobileOpen, setMobileOpen, collapsed }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const menuItems = [
        { to: "/", icon: Home, label: "Bosh sahifa" },
        { to: "/patients", icon: Users, label: "Bemorlar" },
        { to: "/appointments", icon: Calendar, label: "Qabullar" },
        { to: "/doctors", icon: UserCheck, label: "Shifokorlar" },
        { to: "/doctor-room", icon: Stethoscope, label: "Shifokor xonasi" },
        { to: "/payments", icon: CreditCard, label: "To'lovlar" },
        { to: "/queue", icon: ListOrdered, label: "Navbat" },
        { to: "/services", icon: LayoutGrid, label: "Xizmatlar" },
        { to: "/reports", icon: TrendingUp, label: "Hisobotlar" },
        { to: "/system", icon: Settings, label: "Sozlamalar" },
        { to: "/employees", icon: Users, label: "Xodimlar" },
        { to: "/salaries", icon: Banknote, label: "Maoshlar" },
    ];

    return (
        <>
            {/* Mobile Overlay - faqat mobilda */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "flex flex-col bg-white border-r border-gray-200/80 shadow-lg lg:shadow-sm transition-all duration-300 ease-in-out",
                    // Mobile: fixed va transform
                    "fixed inset-y-0 left-0 z-50 lg:static lg:z-10",
                    !mobileOpen && "-translate-x-full lg:translate-x-0",
                    // Desktop: width bilan suriladi
                    collapsed ? "lg:w-24" : "lg:w-80",
                    // Mobile: har doim to'liq kenglikda
                    "w-72"
                )}
            >
                {/* Logo Section */}
                <div className={cn(
                    "h-20 flex items-center border-b border-gray-100 transition-all duration-300 bg-gradient-to-b from-white to-gray-50/30",
                    collapsed ? "justify-center px-0" : "px-8 justify-start"
                )}>
                    {!collapsed && (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent tracking-tight">Zyra</span>
                                <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">CRM System</span>
                            </div>
                        </div>
                    )}

                    {collapsed && (
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center text-white shrink-0 shadow-xl">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-5">
                    {!collapsed && (
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 px-3">
                            Navigatsiya
                        </div>
                    )}

                    <nav className="space-y-3">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.to;

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMobileOpen(false)}
                                    title={collapsed ? item.label : ""}
                                    className={cn(
                                        "flex items-center gap-4 rounded-xl transition-all duration-200 group relative",
                                        collapsed ? "justify-center px-0 py-4 mx-auto w-14" : "px-5 py-4",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-slate-900"
                                    )}
                                >
                                    <Icon className={cn(
                                        "shrink-0 transition-all duration-200",
                                        collapsed ? "h-7 w-7" : "h-6 w-6",
                                        isActive ? "text-white" : "text-gray-400 group-hover:text-slate-700"
                                    )} />

                                    {!collapsed && (
                                        <span className="font-semibold text-[17px]">{item.label}</span>
                                    )}

                                    {/* Tooltip for collapsed mode */}
                                    {collapsed && (
                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-xl">
                                            {item.label}
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                                        </div>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="p-4 border-t border-gray-100 bg-gradient-to-t from-gray-50/50 to-white">
                    {!collapsed ? (
                        <>
                            <div className="flex items-center justify-between mb-3 px-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-gray-500">Online</span>
                                </div>
                                <span className="text-xs font-medium text-gray-400">v2.0.1</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all hover:shadow-sm"
                            >
                                <LogOut className="h-5 w-5" />
                                Chiqish
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Chiqish"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
