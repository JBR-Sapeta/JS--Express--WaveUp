const UserModel = require('../model//UserModel');
const CommentModel = require('../model/CommentModel');

const NotFoundError = require('../errors/400/NotFoundError');
const ForbiddenError = require('../errors/400/ForbiddenError');
const InternalServerError = require('../errors/500/InternalServerError');

//-----------------------------------------------------------------------------------------------------\\
/**
 * Creates comment in database for given post.
 * Returns data of inserted comment. Throws an Error in case of failure.
 * @param {Number} postId  PostModel instance ID.
 * @param {Number} userId  UserModel instance ID.
 * @param {String} content  Conetent of the Comment.
 * @returns {Promise< CommentModel | Error>} CommentModel plain data or Error.
 * @author JBRS
 */
exports.addPostComment = async (postId, userId, content) => {
  let comment;
  try {
    comment = await CommentModel.create({ postId, userId, content });
  } catch (error) {
    throw new InternalServerError();
  }

  const commentAsJSON = comment.get({ plain: true });

  return commentAsJSON;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Search for comments in database for given post Id.
 * Returns list of coments. Throws an Error in case of failure.
 * @param {Number} page  Use to calculate offset.
 * @param {Number} size  Use to calculate offset and as limit.
 * @param {Number} postId  PostModel instance ID.
 * @returns {Promise< Object | Error>} CommentModel plain data or Error.
 * @author JBRS
 */
exports.getPostComments = async (page, size, postId) => {
  let commentsWithCount;
  try {
    commentsWithCount = await CommentModel.findAndCountAll({
      attributes: ['id', 'content', 'createdAt'],
      where: { postId },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
      order: [['id', 'ASC']],
      limit: size,
      offset: page * size,
    });
  } catch {
    throw new InternalServerError();
  }

  return {
    data: commentsWithCount.rows.map((commentSequelize) => {
      return (commentAsJSON = commentSequelize.get({ plain: true }));
    }),
    page,
    size,
    totalPages: Math.ceil(commentsWithCount.count / size),
  };
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Updates content of a comment in database for given comment id.
 * Returns data of updated comment. Throws an Error in case of failure.
 * @param {Number} commentId  CommentModel instance ID.
 * @param {Number} userId  UserModel instance ID.
 * @param {String} content  Content of the Comment.
 * @param {Boolean} isAdmin Default false.
 * @returns {Promise< CommentModel | Error>} CommentModel plain data or Error.
 * @author JBRS
 */
exports.updatePostComment = async (
  commentId,
  userId,
  content,
  isAdmin = false
) => {
  let comment;

  try {
    comment = await CommentModel.findByPk(commentId);
  } catch {
    throw new InternalServerError();
  }

  if (!comment) {
    throw new NotFoundError('comment_not_found');
  }

  if (comment.userId !== userId && !isAdmin) {
    throw new ForbiddenError('unauthorized_comment_update');
  }

  try {
    comment.content = content;
    await comment.save();
  } catch {
    throw new InternalServerError();
  }
  const commentAsJSON = comment.get({ plain: true });

  return commentAsJSON;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Removes comment from database for given comment id.
 * Returns data of removed comment. Throws an Error in case of failure.
 * @param {Number} commentId  CommentModel instance ID.
 * @param {Number} userId  UserModel instance ID.
 * @returns {Promise< CommentModel | Error>} CommentModel plain data or Error.
 * @author JBRS
 */
exports.removePostComment = async (commentId, userId) => {
  let comment;

  try {
    comment = await CommentModel.findByPk(commentId);
  } catch {
    throw new InternalServerError();
  }

  if (!comment) {
    throw new NotFoundError('comment_not_found');
  }

  if (comment.userId !== userId) {
    throw new ForbiddenError('unauthorized_comment_delete');
  }

  const commentAsJSON = comment.get({ plain: true });

  try {
    await comment.destroy();
  } catch {
    throw new InternalServerError();
  }

  return commentAsJSON;
};
