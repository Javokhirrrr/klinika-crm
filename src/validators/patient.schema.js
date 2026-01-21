import Joi from 'joi';


export const createPatientSchema = Joi.object({
firstName: Joi.string().min(1).max(100).required(),
lastName: Joi.string().min(1).max(100).required(),
phone: Joi.string().min(5).max(50).required(),
email: Joi.string().email().allow('', null),
dob: Joi.date().allow(null),
notes: Joi.string().allow('', null),
});


export const updatePatientSchema = Joi.object({
firstName: Joi.string().min(1).max(100),
lastName: Joi.string().min(1).max(100),
phone: Joi.string().min(5).max(50),
email: Joi.string().email().allow('', null),
dob: Joi.date().allow(null),
notes: Joi.string().allow('', null),
isDeleted: Joi.boolean(),
});