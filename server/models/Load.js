const {Schema, model, Types} = require('mongoose');

const schema = new Schema({
  createdBy: {type: Types.ObjectId, required: true, ref: 'User'},
  logs: [{
    message: {type: String, required: true},
    time: {type: Date, default: Date.now},
  }],
  assignedTo: {type: Types.ObjectId, ref: 'User', default: null},
  status: {
    type: String,
    required: true,
    enum: ['NEW', 'POSTED', 'ASSIGNED', 'SHIPPED'],
    default: 'NEW',
  },
  state: {
    type: String,
    enum: [
      'Ready to Pick Up',
      'En route to Pick Up',
      'Arrived to Pick Up',
      'En route to Delivery',
      'Arrived to Delivery',
    ],
    default: 'Ready to Pick Up',
  },
  dimensions: {
    width: {type: Number, required: true, min: 0, max: 1000},
    length: {type: Number, required: true, min: 0, max: 1000},
    height: {type: Number, required: true, min: 0, max: 1000},
  },
  payload: {type: Number, required: true, min: 0, max: 5000},
  pickupAddress: {type: String},
  deliveryAddress: {type: String},
}, {timestamps: true});

module.exports = model('Load', schema);
