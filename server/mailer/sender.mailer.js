const config = require('config');
const nodemailer = require('nodemailer');

const logging = require('../logs/log');

module.exports = async (email, userid, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      secure: false,
      port: 587,
      requireTLS: true,
      auth: {
        user: config.get('emailAddress'),
        pass: config.get('emailPassword'),
      },
    });

    const mailOptions = {
      from: `"Uber Like Service" <${config.get('emailAddress')}>`,
      to: `${email}`,
      subject: 'Link To Reset Password',
      text:
            'You are receiving this because you (or someone else)' +
            'have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your ' +
            'browser to complete the process within one hour of receiving' +
            'it:\n\n' +
            `http://localhost:${config.get('port')}/api/auth/reset_password/` +
            `${userid}/${token}\n\n` +
            'If you did not request this, please ignore this email and your' +
            'password will remain unchanged.\n',
    };

    await transporter.sendMail(mailOptions);

    logging('Info', 'Email has been sent');
    return 'Success';
  } catch (e) {
    logging('Error', e);
    return 'Error';
  }
};
