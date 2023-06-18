const express = require('express');
const multer = require('multer');

const FileService = require('../services/FileService');

const BadRequestError = require('../errors/400/BadRequestError');
const UnauthorizedError = require('../errors/400/UnauthorizedError');

const { IMAGE_SIZE_LIMIT } = process.env;

const upload = multer({
  limits: { fileSize: parseInt(IMAGE_SIZE_LIMIT) },
}).single('file');

//-------------------------------------------------------------------------------------------\\
//POST upload files for posts  => /api/v1.0/files/posts
//    # Protected Route

/**
 * Middleware responsible for uploadfiles for posts.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction } next Express next middleware function
 * @description Requires authentication by JWT.
 * @author JBRS
 */
exports.createPostFile = async (req, res, next) => {

  upload(req, res, async (err) => {
    if (err) {
      return next(new BadRequestError(null, 'file_size_limit'));
    }

    if (!req.isAuthenticated) {
      return next(new UnauthorizedError());
    }

    let file;
    try {
      file = await FileService.saveFile(req.file);
    } catch (error) {
      return next(error);
    }
    res.send(file);
  });
};
