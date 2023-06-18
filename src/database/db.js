const Sequelize = require('sequelize');

const { DB_NAME, DB_USER, DB_PASSWORD, DB_DIALECT, DB_STORAGE, DB_LOGGING } =
  process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  dialect: DB_DIALECT,
  storage: DB_STORAGE,
  logging: Boolean(DB_LOGGING),
});


module.exports = sequelize;
