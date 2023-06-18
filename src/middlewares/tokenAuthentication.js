const express = require('express');

const UserService = require('../services/UserService');

// Token authentication middleware.

/**
 * JWT authentication middleware.
 * It Attaches isAuthenticated object with user ID and email if incoming request possess valid token.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @author JBRS
 */

const tokenAuthentication = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (authorization) {
    let userData;
    const token = authorization.split(' ')[1];

    try {
      userData = UserService.verifyJWT(token);
    } catch (error) {
      return next(error);
    }
    // userData = {userId, email, accountName, isAdmin}

    req.isAuthenticated = userData;
  }

  next();
};

module.exports = tokenAuthentication;
