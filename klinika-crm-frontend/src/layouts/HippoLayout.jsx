import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import HippoSidebar from "../components/HippoSidebar";
import { Menu, Bell, Globe, HelpCircle, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HippoLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const { user, org } = useAuth();
    const location = useLocation();

    const getPageTitle = (pathname) => {
        if (pathname === "/") return "Boshqaruv Paneli";
        if (pathname.includes("patients")) return "Bemorlar";
        if (pathname.includes("appointments")) return "Qabullar";
        if (pathname.includes("doctors")) return "Shifokorlar";
        if (pathname.includes("payments")) return "To'lovlar";
        if (pathname.includes("services")) return "Xizmatlar";
        if (pathname.includes("reports")) return "Hisobotlar";
        return "Zyra CRM";
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
            {/* Sidebar - static pozitsiyada */}
            <HippoSidebar
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                collapsed={collapsed}
            />

            {/* Main Content Wrapper - sidebar ochilganda o'ngga suriladi */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-5">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Desktop Collapse Toggle */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden lg:flex flex-col gap-1.5 p-2.5 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all group"
                            title={collapsed ? "Menyuni ochish" : "Menyuni yopish"}
                        >
                            <span className="w-5 h-0.5 bg-gray-600 rounded-full transition-all group-hover:bg-slate-900"></span>
                            <span className="w-5 h-0.5 bg-gray-600 rounded-full transition-all group-hover:bg-slate-900"></span>
                            <span className="w-5 h-0.5 bg-gray-600 rounded-full transition-all group-hover:bg-slate-900"></span>
                        </button>

                        {/* Page Title - only when no org */}
                        {!org?.name && (
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                                {getPageTitle(location.pathname)}
                            </h1>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Org Info - right side like reference */}
                        {org?.name && (
                            <>
                                <div className="hidden md:flex items-center gap-3 mr-2">
                                    <div className="flex flex-col text-right">
                                        <span className="text-sm font-bold text-slate-900 leading-tight">{org.name}</span>
                                        {org.code && (
                                            <span className="text-xs font-semibold text-gray-400 leading-tight">{org.code}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                            </>
                        )}

                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-xl h-11 w-11">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                        </Button>

                        {/* Settings */}
                        <Button variant="ghost" size="icon" className="hidden sm:flex text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-xl h-11 w-11">
                            <Settings className="h-5 w-5" />
                        </Button>

                        <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-2 pr-3 py-2 cursor-pointer hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-200">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-2 ring-gray-100">
                                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-sm">
                                    {user?.name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:block text-left">
                                <div className="text-sm font-bold text-slate-900 leading-none">{user?.name || "Foydalanuvchi"}</div>
                                <div className="text-xs text-gray-500 mt-1 font-medium">{user?.role === 'admin' ? 'Administrator' : 'Xodim'}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
