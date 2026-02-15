import { Schema, model } from 'mongoose';

const appointmentSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },

  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],

  date: { type: String, required: true, index: true }, // Format: "YYYY-MM-DD"
  startAt: Date,
  endAt: Date,

  status: {
    type: String,
    enum: ['scheduled', 'waiting', 'in_progress', 'done', 'paid', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  isPaid: { type: Boolean, default: false },

  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Enhanced Fields
  appointmentType: {
    type: String,
    enum: ['in_person', 'telemedicine', 'home_visit'],
    default: 'in_person'
  },

  // Recurring Appointments
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    interval: { type: Number },  // Every X days/weeks/months
    endDate: { type: Date },
    occurrences: { type: Number }
  },
  parentAppointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },

  // Reminders
  remindersSent: [{
    type: { type: String, enum: ['sms', 'telegram', 'email'] },
    sentAt: { type: Date },
    status: { type: String, enum: ['sent', 'delivered', 'failed'] },
    errorMessage: { type: String }
  }],

  // Booking Source
  onlineBooking: { type: Boolean, default: false },
  bookingSource: { type: String, enum: ['admin', 'reception', 'online', 'mobile'], default: 'admin' },

  // Cancellation
  cancellationReason: { type: String, trim: true },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },

  // Pricing
  price: { type: Number, min: 0 },
  deposit: { type: Number, min: 0 },

  // Telemedicine
  meetingLink: { type: String, trim: true },
  meetingPassword: { type: String, trim: true }
}, { timestamps: true });

appointmentSchema.index({ orgId: 1, doctorId: 1, startAt: 1, endAt: 1, status: 1 });
appointmentSchema.index({ orgId: 1, patientId: 1, startAt: 1 });

export const Appointment = model('Appointment', appointmentSchema);
