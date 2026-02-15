import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import http from '../lib/http';

export default function SimpleReports() {
    const [stats, setStats] = useState({
        totalPatients: 0, totalAppointments: 0, totalRevenue: 0, todayRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const [patients, appointments, payments] = await Promise.all([
                http.get('/patients').catch(() => ({ items: [] })),
                http.get('/appointments').catch(() => ({ items: [] })),
                http.get('/payments').catch(() => ({ items: [] }))
            ]);
            const pItems = patients.items || patients || [];
            const aItems = appointments.items || appointments || [];
            const payItems = payments.items || payments || [];
            const today = new Date().toISOString().split('T')[0];
            setStats({
                totalPatients: pItems.length,
                totalAppointments: aItems.length,
                totalRevenue: payItems.reduce((sum, p) => sum + (p.amount || 0), 0),
                todayRevenue: payItems.filter(p => p.createdAt?.startsWith(today)).reduce((sum, p) => sum + (p.amount || 0), 0)
            });
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    const statCards = [
        { label: 'Jami Bemorlar', value: stats.totalPatients, icon: Users, bg: 'bg-blue-50', iconBg: 'bg-blue-100', color: 'text-blue-600' },
        { label: 'Jami Qabullar', value: stats.totalAppointments, icon: Calendar, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', color: 'text-emerald-600' },
        { label: 'Bugungi Tushum', value: `${(stats.todayRevenue / 1000).toFixed(0)}K`, icon: DollarSign, bg: 'bg-amber-50', iconBg: 'bg-amber-100', color: 'text-amber-600' },
        { label: 'Jami Tushum', value: `${(stats.totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, bg: 'bg-rose-50', iconBg: 'bg-rose-100', color: 'text-rose-600' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Hisobotlar</h1>
                <p className="text-muted-foreground mt-1">Umumiy statistika</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-5">
                                <div className="h-12 bg-muted rounded mb-3" />
                                <div className="h-8 bg-muted rounded w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <Card key={i} className={cn("border-0", s.bg)}>
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.iconBg)}>
                                                <Icon className={cn("h-6 w-6", s.color)} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                                                <div className="text-2xl font-bold text-foreground mt-0.5">{s.value}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card>
                        <CardContent className="py-16 flex flex-col items-center text-muted-foreground">
                            <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">Batafsil Hisobotlar</h3>
                            <p>Grafiklar va batafsil tahlillar tez orada qo'shiladi</p>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
