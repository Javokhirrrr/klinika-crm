import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Plus, Search, Phone, Calendar, MoreVertical, Printer, Eye, UserPlus
} from 'lucide-react';
import http from '../lib/http';

export default function SimplePatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [selectedPatientForPrint, setSelectedPatientForPrint] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phone: '',
        birthDate: '', gender: 'male', address: '', cardNo: ''
    });

    useEffect(() => { loadPatients(); }, []);

    // Avtomatik 8 xonali karta raqami generatsiya qilish
    useEffect(() => {
        if (showModal && !formData.cardNumber) {
            const cardNumber = String(Math.floor(10000000 + Math.random() * 90000000));
            setFormData(prev => ({ ...prev, cardNumber }));
        }
    }, [showModal]);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const res = await http.get('/patients');
            setPatients(res && Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : []));
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await http.post('/patients', formData);
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', phone: '', birthDate: '', gender: 'male', address: '', cardNumber: '' });
            loadPatients();
        } catch (error) {
            console.error('Create error:', error);
            alert('Xatolik yuz berdi!');
        }
    };

    const printPatientCard = (patient) => {
        setSelectedPatientForPrint(patient);
        setShowPrintPreview(true);
    };

    const handlePrint = () => {
        if (!selectedPatientForPrint) return;

        const patient = selectedPatientForPrint;
        // Clean card number to ensure only digits (remove 'C' or other letters)
        const cleanCardNo = patient.cardNo ? String(patient.cardNo).replace(/\D/g, '') : '00000000';

        const cardHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bemor Kartasi - ${patient.firstName} ${patient.lastName}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;padding:20px;background:#f5f5f5}.card{width:400px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)}.header{background:linear-gradient(135deg,#1e293b,#334155);color:white;padding:30px 20px;text-align:center}.header h1{font-size:24px;margin-bottom:5px}.header p{font-size:14px;opacity:0.9}.patient-id{background:#f8f9fa;padding:20px;text-align:center;border-bottom:2px dashed #dee2e6}.patient-id .label{font-size:12px;color:#6c757d;margin-bottom:8px}.patient-id .code{font-size:36px;font-weight:bold;color:#1e293b;letter-spacing:4px;font-family:'Courier New',monospace}.content{padding:25px}.info-row{display:flex;padding:12px 0;border-bottom:1px solid #f0f0f0}.info-row:last-child{border-bottom:none}.info-label{font-size:13px;color:#6c757d;width:120px;flex-shrink:0}.info-value{font-size:14px;font-weight:600;color:#212529;flex:1}.footer{background:#f8f9fa;padding:20px;text-center;font-size:12px;color:#6c757d;line-height:1.6}@media print{body{background:white;padding:0}.card{box-shadow:none;border-radius:0}}</style></head><body><div class="card"><div class="header"><h1>BEMOR KARTASI</h1><p>Klinika CRM Tizimi</p></div><div class="patient-id"><div class="label">Bemor Karta Raqami</div><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${cleanCardNo}" style="display:block;margin:10px auto;width:120px;height:120px" alt="QR Code"/><div class="code" style="margin-top:10px">${cleanCardNo}</div></div><div class="content"><div class="info-row"><div class="info-label">Ism Familiya:</div><div class="info-value">${patient.firstName} ${patient.lastName}</div></div><div class="info-row"><div class="info-label">Telefon:</div><div class="info-value">${patient.phone}</div></div><div class="info-row"><div class="info-label">Tug'ilgan sana:</div><div class="info-value">${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('uz-UZ') : 'Kiritilmagan'}</div></div><div class="info-row"><div class="info-label">Yosh:</div><div class="info-value">${calculateAge(patient.birthDate)} yosh</div></div><div class="info-row"><div class="info-label">Jins:</div><div class="info-value">${patient.gender === 'male' ? 'Erkak' : 'Ayol'}</div></div>${patient.address ? `<div class="info-row"><div class="info-label">Manzil:</div><div class="info-value">${patient.address}</div></div>` : ''}<div class="info-row"><div class="info-label">Ro'yxatdan o'tgan:</div><div class="info-value">${new Date().toLocaleDateString('uz-UZ')}</div></div></div><div class="footer"><strong>Muhim eslatma:</strong><br>Ushbu kartochkani har safar klinikaga kelganingizda ko'rsating.<br>Karta raqamingizni eslab qoling yoki saqlang.</div></div></body></html>`;

        // Create iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(cardHTML);
        iframeDoc.close();

        // Wait for content to load, then print
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            // Remove iframe after printing
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 100);
        }, 250);
    };

    const safePatients = Array.isArray(patients) ? patients : [];
    const filteredPatients = safePatients.filter(p =>
        `${p.firstName} ${p.lastName} ${p.phone} ${p.cardNumber || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bemorlar</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Jami: {patients.length} ta bemor</p>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 rounded-xl px-5 font-semibold transition-all hover:-translate-y-0.5"
                >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Yangi Bemor
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Bemor qidirish (ism, telefon, karta raqami)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-12 bg-white border-2 border-gray-200 focus:border-slate-300 rounded-xl text-sm font-medium"
                />
            </div>

            {/* Patients Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Yuklanmoqda...</div>
            ) : filteredPatients.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
                    <CardContent className="p-12 text-center">
                        <p className="text-gray-500 font-medium">Bemorlar topilmadi</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredPatients.map((patient) => (
                        <Card
                            key={patient._id}
                            className="border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer"
                            onClick={() => navigate(`/patients/${patient._id}`)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-2 ring-gray-100">
                                            <AvatarFallback className={cn(
                                                "text-sm font-bold",
                                                patient.gender === 'female' ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base leading-tight">
                                                {patient.firstName} {patient.lastName}
                                            </h3>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                {calculateAge(patient.birthDate)} yosh • {patient.gender === 'male' ? 'Erkak' : 'Ayol'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3 nuqta menyu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100">
                                                <MoreVertical className="h-4 w-4 text-gray-600" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient._id}`); }}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Profilni ko'rish
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); printPatientCard(patient); }}>
                                                <Printer className="h-4 w-4 mr-2" />
                                                Kartani chop etish
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-700">{patient.phone}</span>
                                    </div>
                                    {patient.cardNumber && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="font-mono font-bold text-slate-900">{patient.cardNumber}</span>
                                        </div>
                                    )}
                                    {patient.address && (
                                        <p className="text-xs text-gray-500 line-clamp-1">{patient.address}</p>
                                    )}
                                </div>

                                {patient.debt > 0 && (
                                    <div className="mt-4 pt-4 border-t-2 border-gray-100">
                                        <Badge variant="destructive" className="font-semibold">
                                            Qarz: {patient.debt?.toLocaleString()} so'm
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Patient Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Yangi Bemor Qo'shish</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Bemor Karta Raqami - Avtomatik */}
                        <div>
                            <Label className="text-sm font-bold text-gray-700">Bemor Karta Raqami</Label>
                            <Input
                                value={formData.cardNumber}
                                readOnly
                                className="mt-1.5 bg-gray-50 font-mono font-bold text-lg text-slate-900 border-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">Avtomatik generatsiya qilingan</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-gray-700">Ism *</Label>
                                <Input
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-gray-700">Familiya *</Label>
                                <Input
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-bold text-gray-700">Telefon *</Label>
                            <Input
                                required
                                type="tel"
                                placeholder="+998 90 123 45 67"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="mt-1.5"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-bold text-gray-700">Tug'ilgan sana</Label>
                                <Input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold text-gray-700">Jins</Label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium"
                                >
                                    <option value="male">Erkak</option>
                                    <option value="female">Ayol</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-bold text-gray-700">Manzil</Label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="mt-1.5"
                            />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                Bekor qilish
                            </Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                                Saqlash
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Print Preview Modal */}
            <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Bemor Kartasi - Preview</DialogTitle>
                    </DialogHeader>

                    {selectedPatientForPrint && (
                        <div className="space-y-4">
                            {/* Card Preview */}
                            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                                {/* Header */}
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 text-center">
                                    <h1 className="text-2xl font-black mb-1">BEMOR KARTASI</h1>
                                    <p className="text-sm opacity-90">Klinika CRM Tizimi</p>
                                </div>

                                {/* Card Number */}
                                <div className="bg-gray-50 p-5 text-center border-b-2 border-dashed border-gray-200">
                                    <div className="text-xs text-gray-500 font-bold uppercase mb-2">Bemor Karta Raqami</div>
                                    <div className="text-4xl font-black text-slate-900 font-mono tracking-wider">
                                        {selectedPatientForPrint.cardNo ? String(selectedPatientForPrint.cardNo).replace(/\D/g, '') : '00000000'}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-6 space-y-3">
                                    <div className="flex border-b border-gray-100 pb-3">
                                        <span className="text-sm text-gray-500 font-medium w-32">Ism Familiya:</span>
                                        <span className="text-sm font-bold text-slate-900">
                                            {selectedPatientForPrint.firstName} {selectedPatientForPrint.lastName}
                                        </span>
                                    </div>
                                    <div className="flex border-b border-gray-100 pb-3">
                                        <span className="text-sm text-gray-500 font-medium w-32">Telefon:</span>
                                        <span className="text-sm font-bold text-slate-900">{selectedPatientForPrint.phone}</span>
                                    </div>
                                    <div className="flex border-b border-gray-100 pb-3">
                                        <span className="text-sm text-gray-500 font-medium w-32">Tug'ilgan sana:</span>
                                        <span className="text-sm font-bold text-slate-900">
                                            {selectedPatientForPrint.birthDate
                                                ? new Date(selectedPatientForPrint.birthDate).toLocaleDateString('uz-UZ')
                                                : 'Kiritilmagan'}
                                        </span>
                                    </div>
                                    <div className="flex border-b border-gray-100 pb-3">
                                        <span className="text-sm text-gray-500 font-medium w-32">Yosh:</span>
                                        <span className="text-sm font-bold text-slate-900">
                                            {calculateAge(selectedPatientForPrint.birthDate)} yosh
                                        </span>
                                    </div>
                                    <div className="flex border-b border-gray-100 pb-3">
                                        <span className="text-sm text-gray-500 font-medium w-32">Jins:</span>
                                        <span className="text-sm font-bold text-slate-900">
                                            {selectedPatientForPrint.gender === 'male' ? 'Erkak' : 'Ayol'}
                                        </span>
                                    </div>
                                    {selectedPatientForPrint.address && (
                                        <div className="flex border-b border-gray-100 pb-3">
                                            <span className="text-sm text-gray-500 font-medium w-32">Manzil:</span>
                                            <span className="text-sm font-bold text-slate-900">{selectedPatientForPrint.address}</span>
                                        </div>
                                    )}
                                    <div className="flex">
                                        <span className="text-sm text-gray-500 font-medium w-32">Ro'yxatdan o'tgan:</span>
                                        <span className="text-sm font-bold text-slate-900">
                                            {new Date().toLocaleDateString('uz-UZ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-gray-50 p-5 text-center text-xs text-gray-600 leading-relaxed">
                                    <strong className="text-gray-900">Muhim eslatma:</strong><br />
                                    Ushbu kartochkani har safar klinikaga kelganingizda ko'rsating.<br />
                                    Karta raqamingizni eslab qoling yoki saqlang.
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowPrintPreview(false)}>
                            Yopish
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="bg-slate-900 hover:bg-slate-800"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Chop Etish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
