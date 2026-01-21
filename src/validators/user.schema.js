import Joi from 'joi';


export const createUserSchema = Joi.object({
name: Joi.string().min(2).max(100).required(),
email: Joi.string().email().required(),
phone: Joi.string().allow('', null),
role: Joi.string().valid('admin','reception','doctor','accountant').required(),
password: Joi.string().min(6).max(100).required(),
});


export const updateUserSchema = Joi.object({
name: Joi.string().min(2).max(100),
phone: Joi.string().allow('', null),
role: Joi.string().valid('admin','reception','doctor','accountant'),
isActive: Joi.boolean(),
password: Joi.string().min(6).max(100),
});