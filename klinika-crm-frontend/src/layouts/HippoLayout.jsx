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
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-5">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Desktop Collapse Toggle */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden lg:flex flex-col gap-1.5 p-2.5 hover:bg-gray-50 rounded-xl border-transparent hover:border-gray-100 transition-all group"
                            title={collapsed ? "Menyuni ochish" : "Menyuni yopish"}
                        >
                            <span className="w-5 h-0.5 bg-gray-400 rounded-full transition-all group-hover:bg-slate-900"></span>
                            <span className="w-5 h-0.5 bg-gray-400 rounded-full transition-all group-hover:bg-slate-900"></span>
                            <span className="w-5 h-0.5 bg-gray-400 rounded-full transition-all group-hover:bg-slate-900"></span>
                        </button>

                        {/* Page Title - only when no org */}
                        {!org?.name && (
                            <h1 className="text-[20px] font-bold text-slate-800 tracking-tight leading-none font-['Outfit']">
                                {getPageTitle(location.pathname)}
                            </h1>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <button className="p-2 text-gray-400 hover:text-slate-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </button>

                        <Button
                            onClick={() => window.location.href = '/patients'}
                            className="hidden md:flex bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-lg px-4 h-10 shadow-sm transition-all hover:translate-y-[-1px]"
                        >
                            + Yangi bemor
                        </Button>

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
                                <div className="h-6 w-px bg-gray-100 hidden md:block"></div>
                            </>
                        )}

                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-slate-900 hover:bg-gray-50 rounded-xl h-10 w-10">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                        </Button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-1 cursor-pointer hover:bg-gray-50 rounded-xl transition-all p-1">
                            <Avatar className="h-9 w-9 border border-gray-100 shadow-sm">
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                    {user?.name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
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
