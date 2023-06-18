const express = require('express');
const { check } = require('express-validator');

const pagination = require('../middlewares/pagination');
const passwordResetTokenValidator = require('../middlewares/passwordResetTokenValidator');

const FileService = require('../services/FileService');

const {
  creatUser,
  activateAccount,
  userAuthentication,
  getUsers,
  getUser,
  getUsersByName,
  deleteUser,
  updateUser,
  resetPassword,
  setNewPassword,
  updatePassword,
  updateEmail,
} = require('../controllers/UserControllers');

const router = express.Router();

//-------------------------------------------------------------------------------------------\\
//GET sending users list => /api/v1.0/users

/**
 * @openapi
 * '/api/v1.0/users/':
 *  get:
 *     tags:
 *     - Users
 *     summary: Lists users.
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
 *        description: Size of array with users data. Value between 1 and 100.
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
 *                  example: [{'id':1173, 'accountName':"JohnDoe", 'username':"UserDoe", 'avatar':"71b7d848-5c51-44f6-81b0-b3251bba314f", 'birthday':"2003-03-08T22:00:00.000Z", 'city':"Cracow"},{'id':2719, 'accountName':"JaneDoe", 'username':"JaneDoe", 'avatar':"92f7d848-5c51-56i6-81b0-b32hh67a314f", 'birthday':"2001-07-2T22:00:00.000Z", 'city':"Cracow"}]
 *                  description: Array of users data.
 *                page:
 *                  type: integer
 *                  example: 3
 *                  default: 0
 *                  description: Current page indicator.
 *                size:
 *                  type: integer
 *                  example: 2
 *                  description: Data array size.
 *                totalPages:
 *                  type: integer
 *                  example: 6
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
 *                  example: '/api/v1.0/users'
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
 *                  example: '/api/v1.0/users'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 */
router.route('/').get(pagination, getUsers);

//-------------------------------------------------------------------------------------------\\
//POST creating a new user account => /api/v1.0/users

/**
 * @openapi
 * '/api/v1.0/users/':
 *  post:
 *     tags:
 *     - Users
 *     summary: Create a user account in inactive mode.
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
 *
 *
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - accountName
 *              - email
 *              - password
 *            properties:
 *              accountName:
 *                type: string
 *                minLenght: 4
 *                maxLength: 32
 *                example: JohnDoe
 *              email:
 *                type: string
 *                example: johndoe@mail.com
 *              password:
 *                type: string
 *                minLenght: 4
 *                patternContains: lowercase, uppercase, number
 *                example: P4assword
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
 *                  example: Account has been successfully created. Check your E-mail.
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
 *                  example: '/api/v1.0/users'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Data validation failure.'
 *                validationErrors:
 *                  type: object
 *                  properties:
 *                    accountName:
 *                      type: string
 *                      example: Account name can not be empty.
 *                    email:
 *                      type: string
 *                      example: Entered email is not valid.
 *                    password:
 *                      type: string
 *                      example: Password must be at least 6 characters long.
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
 *                  example: '/api/v1.0/users'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
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
 *                  example: '/api/v1.0/users'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Sending email failed.'
 */
router.route('/').post(
  [
    check('accountName')
      .trim()
      .not()
      .isEmpty()
      .withMessage('account_name_empty')
      .bail()
      .isLength({ min: 4, max: 32 })
      .withMessage('account_name_size'),
    check('email')
      .trim()
      .notEmpty()
      .withMessage('email_empty')
      .bail()
      .isEmail()
      .withMessage('email_validation_failure'),
    check('password')
      .trim()
      .notEmpty()
      .withMessage('password_empty')
      .bail()
      .isLength({ min: 6 })
      .withMessage('password_size')
      .bail()
      .matches(/^(?=.*[a=z])(?=.*[A-Z])(?=.*\d).*$/)
      .withMessage('password_pattern'),
  ],
  creatUser
);

//-------------------------------------------------------------------------------------------\\
//POST user account activation => /api/v1.0/users/activate/:token

/**
 * @openapi
 * '/api/v1.0/users/activate/{token}':
 *  post:
 *     tags:
 *     - Users
 *     summary: Changes user mode to active.
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
 *      - name: token
 *        in: params
 *        description: Account activation token.
 *        required: true
 *        schema:
 *         type: string
 *         example: 75442486-0878-440c-9db1-a7006c25a39f
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
 *                  example: Your account has been activated.
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
 *                  example: '/api/v1.0/users/activate/75442486-0878-440c-9db1-a7006c25a39f'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: This account is either active or the token is invalid.
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
 *                  example: '/api/v1.0/users/activate/75442486-0878-440c-9db1-a7006c25a39f'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 */
