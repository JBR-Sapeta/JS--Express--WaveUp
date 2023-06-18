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

const postLike = (postId, options = {}) => {
  const agent = request(app).post(`/api/v1.0/likes/${postId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent;
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/likes/:postId', () => {
  describe('Valid Request', () => {
    it('returns 200 code when request is valid', async () => {
      await addUser();
      const token = await getToken();
      const post = await addPost();
      const response = await postLike(post.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns succes message when request is valid', async () => {
      await addUser();
      const token = await getToken();
      const post = await addPost();
      const response = await postLike(post.id, { token });
      expect(response.body.message).toBe(en.like_create_success);
    });

    it('creates like record in database when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost();
      await postLike(post.id, { token });
      const [likeInDB] = await LikeModel.findAll();
      expect(likeInDB).toBeTruthy();
      expect(likeInDB.userId).toBe(user.id);
      expect(likeInDB.postId).toBe(post.id);
    });
  });

  describe('Invalid Request', () => {
    it('returns 400 code when request is send for post that already has like', async () => {
      await addUser();
      const token = await getToken();
      const post = await addPost();
      await postLike(post.id, { token });
      const response = await postLike(post.id, { token });
      expect(response.status).toBe(400);
    });

    

    it('returns 401 code when request is send without token', async () => {
      await addUser();
      const post = await addPost();
      const response = await postLike(post.id);
      expect(response.status).toBe(401);
    });

   

    it('returns 401 code when request is send with invalid token', async () => {
      await addUser();
      const post = await addPost();
      const response = await postLike(post.id, { token: 'invalid_token' });
      expect(response.status).toBe(401);
    });

  

    it('returns 404 code when request is send for post that does not exist', async () => {
      await addUser();
      const token = await getToken();
      const response = await postLike('post_does_not_exist', { token });
      expect(response.status).toBe(404);
    });

   
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.like_create_success}
      ${'pl'}  | ${pl.like_create_success}
    `(
      'returns error message "$message" when request is valid and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const post = await addPost();
        const response = await postLike(post.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.like_already_exist}
      ${'pl'}  | ${pl.like_already_exist}
    `(
      'returns "$message" message  when request is send for post that already has like and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const post = await addPost();
        await postLike(post.id, { token });
        const response = await postLike(post.id, { token, language });
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
      const response = await postLike(post.id, {language});
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
        const response = await postLike(post.id, {
          token: 'invalid_token',
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
      'returns "$message" message when request is send for post that does not exist and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const response = await postLike('post_does_not_exist', {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
