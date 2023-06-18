const bcrypt = require('bcrypt');
const path = require('path');
const request = require('supertest');

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

const uploadFile = async (fileName = 'test-png.png', options = {}) => {
  const agent = request(app).post('/api/v1.0/files/posts');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }

  return agent.attach(
    'file',
    path.join('.', '__tests__', 'Resources', fileName)
  );
};

const createPost = async (body = null, options = {}) => {
  const agent = request(app).post('/api/v1.0/posts');

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send(body);
};
//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/files/posts', () => {
  describe('Valid request', () => {
    it('returns 200 code when request is valid', async () => {
      await addUser();
      const token = await getToken();
      const body = { content: 'Post content' };
      const response = await createPost(body, { token });
      expect(response.status).toBe(200);
    });

    it('returns 200 ok even the file does not exist', async () => {
      await addUser();
      const token = await getToken();
      const body = { content: 'Post content', file: 2000 };
      const response = await createPost(body, { token });
      expect(response.status).toBe(200);
    });

    it('returns post conntent when  request is valid', async () => {
      await addUser();
      const token = await getToken();
      const body = { content: 'Post content' };
      const response = await createPost(body, { token });
      const postKeys = Object.keys(response.body.content);
      expect(postKeys).toEqual([
        'isPublic',
        'id',
        'content',
        'userId',
        'updatedAt',
        'createdAt',
      ]);
    });

    it('saves the post to database when authorized user sends valid request', async () => {
      await addUser();
      const token = await getToken();
      const body = { content: 'Post content' };
      await createPost(body, { token });
      const posts = await PostModel.findAll();
      const post = posts[0];
      expect(post.content).toBe(body.content);
      expect(posts.length).toBe(1);
    });
    it('stores post owner id in database', async () => {
      const user = await addUser();
      const token = await getToken();
      const body = { content: 'Post content' };
      await createPost(body, { token });
      const posts = await PostModel.findAll();
      const post = posts[0];
      expect(post.userId).toBe(user.id);
    });

    it('associates post with file in database', async () => {
      await addUser();
      const token = await getToken();
      const repons = await uploadFile('test-png.png', { token });
      const fileId = repons.body.id;
      const body = { content: 'Post content', file: fileId };
      await createPost(body, { token });
      const posts = await PostModel.findAll();
      const post = posts[0];
      const fileInDb = await FileModel.findOne({
        where: { id: fileId },
      });
      expect(fileInDb.postId).toBe(post.id);
    });
  });

  describe('Invalid request', () => {
    it('returns 401 when request send without token', async () => {
      const body = { content: 'Post content' };
      const response = await createPost(body);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request send with invalidtoken', async () => {
      await addUser();
      const body = { content: 'Post content' };
      const response = await createPost(body, { token: 'invalid token' });
      expect(response.status).toBe(401);
    });

    it('returns error message when request send without token', async () => {
      const body = { content: 'Post content' };
      const response = await createPost(body);
      expect(response.body.message).toBe(en.unauthorized_post_submit);
    });

    it('returns validation error body when too short post content added by authorized user', async () => {
      await addUser();
      const token = await getToken();
      const body = { content: 'Post' };
      const nowInMillis = Date.now();
      const response = await createPost(body, { token });
      const error = response.body;

      expect(error.timestamp).toBeGreaterThan(nowInMillis);
      expect(error.path).toBe('/api/v1.0/posts');
      expect(Object.keys(error)).toEqual([
        'status',
        'path',
        'timestamp',
        'message',
        'validationErrors',
      ]);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'pl'}  | ${pl.post_create_success}
      ${'en'}  | ${en.post_create_success}
    `(
      'returns $message to success submit when language is $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const body = { content: 'Post content' };
        const response = await createPost(body, { token, language });
        expect(response.body.message).toBe(message);
      }
    );
    it.each`
      language | message
      ${'pl'}  | ${pl.data_validation_failure}
      ${'en'}  | ${en.data_validation_failure}
    `(
      'returns error message "$message" when post content is less than 10 characters and language is set as $language',
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const body = { content: 'Post' };
        const response = await createPost(body, { token, language });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe(message);
      }
    );
    it.each`
      language | message
      ${'pl'}  | ${pl.unauthorized_post_submit}
      ${'en'}  | ${en.unauthorized_post_submit}
    `(
      'returns error body with "$message" when unauthorized request sent with language $language',
      async ({ language, message }) => {
        const nowInMillis = Date.now();
        const body = { content: 'Post content' };
        const response = await createPost(body, { language });
        const error = response.body;
        expect(error.path).toBe('/api/v1.0/posts');
        expect(error.message).toBe(message);
        expect(error.timestamp).toBeGreaterThan(nowInMillis);
      }
    );
    it.each`
      language | content             | contentForDescription | message
      ${'pl'}  | ${null}             | ${'null'}             | ${pl.post_content_size}
      ${'pl'}  | ${'a'.repeat(9)}    | ${'short'}            | ${pl.post_content_size}
      ${'pl'}  | ${'a'.repeat(1001)} | ${'very long'}        | ${pl.post_content_size}
      ${'en'}  | ${null}             | ${'null'}             | ${en.post_content_size}
      ${'en'}  | ${'a'.repeat(9)}    | ${'short'}            | ${en.post_content_size}
      ${'en'}  | ${'a'.repeat(1001)} | ${'very long '}       | ${en.post_content_size}
    `(
      'returns "$message" when the content is $contentForDescription and the language is set as $language',
      async ({ language, content, message }) => {
        await addUser();
        const token = await getToken();
        const body = { content: content };
        const response = await createPost(body, { token, language });
        expect(response.body.validationErrors.content).toBe(message);
      }
    );
  });
});
