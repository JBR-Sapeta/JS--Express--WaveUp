const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');
const CommentModel = require('../../src/model/CommentModel');

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

const postComment = (postId, body, options = {}) => {
  const agent = request(app).post(`/api/v1.0/comments/${postId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send(body);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/comments/:postId', () => {
  describe('Valid Request', () => {
    const body = { content: 'My new comment content.' };

    it('returns 200 code when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const response = await postComment(post.id, body, { token });
      expect(response.status).toBe(200);
    });

    it('returns succes message when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const response = await postComment(post.id, body, { token });
      expect(response.body.message).toBe(en.comment_create_success);
    });

    it('returns comment content when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const response = await postComment(post.id, body, { token });
      const commentKeys = Object.keys(response.body.comment);
      expect(commentKeys).toEqual([
        'id',
        'postId',
        'userId',
        'content',
        'updatedAt',
        'createdAt',
      ]);
    });

    it('creates comment record in database when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      await postComment(post.id, body, { token });
      const [commentInDB] = await CommentModel.findAll();
      expect(commentInDB).toBeTruthy();
      expect(commentInDB.userId).toBe(user.id);
      expect(commentInDB.postId).toBe(post.id);
    });
  });

  describe('Invalid Request', () => {
    const body = { content: 'My new comment content.' };
    it('returns 400 code when request is send with invalid content payload', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const body = { content: 'M' };
      const response = await postComment(post.id, body, { token });
      expect(response.status).toBe(400);
    });

    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      const response = await postComment(post.id, body);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send with invalid token', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      const response = await postComment(post.id, body, {
        token: 'Invalid_Token',
      });
      expect(response.status).toBe(401);
    });

    it('returns 404 code when request is send for post that does not exist', async () => {
      await addUser();
      const token = await getToken();
      const response = await postComment('does_not_exist', body, { token });
      expect(response.status).toBe(404);
    });
  });

  describe('Internationalization', () => {
    const body = { content: 'My new comment content.' };

    it.each`
      language | message
      ${'en'}  | ${en.comment_create_success}
      ${'pl'}  | ${pl.comment_create_success}
    `(
      'returns error message "$message" when request is valid and the language is set as $language',
      async ({ language, message }) => {
        const user = await addUser();
        const token = await getToken();
        const post = await addPost(user.id);
        const response = await postComment(post.id, body, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message                       | validationMessage
      ${'en'}  | ${en.data_validation_failure} | ${en.comment_content_size}
      ${'pl'}  | ${pl.data_validation_failure} | ${pl.comment_content_size}
    `(
      'returns "$message" message  when request is send with invalid content payload and the language is set as $language',
      async ({ language, message, validationMessage }) => {
        const user = await addUser();
        const token = await getToken();
        const post = await addPost(user.id);
        const body = { content: 'M' };
        const response = await postComment(post.id, body, { token, language });
        expect(response.body.message).toBe(message);
        expect(response.body.validationErrors.content).toBe(validationMessage);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns "$message" message  when request is send without token and the language is set as $language',
      async ({ language, message }) => {
        const user = await addUser();
        const post = await addPost(user.id);
        const response = await postComment(post.id, body, { language });
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
        const user = await addUser();
        const post = await addPost(user.id);
        const response = await postComment(post.id, body, {
          token: 'Invalid_Token',
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
        const response = await postComment('does_not_exist', body, {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
