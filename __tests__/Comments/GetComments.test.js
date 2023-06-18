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

const addComments = async (userId, count = 1) => {
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

const getComments = (postId, options = {}) => {
  const agent = request(app).get(`/api/v1.0/comments/${postId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/comments/:commentId', () => {
  describe('Valid Request', () => {
    it('returns 200 code when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 2);
      const response = await getComments(post.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns page object as response body', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 0);
      const response = await getComments(post.id, { token });
      expect(response.body).toEqual({
        data: [],
        page: 0,
        size: 10,
        totalPages: 0,
      });
    });

    it('returns only id, content, createdAt and user object having id, account name and avatar in content array for each comment', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 2);
      const response = await getComments(post.id, { token });
      const comment = response.body.data[0];
      const commentKeys = Object.keys(comment);
      const userKeys = Object.keys(comment.user);
      expect(commentKeys).toEqual(['id', 'content', 'createdAt', 'user']);
      expect(userKeys).toEqual(['id','username', 'avatar']);
    });

    it('returns comments ordered from old to new ', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token });
      const firstComments = response.body.data[0];
      const lastComments = response.body.data[9];
      expect(new Date(firstComments.createdAt).getTime()).toBeLessThan(
        new Date(lastComments.createdAt).getTime()
      );
    });

    it('returns 10 comments in page data when there are 11 comments in database', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token });
      expect(response.body.data.length).toBe(10);
    });

    it('returns 2 as totalPages when there are 11 posts in database', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token });
      expect(response.body.totalPages).toBe(2);
    });

    it('returns second page comments and page indicator when page is set as 1 in request parameter', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token }).query({ page: 1 });
      expect(response.body.data[0].content).toBe('My short comment 11!');
      expect(response.body.page).toBe(1);
    });

    it('returns first comments page when page is set below zero as request parameter', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token }).query({
        page: -5,
      });
      expect(response.body.page).toBe(0);
    });

    it('returns 5 posts and corresponding size indicator when size is set as 5 in request parameter', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token }).query({ size: 5 });
      expect(response.body.data.length).toBe(5);
      expect(response.body.size).toBe(5);
    });

    it('returns 10 posts and corresponding size indicator when size is set as 1000', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token }).query({
        size: 1000,
      });
      expect(response.body.data.length).toBe(10);
      expect(response.body.size).toBe(10);
    });

    it('returns 10 posts and corresponding size indicator when size is set as 0', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token }).query({ size: 0 });
      expect(response.body.data.length).toBe(10);
      expect(response.body.size).toBe(10);
    });

    it('returns page as zero and size as 10 when non numeric query params provided for both', async () => {
      const user = await addUser();
      const token = await getToken();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token }).query({
        size: 'size',
        page: 'page',
      });
      expect(response.body.size).toBe(10);
      expect(response.body.page).toBe(0);
    });
  });

  describe('Invalid request', () => {
    it('returns 401 code when request send without token', async () => {
      const user = await addUser();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request send with invalid token', async () => {
      const user = await addUser();
      const { post } = await addComments(user.id, 11);
      const response = await getComments(post.id, { token: 'Invalid_Token' });
      expect(response.status).toBe(401);
    });

    it('returns 404 code when request is send for post that does not exist', async () => {
      await addUser();
      const token = await getToken();
      const response = await getComments('post_does_not_exist', { token });
      expect(response.status).toBe(404);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns "$message" message  when request is send without token and the language is set as $language',
      async ({ language, message }) => {
        const user = await addUser();
        const { post } = await addComments(user.id, 2);
        const response = await getComments(post.id, { language });
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
        const { post } = await addComments(user.id, 2);
        const response = await getComments(post.id, {
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
        const response = await getComments('post_does_not_exist', {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
