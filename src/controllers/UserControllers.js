const express = require('express');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const sequelize = require('../database/db');

const UserModel = require('../model/UserModel');

const UserService = require('../services/UserService');
const MailService = require('../services/MailService');

const BadRequestError = require('../errors/400/BadRequestError');
const UnauthorizedError = require('../errors/400/UnauthorizedError');
const ForbiddenError = require('../errors/400/ForbiddenError');
const NotFoundError = require('../errors/400/NotFoundError');
const InternalServerError = require('../errors/500/InternalServerError');
const BadGatewayError = require('../errors/500/BadGatewayError');

//-------------------------------------------------------------------------------------------\\
//POST creating a new user account => /api/v1.0/users

/**
 * Middleware responsible for creating user account. It creates user in database and sends activation email.
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @author JBRS
 */
exports.creatUser = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  const { accountName, email, password } = req.body;

  try {
    await UserService.isAccountNameTaken(accountName);
    await UserService.isEmailTaken(email);
  } catch (error) {
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch {
    return next(new InternalServerError());
  }

  const activationToken = UserService.createToken();

  const userData = {
    accountName,
    email,
    activationToken,
    password: hashedPassword,
  };
  let transaction;

  try {
    transaction = await sequelize.transaction();
    await UserModel.create(userData, { transaction });
  } catch {
    await transaction.rollback();
    return next(new InternalServerError());
  }

  try {
    await MailService.sendAccountActivationMail(
      email,
      userData.activationToken
    );
    await transaction.commit();
  } catch {
    await transaction.rollback();

    return next(new BadGatewayError('nodemailer_failure'));
  }

  return res.send({ message: req.t('user_created') });
};

//-------------------------------------------------------------------------------------------\\
//POST user account activation => /api/v1.0/users/activate/:token

/**
 * Middleware responsible for users account activation. It activates user in database.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @author JBRS
 */
exports.activateAccount = async (req, res, next) => {
  const token = req.params.token;
  let user;

  try {
    user = await UserModel.findOne({ where: { activationToken: token } });
  } catch (err) {
    const error = { msg: 'invalid_activation_token', param: 'token' };
    return next(new BadRequestError([error]));
  }

  if (!user) {
    const error = { msg: 'invalid_activation_token', param: 'token' };
    return next(new BadRequestError([error]));
  }

  try {
    (user.activationToken = null), (user.isInactive = false);
    await user.save();
  } catch {
    return next(new InternalServerError());
  }

  return res.send({ message: req.t('account_activation_success') });
};

//-------------------------------------------------------------------------------------------\\
//POST logging into a user account => /api/v1.0/users/auth

/**
 * Middleware responsible for users authentication. It creates  JWT for given user.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @author JBRS
 */
exports.userAuthentication = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  const { email, password } = req.body;

  let user;
  try {
    user = await UserService.verifyUserByEmailAndPassord(email, password);
  } catch (error) {
    return next(error);
  }

  if (user.hasBan) {
    return next(new ForbiddenError('account_suspended'));
  }

  const token = UserService.createJSONWebToken(
    user.id,
    user.email,
    user.accountName,
    user.isAdmin
  );

  const date = UserService.tokenExpirationDate();

  return res.send({
    id: user.id,
    accountName: user.accountName,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    description: user.description,
    isAdmin: user.isAdmin,
    birthday: user.birthday,
    city: user.city,
    token: token,
    expiresIn: date.toISOString(),
  });
};

//-------------------------------------------------------------------------------------------\\
//GET sending users list => /api/v1.0/users
//    # Protected Route

/**
 * Middleware responsible for sending users list.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @author JBRS
 */
exports.getUsers = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }
  const { page, size } = req.pagination;
  const { userId } = req.isAuthenticated;

  let usersData;
  try {
    usersData = await UserModel.findAndCountAll({
      where: {
        isInactive: false,
        id: { [Sequelize.Op.not]: userId },
      },
      attributes: [
        'id',
        'accountName',
        'username',
        'avatar',
        'birthday',
        'city',
      ],
      limit: size,
      offset: page * size,
    });
  } catch (error) {
    return next(new InternalServerError());
  }

  return res.send({
    data: usersData.rows,
    page: page,
    size: size,
    totalPages: Math.ceil(usersData.count / size),
  });
};

//-------------------------------------------------------------------------------------------\\
//GET sending user data => /api/v1.0/users/:userId
//    # Protected Route

