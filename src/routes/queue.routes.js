import express from 'express';
import * as queueController from '../controllers/queue.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// ─── Staff routes ──────────────────────────────────────────────────────────────
router.post('/join', authenticate, authorize(['owner', 'admin', 'reception']), queueController.joinQueue);
router.get('/current', authenticate, queueController.getCurrentQueue);
router.get('/stats', authenticate, queueController.getQueueStats);
router.get('/doctor/:doctorId/stats', authenticate, queueController.getDoctorStats);

// ─── Operator actions — PUT (eski) + POST (yangi frontend uchun) ───────────────
router.put('/:id/call', authenticate, authorize(['owner', 'admin', 'reception', 'doctor']), queueController.callPatient);
router.post('/:id/call', authenticate, authorize(['owner', 'admin', 'reception', 'doctor']), queueController.callPatient);
router.put('/:id/start', authenticate, authorize(['owner', 'admin', 'doctor']), queueController.startService);
router.post('/:id/start', authenticate, authorize(['owner', 'admin', 'doctor']), queueController.startService);
router.put('/:id/complete', authenticate, authorize(['owner', 'admin', 'doctor']), queueController.completeService);
router.post('/:id/complete', authenticate, authorize(['owner', 'admin', 'doctor']), queueController.completeService);
router.put('/:id/cancel', authenticate, authorize(['owner', 'admin', 'reception']), queueController.cancelQueue);
router.post('/:id/cancel', authenticate, authorize(['owner', 'admin', 'reception']), queueController.cancelQueue);
router.put('/:id/priority', authenticate, authorize(['owner', 'admin']), queueController.changePriority);

// ─── Kiosk QR — bemor telefoni bilan navbat URL oladi ─────────────────────────
router.get('/kiosk-qr', authenticate, async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const origin = req.headers.origin || process.env.WEBAPP_URL || 'https://zyra.uz';
        const kioskUrl = `${origin}/kiosk?orgId=${orgId}`;
        try {
            const QRCode = (await import('qrcode')).default;
            const qrImage = await QRCode.toDataURL(kioskUrl, { width: 280, margin: 1 });
            return res.json({ url: kioskUrl, qrImage, orgId });
        } catch {
            return res.json({ url: kioskUrl, qrImage: null, orgId });
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ─── PUBLIC routes (auth siz) ─────────────────────────────────────────────────
router.get('/public/display', queueController.getPublicDisplay);
router.get('/public/status/:queueId', queueController.getQueueStatus);
router.get('/my-position', queueController.getMyPosition);

// ─── QR-kod generatsiyasi ─────────────────────────────────────────────────────
router.post('/:id/qr', authenticate, queueController.generateQueueQR);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.delete('/clear-old', authenticate, authorize(['owner', 'admin']), queueController.clearOldEntries);

export default router;
