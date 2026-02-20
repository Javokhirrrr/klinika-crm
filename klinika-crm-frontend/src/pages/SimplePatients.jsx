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
        const p = selectedPatientForPrint;

        // cardNo yoki cardNumber — qaysi biri bo'lsa shuni ol, raqamlarni tozala
        const raw = p.cardNumber || p.cardNo || '';
        const cardNo = raw ? String(raw).replace(/\D/g, '') : '00000000';

        // Yosh hisoblash — sof funksiya (state'ga bog'liq emas)
        const calcAge = (bd) => {
            if (!bd) return null;
            const today = new Date(); const birth = new Date(bd);
            let age = today.getFullYear() - birth.getFullYear();
            if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
            return age >= 0 ? age : null;
        };
        const age = calcAge(p.birthDate);
        const ageStr = age !== null ? `${age} yosh` : '';
        const birthStr = p.birthDate ? new Date(p.birthDate).toLocaleDateString('uz-UZ') : '';
        const genderStr = p.gender === 'male' ? 'Erkak' : p.gender === 'female' ? 'Ayol' : '';
        const regDate = new Date().toLocaleDateString('uz-UZ');

        // Jadval qatori
        const row = (label, value) => value
            ? `<tr><td class="lbl">${label}</td><td class="val">${value}</td></tr>`
            : '';

        const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bemor Karta - ${p.firstName} ${p.lastName}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:80mm auto;margin:0}
  body{
    font-family:'Courier New',Courier,monospace;
    width:80mm;
    min-height:100px;
    background:#fff;
    color:#000;
    font-size:12px;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .wrap{width:72mm;margin:0 auto;padding:6mm 0 4mm}

  /* ── Sarlavha ── */
  .clinic-name{
    text-align:center;
    font-size:15px;
    font-weight:900;
    letter-spacing:1px;
    text-transform:uppercase;
    margin-bottom:1px;
  }
  .clinic-sub{
    text-align:center;
    font-size:9px;
    letter-spacing:0.5px;
    margin-bottom:5px;
  }
  .divider{border:none;border-top:1.5px dashed #000;margin:4px 0}

  /* ── Barcode ── */
  .bc-wrap{text-align:center;margin:5px 0 2px}
  .bc-wrap svg{width:68mm;height:14mm}
  .card-no{
    text-align:center;
    font-size:18px;
    font-weight:900;
    letter-spacing:4px;
    margin:2px 0 5px;
  }

  /* ── Ma'lumotlar jadvali ── */
  table{width:100%;border-collapse:collapse;margin:4px 0}
  td{padding:2.5px 1px;vertical-align:top;line-height:1.3}
  .lbl{width:38%;font-size:10px;color:#444;white-space:nowrap}
  .val{font-size:11px;font-weight:700;color:#000;word-break:break-word}

  /* ── Pastki izoh ── */
  .footer-note{
    font-size:9px;
    color:#333;
    text-align:center;
    margin-top:6px;
    line-height:1.5;
    border-top:1px dashed #999;
    padding-top:5px;
  }

  @media print{
    body{width:80mm}
    .no-print{display:none}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="clinic-name">BEMOR KARTASI</div>
  <div class="clinic-sub">Klinika CRM Tizimi</div>
  <hr class="divider">

  <!-- Barcode -->
  <div class="bc-wrap">
    <svg id="bc"></svg>
  </div>
  <div class="card-no">${cardNo}</div>

  <hr class="divider">

  <!-- Ma'lumotlar -->
  <table>
    ${row('Ism Familiya:', `${p.firstName || ''} ${p.lastName || ''}`.trim())}
    ${row('Telefon:', p.phone)}
    ${row('Tug\'ilgan:', birthStr)}
    ${row('Yosh:', ageStr)}
    ${row('Jins:', genderStr)}
    ${row('Manzil:', p.address)}
    ${row('Ro\'yxat:', regDate)}
  </table>

  <div class="footer-note">
    Har safar klinikaga kelganingizda<br>
    ushbu kartani ko'rsating!
  </div>
</div>

<script>
  JsBarcode("#bc","${cardNo}",{
    format:"CODE128",
    width:2,
    height:55,
    displayValue:false,
    margin:0,
    background:"#fff",
    lineColor:"#000"
  });
  window.onload=function(){setTimeout(function(){window.print();},400)};
<\/script>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=400,height=600,toolbar=0,menubar=0,scrollbars=0');
        if (!win) { alert("Pop-up bloklangan! Brauzerneda pop-up ruxsat bering."); return; }
        win.document.open();
        win.document.write(html);
        win.document.close();
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
                <DialogContent className="sm:max-w-[360px] max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="px-5 pt-5 pb-3 border-b">
                        <DialogTitle className="text-base font-bold">📄 Karta ko'rinishi (80mm chek)</DialogTitle>
                    </DialogHeader>

                    {selectedPatientForPrint && (() => {
                        const p = selectedPatientForPrint;
                        const cardNo = (p.cardNumber || p.cardNo || '00000000').replace(/\D/g, '') || '00000000';
                        const age = calculateAge(p.birthDate);
                        const barcodeUrl = `https://quickchart.io/chart?cht=qr&chs=180x180&chl=${cardNo}&choe=UTF-8`;
                        const bcUrl = `https://barcodeapi.org/api/code128/${cardNo}?width=2&height=55`;
                        const rows = [
                            ['Ism Familiya', `${p.firstName || ''} ${p.lastName || ''}`.trim()],
                            ['Telefon', p.phone],
                            p.birthDate ? ['Tug\'ilgan', new Date(p.birthDate).toLocaleDateString('uz-UZ')] : null,
                            age !== null && age >= 0 ? ['Yosh', `${age} yosh`] : null,
                            p.gender ? ['Jins', p.gender === 'male' ? 'Erkak' : 'Ayol'] : null,
                            p.address ? ['Manzil', p.address] : null,
                            ['Ro\'yxat', new Date().toLocaleDateString('uz-UZ')],
                        ].filter(Boolean);

                        return (
                            <div style={{
                                fontFamily: "'Courier New', monospace",
                                background: '#fff',
                                padding: '14px 18px 10px',
                                fontSize: 12,
                                color: '#000',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                {/* Sarlavha */}
                                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                                    <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' }}>BEMOR KARTASI</div>
                                    <div style={{ fontSize: 9, color: '#555', letterSpacing: 0.5 }}>Klinika CRM Tizimi</div>
                                </div>

                                <div style={{ borderTop: '1.5px dashed #999', margin: '6px 0' }} />

                                {/* Barcode image */}
                                <div style={{ textAlign: 'center', margin: '6px 0 3px' }}>
                                    <img
                                        src={bcUrl}
                                        alt="barcode"
                                        style={{ width: '100%', maxWidth: 280, height: 55, objectFit: 'fill' }}
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                                <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 18, letterSpacing: 4, margin: '2px 0 6px', fontFamily: 'monospace' }}>
                                    {cardNo}
                                </div>

                                <div style={{ borderTop: '1.5px dashed #999', margin: '6px 0' }} />

                                {/* Ma'lumotlar */}
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {rows.map(([label, value]) => (
                                            <tr key={label}>
                                                <td style={{ fontSize: 10, color: '#555', paddingBottom: 4, width: '38%', verticalAlign: 'top' }}>{label}:</td>
                                                <td style={{ fontSize: 11, fontWeight: 700, paddingBottom: 4, verticalAlign: 'top' }}>{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ borderTop: '1px dashed #aaa', marginTop: 8, paddingTop: 6, fontSize: 9, color: '#444', textAlign: 'center', lineHeight: 1.5 }}>
                                    Har safar klinikaga kelganingizda<br />
                                    ushbu kartani ko'rsating!
                                </div>
                            </div>
                        );
                    })()}

                    <DialogFooter className="gap-2 px-5 py-4">
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
