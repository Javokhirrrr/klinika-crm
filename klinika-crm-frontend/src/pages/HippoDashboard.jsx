import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, Stethoscope, CreditCard,
    ArrowRight, TrendingUp, UserPlus, BarChart3, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';

export default function HippoDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Xayrli tong" : hour < 18 ? "Xayrli kun" : "Xayrli kech";

    const workflowSteps = [
        {
            id: 'reception',
            title: 'Registratura',
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            description: 'Bemorlarni ro\'yxatga olish',
            count: 12,
            path: '/patients',
            label: 'NAVBATDA'
        },
        {
            id: 'appointment',
            title: 'Qabullar',
            icon: Calendar,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            description: 'Navbat va yozilish',
            count: 8,
            path: '/appointments',
            label: 'NAVBATDA'
        },
        {
            id: 'doctor',
            title: 'Ko\'rik',
            icon: Stethoscope,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            description: 'Shifokor ko\'rigi',
            count: 4,
            path: '/doctor-room',
            label: 'NAVBATDA'
        },
        {
            id: 'cashier',
            title: 'Kassa',
            icon: CreditCard,
            color: 'from-amber-500 to-amber-600',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-600',
            description: 'To\'lovlar va cheklar',
            count: 15,
            path: '/payments',
            label: 'NAVBATDA'
        }
    ];

    return (
        <div className="space-y-10 w-full">

            {/* Welcome Section - Clean, no background */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{greeting}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {user?.name}
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Bugungi ish jarayoni va statistika</p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={() => navigate('/patients')}
                        className="h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 rounded-xl px-6 font-bold transition-all hover:-translate-y-0.5"
                    >
                        <UserPlus className="h-5 w-5 mr-2" />
                        Yangi Bemor
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/reports')}
                        className="h-11 border-2 border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl px-6 font-bold transition-all"
                    >
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Hisobotlar
                    </Button>
                </div>
            </div>

            {/* Workflow Visualization */}
            <div className="relative">
                {/* Connecting Line */}
                <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent -z-10 -translate-y-1/2 mx-16" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {workflowSteps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.id} className="relative group">
                                <Card
                                    className="relative z-10 border-2 border-gray-200 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden bg-white hover:border-gray-300 hover:-translate-y-2 hover:shadow-2xl"
                                    onClick={() => navigate(step.path)}
                                >
                                    <CardContent className="p-8">
                                        {/* Icon */}
                                        <div className="flex items-center justify-between mb-7">
                                            <div className={cn(
                                                "h-16 w-16 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br",
                                                step.color
                                            )}>
                                                <Icon className="h-8 w-8 text-white" />
                                            </div>
                                            <div className={cn(
                                                "px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border-2",
                                                step.bgColor,
                                                step.textColor,
                                                step.textColor.replace('text-', 'border-')
                                            )}>
                                                Faol
                                            </div>
                                        </div>

                                        {/* Text */}
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium mb-7">
                                            {step.description}
                                        </p>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between pt-5 border-t-2 border-gray-100">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">{step.label}</span>
                                                <span className="text-3xl font-black text-slate-900">{step.count}</span>
                                            </div>
                                            <ArrowRight className="h-6 w-6 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-2 transition-all duration-300" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Separator */}
            <div className="border-t border-gray-200"></div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="border-2 border-gray-200 shadow-lg overflow-hidden col-span-1 lg:col-span-2 bg-white rounded-2xl">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Kunlik holat</h3>
                                <p className="text-gray-500 text-sm font-medium mt-1">Bugungi umumiy ko'rsatkichlar</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <TrendingUp className="text-emerald-600 h-6 w-6" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Yangi Bemorlar", value: "12", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                                { label: "Qabullar", value: "28", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
                                { label: "Yakunlangan", value: "15", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
                                { label: "Bekor qilingan", value: "3", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
                            ].map((stat, i) => (
                                <div key={i} className={cn(
                                    "flex flex-col p-5 rounded-xl border-2 hover:shadow-lg transition-all cursor-pointer",
                                    stat.bg,
                                    stat.border
                                )}>
                                    <span className={cn("text-3xl font-black mb-2", stat.color)}>{stat.value}</span>
                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide leading-tight">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden rounded-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl -ml-10 -mb-10 animate-pulse delay-1000" />

                    <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4 opacity-90">
                                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <span className="font-bold text-sm tracking-wider uppercase">Bugungi Tushum</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight mb-4">
                                8,450,000 <span className="text-lg font-normal opacity-70">so'm</span>
                            </h2>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 backdrop-blur-md">
                                <TrendingUp className="h-4 w-4" />
                                +12.5% kechagiga nisbatan
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            className="w-full h-12 bg-white text-slate-900 hover:bg-gray-100 border-none font-bold shadow-lg transition-all hover:-translate-y-0.5 rounded-xl"
                            onClick={() => navigate('/payments')}
                        >
                            To'lovlarni ko'rish
                        </Button>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
