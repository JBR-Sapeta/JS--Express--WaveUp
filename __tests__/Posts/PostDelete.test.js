const fs = require('fs');
const path = require('path');
const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');
const FileModel = require('../../src/model/FileModel');
const LikeModel = require('../../src/model/LikeModel');
const CommentModel = require('../../src/model/CommentModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

const { UPLOAD_DIR, POST_DIR } = process.env;

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await UserModel.destroy({ truncate: { cascade: true } });
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
});

//---------------------------- TEST HELPERS ----------------------------\\

const postDirectory = path.join('.', UPLOAD_DIR, POST_DIR);
const testFileName = 'test-file-post-delete' + Date.now();
const targetPath = path.join(postDirectory, testFileName);
const testFilesDirectory = path.join(
  '.',
  '__tests__',
  'Resources',
  'test-png.png'
);

const activeUser = {
  accountName: 'user',
  email: 'user@mail.com',
  password: 'P4assword',
  isInactive: false,
};
const credentials = { email: 'user@mail.com', password: 'P4assword' };

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const getToken = async () => {
  const response = await request(app)
    .post('/api/v1.0/users/auth')
    .send(credentials);
  return response.body.token;
};

const addFile = async (postId) => {
  fs.copyFileSync(testFilesDirectory, targetPath);
  return await FileModel.create({
    filename: testFileName,
    uploadDate: new Date(),
    postId: postId,
  });
};

const addPost = async (userId) => {
  return await PostModel.create({
    content: 'New user Post',
    userId: userId,
  });
};

const addCommentsToPost = async (postId, count = 1) => {
  for (i = 0; i < count; i++) {
    const user = await UserModel.create({
      accountName: `user${i + 2}`,
      email: `user${i + 2}@mail.com`,
      isInactive: false,
      password: 'P4assword',
    });

    await CommentModel.create({
      postId,
      userId: user.id,
      content: `My short comment ${i + 2}!`,
    });
  }
};

const addLikesToPost = async (postId, count = 1) => {
  for (i = 0; i < count; i++) {
    const user = await UserModel.create({
      accountName: `user${i + 2}`,
      email: `user${i + 2}@mail.com`,
      isInactive: false,
      password: 'P4assword',
    });

    await LikeModel.create({
      postId,
      userId: user.id,
    });
  }
};

const deletePost = (postId = 5, options = {}) => {
  const agent = request(app).delete(`/api/v1.0/posts/${postId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent;
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('DELETE /api/v1.0/posts/:userId', () => {
  describe('Valid request', () => {
    it('returns 200 ok when user deletes their post', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const response = await deletePost(post.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns success message whene delete request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const response = await deletePost(post.id, { token });
      expect(response.body.message).toBe(en.post_delete_success);
    });

    it('returns delted post conntent when delete request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const response = await deletePost(post.id, { token });
      const postKeys = Object.keys(response.body.content);
      expect(postKeys).toEqual([
        'id',
        'content',
        'isPublic',
        'createdAt',
        'updatedAt',
        'userId',
        'file',
      ]);
    });

    it('removes the post from database when user deletes their post', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      await deletePost(post.id, { token });
      const postInDB = await PostModel.findOne({ where: { id: post.id } });
      expect(postInDB).toBeNull();
    });

    it('removes the post file from database when user deletes their post', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const file = await addFile(post.id);
      await deletePost(post.id, { token });
      const fileInDB = await FileModel.findOne({
        where: { id: file.id },
      });
      expect(fileInDB).toBeNull();
    });

    it('removes the file from storage when user delete their post', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      await addFile(post.id);
      await deletePost(post.id, { token });
      expect(fs.existsSync(targetPath)).toBe(false);
    });

    it('deletes comments that are associated with post from database when request send from authorized user', async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      const post = await addPost(user.id);
      await addCommentsToPost(post.id, 10);
      await deletePost(post.id, { token });
      const comments = await CommentModel.findAll();
      expect(comments.length).toBe(0);
    });

    it("deletes user's likes that are associated with post from database when request send from authorized user", async () => {
      const user = await addUser();
      const token = await getToken(credentials);
      const post = await addPost(user.id);
      await addLikesToPost(post.id, 10);
      await deletePost(post.id, { token });
      const likes = await LikeModel.findAll();
      expect(likes.length).toBe(0);
    });
  });

  describe('Invalid request', () => {
    it('returns 401 code when request is send without token', async () => {
      const response = await deletePost();
      expect(response.status).toBe(401);
    });

    it('returns error message when request is send without token', async () => {
      const response = await deletePost();
      expect(response.body.message).toBe(en.authentication_failure);
    });

    it("returns 403 when authenticated user tries to delete another user's post", async () => {
      await addUser();
      const token = await getToken();
      const otherUser = await addUser({
        accountName: 'user1',
        email: 'user1@mail.com',
        password: 'pass',
        isInactive: false,
      });
      const otherUsersPost = await addPost(otherUser.id);
      const response = await deletePost(otherUsersPost.id, { token });
      expect(response.status).toBe(403);
    });

    it("returns error message when authenticated user tries to delete another user's post", async () => {
      await addUser();
      const token = await getToken();
      const otherUser = await addUser({
        accountName: 'user1',
        email: 'user1@mail.com',
        password: 'pass',
        isInactive: false,
      });
      const otherUsersPost = await addPost(otherUser.id);
      const response = await deletePost(otherUsersPost.id, { token });
      expect(response.body.message).toBe(en.unauthorized_post_delete);
    });

    it('returns 404 code when the post with given id does not exist', async () => {
      await addUser();
      const token = await getToken();
      const response = await deletePost('does_not_exist', { token });
      expect(response.status).toBe(404);
    });
    it('returns error message when the post with given id does not exist', async () => {
      await addUser();
      const token = await getToken();
      const response = await deletePost('does_not_exist', { token });
      expect(response.body.message).toBe(en.post_not_found);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.post_delete_success}
      ${'pl'}  | ${pl.post_delete_success}
    `(
      'returns "$message" message when request is valid and the language is set as $language',
      async ({ language, message }) => {
        const user = await addUser();
        const token = await getToken();
        const post = await addPost(user.id);
        const response = await deletePost(post.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns error message "$message" when request is send without token and the language is set as $language',
      async ({ language, message }) => {
        const response = await deletePost('does_not_exist', { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_post_delete}
      ${'pl'}  | ${pl.unauthorized_post_delete}
    `(
      'returns error message "$message" when authenticated user tries to delete another users post and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const otherUser = await addUser({
          accountName: 'user1',
          email: 'user1@mail.com',
          password: 'pass',
          isInactive: false,
        });
        const otherUsersPost = await addPost(otherUser.id);
        const response = await deletePost(otherUsersPost.id, {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.post_not_found}
      ${'pl'}  | ${pl.post_not_found}
    `(
      'returns error message "$message" when the post with given id does not exist and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const response = await deletePost('does_not_exist', {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
