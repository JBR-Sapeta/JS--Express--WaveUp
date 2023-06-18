const path = require('path');
const fs = require('fs');
const Sequelize = require('sequelize');

const FileService = require('../../src/services/FileService');

const FileModel = require('../../src/model/FileModel');
const PostModel = require('../../src/model/PostModel');
const UserModel = require('../../src/model//UserModel');

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await FileModel.destroy({ truncate: true });
  await UserModel.destroy({ truncate: { cascade: true } });
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
});

//---------------------------- TEST HELPERS ----------------------------\\

const { UPLOAD_DIR, POST_DIR } = process.env;
const postImageFolder = path.join('.', UPLOAD_DIR, POST_DIR);
const filename = 'test-file' + Date.now();
const testFile = path.join('.', '__tests__', 'Resources', 'test-png.png');
const targetPath = path.join(postImageFolder, filename);

const addPost = async () => {
  const user = await UserModel.create({
    accountName: `user1`,
    email: `user1@mail.com`,
    password: 'Pass',
  });
  const post = await PostModel.create({
    content: `Post content 1`,
    timestamp: Date.now(),
    userId: user.id,
  });
  return post.id;
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('Scheduled unused file clean up', () => {
  it('removes the 24 hours old file if not used in post', async () => {
    jest.useFakeTimers();

    fs.copyFileSync(testFile, targetPath);
    const uploadDate = new Date(Date.now() - 24 * 60 * 60 * 1000 - 1);
    const file = await FileModel.create({
      filename: filename,
      uploadDate: uploadDate,
    });

    await FileService.removeUnusedFiles();
    jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 5000);
    jest.useRealTimers();

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const fileAfterRemove = await FileModel.findOne({
      where: { id: file.id },
    });
    expect(fileAfterRemove).toBeNull();
    expect(fs.existsSync(targetPath)).toBe(false);
  });

  it('keeps the files younger than 24 hours and their database entry even not associated with post', async () => {
    jest.useFakeTimers();

    fs.copyFileSync(testFile, targetPath);
    const uploadDate = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const file = await FileModel.create({
      filename: filename,
      uploadDate: uploadDate,
    });

    await FileService.removeUnusedFiles();
    jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 5000);
    jest.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const fileAfterRemove = await FileModel.findOne({
      where: { id: file.id },
    });
    expect(fileAfterRemove).not.toBeNull();
    expect(fs.existsSync(targetPath)).toBe(true);
  });

  it('keeps the files older than 24 hours and their database entry if associated with post', async () => {
    jest.useFakeTimers();

    fs.copyFileSync(testFile, targetPath);
    const id = await addPost();
    const uploadDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const file = await FileModel.create({
      filename: filename,
      uploadDate: uploadDate,
      postId: id,
    });
    await FileService.removeUnusedFiles();
    jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 5000);
    jest.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const fileAfterRemove = await FileModel.findOne({
      where: { id: file.id },
    });
    expect(fileAfterRemove).not.toBeNull();
    expect(fs.existsSync(targetPath)).toBe(true);
  });
});
