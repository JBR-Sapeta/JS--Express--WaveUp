const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');
const LikeModel = require('../../src/model/LikeModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await UserModel.destroy({ truncate: { cascade: true } });
});

//---------------------------- TEST HELPERS ----------------------------\\

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

const addPost = async (userId) => {
  const post = await PostModel.create({
    content: `Greate Content.`,
    userId: userId,
  });

  return post;
};

const addLike = async (postId, userId) => {
  const like = await LikeModel.create({ postId, userId });
  return like;
};

const deleteLike = (postId, options = {}) => {
  const agent = request(app).delete(`/api/v1.0/likes/${postId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent;
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('DELET /api/v1.0/likes/:postId', () => {
  describe('Valid Request', () => {
    it('returns 200 code when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost();
      await addLike(post.id, user.id);
      const response = await deleteLike(post.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns succes message when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost();
      await addLike(post.id, user.id);
      const response = await deleteLike(post.id, { token });
      expect(response.body.message).toBe(en.like_delete_success);
    });

    it('removes like record from database when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost();
      await addLike(post.id, user.id);
      await deleteLike(post.id, { token });
      const [likeInDB] = await LikeModel.findAll();
      expect(likeInDB).toBeFalsy();
    });
  });

  describe('Invalid Request', () => {
    it('returns 401 code when request is send without token', async () => {
      await addUser();
      const post = await addPost();
      const response = await deleteLike(post.id);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send with invalid token', async () => {
      await addUser();
      const post = await addPost();
      const response = await deleteLike(post.id, { token: 'invalid_token' });
      expect(response.status).toBe(401);
    });

    it('returns 404 code when request is send for like that does not exist', async () => {
      await addUser();
      const token = await getToken();
      const post = await addPost();
      const response = await deleteLike(post.id, { token });
      expect(response.status).toBe(404);
    });

    it('returns 404 code when request is send for post that does not exist', async () => {
      await addUser();
      const token = await getToken();
      const response = await deleteLike('does_not_exist', { token });
      expect(response.status).toBe(404);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.like_delete_success}
      ${'pl'}  | ${pl.like_delete_success}
    `(
      'returns error message "$message" when request is valid and the language is set as $language',
      async ({ language, message }) => {
        const user = await addUser();
        const token = await getToken();
        const post = await addPost();
        await addLike(post.id, user.id);
        const response = await deleteLike(post.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns "$message" message when request is send without token and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const post = await addPost();
        const response = await deleteLike(post.id, { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns "$message" message when request is send with invalid token and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const post = await addPost();
        const response = await deleteLike(post.id, {
          token: 'invalid_token',
          language,
        });

        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.like_not_found}
      ${'pl'}  | ${pl.like_not_found}
    `(
      'returns "$message" message when request is send for post that does not exist and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const post = await addPost();
        const response = await deleteLike(post.id, {
          token: token,
          language,
        });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.post_not_found}
      ${'pl'}  | ${pl.post_not_found}
    `(
      'returns "$message" message when request is send for post that does not exist and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const response = await deleteLike('does_not_exist', {
          token: token,
          language,
        });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe(message);
      }
    );
  });
});
