const Sequelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');
var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const UserModel = require('../model/UserModel');

const InternalServerError = require('../errors/500/InternalServerError');
const UnauthorizedError = require('../errors/400/UnauthorizedError');
const ForbiddenError = require('../errors/400/ForbiddenError');
const BadRequestError = require('../errors/400/BadRequestError');

const FileService = require('./FileService');
const MailService = require('./MailService');

const NotFoundError = require('../errors/400/NotFoundError');
const BadGatewayError = require('../errors/500/BadGatewayError');

//-----------------------------------------------------------------------------------------------------\\

/**
 * Creates unique token string.
 * Returns string created by uuid v4 algorithm.
 * @returns {String}
 * @author JBRS
 */
exports.createToken = () => {
  return uuidv4();
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Signs the user id and user email into a JSON Web Token string payload.
 * Returns the JSON Web Token string.
 * @param {number} userId User ID.
 * @param {String} email User email.
 * @returns {String} JSON Web Token string
 * @author JBRS
 */
exports.createJSONWebToken = (userId, email, accountName, isAdmin) => {
  let token = jwt.sign(
    { userId, email, accountName, isAdmin },
    process.env.JWT_TOKEN,
    {
      expiresIn: '1h',
    }
  );
  return token;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Verify given JSON Web Token string.
 * Returns Object which contains user Id and email or throw an Error.
 * @param {String} token JSON Web Token string.
 * @returns {{userId:Number,email:String} | Error}  Decoded User object  or Error.
 * @author JBRS
 */
exports.verifyJWT = (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_TOKEN);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('token_expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('authentication_failure');
    } else {
      throw new InternalServerError();
    }
  }
  return decodedToken;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Search for a single User instance by email value, and verify if entered password is valid.
 * Returns User instance that meets search criteria or throw an Error.
 * @param {String} email User email.
 * @param {String} password User password.
 * @returns {Promise<UserModel | Error>}   UserModel instance or Error.
 * @author JBRS
 */
exports.verifyUserByEmailAndPassord = async (email, password) => {
  let user;
  try {
    user = await UserModel.findOne({ where: { email } });
  } catch {
    throw new InternalServerError();
  }

  if (!user) {
    throw new UnauthorizedError();
  }

  let match;
  try {
    match = await bcrypt.compare(password, user.password);
  } catch {
    throw new InternalServerError();
  }

  if (!match) {
    throw new UnauthorizedError();
  }

  if (user.isInactive) {
    throw new ForbiddenError('inactive_account');
  }

  return user;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Search for a single User instance by user ID, and verify if entered password is valid.
 * Returns User instance that meets search criteria or throw an Error.
 * @param {String} userId User ID.
 * @param {String} password User password.
 * @returns {Promise<UserModel | Error>}   UserModel instance or Error.
 * @author JBRS
 */
exports.verifyUserByPassord = async (userId, password) => {
  let user;
  try {
    user = await UserModel.findByPk(userId);
  } catch {
    throw new InternalServerError();
  }

  if (!user) {
    throw new UnauthorizedError();
  }

  let match;
  try {
    match = await bcrypt.compare(password, user.password);
  } catch {
    throw new InternalServerError();
  }

  if (!match) {
    throw new UnauthorizedError();
  }

  return user;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Validate if given email address is already occupied.
 * Throws an Error if entered email is already taken.
 * @param {String} email User email.
 * @param {String} paramValue  It specify error param value in case of failure.
 * @returns {Promise<void | Error>}   Void or Error.
 * @author JBRS
 */
exports.isEmailTaken = async (email, paramValue = 'email') => {
  let emailIsTaken;

  try {
    emailIsTaken = await UserModel.findOne({ where: { email } });
  } catch {
    throw new InternalServerError();
  }

  if (emailIsTaken) {
    const error = { msg: 'email_taken', param: paramValue };
    throw new BadRequestError([error]);
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Validate if given account name is already occupied.
 * Throws an Error if entered email is already taken.
 * @param {String} accountName User account name.
 * @returns {Promise<void | Error>}   Void or Error.
 * @author JBRS
 */
exports.isAccountNameTaken = async (accountName) => {
  let accountNameIsTaken;

  try {
    accountNameIsTaken = await UserModel.findOne({
      where: { accountName: accountName },
    });
  } catch {
    throw new InternalServerError();
  }

  if (accountNameIsTaken) {
    const error = { msg: 'account_name_taken', param: 'accountName' };
    throw new BadRequestError([error]);
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Calculate expiration Date from now.
 * By default expiration time is set as one hour.
 * @param {Number} hours By default 1 hour.
 * @returns {Date}    Expiration Date.
 * @author JBRS
 */
exports.tokenExpirationDate = (hours = 1) => {
  const date = new Date();
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return date;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Update User data in database base on body payload.
 * Returns Object with user data or throws an Error.
 * @param {Number} id User ID.
 * @param {{username?:String, description?:String, image?:String, birthday?:String city?:String }} body Image payload as base64 format
 * @returns {Promise<{id:Number,usernam:String,accountName:String email:String, avatar:String, description:String, birthday:String city:String}| Error>}    User data or Error.
 * @author JBRS
 */
exports.updateUserAccount = async (id, body) => {
  let user;

  try {
    user = await UserModel.findOne({ where: { id: id } });
  } catch {
    throw new InternalServerError();
  }


  if (body.username) {
    user.username = body.username;
  }

  if (body.description || body.description === null) {
    user.description = body.description;
  }

  if (body.city || body.city === null) {
    user.city = body.city;
  }

  if (body.birthday) {
    try {
      user.birthday = new Date(body.birthday);
    } catch {
      user.birthday = null;
    }
  }

  if (body.birthday === null) {
    user.birthday = null;
  }

  if (body.image) {
    if (user.avatar) {
      try {
        await FileService.deleteProfileAvatar(user.avatar);
      } catch {
        throw new InternalServerError();
      }
    }
    try {
      user.avatar = await FileService.saveProfileAvatar(body.image);
    } catch (err) {
      throw new InternalServerError();
    }
  }

  try {
    await user.save();
  } catch {
    throw new InternalServerError();
  }


  return {
    id: user.id,
    accountName: user.accountName,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    description: user.description,
    birthday: user.birthday,
    city: user.city,
  };
};
//-----------------------------------------------------------------------------------------------------\\
/**
 * Delete user record in database and removes avatar image from profile directory.
 * Returns Object with user data or throws an Error.
 * @param {Number} id User ID.
 * @param {String} admin Admin AccountName, null by default.
 * @returns {Promise< void| Error>}    Void or Error.
 * @author JBRS
 */
exports.deleteUserAccount = async (id, admin = null) => {
  let user;

  try {
    user = await UserModel.findByPk(id);
  } catch {
    throw new InternalServerError();
  }

  if (!user) {
    throw new NotFoundError('user_not_found');
  }

  if (user.avatar) {
    try {
      await FileService.deleteProfileAvatar(user.avatar);
    } catch {
      throw new InternalServerError();
    }
  }

  try {
    await FileService.deleteUserFiles(user.id);
  } catch {
    throw new InternalServerError();
  }

  if (admin) {
    try {
      await MailService.sendAccountDeleted(user.email, admin);
    } catch {
      throw new BadGatewayError('nodemailer_failure');
    }
  }

  try {
    await user.destroy();
  } catch {
    throw new InternalServerError();
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Creates password reset token in database for user with given email address.
 * Throws an Error in case of failure.
 * @param { String } email User email.
 * @returns {Promise<void | Error>}  Void or Error.
 * @author JBRS
 */
exports.createPasswordResetToken = async (email) => {
  let user;
  try {
    user = await UserModel.findOne({ where: { email } });
  } catch {
    throw new InternalServerError();
  }

  if (!user) {
    throw new NotFoundError('email_not_inuse');
  }

  user.passwordResetToken = this.createToken();

  try {
    await user.save();
  } catch {
    throw new InternalServerError();
  }

  return user;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Search for user instance with given password reset token.
 * Overwirte user password in database with new one.
 * Throws an Error in case of failure.
 * @param {String} passwordResetToken Password reste token string.
 * @param {String} newPassword   User new password.
 * @returns {Promise< void | Error>}   Void or Error.
 * @author JBRS
 */
exports.resetPassword = async (passwordResetToken, newPassword) => {
  let user;

  try {
    user = await UserModel.findOne({
      where: { passwordResetToken: passwordResetToken },
    });
  } catch {
    throw new InternalServerError();
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(newPassword, 12);
  } catch {
    throw new InternalServerError();
  }

  user.password = hashedPassword;
  user.passwordResetToken = null;
  user.isInactive = false;
  user.activationToken = null;

  try {
    await user.save();
  } catch {
    throw new InternalServerError();
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Search for users with given username or accountName.
 * Returns array of users that meet given criteria. Throws an Error in case of failure.
 * @param {Number} page Use to calculate offset
 * @param {Number} size  Use to calculate offset and as limit
 * @param {String} name Query string.
 * @returns {Promise< Object | Error>}  Object or Error.
 * @author JBRS
 */
exports.findByName = async (page, size, name) => {
  let usersDataWithCount;

  try {
    usersDataWithCount = await UserModel.findAndCountAll({
      where: {
        isInactive: false,
        [Sequelize.Op.or]: [
          { accountName: { [Sequelize.Op.like]: `%${name}%` } },
          { username: { [Sequelize.Op.like]: `%${name}%` } },
        ],
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
  } catch (erro) {
    throw new InternalServerError();
  }

  return {
    data: usersDataWithCount.rows.map((user) => {
      return (userAsJSON = user.get({ plain: true }));
    }),
    page,
    size,
    totalPages: Math.ceil(usersDataWithCount.count / size),
  };
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Change user property hasBan to entered value.
 * Throws an Error in case of failure.
 * @param {Number} userId UserModel instance ID.
 * @param {boolean} value True or false.
 * @param {string} admin Admin accountName.
 * @returns {Promise< void | Error>}  Void or  Error.
 * @author JBRS
 */
exports.setHasBan = async (userId, value, admin) => {
  let userToUpdate;

  try {
    userToUpdate = await UserModel.findByPk(userId);
  } catch (err) {
    throw new InternalServerError();
  }

  if (!userToUpdate) {
    throw new NotFoundError('user_not_found');
  }

  if (value) {
    try {
      await MailService.sendAccountSuspended(userToUpdate.email, admin);
    } catch {
      throw new BadGatewayError('nodemailer_failure');
    }
  }

  try {
    userToUpdate.hasBan = value;
    await userToUpdate.save();
  } catch (err) {
    throw new InternalServerError();
  }
};
