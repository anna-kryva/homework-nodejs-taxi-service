const Joi = require('@hapi/joi');

module.exports = {
  createForm: Joi.object({
    dimensions: Joi.object({
      width: Joi.number().max(1000).min(0).required(),
      length: Joi.number().max(1000).min(0).required(),
      height: Joi.number().max(1000).min(0).required(),
    }),
    payload: Joi.number().max(5000).min(0).required(),
    pickupAddress: Joi.string(),
    deliveryAddress: Joi.string(),
  }),

  paramsCheckForm: Joi.object({
    id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
  }),

  updateForm: Joi.object({
    dimensions: Joi.object({
      width: Joi.number().max(1000).min(0),
      length: Joi.number().max(1000).min(0),
      height: Joi.number().max(1000).min(0),
    }),
    payload: Joi.number().max(5000).min(0),
    pickupAddress: Joi.string(),
    deliveryAddress: Joi.string(),
  }),
};
