const Sequelize = require('sequelize');
const sequelize = require('../database/db');

const FileModel = require('./FileModel');
const LikeModel = require('./LikeModel');
const CommentModel = require('./CommentModel');

const Model = Sequelize.Model;

class PostModel extends Model {}

PostModel.init(
  {
    content: {
      type: Sequelize.STRING,
    },
    isPublic: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'post',
  }
);

PostModel.hasOne(FileModel, { foreignKey: 'postId', onDelete: 'cascade ' });
FileModel.belongsTo(PostModel);

PostModel.hasMany(LikeModel, { foreignKey: 'postId', onDelete: 'cascade ' });
LikeModel.belongsTo(PostModel);

PostModel.hasMany(CommentModel, { foreignKey: 'postId', onDelete: 'cascade ' });
CommentModel.belongsTo(PostModel);

module.exports = PostModel;
