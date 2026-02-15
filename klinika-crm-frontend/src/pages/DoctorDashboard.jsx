// Doctor Dashboard - Personal Queue and Schedule Interface
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, LoadingSpinner, Toast } from '../components/UIComponents';
import { queueAPI } from '../api/newFeatures';
import http from '../lib/http';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, Activity, User, Stethoscope, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayPatients: 0,
        waitingPatients: 0,
        completedToday: 0,
        avgServiceTime: 0,
    });
    const [myQueue, setMyQueue] = useState([]);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    const loadDashboardData = async () => {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            // Load queue
            const queueRes = await queueAPI.getCurrent();
            const allQueue = queueRes.data?.queue || queueRes.queue || [];
            setMyQueue(allQueue.filter(q => q.status !== 'completed'));

            // Load today's appointments
            const appointmentsRes = await http.get('/appointments', {
                from: startOfDay,
                to: endOfDay,
            });
            const appointments = appointmentsRes.items || appointmentsRes || [];
            setTodayAppointments(appointments.slice(0, 5));

            // Calculate stats
            const completed = allQueue.filter(q => q.status === 'completed');
            const avgTime = completed.length > 0
                ? completed.reduce((sum, q) => sum + (q.serviceTime || 0), 0) / completed.length
                : 0;

            setStats({
                todayPatients: appointments.length,
                waitingPatients: allQueue.filter(q => q.status === 'waiting').length,
                completedToday: completed.length,
                avgServiceTime: Math.round(avgTime),
            });
        } catch (error) {
            console.error('Load dashboard error:', error);
            showToast('Ma\'lumotlarni yuklashda xatolik', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground gap-4">
                <LoadingSpinner size={40} />
                <p>Yuklanmoqda...</p>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Bugungi Bemorlar',
            value: stats.todayPatients,
            icon: Users,
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Navbatda',
            value: stats.waitingPatients,
            icon: Clock,
            bg: 'bg-amber-50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600'
        },
        {
            label: 'Tugallangan',
            value: stats.completedToday,
            icon: CheckCircle,
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600'
        },
        {
            label: "O'rtacha Vaqt",
            value: `${stats.avgServiceTime} daq`,
            icon: Activity,
            bg: 'bg-purple-50',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
    ];

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Shifokor Paneli
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg font-medium flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {new Date().toLocaleDateString('uz-UZ', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/doctor-room')}
                    className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 text-lg"
                >
                    <Stethoscope className="mr-2 h-5 w-5" /> Shifokor Xonasi
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="border-none shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 ${stat.iconColor.replace('text-', 'bg-')}`}></div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl ${stat.iconBg} ${stat.iconColor} shadow-inner group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* My Queue */}
                <Card className="xl:col-span-2 border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" /> Mening Navbatim
                        </CardTitle>
                        <Button variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => navigate('/doctor-room')}>
                            Barchasi <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                        {myQueue.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Users className="h-12 w-12 mb-3 opacity-20" />
                                <p>Navbatda bemorlar yo'q</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myQueue.slice(0, 5).map(q => (
                                    <div key={q._id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-blue-200">
                                            {q.queueNumber}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate">
                                                {q.patientId?.firstName} {q.patientId?.lastName}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className={cn(
                                                    "text-xs font-medium px-2 py-0.5",
                                                    q.status === 'waiting' && "bg-amber-100 text-amber-700",
                                                    q.status === 'called' && "bg-blue-100 text-blue-700",
                                                    q.status === 'in_service' && "bg-green-100 text-green-700"
                                                )}>
                                                    {q.status === 'waiting' && 'Kutmoqda'}
                                                    {q.status === 'called' && 'Chaqirildi'}
                                                    {q.status === 'in_service' && 'Qabulda'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> ~{q.estimatedWaitTime || 0} daq
                                                </span>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate('/doctor-room')}>
                                            Qabul
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Today's Schedule & Quick Actions */}
                <div className="space-y-8">
                    {/* Schedule */}
                    <Card className="border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-purple-600" /> Bugungi Jadval
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {todayAppointments.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p>Bugunga qabullar yo'q</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {todayAppointments.map(apt => (
                                        <div key={apt._id} className="flex gap-4 items-start relative pl-4 border-l-2 border-gray-200 hover:border-blue-500 transition-colors">
                                            <div className="min-w-[60px] pt-0.5">
                                                <span className="text-sm font-bold text-gray-900 block">
                                                    {new Date(apt.scheduledAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex-1 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                                <h5 className="font-semibold text-gray-900 text-sm">{apt.patient?.firstName} {apt.patient?.lastName}</h5>
                                                <p className="text-xs text-muted-foreground mt-0.5">{apt.service?.name}</p>
                                                <div className="mt-1">
                                                    <StatusBadge status={apt.status} size="sm" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Bemorlar', icon: Users, path: '/patients', color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Kalendar', icon: Calendar, path: '/calendar', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Foizlar', icon: TrendingUp, path: '/commissions', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Davomat', icon: Clock, path: '/attendance', color: 'text-amber-600', bg: 'bg-amber-50' },
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(action.path)}
                                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all hover:-translate-y-1 group"
                            >
                                <div className={`p-3 rounded-full ${action.bg} ${action.color} mb-2 group-hover:scale-110 transition-transform`}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </div>
    );
}
