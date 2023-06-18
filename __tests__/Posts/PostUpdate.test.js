const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');
const FileModel = require('../../src/model/FileModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await FileModel.destroy({ truncate: true });
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
    content: `Old content post.`,
    userId: userId,
  });

  return post;
};

const addOtherPost = async () => {
  const user = await UserModel.create({
    accountName: `user111`,
    email: `user111@mail.com`,
    password: 'Password',
    isInactive: false,
  });

  const post = await PostModel.create({
    content: `Other post content.`,
    userId: user.id,
  });

  return post;
};

const putPost = (postId, body = null, options = {}) => {
  const agent = request(app).put(`/api/v1.0/posts/${postId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send(body);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('PUT /api/v1.0/posts/:postId', () => {
  describe('Valid request', () => {
    it('it returns 200 code when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const body = { content: 'My new post content.' };
      const response = await putPost(post.id, body, { token });
      expect(response.status).toBe(200);
    });

    it('it returns succes message when request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const body = { content: 'My new post content.' };
      const response = await putPost(post.id, body, { token });
      expect(response.body.message).toBe(en.post_update_success);
    });

    it('returns updated post conntent when delete request is valid', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const body = { content: 'My new post content.' };
      const response = await putPost(post.id, body, { token });
      const postKeys = Object.keys(response.body.content);
      expect(postKeys).toEqual([
        'id',
        'content',
        'isPublic',
        'createdAt',
        'updatedAt',
        'userId',
      ]);
    });

    it('it overwrites post content in database ', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const body = { content: 'My new post content.' };
      await putPost(post.id, body, { token });
      const postInDB = await PostModel.findOne({ where: { id: post.id } });
      expect(postInDB.content).toBe(body.content);
    });
  });

  describe('Inalid request', () => {
    it('returns 400 code when new content is too short', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const body = { content: 'My new' };
      const response = await putPost(post.id, body, { token });
      expect(response.status).toBe(400);
    });

    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      const body = { content: 'My new post content.' };
      const response = await putPost(post.id, body);
      expect(response.status).toBe(401);
    });

    it("returns 403 code when authenticated user tries to update another user's post", async () => {
      await addUser();
      const otherUsersPost = await addOtherPost();
      const token = await getToken();
      const body = { content: 'My new post content.' };
      const response = await putPost(otherUsersPost.id, body, { token });
      expect(response.status).toBe(403);
    });

    it('returns 404 code when the post with given id does not exist', async () => {
      await addUser();
      const token = await getToken();
      const body = { content: 'My new post content.' };
      const response = await putPost('does_not_exist', body, { token });
      expect(response.status).toBe(404);
    });

    it('returns coresponding error message when new content is too short', async () => {
      const user = await addUser();
      const token = await getToken();
      const post = await addPost(user.id);
      const body = { content: 'My new' };
      const response = await putPost(post.id, body, { token });
      expect(response.body.message).toBe(en.data_validation_failure);
      expect(response.body.validationErrors.content).toBe(en.post_content_size);
    });

    it('returns coresponding error message when request is send without token', async () => {
      const user = await addUser();
      const post = await addPost(user.id);
      const body = { content: 'My new post content.' };
      const response = await putPost(post.id, body);
      expect(response.body.message).toBe(en.authentication_failure);
    });

    it("returns coresponding error message when authenticated user tries to update another user's post", async () => {
      await addUser();
      const otherUsersPost = await addOtherPost();
      const token = await getToken();
      const body = { content: 'My new post content.' };
      const response = await putPost(otherUsersPost.id, body, { token });
      expect(response.body.message).toBe(en.unauthorized_post_update);
    });

    it('returns coresponding error message when the post with given id does not exist', async () => {
      await addUser();
      const token = await getToken();
      const body = { content: 'My new post content.' };
      const response = await putPost('does_not_exist', body, { token });
      expect(response.body.message).toBe(en.post_not_found);
    });
  });

  describe('internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.post_update_success}
      ${'pl'}  | ${pl.post_update_success}
    `(
      'returns "$message" message  when request is valid and the language is set as $language',
      async ({ language, message }) => {
        const user = await addUser();
        const token = await getToken();
        const post = await addPost(user.id);
        const body = { content: 'My new post content.' };
        const response = await putPost(post.id, body, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message                      | validationMessage
      ${'en'}  | ${en.data_validation_failure} | ${en.post_content_size}
      ${'pl'}  | ${pl.data_validation_failure} | ${pl.post_content_size}
    `(
      'returns error message "$message" when new content size ist too short and the language is set as $language',
      async ({ language, message, validationMessage }) => {
        const user = await addUser();
        const token = await getToken();
        const post = await addPost(user.id);
        const body = { content: 'My new' };
        const response = await putPost(post.id, body, { token, language });
        expect(response.body.validationErrors.content).toBe(validationMessage);
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
        const body = { content: 'My new post content.' };
        const response = await putPost('id', body, { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_post_update}
      ${'pl'}  | ${pl.unauthorized_post_update}
    `(
      'returns error message "$message" when authenticated user tries to update another users post and the language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const otherUsersPost = await addOtherPost();
        const token = await getToken();
        const body = { content: 'My new post content.' };
        const response = await putPost(otherUsersPost.id, body, {
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
        const body = { content: 'My new post content.' };
        const response = await putPost('does_not_exist', body, {
          token,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
