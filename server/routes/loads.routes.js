const express = require('express');

const Load = require('../models/Load');
const User = require('../models/User');
const Truck = require('../models/Truck');
const schemas = require('../validation/loads.schemas');

const auth = require('../middleware/auth.middleware');
const contentType = require('../middleware/content.json.middleware');
const validator = require('../middleware/schemas.middleware');
const findTruck = require('../middleware/loads.middleware');

const logging = require('../logs/log');

// eslint-disable-next-line new-cap
const router = express.Router();

// POST /api/loads
router.post('/',
    auth,
    contentType,
    validator(schemas.createForm, 'body'),
    async (req, res) => {
      try {
        const shipperId = req.user.userId;

        const user = await User.findById(shipperId);

        if(!user) {
          logging('Info', 'User is not found.');
          return res.status(200).json({
            status: 'User is not found.',
          });
        }

        if (user.role != 'shipper') {
          logging('Info', 'User is not a shipper');
          return res.status(400).json({status: 'User is not a shipper'});
        }

        const {dimensions, payload} = req.body;
        const {pickupAddress, deliveryAddress} = req.body;
        const logs = [{
          message: 'Load created',
          time: Date.now()
        }];

        const load = new Load({
          createdBy: shipperId,
          dimensions,
          payload,
          pickupAddress,
          deliveryAddress,
          logs
        });

        await load.save();

        logging('Info', 'Load created successfully');
        res.status(200).json({
          status: 'Load created successfully',
        });
      } catch (e) {
        logging('Error', `Load hasn't been added, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });


// GET /api/loads
router.get('/',
    auth,
    async (req, res) => {
      try {
        const userId = req.user.userId;
        let loads;

        const user = await User.findById(userId);

        if(!user) {
          logging('Info', 'User is not found.');
          return res.status(200).json({
            status: 'User is not found.',
          });
        }

        if(user.role === 'driver') {
          loads = await Load.find({
            assignedTo: userId, 
            status: 'ASSIGNED'
          });
        } else {
          loads = await Load.find({createdBy: userId});
        }

        if (!loads) {
          logging('Info', 'List of loads is empty.');
          return res.status(200).json({
            status: 'You do not have any loads yet.',
            loads: []
          });
        }

        const outputLoads = loads.map((load) => {
          return {
            '_id': load._id,
            'assigned_to': load.assignedTo || 'Not assigned',
            'created_by': load.createdBy,
            'status': load.status,
            'state': load.state,
            'logs': load.logs,           
            'dimensions': {
              'width': load.dimensions.width,
              'length': load.dimensions.length,
              'height': load.dimensions.height,
            },
            'payload': load.payload,
            'created_at': load.createdAt,
            'pickup_address': load.pickupAddress,
            'delivery_address': load.deliveryAddress,
          };
        });

        logging('Info', 'List of loads has been sent to the shipper.');
        res.status(200).json({
          status: "Success",
          "loads": outputLoads
        });
      } catch (e) {
        logging('Error', `Loads have not been sent, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });


// GET /api/loads/loadId
router.get('/:id',
    auth,
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const loadId = req.params.id;
        const userId = req.user.userId;

        const load = await Load.findById(loadId);

        if (!load) {
          logging('Error', 'The load does not exist');
          return res.status(400).json({
            status: 'The load does not exist',
          });
        }

        if (load.createdBy != userId 
          || load.assignedTo != userId) {
            logging('Info', 'Access denied');
            return res.status(403).json({status: 'Access denied'});
        }

        const shipment = {
          'id': load._id,
          'status': load.status,
          'state': load.state,
          'dimensions': {
            'width': load.dimensions.width,
            'length': load.dimensions.length,
            'height': load.dimensions.height,
          },
          'payload': load.payload,
          'created_at': load.createdAt,
          'logs': load.logs,
          'pickup_address': load.pickupAddress,
          'delivery_address': load.deliveryAddress,
        };

        if (load.assignedTo) {
          const driver = await User.findById(load.assignedTo);
          shipment['assigned_to'] = load.assignedTo;
          shipment['driver_email'] = driver.email;
        } else {
          shipment['assigned_to'] = 'Not assigned';
        }

        logging('Info', 'Info about the load has been sent');
        res.status(200).json({
          status: 'Success',
          shipment
        });
      } catch (e) {
        logging('Error', `Shipment info has not been sent, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });


// PUT /api/loads/loadId/info
router.put('/:id/info',
    auth,
    contentType,
    validator(schemas.updateForm, 'body'),
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const loadId = req.params.id;
        const shipperId = req.user.userId;

        const previousLoad = await Load.findById(loadId);

        if (!previousLoad) {
          logging('Info', 'This load does not exist');
          return res.status(400).json({status: 'This load does not exist'});
        }

        if (previousLoad.createdBy != shipperId) {
          logging('Info', 'Access denied');
          return res.status(403).json({status: 'Access denied'});
        }

        if (previousLoad.status !== 'NEW') {
          logging(
              'Info',
              'Cannot update info about the load. Its status is not new.',
          );
          return res.status(400).json({
            message:
            'Cannot update info about the load. Its status is not new.',
          });
        }

        const update = {
          dimensions: {
            width: req.body.dimensions.width ||
              previousLoad.dimensions.width,
            length: req.body.dimensions.length ||
              previousLoad.dimensions.length,
            height: req.body.dimensions.height ||
              previousLoad.dimensions.height,
          },
          payload: req.body.payload || previousLoad.payload,
          pickupAddress: req.body.pickupAddress ||
            previousLoad.pickupAddress,
          deliveryAddress: req.body.deliveryAddress ||
            previousLoad.deliveryAddress,
        };

        await Load.findByIdAndUpdate(loadId, update);

        logging('Info', 'Info about the load is updated.');
        res.status(200).json({
          status: 'Load information updated successfully.',
        });
      } catch (e) {
        logging('Error', `Load has not been updated, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });


// PATCH /api/loads/loadId/post
router.patch('/:id/post',
    auth,
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const loadId = req.params.id;
        const shipperId = req.user.userId;

        const previousLoad = await Load.findById(loadId);

        if (!previousLoad) {
          logging('Info', 'This load does not exist');
          return res.status(400).json({status: 'This load does not exist'});
        }

        if (previousLoad.createdBy != shipperId) {
          logging('Info', 'Access denied');
          return res.status(403).json({status: 'Access denied'});
        }

        if (previousLoad.status !== 'NEW') {
          logging(
              'Info',
              'Cannot post the load because its status is not new.',
          );
          return res.status(400).json({
            status: 'Cannot post the load. Its status is not new.',
          });
        }

        await Load.findByIdAndUpdate(loadId, {status: 'POSTED'});
        logging('Info', 'The load has been posted.');

        const truckState = findTruck(loadId);

        truckState.then((truck) => {
          if (truck.state === 'No truck') {
            return res.status(200).json({
              status: 'No drivers found',
            });
          } else if (truck.state === 'En route') {
            return res.status(200).json({
              status: 'Load posted successfully',
              assigned_to: truck.driverId 
            });
          } else {
            return res.status(400).json({
              status: 'Something went wrong. Try restarting.'
            });
          }
        });
      } catch (e) {
        logging('Error', `Load has not been posted, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

// PATCH /api/loads/loadId/state
router.patch('/:id/state',
    auth,
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const loadId = req.params.id;
        const driverId = req.user.userId;

        const load = await Load.findById(loadId);

        if (!load) {
          logging('Info', 'This load does not exist');
          return res.status(400).json({status: 'This load does not exist'});
        }

        if (load.assignedTo != driverId) {
          logging('Info', 'Access denied');
          return res.status(403).json({status: 'Access denied'});
        }

        if (load.status !== 'ASSIGNED') {
          logging('Info', 'Forbidden to change state');
          return res.status(400).json({
            status: 'Forbidden to change state'
          });
        }
        
        let newState;

        switch(load.state) {
          case 'Ready to Pick Up':
            newState = 'En route to Pick Up';
            break;
          case 'En route to Pick Up':
            newState = 'Arrived to Pick Up';
            break;
          case 'Arrived to Pick Up':
            newState = 'En route to Delivery';
            break;
          case 'En route to Delivery':
            newState = 'Arrived to Delivery';
            break;
          case 'Arrived to Delivery':
            newState = null;
            break;
          default: 
            newState = null;
            break;
        }

        if(!newState) {
          logging(
            'Info', 
            'Load is already arrived to delivery'
          );
          return res.status(200).json({
            status: 'Load is already arrived to delivery',
          });
        }

        const update = {
          state: newState,
          $push: {
            logs: {
              message:
              `Current state of load is ${newState}`,
              time: Date.now(),
            },
          },
        };

        if (newState === 'Arrived to Delivery') {
          update['status'] = 'SHIPPED';

          await Truck.findOneAndUpdate(
              {createdBy: driverId},
              {status: 'IS'},
          );
        }

        await Load.findByIdAndUpdate(
            loadId,
            update,
        );

        logging('Info', 'Load status changed successfully');
        res.status(200).json({
          status: 'Load status changed successfully',
        });
      } catch (e) {
        logging('Error', `Load has not been posted, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });


// DELETE /api/loads/loadId
router.delete('/:id',
    auth,
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const loadId = req.params.id;
        const shipperId = req.user.userId;

        const previousLoad = await Load.findById(loadId);

        if (!previousLoad) {
          logging('Info', 'This load does not exist');
          return res.status(400).json({
            message: 'This load does not exist'
          });
        }

        if (previousLoad.createdBy != shipperId) {
          logging('Info', 'Access denied');
          return res.status(403).json({message: 'Access denied'});
        }

        if (previousLoad.status !== 'NEW') {
          logging(
              'Info',
              'Cannot delete the load because its status in not new',
          );
          return res.status(400).json({
            status: 'Cannot delete the load. Its status is not new.',
          });
        }

        await Load.findByIdAndDelete(loadId);

        logging('Info', 'Load has been deleted.');
        res.status(200).json({
          status: 'Load has been successfully deleted.',
        });
      } catch (e) {
        logging('Error', `Load has not been deleted, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

module.exports = router;
