import React, { useState, useCallback, memo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "../components/AppSidebar";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Route → title map (modul darajasida) ────────────────────────────────────
const PAGE_TITLES = {
    "/": "Bosh sahifa",
    "/dashboard": "Boshqaruv paneli",
    "/patients": "Bemorlar",
    "/appointments": "Qabullar",
    "/doctors": "Shifokorlar",
    "/doctor-room": "Shifokor xonasi",
    "/payments": "To'lovlar",
    "/queue": "Navbat",
    "/services": "Xizmatlar",
    "/reports": "Hisobotlar",
    "/employees": "Xodimlar",
    "/salaries": "Maoshlar",
    "/system": "Sozlamalar",
    "/attendance": "Davomat",
    "/commissions": "Komissiyalar",
    "/live-queue": "Jonli navbat",
    "/departments": "Bo'limlar",
    "/notifications": "Bildirishnomalar",
    "/calendar": "Kalendar",
};

function getTitle(pathname) {
    // To'g'ri moslik
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // Prefix moslik (masalan /patients/123)
    for (const key of Object.keys(PAGE_TITLES)) {
        if (pathname.startsWith(key + "/")) return PAGE_TITLES[key];
    }
    return "Zyra CRM";
}

// ─── Header — memo bilan ──────────────────────────────────────────────────────
const Header = memo(function Header({ onMobileOpen, onCollapse, title, user, org }) {
    return (
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-white border-b border-gray-100 z-20 shrink-0">
            {/* Left */}
            <div className="flex items-center gap-3">
                {/* Mobile toggle */}
                <button
                    onClick={onMobileOpen}
                    className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    aria-label="Menu"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Desktop collapse — 3 qatorli hamburger */}
                <button
                    onClick={onCollapse}
                    className="hidden lg:flex flex-col gap-1 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    aria-label="Menyuni yig'ish/yoyish"
                >
                    <span className="w-4 h-0.5 bg-gray-400 rounded-full" />
                    <span className="w-4 h-0.5 bg-gray-400 rounded-full" />
                    <span className="w-4 h-0.5 bg-gray-400 rounded-full" />
                </button>

                {/* Page title */}
                {title && (
                    <h1 className="text-base font-bold text-slate-800 tracking-tight hidden sm:block">
                        {title}
                    </h1>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Org name */}
                {org?.name && (
                    <div className="hidden md:flex items-center gap-2 mr-1">
                        <span className="text-sm font-bold text-slate-700">{org.name}</span>
                        {org.code && <span className="text-xs text-gray-400 font-medium">{org.code}</span>}
                    </div>
                )}

                {/* Notification bell */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-xl"
                >
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
                </Button>

                {/* Avatar */}
                <Avatar className="h-8 w-8 border border-gray-200 cursor-pointer">
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
});

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AppLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const { user, org } = useAuth();
    const location = useLocation();

    const handleMobileOpen = useCallback(() => setMobileOpen(true), []);
    const handleCollapse = useCallback(() => setCollapsed(c => !c), []);

    const title = getTitle(location.pathname);

    return (
        <div className={cn(
            "flex h-screen bg-gray-50 overflow-hidden",
            "font-['Inter','Outfit',system-ui,sans-serif]"
        )}>
            {/* Sidebar */}
            <AppSidebar
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                collapsed={collapsed}
            />

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    onMobileOpen={handleMobileOpen}
                    onCollapse={handleCollapse}
                    title={title}
                    user={user}
                    org={org}
                />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
