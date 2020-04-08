const express = require('express');

const Truck = require('../models/Truck');
const Load = require('../models/Load');
const User = require('../models/User');
const schemas = require('../validation/trucks.schemas');

const auth = require('../middleware/auth.middleware');
const contentType = require('../middleware/content.json.middleware');
const validator = require('../middleware/schemas.middleware');

const logging = require('../logs/log');
const sizeOfTruck = require('./helpers/truck_types.helpers');

// eslint-disable-next-line new-cap
const router = express.Router();


// POST /api/trucks
router.post('/',
    auth,
    contentType,
    validator(schemas.createForm, 'body'),
    async (req, res) => {
      try {
        const driverId = req.user.userId;

        const user = await User.findById(driverId);

        if (user.role != 'driver') {
          logging('Info', 'User is not a driver');
          return res.status(400).json({status: 'The user is not a driver'});
        }

        const {name, type} = req.body;
        const [width, length, height, payload] = sizeOfTruck(type);

        const count = await Truck.countDocuments({driverId});

        if (count >= 50) {
          logging('Info', 'Number of user\'s trucks is more than 50');
          return res.status(400).json({
            status: 'Limit exceeded (50). You cannot add no more trucks.',
          });
        }

        const truck = new Truck({
          name,
          createdBy: driverId,
          type,
          width,
          length,
          height,
          payload,
        });

        await truck.save();
        logging('Info', 'A new truck has been created');
        res.status(200).json({
          status: 'Truck created successfully',
        });
      } catch (e) {
        logging('Error', `Truck hasn't been added, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

// GET /api/trucks
router.get('/',
    auth,
    async (req, res) => {
      try {
        const driverId = req.user.userId;

        const trucks = await Truck.find({createdBy: driverId});

        logging('Info', 'List of trucks has been sent to the driver.');
        res.status(200).json({
          status: "Truck created successfully",
          trucks
        });
      } catch (e) {
        logging('Error', `Loads have not been sent, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });


// PATCH /api/trucks/truckid/assign
router.patch(':id/assign',
    auth,
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const truckId = req.params.id;
        const driverId = req.user.userId;

        const toAssignTruck = await Truck.findById(truckId);
        if (toAssignTruck.createdBy != driverId) {
          logging('Info', 'Access denied.');
          return res.status(403).json({status: 'Access denied.'});
        }

        await Truck.findOneAndUpdate(
            {assignedTo: driverId},
            {assignedTo: null},
        );

        await Truck.findByIdAndUpdate(
            truckId,
            {assignedTo: driverId},
        );

        logging('Info', 'Truck assigned.');
        res.status(200).json({status: 'Truck assigned successfully'});
      } catch (e) {
        logging('Error', `Truck hasn't been assigned, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

// PATCH /api/trucks/truckid/unassign
router.patch('/:id/unassign',
    auth,
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const truckId = req.params.id;
        const driverId = req.user.userId;

        const toUnassignTruck = await Truck.findById(truckId);
        if (toUnassignTruck.createdBy != driverId) {
          logging('Info', 'Access denied.');
          return res.status(403).json({status: 'Access denied.'});
        }

        await Truck.findByIdAndUpdate(
            truckId,
            {assignedTo: null},
        );

        logging('Info', 'Truck has been unassigned.');
        res.status(200).json({status: 'Truck unassigned successfully'});
      } catch (e) {
        logging('Error', `Truck hasn't been unassigned, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

// PATCH /api/trucks/truckid/update
router.patch('/:id/update',
    auth,
    contentType,
    validator(schemas.updateForm, 'body'),
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const truckId = req.params.id;
        const driverId = req.user.userId;

        const toUpdateTruck = await Truck.findById(truckId);
        if (toUpdateTruck.createdBy != driverId) {
          logging('Info', 'Access denied.');
          return res.status(403).json({message: 'Access denied.'});
        }

        const onLoadTruck = await Truck.findOne(
            {createdBy: driverId, status: 'OL'});

        const assignedTruck = await Truck.findOne(
            {_id: truckId, assignedTo: driverId});

        if (onLoadTruck || assignedTruck) {
          logging('Error', 'Truck is assigned or driver is on load');
          return res.status(400).json({
            status:
          'Forbidden to update information.',
          });
        } else {
          await Truck.findByIdAndUpdate(
              truckId,
              {name: req.body.name},
          );

          logging('Info', 'Truck has been updated.');
          res.status(200).json({status: 'Truck updated successfully'});
        }
      } catch (e) {
        logging('Error', `Truck hasn't been updated, ${e}`);
        res.status(500).json({
          message: 'Something went wrong. Try restarting',
        });
      }
    });


// DELETE /api/trucks/truckid/
router.delete('/:id',
    auth,
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const truckId = req.params.id;
        const driverId = req.user.userId;

        const toDeleteTruck = await Truck.findById(truckId);
        if (toDeleteTruck.createdBy != driverId) {
          logging('Info', 'Access denied.');
          return res.status(403).json({status: 'Access denied.'});
        }

        const onLoadTruck = await Truck.findOne(
            {createdBy: driverId, status: 'OL'},
        );

        const assignedTruck = await Truck.findOne(
            {_id: truckId, assignedTo: driverId},
        );

        if (onLoadTruck || assignedTruck) {
          logging('Error', 'Truck is assigned or driver is on load');
          return res.status(400).json({
            message:
          'Forbidden to delete truck.',
          });
        } else {
          await Truck.findByIdAndDelete(truckId);

          logging('Info', 'Truck has been deleted.');
          return res.status(200).json({status: 'Truck deleted successfully'});
        }
      } catch (e) {
        logging('Error', `Truck hasn't been deleted, ${e}`);
        res.status(500).json({
          message: 'Something went wrong. Try restarting',
        });
      }
    });


module.exports = router;
