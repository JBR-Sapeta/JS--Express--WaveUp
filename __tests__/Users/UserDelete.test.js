const fs = require('fs');
const path = require('path');
const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');
const LikeModel = require('../../src/model/LikeModel');
const CommentModel = require('../../src/model/CommentModel');
const FileModel = require('../../src/model/FileModel');

const FileService = require('../../src/services/FileService');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

const { PROFILE_DIR, UPLOAD_DIR, POST_DIR } = process.env;
//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await UserModel.destroy({ truncate: { cascade: true } });
});

//---------------------------- TEST HELPERS ----------------------------\\
const postFile = 'post-file-for-user';
const testFilePath = path.join('.', '__tests__', 'resources', 'test-png.png');
const avatarFile = 'avatar-image-for-user';

const activeUser = {
  accountName: 'user',
  email: 'user@mail.com',
  isInactive: false,
};

const otherUser = {
  accountName: 'user1',
  email: 'user1@mail.com',
  isInactive: false,
};

const credentials = { email: 'user@mail.com', password: 'P4ssword' };

const invalidToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoidXNlcjFAZW1haWwucGwiLCJpYXQiOjE2Nzk5Mjg1NjEsImV4cCI6MTY3OTkzMjE2MX0.C6tciNENRKbQK8pQuyTlFGRMAkNTZwW690bs8R6njZk';

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash('P4ssword', 12);
  const userData = await UserModel.create({
    ...user,
    password: hash,
  });
  return userData;
};

const getToken = async (credentials) => {
  const response = await request(app)
    .post('/api/v1.0/users/auth')
    .send(credentials);
  const token = response.body.token;
  return token;
};

const addPostWithComments = async (userId, count = 1) => {
  const post = await PostModel.create({
    content: `Greate Post.`,
    userId: userId,
  });

  const comments = [];
  for (i = 0; i < count; i++) {
    const comment = await CommentModel.create({
      postId: post.id,
      userId,
      content: `My short comment ${i + 1}!`,
    });
    comments.push(comment);
  }

  return { comments, post };
};

const addPostsWithLikes = async (userId, count = 1) => {
  for (i = 0; i < count; i++) {
    const post = await PostModel.create({
      content: `Greate Post.`,
      userId: userId,
    });

    await LikeModel.create({
      postId: post.id,
      userId,
    });
  }
};

