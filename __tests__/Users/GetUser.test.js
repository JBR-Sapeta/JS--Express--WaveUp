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
  isInactive: false,
};

const inactivUser = {
  accountName: `user1`,
  email: `user1@mail.com`,
  isInactive: true,
};

const credentials = { email: 'user@mail.com', password: 'P4ssword' };

const getUser = (userId, options = {}) => {
  const agent = request(app).get(`/api/v1.0/users/${userId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent.send();
};

const addUser = async (isInactive = false) => {
  const hash = await bcrypt.hash('P4ssword', 12);

  let user = isInactive ? inactivUser : activUser;
  const userData = await UserModel.create({
    ...user,
    password: hash,
  });

  return userData;
};

const postAuthentication = async (credentials) => {
  const agent = request(app).post('/api/v1.0/users/auth');
  const response = await agent.send(credentials);
  const token = response.body.token;
  return token;
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('GET /api/v1.0/users/:userId', () => {
  describe('Valid request.', () => {
    it('returns 200 status code when an active user exist', async () => {
      const activeUser = await addUser();
      const token = await postAuthentication(credentials);
      const response = await getUser(activeUser.id, { token: token });
      expect(response.status);
    });

    it("returns only 'id', 'accountnName','uername', 'avatar', 'description', 'city' and 'hasBan when an active user exist ", async () => {
      const activeUser = await addUser();
      const token = await postAuthentication(credentials);
      const response = await getUser(activeUser.id, { token: token });
      expect(Object.keys(response.body)).toEqual([
        'id',
        'accountName',
        'username',
        'avatar',
        'birthday',
        'description',
        'city',
        'hasBan',
      ]);
    });
  });

  describe('Invalid request.', () => {
    it('returns 404 status code when an active user does not exist', async () => {
      await addUser();
      const token = await postAuthentication(credentials);
      const response = await getUser(0, { token: token });
      expect(response.status).toBe(404);
    });

    it('returns 404 status code when an inactive user exist', async () => {
      const inactiveUser = await addUser(true);
      await addUser();
      const token = await postAuthentication(credentials);
      const response = await getUser(inactiveUser.id, { token: token });
      expect(response.status).toBe(404);
    });

    it('returns 401 status code when an active user exist but request does not have token', async () => {
      const activeUser = await addUser();
      const response = await getUser(activeUser.id);
      expect(response.status).toBe(401);
    });

    it('returns proper error body when user not found', async () => {
      await addUser();
      const token = await postAuthentication(credentials);
      const nowInMillis = new Date().getTime();
      const response = await getUser(0, token);
      const error = response.body;
      expect(error.path).toBe('/api/v1.0/users/0');
      expect(error.timestamp).toBeGreaterThan(nowInMillis);
      expect(Object.keys(error)).toEqual([
        'status',
        'path',
        'timestamp',
        'message',
      ]);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.user_not_found}
      ${'pl'}  | ${pl.user_not_found}
    `(
      "returns '$message' when user does not exist and language is set to $language",
      async ({ language, message }) => {
        await addUser();
        const token = await postAuthentication(credentials);
        const response = await getUser(0, { language, token });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns '$message' when no token was provided and language is set to $language",
      async ({ language, message }) => {
        const activeUser = await addUser();
        const response = await getUser(activeUser.id, { language });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
