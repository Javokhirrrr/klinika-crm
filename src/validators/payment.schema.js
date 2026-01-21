import Joi from 'joi';

export const createPaymentSchema = Joi.object({
  patientId: Joi.string().required(),
  appointmentId: Joi.string().optional(),
  amount: Joi.number().positive().required(),
  method: Joi.string().valid('cash', 'card', 'transfer', 'online').required(),
  status: Joi.string().valid('completed', 'pending', 'failed', 'refunded'),
  note: Joi.string().allow('', null),
});

export const listPaymentsQuerySchema = Joi.object({
  patientId: Joi.string(),
  method: Joi.string().valid('cash', 'card', 'transfer', 'online'),
  status: Joi.string().valid('completed', 'pending', 'failed', 'refunded'),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
});
