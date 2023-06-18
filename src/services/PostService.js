const Sequelize = require('sequelize');

const UserModel = require('../model/UserModel');
const PostModel = require('../model/PostModel');
const FileModel = require('../model/FileModel');
const LikeModel = require('../model/LikeModel');
const CommentModel = require('../model/CommentModel');

const FileService = require('../services/FileService');

const NotFoundError = require('../errors/400/NotFoundError');
const ForbiddenError = require('../errors/400/ForbiddenError');
const InternalServerError = require('../errors/500/InternalServerError');

//-----------------------------------------------------------------------------------------------------\\
/**
 * Creates new post with given body payload in database.
 * Throws an Error in case of failure.
 * @param {{content:String, file:Number}} body file - FileModel instance ID.
 * @param {Number} user   UserModel instance ID.
 * @returns {Promise< Object | Error>}   All data propertires of the PostModel instance or Error.
 * @author JBRS
 */
exports.createPost = async (body, user) => {
  const postData = {
    content: body.content,
    userId: user.userId,
  };
  let post;
  try {
    post = await PostModel.create(postData);
  } catch {
    throw new InternalServerError();
  }

  if (body.file) {
    try {
      await FileService.associateFileToPost(body.file, post.id);
    } catch (error) {
      throw error;
    }
  }
  const postJSON = post.get({ plain: true });

  return postJSON;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Search for posts in database that meet given criteria.
 * Returns object which contain posts. Throws an Error in case of failure.
 * @param {Number} page Use to calculate offset
 * @param {Number} size  Use to calculate offset and as limit
 * @param {String | Null} query  'today' (default) |  'week' | 'older'
 * @returns {Promise< Object | Error>}   Object or Error.
 * @author JBRS
 */
exports.getPosts = async (page, size, query = null) => {
  // default value  -  query === 'today'
  let where;
  if (query === 'week') {
    where = {
      createdAt: {
        [Sequelize.Op.between]: [
          new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), //from
          new Date(new Date().getTime() - (24 * 60 * 60 * 1000 + 1)), //to
        ],
      },
      isPublic: true,
    };
  } else if (query === 'older') {
    where = {
      createdAt: {
        [Sequelize.Op.between]: [
          new Date(0), //from
          new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), //to
        ],
      },
      isPublic: true,
    };
  } else {
    where = {
      createdAt: {
        [Sequelize.Op.between]: [
          new Date(new Date().getTime() - 24 * 60 * 60 * 1000), //from
          new Date(Date.now()), //to
        ],
      },
      isPublic: true,
    };
  }

  let postsWithCount;
  try {
    postsWithCount = await PostModel.findAndCountAll({
      where,
      attributes: ['id', 'content', 'isPublic', 'createdAt'],
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'accountName', 'username', 'avatar'],
        },
        {
          model: FileModel,
          as: 'file',
          attributes: ['filename', 'fileType'],
        },
        {
          model: LikeModel,
          as: 'likes',
          attributes: ['userId'],
        },
        {
          model: CommentModel,
          as: 'comments',
          attributes: ['id'],
        },
      ],
      order: [['id', 'DESC']],
      limit: size,
      offset: page * size,
      distinct: true,
    });
  } catch {
    throw new InternalServerError();
  }

  return {
    data: postsWithCount.rows.map((postSequelize) => {
      const postAsJSON = postSequelize.get({ plain: true });
      if (postAsJSON.file === null) {
        delete postAsJSON.file;
      }
      postAsJSON.likes = postAsJSON.likes.map((like) => like.userId);
      postAsJSON.comments = postAsJSON.comments.length;

      return postAsJSON;
    }),
    page,
    size,
    totalPages: Math.ceil(postsWithCount.count / size),
  };
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Search for posts in database for given user ID.
 * Returns object which contain posts. Throws an Error in case of failure.
 * @param {Number} page Use to calculate offset.
 * @param {Number} size  Use to calculate offset and as limit.
 * @param {Number} userId  UserModel instance ID.
 * @param {Boolean} showAll  Specify if all posts should be send.
 * @returns {Promise< Object | Error>}   Object or Error.
 * @author JBRS
 */