router.route('/activate/:token').post(activateAccount);

//-------------------------------------------------------------------------------------------\\
//POST logging into a user account => /api/v1.0/users/auth

/**
 * @openapi
 * '/api/v1.0/users/auth':
 *  post:
 *     tags:
 *     - Users
 *     summary: Logs user into the system.
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
 *
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                example: johndoe@mail.com
 *              password:
 *                type: string
 *                example: P4assword
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
 *                  type: integer
 *                  example: 1428.
 *                accountName:
 *                  type: string
 *                  example: UserDoe177.
 *                username:
 *                  type: string
 *                  example: John Doe.
 *                email:
 *                  type: string
 *                  example: johndoe177@mail.com.
 *                avatar:
 *                  type: string
 *                  example: 71b7d848-5c51-44f6-81b0-b3251bba314f
 *                description:
 *                  type: string
 *                  example: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
 *                birthday:
 *                  type: string
 *                  example: 2000-10-15T14:48:00.000Z
 *                city:
 *                  type: string
 *                  example: Cracow
 *                isAdmin:
 *                  type: boolean
 *                  example: false
 *                token:
 *                  type: string
 *                  example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBtYWlsLmNvbSIsImlhdCI6MTY4MjQ0MTAyMSwiZXhwIjoxNjgyNDQ0NjIxfQ
 *                  description: JWT
 *                expiresIn:
 *                  type: string
 *                  example: 2023-10-05T14:48:00.000Z
 *                  description: ISO string
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
 *                  example: /api/v1.0/users/auth
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Data validation failure.'
 *                validationErrors:
 *                  type: object
 *                  properties:
 *                    email:
 *                      type: string
 *                      example: Entered email is not valid.
 *                    password:
 *                      type: string
 *                      example: Password can not be empty.
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
 *                  example: /api/v1.0/users/auth
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: Your account is inactive, check your email.
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
 *                  example: /api/v1.0/users/auth
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 */
router
  .route('/auth')
  .post(
    [
      check('email')
        .trim()
        .notEmpty()
        .withMessage('email_empty')
        .bail()
        .isEmail()
        .withMessage('email_validation_failure'),
      check('password').notEmpty().withMessage('password_empty'),
    ],
    userAuthentication
  );

//-------------------------------------------------------------------------------------------\\
//POST It sends an email which contain password reset token  => /api/v1.0/users/password

/**
 * @openapi
 * '/api/v1.0/users/password':
 *  post:
 *     tags:
 *     - Users
 *     summary: Password recovery - Reset request.
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
 *
 *
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                example: johndoe@mail.com
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
 *                  example: Check your e-mail for resetting your password.
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
 *                  example: '/api/v1.0/users/password'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Data validation failure.'
 *                validationErrors:
 *                  type: object
 *                  properties:
 *                    email:
 *                      type: string
 *                      example: Entered email is not valid.
 *
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
 *                  example: '/api/v1.0/users/password'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'E-mail not found.'
 *
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
 *                  example: '/api/v1.0/users/password'
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
 *                  example: '/api/v1.0/users/password'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Sending email failed.'
 */
router
  .route('/password')
  .post(
    [check('email').trim().isEmail().withMessage('email_validation_failure')],
    resetPassword
  );

//-------------------------------------------------------------------------------------------\\
//PUT It resets user password => /api/v1.0/users/password

/**
 * @openapi
 * '/api/v1.0/users/password':
 *  put:
 *     tags:
 *     - Users
 *     summary: Password recovery - Set new password.
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
 *
 *
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - password
 *              - passwordResetToken
 *            properties:
 *              password:
 *                type: string
 *                example: P4assword
 *                description: New password.
 *              passwordResetToken:
 *                type: string
 *                example: 75442486-0878-440c-9db1-a7006c25a39f
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
 *                  example: Your password has been successfully changed.
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
 *                  example: '/api/v1.0/users/password'
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
 *                      example: Password must be at least 6 characters long.
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
 *                  example: '/api/v1.0/users/password'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 */
router.route('/password').put(
  passwordResetTokenValidator,
  [
    check('password')
      .trim()
      .notEmpty()
      .withMessage('password_empty')
      .bail()
      .isLength({ min: 6 })
      .withMessage('password_size')
      .bail()
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      .withMessage('password_pattern'),
  ],
  setNewPassword
);

//-------------------------------------------------------------------------------------------\\
//PUT updateing user password  => /api/v1.0/users/password/:userID
//    # Protected Route

