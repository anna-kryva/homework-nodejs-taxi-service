const Joi = require('@hapi/joi');

module.exports = {
  updateEmail: Joi.object({
    email: Joi.string()
        .email({minDomainSegments: 2})
        .required(),
  }),

  updateName: Joi.object({
    firstName: Joi.string().max(128),
    lastName: Joi.string().max(128),
  }),

  updatePassword: Joi.object({
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .min(6)
        .max(128)
        .required(),
    repeatPassword: Joi.ref('password'),
  }).with('password', 'repeatPassword'),
};
