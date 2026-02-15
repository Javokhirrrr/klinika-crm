import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

// Imports with explicit extensions
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';

import {
    Search, Plus, User, Shield, Briefcase,
    Stethoscope, Phone, Mail, CheckCircle, XCircle,
    Edit, Trash, Power, Users as UsersIcon, Lock
} from 'lucide-react';
import http from '@/lib/http';
import { cn } from '@/lib/utils';

// Static Data
const roles = [
    { value: 'owner', label: 'Direktor', icon: Shield, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { value: 'admin', label: 'Admin', icon: Shield, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { value: 'reception', label: 'Qabulxona', icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'doctor', label: 'Shifokor', icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { value: 'accountant', label: 'Buxgalter', icon: Briefcase, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'nurse', label: 'Hamshira', icon: Stethoscope, color: 'text-pink-600 bg-pink-50 border-pink-200' },
];

export default function Employees() {
    const { success: toastSuccess, error: toastError } = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', role: 'reception', password: ''
    });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await http.get('/users', { limit: 1000 });
            setItems(res.items || res || []);
        } catch (err) {
            console.error(err);
            toastError("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(u => {
        const s = search.toLowerCase();
        const matchesSearch =
            (u.name || '').toLowerCase().includes(s) ||
            (u.phone || '').includes(s) ||
            (u.email || '').toLowerCase().includes(s);
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (editingItem) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await http.put(`/users/${editingItem._id}`, payload);
                toastSuccess("Yangilandi");
            } else {
                await http.post('/users', formData);
                toastSuccess("Qo'shildi");
            }
            setShowModal(false);
            fetchItems();
        } catch (err) {
            toastError(err?.response?.data?.message || "Xatolik");
        } finally {
            setBusy(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            email: item.email || '',
            phone: item.phone || '',
            role: item.role,
            password: ''
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({ name: '', email: '', phone: '', role: 'reception', password: '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
        try {
            await http.del(`/users/${id}`);
            toastSuccess("O'chirildi");
            fetchItems();
        } catch (err) {
            toastError("O'chirishda xatolik");
        }
    };

    const handleToggleStatus = async (item) => {
        try {
            await http.put(`/users/${item._id}`, { isActive: !item.isActive });
            toastSuccess("Status o'zgardi");
            fetchItems();
        } catch (err) {
            toastError("Xatolik");
        }
    };

    // Safe Avatar Color
    const getAvatarColorClass = (roleValue) => {
        const r = roles.find(x => x.value === roleValue);
        if (!r?.color) return "bg-gray-500";
        // extract bg- part
        const bgPart = r.color.split(' ').find(c => c.startsWith('bg-'));
        if (!bgPart) return "bg-gray-500";
        // make it darker for avatar text/bg
        return bgPart.replace('50', '500');
    };

    // Stats
    const stats = [
        { label: 'Jami Xodimlar', value: items.length, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Shifokorlar', value: items.filter(u => u.role === 'doctor').length, icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Qabulxona', value: items.filter(u => u.role === 'reception').length, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Xodimlar</h1>
                    <p className="text-muted-foreground">Klinika xodimlari va ularning rollarini boshqarish</p>
                </div>
                <Button onClick={handleCreate} className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                    <Plus className="mr-2 h-4 w-4" /> Yangi Xodim
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white/50 backdrop-blur">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl", stat.bg)}>
                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Ism, telefon yoki email orqali qidirish..."
                            className="pl-9 bg-gray-50/50"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-[200px]"
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Barcha rollar</option>
                        {roles.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/75">
                            <TableRow>
                                <TableHead className="w-[80px]">#</TableHead>
                                <TableHead>Xodim</TableHead>
                                <TableHead>Aloqa</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Holat</TableHead>
                                <TableHead className="text-right">Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Yuklanmoqda...</TableCell>
                                </TableRow>
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Topilmadi</TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item, i) => {
                                    const roleConfig = roles.find(r => r.value === item.role);
                                    return (
                                        <TableRow key={item._id} className="hover:bg-gray-50/50">
                                            <TableCell className="font-medium text-gray-500">{i + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border">
                                                        <AvatarFallback className={cn("text-white font-bold text-xs", getAvatarColorClass(item.role))}>
                                                            {item.name?.slice(0, 1).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900">{item.name}</span>
                                                        <span className="text-xs text-gray-500 capitalize">{item.role}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    {item.phone && (
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                            <Phone className="h-3 w-3 opacity-70" /> {item.phone}
                                                        </div>
                                                    )}
                                                    {item.email && (
                                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                            <Mail className="h-3 w-3 opacity-70" /> {item.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {roleConfig ? (
                                                    <Badge variant="outline" className={cn("font-normal", roleConfig.color)}>
                                                        {roleConfig.label}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">{item.role}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.isActive ? "success" : "destructive"} className={cn("font-normal rounded-full px-2", item.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100")}>
                                                    {item.isActive ? "Faol" : "Bloklangan"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex max-w-[100px] ml-auto items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(item)}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleToggleStatus(item)}>
                                                        <Power className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item._id)}>
                                                        <Trash className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Tahrirlash" : "Yangi Xodim"}</DialogTitle>
                        <DialogDescription>Xodim ma'lumotlarini kiriting.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>F.I.SH</Label>
                            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Lavozim</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                {roles.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Parol {editingItem && "(o'zgartirish uchun)"}</Label>
                            <Input
                                type="password"
                                required={!editingItem}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Bekor qilish</Button>
                            <Button type="submit" disabled={busy}>Saqlash</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
