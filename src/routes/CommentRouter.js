const express = require('express');
const { check } = require('express-validator');

const pagination = require('../middlewares/pagination');

const {
  addComment,
  getComments,
  updateComment,
  removeComment,
} = require('../controllers/CommentController');

const router = express.Router();



//-------------------------------------------------------------------------------------------\\
//POST add comment to post => /api/v1.0/comments/:postId

/**
 * @openapi
 * '/api/v1.0/comments/{postId}':
 *  post:
 *     tags:
 *     - Comments
 *     summary: Add comment to post.
 *     parameters:
 *      - name: Accept-Language
 *        in: header
 *        description: Accept language header - set response language.
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
 *      - name: postId
 *        in: params  
 *        description: Post ID
 *        required: true
 *        schema: 
 *         type: integer
 *         example: 3269
 * 
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              content:
 *                type: string
 *                minLenght: 2
 *                maxLength: 500
 *                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
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
 *                message:
 *                  type: string
 *                  example: Your comment has been successfully created.
 *                comment:
 *                  type: object
 *                  properties:
 *                    id: 
 *                      type: integer
 *                      example: 314
 *                    userId: 
 *                      type: integer
 *                      example: 51
 *                    postId: 
 *                      type: integer
 *                      example: 3269
 *                    content:
 *                      type: string
 *                      example: Lorem Ipsum.                                         
 *                    createdAt:
 *                      type: string
 *                      example: '2023-04-26T10:36:26.504Z'              
 *                    updatedAt:
 *                      type: string
 *                      example: '2023-04-27T16:36:26.504Z' 
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
 *                  example: '/api/v1.0/comments/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Data validation failure.'
 *                validationErrors:
 *                  type: object
 *                  properties:
 *                    content:
 *                      type: string
 *                      example: Comment must be minimum 2 and max 500 characters long.

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
 *                  example: '/api/v1.0/comments/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Incorrect credentials.'
 * 
 *      404: 
 *        description: Not Found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 404 
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/comments/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Post not found.'
 * 
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
 *                  example: '/api/v1.0/comments/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 * 
 * 
 */
router
  .route('/:postId')
  .post(
    [
      check('content')
        .trim()
        .isLength({ min: 2, max: 500 })
        .withMessage('comment_content_size'),
    ],
    addComment
  );

//-------------------------------------------------------------------------------------------\\
//GET list of comments => /api/v1.0/comments/:postId

/**
 * @openapi
 * '/api/v1.0/comments/{postId}':
 *  get:
 *     tags:
 *     - Comments
 *     summary: Lists comments for given post.
 *     parameters:
 *      - name: Accept-Language
 *        in: header
 *        description: Accept language header - set response language.
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
 *      - name: postId
 *        in: params  
 *        description: Post ID
 *        required: true
 *        schema: 
 *         type: integer
 *         example: 3269
 *      - name: size
 *        in: query  
 *        description: Size of array with posts data. Value between 1 and 100.
 *        required: false
 *        schema: 
 *         type: string
 *         default: 10
 *      - name: page
 *        in: query  
 *        description: Page to fetch indicator. Positive integer.
 *        required: false
 *        schema: 
 *         type: string
 *         default: 0 
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
 *                data:
 *                  type: Array
 *                  example: [{ 'id': 223, 'content': 'Short comment.', 'createdAt': '2023-04-26T09:42:14.788Z', 'user': { 'id': 9, 'username': 'Jane Doe', 'avatar': null } }, { "id": 169, "content": 'Lorem Ipsum.!', "createdAt": '2023-04-26T09:42:14.788Z', "user": { "id": 9, "username": 'John Doe', "avatar": null } }]
 *                  description: Array of postst data.
 *                page:
 *                  type: integer
 *                  example: 0
 *                  default: 0
 *                  description: Current page indicator.
 *                size:
 *                  type: integer
 *                  example: 2
 *                  description: Data array size.
 *                totalPages:
 *                  type: integer
 *                  example: 2
 *                  description: All available pages.
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
 *                  example: '/api/v1.0/comments/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Data validation failure.'
 *                validationErrors:
 *                  type: object
 *                  properties:
 *                    content:
 *                      type: string
 *                      example: Comment must be minimum 2 and max 500 characters long.
 * 
 * 
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
 *                  example: '/api/v1.0/comments/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Incorrect credentials.'
 * 
 *      404: 
 *        description: Not Found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 404 
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/comments/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Post not found.'
 * 
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
 *                  example: '/api/v1.0/comments/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 * 
 * 
 */
