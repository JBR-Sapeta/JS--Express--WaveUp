const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await UserModel.destroy({ truncate: { cascade: true } });
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

const putShowPost = (postId, options = {}) => {
  const agent = request(app).put(`/api/v1.0/admin/posts/show/${postId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({});
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('PUT /api/v1.0/admin/posts/show/:postId', () => {
  describe('Valid Request', () => {
    it('returns 200 code when request is valid', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      const response = await putShowPost(post.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns success message when request is valid', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      const response = await putShowPost(post.id, { token });
      expect(response.body.message).toBe(en.post_public);
    });

    it('sets isPublic property to true in database', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      await addAdmin();
      const token = await getToken();
      await putShowPost(post.id, { token });
      const [postsInDB] = await PostModel.findAll();
      expect(postsInDB.isPublic).toBe(true);
    });
  });

  describe('Inalid Request', () => {
    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      const response = await putShowPost(post.id);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send with invalid token', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      const response = await putShowPost(post.id, { token: 'Invalid_Token' });
      expect(response.status).toBe(401);
    });

    it('returns 403 code when request is send by user that is not an admin', async () => {
      const admin = addAdmin();
      const post = await addPost(admin.id);
      await addUser();
      const token = await getToken(userAuth);
      const response = await putShowPost(post.id, { token });
      expect(response.status).toBe(403);
    });

    it('returns 404 code when request is send for post that does not exist', async () => {
      await addAdmin();
      const token = await getToken();
      const response = await putShowPost('does_not_exist', { token });
      expect(response.status).toBe(404);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.post_public}
      ${'pl'}  | ${pl.post_public}
    `(
      'returns success message "$message" when request is valid and the language is set as "$language"',
      async ({ language, message }) => {
        const user = await addUser();
        const post = await addPost(user.id);
        await addAdmin();
        const token = await getToken();
        const response = await putShowPost(post.id, { token, language });
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
        const response = await putShowPost(post.id, { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_post_update}
      ${'pl'}  | ${pl.unauthorized_post_update}
    `(
      'returns error message "$message" when request is send by user that is not an admin and the language is set as "$language"',
      async ({ language, message }) => {
        const admin = addAdmin();
        const post = await addPost(admin.id);
        await addUser();
        const token = await getToken(userAuth);
        const response = await putShowPost(post.id, { token, language });
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
        const response = await putShowPost('does_not_exist', {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
