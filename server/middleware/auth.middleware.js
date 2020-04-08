const jwt = require('jsonwebtoken');
const config = require('config');
const logging = require('../logs/log');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      logging('Error', 'User is unauthorized');
      return res.status(401).json({message: 'Unauthorized'});
    }

    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded;

    logging('Info', 'Token decoded');
    next();
  } catch (e) {
    logging('Error', 'User is unauthorized');
    res.status(401).json({status: 'Unauthorized'});
  }
};
