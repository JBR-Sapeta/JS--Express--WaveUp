//Setting up .env variables.
const path = require('path');
const envPath = path.join(__dirname, `.env.${process.env.NODE_ENV}`);
require('dotenv').config({ path: envPath });

const app = require('./src/app');
const sequelize = require('./src/database/db');
const logger = require('./src/utils/logger');

process.on('uncaughtException', (err) => {
  logger.error(`Error: ${err.message}`);
  logger.error('Shuting down the server due to uncaught exception.');
  process.exit(1);
});

//Connecting to databse.
sequelize.sync();

//Clean up function.
const FileService = require('./src/services/FileService');
FileService.removeUnusedFiles();

//Starting up server.
app.listen(process.env.PORT || 3000, () => {
  logger.info(
    `App is Runing 🚀. http://localhost:${process.env.PORT || 3080} in ${process.env.NODE_ENV} mode. Versio - ${process.env.npm_package_version}`
  );
  console.log(
    `App is Runing 🚀. http://localhost:${process.env.PORT || 3080} in ${process.env.NODE_ENV} mode. Versio - ${process.env.npm_package_version}`
  );
});

process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
  logger.error('Shuting down the server due to unhandled promise rejection.');
  server.close(() => {
    process.exit(1);
  });
});
