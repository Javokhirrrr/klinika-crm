import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react';
import { attendanceAPI } from '../api/newFeatures';

export default function SimpleAttendance() {
    const [todayRecord, setTodayRecord] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadAttendance(); }, []);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const res = await attendanceAPI.getMy();
            const records = res.data || [];
            const today = new Date().toISOString().split('T')[0];
            setTodayRecord(records.find(r => r.date?.startsWith(today)));
            setHistory(records.slice(0, 10));
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    const handleCheckIn = async () => {
        try { await attendanceAPI.checkIn(); loadAttendance(); }
        catch (error) { console.error('Check-in error:', error); }
    };

    const handleCheckOut = async () => {
        try { await attendanceAPI.checkOut(); loadAttendance(); }
        catch (error) { console.error('Check-out error:', error); }
    };

    const formatTime = (date) => !date ? '--:--' : new Date(date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const formatDuration = (minutes) => {
        if (!minutes) return '0s 0daq';
        return `${Math.floor(minutes / 60)}s ${minutes % 60}daq`;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Davomat</h1>
                <p className="text-muted-foreground mt-1">
                    {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            {/* Today's Status */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-blue-500 p-6 text-center">
                    <div className="text-5xl font-bold text-white font-mono">
                        {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="text-center p-4 rounded-xl bg-emerald-50">
                            <div className="text-sm text-muted-foreground mb-1">Kelish</div>
                            <div className="text-2xl font-bold text-emerald-600">{formatTime(todayRecord?.checkIn)}</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-red-50">
                            <div className="text-sm text-muted-foreground mb-1">Ketish</div>
                            <div className="text-2xl font-bold text-red-600">{formatTime(todayRecord?.checkOut)}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Button size="lg" variant="success" onClick={handleCheckIn} disabled={!!todayRecord?.checkIn} className="h-14 text-base">
                            <LogIn className="h-5 w-5" /> KELISH
                        </Button>
                        <Button size="lg" variant="destructive" onClick={handleCheckOut}
                            disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut} className="h-14 text-base">
                            <LogOut className="h-5 w-5" /> KETISH
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* History */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Tarix</h2>
                {loading ? (
                    <Card><CardContent className="py-8 text-center text-muted-foreground">Yuklanmoqda...</CardContent></Card>
                ) : history.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 flex flex-col items-center text-muted-foreground">
                            <Clock className="h-12 w-12 mb-3 opacity-30" />
                            <p>Tarix yo'q</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sana</TableHead>
                                <TableHead>Kelish</TableHead>
                                <TableHead>Ketish</TableHead>
                                <TableHead>Ish soati</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((record) => (
                                <TableRow key={record._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {new Date(record.date).toLocaleDateString('uz-UZ')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-emerald-600">{formatTime(record.checkIn)}</TableCell>
                                    <TableCell className="font-medium text-red-600">{formatTime(record.checkOut)}</TableCell>
                                    <TableCell className="font-medium">{formatDuration(record.workMinutes)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
