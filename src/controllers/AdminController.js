const express = require('express');
const { validationResult } = require('express-validator');

const CommentService = require('../services/CommentService');
const UserService = require('../services/UserService');
const PostService = require('../services/PostService');

const BadRequestError = require('../errors/400/BadRequestError');
const UnauthorizedError = require('../errors/400/UnauthorizedError');
const ForbiddenError = require('../errors/400/ForbiddenError');

//-------------------------------------------------------------------------------------------\\
//PUT reset comment content => /api/v1.0/admin/comment/:commentId
//    # Protected Route

/**
 * Middleware responsible for reseting comment conntent.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.resetComment = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const commentId = req.params.commentId;
  const { isAdmin } = req.isAuthenticated;

  if (!isAdmin) {
    return next(new ForbiddenError('unauthorized_comment_reset'));
  }

  const content = 'This comment was moderated by admin.';

  let comment;
  try {
    comment = await CommentService.updatePostComment(
      commentId,
      null,
      content,
      isAdmin
    );
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('comment_reset_success'), comment });
};

//-------------------------------------------------------------------------------------------\\
//PUT set post as hiden  => /api/v1.0/admin/posts/hide/:postId
//    # Protected Route

/**
 * Middleware responsible for setting post property isPublic to false.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.hidePost = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const postId = req.params.postId;
  const { isAdmin } = req.isAuthenticated;

  if (!isAdmin) {
    return next(new ForbiddenError('unauthorized_post_update'));
  }

  try {
    await PostService.setIsPublic(postId, false);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('post_hiden') });
};

//-------------------------------------------------------------------------------------------\\
//PUT set post as public  => /api/v1.0/admin/posts/show/:postId
//    # Protected Route

/**
 * Middleware responsible for setting post property isPublic to true.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.showPost = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const postId = req.params.postId;
  const { isAdmin } = req.isAuthenticated;

  if (!isAdmin) {
    return next(new ForbiddenError('unauthorized_post_update'));
  }

  try {
    await PostService.setIsPublic(postId, true);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('post_public') });
};

//-------------------------------------------------------------------------------------------\\
//PUT delete user post  => /api/v1.0/admin/posts/:postId
//    # Protected Route

/**
 * Middleware responsible for deleting post for given post Id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.deletePost = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const postId = req.params.postId;
  const { isAdmin } = req.isAuthenticated;

  if (!isAdmin) {
    return next(new ForbiddenError('unauthorized_post_delete'));
  }

  try {
    await PostService.deletePost(null, postId, isAdmin);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('post_delete_success') });
};

//-------------------------------------------------------------------------------------------\\
//PUT ban user account   => /api/v1.0/admin/users/ban/:userId
//    # Protected Route

/**
 * Middleware responsible for banning user account for given user Id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.banUser = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const userId = req.params.userId;
  const { isAdmin, accountName } = req.isAuthenticated;

  if (!isAdmin) {
    return next(new ForbiddenError('unauthorized_ban'));
  }

  try {
    await UserService.setHasBan(userId, true, accountName);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('ban_success') });
};

//-------------------------------------------------------------------------------------------\\
//PUT unban user account  => /api/v1.0/admin/users/unban/:userId
//    # Protected Route

/**
 * Middleware responsible for unbanning user account for given user Id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.unbanUser = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const userId = req.params.userId;
  const { accountName, isAdmin } = req.isAuthenticated;

  if (!isAdmin) {
    return next(new ForbiddenError('unauthorized_unban'));
  }

  try {
    await UserService.setHasBan(userId, false, accountName);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('unban_success') });
};

//-------------------------------------------------------------------------------------------\\
//PUT delete user account  => /api/v1.0/admin/users/:userId
//    # Protected Route

/**
 * Middleware responsible for deleting user account for given user Id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
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

  const user = req.params.userId;
  const password = req.body.password;
  const { userId, accountName, isAdmin } = req.isAuthenticated;

  try {
    await UserService.verifyUserByPassord(userId, password);
  } catch (error) {
    return next(error);
  }

  if (!isAdmin) {
    return next(new ForbiddenError('unauthorized_user_delete'));
  }

  try {
    await UserService.deleteUserAccount(user, accountName);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('user_delete_success') });
};
