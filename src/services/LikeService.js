const LikeModel = require('../model/LikeModel');

const BadRequestError = require("../errors/400/BadRequestError")
const NotFoundError = require('../errors/400/NotFoundError');
const InternalServerError = require('../errors/500/InternalServerError');


//-----------------------------------------------------------------------------------------------------\\
/**
 * Creates new like in database for given post and user.
 * Throws an Error in case of failure.
 * @param {Number} postId  PostModel instance ID.
 * @param {Number} userId  UserModel instance ID.
 * @returns {Promise< void | Error>}   Void or Error.
 * @author JBRS
 */
exports.addLike = async (postId, userId) => {
  try {
    await LikeModel.create({ userId, postId });
  } catch (error) {
    if(error.name === "SequelizeUniqueConstraintError"){
        throw new BadRequestError(null,"like_already_exist")
    }
    throw new InternalServerError();
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Deletes like in database for given post and user.
 * Throws an Error in case of failure.
 * @param {Number} postId  PostModel instance ID.
 * @param {Number} userId  UserModel instance ID.
 * @returns {Promise< void | Error>}   Void or Error.
 * @author JBRS
 */
exports.removeLike = async (postId, userId) => {
  let like;
  try {
    like = await LikeModel.findOne({
      where: { postId, userId },
    });
  } catch (error) {

    throw new InternalServerError();
  }

  if (!like) {
    throw new NotFoundError('like_not_found');
  }

  try {
    await like.destroy();
  } catch {
    throw new InternalServerError();
  }
};