/**
 * @openapi
 * '/api/v1.0/users/password/{userId}':
 *  put:
 *     tags:
 *     - Users
 *     summary: Password update.
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
 *      - name: userId
 *        in: params
 *        description: User ID.
 *        required: true
 *        schema:
 *         type: integer
 *         example: 5384
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
 *            required:
 *              - password
 *              - newPassword
 *            properties:
 *              newPassword:
 *                type: string
 *                example: NewP4assword33
 *                description: New password.
 *              password:
 *                type: string
 *                example: OldP4ssword
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
 *                  example: Your password has been successfully changed.
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
 *                  example: '/api/v1.0/users/password/5384'
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
 *                    newPassword:
 *                      type: string
 *                      example: Password must be at least 6 characters long.
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
 *                  example: '/api/v1.0/users/password/5384'
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
 *                  example: You are not allowed to update this account.
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
 *                  example: '/api/v1.0/users/password/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 */
router.route('/password/:userId').put(
  [
    check('password').notEmpty().withMessage('password_empty'),
    check('newPassword')
      .trim()
      .notEmpty()
      .withMessage('password_empty')
      .bail()
      .isLength({ min: 6 })
      .withMessage('password_size')
      .bail()
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      .withMessage('password_pattern'),
  ],
  updatePassword
);

//-------------------------------------------------------------------------------------------\\
//PUT updateing user email  => /api/v1.0/users/email/:userID
//    # Protected Route

/**
 * @openapi
 * '/api/v1.0/users/email/{userId}':
 *  put:
 *     tags:
 *     - Users
 *     summary: Email update.
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
 *      - name: userId
 *        in: params
 *        description: User ID.
 *        required: true
 *        schema:
 *         type: integer
 *         example: 5384
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
 *            required:
 *              - password
 *              - newEmail
 *            properties:
 *              password:
 *                type: string
 *                example: NewP4assword33
 *                description: Current password.
 *              newEmail:
 *                type: string
 *                example: janedoe@mail.com
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
 *                  example: Your E-mail has been successfully changed.
 *                email:
 *                  type: string
 *                  example: janedoe@mail.com
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
 *                  example: '/api/v1.0/users/email/5384'
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
 *                    newEmail:
 *                      type: string
 *                      example: Entered email is not valid.
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
 *                  example: '/api/v1.0/users/email/5384'
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
 *                  example: '/api/v1.0/users/email/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not allowed to update this account.
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
 *                  example: '/api/v1.0/users/email/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 */
router
  .route('/email/:userId')
  .put(
    [
      check('password').notEmpty().withMessage('password_empty'),
      check('newEmail')
        .trim()
        .notEmpty()
        .withMessage('email_empty')
        .bail()
        .isEmail()
        .withMessage('email_validation_failure'),
    ],
    updateEmail
  );

//-------------------------------------------------------------------------------------------\\
//GET search for user with given string as accountName or username => /api/v1.0/users/name
//    # Protected Route

/**
 * @openapi
 * '/api/v1.0/users/name':
 *  get:
 *     tags:
 *     - Users
 *     summary: Get users by user name or account name.
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
 *        description: Size of array with users data. Value between 1 and 100.
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
 *      - name: name
 *        in: query
 *        description: User name or account name.
 *        required: true
 *        schema:
 *         type: string
 *         example: Doe
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
 *                  example: [{'id':1173, 'accountName':"JohnDoe", 'username':"UserDoe", 'avatar':"71b7d848-5c51-44f6-81b0-b3251bba314f", 'birthday':"2003-03-08T22:00:00.000Z", 'city':"Cracow"},{'id':2719, 'accountName':"JaneDoe", 'username':"JaneDoe", 'avatar':"92f7d848-5c51-56i6-81b0-b32hh67a314f", 'birthday':"2001-07-2T22:00:00.000Z",'city':"Cracow"}]
 *                  description: Array of users data that match query.
 *                page:
 *                  type: integer
 *                  example: 3
 *                  default: 0
 *                  description: Current page indicator.
 *                size:
 *                  type: integer
 *                  example: 2
 *                  description: Data array size.
 *                totalPages:
 *                  type: integer
 *                  example: 6
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
 *                  example: '/api/v1.0/users/name'
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
 *                  example: '/api/v1.0/users/name'
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
 *                  example: '/api/v1.0/users/name'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 */
router.route('/name').get(pagination, getUsersByName);

//-------------------------------------------------------------------------------------------\\
//GET sending user data => /api/v1.0/users/:userId
//    # Protected Route

