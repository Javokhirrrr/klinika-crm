import express from 'express';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// ─── ICD-10 kodlari ro'yxati (eng ko'p ishlatiladigan) ──────────────────────
// Kelajakda tashqi API bilan almashtirish mumkin
const ICD10_CODES = [
    // Yurak-qon tomir
    { code: 'I10', title: 'Gipertoniya (Arterial bosim oshishi)', category: 'Yurak-qon tomir' },
    { code: 'I20', title: 'Stenokardiya', category: 'Yurak-qon tomir' },
    { code: 'I21', title: 'Miokard infarkti', category: 'Yurak-qon tomir' },
    { code: 'I25', title: 'Surunkali ishemik yurak kasalligi', category: 'Yurak-qon tomir' },
    { code: 'I48', title: 'Yurak fibrillatsiyasi va tripilyatsiyasi', category: 'Yurak-qon tomir' },
    { code: 'I50', title: 'Yurak yetishmovchiligi', category: 'Yurak-qon tomir' },

    // Nafas yo'llari
    { code: 'J00', title: 'Assoqi nafas yo\'l infeksiyasi (Shamollash)', category: 'Nafas' },
    { code: 'J06', title: 'Yuqori nafas yo\'llarining o\'tkir infeksiyasi', category: 'Nafas' },
    { code: 'J11', title: 'Gripp', category: 'Nafas' },
    { code: 'J18', title: 'Pnevmoniya', category: 'Nafas' },
    { code: 'J20', title: 'O\'tkir bronxit', category: 'Nafas' },
    { code: 'J45', title: 'Bronxial astma', category: 'Nafas' },
    { code: 'J30', title: 'Allergik rinit', category: 'Nafas' },

    // Hazm qilish
    { code: 'K21', title: 'Kislota reflyuksi (GERX)', category: 'Hazm qilish' },
    { code: 'K25', title: 'Oshqozon yarasi', category: 'Hazm qilish' },
    { code: 'K26', title: 'O\'n ikki barmoqli ichak yarasi', category: 'Hazm qilish' },
    { code: 'K29', title: 'Gastrit', category: 'Hazm qilish' },
    { code: 'K35', title: 'O\'tkir appenditsit', category: 'Hazm qilish' },
    { code: 'K37', title: 'Appenditsit', category: 'Hazm qilish' },
    { code: 'K57', title: 'Divertikulez', category: 'Hazm qilish' },
    { code: 'K80', title: 'O\'t tosh kasalligi', category: 'Hazm qilish' },

    // Endokrin
    { code: 'E11', title: 'II tur qandli diabet', category: 'Endokrin' },
    { code: 'E10', title: 'I tur qandli diabet', category: 'Endokrin' },
    { code: 'E03', title: 'Gipotireoz', category: 'Endokrin' },
    { code: 'E05', title: 'Gipертireoz', category: 'Endokrin' },
    { code: 'E66', title: 'Semirishlik (Obesitet)', category: 'Endokrin' },

    // Asab tizimi
    { code: 'G43', title: 'Migren', category: 'Asab tizimi' },
    { code: 'G40', title: 'Epilepsiya', category: 'Asab tizimi' },
    { code: 'G20', title: 'Parkinson kasalligi', category: 'Asab tizimi' },
    { code: 'G35', title: 'Ko\'p skleroz', category: 'Asab tizimi' },

    // Tayanch-harakat
    { code: 'M10', title: 'Podagra', category: 'Tayanch-harakat' },
    { code: 'M15', title: 'Poliartoз (bo\'g\'im kasalligi)', category: 'Tayanch-harakat' },
    { code: 'M25', title: 'Bo\'g\'im og\'rig\'i (Artralgia)', category: 'Tayanch-harakat' },
    { code: 'M41', title: 'Skolioz', category: 'Tayanch-harakat' },
    { code: 'M48', title: 'Umurtqa pog\'onasi kasalliklari', category: 'Tayanch-harakat' },
    { code: 'M54', title: 'Bel og\'rig\'i', category: 'Tayanch-harakat' },
    { code: 'M79', title: 'Yumshoq to\'qimalar kasalliklari', category: 'Tayanch-harakat' },

    // Psixiatrik
    { code: 'F32', title: 'Depressiya', category: 'Psixiatrik' },
    { code: 'F33', title: 'Takrorlanuvchi depressiv kasallik', category: 'Psixiatrik' },
    { code: 'F40', title: 'Fobik tashvish buzilishlari', category: 'Psixiatrik' },
    { code: 'F41', title: 'Tashvish buzilishlari', category: 'Psixiatrik' },

    // Infeksion
    { code: 'A09', title: 'Gastroenterit (Diareya)', category: 'Infeksion' },
    { code: 'A15', title: 'Sil kasalligi', category: 'Infeksion' },
    { code: 'A49', title: 'Bakterial infeksiya', category: 'Infeksion' },
    { code: 'B34', title: 'Virusli infeksiya', category: 'Infeksion' },

    // Siydik-tanosil
    { code: 'N18', title: 'Surunkali buyrak yetishmovchiligi', category: 'Siydik-tanosil' },
    { code: 'N20', title: 'Buyrak toshi', category: 'Siydik-tanosil' },
    { code: 'N39', title: 'Siydik yo\'li infeksiyasi', category: 'Siydik-tanosil' },

    // Ko'z
    { code: 'H10', title: 'Konyunktivit', category: 'Ko\'z' },
    { code: 'H25', title: 'Katarakta', category: 'Ko\'z' },
    { code: 'H40', title: 'Glaukoma', category: 'Ko\'z' },

    // Quloq
    { code: 'H66', title: 'O\'tkir o\'rta quloq yallig\'lanishi', category: 'Quloq' },
    { code: 'H81', title: 'Vestibular kasallik (Bosh aylanishi)', category: 'Quloq' },

    // Tери / Dermatologiya
    { code: 'L20', title: 'Atopik ekzema', category: 'Teri' },
    { code: 'L30', title: 'Dermatit', category: 'Teri' },
    { code: 'L40', title: 'Psoriaz', category: 'Teri' },
    { code: 'L50', title: 'Eshakemi (Krapivnitsa)', category: 'Teri' },

    // Onkologiya
    { code: 'C50', title: 'Ko\'krak bezi raki', category: 'Onkologiya' },
    { code: 'C61', title: 'Prostata bezi raki', category: 'Onkologiya' },
    { code: 'C34', title: 'O\'pka raki', category: 'Onkologiya' },
    { code: 'C18', title: 'Yo\'g\'on ichak raki', category: 'Onkologiya' },

    // Jarohat / Travma
    { code: 'S00', title: 'Bosh suyagi yuzasi jarohati', category: 'Travma' },
    { code: 'S52', title: 'Bilak suyagi sinishi', category: 'Travma' },
    { code: 'S72', title: 'Son suyagi sinishi', category: 'Travma' },
    { code: 'T14', title: 'Tananing noma\'lum qismida jarohat', category: 'Travma' },
];

/**
 * GET /api/icd10/search?q=diabet
 * ICD-10 kodi yoki nomni qidirish
 */
router.get('/search', (req, res) => {
    const q = (req.query.q || '').toLowerCase().trim();
    const category = req.query.category || '';

    if (!q && !category) {
        return res.json({ data: ICD10_CODES.slice(0, 20) });
    }

    let results = ICD10_CODES.filter(item => {
        const matchesQ = !q ||
            item.code.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q);
        const matchesCat = !category || item.category === category;
        return matchesQ && matchesCat;
    });

    res.json({
        data: results.slice(0, 30),
        total: results.length,
    });
});

/**
 * GET /api/icd10/categories
 * Kategoriyalar ro'yxati
 */
router.get('/categories', (req, res) => {
    const categories = [...new Set(ICD10_CODES.map(c => c.category))];
    res.json({ data: categories });
});

/**
 * GET /api/icd10/:code
 * Aniq kod bo'yicha ma'lumot
 */
router.get('/:code', (req, res) => {
    const code = ICD10_CODES.find(c => c.code === req.params.code.toUpperCase());
    if (!code) return res.status(404).json({ message: 'Kod topilmadi' });
    res.json({ data: code });
});

export default router;
