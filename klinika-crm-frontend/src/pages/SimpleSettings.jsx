import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../context/AuthContext';
import { User, Building2, Lock, Bell, Settings, Receipt as ReceiptIcon } from 'lucide-react';
import http from '@/lib/http';
import { toast } from 'sonner';

export default function SimpleSettings() {
    const { user, org } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', icon: User, label: 'Profil' },
        { id: 'organization', icon: Building2, label: 'Tashkilot' },
        { id: 'receipt', icon: ReceiptIcon, label: 'Chek Shablon' },
        { id: 'security', icon: Lock, label: 'Xavfsizlik' },
        { id: 'notifications', icon: Bell, label: 'Bildirishnomalar' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
                <p className="text-muted-foreground mt-1">Tizim sozlamalari</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                {/* Sidebar Tabs */}
                <div className="flex flex-col gap-1.5">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                    activeTab === tab.id
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <Card>
                    <CardContent className="p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold">Profil Ma'lumotlari</h2>
                                    <p className="text-sm text-muted-foreground">Shaxsiy ma'lumotlaringizni yangilang</p>
                                </div>
                                <Separator />
                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label>Ism</Label>
                                        <Input defaultValue={user?.name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input type="email" defaultValue={user?.email} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rol</Label>
                                        <Input value={user?.role} disabled />
                                    </div>
                                    <Button>Saqlash</Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'organization' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold">Tashkilot Ma'lumotlari</h2>
                                    <p className="text-sm text-muted-foreground">Klinika ma'lumotlarini boshqaring</p>
                                </div>
                                <Separator />
                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label>Nomi</Label>
                                        <Input defaultValue={org?.name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kod</Label>
                                        <Input defaultValue={org?.code} />
                                    </div>
                                    <Button>Saqlash</Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'receipt' && <ReceiptSettings />}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold">Xavfsizlik</h2>
                                    <p className="text-sm text-muted-foreground">Parol va xavfsizlik sozlamalari</p>
                                </div>
                                <Separator />
                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label>Joriy Parol</Label>
                                        <Input type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Yangi Parol</Label>
                                        <Input type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Parolni Tasdiqlash</Label>
                                        <Input type="password" />
                                    </div>
                                    <Button>Parolni O'zgartirish</Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold">Bildirishnomalar</h2>
                                    <p className="text-sm text-muted-foreground">Bildirishnoma sozlamalarini boshqaring</p>
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    {[
                                        { label: 'Email bildirishnomalar', checked: true },
                                        { label: 'Yangi qabullar haqida', checked: true },
                                        { label: "To'lovlar haqida", checked: false },
                                    ].map((item, i) => (
                                        <label key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                                            <input type="checkbox" defaultChecked={item.checked}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </label>
                                    ))}
                                    <Button className="mt-2">Saqlash</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ReceiptSettings() {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        title: '', address: '', phone: '', footer: '', showLogo: true, showDebt: true
    });

    // Load settings on mount
    useEffect(() => {
        http.get('/settings/receipt_template')
            .then(res => {
                if (res && res.value) {
                    setSettings(res.value);
                } else {
                    // Default values if nothing exists
                    setSettings({
                        title: 'KLINIKA CRM',
                        address: 'Toshkent sh.',
                        phone: '+998 90 123 45 67',
                        footer: 'Xizmatlar uchun rahmat!',
                        showLogo: true,
                        showDebt: true
                    });
                }
            })
            .catch(err => {
                console.error(err);
                // Fallback defaults on error
                setSettings({
                    title: 'KLINIKA CRM',
                    address: 'Toshkent sh.',
                    phone: '+998 90 123 45 67',
                    footer: 'Xizmatlar uchun rahmat!',
                    showLogo: true,
                    showDebt: true
                });
            });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await http.post('/settings/receipt_template', { value: settings });
            toast.success("Shablon saqlandi!");
        } catch (error) {
            toast.error("Xatolik bo'ldi!");
        } finally {
            setLoading(false);
        }
    };

    // Preview Component
    const ReceiptPreview = () => (
        <div className="font-mono text-xs leading-tight p-4 bg-white text-black shadow-lg border border-gray-200 mx-auto" style={{ width: '80mm', minHeight: '120mm' }}>
            <div className="text-center mb-4">
                {settings.showLogo && <div className="font-bold text-lg mb-1">{settings.title || 'KLINIKA NOMI'}</div>}
                {!settings.showLogo && <div className="font-bold text-lg mb-1">{settings.title || 'KLINIKA NOMI'}</div>}
                {settings.address && <div>{settings.address}</div>}
                {settings.phone && <div>Tel: {settings.phone}</div>}
            </div>

            <div className="text-center my-2 text-gray-400 select-none" style={{ letterSpacing: '-2px' }}>----------------------------------------</div>

            <div className="space-y-1">
                <div className="flex justify-between">
                    <span>Продажа:</span>
                    <span className="font-bold">№ 123456</span>
                </div>
                <div className="flex justify-between">
                    <span>Дата и время:</span>
                    <span>2026-02-15 14:30</span>
                </div>
                <div className="flex justify-between">
                    <span>Клиент:</span>
                    <span className="font-bold text-right">Anvarov A.</span>
                </div>
                <div className="flex justify-end text-[10px] text-gray-500">ID: 000123</div>
            </div>

            <div className="text-center my-2 text-gray-400 select-none" style={{ letterSpacing: '-2px' }}>----------------------------------------</div>

            <div className="mb-2">
                <div className="font-bold mb-1">Konsultatsiya (Terapevt)</div>
                <div className="flex justify-between">
                    <span>1 x 150,000</span>
                    <span className="font-bold">150,000 UZS</span>
                </div>
            </div>

            <div className="text-center my-2 text-gray-400 select-none" style={{ letterSpacing: '-2px' }}>----------------------------------------</div>

            <div className="space-y-1">
                {settings.showDebt && (
                    <div className="flex justify-between">
                        <span>Долг до:</span>
                        <span className="font-bold">0 UZS</span>
                    </div>
                )}

                <div className="flex justify-between text-sm font-bold my-1">
                    <span>ИТОГО:</span>
                    <span>150,000 UZS</span>
                </div>

                <div className="flex justify-between">
                    <span>Оплата (Naqd):</span>
                    <span>150,000 UZS</span>
                </div>

                {settings.showDebt && (
                    <div className="flex justify-between mt-1 pt-1 border-t border-dashed border-gray-400">
                        <span>Итого долг:</span>
                        <span className="font-bold">0 UZS</span>
                    </div>
                )}
            </div>

            <div className="text-center my-2 text-gray-400 select-none" style={{ letterSpacing: '-2px' }}>----------------------------------------</div>

            <div className="text-center mt-4 whitespace-pre-wrap">
                {settings.footer || 'Xizmatlar uchun rahmat!'}
            </div>
            <div className="text-center mt-2 text-[10px] text-gray-400">
                System by SoftMasters
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-semibold">Chek Shabloni</h2>
                <p className="text-sm text-muted-foreground">Chop etiladigan chek ko'rinishini sozlang</p>
            </div>
            <Separator />

            <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Form */}
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <Label>Sarlavha (Klinika nomi)</Label>
                        <Input value={settings.title} onChange={e => setSettings({ ...settings, title: e.target.value })} placeholder="Klinika Nomi" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Manzil</Label>
                            <Input value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} placeholder="Toshkent sh." />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} placeholder="+998 90..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Pastki matn (Footer)</Label>
                        <Input value={settings.footer} onChange={e => setSettings({ ...settings, footer: e.target.value })} placeholder="Xizmatlar uchun rahmat!" />
                    </div>
                    <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={settings.showLogo} onChange={e => setSettings({ ...settings, showLogo: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
                            <span className="text-sm font-medium">Logoni ko'rsatish</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={settings.showDebt} onChange={e => setSettings({ ...settings, showDebt: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
                            <span className="text-sm font-medium">Qarzni ko'rsatish</span>
                        </label>
                    </div>
                    <div className="pt-4">
                        <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto h-11 px-8 text-base">
                            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-100 p-8 rounded-xl border border-gray-200 flex justify-center sticky top-6">
                    <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-4">Jonli Ko'rinish (Preview)</div>
                        <ReceiptPreview />
                    </div>
                </div>
            </div>
        </div>
    );
}
