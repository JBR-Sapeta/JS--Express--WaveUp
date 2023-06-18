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
  username: `JohnDoe`,
  email: `user@mail.com`,
  password: 'P4ssword',
  isInactive: false,
};

const inactivUser = {
  accountName: `userI`,
  username: `JohnDoeI`,
  email: `user1@mail.com`,
  password: 'P4ssword',
  isInactive: true,
};

const credentials = { email: 'user@mail.com', password: 'P4ssword' };

const addUser = async (user = { ...activUser }) => {
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
  const hash = await bcrypt.hash('P4ssword', 12);

  for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
    await UserModel.create({
      accountName: `user${i + 1}`,
      username: `JohnDoe${i * 111}`,
      email: `user${i + 1}@mail.com`,
      isInactive: i >= activeUserCount,
      password: hash,
    });
  }
};

const getToken = async (auth = credentials) => {
  const agent = request(app).post('/api/v1.0/users/auth');
  const response = await agent.send(auth);
  const token = response.body.token;
  return token;
};

const getUserByName = (options = {}) => {
  const agent = request(app).get(`/api/v1.0/users/name/`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent;
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('GET /api/v1.0/users/name', () => {
  describe('Valid request.', () => {
    it('returns 200 status code when an active user exist with given nusername', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(10);
      const response = await getUserByName({ token: token }).query({
        name: 'user1',
      });
      expect(response.status).toBe(200);
    });

    it('returns page object as response body', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(1);
      const response = await getUserByName({ token: token }).query({
        name: 'user111',
      });
      expect(response.body).toEqual({
        data: [],
        page: 0,
        size: 10,
        totalPages: 0,
      });
    });

    it("returns object with 'id', 'accountName', 'username', 'avatar', 'birthday'and 'city' properties for each user in data array", async () => {
      await addUser();
      const token = await getToken();
      await addUsers(11);
      const response = await getUserByName({ token: token }).query({
        name: 'user',
      });
      const user = response.body.data[0];
      const userKeys = Object.keys(user);
      expect(userKeys).toEqual([
        'id',
        'accountName',
        'username',
        'avatar',
        'birthday',
        'city',
      ]);
    });

    it('returns 10 users in page content when there are 11 with matching accountName', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(10);
      const response = await getUserByName({ token: token }).query({
        name: 'user',
      });
      expect(response.body.data.length).toBe(10);
    });

    it('returns 10 users in page content when there are 11 with matching username', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(10);
      const response = await getUserByName({ token: token }).query({
        name: 'JohnDoe',
      });
      expect(response.body.data.length).toBe(10);
    });

    it('returns 5 users in data array when there are 5 active and 5 inactive users with matching accountName', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(4, 5);
      const response = await getUserByName({ token: token }).query({
        name: 'user',
      });
      expect(response.body.data.length).toBe(5);
    });

    it('returns 5 users in data array when there are 5 active and 5 inactive users with matching username', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(4, 5);
      const response = await getUserByName({ token: token }).query({
        name: 'JohnDoe',
      });
      expect(response.body.data.length).toBe(5);
    });

    it('returns 2 as totalPages when there are 11 users with matching username', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(10);
      const response = await getUserByName({ token: token }).query({
        name: 'user',
      });
      expect(response.body.totalPages).toBe(2);
    });

    it('returns 3 pages as totalPages when there are 25 active and 10 inactive users with matching accountName', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(25, 10);
      const response = await getUserByName({ token: token }).query({
        name: 'JohnDoe',
      });
      expect(response.body.totalPages).toBe(3);
    });

    it('returns 5 users and corresponding size indicator when size is set as 5 in request parameter', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(25);
      const response = await getUserByName({ token: token })
        .query({
          name: 'JohnDoe',
        })
        .query({ size: 5 });
      expect(response.body.data.length).toBe(5);
      expect(response.body.size).toBe(5);
    });

    it('returns second page and page indicator when page is set as 1 in request parameter', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(15);
      const response = await getUserByName({ token: token })
        .query({
          name: 'JohnDoe',
        })
        .query({ page: 1 });
      expect(response.body.data[0].content).not.toBe('JohnDoe');
      expect(response.body.page).toBe(1);
    });

    it('returns 5 users and third page when size is set as 5 and page is set as 2', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(15);
      const response = await getUserByName({ token: token })
        .query({
          name: 'JohnDoe',
        })
        .query({ page: 2 })
        .query({ size: 5 });
      expect(response.body.data.length).toBe(5);
      expect(response.body.size).toBe(5);
      expect(response.body.page).toBe(2);
    });

    it('returns first page and 10 users when page ands size are set below zero as request parameter', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(15);
      const response = await getUserByName({ token: token })
        .query({
          name: 'JohnDoe',
        })
        .query({ page: -5 })
        .query({ size: -5 });
      expect(response.body.page).toBe(0);
      expect(response.body.size).toBe(10);
    });

    it('returns empty data array when there is no user with given username or accountName', async () => {
      await addUser();
      const token = await getToken();
      await addUsers(15);
      const response = await getUserByName({ token: token }).query({
        name: 'JaneDoe',
      });
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('Invalid request.', () => {
    it('returns 401 status code when request send without token', async () => {
      await addUser();
      const response = await getUserByName().query({ name: 'user' });
      expect(response.status).toBe(401);
    });

    it('returns 401 status code when request send with invalid token', async () => {
      await addUser();
      const response = await getUserByName({ token: 'invalid_token' }).query({
        name: 'user',
      });
      expect(response.status).toBe(401);
    });

    it('returns 404 status code when request is send without name query', async () => {
      await addUser();
      const token = await getToken();
      const response = await getUserByName({ token });
      expect(response.status).toBe(404);
    });

    it('returns 404 status code when request is send with string containing only spaces as name query', async () => {
      await addUser();
      const token = await getToken();
      const response = await getUserByName({ token }).query({
        name: '  ',
      });
      expect(response.status).toBe(404);
    });
  });
  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns  errorr message '$message' when request send without token and language is set to $language",
      async ({ language, message }) => {
        await addUser();
        const response = await getUserByName({ language }).query({
          name: 'user',
        });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.user_not_found}
      ${'pl'}  | ${pl.user_not_found}
    `(
      "returns error message '$message' when invalid string was provided as query and language is set to $language",
      async ({ language, message }) => {
        await addUser();
        const token = await getToken();
        const response = await getUserByName({ token, language }).query({
          name: '  ',
        });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
