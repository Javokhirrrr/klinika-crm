import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SimpleCalendar() {
    return (
        <div className="space-y-8 animate-fade-in pb-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
                        Kalendar
                        <Badge variant="secondary" className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-bold border-purple-100">
                            Tez Orada
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Qabullar va shifokorlar ish jadvali</p>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative min-h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400 opacity-20 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <CardContent className="relative z-10 flex flex-col items-center text-center p-10 max-w-2xl mx-auto">
                    <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-inner ring-1 ring-white/30">
                        <CalendarIcon className="h-10 w-10 text-white" />
                    </div>

                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Katta o'zgarishlar kutilmoqda!</h2>

                    <p className="text-lg md:text-xl text-indigo-50 font-medium leading-relaxed max-w-lg mx-auto">
                        Biz mukammal kalendar tizimini ishlab chiqmoqdamiz. Tez orada siz qabullarni, shifokorlar jadvalini va bo'sh vaqtlarni osonlik bilan boshqarishingiz mumkin bo'ladi.
                    </p>

                    <div className="mt-10 flex gap-4">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-2 uppercase tracking-widest text-xs font-bold backdrop-blur-sm">
                            Rivojlanishda
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
