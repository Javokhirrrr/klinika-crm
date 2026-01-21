// src/validators/appointment.schema.js
import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId');

export const createAppointmentSchema = Joi.object({
  patientId: objectId.required(),
  doctorId: objectId.required(),
  serviceIds: Joi.array().items(objectId).min(1).required(),
  startAt: Joi.date().iso().required(),
  endAt: Joi.date().iso().required(),
  notes: Joi.string().allow('', null),
  status: Joi.string().valid('scheduled', 'done', 'cancelled', 'no_show').default('scheduled'),
});

export const updateAppointmentSchema = Joi.object({
  patientId: objectId,
  doctorId: objectId,
  serviceIds: Joi.array().items(objectId).min(1),
  startAt: Joi.date().iso(),
  endAt: Joi.date().iso(),
  notes: Joi.string().allow('', null),
  status: Joi.string().valid('scheduled', 'done', 'cancelled', 'no_show'),
}).min(1);
