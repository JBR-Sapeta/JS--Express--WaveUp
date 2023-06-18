const express = require('express');
const { validationResult } = require('express-validator');

const CommentService = require('../services/CommentService');

const PostModel = require('../model/PostModel');

const BadRequestError = require('../errors/400/BadRequestError');
const UnauthorizedError = require('../errors/400/UnauthorizedError');
const NotFoundError = require('../errors/400/NotFoundError');
const InternalServerError = require('../errors/500/InternalServerError');

//-------------------------------------------------------------------------------------------\\
//POST add comment to post => /api/v1.0/coments/:postId
//    # Protected Route

/**
 * Middleware responsible for adding comment for given post.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.addComment = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }
  const content = req.body.content;
  const userId = req.isAuthenticated.userId;
  const postId = req.params.postId;

  let post;
  try {
    post = await PostModel.findByPk(postId);
  } catch {
    return next(new InternalServerError());
  }

  if (!post) {
    return next(new NotFoundError('post_not_found'));
  }

  let comment;
  try {
    comment = await CommentService.addPostComment(postId, userId, content);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('comment_create_success'), comment });
};

//-------------------------------------------------------------------------------------------\\
//GET add comment to post => /api/v1.0/coments/:postId
//    # Protected Route

/**
 * Middleware responsible for sending list of comments for given post id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.getComments = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const { page, size } = req.pagination;
  const postId = req.params.postId;

  let post;
  try {
    post = await PostModel.findByPk(postId);
  } catch {
    return next(new InternalServerError());
  }

  if (!post) {
    return next(new NotFoundError('post_not_found'));
  }

  let comments;
  try {
    comments = await CommentService.getPostComments(page, size, postId);
  } catch (error) {
    return next(error);
  }

  return res.send(comments);
};

//-------------------------------------------------------------------------------------------\\
//PUT update comment => /api/v1.0/coments/:commentId
//    # Protected Route

/**
 * Middleware responsible for updating comment for given comment Id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.updateComment = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const content = req.body.content;
  const { userId } = req.isAuthenticated;
  const commentId = req.params.commentId;

  let comment;
  try {
    comment = await CommentService.updatePostComment(
      commentId,
      userId,
      content
    );
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('comment_update_success'), comment });
};

//-------------------------------------------------------------------------------------------\\
//DELETE remove comment  => /api/v1.0/coments/:commentId
//    # Protected Route

/**
 * Middleware responsible for removing comment for given comment Id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.removeComment = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const { userId } = req.isAuthenticated;
  const commentId = req.params.commentId;

  let comment;
  try {
    comment = await CommentService.removePostComment(commentId, userId);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('comment_delete_success'), comment });
};