exports.getUserPosts = async (page, size, userId, showAll) => {
  let postsWithCount, postVisibility;
  postVisibility = showAll
    ? { [Sequelize.Op.or]: [{ isPublic: true }, { isPublic: false }] }
    : { isPublic: true };

  try {
    postsWithCount = await PostModel.findAndCountAll({
      attributes: ['id', 'content', 'isPublic', 'createdAt'],
      where: { ...postVisibility },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'accountName', 'username', 'email', 'avatar'],
          where: { id: userId },
        },
        {
          model: FileModel,
          as: 'file',
          attributes: ['filename', 'fileType'],
        },
        {
          model: LikeModel,
          as: 'likes',
          attributes: ['userId'],
        },
        {
          model: CommentModel,
          as: 'comments',
          attributes: ['id'],
        },
      ],
      order: [['id', 'DESC']],
      limit: size,
      offset: page * size,
    });
  } catch {
    throw new InternalServerError();
  }

  return {
    data: postsWithCount.rows.map((postSequelize) => {
      const postAsJSON = postSequelize.get({ plain: true });
      if (postAsJSON.file === null) {
        delete postAsJSON.file;
      }
      postAsJSON.likes = postAsJSON.likes.map((like) => like.userId);
      postAsJSON.comments = postAsJSON.comments.length;
      return postAsJSON;
    }),
    page,
    size,
    totalPages: Math.ceil(postsWithCount.count / size),
  };
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Updates post content in database.
 * Returns all values of the PostModel instance. Throws an Error in case of failure.
 * @param {Number} userId UserModel instance ID.
 * @param {Number} postId  PostModel instance ID.
 * @param {String} content  Post new content.
 * @returns {Promise< Object | Error>}  All values of the PostModel instance or Error.
 * @author JBRS
 */
exports.updatePost = async (userId, postId, content) => {
  let postToBeUpdated;
  try {
    postToBeUpdated = await PostModel.findOne({
      where: { id: postId },
    });
  } catch (err) {
    throw new InternalServerError();
  }

  if (!postToBeUpdated) {
    throw new NotFoundError('post_not_found');
  }

  if (userId !== postToBeUpdated.userId) {
    throw new ForbiddenError('unauthorized_post_update');
  }

  try {
    postToBeUpdated.content = content;
    await postToBeUpdated.save();
  } catch {
    throw new InternalServerError();
  }
  const postJSON = postToBeUpdated.get({ plain: true });

  return postJSON;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Removes post from database for given post ID.
 * Returns all values of the PostModel instance. Throws an Error in case of failure.
 * @param {Number} userId UserModel instance ID.
 * @param {Number} postId  PostModel instance ID.
 * @param {Boolean} isAdmin  Default false.
 * @returns {Promise< Object | Error>}  All data propertires  of the PostModel instance or Error.
 * @author JBRS
 */
exports.deletePost = async (userId, postId, isAdmin = false) => {
  let postToBeDeleted;
  try {
    postToBeDeleted = await PostModel.findOne({
      where: { id: postId },
      include: { model: FileModel },
    });
  } catch (err) {
    throw new InternalServerError();
  }

  if (!postToBeDeleted) {
    throw new NotFoundError('post_not_found');
  }

  const postJSON = postToBeDeleted.get({ plain: true });

  if (userId !== postJSON.userId && !isAdmin) {
    throw new ForbiddenError('unauthorized_post_delete');
  }

  if (postJSON.file !== null) {
    await FileService.deletePostFile(postJSON.file.filename);
  }

  try {
    await postToBeDeleted.destroy();
  } catch {
    throw new InternalServerError();
  }

  return postJSON;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Change post property isPublic to entered value .
 * Throws an Error in case of failure.
 * @param {Number} posttId PostModel instance ID.
 * @param {boolean} value True or False
 * @returns {Promise< void | Error>}  Void or  Error.
 * @author JBRS
 */
exports.setIsPublic = async (postId, value) => {
  let postToUpdate;
  try {
    postToUpdate = await PostModel.findByPk(postId);
  } catch (err) {
    throw new InternalServerError();
  }

  if (!postToUpdate) {
    throw new NotFoundError('post_not_found');
  }

  try {
    postToUpdate.isPublic = value;
    await postToUpdate.save();
  } catch (err) {
    throw new InternalServerError();
  }
};
