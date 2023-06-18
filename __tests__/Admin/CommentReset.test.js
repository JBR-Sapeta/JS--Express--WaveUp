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

const resetedComment = 'This comment was moderated by admin.';

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

const addPostWithComment = async () => {
  const user = await UserModel.create({
    accountName: 'user66',
    email: 'user66@mail.com',
    password: 'P4assword',
  });

  const post = await PostModel.create({
    content: `Greate Post.`,
    userId: user.id,
  });

  const comment = await CommentModel.create({
    postId: post.id,
    userId: user.id,
    content: 'Old comment.',
  });
  return { comment, post, user };
};

const resetComment = (commentId, options = {}) => {
  const agent = request(app).put(`/api/v1.0/admin/comments/reset/${commentId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({});
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('PUT /api/v1.0/admin/comments/reset/:commentId', () => {
  describe('Valid Request', () => {
    it('returns 200 code when request is valid', async () => {
      await addAdmin();
      const token = await getToken();
      const { comment } = await addPostWithComment();
      const response = await resetComment(comment.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns succes message when request is valid', async () => {
      await addAdmin();
      const token = await getToken();
      const { comment } = await addPostWithComment();
      const response = await resetComment(comment.id, { token });
      expect(response.body.message).toBe(en.comment_reset_success);
    });

    it('updates comment record in database when request is valid', async () => {
      await addAdmin();
      const token = await getToken();
      const { comment } = await addPostWithComment();
      await resetComment(comment.id, { token });
      const [commentInDB] = await CommentModel.findAll();
      expect(commentInDB.content).not.toBe('Old comment');
      expect(commentInDB.content).toBe(resetedComment);
    });

    it('returns new comment content when request is valid', async () => {
      await addAdmin();
      const token = await getToken();
      const { comment } = await addPostWithComment();
      const response = await resetComment(comment.id, { token });
      const commentKeys = Object.keys(response.body.comment);
      expect(commentKeys).toEqual([
        'id',
        'userId',
        'postId',
        'content',
        'createdAt',
        'updatedAt',
      ]);
    });

  });


  describe('Invalid Request', () => {
    it('returns 401 code when request send without token', async () => {
      await addAdmin();
      const { comment } = await addPostWithComment();
      const response = await resetComment(comment.id);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request send with invalid token', async () => {
      await addAdmin();
      const { comment } = await addPostWithComment();
      const response = await resetComment(comment.id, {
        token: 'invalid_token',
      });
      expect(response.status).toBe(401);
    });

    it('returns 403 code when request send from user that is not an admin', async () => {
      await addUser();
      const token = await getToken(userAuth);
      const { comment } = await addPostWithComment();
      const response = await resetComment(comment.id, { token });
      expect(response.status).toBe(403);
    });

    it('returns 404 code when request send for comment that does not exist', async () => {
      await addAdmin();
      const token = await getToken();
      await addPostWithComment();
      const response = await resetComment('does_not_exist', { token });
      expect(response.status).toBe(404);
    });
  });

  describe('Internationalization', () => {

    it.each`
      language | message
      ${'en'}  | ${en.comment_reset_success}
      ${'pl'}  | ${pl.comment_reset_success}
    `(
      'returns succes message "$message" when request is valid and the language is set as "$language"',
      async ({ language, message }) => {
        await addAdmin();
        const token = await getToken();
        const { comment } = await addPostWithComment();
        const response = await resetComment(comment.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns error message "$message" when request send without token and the language is set as "$language"',
      async ({ language, message }) => {
        const { comment } = await addPostWithComment();
        const response = await resetComment(comment.id, { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_comment_reset}
      ${'pl'}  | ${pl.unauthorized_comment_reset}
    `(
      'returns error message "$message" when request send from user that is not an admin and the language is set as "$language"',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken(userAuth);
        const { comment } = await addPostWithComment();
        const response = await resetComment(comment.id, { token, language });

        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.comment_not_found}
      ${'pl'}  | ${pl.comment_not_found}
    `(
      'returns error message "$message" when request send for comment that does not exist and the language is set as "$language"',
      async ({ language, message }) => {
        await addAdmin();
        const token = await getToken();
        await addPostWithComment();
        const response = await resetComment('does_not_exist', {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
