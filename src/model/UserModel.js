const Sequelize = require('sequelize');
const sequelize = require('../database/db');

const PostModel = require('./PostModel');
const LikeModel = require('./LikeModel');
const CommentModel = require('./CommentModel');

const Model = Sequelize.Model;

class UserModel extends Model {}

UserModel.init(
  {
    accountName: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },

    username: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'User',
    },

    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },

    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    isAdmin: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },

    isInactive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },

    hasBan: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },

    activationToken: {
      type: Sequelize.STRING,
    },

    passwordResetToken: {
      type: Sequelize.STRING,
    },

    avatar: {
      type: Sequelize.STRING,
    },
    city: {
      type: Sequelize.STRING,
    },
    birthday: {
      type: Sequelize.DataTypes.DATE,
    },

    description: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'user',
  }
);

UserModel.hasMany(PostModel, { foreignKey: 'userId', onDelete: 'cascade' });
PostModel.belongsTo(UserModel);

UserModel.hasMany(LikeModel, { foreignKey: 'userId', onDelete: 'cascade' });
LikeModel.belongsTo(UserModel);

UserModel.hasMany(CommentModel, { foreignKey: 'userId', onDelete: 'cascade' });
CommentModel.belongsTo(UserModel);

module.exports = UserModel;
