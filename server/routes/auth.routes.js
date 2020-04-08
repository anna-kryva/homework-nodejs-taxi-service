const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../models/User');
const schemas = require('../validation/auth.schemas');

const validator = require('../middleware/schemas.middleware');
const sendEmail = require('../mailer/sender.mailer');

const logging = require('../logs/log');

// eslint-disable-next-line new-cap
const router = express.Router();

// /api/auth/register
router.post(
    '/register',
    validator(schemas.signupForm, 'body'),
    async (req, res) => {
      try {
        const {username, email, password, firstName, lastName, role} = req.body;

        const candidate = await User.findOne({username});
        if (candidate) {
          logging(
              'Error',
              'User entered existing username during the registration',
          );
          return res.status(400).json({
            status: 'The username you have entered is already registered',
          });
        }

        const hashPassword = await bcrypt.hash(password, 12);
        const user = new User({
          username,
          email,
          password: hashPassword,
          firstName,
          lastName,
          role: role.toLowerCase(),
        });

        await user.save();

        res.status(200).json({
          status: "User registered successfully",
        });
        logging('Info', 'A new user has been created');
      } catch (e) {
        logging('Error', `User has not registered, ${e}`);
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

// /api/auth/login
router.post(
    '/login',
    validator(schemas.loginForm, 'body'),
    async (req, res) => {
      try {
        const {username, password} = req.body;

        const user = await User.findOne({username});
        if (!user) {
          logging('Error', `The user ${username} has not been found`);
          return res.status(400).json({
            status: 'User has not been found',
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          logging('Error', 'Entered incorrect password');
          return res.status(400).json({
            status: 'Password incorrect',
          });
        }

        const token = jwt.sign(
            {userId: user.id},
            config.get('jwtSecret'),
            {expiresIn: '1h'},
        );

        logging('Info', `Token to user has been sent`);
        res.status(200).json({
          status: "User authenticated successfully",
          token
        });
      } catch (e) {
        logging('Error', 'User has not been authenticated');
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });


router.post(
    '/forgot_password',
    validator(schemas.emailForm, 'body'),
    async (req, res) => {
      try {
        const email = req.body.email;
        const user = await User.findOne({email});

        if(!user) {
          logging('Info', 'There is no user.');
          return res.status(400).json({
            status: 'Email is not registered.',
          });
        }

        const payload = {
          id: user._id,
          email,
        };

        const oneTimeSecret = user.password + '-' + user.createdAt.getTime();
        const token = jwt.sign(payload, oneTimeSecret);

        const mailResult = sendEmail(email, user._id, token);
        mailResult.then((info) => {
          if (info === 'Success') {
            logging('Info', 'The link to reset password has been sent.');
            return res.status(200).json({
              status: 'The link to reset password has been sent.',
            });
          } else {
            logging('Error', 'Link to reset password has not been sent');
            return res.status(500).json({
              status: 'Something went wrong. Try restarting',
            });
          }
        });
      } catch (e) {
        logging('Error', 'Link to rest password has not been sent');
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

router.get(
    '/reset_password/:userId/:token',
    validator(schemas.paramsCheckForm, 'params'),
    async (req, res) => {
      try {
        const {userId, token} = req.params;
        const user = await User.findById(userId);

        if(!user) {
          logging('Info', 'There is no user.');
          return res.status(400).json({
            status: 'Email is not registered.',
          });
        }

        const oneTimeSecret = user.password + '-' + user.createdAt.getTime();
        const payload = jwt.verify(token, oneTimeSecret);

        logging('Info', 'Token decoded for reset password');
        res.status(200).json({id: payload.id, token});
      } catch (e) {
        logging('Error', 'Token is not decoded');
        res.status(500).json({
          status: 'Token is not decoded. Sorry for inconvenience',
        });
      }
    });

router.post(
    '/reset_password',
    validator(schemas.passwordForm, 'body'),
    async (req, res) => {
      try {
        const {userId, token, password} = req.body;
        const user = await User.findById(userId);

        if(!user) {
          logging('Info', 'There is no user.');
          return res.status(400).json({
            status: 'Email is not registered.',
          });
        }

        const oneTimeSecret = user.password + '-' + user.createdAt.getTime();
        jwt.verify(token, oneTimeSecret);

        const hashPassword = await bcrypt.hash(password, 12);
        await User.findByIdAndUpdate(
            userId,
            {password: hashPassword},
        );

        logging('Info', 'Password has been changed.');
        res.status(200).json({
          status: 'Password successfully changed.',
        });
      } catch (e) {
        logging('Error', 'Password has not been changed');
        res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

module.exports = router;
