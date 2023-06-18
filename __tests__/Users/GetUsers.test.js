const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await UserModel.destroy({ truncate: { cascade: true } });
});

//---------------------------- TEST HELPERS ----------------------------\\
const activUser = {
  accountName: `user`,
  email: `user@mail.com`,
  password: 'P4ssword',
  isInactive: false,
};

const credentials = { email: 'user@mail.com', password: 'P4ssword' };

const addUser = async (user = { ...activUser }) => {
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const getToken = async (auth = credentials) => {
  const agent = request(app).post('/api/v1.0/users/auth');
  const response = await agent.send(auth);
  const token = response.body.token;
  return token;
};

const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
  const hash = await bcrypt.hash('P4ssword', 12);

  for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
    await UserModel.create({
      accountName: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      isInactive: i >= activeUserCount,
      password: hash,
    });
  }
};

const getUsers = (options = {}) => {
  const agent = request(app).get('/api/v1.0/users');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }

  if (options.query) {
    agent.query({ ...options.query });
  }

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent.send();
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/users/', () => {
  describe('Valid request.', () => {
    it('returns 200 status code when request is valid and there are no user in database', async () => {
      await addUser();
      const token = await getToken();
      const response = await getUsers({ token });
      expect(response.status).toBe(200);
    });

    it('returns object in response body when request is valid', async () => {
      await addUser();
      const token = await getToken();
      const response = await getUsers({ token });
      expect(response.body).toEqual({
        data: [],
        page: 0,
        size: 10,
        totalPages: 0,
      });
    });

    it('returns only id, accountName, username, avatar, birthday and city in data array for each user', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(10);
      const response = await getUsers({ token });
      const user = response.body.data[0];
      expect(Object.keys(user)).toEqual([
        'id',
        'accountName',
        'username',
        'avatar',
        'birthday',
        "city",
      ]);
    });

    it('returns 10 users in data array when page size is not defined', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(20);
      const response = await getUsers({ token });
      expect(response.body.data.length).toBe(10);
    });

    it('returns 5 users in data array when there are 5 active and 5 inactive users in databse', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(5, 5);
      const response = await getUsers({ token });
      expect(response.body.data.length).toBe(5);
    });

    it('returns 3 pages as totalpages when there are 25 active and 10 inactive users in databse', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(25, 10);
      const response = await getUsers({ token });
      expect(response.body.totalPages).toBe(3);
    });

    it('returns second batch of users and page indicator when page is set as 1 in request parameter', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(20);
      const response = await getUsers({ query: { page: 1 }, token });
      expect(response.body.data[0].accountName).toBe('user11');
      expect(response.body.page).toBe(1);
    });

    it('returns 5 users and corresponding size indicator when size is set as 5 in request parameter', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(15);
      const response = await getUsers({ query: { size: 5 }, token });
      expect(response.body.data.length).toBe(5);
      expect(response.body.size).toBe(5);
    });

    it('returns user page without logged in user when request has valid credentials', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(10);
      const response = await getUsers({ token });
      expect(response.body.totalPages).toBe(1);
    });

    
  });

  describe('Invalid request.', () => {
    it('returns 401 code when no token was provided', async () => {
      await addUser();
      await addUsers(11);
      const response = await getUsers();
      expect(response.status).toBe(401);
    });

    it('returns page as zero and size as 10 when non numeric query params are provided', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(20);
      const response = await getUsers({
        query: { size: 'size', page: 'page' },
        token,
      });
      expect(response.body.data.length).toBe(10);
      expect(response.body.size).toBe(10);
    });

    it('returns first page when page is set below 0 in request parameter', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(20);
      const response = await getUsers({ query: { page: -1 }, token });
      expect(response.body.page).toBe(0);
    });

    it('returns 10 users and corresponding size indicator when size is set as 0', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(20);
      const response = await getUsers({ query: { size: 0 }, token });
      expect(response.body.data.length).toBe(10);
      expect(response.body.size).toBe(10);
    });

    it('returns 10 users and corresponding size indicator when size is set as 101  in request parameter', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(20);
      const response = await getUsers({ query: { size: 101 }, token });
      expect(response.body.data.length).toBe(10);
      expect(response.body.size).toBe(10);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns '$message' when no token was provided and language is set to $language",
      async ({ language, message }) => {
        const response = await getUsers({ language });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
