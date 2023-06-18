const express = require('express');
const { check } = require('express-validator');

const {
  resetComment,
  hidePost,
  showPost,
  deletePost,
  banUser,
  unbanUser,
  deleteUser,
} = require('../controllers/AdminController');

const router = express.Router();

//-------------------------------------------------------------------------------------------\\
//PUT reset comment content => /api/v1.0/admin/comment/:commentId
/**
 * @openapi
 * '/api/v1.0/admin/comments/reset/{commentId}':
 *  put:
 *     tags:
 *     - Admin
 *     summary: Reset comment.
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
 *        description: Comment ID
 *        required: true
 *        schema:
 *         type: integer
 *         example: 246
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
 *                  example: Comment has been successfully moderated.
 *                content:
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
 *                      example: This comment was moderated by admin.                                         
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
 *                  example: '/api/v1.0/coments/1466'
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
 *                  example: '/api/v1.0/coments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not authorized to reset this comment.
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
 *                  example: '/api/v1.0/coments/1466'
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
 *                  example: '/api/v1.0/coments/1466'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 *
 */
router.route('/comments/reset/:commentId').put(resetComment);

//-------------------------------------------------------------------------------------------\\
//PUT set post as hiden  => /api/v1.0/admin/posts/hide/:postId

/**
 * @openapi
 * '/api/v1.0/admin/posts/hide/{postId}':
 *  put:
 *     tags:
 *     - Admin
 *     summary: Sets post as hidden.
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
 *         example: 78932
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
 *                  example: Post has been successfully hidden.
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
 *                  example: '/api/v1.0/admin/posts/hide/78932'
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
 *                  example: '/api/v1.0/admin/posts/hide/78932'
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
 *                  example: '/api/v1.0/admin/posts/hide/78932'
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
 *                  example: '/api/v1.0/admin/posts/hide/78932'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 *
 */
router.route('/posts/hide/:postId').put(hidePost);

//-------------------------------------------------------------------------------------------\\
//PUT set post as public  => /api/v1.0/admin/posts/show/:postId

/**
 * @openapi
 * '/api/v1.0/admin/posts/show/{postId}':
 *  put:
 *     tags:
 *     - Admin
 *     summary: Sets post as public.
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
 *         example: 4757
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
 *                  example: Post has been set as public.
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
 *                  example: '/api/v1.0/admin/posts/show/4757'
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
 *                  example: '/api/v1.0/admin/posts/show/4757'
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
 *                  example: '/api/v1.0/admin/posts/show/4757'
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
 *                  example: '/api/v1.0/admin/posts/show/4757'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 *
 */
router.route('/posts/show/:postId').put(showPost);

//-------------------------------------------------------------------------------------------\\
//DELETE delete user post  => /api/v1.0/admin/posts/:postId

/**
 * @openapi
 * '/api/v1.0/admin/posts/{postId}':
 *  delete:
 *     tags:
 *     - Admin
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
router.route('/posts/:postId').delete(deletePost);

//-------------------------------------------------------------------------------------------\\
//PUT ban user account   => /api/v1.0/admin/users/ban/:userId

/**
 * @openapi
 * '/api/v1.0/admin/users/ban/{userId}':
 *  put:
 *     tags:
 *     - Admin
 *     summary: Suspend user account.
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
 *         example: 723
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
 *                  example: User has been banned.
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
 *                  example: '/api/v1.0/admin/users/ban/723'
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
 *                  example: '/api/v1.0/admin/users/ban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not authorized to ban user.
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
 *                  example: '/api/v1.0/admin/users/ban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'User not found.'
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
 *                  example: '/api/v1.0/admin/users/ban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 *      502:
 *        description: Bad Gateway
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 502
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/admin/users/ban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Sending email failed.'
 *
 */
router.route('/users/ban/:userId').put(banUser);

//-------------------------------------------------------------------------------------------\\
//PUT unban user account  => /api/v1.0/admin/users/unban/:userId

/**
 * @openapi
 * '/api/v1.0/admin/users/unban/{userId}':
 *  put:
 *     tags:
 *     - Admin
 *     summary: Unblock user account.
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
 *         example: 723
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
 *                  example: User has been unbanned.
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
 *                  example: '/api/v1.0/admin/users/unban/723'
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
 *                  example: '/api/v1.0/admin/users/unban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not authorized to unban user.
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
 *                  example: '/api/v1.0/admin/users/unban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'User not found.'
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
 *                  example: '/api/v1.0/admin/users/unban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 *
 */
router.route('/users/unban/:userId').put(unbanUser);

//-------------------------------------------------------------------------------------------\\
//De DELETE user account  => /api/v1.0/admin/users/:userId

/**
 * @openapi
 * '/api/v1.0/admin/users/{userId}':
 *  delete:
 *     tags:
 *     - Admin
 *     summary: Delete user account.
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
 *         example: 5345
 *
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - password
 *            properties:
 *              password:
 *                type: string
 *                example: P4assword3
 *                description: Current password.
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
 *                  example: User account has been deleted.
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
 *                  example: '/api/v1.0/users/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Data validation failure.'
 *                validationErrors:
 *                  type: object
 *                  properties:
 *                    password:
 *                      type: string
 *                      example: Password can not be empty.
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
 *                  example: '/api/v1.0/admin/users/ban/723'
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
 *                  example: '/api/v1.0/admin/users/ban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not allowed to delete this account.
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
 *                  example: '/api/v1.0/admin/users/ban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'User not found.'
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
 *                  example: '/api/v1.0/admin/users/ban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 *      502:
 *        description: Bad Gateway
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                  example: 502
 *                path:
 *                  type: string
 *                  example: '/api/v1.0/admin/users/ban/723'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Sending email failed.'
 *
 */
router
  .route('/users/:userId')
  .delete(
    [check('password').notEmpty().withMessage('password_empty')],
    deleteUser
  );

module.exports = router;
