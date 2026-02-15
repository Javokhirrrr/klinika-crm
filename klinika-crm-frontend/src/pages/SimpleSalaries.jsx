import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { DollarSign, Users, Briefcase, TrendingUp, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import http from '../lib/http';

export default function SimpleSalaries() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { loadEmployees(); }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const res = await http.get('/users');
            setEmployees(res.items || res || []);
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
    };

    const roleLabels = {
        doctor: { label: 'Shifokor', class: 'bg-blue-100 text-blue-700 border-blue-200' },
        reception: { label: 'Qabulxona', class: 'bg-purple-100 text-purple-700 border-purple-200' },
        accountant: { label: 'Buxgalter', class: 'bg-amber-100 text-amber-700 border-amber-200' },
        admin: { label: 'Administrator', class: 'bg-rose-100 text-rose-700 border-rose-200' },
        owner: { label: 'Direktor', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        nurse: { label: 'Hamshira', class: 'bg-pink-100 text-pink-700 border-pink-200' }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        (roleLabels[emp.role]?.label || emp.role).toLowerCase().includes(search.toLowerCase())
    );

    const totalsalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
                        Xodimlar Maoshlari
                        <Badge variant="secondary" className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border-emerald-100">
                            {employees.length} Xodim
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Xodimlar ro'yxati va ularning oylik maoshlari hisoboti</p>
                </div>
                <Button variant="outline" className="bg-white border-gray-200 shadow-sm hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" /> Eksport qilish
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <CardContent className="p-6 relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                            <DollarSign className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-indigo-100 font-medium text-sm">Jami Maosh Fondi</p>
                            <h3 className="text-3xl font-bold">{totalsalary.toLocaleString()} <span className="text-lg opacity-80">so'm</span></h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-muted-foreground font-medium text-sm">Faol Xodimlar</p>
                            <h3 className="text-3xl font-bold text-gray-900">{employees.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-muted-foreground font-medium text-sm">O'rtacha Maosh</p>
                            <h3 className="text-3xl font-bold text-gray-900">
                                {employees.length ? Math.round(totalsalary / employees.length).toLocaleString() : 0} <span className="text-sm text-gray-500 font-normal">so'm</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white sticky top-4 z-20">
                <CardContent className="p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Xodimni qidirish..."
                            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Main Table */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden min-h-[400px]">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            Yuklanmoqda...
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Xodimlar topilmadi</h3>
                            <p className="text-muted-foreground">Qidiruv so'rovingiz bo'yicha hech narsa topilmadi.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="pl-6 font-bold text-gray-900">Xodim</TableHead>
                                    <TableHead className="font-bold text-gray-900">Lavozim</TableHead>
                                    <TableHead className="font-bold text-gray-900">Belgilangan Maosh</TableHead>
                                    <TableHead className="font-bold text-gray-900 text-center">Holat</TableHead>
                                    <TableHead className="text-right pr-6 font-bold text-gray-900">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map((emp) => {
                                    const roleStyle = roleLabels[emp.role] || { label: emp.role, class: 'bg-gray-100 text-gray-700' };
                                    return (
                                        <TableRow key={emp._id} className="hover:bg-blue-50/30 transition-colors border-b last:border-0 border-gray-100">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border border-gray-200 shadow-sm">
                                                        <AvatarFallbackClassName name={emp.name} />
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{emp.name}</div>
                                                        <div className="text-xs text-muted-foreground">{emp.phone || 'Tel: Yo\'q'}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={cn("px-2.5 py-0.5 font-semibold border", roleStyle.class)}>
                                                    {roleStyle.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-bold text-gray-700">
                                                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                        <DollarSign className="h-4 w-4" />
                                                    </div>
                                                    {emp.salary?.toLocaleString() || '0'}
                                                    <span className="text-xs font-normal text-muted-foreground">so'm</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
                                                    Faol
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button variant="ghost" size="sm" className="hover:bg-blue-50 text-blue-600">
                                                    Tahrirlash
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function AvatarFallbackClassName({ name }) {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
    const colors = [
        'bg-red-100 text-red-700', 'bg-blue-100 text-blue-700',
        'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700',
        'bg-orange-100 text-orange-700', 'bg-indigo-100 text-indigo-700'
    ];
    // Simple hash for consistent color
    const colorIndex = (name || '').length % colors.length;

    return (
        <AvatarFallback className={cn("font-bold text-xs", colors[colorIndex])}>
            {initials}
        </AvatarFallback>
    );
}
