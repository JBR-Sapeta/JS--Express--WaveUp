const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FileType = require('file-type');
const Sequelize = require('sequelize');

const logger = require('../utils/logger');

const FileModel = require('../model/FileModel');
const PostModel = require('../model/PostModel');

const InternalServerError = require('../errors/500/InternalServerError');
const BadRequestError = require('../errors/400/BadRequestError');

const { IMAGE_SIZE_LIMIT, UPLOAD_DIR, PROFILE_DIR, POST_DIR } = process.env;
const avatarImageFolder = path.join('.', UPLOAD_DIR, PROFILE_DIR);
const postImageFolder = path.join('.', UPLOAD_DIR, POST_DIR);

exports.createFolders = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
  }

  if (!fs.existsSync(avatarImageFolder)) {
    fs.mkdirSync(avatarImageFolder);
  }

  if (!fs.existsSync(postImageFolder)) {
    fs.mkdirSync(postImageFolder);
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Checks if file type of buffer meet server criteria.
 * Returns true if file type is supported, otherwise false.
 * @param { Buffer } buffer
 * @returns {Promise<Boolean>}  true | false
 * @author JBRS
 */
const isSupportedFileType = async (buffer) => {
  const type = await FileType.fromBuffer(buffer);

  return !type
    ? false
    : type.mime === 'image/png' || type.mime === 'image/jpeg';
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Validates if given image has proper size and file type.
 * Returns true if image is valid, otherwise throws an Error.
 * @param { String } imageAsBase64String Base64 Format.
 * @returns {Promise<Boolean | Error>}  true | Error
 * @author JBRS
 */
exports.validateImage = async (imageAsBase64String) => {
  if (!imageAsBase64String) {
    return true;
  }

  const buffer = Buffer.from(imageAsBase64String, 'base64');

  if (buffer.length >= Number.parseInt(IMAGE_SIZE_LIMIT)) {
    throw new Error('profile_avatar_size');
  }

  let supportedType;
  try {
    supportedType = await isSupportedFileType(buffer);
  } catch (error) {
    throw error;
  }

  if (!supportedType) {
    throw new Error('unsupported_image_file');
  }

  return true;
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * It saves given file in profile directory.
 * Returns filename of saved file. Throws an Error in case of failure.
 * @param { String } base64File
 * @returns {Promise<String |Error>}  Filename or Error.
 * @author JBRS
 */
exports.saveProfileAvatar = async (base64File) => {
  const filename = uuidv4();
  const filePath = path.join(avatarImageFolder, filename);
  try {
    await fs.promises.writeFile(filePath, base64File, 'base64');
  } catch (error) {
    throw error;
  }
  return filename;
};

//It deletes user image.
//-----------------------------------------------------------------------------------------------------\\
/**
 * Creates password reset token in database for user with given email address.
 * Throws an Error in case of failure.
 * @param { String } filename User email.
 * @returns {Promise<void | Error>}  Void or Error.
 * @author JBRS
 */
exports.deleteProfileAvatar = async (filename) => {
  const filePath = path.join(avatarImageFolder, filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    throw error;
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Saves file in post directory and creates corresponding record in database.
 * Throws an Error in case of failure.
 * @param { Blob} file
 * @returns {Promise<{id:Number} | Error>}  Object which contains file ID.
 * @author JBRS
 */
exports.saveFile = async (file) => {
  const type = await FileType.fromBuffer(file.buffer);
  let fileType;
  let filename = uuidv4();

  if (type) {
    fileType = type.mime;
    filename += `.${type.ext}`;
    if (!type.mime.match(/\/(jpg|jpeg|png)$/) || type.mime === null) {
      throw new BadRequestError(null, 'unsupported_image_file');
    }
  } else {
    throw new BadRequestError(null, 'unsupported_image_file');
  }

  try {
    await fs.promises.writeFile(
      path.join(postImageFolder, filename),
      file.buffer
    );
  } catch {
    throw new InternalServerError();
  }
  let savedFile;
  try {
    savedFile = await FileModel.create({
      filename,
      uploadDate: new Date(),
      fileType: fileType,
    });
  } catch (err) {
    logger.error(err);
    throw new InternalServerError();
  }

  return {
    id: savedFile.id,
    filename: savedFile.filename,
    fileType: savedFile.fileType,
  };
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Creates association between Post and File in database.
 * Throws an Error in case of failure.
 * @param { Number } fileId FileModel instance ID.
 * @param { Number } postId PostModel instance ID.
 * @returns {Promise<void | Error>}  Void or Error.
 * @author JBRS
 */
exports.associateFileToPost = async (fileId, postId) => {
  let file;
  try {
    file = await FileModel.findOne({ where: { id: fileId } });
  } catch {
    throw new InternalServerError();
  }

  if (!file || file.postId) {
    return;
  }

  try {
    file.postId = postId;
    await file.save();
  } catch {
    throw new InternalServerError();
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Removes file with given filename.
 * Throws an Error in case of failure.
 * @param { String } filename
 * @returns {Promise<void | Error>}  Void or Error.
 * @author JBRS
 */
exports.deletePostFile = async (filename) => {
  const filePath = path.join(postImageFolder, filename);
  try {
    await fs.promises.access(filePath);
    await fs.promises.unlink(filePath);
  } catch (err) {
    logger.error(err);
  }
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Removes unused files which don't have association with any post. It runs every 24 hours.
 * @author JBRS
 */
exports.removeUnusedFiles = async () => {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    const oneDayOld = new Date(Date.now() - ONE_DAY);
    let unusedFiles;
    try {
      unusedFiles = await FileModel.findAll({
        where: {
          uploadDate: {
            [Sequelize.Op.lt]: oneDayOld,
          },
          postId: {
            [Sequelize.Op.is]: null,
          },
        },
      });
    } catch (err) {
      logger.error(err);
    }

    for (let file of unusedFiles) {
      const { filename } = file.get({ plain: true });
      try {
        await fs.promises.unlink(path.join(postImageFolder, filename));
        await file.destroy();
      } catch (err) {
        logger.error(err);
      }
    }
  }, ONE_DAY);
};

//-----------------------------------------------------------------------------------------------------\\
/**
 * Removes all stored files that belongs to user with given ID.
 * Throws an Error in case of failure.
 * @param { String } userId
 * @returns {Promise<void | Error>}  Void or Error.
 * @author JBRS
 * @todo Add errors to logger.
 */
exports.deleteUserFiles = async (userId) => {
  const files = await FileModel.findAll({
    attributes: ['filename'],
    include: {
      model: PostModel,
      where: { userId },
    },
  });

  if (files.length === 0) {
    return;
  }
  for (let file of files) {
    const filePath = path.join(postImageFolder, file.filename);
    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
    } catch (err) {
      logger.error(err);
    }
  }
};
