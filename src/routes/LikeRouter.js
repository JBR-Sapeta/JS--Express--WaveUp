const express = require('express');

const {
  addLikeToPost,
  removeLikeFromPost,
} = require('../controllers/LikeController');

const router = express.Router();





//-------------------------------------------------------------------------------------------\\
//POST remove like  => /api/v1.0/likes/:postId

/**
 * @openapi
 * '/api/v1.0/likes/{postId}':
 *  post:
 *     tags:
 *     - Likes
 *     summary: Add like.
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
 *                  example: Your like has been successfully added.
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
 *                  example: '/api/v1.0/posts/3269'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You already like this post.
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
 *                  example: '/api/v1.0/posts/3269'
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
router.route('/:postId').post(addLikeToPost);

//-------------------------------------------------------------------------------------------\\
//DELETE remove like  => /api/v1.0/likes/:postId

/**
 * @openapi
 * '/api/v1.0/likes/{postId}':
 *  delete:
 *     tags:
 *     - Likes
 *     summary: Delete like.
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
 *                  example: Your like has been successfully removed.
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
 *                  example: '/api/v1.0/posts/3269'
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
router.route('/:postId').delete(removeLikeFromPost);

module.exports = router;
