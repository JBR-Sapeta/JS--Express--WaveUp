const express = require('express');
const router = express.Router();

const { createPostFile } = require('../controllers/FileController');

//-------------------------------------------------------------------------------------------\\
//POST upload files for posts  => /api/v1.0/files/posts

/**
 * @openapi
 * '/api/v1.0/files/posts':
 *  post:
 *     tags:
 *     - Files
 *     summary: Save file.
 *     parameters:
 *      - name: Accept-Language
 *        in: header
 *        description: Accept Language header - set response language.
 *        required: false
 *        type: string
 *        default: en
 *        enum:
 *          - en
 *          - pl
 *        example: Accept-Language en
 *      - name: Authorization
 *        in: header
 *        description: Authorization header - JSON Web Token.
 *        required: true
 *        type: string
 *        example: Authorization  Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *      - name: Content-Type
 *        in: header
 *        description: Content Type header - to send file
 *        required: true
 *        type: string
 *        example: Content-Type multipart/form-data
 *
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                format: binary
 *                description: File.
 *
 *
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: number
 *                  example: 3281
 *                  description: File ID.
 *                filename:
 *                  type: string
 *                  example: '446a6526-92b3-4931-8bcd-f877e4e5bb5d.jpg'
 *                  description: File name.
 *                fileType:
 *                  type: string
 *                  example: 'image/jpeg'
 *                  description: File type.
 *
 *
 *      400:
 *        description: Bad request.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 400
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/files/posts'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: Uploaded file cannot be bigger than 2MB.
 *
 *      401:
 *        description: Unauthorized.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 401
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/files/posts'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Incorrect credentials.'
 *
 *      500:
 *        description: Internal Server Error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 500
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/files/posts'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 *
 */
router.route('/posts').post(createPostFile);

module.exports = router;
