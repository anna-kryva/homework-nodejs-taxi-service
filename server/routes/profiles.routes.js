const express = require('express');
const bcrypt = require('bcryptjs');

const logging = require('../logs/log');
const User = require('../models/User');
const Truck = require('../models/Truck');
const auth = require('../middleware/auth.middleware');
const schemas = require('../validation/profile.schemas');
const validator = require('../middleware/schemas.middleware');

// eslint-disable-next-line new-cap
const router = express.Router();

// GET api/profile
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      logging('Info', 'User is not found.');
      return res.status(200).json({
        status: 'User is not found.',
      });
    }

    logging('Info', 'Information about the user has been sent');
    res.status(200).json({
      status: 'Success',
      user: {
        'user.email': user.email,
        'user.photoLink': user.photoLink,
        'user.firstName': user.firstName,
        'user.lastName': user.lastName,
        'user.role': user.role,
      },
    });
  } catch (e) {
    logging('Error', 'Error during getting user account');
    res.status(500).json({
      status: 'Something went wrong. Try restarting',
    });
  }
});

// PATCH api/profile/email
router.patch(
    '/email',
    auth,
    validator(schemas.updateEmail, 'body'),
    async (req, res) => {
      try {
        const userId = req.user.userId;

        const onLoadTruck = await Truck.findOne(
            {createdBy: userId, status: 'OL'},
        );

        if (onLoadTruck) {
          logging(
              'Error',
              'Forbidden to update email while driver is on load.',
          );
          return res.status(400).json({
            status: 'Forbidden to update email while driver is on load.',
          });
        }

        await User.findByIdAndUpdate(
            userId,
            {email: req.body.email},
        );

        logging('Info', 'Email has been updated');
        res.status(200).json({
          status: 'Email updated successfully',
        });
      } catch (e) {
        logging('Error', 'Error during updating user email');
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

// PATCH api/profile/name
router.patch(
    '/name',
    auth,
    validator(schemas.updateName, 'body'),
    async (req, res) => {
      try {
        const userId = req.user.userId;

        const onLoadTruck = await Truck.findOne(
            {createdBy: userId, status: 'OL'},
        );

        if (onLoadTruck) {
          logging(
              'Error',
              'Forbidden to update name while driver is on load.',
          );
          return res.status(400).json({
            status: 'Forbidden to update name while driver is on load.',
          });
        }

        const {firstName, lastName} = req.body;
        const previousUser = await User.findById(userId);

        await User.findByIdAndUpdate(
            userId,
            {
              firstName: firstName || previousUser.firstName,
              lastName: lastName || previousUser.lastName,
            },
        );

        logging('Info', 'Name has been updated');
        res.status(200).json({
          status: 'Name updated successfully',
        });
      } catch (e) {
        logging('Error', 'Error during updating user name');
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

// PATCH api/profile/reset_password
router.patch(
    '/reset_password',
    auth,
    validator(schemas.updatePassword, 'body'),
    async (req, res) => {
      try {
        const userId = req.user.userId;

        const onLoadTruck = await Truck.findOne(
            {createdBy: userId, status: 'OL'},
        );

        if (onLoadTruck) {
          logging(
              'Error',
              'Forbidden to update account while driver is on load.',
          );
          return res.status(400).json({
            status: 'Forbidden to update account while driver is on load.',
          });
        }

        const {password} = req.body;
        const hashPassword = await bcrypt.hash(password, 12);

        await User.findByIdAndUpdate(
            userId,
            {password: hashPassword},
        );

        logging('Info', 'Information about the user has been updated');
        res.status(200).json({
          status: 'Password changed successfully',
        });
      } catch (e) {
        logging('Error', 'Error during updating user account');
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });


// DELETE api/profile
router.delete('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const onLoadTruck = await Truck.findOne(
        {createdBy: userId, status: 'OL'},
    );

    if (onLoadTruck) {
      logging(
          'Error',
          'Forbidden to delete account while driver is on load.',
      );
      return res.status(400).json({
        status: 'Forbidden to delete account while driver is on load.',
      });
    }

    await User.findByIdAndDelete(userId);
    await Truck.deleteMany({createdBy: userId});

    logging('Info', 'User account has been deleted');
    res.status(200).json({
      status: 'User account deleted successfully',
    });
  } catch (e) {
    logging('Error', 'Error during deleting user account');
    res.status(500).json({
      status: 'Something went wrong. Try restarting',
    });
  }
});

module.exports = router;
