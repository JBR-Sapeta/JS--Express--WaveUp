const express = require('express');

const LikeService = require('../services/LikeService');

const PostModel = require('../model/PostModel');

const UnauthorizedError = require('../errors/400/UnauthorizedError');
const NotFoundError = require('../errors/400/NotFoundError');
const InternalServerError = require('../errors/500/InternalServerError');

//-------------------------------------------------------------------------------------------\\
//POST add like to post => /api/v1.0/likes/:postId
//    # Protected Route

/**
 * Middleware responsible for adding like for given post.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.addLikeToPost = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }
  const postId = req.params.postId;
  const userId = req.isAuthenticated.userId;

  let post;
  try {
    post = await PostModel.findOne({ where: { id: postId } });
  } catch {
    return next(new InternalServerError());
  }

  if (!post) {
    return next(new NotFoundError('post_not_found'));
  }

  try {
    await LikeService.addLike(postId, userId);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('like_create_success') });
};

//-------------------------------------------------------------------------------------------\\
//DELET remove like => /api/v1.0/likes/:postId
//    # Protected Route

/**
 * Middleware responsible for removing likes for given post.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */

exports.removeLikeFromPost = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const postId = req.params.postId;
  const userId = req.isAuthenticated.userId;

  let post;
  try {
    post = await PostModel.findOne({ where: { id: postId } });
  } catch {
    return next(new InternalServerError());
  }

  if (!post) {
    return next(new NotFoundError('post_not_found'));
  }

  try {
    await LikeService.removeLike(postId, userId);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('like_delete_success') });
};
