const {Schema, model, Types} = require('mongoose');

const schema = new Schema({
  name: {type: String, default: 'Truck'},
  createdBy: {type: Types.ObjectId, required: true, ref: 'User'},
  assignedTo: {type: Types.ObjectId, ref: 'User', default: null},
  status: {type: String, enum: ['IS', 'OL'], default: 'IS'},
  type: {
    type: String,
    required: true,
    enum: ['SPRINTER', 'SMALL STRAIGHT', 'LARGE STRAIGHT'],
  },
  width: {type: Number, required: true, min: 0, max: 1000},
  length: {type: Number, required: true, min: 0, max: 1000},
  height: {type: Number, required: true, min: 0, max: 1000},
  payload: {type: Number, required: true, min: 0, max: 5000},
}, {timestamps: true});

module.exports = model('Truck', schema);