/**
 * @openapi
 * '/api/v1.0/users/{userId}':
 *  get:
 *     tags:
 *     - Users
 *     summary: Get userdata by user Id.
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
 *        description: User to find.
 *        required: true
 *        schema:
 *         type: integer
 *         example: 5278
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
 *                  type: integer
 *                  example: 2842
 *                  description: User Id.
 *                accountName:
 *                  type: string
 *                  example: JohnDoe
 *                username:
 *                  type: string
 *                  example: UserDoe
 *                avatar:
 *                  type: string
 *                  example: 71b7d848-5c51-44f6-81b0-b3251bba314f
 *                birthday:
 *                  type: string
 *                  example: 2003-03-08T22:00:00.000Z
 *                description:
 *                  type: string
 *                  example: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
 *                city:
 *                  type: string
 *                  example: Cracov
 *                hasBan:
 *                  type: boolean
 *                  example: false
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
 *                  example: '/api/v1.0/users/5278'
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
 *                  example: '/api/v1.0/users/5278'
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
 *                  example: '/api/v1.0/users/5278'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 *
 */
router.route('/:userId').get(getUser);

//-------------------------------------------------------------------------------------------\\
//DELETE deleting user account => /api/v1.0/users/:userId
//    # Protected Route

/**
 * @openapi
 * '/api/v1.0/users/{userId}':
 *  delete:
 *     tags:
 *     - Users
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
 *        description: User ID.
 *        required: true
 *        schema:
 *         type: integer
 *         example: 5384
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
 *                  example: '/api/v1.0/users/5384'
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
 *                  example: '/api/v1.0/users/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not allowed to delete this account. 
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
 *                  example: '/api/v1.0/users/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: 'Internal server error.'
 * 
 */

router
  .route('/:userId')
  .delete(
    [check('password').notEmpty().withMessage('password_empty')],
    deleteUser
  );

//-------------------------------------------------------------------------------------------\\
//PUT updateing user account  => /api/v1.0/users/:userId
//    # Protected Route

/**
 * @openapi
 * '/api/v1.0/users/{userId}':
 *  put:
 *     tags:
 *     - Users
 *     summary: Update user account.
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
 *        description: User ID.
 *        required: true
 *        schema:
 *         type: integer
 *         example: 5384
 *
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              username:
 *                type: string
 *                minLenght: 4
 *                maxLength: 24
 *                example: JohnDoe672
 *                required: false
 *              birthday:
 *                type: string
 *                example: 2000-10-15T14:48:00.000Z
 *                description: ISO string. To clear birthday set property to null.
 *                required: false
 *              description:
 *                type: string
 *                maxLenght: 1000
 *                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 *                description: To clear description set property to null.
 *                required: false
 *              city:
 *                type: string
 *                maxLenght: 24
 *                example: Cracow.
 *                description: To clear city name set property to null.
 *                required: false
 *              image:
 *                type: string
 *                example: SWRlYWx5IHNhIGphayBnd2lhemR5IC0gbmllIG1vem5hIGljaCBvc2lhZ25hYywgYWxlIG1v
 *                description: Base64 format.
 *                required: false
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
 *                  type: integer
 *                  example: 5384
 *                accountName:
 *                  type: string
 *                  example: JohnDoe177
 *                username:
 *                  type: string
 *                  example: John Doe
 *                email:
 *                  type: string
 *                  example: johndoe@mail.com
 *                avatar:
 *                  type: string
 *                  example: 75442486-0878-440c-9db1-a7006c25a39f
 *                description:
 *                  type: string
 *                  example: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 *                birthday:
 *                  type: string
 *                  example: 2000-10-15T14:48:00.000Z
 *                city:
 *                  type: string
 *                  example: Cracow
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
 *                    username:
 *                      type: string
 *                      example: Username must be at least 4 to 32 characters long.
 *                    birthday:
 *                      type: string
 *                      example: Birthday must be iso 8601 date string.
 *                    description:
 *                      type: string
 *                      example: Description cannot be longer than 1000 characters.
 *                    city:
 *                      type: string
 *                      example: City name cannot be longer than 100 characters.
 *                    image:
 *                      type: string
 *                      example: Only JPEG ad PNG files are supported.
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
 *                  example: '/api/v1.0/users/5384'
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
 *                  example: '/api/v1.0/users/5384'
 *                timestamp:
 *                  type: integer
 *                  example: 1682150959796
 *                message:
 *                  type: string
 *                  example: You are not allowed to update this account.
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

router.route('/:userId').put(
  [
    check('birthday')
      .optional({ checkFalsy: true })
      .trim()
      .isISO8601({ strict: true })
      .withMessage('birthday_date_format'),

    check('description')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('description_size'),

    check('city')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 24 })
      .withMessage('city_size'),

    check('username')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 24 })
      .withMessage('username_size'),

    check('image').custom(async (imageAsBase64String) => {
      await FileService.validateImage(imageAsBase64String);
    }),
  ],
  updateUser
);

module.exports = router;