router.route('/:postId').get(pagination, getComments);

//-------------------------------------------------------------------------------------------\\
//PUT update comment => /api/v1.0/comments/:commentId


/**
 * @openapi
 * '/api/v1.0/comments/{commentId}':
 *  put:
 *     tags:
 *     - Comments
 *     summary: Update comment.
 *     parameters:
 *      - name: Accept-Language
 *        in: header
 *        description: Accept language header - set response language.
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
 *      - name: commentId
 *        in: params  
 *        description: comment ID
 *        required: true
 *        schema: 
 *         type: integer
 *         example: 1466
 * 
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              content:
 *                type: string
 *                minLenght: 2
 *                maxLength: 500
 *                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
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
 *                message:
 *                  type: string
 *                  example: Your comment has been successfully updated.
 *                comment:
 *                  type: object
 *                  properties:
 *                    id: 
 *                      type: integer
 *                      example: 314
 *                    userId: 
 *                      type: integer
 *                      example: 51
 *                    postId: 
 *                      type: integer
 *                      example: 3269
 *                    content:
 *                      type: string
 *                      example: Lorem Ipsum.                                         
 *                    createdAt:
 *                      type: string
 *                      example: '2023-04-26T10:36:26.504Z'              
 *                    updatedAt:
 *                      type: string
 *                      example: '2023-04-27T16:36:26.504Z' 
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
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Data validation failure.'
 *                validationErrors:
 *                  type: object
 *                  properties:
 *                    content:
 *                      type: string
 *                      example: Comment must be minimum 2 and max 500 characters long.
 * 
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
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Incorrect credentials.'
 * 
 *      403:     
 *        description: Forbiden
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 403
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not authorized to update this comment.
 * 
 *      404: 
 *        description: Not Found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 404
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Comment not found.'
 * 
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
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 * 
 * 
 */
router
  .route('/:commentId')
  .put(
    [
      check('content')
        .trim()
        .isLength({ min: 2, max: 500 })
        .withMessage('comment_content_size'),
    ],
    updateComment
  );

//-------------------------------------------------------------------------------------------\\
//DELETE remove comment  => /api/v1.0/comments/:commentId

/**
 * @openapi
 * '/api/v1.0/comments/{commentId}':
 *  delete:
 *     tags:
 *     - Comments
 *     summary: Delete comment.
 *     parameters:
 *      - name: Accept-Language
 *        in: header
 *        description: Accept language header - set response language.
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
 *      - name: commentId
 *        in: params  
 *        description: comment ID
 *        required: true
 *        schema: 
 *         type: integer
 *         example: 1466
 * 
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: Your comment has been successfully deleted.
 *                comment:
 *                  type: object
 *                  properties:
 *                    id: 
 *                      type: integer
 *                      example: 314
 *                    userId: 
 *                      type: integer
 *                      example: 51
 *                    postId: 
 *                      type: integer
 *                      example: 3269
 *                    content:
 *                      type: string
 *                      example: Lorem Ipsum.                                         
 *                    createdAt:
 *                      type: string
 *                      example: '2023-04-26T10:36:26.504Z'              
 *                    updatedAt:
 *                      type: string
 *                      example: '2023-04-27T16:36:26.504Z' 
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
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Incorrect credentials.'
 * 
 *      403:     
 *        description: Forbiden
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 403
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not authorized to delet this comment.
 * 
 *      404: 
 *        description: Not Found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 404
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Comment not found.'
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
 *                  example: '/api/v1.0/comments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 * 
 * 
 */
router.route('/:commentId').delete(removeComment);

module.exports = router;
