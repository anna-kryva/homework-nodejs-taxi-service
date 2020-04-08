const Joi = require('@hapi/joi');

module.exports = {
  signupForm: Joi.object({
    username: Joi.string()
        .regex(/^[a-z0-9_-]{2,32}$/)
        .min(2)
        .max(32)
        .required(),
    email: Joi.string().email({minDomainSegments: 2}),
    password: Joi.string()
        .regex(/^[a-zA-Z0-9]{6,128}$/)
        .min(6)
        .max(128)
        .required(),
    firstName: Joi.string().max(128),
    lastName: Joi.string().max(128),
    role: Joi.string().insensitive().valid('driver', 'shipper').required(),
  }),

  loginForm: Joi.object({
    username: Joi.string()
        .regex(/^[a-z0-9_-]{2,32}$/)
        .min(2)
        .max(32)
        .required(),
    password: Joi.string().min(6).max(128).required(),
  }),

  emailForm: Joi.object({
    email: Joi.string().email({minDomainSegments: 2}).required(),
  }),

  passwordForm: Joi.object({
    password: Joi.string()
        .regex(/^[a-zA-Z0-9]{6,128}$/)
        .min(6)
        .max(128)
        .required(),
    repeatPassword: Joi.ref('password'),
    token: Joi.string()
        .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)
        .required(),
    userId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
  }).with('password', 'repeatPassword'),

  paramsCheckForm: Joi.object({
    token: Joi.string()
        .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)
        .required(),
    userId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
  }),
};
