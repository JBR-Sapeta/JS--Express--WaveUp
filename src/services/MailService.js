const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

//Setting up Node Mialer config base on NODE_ENV.

let mailConfig;
let TESTING_PORT;

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
  const { MAIL_HOST, MAIL_PORT, MAIL_AUTH_USER, MAIL_AUTH_PASS } = process.env;

  mailConfig = {
    host: MAIL_HOST,
    port: MAIL_PORT,
    auth: {
      user: MAIL_AUTH_USER,
      pass: MAIL_AUTH_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };
}

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'staging') {
  const { MAIL_HOST } = process.env;
  TESTING_PORT = Math.floor(Math.random() * 2000) + 10000;

  mailConfig = {
    host: MAIL_HOST,
    port: TESTING_PORT,
    tls: {
      rejectUnauthorized: false,
    },
  };
}

//Export of NodeMailer Port for test module.
exports.TESTING_PORT = TESTING_PORT;

//Setting up Node Mialer config.
const transporter = nodemailer.createTransport({ ...mailConfig });

//-----------------------------------------------------------------------------------------------------\\
/**
 * Sends account activation message for given user email.
 * @param {String} email Destination email address.
 * @param {number} token Account Activation token.
 * @returns {Promise<void | Error>}
 * @author JBRS
 */
exports.sendAccountActivationMail = async (email, token) => {
  const info = await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: email,
    subject: 'Account Activation',
    html: `
    <div>
      <b>Please click below link to activate your account.</b>
    </div>
    <div>
      <a href="http://localhost:3000/activate?token=${token}">Activate</a>
    </div>
    `,
  });
  if (process.env.NODE_ENV === 'dev') {
    logger.info('url: ' + nodemailer.getTestMessageUrl(info));
    logger.info('Acivation Token: ', token);
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Sends password reset message for given user email.
 * @param {String} email Destination email address.
 * @param {number} token Password Reset  token.
 * @returns {Promise<void | Error>}
 * @author JBRS
 */
exports.sendPasswordResetMail = async (email, token) => {
  const info = await transporter.sendMail({
    from: 'WaveUp Team <info@my-app.com>',
    to: email,
    subject: 'Password Reset',
    html: `
    <div>
      <b>Please click below link to reset your password.</b>
    </div>
    <div>
      <a href="http://localhost:3000/recovery?reset=${token}">Reset</a>
    </div>
    `,
  });
  if (process.env.NODE_ENV === 'dev') {
    logger.info('url: ' + nodemailer.getTestMessageUrl(info));
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Sends ban information message for given user email.
 * @param {String} email Destination email address.
 * @param {String} accountName Admin accountName.
 * @returns {Promise<void | Error>}
 * @author JBRS
 */
exports.sendAccountSuspended = async (email, accountName) => {
  const info = await transporter.sendMail({
    from: 'WaveUp Team <info@my-app.com>',
    to: email,
    subject: 'Ban Information.',
    html: `
    <div>
      <h1>Your account has been suspended.</h1>
    </div>
    <div>
      <p>Your account was suspended by "${accountName}" admin because 
      violates the WaveUp rules.Mail to waveupsupport@mail.com to get more informations. </p>
    </div>
    <div>
      <p>WaveUp Team </p>
    </div>
    `,
  });
  if (process.env.NODE_ENV === 'dev') {
    logger.info('url: ' + nodemailer.getTestMessageUrl(info));
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Sends account deleted message for given user email.
 * @param {String} email Destination email address.
 * @param {String} accountName Admin accountName.
 * @returns {Promise<void | Error>}
 * @author JBRS
 */
exports.sendAccountDeleted = async (email, accountName) => {
  const info = await transporter.sendMail({
    from: 'WaveUp Team <info@my-app.com>',
    to: email,
    subject: 'Account deleted.',
    html: `
    <div>
      <h1>Your account has been deleted.</h1>
    </div>
    <div>
      <p>Your account was deleted by "${accountName}" admin because 
      violates the WaveUp rules.Mail to waveupsupport@mail.com to get more informations. </p>
    </div>
    <div>
      <p>WaveUp Team </p>
    </div>
    `,
  });
  if (process.env.NODE_ENV === 'dev') {
    logger.info('url: ' + nodemailer.getTestMessageUrl(info));
  }
};
