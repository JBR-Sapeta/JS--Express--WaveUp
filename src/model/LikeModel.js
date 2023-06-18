const Sequelize = require('sequelize');
const sequelize = require('../database/db');

const Model = Sequelize.Model;

class LikeModel extends Model {}

LikeModel.init(
  {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
    postId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'like',
  }
);


module.exports = LikeModel;