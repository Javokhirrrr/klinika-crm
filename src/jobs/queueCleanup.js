// src/jobs/queueCleanup.js
// Har kuni tunda eski navbat yozuvlarini tozalaydi (performance uchun)
import cron from 'node-cron';
import { QueueEntry } from '../models/QueueEntry.js';

export function startQueueCleanupJob() {
  // Har kuni soat 02:00 da ishlaydi
  cron.schedule('0 2 * * *', async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 1); // 1 kundan eski completed/cancelled yozuvlar

      const result = await QueueEntry.deleteMany({
        status: { $in: ['completed', 'cancelled', 'no_show'] },
        createdAt: { $lt: cutoff }
      });

      console.log(`[CRON] Queue cleanup: ${result.deletedCount} ta eski yozuv o'chirildi`);
    } catch (err) {
      console.error('[CRON] Queue cleanup error:', err);
    }
  }, { timezone: 'Asia/Tashkent' });

  // Har kuni soat 23:30 da — kechqurun yakunlanmagan navbatlarni avtomatik yakunlash
  cron.schedule('30 23 * * *', async () => {
    try {
      const result = await QueueEntry.updateMany(
        { status: { $in: ['waiting', 'called', 'in_service'] } },
        { $set: { status: 'completed', completedAt: new Date(), autoCompleted: true } }
      );
      console.log(`[CRON] End-of-day auto-complete: ${result.modifiedCount} ta navbat yakunlandi`);
    } catch (err) {
      console.error('[CRON] End-of-day queue complete error:', err);
    }
  }, { timezone: 'Asia/Tashkent' });

  console.log('[CRON] Queue cleanup jobs started');
}
