const Sequelize = require('sequelize');
const sequelize = require('../database/db');

const Model = Sequelize.Model;

class CommentModel extends Model {}

CommentModel.init(
  {
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    postId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    content: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'comment',
  }
);

module.exports = CommentModel;
