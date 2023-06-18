const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');
const FileModel = require('../../src/model/FileModel');
const LikeModel = require('../../src/model/LikeModel');
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

const addFile = async (postId) => {
  await FileModel.create({
    filename: `test-file-for-post-${postId}`,
    fileType: 'image/png',
    postId: postId,
  });
};

const addPosts = async (publicCount, notPublicCount = 0) => {
  const postsIds = [];
  let i = 0;
  for (i; i < publicCount; i++) {
    const user = await UserModel.create({
      accountName: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      password: 'Password',
      isInactive: false,
    });

    const post = await PostModel.create({
      content: `Post content ${i + 1}`,
      userId: user.id,
      isPublic: true,
    });
    postsIds.push(post.id);
  }

  for (i; i < publicCount + notPublicCount; i++) {
    const user = await UserModel.create({
      accountName: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      password: 'Password',
      isInactive: false,
    });

    const post = await PostModel.create({
      content: `Post content ${i + 1}`,
      userId: user.id,
      isPublic: false,
    });
    postsIds.push(post.id);
  }
  return postsIds;
};

const addLikes = async (postId, count) => {
  const likes = [];
  for (let i = 0; i < count; i++) {
    const user = await UserModel.create({
      accountName: `user${i + 2}`,
      email: `user${i + 2}@mail.com`,
      password: 'Password',
      isInactive: false,
    });

    const like = await LikeModel.create({
      postId: postId,
      userId: user.id,
    });
    likes.push(like);
  }
  return likes;
};

const addComments = async (postId, count) => {
  const comments = [];
  for (let i = 0; i < count; i++) {
    const user = await UserModel.create({
      accountName: `user${i + 2}`,
      email: `user${i + 2}@mail.com`,
      password: 'Password',
      isInactive: false,
    });
    const comment = await CommentModel.create({
      postId: postId,
      userId: user.id,
      content: `Comment - ${user.id}`,
    });
    comments.push(comment);
  }
  return comments;
};

const getPosts = (options = {}) => {
  const agent = request(app).get('/api/v1.0/posts');

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent;
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('GET /api/v1.0/posts/', () => {
  describe('Valid request', () => {
    it('returns 200 code when there are no posts in database', async () => {
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      expect(response.status).toBe(200);
    });

    it('returns page object as response body', async () => {
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      expect(response.body).toEqual({
        data: [],
        page: 0,
        size: 10,
        totalPages: 0,
      });
    });

    it('returns 10 posts in page content when there are 11 posts in database', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      expect(response.body.data.length).toBe(10);
    });

    it('returns 2 as totalPages when there are 11 posts', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      expect(response.body.totalPages).toBe(2);
    });

    it('returns only id, content, createdAt, isPublic  and user object having id, accountName, username, email and image in data array for each post', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      const post = response.body.data[0];
      const postsKeys = Object.keys(post);
      const userKeys = Object.keys(post.user);
      expect(postsKeys).toEqual([
        'id',
        'content',
        'isPublic',
        'createdAt',
        'user',
        'likes',
        'comments',
      ]);
      expect(userKeys).toEqual(['id', 'accountName', 'username', 'avatar']);
    });

    it('returns file having filename, fileType if post has any', async () => {
      const postsIds = await addPosts(1);
      await addFile(postsIds[0]);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      const post = response.body.data[0];
      const fileKeys = Object.keys(post.file);
      expect(fileKeys).toEqual(['filename', 'fileType']);
    });

    it("returns array with 10 users id's when post has 10 likes", async () => {
      const postsIds = await addPosts(1);
      await addLikes(postsIds[0], 10);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      const post = response.body.data[0];
      expect(post.likes.length).toBe(10);
    });

    it('returns empty array when post has no likes', async () => {
      await addPosts(4);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      const post = response.body.data[0];
      expect(post.likes.length).toBe(0);
    });

    it('returns comments count equal 5 when post has 5 comments', async () => {
      const postsIds = await addPosts(1);
      await addComments(postsIds[0], 5);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      const post = response.body.data[0];
      expect(post.comments).toBe(5);
    });

    it('returns comments count equal 0 when post has no comments', async () => {
      await addPosts(4);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      const post = response.body.data[0];
      expect(post.comments).toBe(0);
    });

    it('returns second page posts and page indicator when page is set as 1 in request parameter', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token }).query({ page: 1 });
      expect(response.body.data[0].content).toBe('Post content 1');
      expect(response.body.page).toBe(1);
    });

    it('returns first page when page is set below zero as request parameter', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token }).query({ page: -5 });
      expect(response.body.page).toBe(0);
    });

    it('returns 5 posts and corresponding size indicator when size is set as 5 in request parameter', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token }).query({ size: 5 });
      expect(response.body.data.length).toBe(5);
      expect(response.body.size).toBe(5);
    });

    it('returns 10 posts and corresponding size indicator when size is set as 1000', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token }).query({ size: 1000 });
      expect(response.body.data.length).toBe(10);
      expect(response.body.size).toBe(10);
    });

    it('returns 10 posts and corresponding size indicator when size is set as 0', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token }).query({ size: 0 });
      expect(response.body.data.length).toBe(10);
      expect(response.body.size).toBe(10);
    });

    it('returns page as zero and size as 10 when non numeric query params provided for both', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token }).query({
        size: 'size',
        page: 'page',
      });
      expect(response.body.size).toBe(10);
      expect(response.body.page).toBe(0);
    });

    it('returns posts ordered from new to old', async () => {
      await addPosts(11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      const firstPost = response.body.data[0];
      const lastPost = response.body.data[9];
      expect(new Date(firstPost.createdAt).getTime()).toBeGreaterThan(
        new Date(lastPost.createdAt).getTime()
      );
    });

    it('returns 0 posts when all posts are older than 24 hours and query date has no value ', async () => {
      jest.useFakeTimers();
      await addPosts(11);
      await addUser();
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 10000);
      const token = await getToken();
      const response = await getPosts({ token }).query({ date: '' });
      expect(response.body.data.length).toBe(0);
      jest.useRealTimers();
    });

    it('returns 0 posts when all posts are older than 7 days and query date is set as week ', async () => {
      jest.useFakeTimers();
      await addPosts(11);
      await addUser();
      jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 10000);
      const token = await getToken();
      const response = await getPosts({ token }).query({ date: 'week' });
      expect(response.body.data.length).toBe(0);
      jest.useRealTimers();
    });

    it('returns 10 posts when posts are older than 7 days and query date is set as older ', async () => {
      jest.useFakeTimers();
      await addPosts(10);
      await addUser();
      jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 10000);
      const token = await getToken();
      const response = await getPosts({ token }).query({ date: 'older' });
      expect(response.body.data.length).toBe(10);
      jest.useRealTimers();
    });

    it('returns 0 posts when there are 11 posts in database with isPublic property set to false', async () => {
      await addPosts(0, 11);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      expect(response.body.data.length).toBe(0);
    });

    it('returns 5 posts when there are 11 posts in database and 6 of them have isPublic property set to false', async () => {
      await addPosts(5, 6);
      await addUser();
      const token = await getToken();
      const response = await getPosts({ token });
      expect(response.body.data.length).toBe(5);
    });
  });

  describe('Invalid request', () => {
    it('returns 401 code when request send without token', async () => {
      const response = await getPosts();
      expect(response.status).toBe(401);
    });

    it('returns error message when request send without token', async () => {
      const response = await getPosts();
      expect(response.body.message).toBe(en.authentication_failure);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns "$message" when request send without token and language is set as $language',
      async ({ language, message }) => {
        const response = await getPosts({ language });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
