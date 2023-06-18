const fs = require('fs');
const path = require('path');
const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');
const FileModel = require('../../src/model/FileModel');
const CommentModel = require('../../src/model/CommentModel');
const LikeModel = require('../../src/model/LikeModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

const { UPLOAD_DIR, POST_DIR } = process.env;
const postDirectory = path.join('.', UPLOAD_DIR, POST_DIR);
const testFileName = 'test-file-post-delete' + Date.now();
const targetPath = path.join(postDirectory, testFileName);
const testFilesDirectory = path.join(
  '.',
  '__tests__',
  'Resources',
  'test-png.png'
);

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await UserModel.destroy({ truncate: { cascade: true } });
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
});

//---------------------------- TEST HELPERS ----------------------------\\

const activAdmin = {
  accountName: 'user',
  email: 'user@mail.com',
  password: 'P4assword',
  isInactive: false,
  isAdmin: true,
};

const adminAuth = { email: 'user@mail.com', password: 'P4assword' };

const activeUser = {
  accountName: 'user1',
  email: 'user1@mail.com',
  password: 'P4assword',
  isInactive: false,
  isAdmin: false,
};

const userAuth = { email: 'user1@mail.com', password: 'P4assword' };

const addAdmin = async (user = { ...activAdmin }) => {
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const getToken = async (body = adminAuth) => {
  const response = await request(app).post('/api/v1.0/users/auth').send(body);
  return response.body.token;
};

const addPost = async (userId) => {
  const post = await PostModel.create({
    content: `Greate Post.`,
    userId: userId,
  });

  return post;
};

const addFile = async (postId) => {
  fs.copyFileSync(testFilesDirectory, targetPath);
  return await FileModel.create({
    filename: testFileName,
    uploadDate: new Date(),
    postId: postId,
  });
};

const addCommentsAndLikesToPost = async (postId, count = 1 , ) => {
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

    await LikeModel.create({
      postId,
      userId: user.id,
    });
  }
};

const deletePost = (postId, options = {}) => {
  const agent = request(app).delete(`/api/v1.0/admin/posts/${postId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({});
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('DELETE /api/v1.0/admin/posts/:postId', () => {
  describe('Valid Request', () => {
    it('returns 200 code when request is valid', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      const response = await deletePost(post.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns success message when request is valid', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      const response = await deletePost(post.id, { token });
      expect(response.body.message).toBe(en.post_delete_success);
    });

    it('removes post from database', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      await deletePost(post.id, { token });
      const postInDB = await PostModel.findByPk(post.id);
      expect(postInDB).toBe(null);
    });

    it('removes the file record from database when request is valid', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      const file = await addFile(post.id);
      await deletePost(post.id, { token });
      const fileInDB = await FileModel.findByPk(file.id);
      expect(fileInDB).toBeNull();
    });

    it('removes the file from storage when user delete their post', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      await addFile(post.id);
      await deletePost(post.id, { token });
      expect(fs.existsSync(targetPath)).toBe(false);
    });

    it('deletes comments that are associated with post from database when request is valid', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      await addCommentsAndLikesToPost(post.id, 10);
      await deletePost(post.id, { token });
      const comments = await CommentModel.findAll();
      expect(comments.length).toBe(0);
    });

    it("deletes user's likes that are associated with post from database when request is valid", async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      await addCommentsAndLikesToPost(post.id, 10);
      await deletePost(post.id, { token });
      const likes = await LikeModel.findAll();
      expect(likes.length).toBe(0);
    });
  });

  describe('Invalid request', () => {
    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const response = await deletePost(post.id);
      expect(response.status).toBe(401);
    });

    it('returns 403 code when request is send by user that is not an admin', async () => {
      const admin = addAdmin();
      const post = await addPost(admin.id);
      await addUser();
      const token = await getToken(userAuth);
      const response = await deletePost(post.id, { token });
      expect(response.status).toBe(403);
    });

    it('returns 404 code when request is send for post that does not exist', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      const response = await deletePost('does_not_exist', { token });
      expect(response.status).toBe(404);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.post_delete_success}
      ${'pl'}  | ${pl.post_delete_success}
    `(
      'returns success message "$message" when request is valid and the language is set as "$language"',
      async ({ language, message }) => {
        const user = await addUser();
        const post = await addPost(user.id);
        await addAdmin();
        const token = await getToken();
        const response = await deletePost(post.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns error message "$message" when request is send without tokenand and the language is set as "$language"',
      async ({ language, message }) => {
        const user = await addUser();
        const post = await addPost(user.id);
        const response = await deletePost(post.id, { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_post_delete}
      ${'pl'}  | ${pl.unauthorized_post_delete}
    `(
      'returns error message "$message" when request is send by user that is not an admin and the language is set as "$language"',
      async ({ language, message }) => {
        const admin = addAdmin();
        const post = await addPost(admin.id);
        await addUser();
        const token = await getToken(userAuth);
        const response = await deletePost(post.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.post_not_found}
      ${'pl'}  | ${pl.post_not_found}
    `(
      'returns error message "$message" when request is send for post that does not exist and the language is set as "$language"',
      async ({ language, message }) => {
        await addAdmin();
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
