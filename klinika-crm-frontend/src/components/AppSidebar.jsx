import React, { memo, useCallback, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "@/lib/utils";
import {
    Home, Users, Calendar, Settings, LogOut,
    UserCheck, LayoutGrid, Stethoscope, CreditCard, ListOrdered,
    TrendingUp, Activity, Banknote, Send, BarChart2, AlertCircle, ShieldCheck, Video
} from "lucide-react";

// ─── Rollar: kim qaysi sahifani ko'ra oladi ───────────────────────────────────
// roles: undefined = HAMMA ko'radi, ["doctor"] = faqat doktor ko'radi
const ADMIN_ROLES = ["admin", "owner", "director", "accountowner", "account_owner"];
const ALL_MENU_ITEMS = [
    { to: "/", icon: Home, label: "Bosh sahifa" },
    { to: "/patients", icon: Users, label: "Bemorlar", roles: [...ADMIN_ROLES, "receptionist", "cashier"] },
    { to: "/appointments", icon: Calendar, label: "Qabullar", roles: [...ADMIN_ROLES, "receptionist", "cashier"] },
    { to: "/doctor-room", icon: Stethoscope, label: "Shifokor xonasi", roles: [...ADMIN_ROLES, "doctor"] },
    { to: "/doctors", icon: UserCheck, label: "Shifokorlar", roles: ADMIN_ROLES },
    { to: "/payments", icon: CreditCard, label: "To'lovlar", roles: [...ADMIN_ROLES, "cashier"] },
    { to: "/queue", icon: ListOrdered, label: "Navbat", roles: [...ADMIN_ROLES, "receptionist"] },
    { to: "/services", icon: LayoutGrid, label: "Xizmatlar", roles: ADMIN_ROLES },
    { to: "/reports", icon: TrendingUp, label: "Hisobotlar", roles: ADMIN_ROLES },
    { to: "/analytics", icon: BarChart2, label: "Analitika", roles: ADMIN_ROLES },
    { to: "/outstanding-debts", icon: AlertCircle, label: "Qarzdorlar", roles: ADMIN_ROLES },
    { to: "/employees", icon: Users, label: "Xodimlar", roles: ADMIN_ROLES },
    { to: "/salaries", icon: Banknote, label: "Maoshlar", roles: ADMIN_ROLES },
    { to: "/telegram-bot", icon: Send, label: "Telegram Bot", roles: ADMIN_ROLES },
    { to: "/system", icon: Settings, label: "Sozlamalar", roles: ADMIN_ROLES },
    // Video Qabul — shifokor va adminlar ko'radi
    { to: "/video-appointments", icon: Video, label: "🎥 Video Qabul", roles: [...ADMIN_ROLES, "doctor", "receptionist"] },
    // Admin Panel - alohida isAdmin bilan tekshiriladi (quyida)
];

// ─── Single nav item — memo bilan wrap qilingan ───────────────────────────────
const NavItem = memo(function NavItem({ item, collapsed, onClose }) {
    const Icon = item.icon;
    return (
        <NavLink
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            title={collapsed ? item.label : ""}
            className={({ isActive }) => cn(
                "flex items-center gap-4 rounded-xl transition-colors duration-150 group relative",
                collapsed ? "justify-center px-0 py-4 mx-auto w-14" : "px-5 py-3.5",
                isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-slate-900"
            )}
        >
            {({ isActive }) => (
                <>
                    <Icon className={cn(
                        "shrink-0 transition-none",
                        collapsed ? "h-6 w-6" : "h-5 w-5",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-slate-700"
                    )} />

                    {!collapsed && (
                        <span className="font-semibold text-[15px] leading-none">{item.label}</span>
                    )}

                    {/* Collapsed tooltip */}
                    {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-100 shadow-xl">
                            {item.label}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                        </div>
                    )}
                </>
            )}
        </NavLink>
    );
});

// ─── Main Sidebar — memo bilan re-render kamaytirish ─────────────────────────
const AppSidebar = memo(function AppSidebar({ mobileOpen, setMobileOpen, collapsed }) {
    const { logout, user, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        logout();
        navigate("/login", { replace: true });
    }, [logout, navigate]);

    const handleClose = useCallback(() => setMobileOpen(false), [setMobileOpen]);

    // Foydalanuvchi roliga qarab menyuni filterlash
    const role = (user?.role || "").toLowerCase();
    const MENU_ITEMS = useMemo(() =>
        ALL_MENU_ITEMS.filter(item => {
            if (!item.roles) return true; // hamma ko'radi
            return item.roles.includes(role);
        }),
        [role]);

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={handleClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "flex flex-col bg-white border-r border-gray-200/80 shadow-sm",
                // Mobile: fixed transform
                "fixed inset-y-0 left-0 z-50 lg:static lg:z-10",
                !mobileOpen && "-translate-x-full lg:translate-x-0",
                // Transition faqat width va transform uchun (background, color emas)
                "transition-[width,transform] duration-200 ease-out",
                // Desktop width
                collapsed ? "lg:w-20" : "lg:w-72",
                // Mobile width
                "w-72"
            )}>

                {/* Logo */}
                <div className={cn(
                    "h-16 flex items-center border-b border-gray-100 shrink-0",
                    collapsed ? "justify-center px-0" : "px-6"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shrink-0 shadow-md">
                            <Activity className="h-4 w-4" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col leading-none">
                                <span className="text-xl font-black text-slate-800 tracking-tight">Zyra</span>
                                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">CRM</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <div className={cn(
                    "flex-1 overflow-y-auto overflow-x-hidden py-4",
                    collapsed ? "px-2" : "px-3"
                )}>
                    {!collapsed && (
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">
                            Menyu
                        </div>
                    )}
                    <nav className="space-y-1">
                        {MENU_ITEMS.map((item) => (
                            <NavItem
                                key={item.to}
                                item={item}
                                collapsed={collapsed}
                                onClose={handleClose}
                            />
                        ))}
                        {/* Admin Panel - isAdmin orqali tekshiriladi (email allowlist ham) */}
                        {isAdmin && (
                            <NavItem
                                item={{ to: "/admin/overview", icon: ShieldCheck, label: "Admin Panel" }}
                                collapsed={collapsed}
                                onClose={handleClose}
                            />
                        )}
                    </nav>
                </div>

                {/* Bottom */}
                <div className={cn(
                    "border-t border-gray-100 py-3 shrink-0",
                    collapsed ? "px-2 flex justify-center" : "px-3"
                )}>
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-150",
                            collapsed ? "p-3 justify-center w-full" : "px-4 py-2.5 w-full"
                        )}
                        title={collapsed ? "Chiqish" : ""}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {!collapsed && "Chiqish"}
                    </button>
                </div>
            </aside>
        </>
    );
});

export default AppSidebar;
