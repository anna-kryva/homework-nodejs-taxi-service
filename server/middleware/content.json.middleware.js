const logging = require('../logs/log');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const contype = req.headers['content-type'];

  if (!contype || contype.indexOf('application/json') !== 0) {
      return res.status(400).json({
          status: "Incorrect content-type"
      });
  }

  logging('Info', 'Content-type approved');
  next();
};
