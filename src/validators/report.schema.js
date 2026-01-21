import Joi from 'joi';
export const revenueQuerySchema = Joi.object({
from: Joi.date().iso().optional(),
to: Joi.date().iso().optional(),
groupBy: Joi.string().valid('day','month','doctor').default('day'),
});
export const topServicesQuerySchema = Joi.object({
from: Joi.date().iso().optional(),
to: Joi.date().iso().optional(),
limit: Joi.number().integer().min(1).max(100).default(10),
});