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

/**
* @api {get} /api/photo Get photo link at AWS.
* @apiName GetPhoto
* @apiGroup Photo
*
* @apiHeader {String} authorization Authorization value.
* @apiHeaderExample {json} Content-type header example:
*            { "Authorization": "JWT fnawilfmnaiwngainegnwegneiwngoiwe" }
*
* @apiSuccess {String} photoLink Photo link at AWS.
* @apiSuccessExample {json} Success response example:
*                   {"photoLink": "https://s3-us-west-2.amazonaws.com/..."}
*
*/
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

/**
* @api {put} /api/photo Upload photo at AWS.
* @apiName PutPhoto
* @apiGroup Photo
*
* @apiHeader {String} authorization Authorization value.
* @apiHeaderExample {json} Content-type header example:
*            { "Authorization": "JWT fnawilfmnaiwngainegnwegneiwngoiwe" }
* @apiHeader {String} content-type Payload content type.
* @apiHeaderExample {json} Content-type header example:
*            { "Content-type": "multipart/form-data" }
*
* @apiParam {File} file Image file.
*
* @apiSuccess {String} status Operation status.
* @apiSuccessExample {json} Success response example:
*                   {"status": "Profile photo uploaded successfully"}
*
*/
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
          status: 'Profile photo uploaded successfully',
        });
      } catch (e) {
        logging('Error', e);
        return res.status(500).json({
          status: 'Something went wrong. Try restarting',
        });
      }
    });

/**
* @api {delete} /api/photo Delete photo from AWS and remove link.
* @apiName DeletePhoto
* @apiGroup Photo
*
* @apiHeader {String} authorization Authorization value.
* @apiHeaderExample {json} Content-type header example:
*            { "Authorization": "JWT fnawilfmnaiwngainegnwegneiwngoiwe" }
*
* @apiSuccess {String} status Operation status.
* @apiSuccessExample {json} Success response example:
*                   {"status": "Profile photo deleted successfully"}
*
*/
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
      status: 'Profile photo deleted successfully',
    });
  } catch (e) {
    logging('Error', `User has not deleted photo, ${e}`);
    return res.status(500).json({
      status: 'Something went wrong. Try restarting',
    });
  }
});

module.exports = router;
