import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Clock, Bell, Monitor, Users, CheckCircle, Speaker, ArrowRight, Activity
} from 'lucide-react';
import { queueAPI } from '../api/newFeatures';

export default function SimpleQueue() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQueue();
        const interval = setInterval(loadQueue, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadQueue = async () => {
        try {
            const res = await queueAPI.getCurrent();
            setQueue(res.data?.queue || []);
            setLoading(false);
        } catch (error) { console.error('Load error:', error); setLoading(false); }
    };

    const handleCall = async (id) => {
        try { await queueAPI.call(id); loadQueue(); }
        catch (error) { console.error('Call error:', error); }
    };

    const waitingCount = queue.filter(q => q.status === 'waiting').length;
    const calledCount = queue.filter(q => q.status === 'called').length;
    const completedCount = queue.filter(q => q.status === 'completed').length;

    // Separate active (waiting/called) from history (completed) if needed, 
    // but for now the API returns current queue mostly. 
    // Let's assume queue contains mostly active items or today's items.
    const activeQueue = queue.filter(q => q.status === 'waiting' || q.status === 'called');

    return (
        <div className="space-y-6 animate-fade-in pb-10 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
                        Navbat
                        <Badge variant="outline" className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border-blue-200">
                            Canli PRO
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-lg">Bemorlar navbatini boshqarish tizimi</p>
                </div>
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-xl transition-all hover:-translate-y-0.5 w-full sm:w-auto" onClick={() => window.open('/queue-display', '_blank')}>
                    <Monitor className="h-5 w-5 mr-2" /> Displey Ekrani
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Kutmoqda</p>
                            <h3 className="text-4xl font-extrabold text-gray-900 mt-1">{waitingCount}</h3>
                        </div>
                        <div className="p-4 bg-amber-100 rounded-2xl text-amber-600">
                            <Clock className="w-8 h-8" />
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-10 -mt-10 blur-2xl" />
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Chaqirilgan</p>
                            <h3 className="text-4xl font-extrabold text-gray-900 mt-1">{calledCount}</h3>
                        </div>
                        <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600">
                            <Speaker className="w-8 h-8" />
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-10 -mt-10 blur-2xl" />
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Tugallandi</p>
                            <h3 className="text-4xl font-extrabold text-gray-900 mt-1">{completedCount}</h3>
                        </div>
                        <div className="p-4 bg-blue-100 rounded-2xl text-blue-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-10 -mt-10 blur-2xl" />
                </Card>
            </div>

            {/* Queue Grid */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-gray-900">Joriy Navbat</h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="animate-pulse h-48 border-none shadow-sm rounded-2xl bg-gray-50" />
                        ))}
                    </div>
                ) : activeQueue.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-200 shadow-none bg-transparent">
                        <CardContent className="py-20 flex flex-col items-center text-muted-foreground">
                            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                                <Users className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Navbat bo'sh</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm text-center">
                                Hozirda kutayotgan bemorlar yo'q. Yangi bemorlar ro'yxatga olinganda shu yerda ko'rinadi.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeQueue.map((item, index) => {
                            const isCalled = item.status === 'called';
                            return (
                                <Card key={item._id} className={cn(
                                    "group relative overflow-hidden border-none transition-all duration-300 rounded-2xl hover:-translate-y-1",
                                    isCalled ? "shadow-xl ring-2 ring-emerald-500 bg-white" : "shadow-sm hover:shadow-lg bg-white"
                                )}>
                                    {/* Top colored bar similar to a ticket */}
                                    <div className={cn(
                                        "h-2 w-full absolute top-0 left-0",
                                        isCalled ? "bg-emerald-500" : "bg-amber-500"
                                    )} />

                                    <CardContent className="p-6 pt-8 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-3xl text-gray-900 border border-gray-100 shadow-inner">
                                                {index + 1}
                                            </div>
                                            <Badge variant={isCalled ? 'success' : 'warning'} className={cn(
                                                "px-3 py-1 shadow-sm text-xs font-bold uppercase",
                                                isCalled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {isCalled ? 'Chaqirildi' : 'Kutmoqda'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1 mb-6 flex-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bemor</p>
                                            <h3 className="text-xl font-bold text-gray-900 line-clamp-1" title={`${item.patientId?.firstName} ${item.patientId?.lastName}`}>
                                                {item.patientId?.firstName} {item.patientId?.lastName}
                                            </h3>
                                            <div className="pt-2">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shifokor</p>
                                                <p className="text-sm font-medium text-gray-700 line-clamp-1">
                                                    {item.doctorId?.name || 'Tanlanmagan'}
                                                </p>
                                            </div>
                                        </div>

                                        {item.status === 'waiting' && (
                                            <Button
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-xl h-12 text-sm font-bold uppercase tracking-wide group-hover:scale-[1.02] transition-transform"
                                                onClick={() => handleCall(item._id)}
                                            >
                                                <Bell className="h-4 w-4 mr-2 animate-pulse" /> Chaqirish
                                            </Button>
                                        )}
                                        {isCalled && (
                                            <div className="w-full bg-emerald-50 text-emerald-700 h-12 rounded-xl flex items-center justify-center font-bold text-sm border border-emerald-100">
                                                <Speaker className="h-4 w-4 mr-2" /> E'lon qilindi
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
