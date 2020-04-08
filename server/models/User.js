const {Schema, model} = require('mongoose');

const schema = new Schema({
  username: {type: String, required: true},
  email: {type: String, unique: true},
  password: {type: String, required: true},
  firstName: {type: String, default: 'User'},
  lastName: {type: String, default: ''},
  photoLink: {type: String, default: ''},
  s3Key: {type: String, default: ''},
  role: {type: String, required: true, enum: ['driver', 'shipper']},
}, {timestamps: true});

module.exports = model('User', schema);
