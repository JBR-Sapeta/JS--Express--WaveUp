const express = require('express');


/**
 * Pagination middleware.
 * It Attaches pagination object with page and size property if incoming request possess appropriate query params.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @author JBRS
 */
const pagination = (req, res, next) => {
  const pageAsNumber = Number.parseInt(req.query.page);
  const sizeAsNumber = Number.parseInt(req.query.size);

  let page = Number.isNaN(pageAsNumber) ? 0 : pageAsNumber;
  let size = Number.isNaN(sizeAsNumber) ? 10 : sizeAsNumber;

  if (page < 0) {
    page = 0;
  }

  if (size < 1 || size > 100) {
    size = 10;
  }

  req.pagination = { page, size };
  next();
};

module.exports = pagination;
