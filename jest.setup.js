//Setting up .env variables.
const path = require('path');
const envPath = path.join(__dirname, `.env.${process.env.NODE_ENV}`);
require('dotenv').config({ path: envPath });
const UserModel = require('./src/model/UserModel');
const FileModel = require('./src/model/FileModel');
const PostModel = require('./src/model/PostModel');

//Connecting to databse.
const sequelize = require('./src/database/db');

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await sequelize.sync();
  }

  if (process.env.NODE_ENV === 'staging') {
    await UserModel.destroy({ truncate: { cascade: true } });
    await PostModel.destroy({ truncate: { cascade: true } });
    await FileModel.destroy({ truncate: true });
  }
});
