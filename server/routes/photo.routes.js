const express = require('express');
const config = require('config');
const multer = require('multer');
const AWS = require('aws-sdk');

const logging = require('../logs/log');
const User = require('../models/User');

const contentType = require('../middleware/content.form.middleware');
const auth = require('../middleware/auth.middleware');

// eslint-disable-next-line new-cap
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
});


// GET /api/photo/self
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      logging('Info', 'There is no user.');
      return res.status(400).json({
        status: 'User is not registered.',
      });
    }

    logging('Info', 'Url to user profile photo has been sent');
    res.status(200).json({photoLink: user.photoLink});
  } catch (e) {
    logging('Error', `Cannot get user profile photo, ${e}`);
    res.status(500).json({
      status: 'Something went wrong. Try restarting',
    });
  }
});


// PUT /api/photo/self
router.put(
    '/',
    contentType,
    auth,
    upload.single('file'),
    async (req, res) => {
      try {
        const userId = req.user.userId;

        const user = await User.findById(userId);

        if (!user) {
          logging('Info', 'There is no user.');
          return res.status(400).json({
            status: 'User is not registered.',
          });
        }

        const file = req.file;
        const s3FileUrl = config.get('awsUploadedFileUrlLink');

        const s3bucket = new AWS.S3({
          accessKeyId: config.get('awsAccessKeyId'),
          secretAccessKey: config.get('awsSecretAccessKey'),
          region: config.get('awsRegion'),
        });

        const params = {
          Bucket: config.get('awsBucketName'),
          Key: userId + '_' + file.originalname,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        };

        s3bucket.upload(params, (error) => {
          if (error) {
            logging('Error', error);
            return res.status(500).json({
              status: 'Something went wrong.' +
           'Photo has not been uploaded ',
            });
          }
        });

        await User.findByIdAndUpdate(
            userId,
            {
              photoLink: s3FileUrl + params.Key,
              s3Key: params.Key,
            },
        );

        logging('Info', `The profile photo has been uploaded`);
        res.status(200).json({
          status: 'Profile photo has been uploaded',
        });
      } catch (e) {
        logging('Error', e);
        return res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

// DELETE /api/photo/self
router.delete('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    await User.findByIdAndUpdate(
        userId,
        {photoLink: '', s3Key: ''},
    );

    const s3bucket = new AWS.S3({
      accessKeyId: config.get('awsAccessKeyId'),
      secretAccessKey: config.get('awsSecretAccessKey'),
      region: config.get('awsRegion'),
    });

    const params = {
      Bucket: config.get('awsBucketName'),
      Key: result.s3Key,
    };

    s3bucket.deleteObject(params, (error) => {
      if (error) {
        logging('Error', `Cannot delete photo from AWS. ${error}`);
        return res.status(500).json({
          status: 'Something went wrong. Photo has not been deleted',
        });
      }
    });

    logging('Info', 'Profile photo has been deleted');
    res.status(200).json({
      status: 'Profile photo has been deleted',
    });
  } catch (e) {
    logging('Error', `User has not deleted photo, ${e}`);
    return res.status(500).json({
      status: 'Something went wrong. Try restarting',
    });
  }
});

module.exports = router;
