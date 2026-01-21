// src/jobs/reminders.js
import cron from 'node-cron';
import { Appointment } from '../models/Appointment.js';
import { Patient } from '../models/Patient.js';
import { notifyText } from '../services/notify/index.js';

export function startReminderJobs() {
  if (process.env.ENABLE_CRON !== '1') {
    console.log('[CRON] Disabled (ENABLE_CRON!=1)');
    return;
  }

  console.log('[CRON] Starting reminder jobs…');

  // Har kuni soat 08:00 — bugungi qabul(lar) uchun eslatma
  cron.schedule('0 8 * * *', async () => {
    try {
      const now = new Date();
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);

      const appts = await Appointment.find({
        status: 'scheduled',
        startAt: { $gte: start, $lte: end },
      }).lean();

      for (const a of appts) {
        const p = await Patient.findById(a.patientId).lean();
        if (!p) continue;

        const when = new Date(a.startAt).toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
        });

        try {
          await notifyText({
            patient: p,
            text: `Eslatma: bugun soat ${when} da qabulingiz bor.`,
            smsTo: p.phone,
          });
        } catch {
          // yuborishda xatoni yutamiz (log qo‘shsangiz ham bo‘ladi)
        }
      }

      console.log(`[CRON] Reminders sent for ${appts.length} appointments`);
    } catch (err) {
      console.error('[CRON] Reminder job error:', err);
    }
  }, { timezone: 'Asia/Tashkent' });
}
