const Sequellize = require('sequelize');
const sequelize = require('../database/db');

const Model = Sequellize.Model;

class FileModel extends Model {}

FileModel.init(
  {
    filename: {
      type: Sequellize.STRING,
    },
    uploadDate: {
      type: Sequellize.DATE,
    },
    fileType: {
      type: Sequellize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'file',
    timestamps: false,
  }
);

module.exports = FileModel;
