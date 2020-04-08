const express = require('express');
const bcrypt = require('bcryptjs');

const logging = require('../logs/log');

const User = require('../models/User');
const Truck = require('../models/Truck');

const auth = require('../middleware/auth.middleware');
const contentType = require('../middleware/content.json.middleware');
const schemas = require('../validation/profile.schemas');
const validator = require('../middleware/schemas.middleware');

// eslint-disable-next-line new-cap
const router = express.Router();

/**
 * @api {get} /api/profile Profile information.
 * @apiName GetProfile
 * @apiGroup Profile
 *
 * @apiHeader {String} authorization Authorization value.
 * @apiHeaderExample {json} Content-type header example:
 *           { "Authorization": "JWT fnawilfmnaiwngainegnwegneiwngoiwe" }
 *
 * @apiSuccess {String} status Operation status.
 * @apiSuccess {Object} status Operation result.
 * @apiSuccessExample {json} Success response example:
 *                  {
 *                    "status": "Success",
 *                    "user": 
 *                     {
 *                      "email": "anna@gmail.com",
 *                      "photoLink": "https://s3-us-west-2.amazonaws.com/...",
 *                      "firstName": "Anna",
 *                      "lastName": "Kryva",
 *                      "role": "shipper",
 *                      }
 *                   }
 */
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
        'email': user.email,
        'photoLink': user.photoLink,
        'firstName': user.firstName,
        'lastName': user.lastName,
        'role': user.role,
      },
    });
  } catch (e) {
    logging('Error', 'Error during getting user account');
    res.status(500).json({
      status: 'Something went wrong. Try restarting',
    });
  }
});

/**
 * @api {patch} /api/profile/email Update profile email.
 * @apiName UpdateEmailProfile
 * @apiGroup Profile
 *
 * @apiHeader {String} authorization Authorization value.
 * @apiHeaderExample {json} Content-type header example:
 *           { "Authorization": "JWT fnawilfmnaiwngainegnwegneiwngoiwe" }
 * @apiHeader {String} content-type Payload content type.
 * @apiHeaderExample {json} Content-type header example:
 *            { "Content-type": "application/json" }
 * 
 * @apiParam {String} email User's email.
*  @apiParamExample {json} Payload example:
*              { "email": "anna@gmail.com" }
 *
 * @apiSuccess {String} status Operation status.
 * @apiSuccessExample {json} Success response example:
 *                  { "status": "Email updated successfully" }
 */
router.patch(
    '/email',
    auth,
    contentType,
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

/**
 * @api {patch} /api/profile/name Update user's name.
 * @apiName UpdateNameProfile
 * @apiGroup Profile
 *
 * @apiHeader {String} authorization Authorization value.
 * @apiHeaderExample {json} Content-type header example:
 *           { "Authorization": "JWT fnawilfmnaiwngainegnwegneiwngoiwe" }
 * @apiHeader {String} content-type Payload content type.
 * @apiHeaderExample {json} Content-type header example:
 *            { "Content-type": "application/json" }
 * 
 * @apiParam {String} firstName User's first name.
 * @apiParam {String} lastName User's last name.
*  @apiParamExample {json} Payload example:
*             { 
                "firstName": "Anna", 
                "lastName": "Kryva",
              }
 *
 * @apiSuccess {String} status Operation status.
 * @apiSuccessExample {json} Success response example:
 *                  { "status": "Name updated successfully" }
 */
router.patch(
    '/name',
    contentType,
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

/**
 * @api {patch} /api/profile/reset_password Update user's password.
 * @apiName resetPasswordProfile
 * @apiGroup Profile
 *
 * @apiHeader {String} authorization Authorization value.
 * @apiHeaderExample {json} Content-type header example:
 *           { "Authorization": "JWT fnawilfmnaiwngainegnwegneiwngoiwe" }
 * @apiHeader {String} content-type Payload content type.
 * @apiHeaderExample {json} Content-type header example:
 *            { "Content-type": "application/json" }
 * 
 * @apiParam {String} password New password.
 * @apiParam {String} repeat_password Repeat new password.
*  @apiParamExample {json} Payload example:
*             { 
                "password": "qwerty123", 
                "repeat_password": "qwerty123",
              }
 *
 * @apiSuccess {String} status Operation status.
 * @apiSuccessExample {json} Success response example:
 *                  { "status": "Password changed successfully" }
 */
router.patch(
    '/reset_password',
    auth,
    contentType,
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


/**
 * @api {delete} /api/profileDelete user.
 * @apiName DeleteProfile
 * @apiGroup Profile
 *
 * @apiHeader {String} authorization Authorization value.
 * @apiHeaderExample {json} Content-type header example:
 *           { "Authorization": "JWT fnawilfmnaiwngainegnwegneiwngoiwe" }
 *
 * @apiSuccess {String} status Operation status.
 * @apiSuccessExample {json} Success response example:
 *                  { "status": "User account deleted successfully" }
 */
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
