const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, `.env.${process.env.NODE_ENV}`);
require('dotenv').config({ path: envPath });

//Cleaning up test directory.
const { UPLOAD_DIR, PROFILE_DIR, POST_DIR } = process.env;
const profileDirectory = path.join('.', UPLOAD_DIR, PROFILE_DIR);
const postDirectory = path.join('.', UPLOAD_DIR, POST_DIR);

const clearFolder = (folder) => {
  const files = fs.readdirSync(folder);
  for (const file of files) {
    fs.unlinkSync(path.join(folder, file));
  }
};

clearFolder(profileDirectory);
clearFolder(postDirectory);
