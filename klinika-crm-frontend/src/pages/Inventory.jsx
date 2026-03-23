import { useState, useEffect } from 'react';
import {
    Package, Plus, TrendingDown, TrendingUp, Search, Activity, Trash2, Edit 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-shadcn';

import http from '../lib/http';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/LoadingStates';

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals state
    const [showAddItem, setShowAddItem] = useState(false);
    const [showTransaction, setShowTransaction] = useState(false);

    // Form states
    const [formData, setFormData] = useState({ name: '', minQuantity: 10, unit: 'dona', category: 'Umumiy' });
    const [transactionData, setTransactionData] = useState({ itemId: '', type: 'kirim', quantity: '', note: '' });
    const [selectedItem, setSelectedItem] = useState(null); // For transactions

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            const res = await http.get('/inventory/items');
            setItems(res.items || res || []);
        } catch (error) {
            console.error('Error loading inventory items', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        try {
            await http.post('/inventory/items', formData);
            setShowAddItem(false);
            setFormData({ name: '', minQuantity: 10, unit: 'dona', category: 'Umumiy' });
            loadItems();
        } catch (error) {
            console.error('Error creating item', error);
            alert('Xatolik yuz berdi');
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        try {
            await http.post('/inventory/transactions', {
                ...transactionData,
                quantity: Number(transactionData.quantity),
                itemId: selectedItem._id
            });
            setShowTransaction(false);
            setTransactionData({ itemId: '', type: 'kirim', quantity: '', note: '' });
            setSelectedItem(null);
            loadItems();
        } catch (error) {
            console.error('Error adding transaction', error);
            alert(error?.response?.data?.message || 'Xatolik yuz berdi');
        }
    };

    const filteredItems = items.filter(i => 
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                            <Package className="w-7 h-7 text-indigo-500" />
                        </div>
                        Ombor
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Klinika inventarlarini boshqarish va nazorat qilish
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => setShowAddItem(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:-translate-y-0.5 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Yangi Tovar
                    </Button>
                </div>
            </div>

            {/* Quick Stats or Filters Bar */}
            <Card className="border-none shadow-sm bg-card">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Tovarni qidirish..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-transparent border-border"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Items Table */}
            <Card className="border-none shadow-sm bg-card overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <Package className="h-12 w-12 mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold text-foreground mb-1">Ombor bo'sh</h3>
                            <p className="text-sm">Hozircha hech qanday tovar kiritilmagan.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-foreground">Tovar Nomi</TableHead>
                                        <TableHead className="font-semibold text-foreground">Kategoriya</TableHead>
                                        <TableHead className="font-semibold text-foreground">Qoldiq</TableHead>
                                        <TableHead className="font-semibold text-foreground">O'lchov</TableHead>
                                        <TableHead className="font-semibold text-foreground text-right">Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map(item => {
                                        const isLowStock = item.quantity <= item.minQuantity;
                                        return (
                                            <TableRow key={item._id} className={cn("hover:bg-muted/50 transition-colors", isLowStock && "bg-red-500/5")}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.name}</span>
                                                        {isLowStock && (
                                                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Kam qoldiq</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{item.category}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "font-bold text-lg",
                                                        isLowStock ? "text-destructive" : "text-foreground"
                                                    )}>
                                                        {item.quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setTransactionData({ ...transactionData, type: 'kirim' });
                                                                setShowTransaction(true);
                                                            }}
                                                        >
                                                            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Kirim
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setTransactionData({ ...transactionData, type: 'chiqim' });
                                                                setShowTransaction(true);
                                                            }}
                                                        >
                                                            <TrendingDown className="w-3.5 h-3.5 mr-1" /> Chiqim
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Item Modal */}
            <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Yangi Tovar Qo'shish</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateItem} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nomi</Label>
                            <Input 
                                required 
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Masalan: Shprits 5ml"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kategoriya</Label>
                                <Input 
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="Kategoriya nomi"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>O'lchov birligi</Label>
                                <Select value={formData.unit} onValueChange={val => setFormData({ ...formData, unit: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Birlik" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dona">Dona</SelectItem>
                                        <SelectItem value="quti">Quti</SelectItem>
                                        <SelectItem value="ml">Millilitr</SelectItem>
                                        <SelectItem value="litr">Litr</SelectItem>
                                        <SelectItem value="metr">Metr</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Minimal Qoldiq (Ogohlantirish uchun)</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                required 
                                value={formData.minQuantity}
                                onChange={e => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddItem(false)}>Yopish</Button>
                            <Button type="submit">Saqlash</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Transaction (Kirim/Chiqim) Modal */}
            <Dialog open={showTransaction} onOpenChange={setShowTransaction}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {transactionData.type === 'kirim' ? <TrendingUp className="text-emerald-500 w-5 h-5" /> : <TrendingDown className="text-amber-500 w-5 h-5" />}
                            {transactionData.type === 'kirim' ? 'Kirim Qilish' : 'Chiqim Qilish'}
                            <span className="text-muted-foreground font-normal ml-2 text-sm">({selectedItem?.name})</span>
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTransaction} className="space-y-4 py-4">
                        {transactionData.type === 'chiqim' && (
                            <div className="bg-muted p-3 rounded-lg text-sm text-center mb-2">
                                Hozirgi qoldiq: <span className="font-bold">{selectedItem?.quantity} {selectedItem?.unit}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Miqdor ({selectedItem?.unit})</Label>
                            <Input 
                                type="number" 
                                min="0.01" 
                                step="any"
                                required 
                                autoFocus
                                value={transactionData.quantity}
                                onChange={e => setTransactionData({ ...transactionData, quantity: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Izoh (Ixtiyoriy)</Label>
                            <Input 
                                value={transactionData.note}
                                onChange={e => setTransactionData({ ...transactionData, note: e.target.value })}
                                placeholder="Tranzaksiya sababi yoki izoh"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowTransaction(false)}>Bekor qilish</Button>
                            <Button 
                                type="submit" 
                                className={transactionData.type === 'kirim' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}
                            >
                                Tasdiqlash
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
