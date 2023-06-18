const express = require('express');
const logger = require('../utils/logger');

/**
 * Error Handler middleware.
 * It transform validation errors into object with corresponding error message.Then sends object as response.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @author JBRS
 */

module.exports = (err, req, res, _next) => {
  const { status, message, errors } = err;

  if (status < 500) {
    logger.warn(`Status Code - ${status} Message - ${message}`);
  }

  if (status >= 500) {
    logger.error(`Status Code - ${status} Message - ${message}`);
  }

  let validationErrors;
  if (errors) {
    validationErrors = {};
    errors.forEach(
      (error) => (validationErrors[error.param] = req.t(error.msg))
    );
  }
  res.status(status).send({
    status:status,
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message: req.t(message),
    validationErrors,
  });
};
