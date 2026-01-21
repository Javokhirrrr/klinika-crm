import Joi from 'joi';



export const createServiceSchema = Joi.object({
name: Joi.string().min(1).max(200).required(),
description: Joi.string().allow('', null),
price: Joi.number().min(0).required(),
durationMinutes: Joi.number().integer().min(1).required(),
});


export const updateServiceSchema = Joi.object({
name: Joi.string().min(1).max(200),
description: Joi.string().allow('', null),
price: Joi.number().min(0),
durationMinutes: Joi.number().integer().min(1),
});