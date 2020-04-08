const logging = require('../logs/log');

module.exports = (schema, property) => {
  return async (req, res, next) => {
    if (req.method === 'OPTIONS') {
      next();
    }

    try {
      const validation = await schema.validate(req[property]);
      if (validation.error) {
        logging('Error', validation.error.details[0].message);
        return res.status(400).json({
          error: validation.error.details[0].message,
        });
      }
      next();
    } catch (error) {
      logging('Error', error.details[0].message);
      res.status(400).json({error: error.details[0].message});
    }
  };
};
