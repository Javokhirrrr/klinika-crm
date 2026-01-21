// src/controllers/appointments.flow.controller.js
import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { notifyCashier, sendTg } from '../services/telegram.js';

function msFromMin(m){ return m * 60 * 1000; }

async function totalDurationMin(serviceIds){
  if(!serviceIds?.length) return 0;
  const rows = await Service.find({ _id: { $in: serviceIds } })
                            .select('durationMin').lean();
  return rows.reduce((s,r)=> s + (r.durationMin || 0), 0);
}

// Reception: navbatga qo‘yish (ixtiyoriy, agar create paytida waiting bo‘lib yaratilmasa)
export async function toWaiting(req,res){
  const a = await Appointment.findByIdAndUpdate(req.params.id,
    { $set: { status: 'waiting' } }, { new:true }).lean();
  if(!a) return res.status(404).json({message:'Not found'});
  return res.json({ ok:true });
}

// Doctor: START
export async function startAppointment(req,res){
  const a = await Appointment.findById(req.params.id).lean();
  if(!a) return res.status(404).json({message:'Not found'});
  if(a.status !== 'waiting' && a.status !== 'scheduled')
    return res.status(400).json({message:'Not in waiting'});

  const durMin = await totalDurationMin(a.serviceIds || []);
  const startAt = new Date();
  const expectedEndAt = new Date(startAt.getTime() + msFromMin(durMin || 0));

  const upd = await Appointment.findByIdAndUpdate(a._id, {
    $set: { status:'in_progress', startAt, expectedEndAt }
  }, { new:true }).lean();

  // (ixtiyoriy) bemorga TGdan xabar
  // await sendTg(patientChatId, `Qabul boshlandi ...`);

  return res.json({ ok:true, startAt: upd.startAt, expectedEndAt: upd.expectedEndAt, durationMin: durMin });
}

// Doctor: FINISH (yakunlash, kassirga signal)
export async function finishAppointment(req,res){
  const a = await Appointment.findById(req.params.id).lean();
  if(!a) return res.status(404).json({message:'Not found'});
  if(a.status !== 'in_progress')
    return res.status(400).json({message:'Not in progress'});

  const finishedAt = new Date();
  const upd = await Appointment.findByIdAndUpdate(a._id, {
    $set: { status:'done', finishedAt }
  }, { new:true }).lean();

  // Summani hisoblash — xizmatlar yig‘indisi
  const services = await Service.find({ _id: { $in: upd.serviceIds } }).select('name price').lean();
  const amount = services.reduce((s,x)=> s + (x.price || 0), 0);

  // Kassirga TG xabar
  const lines = services.map(s=>`• ${s.name} — <b>${(s.price||0).toLocaleString('uz-UZ')} so'm</b>`).join('\n');
  await notifyCashier(
    `🧑‍⚕️ <b>Qabul yakunlandi</b>\n`+
    `ID: <code>${upd._id}</code>\n`+
    `To'lov: <b>${amount.toLocaleString('uz-UZ')} so'm</b>\n\n${lines}\n\n`+
    `Kassada “To'lov qabul qilish”ni bosing.`
  );

  return res.json({ ok:true, amount, appointmentId: upd._id });
}

// Cashier: PAID
export async function markPaid(req,res){
  const a = await Appointment.findById(req.params.id).lean();
  if(!a) return res.status(404).json({message:'Not found'});
  if(a.status !== 'done') return res.status(400).json({message:'Not payable'});

  await Appointment.findByIdAndUpdate(a._id, { $set: { status:'paid' } });

  // (ixtiyoriy) bemorga “to‘lov qabul qilindi” TG xabari
  // await sendTg(patientChatId, 'To‘lov qabul qilindi, rahmat!');

  return res.json({ ok:true });
}

// Doktor doskasi uchun agregatsiya
export async function doctorBoard(req,res){
  const doctorId = req.query.doctorId;
  if(!doctorId) return res.status(400).json({message:'doctorId required'});

  const [waiting, inProgress, doneUnpaid, paid] = await Promise.all([
    Appointment.find({ doctorId, status: { $in:['waiting','scheduled'] } }).sort({ createdAt:1 }).lean(),
    Appointment.find({ doctorId, status: 'in_progress' }).sort({ startAt:1 }).lean(),
    Appointment.find({ doctorId, status: 'done' }).sort({ finishedAt:-1 }).lean(),
    Appointment.find({ doctorId, status: 'paid' }).sort({ updatedAt:-1 }).lean(),
  ]);

  res.json({ waiting, inProgress, doneUnpaid, paid });
}
