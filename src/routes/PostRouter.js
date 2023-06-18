const express = require('express');
const { check } = require('express-validator');

const pagination = require('../middlewares/pagination');
const {
  createPost,
  getPosts,
  getUserPosts,
  updatePost,
  deletePost,
} = require('../controllers/PostController');

const router = express.Router();

//-------------------------------------------------------------------------------------------\\
//POST creating new post => /api/v1.0/posts

/**
 * @openapi
 * '/api/v1.0/posts/':
 *  post:
 *     tags:
 *     - Posts
 *     summary: Create post.
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
 *                minLenght: 10
 *                maxLength: 2000
 *                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 *              file:
 *                type: integer
 *                example: 24853
 *                description: File ID
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
 *                  example: Your post has been successfully created.
 *                content:
 *                  type: object
 *                  properties:
 *                    id: 
 *                      type: integer
 *                      example: 314
 *                    content:
 *                      type: string
 *                      example: Lorem Ipsum.                                         
 *                    isPublic:
 *                      type: boolean
 *                      example: true
 *                    createdAt:
 *                      type: string
 *                      example: '2023-04-26T10:36:26.504Z'              
 *                    updatedAt:
 *                      type: string
 *                      example: '2023-04-26T10:36:26.504Z'
 *                    userId: 
 *                      type: integer
 *                      example: 51
 *                    file: 
 *                      type: integer
 *                      example: 223  
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
 *                  example: '/api/v1.0/posts'
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
 *                      example: Post must be be minimum  10 and max 2000 characters long

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
 *                  example: '/api/v1.0/posts'
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
 *                  example: '/api/v1.0/users/5384'
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
  .route('/')
  .post(
    [
      check('content')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('post_content_size'),
    ],
    createPost
  );

//-------------------------------------------------------------------------------------------\\
//GET sending posts list => /api/v1.0/posts

/**
 * @openapi
 * '/api/v1.0/posts/':
 *  get:
 *     tags:
 *     - Posts
 *     summary: Lists posts.
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
 *      - name: date
 *        in: query
 *        description: Set date range - "today" | "week" | "older"
 *        required: false
 *        schema:
 *         type: string
 *         default: today
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
 *                  example: [{ 'id': 40, 'content': 'Post content 1', 'createdAt': '2023-04-25T20:45:06.973Z', 'user': { 'id': 58, 'accountName': 'user1', 'username': 'User', 'avatar': null }, 'likes': [313,721,47], 'comments': 5 }]
 *                  description: Array of postst data.
 *                page:
 *                  type: integer
 *                  example: 5
 *                  default: 0
 *                  description: Current page indicator.
 *                size:
 *                  type: integer
 *                  example: 1
 *                  description: Data array size.
 *                totalPages:
 *                  type: integer
 *                  example: 324
 *                  description: All available pages.
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
 *                  example: '/api/v1.0/posts'
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
 *                  example: '/api/v1.0/posts'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 */
router.route('/').get(pagination, getPosts);

//-------------------------------------------------------------------------------------------\\
//GET sending posts for given user  => /api/v1.0/posts/:userId

/**
 * @openapi
 * '/api/v1.0/posts/{userId}':
 *  get:
 *     tags:
 *     - Posts
 *     summary: Lists posts for given user.
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
 *      - name: userId
 *        in: params
 *        description: User ID
 *        required: true
 *        schema:
 *         type: integer
 *         example: 5482
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
 *                  example: [{ 'id': 40, 'content': 'Post content 1', 'createdAt': '2023-04-25T20:45:06.973Z', 'user': { 'id': 58, 'accountName': 'user1', 'username': 'User', 'avatar': null },'file': {'filenmae': '16h29d-n139sa22-13m1qp12', 'filetype': 'image/png'}, 'likes': [823,413,6323,67], 'comments': 0 }]
 *                  description: Array of postst data.
 *                page:
 *                  type: integer
 *                  example: 5
 *                  default: 0
 *                  description: Current page indicator.
 *                size:
 *                  type: integer
 *                  example: 1
 *                  description: Data array size.
 *                totalPages:
 *                  type: integer
 *                  example: 324
 *                  description: All available pages.
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
 *                  example: '/api/v1.0/posts/5482'
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
 *                  example: '/api/v1.0/posts/5482'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'User not found.'
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
 *                  example: '/api/v1.0/posts/5482'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 */
router.route('/:userId').get(pagination, getUserPosts);

//-------------------------------------------------------------------------------------------\\
//PUT updating user post  => /api/v1.0/posts/:postId

/**
 * @openapi
 * '/api/v1.0/posts/{postId}':
 *  put:
 *     tags:
 *     - Posts
 *     summary: Update post.
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
 *                minLenght: 10
 *                maxLength: 2000
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
 *                  example: Your post has been successfully updated.
 *                content:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: integer
 *                      example: 314
 *                    content:
 *                      type: string
 *                      example: Lorem Ipsum.
 *                    isPublic:
 *                      type: boolean
 *                      example: true
 *                    createdAt:
 *                      type: string
 *                      example: '2023-04-26T10:36:26.504Z'
 *                    updatedAt:
 *                      type: string
 *                      example: '2023-04-27T16:36:26.504Z'
 *                    userId:
 *                      type: integer
 *                      example: 51
 *                    file:
 *                      type: integer
 *                      example: 223
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
 *                  example: '/api/v1.0/posts/3269'
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
 *                      example: Post must be be minimum  10 and max 2000 characters long.
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
 *                  example: '/api/v1.0/posts/3269'
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
 *                  example: '/api/v1.0/users/password/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not authorized to update this post.
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
 *                  example: '/api/v1.0/posts/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Post not found.'
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
 *                  example: '/api/v1.0/posts/3269'
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
  .put(
    [
      check('content')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('post_content_size'),
    ],
    updatePost
  );

//-------------------------------------------------------------------------------------------\\
//DELET deleting user post  => /api/v1.0/posts/:postId

/**
 * @openapi
 * '/api/v1.0/posts/{postId}':
 *  delete:
 *     tags:
 *     - Posts
 *     summary: Delete post.
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
 *                  example: Post has been successfully deleted.
 *                content:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: integer
 *                      example: 314
 *                    content:
 *                      type: string
 *                      example: Lorem Ipsum.
 *                    isPublic:
 *                      type: boolean
 *                      example: true
 *                    createdAt:
 *                      type: string
 *                      example: '2023-04-26T10:36:26.504Z'
 *                    updatedAt:
 *                      type: string
 *                      example: '2023-04-27T16:36:26.504Z'
 *                    userId:
 *                      type: integer
 *                      example: 51
 *                    file:
 *                      type: integer
 *                      example: 223
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
 *                  example: '/api/v1.0/posts/3269'
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
 *                  example: '/api/v1.0/users/password/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not authorized to delet this post.
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
 *                  example: '/api/v1.0/posts/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Post not found.'
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
 *                  example: '/api/v1.0/posts/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 *
 */
router.route('/:postId').delete(deletePost);

module.exports = router;
