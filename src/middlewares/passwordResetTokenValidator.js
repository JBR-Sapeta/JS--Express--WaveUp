const express = require('express');

const UserModel = require('../model/UserModel');

const UnauthorizedError = require('../errors/400/UnauthorizedError');

/**
 * Pasword reset middelware.
 * Checks if incoming request has valid password reset token value.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @author JBRS
 */
const passwordResetTokenValidator = async (req, res, next) => {
  const token = req.body.passwordResetToken;

  if (!token) {
    return next(new UnauthorizedError('unauthorized_password_reset'));
  }

  let user;
  try {
    user = await UserModel.findOne({ where: { passwordResetToken: token } });
  } catch (error) {
    return next(error);
  }

  if (!user) {
    return next(new UnauthorizedError('unauthorized_password_reset'));
  }

  next();
};

module.exports = passwordResetTokenValidator;