/**
 * Middleware responsible for sending user account data for given userID.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.getUser = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const userId = req.params.userId;
  let userData;
  try {
    userData = await UserModel.findOne({
      where: {
        isInactive: false,
        id: userId,
      },
      attributes: [
        'id',
        'accountName',
        'username',
        'avatar',
        'birthday',
        'description',
        'city',
        'hasBan',
      ],
    });
  } catch {
    return next(new InternalServerError());
  }

  if (!userData) {
    return next(new NotFoundError('user_not_found'));
  }

  return res.send(userData);
};

//-------------------------------------------------------------------------------------------\\
//GET search for user with given string as accountName or username => /api/v1.0/users/name
//    # Protected Route

/**
 * Middleware responsible for sending user account data for given username or accountName.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.getUsersByName = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const { page, size } = req.pagination;
  const name = req.query.name;
  let usersData;

  if (!(name && name.trim())) {
    return next(new NotFoundError('user_not_found'));
  }

  try {
    usersData = await UserService.findByName(page, size, name);
  } catch (error) {
    return next(error);
  }

  return res.send(usersData);
};

//-------------------------------------------------------------------------------------------\\
//DELETE  deleting user account => /api/v1.0/users/:userId
//    # Protected Route

/**
 * Middleware responsible for deleting user account.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.deleteUser = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const reqUserId = req.params.userId;
  const password = req.body.password;
  const { userId } = req.isAuthenticated;

  if (userId !== parseInt(reqUserId)) {
    return next(new ForbiddenError('unauthorized_user_delete'));
  }

  let user;
  try {
    user = await UserService.verifyUserByPassord(userId, password);
  } catch (error) {
    return next(error);
  }

  try {
    await UserService.deleteUserAccount(userId);
  } catch (err) {
    return next(new InternalServerError());
  }

  return res.send({ message: req.t('user_delete_success') });
};

//-------------------------------------------------------------------------------------------\\
//PUT  updates user account => /api/v1.0/users/:userId
//    # Protected Route

/**
 * Middleware responsible for sending email to the user to reset old password.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.updateUser = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  const reqUserId = req.params.userId;

  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  if (req.isAuthenticated.userId !== Number.parseInt(reqUserId)) {
    return next(new ForbiddenError('unauthorized_user_update'));
  }

  let updatedUser;

  try {
    updatedUser = await UserService.updateUserAccount(reqUserId, req.body);
  } catch (error) {
    return next(error);
  }

  return res.send(updatedUser);
};

//-------------------------------------------------------------------------------------------\\
//POST creates a token and sends an reset password email to user  => /api/v1.0/users/password

/**
 * Middleware responsible for sending email to the user to reset old password.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @author JBRS
 */
exports.resetPassword = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  const userEmail = req.body.email;

  let user;
  try {
    user = await UserService.createPasswordResetToken(userEmail);
  } catch (error) {
    return next(error);
  }

  try {
    await MailService.sendPasswordResetMail(userEmail, user.passwordResetToken);
    return res.send({ message: req.t('password_reset_request_success') });
  } catch {
    return next(new BadGatewayError('nodemailer_failure'));
  }
};

//-------------------------------------------------------------------------------------------\\
//PUT updateing user account  => /api/v1.0/users/password

/**
 * Middleware responsible for password update by passwordResetToken.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @author JBRS
 */
exports.setNewPassword = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  const { passwordResetToken, password } = req.body;

  try {
    await UserService.resetPassword(passwordResetToken, password);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('password_update_success') });
};

//-------------------------------------------------------------------------------------------\\
//PUT updateing user password  => /api/v1.0/users/password/:userID
//    # Protected Route

/**
 * Middleware responsible for direct password update.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @description Requires authentication by JWT and Password.
 * @author JBRS
 */
exports.updatePassword = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const userId = req.isAuthenticated.userId;
  const { password, newPassword } = req.body;
  const reqUserId = req.params.userId;

  if (req.isAuthenticated.userId !== Number.parseInt(reqUserId)) {
    return next(new ForbiddenError('unauthorized_user_update'));
  }

  let user;
  try {
    user = await UserService.verifyUserByPassord(userId, password);
  } catch (error) {
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(newPassword, 12);
  } catch {
    return next(new InternalServerError());
  }

  try {
    user.password = hashedPassword;
    await user.save();
  } catch {
    return next(new InternalServerError());
  }

  return res.send({ message: req.t('password_update_success') });
};

//-------------------------------------------------------------------------------------------\\
//PUT updateing user email  => /api/v1.0/users/email/:userID
//    # Protected Route

/**
 * Middleware responsible for user email update.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @description Requires authentication by JWT and Password.
 * @author JBRS
 */
exports.updateEmail = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const userId = req.isAuthenticated.userId;
  const { password, newEmail } = req.body;
  const reqUserId = req.params.userId;

  if (req.isAuthenticated.userId !== Number.parseInt(reqUserId)) {
    return next(new ForbiddenError('unauthorized_user_update'));
  }

  try {
    await UserService.isEmailTaken(newEmail, 'newEmail');
  } catch (erro) {
    return next(erro);
  }

  let user;
  try {
    user = await UserService.verifyUserByPassord(userId, password);
  } catch (error) {
    return next(error);
  }

  try {
    user.email = newEmail;
    await user.save();
  } catch {
    return next(new InternalServerError());
  }

  return res.send({ message: req.t('email_update_success'), email: newEmail });
};
