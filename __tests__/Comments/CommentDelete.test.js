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

const secondUser = {
  accountName: 'user1',
  email: 'user1@mail.com',
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

const addComment = async (userId) => {
  const post = await PostModel.create({
    content: `Greate Post.`,
    userId: userId,
  });

  const comment = await CommentModel.create({
    postId: post.id,
    userId,
    content: 'Old comment',
  });
  return { comment, post };
};

const deleteComment = (commentId, options = {}) => {
  const agent = request(app).delete(`/api/v1.0/comments/${commentId}`);

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
      const { comment } = await addComment(user.id);
      const response = await deleteComment(comment.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns succes message when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const { comment } = await addComment(user.id);
      const response = await deleteComment(comment.id, { token });
      expect(response.body.message).toBe(en.comment_delete_success);
    });

    it('returns new comment content when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const { comment } = await addComment(user.id);
      const response = await deleteComment(comment.id, { token });
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

    it('removes comment record from database when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const { comment } = await addComment(user.id);
      await deleteComment(comment.id, { token });
      const [commentInDB] = await CommentModel.findAll();
      expect(commentInDB).toBeFalsy();
    });
  });

  describe('Invalid Request', () => {
    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      const { comment } = await addComment(user.id);
      const response = await deleteComment(comment.id);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send with invalid token', async () => {
      const user = await addUser();
      const { comment } = await addComment(user.id);
      const response = await deleteComment(comment.id, {
        token: 'Invalid_Token',
      });
      expect(response.status).toBe(401);
    });

    it('returns 403 code when update request is send for comment that belongs to other user', async () => {
      await addUser();
      const otherUser = await addUser(secondUser);
      const token = await getToken();
      const { comment } = await addComment(otherUser.id);
      const response = await deleteComment(comment.id, { token });
      expect(response.status).toBe(403);
    });

    it('returns 404 code when request is send for post that does not exist', async () => {
      await addUser();
      const token = await getToken();
      const response = await deleteComment('does_not_exist', { token });
      expect(response.status).toBe(404);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.comment_delete_success}
      ${'pl'}  | ${pl.comment_delete_success}
    `(
      'returns error message "$message" when request is valid and the language is set as $language',
      async ({ language, message }) => {
        const user = await addUser();
        const token = await getToken();
        const { comment } = await addComment(user.id);
        const response = await deleteComment(comment.id, {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
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
        const { comment } = await addComment(user.id);
        const response = await deleteComment(comment.id, { language });
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
        const { comment } = await addComment(user.id);
        const response = await deleteComment(comment.id, {
          token: 'Invalid_Token',
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_comment_delete}
      ${'pl'}  | ${pl.unauthorized_comment_delete}
    `(
      'returns "$message" message when delete request is send for comment that belongs to other user and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const otherUser = await addUser(secondUser);
        const token = await getToken();
        const { comment } = await addComment(otherUser.id);
        const response = await deleteComment(comment.id, {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.comment_not_found}
      ${'pl'}  | ${pl.comment_not_found}
    `(
      'returns "$message" message when request is send for comment that does not exist and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const response = await deleteComment('does_not_exist', {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
