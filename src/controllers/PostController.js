const express = require('express');
const { validationResult } = require('express-validator');

const PostService = require('../services/PostService');

const UserModel = require('../model/UserModel');

const BadRequestError = require('../errors/400/BadRequestError');
const UnauthorizedError = require('../errors/400/UnauthorizedError');
const NotFoundError = require('../errors/400/NotFoundError');
const InternalServerError = require('../errors/500/InternalServerError');

//-------------------------------------------------------------------------------------------\\
//POST creating new post => /api/v1.0/posts
//    # Protected Route

/**
 * Middleware responsible for creating new Post.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.createPost = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  if (!req.isAuthenticated) {
    return next(new UnauthorizedError('unauthorized_post_submit'));
  }

  let content;
  try {
    content = await PostService.createPost(req.body, req.isAuthenticated);
  } catch (error) {
    return next(error);
  }

  return res.send({ message: req.t('post_create_success'), content });
};

//-------------------------------------------------------------------------------------------\\
//GET sending posts list => /api/v1.0/posts
//    # Protected Route

/**
 * Middleware responsible for sending list of posts.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.getPosts = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const { page, size } = req.pagination;

  let posts;
  try {
    posts = await PostService.getPosts(page, size, req.query.date);
  } catch (error) {
    next(error);
  }

  return res.send(posts);
};

//-------------------------------------------------------------------------------------------\\
//GET sending posts list => /api/v1.0/posts/:userId
//    # Protected Route

/**
 * Middleware responsible for sending list of posts for given user id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.getUserPosts = async (req, res, next) => {
  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  const { page, size } = req.pagination;
  const userId = req.params.userId;

  let posts, user;

  try {
    user = await UserModel.findOne({ where: { id: userId } });
  } catch {
    return next(new InternalServerError());
  }

  if (!user) {
    return next(new NotFoundError('user_not_found'));
  }

  let showAll =
    parseInt(userId) === req.isAuthenticated.userId ||
    req.isAuthenticated.isAdmin;

  try {
    posts = await PostService.getUserPosts(page, size, userId, showAll);
  } catch (error) {
    next(error);
  }

  return res.send(posts);
};
//-------------------------------------------------------------------------------------------\\
//PUT updating user post  => /api/v1.0/posts/:postId
//    # Protected Route

/**
 * Middleware responsible for updating post for given post id.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.updatePost = async (req, res, next) => {
  const validationResponse = validationResult(req);

  if (!validationResponse.isEmpty()) {
    return next(new BadRequestError([...validationResponse.errors]));
  }

  if (!req.isAuthenticated) {
    return next(new UnauthorizedError());
  }

  let post;
  try {
    post = await PostService.updatePost(
      req.isAuthenticated.userId,
      req.params.postId,
      req.body.content
    );
  } catch (error) {
    return next(error);
  }

  res.send({ message: req.t('post_update_success'), content: post });
};

//-------------------------------------------------------------------------------------------\\
//DELET deleting user post  => /api/v1.0/posts/:postId
//    # Protected Route

/**
 * Middleware responsible for deleting post for given post id.
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

  let post;
  try {
    post = await PostService.deletePost(
      req.isAuthenticated.userId,
      req.params.postId
    );
  } catch (error) {
    return next(error);
  }

  res.send({ message: req.t('post_delete_success'), content: post });
};
