const Joi = require('@hapi/joi');

module.exports = {
  createForm: Joi.object({
    name: Joi.string().max(64),
    type: Joi.string()
        .valid('SPRINTER', 'SMALL STRAIGHT', 'LARGE STRAIGHT')
        .required(),
  }),

  paramsCheckForm: Joi.object({
    id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/),
  }),

  updateForm: Joi.object({
    name: Joi.string().max(64).required(),
  }),
};
