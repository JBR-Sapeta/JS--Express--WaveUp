'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  user.init({
    accountName: DataTypes.STRING,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    isAdmin: DataTypes.BOOLEAN,
    isInactive: DataTypes.BOOLEAN,
    hasBan: DataTypes.BOOLEAN,
    activationToken: DataTypes.STRING,
    passwordResetToken: DataTypes.STRING,
    avatar: DataTypes.STRING,
    city: DataTypes.STRING,
    birthday: DataTypes.DATE,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};