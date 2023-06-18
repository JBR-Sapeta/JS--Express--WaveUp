const request = require('supertest');
const fs = require('fs');
const path = require('path');

const app = require('../../src/app');

//----------------------------- TEST SETUP -----------------------------\\

//---------------------------- TEST HELPERS ----------------------------\\

const { UPLOAD_DIR, PROFILE_DIR, POST_DIR } = process.env;
const profileImagePath = path.join('.', UPLOAD_DIR, PROFILE_DIR);
const postImageFolder = path.join('.', UPLOAD_DIR, POST_DIR);

const copyFile = (filesPath) => {
  const filePath = path.join('.', '__tests__', 'Resources', 'test-png.png');
  const storedFileName = 'test-file';
  const targetPath = path.join(filesPath, storedFileName);
  fs.copyFileSync(filePath, targetPath);
  return storedFileName;
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('Profile Images', () => {
  describe('Valid request.', () => {
    it('returns 200 code  when file exist', async () => {
      const storedFileName = copyFile(profileImagePath);
      const response = await request(app).get('/images/' + storedFileName);
      expect(response.status).toBe(200);
    });
    it('returns cache for 1 year in response', async () => {
      const storedFileName = copyFile(profileImagePath);
      const response = await request(app).get('/images/' + storedFileName);
      const oneYearInSeconds = 365 * 24 * 60 * 60;
      expect(response.header['cache-control']).toContain(
        `max-age=${oneYearInSeconds}`
      );
    });
  });

  describe('Invalid request.', () => {
    it('returns 404 code when file not found', async () => {
      const response = await request(app).get('/images/123456');
      expect(response.status).toBe(404);
    });
  });
});

describe('Post Images', () => {
  describe('Valid request.', () => {
    it('returns 200 code ok when file exist', async () => {
      const storedFileName = copyFile(postImageFolder);
      const response = await request(app).get('/posts/' + storedFileName);
      expect(response.status).toBe(200);
    });
    it('returns cache for 1 year in response', async () => {
      const storedFileName = copyFile(postImageFolder);
      const response = await request(app).get('/posts/' + storedFileName);
      const oneYearInSeconds = 365 * 24 * 60 * 60;
      expect(response.header['cache-control']).toContain(
        `max-age=${oneYearInSeconds}`
      );
    });
  });

  describe('Invalid request.', () => {
    it('returns 404 code when file not found', async () => {
      const response = await request(app).get('/posts/123456');
      expect(response.status).toBe(404);
    });
  });
});