const deletUser = async (userId, body = null, options = {}) => {
  const agent = request(app).delete(`/api/v1.0/users/${userId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent.send(body);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('DELETE /api/v1.0/users/:userId', () => {
  describe('Valid request.', () => {
    it('returns 200 status code when delete request sent by authorized user', async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      const body = { password: 'P4ssword' };
      const response = await deletUser(user.id, body, { token: token });
      expect(response.status).toBe(200);
    });

    it('returns success message when delete request sent by authorized user', async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      const body = { password: 'P4ssword' };
      const response = await deletUser(user.id, body, { token: token });
      expect(response.body.message).toBe(en.user_delete_success);
    });

    it('deletes user from database when request sent from authorized user', async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      const body = { password: 'P4ssword' };
      await deletUser(user.id, body, { token: token });
      const userInDatabse = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDatabse).toBeNull();
    });

    it("deletes user's avatar image from profile directory when request sent from authorized user", async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      const avatarPath = path.join('.', UPLOAD_DIR, PROFILE_DIR, avatarFile);
      fs.copyFileSync(testFilePath, avatarPath);
      user.avatar = avatarFile;
      await user.save();
      const body = { password: 'P4ssword' };
      await deletUser(user.id, body, { token: token });
      expect(fs.existsSync(avatarPath)).toBe(false);
    });

    it("deletes user's posts from database when request send from authorized user", async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      await addPostWithComments(user.id, 10);
      const body = { password: 'P4ssword' };
      await deletUser(user.id, body, { token: token });
      const posts = await PostModel.findAll();
      expect(posts.length).toBe(0);
    });

    it('deletes post file from storage and database when delete request sent from authorized user', async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      const postTargetPath = path.join('.', UPLOAD_DIR, POST_DIR, postFile);
      fs.copyFileSync(testFilePath, postTargetPath);
      const file = await FileModel.create({ filename: postFile });
      const post = await PostModel.create({
        content: `Greate Post.`,
        userId: user.id,
      });
      await FileService.associateFileToPost(file.id, post.id);
      const body = { password: 'P4ssword' };
      await deletUser(user.id, body, { token: token });
      const fileAfterDelete = await FileModel.findOne({
        where: { id: file.id },
      });
      expect(fileAfterDelete).toBeNull();
      expect(fs.existsSync(postTargetPath)).toBe(false);
    });

    it("deletes user's comments from database when request send from authorized user", async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      await addPostWithComments(user.id);
      const body = { password: 'P4ssword' };
      await deletUser(user.id, body, { token: token });
      const comments = await CommentModel.findAll();
      expect(comments.length).toBe(0);
    });

    it("deletes user's likes from database when request send from authorized user", async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      await addPostsWithLikes(user.id);
      const body = { password: 'P4ssword' };
      await deletUser(user.id, body, { token: token });
      const posts = await PostModel.findAll();
      const likes = await LikeModel.findAll();
      expect(posts.length).toBe(0);
      expect(likes.length).toBe(0);
    });
  });

  describe('Invalid request.', () => {
    it('returns 400 code when request send without password', async () => {
      const user = await addUser();
      const body = { password: 'P4ssword' };
      const response = await deletUser(user.id);
      expect(response.status).toBe(400);
    });

    it('returns 401 status code when delete request sent by unauthorized user', async () => {
      const user = await addUser();
      const body = { password: 'P4ssword' };
      const response = await deletUser(user.id, body);
      expect(response.status).toBe(401);
    });

    it('returns 401 status code when token is not valid', async () => {
      const user = await addUser();
      const body = { password: 'P4ssword' };
      const response = await deletUser(user.id, body, { token: invalidToken });
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request send with invalid password', async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      const body = { password: 'InvalidPassword' };
      const response = await deletUser(user.id, body, { token: token });
      expect(response.status).toBe(401);
    });

    it('returns 403 status code when delete request sis sent with correct credentials but for different user', async () => {
      await addUser();
      const unauthorizedUserToken = await getToken(credentials);
      const user = await addUser(otherUser);
      const body = { password: 'P4ssword' };
      const response = await deletUser(user.id, body, {
        token: unauthorizedUserToken,
      });
      expect(response.status).toBe(403);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.user_delete_success}
      ${'pl'}  | ${pl.user_delete_success}
    `(
      "returns '$message' when delete request sent by authorized user and language is ste to '$language'",
      async ({ language, message }) => {
        const user = await addUser();
        const token = await getToken(credentials);
        const body = { password: 'P4ssword' };
        const response = await deletUser(user.id, body, {
          token: token,
          language: language,
        });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns '$message' when delete request sent by unauthorized user and language is ste to '$language'",
      async ({ language, message }) => {
        const user = await addUser();
        const body = { password: 'P4ssword' };
        const response = await deletUser(user.id, body, { language: language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns '$message' when request contains invalid password and language is set as $language",
      async ({ language, message }) => {
        const user = await addUser();
        const body = { password: 'InvalidPassword' };
        const response = await deletUser(user.id, body, { language: language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_user_delete}
      ${'pl'}  | ${pl.unauthorized_user_delete}
    `(
      "returns '$message' when delete request sent by unauthorized user and language is ste to '$language'",
      async ({ language, message }) => {
        await addUser();
        const unauthorizedUserToken = await getToken(credentials);
        const user = await addUser(otherUser);
        const body = { password: 'P4ssword' };
        const response = await deletUser(user.id, body, {
          token: unauthorizedUserToken,
          language: language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
